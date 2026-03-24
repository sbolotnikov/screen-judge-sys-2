
import { Placement, Couple, FinalResult, Rankings } from '../types/types2';

/**
 * Helper to filter marks that are equal to or better than a specific rank.
 * In the Skating System, "better" means a smaller number (e.g., 1 is better than 2).
 */
const getMarksForMajority = (marks: number[], rank: number) => marks.filter(m => m <= rank);

/**
 * CORE SKATING SYSTEM LOGIC (Standard Rule 10 / Rule 11 Base)
 * 
 * This function calculates the placements for a set of couples based on their marks.
 * It is the fundamental algorithm of the Skating System, used for:
 * 1. Calculating individual dance placements (where marks are from judges).
 * 2. Breaking multi-dance ties via Rule 11 (where marks are the placements from each dance).
 * 3. Breaking multi-dance ties via Grand Tabulation (where marks are all raw judge marks pooled together).
 * 
 * The algorithm works by checking "columns" of marks.
 * - Column 1: How many 1st place marks did the couple get?
 * - Column 2: How many 1st and 2nd place marks did the couple get? (1-2)
 * - Column 3: How many 1st, 2nd, and 3rd place marks did the couple get? (1-3)
 * ...and so on.
 * 
 * A couple needs a "Majority" of marks in a column to be considered for a placement.
 * 
 * @param coupleMarks A mapping of couple IDs to their array of marks (ranks from judges or dances).
 * @param couples The list of couples being ranked.
 * @param totalMarksPerCouple Total number of marks assigned to each couple (used to calculate majority).
 * @param startRank The starting rank to assign (e.g., if we are breaking a tie for 3rd, startRank is 3).
 * 
 * CUSTOM TIE FORMULA:
 * Per user request, if a tie occurs within a dance and cannot be broken mathematically, 
 * the rank assigned is: rank = contested_place + (1 / number_of_contesting_couples)
 * Example: Two couples tied for 1st receive 1.5 (1 + 1/2). 
 * This maintains the mathematical "average" while distinguishing ties from clear wins.
 */
export const performSkatingLogic = (
  coupleMarks: Record<number, number[]>,
  couples: { id: number }[],
  totalMarksPerCouple: number,
  startRank: number
): Placement[] => {
  // A "Majority" is defined as more than half of the judges (e.g., 2 out of 3, 3 out of 5).
  const majority = Math.floor(totalMarksPerCouple / 2) + 1;
  const placements: Placement[] = [];
  const placedCouples = new Set<number>();
  let nextRankToAssign = startRank;

  // We continue until every couple has been assigned a placement.
  while (placedCouples.size < couples.length) {
    const unplacedCouples = couples.filter(c => !placedCouples.has(c.id));
    if (unplacedCouples.length === 0) break;

    let foundWinner = false;

    /**
     * RULE 10 (Single Dance) / RULE 11 (Multi-Dance): WE CHECK COLUMNS SEQUENTIALLY (1, 1-2, 1-3, etc.)
     * We look for the couple(s) with the most marks in that range.
     * 
     * Example: If currentColumn is 2, we are looking at all marks that are 1 or 2.
     * We count how many of these marks each couple has. If it's >= majority, they are a candidate.
     */
    for (let currentColumn = 1; currentColumn <= couples.length; currentColumn++) {
      let candidates: { coupleId: number; majorityCount: number; majoritySum: number }[] = [];

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

      // If one or more couples found a majority:
      if (candidates.length > 0) {
        /**
         * TIE-BREAKING WITHIN THE COLUMN (When multiple couples have a majority):
         * 1. The couple with the GREATER majority count (more marks in this range) wins.
         *    Example: Couple A has four 1-2 marks. Couple B has three 1-2 marks. Couple A wins.
         * 2. If majority count is equal, the couple with the LOWER sum of those marks wins.
         *    Example: Both have three 1-2 marks. Couple A's marks are 1,1,2 (Sum=4). 
         *             Couple B's marks are 1,2,2 (Sum=5). Couple A wins.
         */
        candidates.sort((a, b) => {
          if (a.majorityCount !== b.majorityCount) return b.majorityCount - a.majorityCount;
          return a.majoritySum - b.majoritySum;
        });

        const best = candidates[0];
        let tiedWinners = candidates.filter(c => 
          c.majorityCount === best.majorityCount && 
          c.majoritySum === best.majoritySum
        );

        /**
         * PERSISTENT TIE-BREAKING (Rule 10/11 continued):
         * If couples are STILL tied after checking count and sum in the current column,
         * we must look ahead to subsequent columns (e.g., if tied in 1-2, we check 1-3, then 1-4).
         * IMPORTANT: We ONLY check the next columns for the couples that are currently tied,
         * and we are looking to see who gets the better count/sum in the next column.
         */
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

            // If the tie is partially broken, narrow down our winners list.
            if (stillTied.length < tiedWinners.length) {
              tiedWinners = tiedWinners.filter(tw => stillTied.some(st => st.coupleId === tw.coupleId));
              if (tiedWinners.length === 1) break;
            }
          }
        }

        const numWinners = tiedWinners.length;
        
        /**
         * ASSIGN FINAL RANK VALUE:
         * Uses the requested formula: contested_rank + (1 / count).
         * If count is 1, it results in the standard integer rank.
         */
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

        // Advance the ranking counter by the number of winners placed.
        nextRankToAssign += numWinners;
        foundWinner = true;
        break; 
      }
    }

    // Safety fallback: if no majority logic works, assign next available ranks.
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
  rankingsForDance: Record<number, Record<number, number>>,
  couples: Couple[],
  judgesCount: number
): Placement[] => {
  if (Object.keys(rankingsForDance).length < judgesCount || couples.length === 0) {
    return [];
  }

  const coupleMarks: Record<number, number[]> = {};
  couples.forEach(c => {
    coupleMarks[c.id] = [];
    Object.values(rankingsForDance).forEach(judgeRanking => {
      const rank = judgeRanking[c.id];
      // Default to last place + 1 if mark is missing.
      coupleMarks[c.id].push(typeof rank === 'number' && rank > 0 ? rank : couples.length + 1);
    });
  });

  return performSkatingLogic(coupleMarks, couples, judgesCount, 1).sort((a, b) => a.rank - b.rank);
};

/**
 * MULTI-DANCE RULE 10 (Tie-breaking based on dance placements)
 * 
 * This rule is invoked when couples have the exact same "Sum of Places" across all dances.
 * Unlike the single-dance Rule 10 (which requires a majority of judges), this multi-dance 
 * Rule 10 does NOT require a majority of dances.
 * 
 * Logic per user request:
 * 1. We start at place p = 1 (1st place).
 * 2. For each tied couple, we count how many times they received place 'p' or better across all dances.
 * 3. The couple with the greater count wins the tie.
 * 4. If the counts are equal, we calculate the sum of those specific placements. The lower sum wins.
 * 5. If they are still equal (same count, same sum), we increment 'p' (e.g., check 1st-2nd places) 
 *    and repeat the process until the tie is broken or we run out of places.
 * 
 * @param group The group of couples currently tied.
 * @param dances The list of dance IDs.
 * @param startRank The rank we are trying to resolve (e.g., tied for 2nd place).
 * @param maxPlace The maximum possible placement (usually the number of couples).
 * @returns An array of resolved ranks for the couples.
 */
const resolveMultiDanceTieRule10 = (
  group: any[],
  dances: string[],
  startRank: number,
  maxPlace: number
): { coupleId: number; rank: number; isTie: boolean }[] => {
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

    // Sort: Higher count first, then lower sum
    stats.sort((a, b) => {
      if (a.count !== b.count) return b.count - a.count;
      return a.sum - b.sum;
    });

    const best = stats[0];
    const winners = stats.filter(s => s.count === best.count && s.sum === best.sum);

    if (winners.length < group.length) {
      // Distinction found
      const winnerIds = winners.map(w => w.coupleId);
      const winnerGroup = group.filter(c => winnerIds.includes(c.coupleId));
      const loserGroup = group.filter(c => !winnerIds.includes(c.coupleId));

      return [
        ...resolveMultiDanceTieRule10(winnerGroup, dances, startRank, maxPlace),
        ...resolveMultiDanceTieRule10(loserGroup, dances, startRank + winners.length, maxPlace)
      ];
    }
  }

  // Still tied after all places
  const tieRank = startRank + (1 / group.length);
  return group.map(c => ({ coupleId: c.coupleId, rank: tieRank, isTie: true }));
};

/**
 * FINAL RESULTS CALCULATION (Multi-Dance Standings)
 * 
 * This function orchestrates the entire multi-dance scoring system, applying rules in strict order.
 * 
 * Rules Hierarchy:
 * 1. SUM OF PLACES (Primary): 
 *    Add up the final ranks a couple received in each dance. Lowest total wins.
 * 
 * 2. RULE 10 (Multi-Dance Tie-Breaker): 
 *    If Sum of Places is equal, compare counts of specific placements across dances (1s, 1-2s, 1-3s).
 *    Greater count wins. If count is equal, lower sum of those placements wins.
 * 
 * 3. RULE 11 (Placements as Marks): 
 *    If Rule 10 fails to break the tie, we treat the dance placements as if they were marks 
 *    from individual judges, and run them through the standard single-dance majority logic.
 * 
 * 4. GRAND TABULATION (Extended Rule 11): 
 *    If Rule 11 still results in a tie, we pool ALL raw marks from ALL judges across ALL dances 
 *    into one massive set of marks, and run the standard single-dance majority logic on that pool.
 */
export const calculateFinalResults = (
  allDanceResults: Record<string, Placement[]>,
  couples: Couple[],
  dances: string[],
  rawRankings: Rankings,
  judges: number[]
): FinalResult[] => {
  if (couples.length === 0) return [];
  
  // Calculate raw sum of places (Primary Standings)
  const summaries = couples.map(c => {
    let total = 0;
    const dancePlacements: Record<string, number> = {};
    dances.forEach(dance => {
      const p = allDanceResults[dance]?.find(dp => dp.coupleId === c.id);
      const rank = p ? p.rank : couples.length + 1;
      dancePlacements[dance] = rank;
      total += rank;
    });
    return { coupleId: c.id, totalScore: total, dancePlacements };
  });

  summaries.sort((a, b) => a.totalScore - b.totalScore);

  const finalResults: FinalResult[] = [];
  let i = 0;
  while (i < summaries.length) {
    let j = i;
    // Identify a group of couples tied with the same total score.
    while (j + 1 < summaries.length && summaries[j+1].totalScore === summaries[i].totalScore) {
      j++;
    }

    const tiedGroup = summaries.slice(i, j + 1);
    const startRank = i + 1;

    if (tiedGroup.length === 1) {
      // Clear win, no tie-break needed.
      finalResults.push({ ...tiedGroup[0], finalRank: startRank });
    } else {
      /**
       * STEP 1: RULE 10 (MULTI-DANCE)
       */
      const rule10Results = resolveMultiDanceTieRule10(tiedGroup, dances, startRank, couples.length);
      
      // Group by rank to see which are still tied
      const r10Groups: Record<number, number[]> = {};
      rule10Results.forEach(r => {
        if (!r10Groups[r.rank]) r10Groups[r.rank] = [];
        r10Groups[r.rank].push(r.coupleId);
      });

      rule10Results.forEach(r10 => {
        const original = tiedGroup.find(tg => tg.coupleId === r10.coupleId)!;
        const groupAtThisRank = r10Groups[r10.rank];

        if (groupAtThisRank.length === 1) {
          // Rule 10 broke the tie
          finalResults.push({
            ...original,
            finalRank: Math.round(r10.rank),
            rule10Resolution: { rank: r10.rank, isTie: false }
          });
        } else {
          /**
           * STEP 2: RULE 11 (PLACEMENTS AS MARKS)
           */
          const contestedCouples = tiedGroup.filter(tg => groupAtThisRank.includes(tg.coupleId));
          const rule11Marks: Record<number, number[]> = {};
          contestedCouples.forEach(cc => {
            rule11Marks[cc.coupleId] = dances.map(d => cc.dancePlacements[d]);
          });

          const r11Placements = performSkatingLogic(
            rule11Marks, 
            contestedCouples.map(cc => ({ id: cc.coupleId })), 
            dances.length, 
            Math.floor(r10.rank)
          );

          // Check for remaining ties after Rule 11.
          const rule11StillTied: Record<number, number[]> = {};
          r11Placements.forEach(p => {
            if (!rule11StillTied[p.rank]) rule11StillTied[p.rank] = [];
            rule11StillTied[p.rank].push(p.coupleId);
          });

          const p = r11Placements.find(rp => rp.coupleId === r10.coupleId)!;
          const r11GroupAtThisRank = rule11StillTied[p.rank];

          if (r11GroupAtThisRank.length === 1) {
            // Rule 11 broke the tie
            finalResults.push({
              ...original,
              finalRank: Math.round(p.rank),
              rule10Resolution: { rank: r10.rank, isTie: true },
              rule11Resolution: {
                placementsAsMarks: rule11Marks[p.coupleId].sort((a,b)=>a-b),
                tieBreakRank: p.rank,
                majorityCount: p.majorityCount,
                majoritySum: p.majoritySum,
              }
            });
          } else {
            /**
             * STEP 3: GRAND TABULATION
             */
            const grandContestedCouples = contestedCouples.filter(cc => r11GroupAtThisRank.includes(cc.coupleId));
            const grandMarks: Record<number, number[]> = {};
            grandContestedCouples.forEach(cc => {
              grandMarks[cc.coupleId] = [];
              dances.forEach(dance => {
                judges.forEach(jid => {
                  grandMarks[cc.coupleId].push(rawRankings[dance]?.[jid]?.[cc.coupleId] || couples.length + 1);
                });
              });
            });

            const grandPlacements = performSkatingLogic(
              grandMarks,
              grandContestedCouples.map(cc => ({ id: cc.coupleId })),
              dances.length * judges.length,
              Math.floor(p.rank)
            );

            // Verify if Grand Tabulation broke the tie.
            const grandStillTied: Record<number, number[]> = {};
            grandPlacements.forEach(gp => {
              if (!grandStillTied[gp.rank]) grandStillTied[gp.rank] = [];
              grandStillTied[gp.rank].push(gp.coupleId);
            });

            const grandResult = grandPlacements.find(gp => gp.coupleId === r10.coupleId)!;
            const isActuallyBroken = grandStillTied[grandResult.rank].length === 1;

            finalResults.push({
              ...original,
              finalRank: isActuallyBroken ? Math.round(grandResult.rank) : grandResult.rank,
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
