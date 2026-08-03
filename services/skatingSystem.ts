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
  startRank: number,
  maxPlacementColumn: number = couples.length,
  startPlacementColumn: number = 1
): Placement[] => {
  // A "Majority" is defined as more than half of the judges (e.g., 2 out of 3, 3 out of 5).
  const majority = Math.floor(totalMarksPerCouple / 2) + 1;
  const placements: Placement[] = [];
  const placedCouples = new Set<string>();
  const lastComparedColumn: Record<string, number> = {};
  let nextRankToAssign = startRank;

  // We continue until every couple has been assigned a placement.
  while (placedCouples.size < couples.length) {
    const unplacedCouples = couples.filter(c => !placedCouples.has(c.id));
    if (unplacedCouples.length === 0) break;

    let foundWinner = false;

    // Once a place is awarded, the next couple must be tested from the next
    // occupied place (e.g. after awarding 4th, begin the next pass at 1-5).
    const firstColumnForThisPlace = Math.max(startPlacementColumn, Math.ceil(nextRankToAssign));
    for (let currentColumn = firstColumnForThisPlace; currentColumn <= maxPlacementColumn; currentColumn++) {
      let candidates: { coupleId: string; majorityCount: number; majoritySum: number }[] = [];

      // Check each unplaced couple to see if they have a majority in the current column range.
      for (const couple of unplacedCouples) {
        lastComparedColumn[couple.id] = Math.max(lastComparedColumn[couple.id] ?? 0, currentColumn);
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
        let decisionColumn = currentColumn;
        let tiedWinners = candidates.filter(c => 
          c.majorityCount === best.majorityCount && 
          c.majoritySum === best.majoritySum
        );

        if (tiedWinners.length > 1) {
          for (let nextCol = currentColumn + 1; nextCol <= maxPlacementColumn; nextCol++) {
            decisionColumn = nextCol;
            const nextCheck = tiedWinners.map(tw => {
              lastComparedColumn[tw.coupleId] = Math.max(
                lastComparedColumn[tw.coupleId] ?? 0,
                nextCol
              );
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
          ? nextRankToAssign + ((numWinners - 1) / 2)
          : nextRankToAssign;

        tiedWinners.forEach(winner => {
          const decidingMarks = getMarksForMajority(
            coupleMarks[winner.coupleId],
            decisionColumn
          );
          placements.push({
            coupleId: winner.coupleId,
            rank: finalRankValue,
            marks: coupleMarks[winner.coupleId].sort((a, b) => a - b),
            majorityCount: decidingMarks.length,
            majoritySum: decidingMarks.reduce((a, b) => a + b, 0),
            decisionColumn: Math.max(decisionColumn, lastComparedColumn[winner.coupleId] ?? 0),
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
          decisionColumn: lastComparedColumn[c.id] ?? maxPlacementColumn,
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
const getRule10Leaders = (
  group: any[],
  dances: string[],
  placeUnderReview: number
): string[] => {
  const stats = group.map(c => {
    const betterMarks = dances
      .map(d => c.dancePlacements[d])
      .filter(m => m <= placeUnderReview);
    return {
      coupleId: c.coupleId,
      count: betterMarks.length,
      sum: betterMarks.reduce((a, b) => a + b, 0),
    };
  }).sort((a, b) => b.count - a.count || a.sum - b.sum);

  const best = stats[0];
  return stats
    .filter(s => s.count === best.count && s.sum === best.sum)
    .map(s => s.coupleId);
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
      const rule11ContestedIds = new Set<string>();
      const resolveRemainingTie = (group: typeof tiedGroup, placeUnderReview: number): void => {
        if (group.length === 0) return;
        if (group.length === 1) {
          finalResults.push({
            ...group[0],
            finalRank: placeUnderReview,
            rule10Resolution: { rank: placeUnderReview, isTie: false },
            rule11Contested: rule11ContestedIds.has(group[0].coupleId),
          });
          return;
        }

        // Rule 10 considers only the overall place currently being awarded.
        // It must not advance to a lower placement column to break this tie.
        const rule10LeaderIds = getRule10Leaders(group, danceIds, placeUnderReview);
        const rule10Leaders = group.filter(c => rule10LeaderIds.includes(c.coupleId));

        if (rule10Leaders.length === 1) {
          finalResults.push({
            ...rule10Leaders[0],
            finalRank: placeUnderReview,
            rule10Resolution: { rank: placeUnderReview, isTie: false },
            rule11Contested: rule11ContestedIds.has(rule10Leaders[0].coupleId),
          });
          resolveRemainingTie(
            group.filter(c => c.coupleId !== rule10Leaders[0].coupleId),
            placeUnderReview + 1
          );
          return;
        }

        // Rule 11 pools all marks only for the couples still tied by Rule 10.
        const rule11Marks: Record<string, number[]> = {};
        rule10Leaders.forEach(couple => {
          rule11ContestedIds.add(couple.coupleId);
          rule11Marks[couple.coupleId] = [];
          danceIds.forEach(danceId => {
            judges.forEach(jid => {
              const mark = rawRankings[danceId]?.[jid]?.[couple.coupleId];
              rule11Marks[couple.coupleId].push(
                typeof mark === 'number' && mark > 0 ? mark : couples.length + 1
              );
            });
          });
        });

        const rule11Placements = performSkatingLogic(
          rule11Marks,
          rule10Leaders.map(c => ({ id: c.coupleId })),
          danceIds.length * judges.length,
          placeUnderReview,
          couples.length,
          placeUnderReview
        );
        const winningRank = Math.min(...rule11Placements.map(p => p.rank));
        // When the last two couples are tied, Rule 11 awards both occupied
        // places. For larger groups it awards only the next place before the
        // remaining couples return to Rule 10.
        const rule11Winners = rule10Leaders.length === 2
          ? rule11Placements
          : rule11Placements.filter(p => p.rank === winningRank);
        const winnerIds = new Set(rule11Winners.map(p => p.coupleId));

        rule11Winners.forEach(p => {
          const original = group.find(c => c.coupleId === p.coupleId)!;
          finalResults.push({
            ...original,
            finalRank: p.rank,
            rule10Resolution: { rank: placeUnderReview, isTie: true },
            rule11Contested: true,
            rule11Resolution: {
              placementsAsMarks: [...rule11Marks[p.coupleId]].sort((a,b) => a - b),
              tieBreakRank: p.rank,
              majorityCount: p.majorityCount,
              majoritySum: p.majoritySum,
            }
          });
        });

        // With more than two tied couples, Rule 11 awards only the position
        // under review. All remaining couples go back to Rule 10.
        resolveRemainingTie(
          group.filter(c => !winnerIds.has(c.coupleId)),
          placeUnderReview + rule11Winners.length
        );
      };

      resolveRemainingTie(tiedGroup, startRank);
    }
    i = j + 1;
  }

  return finalResults.sort((a, b) => a.finalRank - b.finalRank);
};
