"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { Dance, EventData, Judge, Team, JudgingFormat, Placement, FinalResult, Rankings } from '@/types/types';
import { motion } from 'framer-motion';
import { Icon } from '@/components/Icon';
import Image from 'next/image';
import { calculateDancePlacements, calculateFinalResults } from '@/services/skatingSystem';
import SkatingBreakdown from './SkatingBreakdown';

export default function DisplayCompResults(props: {
  name: string;
  scores: EventData['scores'];
  teams: Team[];
  dances: Dance[];
  judges: Judge[];
  selectedDanceId: string;
  judgingFormat?: JudgingFormat;
  finalized?: EventData['finalized'];
  releasedDances?: EventData['releasedDances'];
}) {
  if (props.judgingFormat === 'Final') {
    return <FinalResultsSkating {...props} />;
  }
  return <OriginalResults {...props} />;
}

function useAutoScroll(containerRef: React.RefObject<HTMLDivElement | null>, contentRef: React.RefObject<HTMLDivElement | null>, dependency: any) {
  useEffect(() => {
    let animationFrameId: number;
    let startTime: number | null = null;
    let direction = 1; // 1 for down, -1 for up
    const scrollSpeed = 0.03; // pixels per millisecond - slower for readability

    const scroll = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const deltaTime = timestamp - startTime;

      if (containerRef.current && contentRef.current) {
        const containerHeight = containerRef.current.clientHeight;
        const contentHeight = contentRef.current.scrollHeight;
        const maxScroll = contentHeight - containerHeight;

        if (maxScroll > 0) {
          let currentScroll = containerRef.current.scrollTop;
          currentScroll += direction * scrollSpeed * 16; // use ~16ms as base frame time
          
          if (currentScroll >= maxScroll) {
            currentScroll = maxScroll;
            direction = -1;
            startTime = timestamp + 2000; // Pause at bottom
          } else if (currentScroll <= 0) {
            currentScroll = 0;
            direction = 1;
            startTime = timestamp + 2000; // Pause at top
          }

          if (timestamp > (startTime || 0)) {
            containerRef.current.scrollTop = currentScroll;
          }
        }
      }
      
      startTime = timestamp;
      animationFrameId = requestAnimationFrame(scroll);
    };

    // Delay start slightly to allow for layout to settle
    const timeoutId = setTimeout(() => {
        animationFrameId = requestAnimationFrame(scroll);
    }, 1000);

    return () => {
      cancelAnimationFrame(animationFrameId);
      clearTimeout(timeoutId);
    };
  }, [dependency, containerRef, contentRef]);
}

function FinalResultsSkating({
  name,
  scores,
  teams,
  dances,
  judges,
  selectedDanceId,
  finalized = {},
  releasedDances = {}
}: {
  name: string;
  scores: EventData['scores'];
  teams: Team[];
  dances: Dance[];
  judges: Judge[];
  selectedDanceId: string;
  finalized?: EventData['finalized'];
  releasedDances?: EventData['releasedDances'];
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { teamScores, danceResults, finalResults } = useMemo(() => {
    if (teams.length === 0 || judges.length === 0) return { teamScores: [], danceResults: {}, finalResults: [] };

    // 1. Calculate placements for each dance
    const allDanceResults: Record<string, Placement[]> = {};
    dances.forEach(dance => {
      if (!releasedDances[dance.id]) return;
      
      const danceScores = scores[dance.id] || {};
      const danceFinalized = finalized[dance.id] || {};
      
      // We only calculate if ALL judges have finalized this dance
      const isAllFinalized = judges.every(j => danceFinalized[j.id]);
      if (!isAllFinalized) return;

      // Extract raw rankings for this dance (Judge ID -> Team ID -> Rank)
      const rankingsForDance: Record<string, Record<string, number>> = {};
      judges.forEach(j => {
        rankingsForDance[j.id] = {};
        teams.forEach(t => {
          const val = danceScores[j.id]?.[t.id];
          rankingsForDance[j.id][t.id] = typeof val === 'number' ? val : teams.length + 1;
        });
      });

      allDanceResults[dance.id] = calculateDancePlacements(rankingsForDance, teams, judges.length);
    });

    // 2. Calculate final results using Skating System (Rule 10, 11, etc.)
    const rawRankings: Rankings = {};
    dances.forEach(d => {
      rawRankings[d.id] = {};
      judges.forEach(j => {
        rawRankings[d.id][j.id] = {};
        teams.forEach(t => {
            const val = scores[d.id]?.[j.id]?.[t.id];
            rawRankings[d.id][j.id][t.id] = typeof val === 'number' ? val : teams.length + 1;
        });
      });
    });

    const finalResults = calculateFinalResults(
      allDanceResults,
      teams,
      dances.filter(d => releasedDances[d.id] && allDanceResults[d.id]),
      rawRankings,
      judges.map(j => j.id)
    );

    // 3. Adapt for the UI leaderboard and track
    let processedResults;
    if (selectedDanceId === 'all') {
      processedResults = finalResults.map(fr => {
        const team = teams.find(t => t.id === fr.coupleId)!;
        return {
          ...team,
          score: fr.totalScore, // Total sum of places
          rank: fr.finalRank,
          isTie: !Number.isInteger(fr.finalRank)
        };
      });
    } else {
      const resultsForDance = allDanceResults[selectedDanceId] || [];
      processedResults = resultsForDance.map(dr => {
        const team = teams.find(t => t.id === dr.coupleId)!;
        return {
          ...team,
          score: dr.rank, // Use rank as "score" for the horse track
          rank: dr.rank,
          isTie: dr.isTie
        };
      });
    }

    // Assign medals based on rank
    const resultsWithMedals = processedResults.map(res => {
        let medal: 'gold' | 'silver' | 'bronze' = 'bronze';
        const rank = Math.floor(res.rank);
        if (rank <= 3) medal = 'gold';
        else if (rank <= 6) medal = 'silver';
        return { ...res, medal };
    });

    return { 
        teamScores: resultsWithMedals.sort((a,b) => a.rank - b.rank), 
        danceResults: allDanceResults, 
        finalResults 
    };
  }, [teams, judges, dances, scores, finalized, releasedDances, selectedDanceId]);

  useAutoScroll(scrollContainerRef, contentRef, teamScores.length);

  if (dances.length === 0 || teamScores.length === 0) {
    return <PendingResults />;
  }

  // For the horse track in Skating system, LOWER rank is BETTER.
  // We need to invert it for the visualization so 1st place is at the front.
  const maxRank = teams.length + 1;
  
  return (
    <div ref={scrollContainerRef} className="w-full h-full overflow-y-auto scrollbar-hide p-2">
      <div ref={contentRef} className="space-y-8 pb-10">
        <ResultsHeader name={name} selectedDanceName={dances.find(d => d.id === selectedDanceId)?.name || 'Overall Standings'} />
        
        <div className="bg-white shadow-sm sm:rounded-3xl p-8 border border-stone-200/60">
            <div className="relative pt-10 pb-14 px-6 border-2 border-dashed border-stone-200 rounded-3xl bg-stone-50/50 overflow-hidden">
                <FinishLine />
                <div className="space-y-8 relative z-10">
                {teamScores.map((team) => {
                    // Invert rank for percentage: 1st place -> ~90%, Last place -> ~10%
                    const percentage = ((maxRank - team.rank) / maxRank) * 88;

                    return (
                    <div key={team.id} className="relative h-16 flex items-center">
                        <div className="absolute left-0 right-0 h-1.5 bg-stone-200 rounded-full top-1/2 -translate-y-1/2"></div>
                        <motion.div
                        initial={{ left: 0 }}
                        animate={{ left: `${percentage}%` }}
                        transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                        className="absolute flex flex-col items-center -translate-y-1/2 top-1/2"
                        >
                        <TeamAvatar team={team} displayValue={formatRank(team.rank)} />
                        <div className="mt-2 bg-white px-3 py-1 rounded-full shadow-sm border border-stone-100 text-xs font-bold text-stone-700 whitespace-nowrap">
                            {team.name}
                        </div>
                        </motion.div>
                    </div>
                    );
                })}
                </div>
            </div>
        </div>

        <LeaderboardTable teamScores={teamScores} scoreLabel={selectedDanceId === 'all' ? "Sum of Places" : "Rank"} />
        
        <SkatingBreakdown 
            name={name}
            teams={teams}
            dances={dances}
            judges={judges}
            scores={scores}
            finalized={finalized}
            releasedDances={releasedDances}
            danceResults={danceResults}
            finalResults={finalResults}
        />
      </div>
    </div>
  );
}

function OriginalResults({
  name,
  scores,
  teams,
  dances,
  judges,
  selectedDanceId,
  finalized = {},
  releasedDances = {}
}: {
  name: string;
  scores: EventData['scores'];
  teams: Team[];
  dances: Dance[];
  judges: Judge[];
  selectedDanceId: string;
  finalized?: EventData['finalized'];
  releasedDances?: EventData['releasedDances'];
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const teamScores = useMemo(() => {
    if (teams.length === 0 || judges.length === 0) return [];

    const results = teams.map((team) => {
      let total = 0;
      const calcTeamScore = (danceId: string) => {
        if (!releasedDances[danceId]) return 0;
        const danceScores = scores[danceId] || {};
        const danceFinalized = finalized[danceId] || {};
        let teamTotal = 0;
        judges.forEach((judge) => {
          if (danceFinalized[judge.id]) {
            const score = danceScores[judge.id]?.[team.id];
            if (score === 'gold') teamTotal += 3;
            else if (score === 'silver') teamTotal += 2;
            else if (score === 'bronze') teamTotal += 1;
          }
        });
        return teamTotal;
      };

      if (selectedDanceId === 'all') {
        dances.forEach((dance) => {
          total += calcTeamScore(dance.id);
        });
      } else {
        total += calcTeamScore(selectedDanceId);
      }
      return { ...team, score: total };
    });

    results.sort((a, b) => b.score - a.score);
    const hasReleasedData = selectedDanceId === 'all' 
      ? Object.values(releasedDances).some(v => v === true)
      : releasedDances[selectedDanceId] === true;

    if (!hasReleasedData) return [];

    let currentRank = 1;
    return results.map((team, index) => {
      if (index > 0 && team.score < results[index - 1].score) {
        currentRank = index + 1;
      }
      let medal: 'gold' | 'silver' | 'bronze' = 'bronze';
      if (currentRank <= 3) medal = 'gold';
      else if (currentRank <= 6) medal = 'silver';
      return { ...team, medal, rank: currentRank };
    });
  }, [selectedDanceId, teams, dances, judges, scores, finalized, releasedDances]);

  useAutoScroll(scrollContainerRef, contentRef, teamScores.length);

  if (teamScores.length === 0) {
    return <PendingResults />;
  }

  const maxActualScore = Math.max(...teamScores.map((t) => t.score), 1);

  return (
    <div ref={scrollContainerRef} className="w-full h-full overflow-y-auto scrollbar-hide p-2">
      <div ref={contentRef} className="space-y-8 pb-10">
        <ResultsHeader name={name} selectedDanceName={dances.find(d => d.id === selectedDanceId)?.name || 'Overall Standings'} />
        <div className="bg-white shadow-sm sm:rounded-3xl p-8 border border-stone-200/60">
            <div className="relative pt-10 pb-14 px-6 border-2 border-dashed border-stone-200 rounded-3xl bg-stone-50/50 overflow-hidden">
                <FinishLine />
                <div className="space-y-8 relative z-10">
                {teamScores.map((team) => {
                    const percentage = (team.score / maxActualScore) * 88;
                    return (
                    <div key={team.id} className="relative h-16 flex items-center">
                        <div className="absolute left-0 right-0 h-1.5 bg-stone-200 rounded-full top-1/2 -translate-y-1/2"></div>
                        <motion.div
                        initial={{ left: 0 }}
                        animate={{ left: `${percentage}%` }}
                        transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                        className="absolute flex flex-col items-center -translate-y-1/2 top-1/2"
                        >
                        <TeamAvatar team={team} displayValue={team.rank.toString()} />
                        <div className="mt-2 bg-white px-3 py-1 rounded-full shadow-sm border border-stone-100 text-xs font-bold text-stone-700 whitespace-nowrap">
                            {team.name} ({team.score} pts)
                        </div>
                        </motion.div>
                    </div>
                    );
                })}
                </div>
            </div>
        </div>
        <LeaderboardTable teamScores={teamScores} scoreLabel="Points" />
      </div>
    </div>
  );
}

// SHARED SUB-COMPONENTS
function ResultsHeader({ name, selectedDanceName }: { name: string, selectedDanceName: string }) {
  return (
    <div className="bg-white shadow-sm sm:rounded-3xl p-8 border border-stone-200/60 flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
      <h2 className="text-3xl font-bold text-stone-900 tracking-tight flex items-center">
        <Icon name="Flag" className="mr-3 h-7 w-7 text-violet-600" />
        {name}
      </h2>
      <p className="block w-full sm:w-64 pl-4 pr-10 py-3 text-base bg-stone-50 font-medium rounded-xl border border-stone-100">
        {selectedDanceName}
      </p>
    </div>
  );
}

function FinishLine() {
  return (
    <div className="absolute right-10 top-0 bottom-0 w-3 bg-red-500 z-0 flex flex-col items-center justify-center opacity-40">
      <div className="h-full w-full" style={{ backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, white 10px, white 20px)' }}></div>
    </div>
  );
}

function TeamAvatar({ team, displayValue }: { team: any, displayValue: string }) {
  return (
    <div className="relative h-14 w-14 rounded-full border-4 shadow-lg flex items-center justify-center bg-white z-10" style={{ borderColor: team.color }}>
      {team.logo ? (
        <Image src={team.logo} alt={team.name} width={56} height={56} className="h-full w-full rounded-full object-cover" unoptimized />
      ) : (
        <span className="text-stone-800 font-bold text-sm">{team.name.substring(0, 2).toUpperCase()}</span>
      )}
      <div className="absolute -top-2 -right-2 h-7 w-7 rounded-full flex items-center justify-center shadow-md border-2 border-white"
        style={{ backgroundColor: team.medal === 'gold' ? '#FBBF24' : team.medal === 'silver' ? '#9CA3AF' : '#D97706' }}>
        <span className="text-white text-xs font-bold">{displayValue}</span>
      </div>
    </div>
  );
}

function LeaderboardTable({ teamScores, scoreLabel }: { teamScores: any[], scoreLabel: string }) {
  return (
    <div className="bg-white shadow-sm overflow-hidden sm:rounded-3xl border border-stone-200/60">
      <div className="px-6 py-5 border-b border-stone-100 bg-stone-50/50">
        <h3 className="text-xl font-bold text-stone-900">Leaderboard</h3>
      </div>
      <ul className="divide-y divide-stone-100">
        {teamScores.map((team) => (
          <li key={team.id} className="px-6 py-5 flex items-center justify-between hover:bg-stone-50 transition-colors">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm"
                style={{ backgroundColor: team.medal === 'gold' ? '#FBBF24' : team.medal === 'silver' ? '#9CA3AF' : '#D97706' }}>
                {formatRank(team.rank)}
              </div>
              <div className="ml-5 flex items-center">
                <div className="h-10 w-10 rounded-full mr-4 border-2 shadow-sm" style={{ borderColor: team.color, backgroundColor: team.color }}>
                  {team.logo && <Image src={team.logo} alt="" width={40} height={40} className="h-full w-full rounded-full object-cover" unoptimized />}
                </div>
                <p className="text-lg font-bold text-stone-900">{team.name}</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold bg-violet-100 text-violet-800">
                {team.score} {scoreLabel}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PendingResults() {
  return (
    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-stone-200">
      <div className="mx-auto w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-4">
        <Icon name="Activity" className="h-10 w-10 text-amber-500 animate-pulse" />
      </div>
      <h3 className="text-xl font-bold text-stone-900">Results Pending</h3>
      <p className="mt-2 text-stone-500 max-w-sm mx-auto">Waiting for all judges to finalize their results for this selection.</p>
    </div>
  );
}

function formatRank(rank: number) {
    if (Number.isInteger(rank)) return rank.toString();
    return rank.toFixed(2).replace(/\.?0+$/, "");
}
