'use client';

import { EventData, MultipleFinal, Placement, Rankings, Team, Dance, Judge } from '@/types/types';
import usePartySettings from '@/hooks/usePartySettings';
import { calculateDancePlacements, calculateFinalResults } from '@/services/skatingSystem';

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
  const saveFinals = (next: MultipleFinal[]) => updateEvent(eventId, { multipleFinals: next });
  const updateFinal = (finalId: string, patch: Partial<MultipleFinal>) =>
    saveFinals(finals.map(final => final.id === finalId ? { ...final, ...patch } : final));

  const addFinal = () => saveFinals([...finals, {
    id: crypto.randomUUID(),
    name: `Final ${finals.length + 1}`,
    teamIds: teams.map(team => team.id),
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
        doc.text(`${final.name} - ${dances.find(dance => dance.id === danceId)?.name || danceId}`, 14, 18);
        autoTable(doc, {
          startY: 24,
          head: [['Couple', ...final.judgeIds.map((id, index) => `J${index + 1} - ${judges.find(judge => judge.id === id)?.name || id}`), 'Place']],
          body: calculated.finalTeams.map(team => [
            team.name || team.id,
            ...final.judgeIds.map(judgeId => scores[final.id]?.[danceId]?.[judgeId]?.[team.id] ?? '-'),
            calculated.danceResults[danceId]?.find(result => result.coupleId === team.id)?.rank ?? '-',
          ]),
          theme: 'grid',
        });
      });
    });
    doc.save(`${eventName || 'multiple-finals'}-results.pdf`);
  };

  const toggleId = (ids: string[], id: string) => ids.includes(id) ? ids.filter(item => item !== id) : [...ids, id];

  return (
    <section className="space-y-5 rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-2xl font-bold">Finals inside this event</h2><p className="text-sm text-stone-500">Dances and judges default to all; uncheck exceptions per final.</p></div>
        <div className="flex gap-2">
          {finals.some(final => final.resultsFinalized) && <button onClick={exportPdf} className="rounded-full bg-green-600 px-4 py-2 font-bold text-white">Export finalized PDF</button>}
          <button onClick={addFinal} className="rounded-full bg-violet-600 px-4 py-2 font-bold text-white">Add Final</button>
        </div>
      </div>

      {finals.map(final => {
        const calculated = final.resultsFinalized ? resultsFor(final) : null;
        return <article key={final.id} className="space-y-4 rounded-2xl border border-stone-200 p-5">
          <div className="flex gap-3">
            <input value={final.name} onChange={event => updateFinal(final.id, { name: event.target.value, resultsFinalized: false })} className="min-w-0 flex-1 rounded-xl border p-2 text-lg font-bold" />
            <button onClick={() => saveFinals(finals.filter(item => item.id !== final.id))} className="rounded-full border border-red-200 px-3 text-red-600">Delete</button>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <ChoiceList title="Couples" items={teams} selected={final.teamIds} onToggle={id => updateFinal(final.id, { teamIds: toggleId(final.teamIds, id), resultsFinalized: false })} />
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
          {calculated && <FinalTables final={final} teams={calculated.finalTeams} dances={dances} judges={judges} scores={scores} danceResults={calculated.danceResults} finalResults={calculated.finalResults} />}
        </article>;
      })}
    </section>
  );
}

function ChoiceList({ title, items, selected, onToggle }: { title: string; items: Array<{ id: string; name: string }>; selected: string[]; onToggle: (id: string) => void }) {
  return <fieldset className="rounded-xl bg-stone-50 p-3"><legend className="font-bold">{title}</legend><div className="mt-2 space-y-2">{items.map(item => <label key={item.id} className="flex gap-2 text-sm"><input type="checkbox" checked={selected.includes(item.id)} onChange={() => onToggle(item.id)} />{item.name || item.id}</label>)}</div></fieldset>;
}

function FinalTables({ final, teams, dances, judges, scores, danceResults, finalResults }: { final: MultipleFinal; teams: Team[]; dances: Dance[]; judges: Judge[]; scores: NonNullable<EventData['multipleFinalScores']>; danceResults: Record<string, Placement[]>; finalResults: ReturnType<typeof calculateFinalResults> }) {
  return <div className="space-y-6 overflow-x-auto">
    <h3 className="text-xl font-bold">Finalized results: {final.name}</h3>
    <table className="w-full border-collapse text-sm"><thead><tr><th className="border p-2">Place</th><th className="border p-2 text-left">Couple</th>{final.danceIds.map(id => <th key={id} className="border p-2">{dances.find(dance => dance.id === id)?.name}</th>)}<th className="border p-2">Total</th></tr></thead><tbody>{finalResults.map(result => <tr key={result.coupleId}><td className="border p-2 text-center">{result.finalRank}</td><td className="border p-2 font-bold">{teams.find(team => team.id === result.coupleId)?.name}</td>{final.danceIds.map(id => <td key={id} className="border p-2 text-center">{result.dancePlacements[id]}</td>)}<td className="border p-2 text-center font-bold">{result.totalScore}</td></tr>)}</tbody></table>
    {final.danceIds.map(danceId => <div key={danceId}><h4 className="mb-2 font-bold">{dances.find(dance => dance.id === danceId)?.name}</h4><table className="w-full border-collapse text-sm"><thead><tr><th className="border p-2 text-left">Couple</th>{final.judgeIds.map((id, index) => <th key={id} className="border p-2">J{index + 1} - {judges.find(judge => judge.id === id)?.name}</th>)}<th className="border p-2">Place</th></tr></thead><tbody>{teams.map(team => <tr key={team.id}><td className="border p-2 font-bold">{team.name}</td>{final.judgeIds.map(id => <td key={id} className="border p-2 text-center">{scores[final.id]?.[danceId]?.[id]?.[team.id] ?? '-'}</td>)}<td className="border p-2 text-center font-bold">{danceResults[danceId]?.find(result => result.coupleId === team.id)?.rank ?? '-'}</td></tr>)}</tbody></table></div>)}
  </div>;
}
