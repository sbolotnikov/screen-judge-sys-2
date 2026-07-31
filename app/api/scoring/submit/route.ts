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
  scores: Record<string, ScoreValue>;
}

interface StoredEvent {
  id?: string;
  scores?: Record<string, Record<string, Record<string, ScoreValue>>>;
  finalized?: Record<string, Record<string, boolean>>;
}

function isValidSubmission(value: unknown): value is Submission {
  if (!value || typeof value !== 'object') return false;
  const body = value as Partial<Submission>;
  if (
    !body.partyId || !body.eventId || !body.danceId || !body.judgeId ||
    !SAFE_KEY.test(body.eventId) || !SAFE_KEY.test(body.danceId) || !SAFE_KEY.test(body.judgeId) ||
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
    const scorePath = `events.$[event].scores.${body.danceId}.${body.judgeId}`;
    const finalizedPath = `events.$[event].finalized.${body.danceId}.${body.judgeId}`;

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
    const storedScores = event?.scores?.[body.danceId]?.[body.judgeId];
    const storedFinalized = event?.finalized?.[body.danceId]?.[body.judgeId];
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
