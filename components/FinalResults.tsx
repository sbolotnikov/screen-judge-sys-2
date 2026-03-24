
import React, { useState } from 'react';
import { Event, Couple, Placement, Judge, FinalResult } from '../types';

interface FinalResultsProps {
  event: Event;
  onBackToDashboard: () => void;
}

/**
 * FINAL RESULTS COMPONENT
 * 
 * This component displays the definitive standings of a multi-dance event.
 * It includes a matrix of dance results, a summary of total scores, and
 * a "Logic" breakdown for transparency on how ties were resolved.
 */
const FinalResults: React.FC<FinalResultsProps> = ({ event, onBackToDashboard }) => {
  const { 
    finalResults: results, 
    couples, 
    dances, 
    name: eventName,
    judges,
    rankings,
    danceResults
  } = event;

  const [showBreakdown, setShowBreakdown] = useState(false);

  /**
   * Helper to retrieve a couple's display name from their ID.
   */
  const getCoupleName = (id: number) => couples.find(c => c.id === id)?.name || `Couple ${id}`;

  /**
   * Formats ranks for display.
   * Ranks like 1.5 are shown as "1.5". Ranks like 1.333333 are shown as "1.33".
   */
  const formatRank = (rank: number) => {
    if (Number.isInteger(rank)) return rank.toString();
    return rank.toFixed(2).replace(/\.?0+$/, "");
  };

  /**
   * Generates a human-readable explanation of why a couple received their specific rank.
   * This helps the user understand which tie-breaking rule was applied.
   * 
   * @param result The final calculated result for a single couple.
   * @returns An object containing the label, color, and description for the UI.
   */
  const getResolutionText = (result: FinalResult) => {
    // If the rank has decimals, it remains tied after all possible tie-breaks.
    if (!Number.isInteger(result.finalRank)) {
      return { 
        label: "Unbreakable Tie", 
        color: "text-slate-500", 
        desc: "Mathematically identical results after all multi-dance tie-breaks." 
      };
    }
    
    // Check if other couples have the same total score (Sum of Places).
    const contested = results.filter(r => r.totalScore === result.totalScore && r.coupleId !== result.coupleId);
    if (contested.length === 0) {
      return { 
        label: "Clear Standing", 
        color: "text-emerald-400", 
        desc: "Unique total score; no tie-break needed." 
      };
    }

    if (result.rule10Resolution && !result.rule10Resolution.isTie) {
      return { 
        label: "Rule 10 Resolved", 
        color: "text-emerald-400", 
        desc: "Initially tied on sum; resolved via Rule 10 (Placement Counts)." 
      };
    }

    // If there was a contested score but the rank is an integer, Rule 11 or Grand Tabulation broke it.
    if (result.rule11Resolution) {
      return { 
        label: "Tie Resolved", 
        color: "text-sky-400", 
        desc: "Initially tied on sum; resolved via Rule 11 (Sum of Places) or Grand Tabulation." 
      };
    }

    return { label: "Standard Calculation", color: "text-emerald-400", desc: "Unique standing." };
  };

  /**
   * Helper to get majority count and sum for tabulation tables.
   * This is used to render the columns (1-1, 1-2, 1-3, etc.) in the detailed breakdown.
   * 
   * @param coupleId The ID of the couple.
   * @param columnRank The column we are checking (e.g., 2 means checking 1st and 2nd places).
   * @param marksSource The dictionary of marks (could be judge marks, or placements as marks).
   * @returns An object with the `count` of marks <= columnRank, and the `sum` of those marks.
   */
  const getTabulationData = (coupleId: number, columnRank: number, marksSource: Record<number, number[]>) => {
    const marks = marksSource[coupleId] || [];
    const count = marks.filter(m => m > 0 && m <= columnRank).length;
    const sum = marks.filter(m => m > 0 && m <= columnRank).reduce((a, b) => a + b, 0);
    return { count, sum };
  };

  /**
   * CORE UI COMPONENT: TABULATION TABLE
   * Renders a Skating System tabulation (Rule 10, Rule 11, or Grand Tabulation).
   * 
   * This function creates a detailed table showing exactly how a tie was broken.
   * It displays the raw marks, and then the column-by-column majority checks (1-1, 1-2, 1-3...).
   * 
   * @param title The title of the table (e.g., "Rule 11 Resolution").
   * @param colHeaders The headers for the raw marks (e.g., ["Waltz", "Tango"]).
   * @param rowPlacements The array of placements to render as rows.
   * @param marksSource The raw marks used for the calculation.
   * @param majority The number of marks required to form a majority.
   */
  const renderTabulationTable = (
    title: string, 
    colHeaders: string[], 
    rowPlacements: any[], 
    marksSource: Record<number, number[]>,
    majority: number
  ) => {
    const placementMap = new Map<number, number>();
    rowPlacements.forEach(r => placementMap.set(r.coupleId, Math.floor(r.rank || r.finalRank)));

    return (
      <div className="mb-10 animate-in fade-in slide-in-from-left-4 duration-500">
        <h3 className="text-lg font-bold text-sky-400 mb-4 flex items-center gap-3">
          <span className="w-1.5 h-6 bg-sky-500 rounded-full"></span>
          {title}
        </h3>
        <div className="overflow-x-auto bg-slate-900/40 rounded-2xl border border-slate-700/50 p-2">
          <table className="w-full text-[10px] sm:text-xs text-center border-separate border-spacing-0.5">
            <thead>
              <tr className="text-slate-500 font-bold">
                <th className="p-2 text-left bg-slate-900 rounded-tl-xl">Cpl</th>
                {colHeaders.map((h, i) => (
                  <th key={i} className="p-2 bg-slate-900">{h}</th>
                ))}
                {/* Skating system columns (Majority check) */}
                {Array.from({length: couples.length}, (_, i) => (
                  <th key={i} className="p-2 bg-slate-800 text-sky-300">1-{i+1}</th>
                ))}
                <th className="p-2 bg-indigo-900/30 text-white rounded-tr-xl">Place</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {rowPlacements.sort((a,b) => (a.rank || a.finalRank) - (b.rank || b.finalRank)).map(r => {
                const rankValue = r.rank || r.finalRank;
                const baseRank = Math.floor(rankValue);
                const marks = marksSource[r.coupleId] || [];
                return (
                  <tr key={r.coupleId} className="hover:bg-slate-700/20 group">
                    <td className="p-2 text-left font-bold text-slate-300 bg-slate-900/40">{getCoupleName(r.coupleId)}</td>
                    {/* Individual marks */}
                    {marks.map((m, i) => (
                      <td key={i} className="p-2 text-slate-400 border-l border-slate-700/20">
                        {m || '-'}
                      </td>
                    ))}
                    {/* Tabulation logic columns (1-1, 1-2, 1-3, etc.) */}
                    {Array.from({length: couples.length}, (_, i) => {
                      const colRank = i + 1;
                      const data = getTabulationData(r.coupleId, colRank, marksSource);
                      
                      // If the column rank is greater than the couple's final base rank, 
                      // it means they already won a majority in an earlier column, 
                      // so we dim this cell to reduce visual noise.
                      const isAfterPlaced = colRank > baseRank;
                      
                      // Highlight the cell if the couple achieved a majority in this column.
                      const hasMajority = data.count >= majority;

                      return (
                        <td 
                          key={i} 
                          className={`p-2 border-l border-slate-700/20 transition-all ${isAfterPlaced ? 'opacity-10 bg-slate-950/40' : hasMajority ? 'bg-emerald-500/10 text-emerald-400 font-bold' : 'text-slate-600'}`}
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
                    <td className="p-2 font-black text-white bg-indigo-600/10 border-l border-slate-700/30 group-hover:bg-indigo-600/30">
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

  /**
   * GENERATE CSV REPORT
   * This builds a multi-section CSV including all requested data.
   */
  const handleDownloadCSV = () => {
    let csvContent = `EVENT REPORT: ${eventName}\n\n`;

    // SECTION 1: FINAL STANDINGS
    csvContent += "SECTION 1: FINAL OVERALL STANDINGS\n";
    csvContent += `Rank,Couple Name,Total Score,${dances.join(",")},Tie-Break Details\n`;
    results.sort((a, b) => a.finalRank - b.finalRank).forEach(res => {
      const resData = getResolutionText(res);
      const danceScores = dances.map(d => formatRank(res.dancePlacements[d])).join(",");
      csvContent += `${formatRank(res.finalRank)},"${getCoupleName(res.coupleId)}",${res.totalScore},${danceScores},${resData.label}: ${resData.desc}\n`;
    });

    // SECTION 2: CONTESTED PLACEMENTS (Breaking down ties)
    csvContent += "\n\nSECTION 2: CONTESTED PLACEMENTS & RESOLUTIONS\n";
    csvContent += "Contested Total Score,Contesting Couples,Tie-Break Path,Outcome (Rankings)\n";
    
    const contestedGroups: Record<number, number[]> = {};
    results.forEach(r => {
      if (!contestedGroups[r.totalScore]) contestedGroups[r.totalScore] = [];
      contestedGroups[r.totalScore].push(r.coupleId);
    });

    Object.entries(contestedGroups).forEach(([score, cids]) => {
      if (cids.length > 1) {
        const couplesList = cids.map(id => getCoupleName(id)).join(" & ");
        const resolvedRanks = cids.map(id => {
            const r = results.find(res => res.coupleId === id);
            return r ? formatRank(r.finalRank) : "?";
        }).join(", ");
        
        csvContent += `${score},"${couplesList}",Rule 11 (Places as Marks) -> Grand Tabulation,"Outcome: ${resolvedRanks}"\n`;
      }
    });

    // SECTION 3: INDIVIDUAL DANCES
    csvContent += "\n\nSECTION 3: INDIVIDUAL DANCE BREAKDOWN\n";
    dances.forEach(dance => {
      csvContent += `\nDANCE: ${dance.toUpperCase()}\n`;
      csvContent += "Dance Rank,Couple Name," + judges.map(j => `Judge: ${j.name}`).join(",") + "\n";
      
      const danceRes = [...(danceResults[dance] || [])].sort((a,b) => a.rank - b.rank);
      danceRes.forEach(r => {
        const jMarks = judges.map(j => rankings[dance]?.[j.id]?.[r.coupleId] || "-").join(",");
        csvContent += `${formatRank(r.rank)},"${getCoupleName(r.coupleId)}",${jMarks}\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${eventName.replace(/\s+/g, '_')}_full_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /**
   * Export the entire event as JSON (useful for backup or moving between devices).
   */
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(event, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `${eventName.replace(/\s+/g, '_')}_data.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  /**
   * Logic source helpers for breakdowns.
   */
  const getDanceMarksSource = (dance: string) => {
    const source: Record<number, number[]> = {};
    couples.forEach(c => {
      source[c.id] = judges.map(j => rankings[dance]?.[j.id]?.[c.id] || 0);
    });
    return source;
  };

  const getRule11MarksSource = () => {
    const source: Record<number, number[]> = {};
    couples.forEach(c => {
      source[c.id] = dances.map(dance => {
        const p = danceResults[dance]?.find(dr => dr.coupleId === c.id);
        return p ? p.rank : couples.length + 1;
      });
    });
    return source;
  };

  const getGrandTabulationSource = () => {
    const source: Record<number, number[]> = {};
    couples.forEach(c => {
      source[c.id] = [];
      dances.forEach(dance => {
        judges.forEach(j => {
          source[c.id].push(rankings[dance]?.[j.id]?.[c.id] || 0);
        });
      });
    });
    return source;
  };

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-12 flex flex-col items-center">
      <div className="w-full max-w-7xl bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-sky-600/20 to-indigo-600/20 p-8 border-b border-slate-700">
          <h1 className="text-4xl sm:text-5xl font-black text-center text-white mb-2 tracking-tight">Final Standings</h1>
          <p className="text-center text-sky-400 font-bold uppercase tracking-widest text-sm">{eventName}</p>
        </div>
        
        <div className="p-6 sm:p-8">
          {/* Quick Legend for Users */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
              <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Sum of Places</h4>
              <p className="text-xs text-slate-300">Total of ranks across all dances. Lower is better.</p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
              <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Rule 10 (Multi)</h4>
              <p className="text-xs text-slate-300">Comparing counts of specific placements across dances.</p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
              <h4 className="text-[10px] font-black text-sky-500 uppercase tracking-widest mb-2">Rule 11 Resolution</h4>
              <p className="text-xs text-slate-300">Comparing *placements as marks* using Majority logic.</p>
            </div>
            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/50">
              <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Grand Tabulation</h4>
              <p className="text-xs text-slate-300">Extended Rule 11: Pooling ALL individual judge marks from ALL dances.</p>
            </div>
          </div>

          {/* Main Standings Table */}
          <div className="overflow-x-auto mb-10">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-2 text-center">Rank</th>
                  <th className="px-6 py-2">Couple</th>
                  {dances.map(dance => (
                    <th key={dance} className="px-6 py-2 text-center">{dance}</th>
                  ))}
                  <th className="px-6 py-2 text-center">Total Sum</th>
                  <th className="px-6 py-2 text-right">Standing Logic</th>
                </tr>
              </thead>
              <tbody>
                {results.map(result => {
                  const resText = getResolutionText(result);
                  return (
                    <tr key={result.coupleId} className="group transition-all hover:bg-slate-700/50">
                      <td className="bg-slate-900/50 group-hover:bg-indigo-600/20 px-6 py-4 rounded-l-2xl border-y border-l border-slate-700">
                        <div className="flex flex-col items-center">
                          <span className="text-3xl font-black text-white">{formatRank(result.finalRank)}</span>
                        </div>
                      </td>
                      <td className="bg-slate-900/50 px-6 py-4 border-y border-slate-700">
                        <span className="text-lg font-bold text-slate-200">{getCoupleName(result.coupleId)}</span>
                      </td>
                      {dances.map(dance => (
                        <td key={`${dance}-${result.coupleId}`} className="bg-slate-900/50 px-6 py-4 text-center border-y border-slate-700">
                          <span className="text-slate-400 font-semibold">{formatRank(result.dancePlacements[dance]) || '-'}</span>
                        </td>
                      ))}
                      <td className="bg-slate-900/50 px-6 py-4 text-center border-y border-slate-700">
                        <span className="text-xl font-black text-sky-400">{result.totalScore}</span>
                      </td>
                      <td className="bg-slate-900/50 px-6 py-4 text-right rounded-r-2xl border-y border-r border-slate-700">
                        <div className="flex flex-col items-end">
                          <span className={`text-[10px] font-black uppercase tracking-tighter ${resText.color}`}>{resText.label}</span>
                          <span className="text-[9px] text-slate-500 italic max-w-[150px] text-right leading-tight mt-0.5">{resText.desc}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center items-center gap-4 mb-12">
            <button onClick={onBackToDashboard} className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all">
              Dashboard
            </button>
            <button onClick={() => setShowBreakdown(!showBreakdown)} className="px-6 py-3 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-400 border border-indigo-500/30 font-bold rounded-xl transition-all">
              {showBreakdown ? 'Hide' : 'View'} Full Calculation Breakdown
            </button>
            <button onClick={handleDownloadCSV} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition-all">
              Download Full CSV Report
            </button>
            <button onClick={handleExportJSON} className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg transition-all">
              Export Results JSON
            </button>
          </div>

          {/* Hidden Breakdown Logic */}
          {showBreakdown && (
            <div className="mt-8 space-y-12">
              <div className="flex items-center gap-4">
                <div className="h-px flex-grow bg-slate-700"></div>
                <h2 className="text-2xl font-black text-slate-500 uppercase tracking-tighter">Individual Dance Results (Rule 10)</h2>
                <div className="h-px flex-grow bg-slate-700"></div>
              </div>
              
              {dances.map(dance => (
                <div key={dance}>
                  {renderTabulationTable(
                    `Dance Breakdown: ${dance}`, 
                    judges.map(j => `J: ${j.name}`), 
                    danceResults[dance] || [], 
                    getDanceMarksSource(dance),
                    Math.floor(judges.length / 2) + 1
                  )}
                </div>
              ))}

              <div className="flex items-center gap-4 pt-10">
                <div className="h-px flex-grow bg-slate-700"></div>
                <h2 className="text-2xl font-black text-slate-500 uppercase tracking-tighter">Rule 11: Multi-Dance Comparison</h2>
                <div className="h-px flex-grow bg-slate-700"></div>
              </div>

              <div className="text-xs text-slate-400 mb-4 px-4 bg-slate-900/30 p-4 rounded-xl border border-slate-700/50">
                <p className="font-bold text-sky-400 mb-1">Calculation Logic:</p>
                Rule 11 treats the ranks obtained in each dance as if they were marks from different judges. 
                If three dances were performed, it's as if there were 3 judges providing the results. 
                The standard Skating System (majority count) is then applied to these "marks".
              </div>

              {renderTabulationTable(
                "Rule 11 Tabulation (Sum of Places Comparison)", 
                dances.map((d, i) => `Dance ${i+1}`), 
                results, 
                getRule11MarksSource(),
                Math.floor(dances.length / 2) + 1
              )}

              <div className="flex items-center gap-4 pt-10">
                <div className="h-px flex-grow bg-slate-700"></div>
                <h2 className="text-2xl font-black text-slate-500 uppercase tracking-tighter">Rule 11 Extended: Grand Tabulation</h2>
                <div className="h-px flex-grow bg-slate-700"></div>
              </div>

              <div className="text-xs text-slate-400 mb-4 px-4 bg-slate-900/30 p-4 rounded-xl border border-slate-700/50">
                <p className="font-bold text-amber-400 mb-1">Last Resort Logic (Pooled Marks):</p>
                Grand Tabulation treats all marks from all judges across all dances as one massive pool. 
                For a 5-dance competition with 7 judges, this creates a pool of 35 marks per couple. 
                The tie is finally resolved here unless the pool of marks is mathematically identical.
              </div>

              {renderTabulationTable(
                "Grand Tabulation (All Raw Marks Pool)", 
                Array.from({length: dances.length * judges.length}, (_, i) => `Mark ${i+1}`), 
                results, 
                getGrandTabulationSource(),
                Math.floor((dances.length * judges.length) / 2) + 1
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinalResults;
