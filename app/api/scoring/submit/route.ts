import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

const SAFE_KEY = /^[^.$]+$/;

type ScoreValue = 'gold' | 'silver' | 'bronze' | number | null;

interface Submission {
  partyId: string;
  eventId: string;
  danceId: string;
  judgeId: string;
  roundId?: string;
  scores: Record<string, ScoreValue>;
}

interface StoredEvent {
  id?: string;
  activeRoundId?: string;
  teams?: Array<{ id: string }>;
  dances?: Array<{ id: string }>;
  judges?: Array<{ id: string }>;
  rounds?: Array<{
    id: string;
    type: 'preliminary' | 'final';
    danceIds: string[];
    judgeIds: string[];
    eligibleTeamIds: string[];
    competitorCount: number;
    selectionCount: number;
    status: 'setup' | 'active' | 'awaiting_advance' | 'completed';
  }>;
  scores?: Record<string, Record<string, Record<string, ScoreValue>>>;
  finalized?: Record<string, Record<string, boolean>>;
  roundScores?: Record<string, Record<string, Record<string, Record<string, ScoreValue>>>>;
  roundFinalized?: Record<string, Record<string, Record<string, boolean>>>;
}

function isValidSubmission(value: unknown): value is Submission {
  if (!value || typeof value !== 'object') return false;
  const body = value as Partial<Submission>;
  if (
    !body.partyId || !body.eventId || !body.danceId || !body.judgeId ||
    !SAFE_KEY.test(body.eventId) || !SAFE_KEY.test(body.danceId) || !SAFE_KEY.test(body.judgeId) ||
    (body.roundId !== undefined && (!body.roundId || !SAFE_KEY.test(body.roundId))) ||
    !body.scores || typeof body.scores !== 'object' || Array.isArray(body.scores)
  ) return false;

  return Object.entries(body.scores).every(([teamId, score]) =>
    SAFE_KEY.test(teamId) &&
    (score === null || score === 'gold' || score === 'silver' || score === 'bronze' ||
      (typeof score === 'number' && Number.isFinite(score)))
  );
}

function partyQuery(id: string): Record<string, unknown> {
  return ObjectId.isValid(id)
    ? { $or: [{ _id: new ObjectId(id) }, { _id: id }] }
    : { _id: id };
}

/**
 * Atomically writes only one judge's marks. Unlike replacing the full events
 * array, simultaneous submissions touch separate MongoDB paths and cannot
 * overwrite each other.
 */
export async function POST(request: Request) {
  try {
    const body: unknown = await request.json();
    if (!isValidSubmission(body)) {
      return NextResponse.json({ error: 'Invalid scoring submission' }, { status: 400 });
    }

    const client = await clientPromise;
    const parties = client.db('screen-handler').collection('parties');
    const existingParty = await parties.findOne(partyQuery(body.partyId), { projection: { events: 1 } });
    const existingEvent = (existingParty?.events as StoredEvent[] | undefined)
      ?.find(item => item.id === body.eventId);
    if (!existingEvent) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (body.roundId) {
      const round = existingEvent.rounds?.find(item => item.id === body.roundId);
      const allowedDanceIds = round?.danceIds.length
        ? round.danceIds
        : existingEvent.dances?.map(item => item.id) || [];
      const allowedJudgeIds = round?.judgeIds.length
        ? round.judgeIds
        : existingEvent.judges?.map(item => item.id) || [];
      const isActiveRound = round && (existingEvent.activeRoundId === round.id || round.status === 'active');
      if (!round || !isActiveRound ||
          !allowedDanceIds.includes(body.danceId) || !allowedJudgeIds.includes(body.judgeId)) {
        return NextResponse.json({ error: 'Judge is not assigned to this active round and dance' }, { status: 403 });
      }
      const configuredEligibleIds = round.eligibleTeamIds.length
        ? round.eligibleTeamIds
        : existingEvent.teams?.map(item => item.id) || [];
      const eligibleIds = configuredEligibleIds.slice(
        0,
        round.competitorCount > 0 ? round.competitorCount : configuredEligibleIds.length
      );
      if (Object.keys(body.scores).some(teamId => !eligibleIds.includes(teamId))) {
        return NextResponse.json({ error: 'Submission contains an ineligible couple' }, { status: 400 });
      }
      if (round.type === 'preliminary') {
        const selections = Object.values(body.scores).filter(mark => mark === 1).length;
        const invalidMark = Object.values(body.scores).some(mark => mark !== 1 && mark !== null);
        if (invalidMark || selections !== round.selectionCount) {
          return NextResponse.json({ error: `Exactly ${round.selectionCount} couples must be selected` }, { status: 400 });
        }
      } else {
        const ranks = eligibleIds.map(teamId => body.scores[teamId]);
        const validRanks = ranks.every(mark => typeof mark === 'number' && Number.isInteger(mark) && mark >= 1 && mark <= eligibleIds.length);
        const uniqueRanks = new Set(ranks).size === eligibleIds.length;
        if (!validRanks || !uniqueRanks) {
          return NextResponse.json({ error: 'Every eligible couple must receive one unique rank' }, { status: 400 });
        }
      }
    }

    const scorePath = body.roundId
      ? `events.$[event].roundScores.${body.roundId}.${body.danceId}.${body.judgeId}`
      : `events.$[event].scores.${body.danceId}.${body.judgeId}`;
    const finalizedPath = body.roundId
      ? `events.$[event].roundFinalized.${body.roundId}.${body.danceId}.${body.judgeId}`
      : `events.$[event].finalized.${body.danceId}.${body.judgeId}`;

    const result = await parties.updateOne(
      partyQuery(body.partyId),
      {
        $set: {
          [scorePath]: body.scores,
          [finalizedPath]: true,
        },
      },
      { arrayFilters: [{ 'event.id': body.eventId }] },
    );

    if (result.matchedCount !== 1) {
      return NextResponse.json({ error: 'Party not found' }, { status: 404 });
    }

    const party = await parties.findOne(partyQuery(body.partyId), { projection: { events: 1 } });
    const event = (party?.events as StoredEvent[] | undefined)
      ?.find((item) => item.id === body.eventId);
    const storedScores = body.roundId
      ? event?.roundScores?.[body.roundId]?.[body.danceId]?.[body.judgeId]
      : event?.scores?.[body.danceId]?.[body.judgeId];
    const storedFinalized = body.roundId
      ? event?.roundFinalized?.[body.roundId]?.[body.danceId]?.[body.judgeId]
      : event?.finalized?.[body.danceId]?.[body.judgeId];
    const verified = storedFinalized === true && JSON.stringify(storedScores) === JSON.stringify(body.scores);

    if (!verified) {
      return NextResponse.json({ error: 'Submission could not be verified' }, { status: 409 });
    }

    return NextResponse.json({ success: true, verified: true });
  } catch (error) {
    console.error('Scoring submission failed:', error);
    return NextResponse.json({ error: 'Failed to save scoring submission' }, { status: 500 });
  }
}
