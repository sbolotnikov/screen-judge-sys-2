import { Placement, FinalResult, Rankings, Team, Dance } from '@/types/types';

/**
 * Helper to filter marks that are equal to or better than a specific rank.
 * In the Skating System, "better" means a smaller number (e.g., 1 is better than 2).
 */
const getMarksForMajority = (marks: number[], rank: number) => marks.filter(m => m <= rank);

/**
 * CORE SKATING SYSTEM LOGIC (Standard Rule 10 / Rule 11 Base)
 */
export const performSkatingLogic = (
  coupleMarks: Record<string, number[]>,
  couples: { id: string }[],
  totalMarksPerCouple: number,
  startRank: number
): Placement[] => {
  // A "Majority" is defined as more than half of the judges (e.g., 2 out of 3, 3 out of 5).
  const majority = Math.floor(totalMarksPerCouple / 2) + 1;
  const placements: Placement[] = [];
  const placedCouples = new Set<string>();
  let nextRankToAssign = startRank;

  // We continue until every couple has been assigned a placement.
  while (placedCouples.size < couples.length) {
    const unplacedCouples = couples.filter(c => !placedCouples.has(c.id));
    if (unplacedCouples.length === 0) break;

    let foundWinner = false;

    for (let currentColumn = 1; currentColumn <= couples.length; currentColumn++) {
      let candidates: { coupleId: string; majorityCount: number; majoritySum: number }[] = [];

      // Check each unplaced couple to see if they have a majority in the current column range.
      for (const couple of unplacedCouples) {
        const marks = coupleMarks[couple.id];
        const majorityMarks = getMarksForMajority(marks, currentColumn);
        if (majorityMarks.length >= majority) {
          candidates.push({
            coupleId: couple.id,
            majorityCount: majorityMarks.length,
            majoritySum: majorityMarks.reduce((a, b) => a + b, 0),
          });
        }
      }

      if (candidates.length > 0) {
        candidates.sort((a, b) => {
          if (a.majorityCount !== b.majorityCount) return b.majorityCount - a.majorityCount;
          return a.majoritySum - b.majoritySum;
        });

        const best = candidates[0];
        let tiedWinners = candidates.filter(c => 
          c.majorityCount === best.majorityCount && 
          c.majoritySum === best.majoritySum
        );

        if (tiedWinners.length > 1) {
          for (let nextCol = currentColumn + 1; nextCol <= couples.length; nextCol++) {
            const nextCheck = tiedWinners.map(tw => {
              const marks = coupleMarks[tw.coupleId];
              const majorityMarks = getMarksForMajority(marks, nextCol);
              return {
                coupleId: tw.coupleId,
                majorityCount: majorityMarks.length,
                majoritySum: majorityMarks.reduce((a, b) => a + b, 0),
              };
            });

            nextCheck.sort((a, b) => {
              if (a.majorityCount !== b.majorityCount) return b.majorityCount - a.majorityCount;
              return a.majoritySum - b.majoritySum;
            });

            const nextBest = nextCheck[0];
            const stillTied = nextCheck.filter(c => 
              c.majorityCount === nextBest.majorityCount && 
              c.majoritySum === nextBest.majoritySum
            );

            if (stillTied.length < tiedWinners.length) {
              tiedWinners = tiedWinners.filter(tw => stillTied.some(st => st.coupleId === tw.coupleId));
              if (tiedWinners.length === 1) break;
            }
          }
        }

        const numWinners = tiedWinners.length;
        const finalRankValue = numWinners > 1 
          ? nextRankToAssign + (1 / numWinners)
          : nextRankToAssign;

        tiedWinners.forEach(winner => {
          const original = candidates.find(c => c.coupleId === winner.coupleId)!;
          placements.push({
            coupleId: winner.coupleId,
            rank: finalRankValue,
            marks: coupleMarks[winner.coupleId].sort((a, b) => a - b),
            majorityCount: original.majorityCount,
            majoritySum: original.majoritySum,
            isTie: numWinners > 1,
          });
          placedCouples.add(winner.coupleId);
        });

        nextRankToAssign += numWinners;
        foundWinner = true;
        break; 
      }
    }

    if (!foundWinner) {
      unplacedCouples.forEach(c => {
        placements.push({
          coupleId: c.id,
          rank: nextRankToAssign,
          marks: coupleMarks[c.id].sort((a, b) => a - b),
          majorityCount: 0,
          majoritySum: 0,
        });
        placedCouples.add(c.id);
        nextRankToAssign++;
      });
    }
  }

  return placements;
};

/**
 * Calculates placements for a single dance.
 */
export const calculateDancePlacements = (
  rankingsForDance: Record<string, Record<string, number>>,
  couples: Team[],
  judgesCount: number
): Placement[] => {
  if (Object.keys(rankingsForDance).length < judgesCount || couples.length === 0) {
    return [];
  }

  const coupleMarks: Record<string, number[]> = {};
  couples.forEach(c => {
    coupleMarks[c.id] = [];
    Object.values(rankingsForDance).forEach(judgeRanking => {
      const rank = judgeRanking[c.id];
      coupleMarks[c.id].push(typeof rank === 'number' && rank > 0 ? rank : couples.length + 1);
    });
  });

  return performSkatingLogic(coupleMarks, couples.map(c => ({ id: c.id })), judgesCount, 1).sort((a, b) => a.rank - b.rank);
};

/**
 * MULTI-DANCE RULE 10 (Tie-breaking based on dance placements)
 */
const resolveMultiDanceTieRule10 = (
  group: any[],
  dances: string[],
  startRank: number,
  maxPlace: number
): { coupleId: string; rank: number; isTie: boolean }[] => {
  if (group.length === 0) return [];
  if (group.length === 1) return [{ coupleId: group[0].coupleId, rank: startRank, isTie: false }];

  for (let p = 1; p <= maxPlace; p++) {
    const stats = group.map(c => {
      const marks = dances.map(d => c.dancePlacements[d]);
      const betterMarks = marks.filter(m => m <= p);
      return { 
        coupleId: c.coupleId, 
        count: betterMarks.length, 
        sum: betterMarks.reduce((a, b) => a + b, 0) 
      };
    });

    stats.sort((a, b) => {
      if (a.count !== b.count) return b.count - a.count;
      return a.sum - b.sum;
    });

    const best = stats[0];
    const winners = stats.filter(s => s.count === best.count && s.sum === best.sum);

    if (winners.length < group.length) {
      const winnerIds = winners.map(w => w.coupleId);
      const winnerGroup = group.filter(c => winnerIds.includes(c.coupleId));
      const loserGroup = group.filter(c => !winnerIds.includes(c.coupleId));

      return [
        ...resolveMultiDanceTieRule10(winnerGroup, dances, startRank, maxPlace),
        ...resolveMultiDanceTieRule10(loserGroup, dances, startRank + winners.length, maxPlace)
      ];
    }
  }

  const tieRank = startRank + (1 / group.length);
  return group.map(c => ({ coupleId: c.coupleId, rank: tieRank, isTie: true }));
};

/**
 * FINAL RESULTS CALCULATION (Multi-Dance Standings)
 */
export const calculateFinalResults = (
  allDanceResults: Record<string, Placement[]>,
  couples: Team[] | { id: string | number }[],
  dances: (Dance | string)[],
  rawRankings: Rankings,
  judges: (string | number)[]
): FinalResult[] => {
  if (couples.length === 0) return [];
  
  const danceIds = dances.map(d => typeof d === 'string' ? d : d.id);

  const summaries = couples.map(c => {
    let total = 0;
    const dancePlacements: Record<string, number> = {};
    danceIds.forEach(danceId => {
      const p = allDanceResults[danceId]?.find(dp => String(dp.coupleId) === String(c.id));
      const rank = p ? p.rank : couples.length + 1;
      dancePlacements[danceId] = rank;
      total += rank;
    });
    return { coupleId: String(c.id), totalScore: total, dancePlacements };
  });

  summaries.sort((a, b) => a.totalScore - b.totalScore);

  const finalResults: FinalResult[] = [];
  let i = 0;
  while (i < summaries.length) {
    let j = i;
    while (j + 1 < summaries.length && summaries[j+1].totalScore === summaries[i].totalScore) {
      j++;
    }

    const tiedGroup = summaries.slice(i, j + 1);
    const startRank = i + 1;

    if (tiedGroup.length === 1) {
      finalResults.push({ ...tiedGroup[0], finalRank: startRank });
    } else {
      const rule10Results = resolveMultiDanceTieRule10(tiedGroup, danceIds, startRank, couples.length);
      
      const r10Groups: Record<number, string[]> = {};
      rule10Results.forEach(r => {
        const rKey = Number(r.rank.toFixed(4)); // Use fixed precision for grouping
        if (!r10Groups[rKey]) r10Groups[rKey] = [];
        r10Groups[rKey].push(r.coupleId);
      });

      rule10Results.forEach(r10 => {
        const original = tiedGroup.find(tg => tg.coupleId === r10.coupleId)!;
        const groupAtThisRank = r10Groups[Number(r10.rank.toFixed(4))];

        if (groupAtThisRank.length === 1) {
          finalResults.push({
            ...original,
            finalRank: r10.rank,
            rule10Resolution: { rank: r10.rank, isTie: false }
          });
        } else {
          const contestedCouples = tiedGroup.filter(tg => groupAtThisRank.includes(tg.coupleId));
          const rule11Marks: Record<string, number[]> = {};
          contestedCouples.forEach(cc => {
            rule11Marks[cc.coupleId] = danceIds.map(d => cc.dancePlacements[d]);
          });

          const r11Placements = performSkatingLogic(
            rule11Marks, 
            contestedCouples.map(cc => ({ id: cc.coupleId })), 
            danceIds.length, 
            Math.floor(r10.rank)
          );

          const rule11StillTied: Record<number, string[]> = {};
          r11Placements.forEach(p => {
            const pKey = Number(p.rank.toFixed(4));
            if (!rule11StillTied[pKey]) rule11StillTied[pKey] = [];
            rule11StillTied[pKey].push(p.coupleId);
          });

          const p = r11Placements.find(rp => rp.coupleId === r10.coupleId)!;
          const r11GroupAtThisRank = rule11StillTied[Number(p.rank.toFixed(4))];

          if (r11GroupAtThisRank.length === 1) {
            finalResults.push({
              ...original,
              finalRank: p.rank,
              rule10Resolution: { rank: r10.rank, isTie: true },
              rule11Resolution: {
                placementsAsMarks: rule11Marks[p.coupleId].sort((a,b)=>a-b),
                tieBreakRank: p.rank,
                majorityCount: p.majorityCount,
                majoritySum: p.majoritySum,
              }
            });
          } else {
            const grandContestedCouples = contestedCouples.filter(cc => r11GroupAtThisRank.includes(cc.coupleId));
            const grandMarks: Record<string, number[]> = {};
            grandContestedCouples.forEach(cc => {
              grandMarks[cc.coupleId] = [];
              danceIds.forEach(danceId => {
                judges.forEach(jid => {
                  const m = rawRankings[danceId]?.[jid]?.[cc.coupleId];
                  grandMarks[cc.coupleId].push(typeof m === 'number' ? m : couples.length + 1);
                });
              });
            });

            const grandPlacements = performSkatingLogic(
              grandMarks,
              grandContestedCouples.map(cc => ({ id: cc.coupleId })),
              danceIds.length * judges.length,
              Math.floor(p.rank)
            );

            const grandResult = grandPlacements.find(gp => gp.coupleId === r10.coupleId)!;
            
            finalResults.push({
              ...original,
              finalRank: grandResult.rank,
              rule10Resolution: { rank: r10.rank, isTie: true },
              rule11Resolution: {
                placementsAsMarks: rule11Marks[p.coupleId].sort((a,b)=>a-b),
                tieBreakRank: grandResult.rank,
                majorityCount: grandResult.majorityCount,
                majoritySum: grandResult.majoritySum,
              }
            });
          }
        }
      });
    }
    i = j + 1;
  }

  return finalResults.sort((a, b) => a.finalRank - b.finalRank);
};
