"use client";
import React, { useState } from 'react';
import { EventData, Team, Dance, Judge, Placement, FinalResult, Rankings } from '@/types/types';
import { Icon } from '@/components/Icon';

interface SkatingBreakdownProps {
  name: string;
  teams: Team[];
  dances: Dance[];
  judges: Judge[];
  scores: EventData['scores'];
  finalized: EventData['finalized'];
  releasedDances: EventData['releasedDances'];
  danceResults: Record<string, Placement[]>;
  finalResults: FinalResult[];
  isAnimationOn: boolean;
  selectedDanceName: string;
}

export default function SkatingBreakdown({
  name: eventName,
  teams,
  dances,
  judges,
  scores,
  finalized,
  releasedDances = {},
  danceResults,
  finalResults: results,
  isAnimationOn,
  selectedDanceName,
}: SkatingBreakdownProps) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  const getTeamName = (id: string) => teams.find(c => c.id === id)?.name || `Team ${id}`;

  const formatRank = (rank: number) => {
    if (Number.isInteger(rank)) return rank.toString();
    return rank.toFixed(2).replace(/\.?0+$/, "");
  };

  /**
   * Generates a human-readable explanation of why a couple received their specific rank.
   */
  const getResolutionText = (result: FinalResult) => {
    if (!Number.isInteger(result.finalRank)) {
      return { 
        label: "Unbreakable Tie", 
        color: "text-stone-500", 
        desc: "Mathematically identical results after all multi-dance tie-breaks." 
      };
    }
    
    const contested = results.filter(r => r.totalScore === result.totalScore && r.coupleId !== result.coupleId);
    if (contested.length === 0) {
      return { 
        label: "Clear Standing", 
        color: "text-emerald-600", 
        desc: "Unique total score; no tie-break needed." 
      };
    }

    if (result.rule10Resolution && !result.rule10Resolution.isTie) {
      return { 
        label: "Rule 10 Resolved", 
        color: "text-emerald-600", 
        desc: "Initially tied on sum; resolved via Rule 10 (Placement Counts)." 
      };
    }

    if (result.rule11Resolution) {
      return { 
        label: "Tie Resolved", 
        color: "text-violet-600", 
        desc: "Initially tied on sum; resolved via Rule 11 or Grand Tabulation." 
      };
    }

    return { label: "Standard Calculation", color: "text-emerald-600", desc: "Unique standing." };
  };

  const getTabulationData = (coupleId: string, columnRank: number, marksSource: Record<string, number[]>) => {
    const marks = marksSource[coupleId] || [];
    const count = marks.filter(m => m > 0 && m <= columnRank).length;
    const sum = marks.filter(m => m > 0 && m <= columnRank).reduce((a, b) => a + b, 0);
    return { count, sum };
  };

  const renderTabulationTable = (
    title: string, 
    colHeaders: string[], 
    rowPlacements: any[], 
    marksSource: Record<string, number[]>,
    majority: number
  ) => {
    return (
      <div className="mb-10">
        <h3 className="text-lg font-bold text-violet-600 mb-4 flex items-center gap-3">
          <span className="w-1.5 h-6 bg-violet-500 rounded-full"></span>
          {title}
        </h3>
        <div className="overflow-x-auto bg-stone-50 rounded-2xl border border-stone-200 p-2">
          <table className="w-full text-[10px] sm:text-xs text-center border-separate border-spacing-0.5">
            <thead>
              <tr className="text-stone-500 font-bold">
                <th className="p-2 text-left bg-white rounded-tl-xl border border-stone-200">Cpl</th>
                {colHeaders.map((h, i) => (
                  <th key={i} className="p-2 bg-white border border-stone-200">{h}</th>
                ))}
                {Array.from({length: teams.length}, (_, i) => (
                  <th key={i} className="p-2 bg-stone-100 text-violet-600 border border-stone-200">1-{i+1}</th>
                ))}
                <th className="p-2 bg-violet-50 text-violet-900 rounded-tr-xl border border-stone-200">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {rowPlacements.sort((a,b) => (a.rank || a.finalRank) - (b.rank || b.finalRank)).map(r => {
                const rankValue = r.rank || r.finalRank;
                const baseRank = Math.floor(rankValue);
                const marks = marksSource[r.coupleId] || [];
                return (
                  <tr key={r.coupleId} className="hover:bg-white group">
                    <td className="p-2 text-left font-bold text-stone-700 bg-white border border-stone-200">{getTeamName(r.coupleId)}</td>
                    {marks.map((m, i) => (
                      <td key={i} className="p-2 text-stone-600 border border-stone-200">
                        {m || '-'}
                      </td>
                    ))}
                    {Array.from({length: teams.length}, (_, i) => {
                      const colRank = i + 1;
                      const data = getTabulationData(r.coupleId, colRank, marksSource);
                      const isAfterPlaced = colRank > baseRank;
                      const hasMajority = data.count >= majority;

                      return (
                        <td 
                          key={i} 
                          className={`p-2 border border-stone-200 transition-all ${isAfterPlaced ? 'opacity-20 bg-stone-50' : hasMajority ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-stone-400'}`}
                        >
                          {!isAfterPlaced && (
                            <div className="flex flex-col items-center">
                              <span>{data.count}</span>
                              {hasMajority && <span className="text-[8px] opacity-60">({data.sum})</span>}
                            </div>
                          )}
                        </td>
                      );
                    })}
                    <td className="p-2 font-black text-violet-900 bg-violet-50 border border-stone-200 group-hover:bg-violet-100">
                      {formatRank(rankValue)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const getDanceMarksSource = (danceId: string) => {
    const source: Record<string, number[]> = {};
    teams.forEach(t => {
      source[t.id] = judges.map(j => {
          const m = scores[danceId]?.[j.id]?.[t.id];
          return typeof m === 'number' ? m : 0;
      });
    });
    return source;
  };

  const getRule11MarksSource = () => {
    const source: Record<string, number[]> = {};
    teams.forEach(t => {
      source[t.id] = dances.filter(d => releasedDances[d.id]).map(dance => {
        const p = danceResults[dance.id]?.find(dr => String(dr.coupleId) === String(t.id));
        return p ? p.rank : teams.length + 1;
      });
    });
    return source;
  };

  const getGrandTabulationSource = () => {
    const source: Record<string, number[]> = {};
    const released = dances.filter(d => releasedDances[d.id]);
    teams.forEach(t => {
      source[t.id] = [];
      released.forEach(dance => {
        judges.forEach(j => {
          const m = scores[dance.id]?.[j.id]?.[t.id];
          source[t.id].push(typeof m === 'number' ? m : 0);
        });
      });
    });
    return source;
  };

  const released = dances.filter(d => releasedDances[d.id]);

  return (
    <div className="space-y-8 mt-12">
      <div className="bg-white shadow-sm sm:rounded-3xl p-8 border border-stone-200/60">
         
          <div className="space-y-12">
            {/* Quick Legend */}
            {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <h4 className="text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">Sum of Places</h4>
                <p className="text-[10px] text-stone-400">Total of ranks across all dances. Lower is better.</p>
              </div>
              <div className="bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Rule 10 (Multi)</h4>
                <p className="text-[10px] text-emerald-700/60">Comparing counts of specific placements across dances.</p>
              </div>
              <div className="bg-violet-50/50 p-4 rounded-2xl border border-violet-100">
                <h4 className="text-[10px] font-black text-violet-600 uppercase tracking-widest mb-2">Rule 11 Resolution</h4>
                <p className="text-[10px] text-violet-700/60">Comparing placements as marks using Majority logic.</p>
              </div>
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-100">
                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Grand Tabulation</h4>
                <p className="text-[10px] text-amber-700/60">Pooling ALL individual judge marks from ALL dances.</p>
              </div>
            </div> */}

            {/* 1. Final Summary Table (Overall Results) */}
            {released.length > 0 && (selectedDanceName === 'Overall Standings' || !isAnimationOn) && (
              <div className="animate-in fade-in duration-500">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px flex-grow bg-stone-200"></div>
                  <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest">Overall Standings</h3>
                  <div className="h-px flex-grow bg-stone-200"></div>
                </div>
                <div className="overflow-x-auto bg-stone-50/50 rounded-2xl border border-stone-200 p-2">
                  <table className="w-full text-xs text-center border-separate border-spacing-0.5">
                    <thead>
                      <tr className="text-stone-500 font-bold">
                        <th className="p-3 text-left bg-white rounded-tl-xl border border-stone-200">Rank</th>
                        <th className="p-3 text-left bg-white border border-stone-200">Team</th>
                        {released.map(dance => (
                          <th key={dance.id} className="p-3 bg-white border border-stone-200">{dance.name}</th>
                        ))}
                        <th className="p-3 bg-stone-100 text-stone-900 border border-stone-200">Total Sum</th>
                        <th className="p-3 bg-violet-600 text-white rounded-tr-xl">Result Logic</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.sort((a,b) => a.finalRank - b.finalRank).map(res => {
                        const resInfo = getResolutionText(res);
                        return (
                          <tr key={res.coupleId} className="bg-white hover:bg-violet-50/50 transition-colors">
                            <td className="p-3 text-left font-black text-stone-900 border border-stone-200">{formatRank(res.finalRank)}</td>
                            <td className="p-3 text-left font-bold text-stone-700 border border-stone-200">{getTeamName(res.coupleId)}</td>
                            {released.map(dance => (
                              <td key={dance.id} className="p-3 text-stone-600 border border-stone-200">
                                {formatRank(res.dancePlacements[dance.id])}
                              </td>
                            ))}
                            <td className="p-3 font-black text-stone-900 bg-stone-100/50 border border-stone-200">{res.totalScore}</td>
                            <td className="p-3 text-right border border-stone-200">
                              <div className="flex flex-col items-end">
                                <span className={`text-[10px] font-black uppercase ${resInfo.color}`}>{resInfo.label}</span>
                                <span className="text-[8px] text-stone-400 italic leading-tight">{resInfo.desc}</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}





            {(selectedDanceName !== 'Overall Standings' || !isAnimationOn) &&<div className="flex items-center gap-4">
              <div className="h-px flex-grow bg-stone-200"></div>
              <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest">Individual Dance Tabulations</h3>
              <div className="h-px flex-grow bg-stone-200"></div>
            </div>}
            
            {released.map(dance => (
              (selectedDanceName === dance.name || !isAnimationOn) ?(<div key={dance.id}>
                {renderTabulationTable(
                  `Dance: ${dance.name}`, 
                  judges.map((_, i) => `J${i+1}`), 
                  danceResults[dance.id] || [], 
                  getDanceMarksSource(dance.id),
                  Math.floor(judges.length / 2) + 1
                )}
              </div>) : null
            ))}


            {released.length > 1 && !isAnimationOn && (
              <>
                <div className="flex items-center gap-4 pt-10">
                  <div className="h-px flex-grow bg-stone-200"></div>
                  <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest">Multi-Dance Tie-Breakers</h3>
                  <div className="h-px flex-grow bg-stone-200"></div>
                </div>

                {/* Rule 10 Multi */}
                <div>
                  <h3 className="text-lg font-bold text-emerald-600 mb-4 flex items-center gap-3">
                    <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
                    Rule 10: Placement Counts (Multi-Dance)
                  </h3>
                  <div className="overflow-x-auto bg-stone-50 rounded-2xl border border-stone-200 p-2">
                    <table className="w-full text-[10px] sm:text-xs text-center border-separate border-spacing-0.5">
                      <thead>
                        <tr className="text-stone-500 font-bold">
                          <th className="p-2 text-left bg-white rounded-tl-xl border border-stone-200">Cpl</th>
                          {released.map(d => (
                            <th key={d.id} className="p-2 bg-white border border-stone-200">{d.name.substring(0,3)}</th>
                          ))}
                          {Array.from({length: teams.length}, (_, i) => (
                            <th key={i} className="p-2 bg-emerald-50 text-emerald-700 border border-stone-200">1-{i+1}</th>
                          ))}
                          <th className="p-2 bg-violet-50 text-violet-900 rounded-tr-xl border border-stone-200">Sum</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-200">
                        {results.sort((a,b) => a.totalScore - b.totalScore || a.finalRank - b.finalRank).map(r => {
                          const marks = released.map(d => r.dancePlacements[d.id]);
                          return (
                            <tr key={r.coupleId} className="hover:bg-white group">
                              <td className="p-2 text-left font-bold text-stone-700 bg-white border border-stone-200">{getTeamName(r.coupleId)}</td>
                              {marks.map((m, i) => (
                                <td key={i} className="p-2 text-stone-400 border border-stone-200">{formatRank(m)}</td>
                              ))}
                              {Array.from({length: teams.length}, (_, i) => {
                                const colRank = i + 1;
                                const count = marks.filter(m => m <= colRank).length;
                                const sum = marks.filter(m => m <= colRank).reduce((a, b) => a + b, 0);
                                return (
                                  <td key={i} className="p-2 border border-stone-200 text-stone-600">
                                    <div className="flex flex-col items-center">
                                      <span>{count}</span>
                                      <span className="text-[8px] opacity-40">({sum})</span>
                                    </div>
                                  </td>
                                );
                              })}
                              <td className="p-2 font-black text-violet-900 bg-violet-50 border border-stone-200">
                                {r.totalScore}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* <div className="mt-10">
                  {renderTabulationTable(
                    "Rule 11: Majority Check (Multi-Dance)", 
                    released.map((d, i) => `D${i+1}`), 
                    results, 
                    getRule11MarksSource(),
                    Math.floor(released.length / 2) + 1
                  )}
                </div> */}

                <div className="mt-10">
                  {renderTabulationTable(
                    "Rule 11: Grand Tabulation: All Marks Pool", 
                    Array.from({length: Math.min(10, released.length * judges.length)}, (_, i) => `M${i+1}`).concat(released.length * judges.length > 10 ? ['...'] : []), 
                    results, 
                    getGrandTabulationSource(),
                    Math.floor((released.length * judges.length) / 2) + 1
                  )}
                </div>
              </>
            )}
          </div>
        
      </div>
    </div>
  );
}
