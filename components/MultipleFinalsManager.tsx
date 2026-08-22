'use client';

import { useEffect } from 'react';
import { EventData, MultipleFinal, Placement, Rankings, Team, Dance, Judge } from '@/types/types';
import usePartySettings from '@/hooks/usePartySettings';
import { calculateDancePlacements, calculateFinalResults } from '@/services/skatingSystem';
import SkatingBreakdown from './SkatingBreakdown';

type Props = {
  eventId: string;
  eventName: string;
  teams: Team[];
  dances: Dance[];
  judges: Judge[];
  finals: MultipleFinal[];
  scores: NonNullable<EventData['multipleFinalScores']>;
  finalized: NonNullable<EventData['multipleFinalFinalized']>;
};

export default function MultipleFinalsManager({ eventId, eventName, teams, dances, judges, finals, scores, finalized }: Props) {
  const { updateEvent } = usePartySettings();
  const removeDuplicateCoupleAssignments = (items: MultipleFinal[]) => {
    const assigned = new Set<string>();
    return items.map(final => ({
      ...final,
      teamIds: final.teamIds.filter(teamId => {
        if (assigned.has(teamId)) return false;
        assigned.add(teamId);
        return true;
      }),
    }));
  };
  const saveFinals = (next: MultipleFinal[]) =>
    updateEvent(eventId, { multipleFinals: removeDuplicateCoupleAssignments(next) });
  const updateFinal = (finalId: string, patch: Partial<MultipleFinal>) =>
    saveFinals(finals.map(final => final.id === finalId ? { ...final, ...patch } : final));

  useEffect(() => {
    const normalized = removeDuplicateCoupleAssignments(finals);
    const hasOverlaps = normalized.some((final, index) =>
      final.teamIds.length !== finals[index].teamIds.length);
    if (hasOverlaps) updateEvent(eventId, { multipleFinals: normalized });
  }, [eventId, finals, updateEvent]);

  const addFinal = () => saveFinals([...finals, {
    id: crypto.randomUUID(),
    name: `Final ${finals.length + 1}`,
    teamIds: [],
    danceIds: dances.map(dance => dance.id),
    judgeIds: judges.map(judge => judge.id),
    resultsFinalized: false,
  }]);

  const isJudgeDone = (final: MultipleFinal, judgeId: string) =>
    final.danceIds.length > 0 && final.danceIds.every(danceId => finalized[final.id]?.[danceId]?.[judgeId]);
  const isFinalReady = (final: MultipleFinal) =>
    final.judgeIds.length > 0 && final.judgeIds.every(judgeId => isJudgeDone(final, judgeId));

  const resultsFor = (final: MultipleFinal) => {
    const finalTeams = teams.filter(team => final.teamIds.includes(team.id));
    const rawRankings: Rankings = {};
    const danceResults: Record<string, Placement[]> = {};
    final.danceIds.forEach(danceId => {
      rawRankings[danceId] = {};
      final.judgeIds.forEach(judgeId => {
        rawRankings[danceId][judgeId] = {};
        finalTeams.forEach(team => {
          const mark = scores[final.id]?.[danceId]?.[judgeId]?.[team.id];
          rawRankings[danceId][judgeId][team.id] = typeof mark === 'number' ? mark : finalTeams.length + 1;
        });
      });
      danceResults[danceId] = calculateDancePlacements(rawRankings[danceId], finalTeams, final.judgeIds.length);
    });
    return {
      finalTeams,
      danceResults,
      finalResults: calculateFinalResults(danceResults, finalTeams, final.danceIds, rawRankings, final.judgeIds),
    };
  };

  const exportPdf = async () => {
    const { jsPDF } = await import('jspdf/dist/jspdf.umd.min.js');
    const { default: autoTable } = await import('jspdf-autotable');
    const doc = new jsPDF('l', 'mm', 'a4');
    const completed = finals.filter(final => final.resultsFinalized);
    completed.forEach((final, finalIndex) => {
      if (finalIndex) doc.addPage();
      const calculated = resultsFor(final);
      doc.setFontSize(18);
      doc.text(`${eventName} - ${final.name}`, 14, 18);
      autoTable(doc, {
        startY: 24,
        head: [['Place', 'Couple', ...final.danceIds.map(id => dances.find(dance => dance.id === id)?.name || id), 'Total']],
        body: calculated.finalResults.map(result => [
          result.finalRank,
          calculated.finalTeams.find(team => team.id === result.coupleId)?.name || result.coupleId,
          ...final.danceIds.map(id => result.dancePlacements[id]),
          result.totalScore,
        ]),
        theme: 'grid',
      });
      final.danceIds.forEach(danceId => {
        doc.addPage();
        doc.setFontSize(16);
        doc.text(`${final.name} - Dance Tabulation: ${dances.find(dance => dance.id === danceId)?.name || danceId}`, 14, 18);
        const placements = calculated.danceResults[danceId] || [];
        autoTable(doc, {
          startY: 24,
          head: [['Couple', ...final.judgeIds.map((_, index) => `J${index + 1}`), ...calculated.finalTeams.map((_, index) => `1-${index + 1}`), 'Place']],
          body: [...placements].sort((a, b) => a.rank - b.rank).map(placement => {
            const marks = final.judgeIds.map(judgeId => scores[final.id]?.[danceId]?.[judgeId]?.[placement.coupleId]);
            const numericMarks = marks.filter((mark): mark is number => typeof mark === 'number');
            return [
              calculated.finalTeams.find(team => team.id === placement.coupleId)?.name || placement.coupleId,
              ...marks.map(mark => mark ?? '-'),
              ...calculated.finalTeams.map((_, index) => {
                const column = index + 1;
                const included = numericMarks.filter(mark => mark <= column);
                return `${included.length} (${included.reduce((sum, mark) => sum + mark, 0)})`;
              }),
              placement.rank,
            ];
          }),
          theme: 'grid',
          styles: { fontSize: 7 },
        });
      });

      if (final.danceIds.length > 1) {
        const needsRule10 = calculated.finalResults.some((result, index, all) =>
          all.some((other, otherIndex) => otherIndex !== index && other.totalScore === result.totalScore));
        if (needsRule10) {
          doc.addPage();
          doc.setFontSize(16);
          doc.text(`${final.name} - Rule 10: Better Dance Majority`, 14, 18);
          autoTable(doc, {
            startY: 24,
            head: [['Couple', ...final.danceIds.map(id => dances.find(dance => dance.id === id)?.name || id), ...calculated.finalTeams.map((_, index) => `1-${index + 1}`), 'Sum']],
            body: [...calculated.finalResults].sort((a, b) => a.totalScore - b.totalScore || a.finalRank - b.finalRank).map(result => {
              const dancePlaces = final.danceIds.map(id => result.dancePlacements[id]);
              return [
                calculated.finalTeams.find(team => team.id === result.coupleId)?.name || result.coupleId,
                ...dancePlaces,
                ...calculated.finalTeams.map((_, index) => {
                  const column = index + 1;
                  const included = dancePlaces.filter(place => place <= column);
                  return `${included.length} (${included.reduce((sum, place) => sum + place, 0)})`;
                }),
                result.totalScore,
              ];
            }),
            theme: 'grid',
            styles: { fontSize: 7 },
            headStyles: { fillColor: [5, 150, 105] },
          });
        }

        const rule11Results = calculated.finalResults.filter(result => result.rule11Contested);
        if (rule11Results.length) {
          doc.addPage();
          doc.setFontSize(16);
          doc.text(`${final.name} - Rule 11: Grand Tabulation`, 14, 18);
          autoTable(doc, {
            startY: 24,
            head: [['Couple', ...final.danceIds.flatMap((_, danceIndex) => final.judgeIds.map((__, judgeIndex) => `D${danceIndex + 1}-J${judgeIndex + 1}`)), ...calculated.finalTeams.map((_, index) => `1-${index + 1}`), 'Result']],
            body: rule11Results.map(result => {
              const allMarks = final.danceIds.flatMap(danceId => final.judgeIds.map(judgeId => {
                const mark = scores[final.id]?.[danceId]?.[judgeId]?.[result.coupleId];
                return typeof mark === 'number' ? mark : calculated.finalTeams.length + 1;
              }));
              return [
                calculated.finalTeams.find(team => team.id === result.coupleId)?.name || result.coupleId,
                ...allMarks,
                ...calculated.finalTeams.map((_, index) => {
                  const column = index + 1;
                  const included = allMarks.filter(mark => mark <= column);
                  return `${included.length} (${included.reduce((sum, mark) => sum + mark, 0)})`;
                }),
                result.finalRank,
              ];
            }),
            theme: 'grid',
            styles: { fontSize: 6 },
            headStyles: { fillColor: [124, 58, 237] },
          });
        }
      }
    });
    doc.save(`${eventName || 'multiple-finals'}-results.pdf`);
  };

  const toggleId = (ids: string[], id: string) => ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id];

  return (
    <section className="space-y-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-2xl font-bold">Finals inside this event</h2><p className="text-sm text-stone-500">Each couple can participate in only one final. Dances and judges default to all.</p></div>
        <div className="flex gap-2">
          {finals.some(final => final.resultsFinalized) && <button onClick={exportPdf} className="rounded-full bg-green-600 px-4 py-2 font-bold text-white">Export finalized PDF</button>}
          <button onClick={addFinal} className="rounded-full bg-violet-600 px-4 py-2 font-bold text-white">Add Final</button>
        </div>
      </div>

      {finals.map(final => {
        const calculated = final.resultsFinalized ? resultsFor(final) : null;
        const couplesInOtherFinals = new Set(finals
          .filter(item => item.id !== final.id)
          .flatMap(item => item.teamIds));
        return <article key={final.id} className="space-y-4 rounded-2xl border border-stone-200 p-5">
          <div className="flex gap-3">
            <input value={final.name} onChange={event => updateFinal(final.id, { name: event.target.value, resultsFinalized: false })} className="min-w-0 flex-1 rounded-xl border p-2 text-lg font-bold" />
            <button onClick={() => saveFinals(finals.filter(item => item.id !== final.id))} className="rounded-full border border-red-200 px-3 text-red-600">Delete</button>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <ChoiceList title="Couples" items={teams} selected={final.teamIds} disabledIds={couplesInOtherFinals} disabledText="Assigned to another final" onToggle={id => updateFinal(final.id, { teamIds: toggleId(final.teamIds, id), resultsFinalized: false })} />
            <ChoiceList title="Dances" items={dances} selected={final.danceIds} onToggle={id => updateFinal(final.id, { danceIds: toggleId(final.danceIds, id), resultsFinalized: false })} />
            <ChoiceList title="Judges" items={judges} selected={final.judgeIds} onToggle={id => updateFinal(final.id, { judgeIds: toggleId(final.judgeIds, id), resultsFinalized: false })} />
          </div>
          <div>
            <h3 className="mb-2 font-bold">Judge status</h3>
            <div className="flex flex-wrap gap-2">{final.judgeIds.map((judgeId, index) => {
              const judge = judges.find(item => item.id === judgeId);
              const done = isJudgeDone(final, judgeId);
              return <span key={judgeId} className={`rounded-full px-3 py-1 text-sm font-bold ${done ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>J{index + 1} - {judge?.name || judgeId}: {done ? 'Finished' : 'Waiting'}</span>;
            })}</div>
          </div>
          {!final.resultsFinalized && <button disabled={!isFinalReady(final)} onClick={() => updateFinal(final.id, { resultsFinalized: true })} className="rounded-full bg-green-600 px-4 py-2 font-bold text-white disabled:opacity-40">Finalize calculation</button>}
          {calculated && <FinalTables final={final} teams={calculated.finalTeams} dances={dances} judges={judges} scores={scores} finalized={finalized} danceResults={calculated.danceResults} finalResults={calculated.finalResults} />}
        </article>;
      })}
    </section>
  );
}

function ChoiceList({ title, items, selected, disabledIds = new Set<string>(), disabledText, onToggle }: { title: string; items: Array<{ id: string; name: string }>; selected: string[]; disabledIds?: Set<string>; disabledText?: string; onToggle: (id: string) => void }) {
  return <fieldset className="rounded-xl bg-stone-50 p-3"><legend className="font-bold">{title}</legend><div className="mt-2 space-y-2">{items.map(item => {
    const disabled = disabledIds.has(item.id) && !selected.includes(item.id);
    return <label key={item.id} className={`flex gap-2 text-sm ${disabled ? 'cursor-not-allowed text-stone-400' : ''}`} title={disabled ? disabledText : undefined}><input type="checkbox" checked={selected.includes(item.id)} disabled={disabled} onChange={() => onToggle(item.id)} />{item.name || item.id}{disabled && disabledText ? <span className="ml-auto text-xs">{disabledText}</span> : null}</label>;
  })}</div></fieldset>;
}

function FinalTables({ final, teams, dances, judges, scores, finalized, danceResults, finalResults }: { final: MultipleFinal; teams: Team[]; dances: Dance[]; judges: Judge[]; scores: NonNullable<EventData['multipleFinalScores']>; finalized: NonNullable<EventData['multipleFinalFinalized']>; danceResults: Record<string, Placement[]>; finalResults: ReturnType<typeof calculateFinalResults> }) {
  return <div className="space-y-6 overflow-x-auto">
    <h3 className="text-xl font-bold">Finalized results: {final.name}</h3>
    <table className="w-full border-collapse text-sm"><thead><tr><th className="border p-2">Place</th><th className="border p-2 text-left">Couple</th>{final.danceIds.map(id => <th key={id} className="border p-2">{dances.find(dance => dance.id === id)?.name}</th>)}<th className="border p-2">Total</th></tr></thead><tbody>{finalResults.map(result => <tr key={result.coupleId}><td className="border p-2 text-center">{result.finalRank}</td><td className="border p-2 font-bold">{teams.find(team => team.id === result.coupleId)?.name}</td>{final.danceIds.map(id => <td key={id} className="border p-2 text-center">{result.dancePlacements[id]}</td>)}<td className="border p-2 text-center font-bold">{result.totalScore}</td></tr>)}</tbody></table>
    <SkatingBreakdown
      name={final.name}
      teams={teams}
      dances={dances.filter(dance => final.danceIds.includes(dance.id))}
      judges={judges.filter(judge => final.judgeIds.includes(judge.id))}
      scores={scores[final.id] || {}}
      finalized={finalized[final.id] || {}}
      releasedDances={Object.fromEntries(final.danceIds.map(danceId => [danceId, true]))}
      danceResults={danceResults}
      finalResults={finalResults}
      isAnimationOn={false}
      selectedDanceName="Overall Standings"
    />
  </div>;
}
