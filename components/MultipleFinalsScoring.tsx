'use client';

import { useEffect, useMemo, useState } from 'react';
import { Dance, EventData, MultipleFinal, Team } from '@/types/types';
import usePartySettings from '@/hooks/usePartySettings';

type Ballots = Record<string, Record<string, Record<string, number | null>>>;

const assignOnlyRemainingRank = (ballots: Ballots, finals: MultipleFinal[]): Ballots => {
  const next = structuredClone(ballots);
  finals.forEach(final => final.danceIds.forEach(danceId => {
    const ballot = next[final.id]?.[danceId];
    if (!ballot) return;
    const unassignedTeamIds = final.teamIds.filter(teamId => typeof ballot[teamId] !== 'number');
    const usedRanks = new Set(Object.values(ballot).filter((rank): rank is number => typeof rank === 'number'));
    const unusedRanks = final.teamIds.map((_, index) => index + 1).filter(rank => !usedRanks.has(rank));
    if (unassignedTeamIds.length === 1 && unusedRanks.length === 1) {
      ballot[unassignedTeamIds[0]] = unusedRanks[0];
    }
  }));
  return next;
};

export default function MultipleFinalsScoring({ partyId, eventId, judgeId, teams, dances, finals, scores, finalized }: {
  partyId: string;
  eventId: string;
  judgeId: string;
  teams: Team[];
  dances: Dance[];
  finals: MultipleFinal[];
  scores: NonNullable<EventData['multipleFinalScores']>;
  finalized: NonNullable<EventData['multipleFinalFinalized']>;
}) {
  const { refreshPartyData } = usePartySettings();
  const assignedFinals = useMemo(() => finals.filter(final => final.judgeIds.includes(judgeId)), [finals, judgeId]);
  const assignedDances = useMemo(() => dances.filter(dance =>
    assignedFinals.some(final => final.danceIds.includes(dance.id))
  ), [assignedFinals, dances]);
  const [ballots, setBallots] = useState<Ballots>({});
  const [activeDanceId, setActiveDanceId] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    setBallots(current => {
      const next: Ballots = {};
      assignedFinals.forEach(final => {
        next[final.id] = {};
        final.danceIds.forEach(danceId => {
          next[final.id][danceId] = {};
          final.teamIds.forEach(teamId => {
            const storedMark = scores[final.id]?.[danceId]?.[judgeId]?.[teamId];
            const localMark = current[final.id]?.[danceId]?.[teamId];
            next[final.id][danceId][teamId] = typeof storedMark === 'number'
              ? storedMark
              : typeof localMark === 'number' ? localMark : null;
          });
        });
      });
      return assignOnlyRemainingRank(next, assignedFinals);
    });
  }, [assignedFinals, judgeId, scores]);

  useEffect(() => {
    setActiveDanceId(current => {
      const currentHasPendingBallots = assignedFinals.some(final =>
        final.danceIds.includes(current) && !finalized[final.id]?.[current]?.[judgeId]
      );
      if (current && currentHasPendingBallots) return current;
      return assignedDances.find(dance => assignedFinals.some(final =>
        final.danceIds.includes(dance.id) && !finalized[final.id]?.[dance.id]?.[judgeId]
      ))?.id || assignedDances[0]?.id || '';
    });
  }, [assignedDances, assignedFinals, finalized, judgeId]);

  const setRank = (finalId: string, danceId: string, teamId: string, value: string) => {
    setBallots(current => {
      const next = structuredClone(current);
      next[finalId] ??= {};
      next[finalId][danceId] ??= {};
      const ballot = next[finalId][danceId];
      const currentRank = ballot[teamId];
      const targetRank = value ? Number(value) : null;

      if (targetRank === null) {
        ballot[teamId] = null;
      } else {
        const occupantId = Object.entries(ballot).find(
          ([otherTeamId, rank]) => otherTeamId !== teamId && rank === targetRank
        )?.[0];
        ballot[teamId] = targetRank;
        if (occupantId) ballot[occupantId] = typeof currentRank === 'number' ? currentRank : null;
      }

      return assignOnlyRemainingRank(next, assignedFinals);
    });
  };

  const ballotComplete = (final: MultipleFinal, danceId: string) => {
    const marks = final.teamIds.map(teamId => ballots[final.id]?.[danceId]?.[teamId]);
    return marks.length > 0 && marks.every(mark => typeof mark === 'number') && new Set(marks).size === marks.length;
  };
  const submitDance = async (danceId: string) => {
    const pendingFinals = assignedFinals.filter(final =>
      final.danceIds.includes(danceId) && !finalized[final.id]?.[danceId]?.[judgeId]
    );
    const complete = pendingFinals.length > 0 && pendingFinals.every(final => ballotComplete(final, danceId));
    if (!complete || saving || !confirm('Finalize and submit every competition for this dance? Submitted placements cannot be changed.')) return;
    setSaving(true);
    setMessage('');
    try {
      for (const final of pendingFinals) {
        const response = await fetch('/api/scoring/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ partyId, eventId, judgeId, danceId, multipleFinalId: final.id, scores: ballots[final.id][danceId] }),
        });
        const result = await response.json();
        if (!response.ok || result.verified !== true) throw new Error(result.error || 'Submission could not be verified');
      }
      await refreshPartyData();
      setMessage('This dance was submitted successfully. Continue to the next dance.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not submit placements.');
      await refreshPartyData();
    } finally {
      setSaving(false);
    }
  };

  if (!assignedFinals.length) return <div className="rounded-3xl border bg-white p-10 text-center"><h2 className="text-xl font-bold">No finals assigned</h2><p className="mt-2 text-stone-500">You are not assigned to any final in this event.</p></div>;

  const activeDance = assignedDances.find(dance => dance.id === activeDanceId);
  const activeFinals = assignedFinals.filter(final => final.danceIds.includes(activeDanceId));
  const pendingActiveFinals = activeFinals.filter(final => !finalized[final.id]?.[activeDanceId]?.[judgeId]);
  const activeDanceComplete = pendingActiveFinals.length > 0 && pendingActiveFinals.every(final => ballotComplete(final, activeDanceId));
  const allSubmitted = assignedDances.every(dance => assignedFinals
    .filter(final => final.danceIds.includes(dance.id))
    .every(final => finalized[final.id]?.[dance.id]?.[judgeId]));

  return <div className="space-y-6 pb-10">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h1 className="text-3xl font-bold">Multiple Finals Ballot</h1><p className="text-stone-500">Give every couple one unique placement in each dance.</p></div><button onClick={() => refreshPartyData()} className="rounded-full border bg-white px-4 py-2 font-bold">Refresh</button></div>
    <div className="flex flex-wrap gap-2">{assignedDances.map((dance, index) => {
      const done = assignedFinals.filter(final => final.danceIds.includes(dance.id)).every(final => finalized[final.id]?.[dance.id]?.[judgeId]);
      return <span key={dance.id} className={`rounded-full px-3 py-1 text-sm font-bold ${dance.id === activeDanceId ? 'bg-violet-600 text-white' : done ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-500'}`}>{index + 1}. {dance.name} {done ? '✓' : ''}</span>;
    })}</div>
    {activeDance && <section className="rounded-3xl border bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-2xl font-bold text-violet-800">{activeDance.name || activeDance.id}</h2>
      <div className="space-y-7">{activeFinals.map(final => {
        const done = finalized[final.id]?.[activeDance.id]?.[judgeId];
        return <div key={final.id} className="rounded-2xl bg-stone-50 p-4"><div className="mb-3 flex justify-between"><h3 className="font-bold">{final.name}</h3><span className={`text-sm font-bold ${done ? 'text-green-600' : 'text-amber-600'}`}>{done ? 'Submitted' : ballotComplete(final, activeDance.id) ? 'Ready' : 'Incomplete'}</span></div><div className="divide-y rounded-xl border bg-white">{final.teamIds.map(teamId => {
          const selected = ballots[final.id]?.[activeDance.id]?.[teamId];
          return <label key={teamId} className="flex items-center gap-4 p-3"><select disabled={done} value={selected ?? ''} onChange={event => setRank(final.id, activeDance.id, teamId, event.target.value)} className="w-24 rounded-lg border p-2"><option value="">Place</option>{final.teamIds.map((_, index) => { const rank = index + 1; return <option key={rank} value={rank}>{rank}</option>; })}</select><span className="font-bold">{teams.find(team => team.id === teamId)?.name || teamId}</span></label>;
        })}</div></div>;
      })}</div>
    </section>}
    <div className="sticky bottom-3 rounded-2xl border bg-white/95 p-4 shadow-lg backdrop-blur"><button disabled={!activeDanceComplete || saving || allSubmitted} onClick={() => submitDance(activeDanceId)} className="w-full rounded-full bg-green-600 px-5 py-3 font-bold text-white disabled:opacity-40">{saving ? 'Submitting...' : allSubmitted ? 'All Dances Submitted' : `Finalize & Submit ${activeDance?.name || 'Dance'}`}</button>{message && <p className="mt-2 text-center text-sm font-bold">{message}</p>}</div>
  </div>;
}
