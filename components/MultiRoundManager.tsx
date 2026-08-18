'use client';

import { CompetitionRound, Dance, EventData, Judge, Placement, Rankings, Team } from '@/types/types';
import usePartySettings from '@/hooks/usePartySettings';

type Props = {
  eventId: string;
  teams: Team[];
  dances: Dance[];
  judges: Judge[];
  rounds: CompetitionRound[];
  activeRoundId?: string;
  roundScores: NonNullable<EventData['roundScores']>;
  roundFinalized: NonNullable<EventData['roundFinalized']>;
  roundReleasedDances: NonNullable<EventData['roundReleasedDances']>;
};

export default function MultiRoundManager(props: Props) {
  const { updateEvent } = usePartySettings();
  const { eventId, teams, dances, judges, rounds, activeRoundId, roundScores, roundFinalized, roundReleasedDances } = props;

  const saveRounds = (nextRounds: CompetitionRound[], nextActiveRoundId = activeRoundId) =>
    updateEvent(eventId, { rounds: nextRounds, activeRoundId: nextActiveRoundId });

  const updateRound = (roundId: string, patch: Partial<CompetitionRound>) =>
    saveRounds(rounds.map(round => round.id === roundId ? { ...round, ...patch } : round));

  const addRound = () => {
    const index = rounds.length;
    const isFirst = index === 0;
    const round: CompetitionRound = {
      id: crypto.randomUUID(),
      name: isFirst ? 'Preliminary Round 1' : `Round ${index + 1}`,
      type: 'preliminary',
      danceIds: dances.map(dance => dance.id),
      judgeIds: judges.map(judge => judge.id),
      competitorCount: isFirst ? teams.length : Math.max(2, Math.floor(teams.length / 2)),
      selectionCount: Math.max(1, Math.floor(teams.length / 2)),
      plannedAdvancers: Math.max(2, Math.floor(teams.length / 2)),
      eligibleTeamIds: isFirst ? teams.map(team => team.id) : [],
      status: isFirst ? 'active' : 'setup',
    };
    saveRounds([...rounds, round], isFirst ? round.id : activeRoundId);
  };

  const teamIdsFor = (round: CompetitionRound) => {
    const eligibleIds = round.eligibleTeamIds.length
      ? round.eligibleTeamIds
      : teams.map(team => team.id);
    return eligibleIds.slice(0, round.competitorCount || eligibleIds.length);
  };
  const danceIdsFor = (round: CompetitionRound) => round.danceIds.length
    ? round.danceIds
    : dances.map(dance => dance.id);
  const judgeIdsFor = (round: CompetitionRound) => round.judgeIds.length
    ? round.judgeIds
    : judges.map(judge => judge.id);

  const totalsFor = (round: CompetitionRound) => teamIdsFor(round)
    .map(teamId => {
      let points = 0;
      danceIdsFor(round).forEach(danceId => {
        judgeIdsFor(round).forEach(judgeId => {
          if (roundScores[round.id]?.[danceId]?.[judgeId]?.[teamId] === 1) points += 1;
        });
      });
      return { teamId, points };
    })
    .sort((a, b) => b.points - a.points || a.teamId.localeCompare(b.teamId));

  const advancementOptions = (round: CompetitionRound) => {
    const totals = totalsFor(round);
    const target = Math.min(Math.max(1, round.plannedAdvancers), totals.length);
    if (!totals.length) return [];

    // A valid cutoff must include every couple tied on the boundary score.
    const validCutoffs: number[] = [];
    totals.forEach((item, index) => {
      const next = totals[index + 1];
      if (!next || next.points !== item.points) validCutoffs.push(index + 1);
    });

    // Do not offer the planned count when its boundary splits a tie. In that
    // case the exact cutoff jumps from the end of the preceding score group to
    // the end of the tied group, skipping the target entirely.
    const targetSplitsTie = target < totals.length &&
      totals[target - 1].points === totals[target].points;
    const below = validCutoffs.filter(count => count < target).slice(-2);
    const original = !targetSplitsTie && validCutoffs.includes(target) ? [target] : [];
    const above = validCutoffs.filter(count => count > target).slice(0, 2);
    return [...below, ...original, ...above];
  };

  const isRoundComplete = (round: CompetitionRound) =>
    danceIdsFor(round).length > 0 && judgeIdsFor(round).length > 0 &&
    danceIdsFor(round).every(danceId =>
      judgeIdsFor(round).every(judgeId => roundFinalized[round.id]?.[danceId]?.[judgeId])
    );

  const advance = async (round: CompetitionRound, count: number) => {
    const advancingIds = totalsFor(round).slice(0, count).map(item => item.teamId);
    const roundIndex = rounds.findIndex(item => item.id === round.id);
    const nextRound = rounds[roundIndex + 1];
    const nextRounds = rounds.map(item => {
      if (item.id === round.id) return { ...item, advancingTeamIds: advancingIds, status: 'completed' as const };
      if (nextRound && item.id === nextRound.id) {
        return {
          ...item,
          eligibleTeamIds: advancingIds,
          competitorCount: advancingIds.length,
          status: 'active' as const,
        };
      }
      return item;
    });
    await saveRounds(nextRounds, nextRound?.id);
  };

  const toggleRelease = async (roundId: string, danceId: string) => {
    const next = structuredClone(roundReleasedDances);
    next[roundId] ??= {};
    next[roundId][danceId] = !next[roundId][danceId];
    const isLastRound = rounds.at(-1)?.id === roundId;
    const targetRound = rounds.find(round => round.id === roundId);
    let nextRounds = rounds;
    if (isLastRound && targetRound) {
      const allReleased = danceIdsFor(targetRound).every(id => next[roundId]?.[id]);
      nextRounds = rounds.map(round => round.id === roundId
        ? { ...round, status: allReleased ? 'completed' as const : 'active' as const }
        : round);
    }
    await updateEvent(eventId, { roundReleasedDances: next, rounds: nextRounds });
  };

  const exportResultsToPDF = async () => {
    const { jsPDF } = await import('jspdf/dist/jspdf.umd.min.js');
    const { default: autoTable } = await import('jspdf-autotable');
    const { calculateDancePlacements, calculateFinalResults } = await import('@/services/skatingSystem');
    const doc = new jsPDF('l', 'mm', 'a4');

    rounds.forEach((round, roundIndex) => {
      if (roundIndex > 0) doc.addPage();
      doc.setFontSize(20);
      doc.text(round.name, 14, 18);
      doc.setFontSize(10);
      doc.text(round.type === 'preliminary' ? 'Preliminary selection results' : 'Final skating results', 14, 25);

      if (round.type === 'preliminary') {
        const advancing = new Set(round.advancingTeamIds || []);
        const body = totalsFor(round).map((item, index) => [
          index + 1,
          teams.find(team => team.id === item.teamId)?.name || item.teamId,
          item.points,
          advancing.has(item.teamId) ? 'Advanced' : '',
        ]);
        autoTable(doc, { startY: 30, head: [['Rank', 'Couple', 'Points', 'Result']], body, theme: 'grid' });
        return;
      }

      const roundTeams = teams.filter(team => teamIdsFor(round).includes(team.id));
      const roundDanceIds = danceIdsFor(round).filter(danceId => roundReleasedDances[round.id]?.[danceId]);
      const roundJudgeIds = judgeIdsFor(round);
      const rawRankings: Rankings = {};
      const allDanceResults: Record<string, Placement[]> = {};
      roundDanceIds.forEach(danceId => {
        rawRankings[danceId] = {};
        roundJudgeIds.forEach(judgeId => {
          rawRankings[danceId][judgeId] = {};
          roundTeams.forEach(team => {
            const mark = roundScores[round.id]?.[danceId]?.[judgeId]?.[team.id];
            rawRankings[danceId][judgeId][team.id] = typeof mark === 'number' ? mark : roundTeams.length + 1;
          });
        });
        allDanceResults[danceId] = calculateDancePlacements(rawRankings[danceId], roundTeams, roundJudgeIds.length);
      });
      const finalResults = calculateFinalResults(allDanceResults, roundTeams, roundDanceIds, rawRankings, roundJudgeIds);
      const body = finalResults.map(result => [
        result.finalRank,
        teams.find(team => team.id === result.coupleId)?.name || result.coupleId,
        ...roundDanceIds.map(danceId => result.dancePlacements[danceId]),
        result.totalScore,
      ]);
      autoTable(doc, {
        startY: 30,
        head: [['Rank', 'Couple', ...roundDanceIds.map(id => dances.find(dance => dance.id === id)?.name || id), 'Total']],
        body,
        theme: 'grid',
      });
    });

    doc.save('multi-round-results.pdf');
  };

  return (
    <section className="bg-white shadow-sm sm:rounded-3xl p-6 border border-stone-200/60 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">Competition Rounds</h2>
          <p className="text-sm text-stone-500">Configure preliminary selections and the final ranking round.</p>
        </div>
        <div className="flex gap-2">
          {rounds.length > 0 && rounds.at(-1)?.status === 'completed' && (
            <button onClick={exportResultsToPDF} className="px-4 py-2 rounded-full bg-green-600 text-white font-bold">Export Results to PDF</button>
          )}
          <button onClick={addRound} className="px-4 py-2 rounded-full bg-violet-600 text-white font-bold">Add Round</button>
        </div>
      </div>

      {rounds.map((round, roundIndex) => {
        const complete = isRoundComplete(round);
        const totals = totalsFor(round);
        return (
          <div key={round.id} className="rounded-2xl border border-stone-200 p-5 space-y-4">
            <div className="flex flex-wrap gap-3 items-center">
              <input value={round.name} onChange={event => updateRound(round.id, { name: event.target.value })} className="p-2 border rounded-xl font-bold" />
              <select value={round.type} onChange={event => updateRound(round.id, { type: event.target.value as CompetitionRound['type'] })} className="p-2 border rounded-xl">
                <option value="preliminary">Preliminary — select couples</option>
                <option value="final">Final — rank 1 to last</option>
              </select>
              <span className="text-xs font-bold uppercase text-stone-500">{round.id === activeRoundId ? 'Active' : round.status}</span>
              {round.id !== activeRoundId && round.status !== 'completed' && (
                <button onClick={() => saveRounds(rounds.map(item => ({ ...item, status: item.id === round.id ? 'active' : item.status })), round.id)} className="px-3 py-1.5 rounded-full border border-violet-300 text-violet-700 text-sm font-bold">Make active</button>
              )}
            </div>

            <div className="grid sm:grid-cols-3 gap-3">
              <label className="text-sm text-stone-600">People in round
                <input type="number" min={1} max={teams.length} value={round.competitorCount} onChange={event => updateRound(round.id, { competitorCount: Number(event.target.value) })} className="block w-full p-2 border rounded-xl mt-1" />
              </label>
              {round.type === 'preliminary' && <label className="text-sm text-stone-600">Selections per judge/dance
                <input type="number" min={1} max={Math.max(1, round.competitorCount)} value={round.selectionCount} onChange={event => updateRound(round.id, { selectionCount: Number(event.target.value) })} className="block w-full p-2 border rounded-xl mt-1" />
              </label>}
              {round.type === 'preliminary' && <label className="text-sm text-stone-600">Planned advancing couples
                <input type="number" min={1} max={Math.max(1, round.competitorCount)} value={round.plannedAdvancers} onChange={event => updateRound(round.id, { plannedAdvancers: Number(event.target.value) })} className="block w-full p-2 border rounded-xl mt-1" />
              </label>}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div><p className="font-bold text-sm mb-2">Dances</p><div className="flex flex-wrap gap-2">{dances.map(dance => <label key={dance.id} className="text-sm px-3 py-2 rounded-xl bg-stone-50"><input type="checkbox" checked={round.danceIds.includes(dance.id)} onChange={() => updateRound(round.id, { danceIds: round.danceIds.includes(dance.id) ? round.danceIds.filter(id => id !== dance.id) : [...round.danceIds, dance.id] })} /> {dance.name}</label>)}</div></div>
              <div><p className="font-bold text-sm mb-2">Judges</p><div className="flex flex-wrap gap-2">{judges.map(judge => <label key={judge.id} className="text-sm px-3 py-2 rounded-xl bg-stone-50"><input type="checkbox" checked={round.judgeIds.includes(judge.id)} onChange={() => updateRound(round.id, { judgeIds: round.judgeIds.includes(judge.id) ? round.judgeIds.filter(id => id !== judge.id) : [...round.judgeIds, judge.id] })} /> {judge.name}</label>)}</div></div>
            </div>

            {totals.length > 0 && <div><p className="font-bold text-sm mb-2">Progress</p><div className="flex flex-wrap gap-2">{totals.map((item, index) => <span key={item.teamId} className="px-3 py-1.5 rounded-full bg-stone-100 text-sm">{index + 1}. {teams.find(team => team.id === item.teamId)?.name || item.teamId}: <b>{item.points}</b></span>)}</div></div>}

            <div className="space-y-2"><p className="font-bold text-sm">Release results by round and dance</p>{round.danceIds.map(danceId => {
              const dance = dances.find(item => item.id === danceId);
              const ready = round.judgeIds.length > 0 && round.judgeIds.every(judgeId => roundFinalized[round.id]?.[danceId]?.[judgeId]);
              const released = roundReleasedDances[round.id]?.[danceId];
              return <div key={danceId} className="flex justify-between items-center rounded-xl bg-stone-50 p-3"><span>{dance?.name}</span><button disabled={!ready && !released} onClick={() => toggleRelease(round.id, danceId)} className="px-3 py-1 rounded-full border disabled:opacity-40">{released ? 'Unrelease' : ready ? 'Release' : 'Waiting for judges'}</button></div>;
            })}</div>

            {round.type === 'preliminary' && complete && round.status !== 'completed' && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                <p className="font-bold text-amber-900">Choose how many couples advance</p>
                <p className="text-sm text-amber-700 mb-3">The available choices respect ties at the planned cutoff.</p>
                <div className="flex flex-wrap gap-2">{advancementOptions(round).map(count => <button key={count} onClick={() => advance(round, count)} className="px-4 py-2 bg-amber-700 text-white rounded-full font-bold">Advance {count}{count === round.plannedAdvancers ? ' (planned)' : ''}</button>)}</div>
              </div>
            )}
            {roundIndex === rounds.length - 1 && round.type === 'preliminary' && <p className="text-xs text-stone-500">Add the next round before advancing couples.</p>}
          </div>
        );
      })}
    </section>
  );
}
