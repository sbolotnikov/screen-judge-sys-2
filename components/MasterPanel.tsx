
import React from 'react';
import { Judge, Couple, Placement } from '../types';

interface MasterPanelProps {
  judges: Judge[];
  couples: Couple[];
  dance: string;
  submissions: Record<number, boolean>;
  onCalculate: () => void;
  onFinishCompetition: () => void;
  results: Placement[];
  isCompletable: boolean;
  rawRankings: Record<number, Record<number, number>>; // judgeId -> coupleId -> rank
}

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
);

const HourglassIcon = () => (
    <div className="relative h-5 w-5">
      <div className="absolute inset-0 rounded-full border-2 border-slate-600 border-t-amber-400 animate-spin"></div>
    </div>
);

const MasterPanel: React.FC<MasterPanelProps> = ({ 
  judges, 
  couples, 
  dance, 
  submissions, 
  onCalculate, 
  onFinishCompetition, 
  results, 
  isCompletable,
  rawRankings 
}) => {
  const allSubmitted = judges.every(j => submissions[j.id]);
  const resultsCalculated = results.length > 0;
  const majority = Math.floor(judges.length / 2) + 1;

  const getCoupleName = (id: number) => couples.find(c => c.id === id)?.name || `Couple ${id}`;

  const formatRank = (rank: number) => {
    if (Number.isInteger(rank)) return rank.toString();
    return rank.toFixed(2).replace(/\.?0+$/, "");
  };

  /**
   * Helper function to calculate the majority count and sum for a specific column.
   * This is used to render the 1-1, 1-2, 1-3... columns in the tabulation table.
   * 
   * @param coupleId The ID of the couple being evaluated.
   * @param columnRank The rank column we are checking (e.g., 2 means checking 1st and 2nd places).
   * @returns An object containing the `count` of marks <= columnRank and the `sum` of those marks.
   */
  const getTabulationData = (coupleId: number, columnRank: number) => {
    const marks = judges.map(j => rawRankings[j.id]?.[coupleId] || 0);
    const count = marks.filter(m => m > 0 && m <= columnRank).length;
    const sum = marks.filter(m => m > 0 && m <= columnRank).reduce((a, b) => a + b, 0);
    return { count, sum };
  };

  const placementMap = new Map<number, number>();
  results.forEach(r => {
    placementMap.set(r.coupleId, Math.floor(r.rank));
  });

  /**
   * Main render function for the Master Panel.
   * This component displays the overall status of the competition, including:
   * - Which judges have submitted their scores.
   * - A button to trigger the final calculation once all scores are in.
   * - The final tabulation table showing the results of the Skating System.
   */
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-6 lg:sticky lg:top-8 overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight">Master Panel</h2>
        <span className="bg-sky-500/10 text-sky-400 text-xs font-bold px-3 py-1 rounded-full border border-sky-500/20">{dance}</span>
      </div>
      
      <div className="mb-8">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Adjudicator Status</h3>
        <div className="grid grid-cols-1 gap-2">
          {judges.map(judge => (
            <div key={judge.id} className="flex items-center justify-between bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
              <span className="text-slate-300 font-medium">{judge.name}</span>
              {submissions[judge.id] ? <CheckIcon /> : <HourglassIcon />}
            </div>
          ))}
        </div>
      </div>
      
      {!resultsCalculated && (
        <button
          onClick={onCalculate}
          disabled={!allSubmitted}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-4 px-4 rounded-xl shadow-lg shadow-emerald-500/10 transition-all transform active:scale-95"
        >
          {allSubmitted ? 'Calculate Dance Placements' : 'Waiting for Submissions...'}
        </button>
      )}

      {resultsCalculated && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tabulation (Rule 10)</h3>
            <button onClick={onCalculate} className="text-xs text-sky-400 hover:underline">Recalculate</button>
          </div>
          
          <div className="overflow-x-auto mb-6 -mx-2 px-2">
            <table className="w-full text-[10px] text-center border-separate border-spacing-0.5">
              <thead>
                <tr className="text-slate-500 font-bold">
                  <th className="p-1 text-left bg-slate-900/40 rounded-tl-lg">Cpl</th>
                  {judges.map((_, i) => (
                    <th key={i} className="p-1 bg-slate-900/40">J{i+1}</th>
                  ))}
                  {couples.map((_, i) => (
                    <th key={i} className="p-1 bg-slate-900/60 text-sky-400">1-{i+1}</th>
                  ))}
                  <th className="p-1 bg-indigo-900/40 text-white rounded-tr-lg">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/30">
                {results.map(r => {
                  const placedAt = placementMap.get(r.coupleId) || 0;
                  return (
                    <tr key={r.coupleId} className="hover:bg-slate-700/20">
                      <td className="p-2 text-left font-bold text-slate-300 bg-slate-900/20">{getCoupleName(r.coupleId)}</td>
                      {judges.map(j => (
                        <td key={j.id} className="p-2 text-slate-400 border-l border-slate-700/30">
                          {rawRankings[j.id]?.[r.coupleId] || '-'}
                        </td>
                      ))}
                      {couples.map((_, i) => {
                        const colRank = i + 1;
                        const data = getTabulationData(r.coupleId, colRank);
                        const isAfterPlaced = colRank > placedAt;
                        const hasMajority = data.count >= majority;

                        return (
                          <td 
                            key={i} 
                            className={`p-2 border-l border-slate-700/30 transition-colors ${isAfterPlaced ? 'bg-slate-900/60 opacity-20' : hasMajority ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-500'}`}
                          >
                            {!isAfterPlaced && (
                              <div className="flex flex-col">
                                <span>{data.count}</span>
                                {data.count >= majority && <span className="text-[8px] opacity-60">({data.sum})</span>}
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="p-2 font-black text-white bg-indigo-600/20 border-l border-slate-700/30">
                        {formatRank(r.rank)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2 mb-8 p-3 bg-slate-900/50 rounded-xl border border-slate-700">
            <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
            <p className="text-[10px] text-slate-400 font-medium">Ties: rank = contested + 1/count. Final Standings break these using Rule 11 / Grand Tabulation.</p>
          </div>

          {isCompletable && (
             <button
                onClick={onFinishCompetition}
                className="w-full bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold py-4 px-4 rounded-xl shadow-xl shadow-sky-500/20 transition-all transform hover:-translate-y-1 active:scale-95"
              >
                Finalize Competition Results
              </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MasterPanel;
