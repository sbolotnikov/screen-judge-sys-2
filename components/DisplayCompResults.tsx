"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { Dance, EventData, Judge, Team, JudgingFormat } from '@/types/types';
import { motion, useAnimation } from 'framer-motion';
import { Icon } from '@/components/Icon';
import Image from 'next/image';

/**
 * Display Competition Results Page
 * Displays the final leaderboard and a visual "Horse Track" representation of the scores.
 * Includes an endless auto-scrolling animation.
 */
export default function DisplayCompResults({
  name,
  scores,
  teams,
  dances,
  judges,
  selectedDanceId,
  judgingFormat = 'Original',
  finalized = {},
  releasedDances = {}
}: {
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
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  console.log('Scores:', scores);
  console.log('Finalized:', finalized);
  console.log('Released Dances:', releasedDances);
  useEffect(() => {
    let animationFrameId: number;
    let startTime: number | null = null;
    let direction = 1; // 1 for down, -1 for up
    const scrollSpeed = 0.05; // pixels per millisecond

    const scroll = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;

      if (scrollContainerRef.current && contentRef.current) {
        const containerHeight = scrollContainerRef.current.clientHeight;
        const contentHeight = contentRef.current.scrollHeight;
        const maxScroll = contentHeight - containerHeight;

        if (maxScroll > 0) {
          let currentScroll = scrollContainerRef.current.scrollTop;
          currentScroll += direction * scrollSpeed * (timestamp - (startTime || timestamp));
          
          if (currentScroll >= maxScroll) {
            currentScroll = maxScroll;
            direction = -1;
          } else if (currentScroll <= 0) {
            currentScroll = 0;
            direction = 1;
          }

          scrollContainerRef.current.scrollTop = currentScroll;
        }
      }
      
      startTime = timestamp;
      animationFrameId = requestAnimationFrame(scroll);
    };

    animationFrameId = requestAnimationFrame(scroll);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  /**
   * Calculates the total score for each team based on the selected dance filter.
   * Memoized to prevent unnecessary recalculations.
   */
  const teamScores = useMemo(() => {
    if (teams.length === 0 || judges.length === 0) return [];

    const results = teams.map((team) => {
      let total = 0;

      const calcTeamScore = (danceId: string) => {
        // ONLY count if dance is released
        if (!releasedDances[danceId]) return 0;

        const danceScores = scores[danceId] || {};
        const danceFinalized = finalized?.[danceId] || {};
        let teamTotal = 0;
        judges.forEach((judge) => {
          // Only count if judge finalized this dance
          if (danceFinalized[judge.id]) {
            const score = danceScores[judge.id]?.[team.id];
            if (judgingFormat === 'Original') {
              if (score === 'gold') teamTotal += 3;
              else if (score === 'silver') teamTotal += 2;
              else if (score === 'bronze') teamTotal += 1;
            } else if (typeof score === 'number') {
              teamTotal += (teams.length + 1) - score;
            }
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

    // Sort descending by score
    results.sort((a, b) => b.score - a.score);

    // Only return results if there is actual released data for the current selection
    const hasReleasedData = selectedDanceId === 'all' 
      ? Object.values(releasedDances).some(v => v === true)
      : releasedDances[selectedDanceId] === true;

    if (!hasReleasedData) return [];

    // Assign medals based on rank
    // Top 3: Gold, Next 3: Silver, Rest: Bronze
    return results.map((team, index) => {
      let medal: 'gold' | 'silver' | 'bronze' = 'bronze';
      if (index < 3) medal = 'gold';
      else if (index < 6) medal = 'silver';

      return { ...team, medal, rank: index + 1 };
    });
  }, [selectedDanceId, teams, dances, judges, scores, judgingFormat, finalized, releasedDances]);

  if (dances.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-stone-200">
        <div className="mx-auto w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-4">
          <Icon name="Trophy" className="h-10 w-10 text-stone-400" />
        </div>
        <h3 className="text-xl font-bold text-stone-900">No Dances</h3>
        <p className="mt-2 text-stone-500 max-w-sm mx-auto">
          Add dances in the Settings page to see summaries.
        </p>
      </div>
    );
  }

  if (teamScores.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-stone-200">
        <div className="mx-auto w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-4">
          <Icon name="Activity" className="h-10 w-10 text-amber-500 animate-pulse" />
        </div>
        <h3 className="text-xl font-bold text-stone-900">Results Pending</h3>
        <p className="mt-2 text-stone-500 max-w-sm mx-auto">
          Waiting for all judges to finalize their results for this selection.
        </p>
      </div>
    );
  }

  const maxActualScore = Math.max(...teamScores.map((t) => t.score), 1); // Avoid division by zero

  return (
    <div 
      ref={scrollContainerRef}
      className="w-full h-full overflow-y-auto scrollbar-hide p-2"
    >
      <div ref={contentRef} className="space-y-8 pb-10">
        <div className="bg-white shadow-sm sm:rounded-3xl p-8 border border-stone-200/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 space-y-4 sm:space-y-0">
            <h2 className="text-3xl font-bold text-stone-900 tracking-tight flex items-center">
              <Icon name="Flag" className="mr-3 h-7 w-7 text-violet-600" />
              {name}
            </h2>
            <p className="block w-full sm:w-64 pl-4 pr-10 py-3 text-base bg-stone-50 font-medium"
            >
              {dances.find((dance) => dance.id === selectedDanceId)?.name || 'Overall (All Dances)'}
              {/* <option value="all">Overall (All Dances)</option>
              {dances.map((dance) => (
                <option key={dance.id} value={dance.id}>
                  {dance.name}
                </option>
              ))} */}
            </p>
          </div>

          <div className="relative pt-10 pb-14 px-6 border-2 border-dashed border-stone-200 rounded-3xl bg-stone-50/50 overflow-hidden">
            {/* Finish Line */}
            <div className="absolute right-10 top-0 bottom-0 w-3 bg-red-500 z-0 flex flex-col items-center justify-center opacity-40">
              <div
                className="h-full w-full"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(45deg, transparent, transparent 10px, white 10px, white 20px)',
                }}
              ></div>
            </div>

            <div className="space-y-8 relative z-10">
              {teamScores.map((team) => {
                const percentage = (team.score / maxActualScore) * 88; // Max 88% to leave room for the avatar

                return (
                  <div key={team.id} className="relative h-16 flex items-center">
                    {/* Track Line */}
                    <div className="absolute left-0 right-0 h-1.5 bg-stone-200 rounded-full top-1/2 -translate-y-1/2"></div>

                    {/* Horse / Team Avatar */}
                    <motion.div
                      initial={{ left: 0 }}
                      animate={{ left: `${percentage}%` }}
                      transition={{ type: 'spring', stiffness: 50, damping: 15 }}
                      className="absolute flex flex-col items-center -translate-y-1/2 top-1/2"
                    >
                      <div
                        className="relative h-14 w-14 rounded-full border-4 shadow-lg flex items-center justify-center bg-white z-10"
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

                        {/* Medal Badge */}
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
                          <span className="text-white text-xs font-bold">
                            {team.rank}
                          </span>
                        </div>
                      </div>
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

        {/* Leaderboard Table */}
        <div className="bg-white shadow-sm overflow-hidden sm:rounded-3xl border border-stone-200/60">
          <div className="px-6 py-5 border-b border-stone-100 bg-stone-50/50">
            <h3 className="text-xl font-bold text-stone-900">Leaderboard</h3>
          </div>
          <ul className="divide-y divide-stone-100">
            {teamScores.map((team) => (
              <li
                key={team.id}
                className="px-6 py-5 flex items-center justify-between hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-center">
                  <div
                    className="flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm"
                    style={{
                      backgroundColor:
                        team.medal === 'gold'
                          ? '#FBBF24'
                          : team.medal === 'silver'
                          ? '#9CA3AF'
                          : '#D97706',
                    }}
                  >
                    {team.rank}
                  </div>
                  <div className="ml-5 flex items-center">
                    <div
                      className="h-10 w-10 rounded-full mr-4 border-2 shadow-sm"
                      style={{
                        borderColor: team.color,
                        backgroundColor: team.color,
                      }}
                    >
                      {team.logo && (
                        <Image
                          src={team.logo}
                          alt=""
                          width={40}
                          height={40}
                          className="h-full w-full rounded-full object-cover"
                          unoptimized
                        />
                      )}
                    </div>
                    <p className="text-lg font-bold text-stone-900">
                      {team.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-bold bg-violet-100 text-violet-800">
                    {team.score} Points
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}