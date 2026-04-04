'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { animate } from 'framer-motion';
import {
  Dance,
  EventData,
  Judge,
  Team,
  JudgingFormat,
  Placement,
  FinalResult,
  Rankings,
} from '@/types/types';
import { motion } from 'framer-motion';
import { Icon } from '@/components/Icon';
import Image from 'next/image';
import {
  calculateDancePlacements,
  calculateFinalResults,
} from '@/services/skatingSystem';
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
  isAnimationOn?: boolean;
}) {
  if (props.judgingFormat === 'Final') {
    return <FinalResultsSkating {...props} />;
  }
  return <OriginalResults {...props} />;
}

function useAutoScroll(
  containerRef: React.RefObject<HTMLDivElement | null>,
  contentRef: React.RefObject<HTMLDivElement | null>,
  isAnimationOn: boolean = true,
  dependency: any,
  danceId: string,
  eventName: string,
) {
  useEffect(() => {
    let stopped = false;
    if (!isAnimationOn) return;
    let currentAnimation: { stop: () => void } | null = null;

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => setTimeout(resolve, ms));

    const run = async () => {
      // Wait for layout to settle and refs to be assigned
      let retries = 0;
      while (retries < 10 && (!containerRef.current || !contentRef.current)) {
        await sleep(500);
        retries++;
        if (stopped) return;
      }

      const container = containerRef.current;
      const content = contentRef.current;
      if (!container || !content) return;

      // Small additional delay to ensure images/content are fully rendered
      await sleep(1000);
      if (stopped) return;

      while (!stopped) {
        const maxScroll = content.scrollHeight - container.clientHeight;

        if (maxScroll <= 0) {
          // If no scroll needed, wait and check again later (maybe content changed)
          await sleep(2000);
          continue;
        }

        const speed = 40; // Reduced speed for better readability
        const duration = maxScroll / speed;

        // Scroll down
        await new Promise<void>((resolve) => {
          currentAnimation = animate(container.scrollTop, maxScroll, {
            duration,
            ease: 'linear',
            onUpdate: (v) => {
              if (container) container.scrollTop = v;
            },
            onComplete: resolve,
          });
        });

        if (stopped) break;
        await sleep(3000); // pause at bottom
        if (stopped) break;

        // Scroll back up
        await new Promise<void>((resolve) => {
          currentAnimation = animate(maxScroll, 0, {
            duration,
            ease: 'linear',
            onUpdate: (v) => {
              if (container) container.scrollTop = v;
            },
            onComplete: resolve,
          });
        });

        if (stopped) break;
        await sleep(3000); // pause at top
      }
    };

    run();

    return () => {
      stopped = true;
      currentAnimation?.stop();
    };
  }, [dependency, isAnimationOn, danceId, eventName, containerRef, contentRef]);
}

function FinalResultsSkating({
  name,
  scores,
  teams,
  dances,
  judges,
  selectedDanceId,
  finalized = {},
  releasedDances = {},
  isAnimationOn = true,
}: {
  name: string;
  scores: EventData['scores'];
  teams: Team[];
  dances: Dance[];
  judges: Judge[];
  selectedDanceId: string;
  finalized?: EventData['finalized'];
  releasedDances?: EventData['releasedDances'];
  isAnimationOn?: boolean;
}) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const { teamScores, danceResults, finalResults } = useMemo(() => {
    if (teams.length === 0 || judges.length === 0)
      return { teamScores: [], danceResults: {}, finalResults: [] };

    const allDanceResults: Record<string, Placement[]> = {};
    dances.forEach((dance) => {
      if (!releasedDances[dance.id]) return;

      const danceScores = scores[dance.id] || {};
      const danceFinalized = finalized[dance.id] || {};

      const isAllFinalized = judges.every((j) => danceFinalized[j.id]);
      if (!isAllFinalized) return;

      const rankingsForDance: Record<string, Record<string, number>> = {};
      judges.forEach((j) => {
        rankingsForDance[j.id] = {};
        teams.forEach((t) => {
          const val = danceScores[j.id]?.[t.id];
          rankingsForDance[j.id][t.id] =
            typeof val === 'number' ? val : teams.length + 1;
        });
      });

      allDanceResults[dance.id] = calculateDancePlacements(
        rankingsForDance,
        teams,
        judges.length,
      );
    });

    const rawRankings: Rankings = {};
    dances.forEach((d) => {
      rawRankings[d.id] = {};
      judges.forEach((j) => {
        rawRankings[d.id][j.id] = {};
        teams.forEach((t) => {
          const val = scores[d.id]?.[j.id]?.[t.id];
          rawRankings[d.id][j.id][t.id] =
            typeof val === 'number' ? val : teams.length + 1;
        });
      });
    });

    const finalResults = calculateFinalResults(
      allDanceResults,
      teams,
      dances.filter((d) => releasedDances[d.id] && allDanceResults[d.id]),
      rawRankings,
      judges.map((j) => j.id),
    );

    let processedResults;
    if (selectedDanceId === 'all') {
      processedResults = finalResults.map((fr) => {
        const team = teams.find((t) => t.id === fr.coupleId)!;
        return {
          ...team,
          score: fr.totalScore,
          rank: fr.finalRank,
          isTie: !Number.isInteger(fr.finalRank),
        };
      });
    } else {
      const resultsForDance = allDanceResults[selectedDanceId] || [];
      processedResults = resultsForDance.map((dr) => {
        const team = teams.find((t) => t.id === dr.coupleId)!;
        return {
          ...team,
          score: dr.rank,
          rank: dr.rank,
          isTie: dr.isTie,
        };
      });
    }

    const resultsWithMedals = processedResults.map((res) => {
      let medal: 'gold' | 'silver' | 'bronze' = 'bronze';
      const rank = Math.floor(res.rank);
      if (rank <= 3) medal = 'gold';
      else if (rank <= 6) medal = 'silver';
      return { ...res, medal };
    });

    return {
      teamScores: resultsWithMedals.sort((a, b) => a.rank - b.rank),
      danceResults: allDanceResults,
      finalResults,
    };
  }, [
    teams,
    judges,
    dances,
    scores,
    finalized,
    releasedDances,
    selectedDanceId,
  ]);

  useAutoScroll(
    scrollContainerRef,
    contentRef,
    isAnimationOn,
    teamScores.length,
    selectedDanceId,
    name,
  );

  if (dances.length === 0 || teamScores.length === 0) {
    return <PendingResults />;
  }

  const maxRank = teams.length + 1;

  return (
    <div
      ref={scrollContainerRef}
      className="w-full h-screen overflow-y-auto scrollbar-hide p-2"
    >
      <div ref={contentRef} className="space-y-8 pb-10">
        <ResultsHeader
          name={name}
          selectedDanceName={
            dances.find((d) => d.id === selectedDanceId)?.name ||
            'Overall Standings'
          }
        />

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
          isAnimationOn={isAnimationOn}
          selectedDanceName={
            dances.find((d) => d.id === selectedDanceId)?.name ||
            'Overall Standings'
          }
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
  releasedDances = {},
  isAnimationOn = true,
}: {
  name: string;
  scores: EventData['scores'];
  teams: Team[];
  dances: Dance[];
  judges: Judge[];
  selectedDanceId: string;
  finalized?: EventData['finalized'];
  releasedDances?: EventData['releasedDances'];
  isAnimationOn?: boolean;
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
    const hasReleasedData =
      selectedDanceId === 'all'
        ? Object.values(releasedDances).some((v) => v === true)
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
  }, [
    selectedDanceId,
    teams,
    dances,
    judges,
    scores,
    finalized,
    releasedDances,
  ]);

  useAutoScroll(
    scrollContainerRef,
    contentRef,
    isAnimationOn,
    teamScores.length,
    selectedDanceId,
    name,
  );

  if (teamScores.length === 0) {
    return <PendingResults />;
  }

  const maxActualScore = Math.max(...teamScores.map((t) => t.score), 1);

  return (
    <div
      ref={scrollContainerRef}
      className="w-full h-screen overflow-y-auto scrollbar-hide p-2"
    >
      <div ref={contentRef} className="space-y-8 pb-10">
        <ResultsHeader
          name={name}
          selectedDanceName={
            dances.find((d) => d.id === selectedDanceId)?.name ||
            'Overall Standings'
          }
        />
        <div className="bg-white shadow-sm sm:rounded-3xl p-8 border border-stone-200/60">
          <div className="relative pt-10 pb-14 px-6 border-2 border-dashed border-stone-200 rounded-3xl bg-stone-50/50 overflow-hidden">
            <StartLine />
            <FinishLine />
            <div className="space-y-8 relative z-10">
              {teamScores.map((team) => {
                const percentage = (team.score / maxActualScore) * 75 + 10;
                return (
                  <div
                    key={team.id}
                    className="relative h-25 flex items-center"
                  >
                    <div className="absolute left-0 right-0 h-1.5 bg-stone-200 rounded-full top-1/2 -translate-y-1/2"></div>
                    <motion.div
                      initial={{ left: 0 }}
                      animate={{ left: `${percentage}%` }}
                      transition={{
                        type: 'spring',
                        stiffness: 50,
                        damping: 15,
                      }}
                      className="absolute flex flex-col items-center -translate-y-1/2 -translate-x-1/2 top-1/2"
                    >
                      <TeamAvatar
                        team={team}
                        displayValue={team.rank.toString()}
                      />
                      <div className="-mt-4 bg-white px-3 py-1 rounded-full shadow-sm border border-stone-100 text-5xl font-bold text-stone-700 whitespace-nowrap">
                        <span className='text-shadow-lg text-shadow-gray-500' style={{ color: team.color }}>{team.name}</span> (
                        {team.score} pts)
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
function ResultsHeader({
  name,
  selectedDanceName,
}: {
  name: string;
  selectedDanceName: string;
}) {
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
    <div className="absolute right-5 top-0 bottom-0 w-12 bg-gray-300 z-0 flex flex-col items-center justify-around opacity-50 overflow-hidden py-4">
      <div
        className="h-full w-full absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent, transparent 10px, white 10px, white 20px)',
        }}
      ></div>
      {Array.from({ length: 15 }).map((_, i) => (
        <span
          key={i}
          className="relative z-10 text-5xl m-5 font-black text-red-600 [writing-mode:vertical-rl] rotate-180"
        >
          FINISH
        </span>
      ))}
    </div>
  );
}

function StartLine() {
  return (
    <div className="absolute left-5 top-0 bottom-0 w-12 bg-gray-300 z-0 flex flex-col items-center justify-around opacity-50 overflow-hidden py-4">
      <div
        className="h-full w-full absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg, transparent, transparent 10px, white 10px, white 20px)',
        }}
      ></div>
      {Array.from({ length: 15 }).map((_, i) => (
        <span
          key={i}
          className="relative z-10 text-5xl m-5 font-black text-blue-600 [writing-mode:vertical-rl] rotate-180"
        >
          START
        </span>
      ))}
    </div>
  );
}

function TeamAvatar({
  team,
  displayValue,
}: {
  team: any;
  displayValue: string;
}) {
  return (
    <div
      className="relative h-24 w-24 rounded-full border-4 shadow-lg flex items-center justify-center bg-white z-10"
      style={{ borderColor: team.color }}
    >
      {team.logo ? (
        <Image
          src={team.logo}
          alt={team.name}
          width={56}
          height={56}
          className="h-full w-full rounded-full object-cover"
          unoptimized
        />
      ) : (
        <span className="text-stone-800 font-bold text-sm">
          {team.name.substring(0, 2).toUpperCase()}
        </span>
      )}
      <div
        className="absolute -top-2 -right-2 h-7 w-7 rounded-full flex items-center justify-center shadow-md border-2 border-white"
        style={{
          backgroundColor:
            team.medal === 'gold'
              ? '#FBBF24'
              : team.medal === 'silver'
                ? '#9CA3AF'
                : '#D97706',
        }}
      >
        <span className="text-white text-xs font-bold">{displayValue}</span>
      </div>
    </div>
  );
}

function LeaderboardTable({
  teamScores,
  scoreLabel,
}: {
  teamScores: any[];
  scoreLabel: string;
}) {
  return (
    <div className="bg-white shadow-sm overflow-hidden sm:rounded-3xl border border-stone-200/60">
      <div className="px-6 py-5 border-b border-stone-100 bg-stone-50/50">
        <h3 className="text-6xl font-bold text-stone-900">Leaderboard</h3>
      </div>
      <ul className="divide-y divide-stone-100">
        {teamScores.map((team) => (
          <li
            key={team.id}
            className="px-6 py-5 flex items-center justify-between hover:bg-stone-50 transition-colors"
          >
            <div className="flex items-center">
              <div
                className="shrink-0 h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-4xl shadow-sm"
                style={{
                  backgroundColor:
                    team.medal === 'gold'
                      ? '#FBBF24'
                      : team.medal === 'silver'
                        ? '#9CA3AF'
                        : '#D97706',
                }}
              >
                {formatRank(team.rank)}
              </div>
              <div className="ml-5 flex items-center">
                <div
                  className="h-20 w-20 rounded-full mr-4 border-2 shadow-sm"
                  style={{
                    borderColor: team.color,
                    backgroundColor: team.color,
                  }}
                >
                  {team.logo && (
                    <Image
                      src={team.logo}
                      alt=""
                      width={260}
                      height={260}
                      className="h-full w-full rounded-full object-cover"
                      unoptimized
                    />
                  )}
                </div>
                <p className='text-shadow-lg text-shadow-gray-500 text-5xl font-bold' style={{ color: team.color }}>{team.name}</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="inline-flex items-center px-4 py-1.5 rounded-full text-5xl font-bold bg-violet-100 text-violet-800">
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
        <Icon
          name="Activity"
          className="h-10 w-10 text-amber-500 animate-pulse"
        />
      </div>
      <h3 className="text-xl font-bold text-stone-900">Results Pending</h3>
      <p className="mt-2 text-stone-500 max-w-sm mx-auto">
        Waiting for all judges to finalize their results for this selection.
      </p>
    </div>
  );
}

function formatRank(rank: number) {
  if (Number.isInteger(rank)) return rank.toString();
  return rank.toFixed(2).replace(/\.?0+$/, '');
}
