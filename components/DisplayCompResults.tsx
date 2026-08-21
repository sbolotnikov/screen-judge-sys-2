'use client';

import { useMemo, useEffect, useRef, type CSSProperties } from 'react';
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
  CompetitionRound,
} from '@/types/types';
import { motion } from 'framer-motion';
import { Icon } from '@/components/Icon';
import Image from 'next/image';
import {
  calculateDancePlacements,
  calculateFinalResults,
} from '@/services/skatingSystem';
import SkatingBreakdown from './SkatingBreakdown';

type ResultsThemeProps = {
  colorBG?: string;
  textColor?: string;
};

type ResultsTypographyProps = {
  fontSize?: number;
  fontSize2?: number;
  fontSizeTime?: number;
};

const fontSizeStyle = (size?: number): CSSProperties | undefined =>
  size && size > 0 ? { fontSize: `${size}px` } : undefined;

const resultsTheme = (colorBG = '#ffffff', textColor = '#1c1917') =>
  ({
    '--results-bg': colorBG || '#ffffff',
    '--results-text': textColor || '#1c1917',
  }) as CSSProperties;

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
  rounds?: CompetitionRound[];
  activeRoundId?: string;
  roundScores?: EventData['roundScores'];
  roundFinalized?: EventData['roundFinalized'];
  roundReleasedDances?: EventData['roundReleasedDances'];
  isAnimationOn?: boolean;
} & ResultsThemeProps & ResultsTypographyProps) {
  if (props.judgingFormat === 'MultiRound') {
    return <MultiRoundResults {...props} />;
  }
  if (props.judgingFormat === 'Final') {
    return <FinalResultsSkating {...props} />;
  }
  return <OriginalResults {...props} />;
}

function MultiRoundResults({
  name,
  teams,
  dances,
  judges,
  rounds = [],
  activeRoundId,
  roundScores = {},
  roundFinalized = {},
  roundReleasedDances = {},
  isAnimationOn = true,
  colorBG,
  textColor,
  fontSize,
  fontSize2,
  fontSizeTime,
}: {
  name: string;
  teams: Team[];
  dances: Dance[];
  judges: Judge[];
  rounds?: CompetitionRound[];
  activeRoundId?: string;
  roundScores?: EventData['roundScores'];
  roundFinalized?: EventData['roundFinalized'];
  roundReleasedDances?: EventData['roundReleasedDances'];
  isAnimationOn?: boolean;
} & ResultsThemeProps & ResultsTypographyProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const preliminaryNameSize = fontSize && fontSize > 0 ? fontSize : 16;
  const preliminaryLabelSize = fontSize2 && fontSize2 > 0 ? fontSize2 : 12;
  const preliminaryRankSize = Math.max(40, preliminaryLabelSize * 1.8);
  const preliminaryTrackHeight = Math.max(
    80,
    preliminaryNameSize + preliminaryLabelSize + 32,
    preliminaryRankSize + 16,
  );
  const preliminaryTrackGap = Math.max(28, preliminaryLabelSize * 0.75);
  const autoScrollContentKey = JSON.stringify({
    scores: roundScores,
    releases: roundReleasedDances,
    roundIds: rounds.map(round => round.id),
  });
  useAutoScroll(
    scrollContainerRef,
    contentRef,
    isAnimationOn,
    autoScrollContentKey,
    activeRoundId || 'multi-round',
    name,
  );

  const activeRoundIndex = rounds.findIndex(round => round.id === activeRoundId);
  const activeRound = activeRoundIndex >= 0 ? rounds[activeRoundIndex] : undefined;
  const activeRoundDanceIds = activeRound
    ? (activeRound.danceIds.length ? activeRound.danceIds : dances.map(dance => dance.id))
    : [];
  const activeRoundHasReleasedData = activeRound
    ? activeRoundDanceIds.some(danceId => roundReleasedDances?.[activeRound.id]?.[danceId])
    : false;
  const previousRound = activeRoundIndex > 0 ? rounds[activeRoundIndex - 1] : undefined;
  const qualifierIds = activeRound?.eligibleTeamIds.length
    ? activeRound.eligibleTeamIds
    : previousRound?.advancingTeamIds || [];

  if (activeRound && activeRoundIndex > 0 && !activeRoundHasReleasedData && qualifierIds.length > 0) {
    const qualifiedTeams = teams
      .filter(team => qualifierIds.includes(team.id))
      .sort((a, b) => (a.name || a.id).localeCompare(b.name || b.id, undefined, { numeric: true }));
    return (
      <div ref={scrollContainerRef} className="display-comp-results w-full h-screen overflow-y-auto scrollbar-hide p-2" style={resultsTheme(colorBG, textColor)}>
        <div ref={contentRef} className="space-y-8 pb-10">
          <ResultsHeader name={name} selectedDanceName={`${activeRound.name} qualifiers`} fontSize2={fontSize2} fontSizeTime={fontSizeTime} />
          <section className="bg-white rounded-3xl border border-stone-200 p-8 shadow-sm">
            <div className="text-center mb-7">
              <h2 className="text-3xl font-black text-stone-900" style={fontSizeStyle(fontSizeTime)}>Couples advancing to {activeRound.name}</h2>
              <p className="text-stone-500 mt-2" style={fontSizeStyle(fontSize2)}>Listed alphabetically until results from this round are released.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {qualifiedTeams.map((team, index) => (
                <div key={team.id} className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-stone-50/60 p-4">
                  <span className="w-10 h-10 rounded-full bg-violet-100 text-violet-700 flex items-center justify-center font-black" style={fontSizeStyle(fontSize2)}>{index + 1}</span>
                  <span className="text-lg font-bold text-stone-900" style={fontSizeStyle(fontSize)}>{team.name || team.id}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  const activeFinalRound = activeRound?.type === 'final' ? activeRound : undefined;
  if (activeFinalRound) {
    const finalTeams = teams.filter(team =>
      (activeFinalRound.eligibleTeamIds.length ? activeFinalRound.eligibleTeamIds : teams.map(item => item.id)).includes(team.id)
    ).slice(0, activeFinalRound.competitorCount || teams.length);
    const finalDances = dances.filter(dance =>
      (activeFinalRound.danceIds.length ? activeFinalRound.danceIds : dances.map(item => item.id)).includes(dance.id)
    );
    const finalJudges = judges.filter(judge =>
      (activeFinalRound.judgeIds.length ? activeFinalRound.judgeIds : judges.map(item => item.id)).includes(judge.id)
    );
    return (
      <FinalResultsSkating
        name={`${name} — ${activeFinalRound.name}`}
        scores={roundScores?.[activeFinalRound.id] || {}}
        teams={finalTeams}
        dances={finalDances}
        judges={finalJudges}
        selectedDanceId="all"
        finalized={roundFinalized?.[activeFinalRound.id] || {}}
        releasedDances={roundReleasedDances?.[activeFinalRound.id] || {}}
        isAnimationOn={isAnimationOn}
        colorBG={colorBG}
        textColor={textColor}
        fontSize={fontSize}
        fontSize2={fontSize2}
        fontSizeTime={fontSizeTime}
      />
    );
  }

  const releasedRounds = rounds.filter(round => {
    const configuredDanceIds = round.danceIds.length
      ? round.danceIds
      : dances.map(dance => dance.id);
    return configuredDanceIds.some(danceId => roundReleasedDances?.[round.id]?.[danceId]);
  });

  if (!releasedRounds.length) return <PendingResults colorBG={colorBG} textColor={textColor} />;

  return (
    <div ref={scrollContainerRef} className="display-comp-results w-full h-screen overflow-y-auto scrollbar-hide p-2" style={resultsTheme(colorBG, textColor)}>
      <div ref={contentRef} className="space-y-8 pb-10">
        <ResultsHeader name={name} selectedDanceName="Released round results" fontSize2={fontSize2} fontSizeTime={fontSizeTime} />
        {releasedRounds.map(round => {
          const eligibleTeamIds = round.eligibleTeamIds.length
            ? round.eligibleTeamIds
            : teams.map(team => team.id);
          const configuredDanceIds = round.danceIds.length
            ? round.danceIds
            : dances.map(dance => dance.id);
          const configuredJudgeIds = round.judgeIds.length
            ? round.judgeIds
            : judges.map(judge => judge.id);
          const roundTeams = teams
            .filter(team => eligibleTeamIds.includes(team.id))
            .slice(0, round.competitorCount || eligibleTeamIds.length);
          const roundJudges = judges.filter(judge => configuredJudgeIds.includes(judge.id));
          const releasedDanceIds = configuredDanceIds.filter(danceId => roundReleasedDances?.[round.id]?.[danceId]);
          let totals: Array<{ team: Team; score: number; rank: number }>;
          if (round.type === 'preliminary') {
            const scored = roundTeams.map(team => {
              let score = 0;
              releasedDanceIds.forEach(danceId => roundJudges.forEach(judge => {
                if (roundFinalized?.[round.id]?.[danceId]?.[judge.id] && roundScores?.[round.id]?.[danceId]?.[judge.id]?.[team.id] === 1) score += 1;
              }));
              return { team, score };
            }).sort((a, b) => b.score - a.score);
            totals = scored.map((item, index) => ({
              ...item,
              rank: index > 0 && item.score === scored[index - 1].score
                ? scored.slice(0, index).findIndex(previous => previous.score === item.score) + 1
                : index + 1,
            }));
          } else {
            const rawRankings: Rankings = {};
            const dancePlacements: Record<string, Placement[]> = {};
            releasedDanceIds.forEach(danceId => {
              rawRankings[danceId] = {};
              roundJudges.forEach(judge => {
                rawRankings[danceId][judge.id] = {};
                roundTeams.forEach(team => {
                  const mark = roundScores?.[round.id]?.[danceId]?.[judge.id]?.[team.id];
                  rawRankings[danceId][judge.id][team.id] = typeof mark === 'number' ? mark : roundTeams.length + 1;
                });
              });
              dancePlacements[danceId] = calculateDancePlacements(rawRankings[danceId], roundTeams, roundJudges.length);
            });
            const finalResults = calculateFinalResults(dancePlacements, roundTeams, releasedDanceIds, rawRankings, roundJudges.map(judge => judge.id));
            totals = finalResults.map(result => ({
              team: roundTeams.find(team => team.id === result.coupleId)!,
              score: result.totalScore,
              rank: result.finalRank,
            })).filter(item => item.team);
          }

          return (
            <section key={round.id} className="bg-white rounded-3xl border border-stone-200 p-7 shadow-sm">
              <div className="flex flex-wrap items-end justify-between gap-2 mb-5">
                <div><h2 className="text-2xl font-bold text-stone-900" style={fontSizeStyle(fontSizeTime)}>{round.name}</h2><p className="text-sm text-stone-500" style={fontSizeStyle(fontSize2)}>{round.type === 'preliminary' ? 'More selections rank higher' : 'Final ranking — lower total ranks higher'}</p></div>
                <span className="text-sm text-violet-700 font-bold" style={fontSizeStyle(fontSize2)}>{releasedDanceIds.map(id => dances.find(dance => dance.id === id)?.name).filter(Boolean).join(' · ')}</span>
              </div>
              {round.type === 'preliminary' ? (
                <div className="relative pt-8 pb-10 px-5 border-2 border-dashed border-stone-200 rounded-3xl bg-stone-50/50 overflow-hidden">
                  <StartLine />
                  <FinishLine />
                  <div className="relative z-10 flex flex-col" style={{ gap: `${preliminaryTrackGap}px` }}>
                    {totals.map(item => {
                      const maxScore = Math.max(...totals.map(total => total.score), 1);
                      const percentage = (item.score / maxScore) * 75 + 10;
                      return (
                        <div key={item.team.id} className="relative flex items-center" style={{ height: `${preliminaryTrackHeight}px` }}>
                          <div className="absolute left-0 right-0 h-2 bg-stone-200 rounded-full" />
                          <div className="absolute left-0 h-2 bg-violet-300 rounded-full transition-all duration-700" style={{ width: `${percentage}%` }} />
                          <div className="absolute flex items-center gap-3 transition-all duration-700" style={{ left: `${percentage}%`, transform: 'translateX(-50%)' }}>
                            <span
                              className="shrink-0 rounded-full bg-white border-2 border-violet-300 shadow flex items-center justify-center font-black text-violet-700"
                              style={{ ...fontSizeStyle(fontSize2), width: `${preliminaryRankSize}px`, height: `${preliminaryRankSize}px` }}
                            >
                              {item.rank}
                            </span>
                            <div className="bg-stone-600/95 border border-stone-300 rounded-xl px-3 py-2 shadow-sm min-w-28">
                              <p className="font-bold text-stone-800 truncate" style={fontSizeStyle(fontSize)}>{item.team.name || item.team.id}</p>
                              <p className="text-xs font-black text-violet-700" style={fontSizeStyle(fontSize2)}>{item.score} points</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-stone-100">
                  {totals.map(item => <div key={item.team.id} className="flex items-center justify-between py-3"><div className="flex items-center gap-3"><span className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center font-black">{item.rank}</span><span className="font-bold text-stone-800">{item.team.name || item.team.id}</span></div><span className="font-black text-violet-700">{item.score} total</span></div>)}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
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

        const speed = 80;
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
  colorBG,
  textColor,
  fontSize,
  fontSize2,
  fontSizeTime,
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
} & ResultsThemeProps & ResultsTypographyProps) {
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
    return <PendingResults colorBG={colorBG} textColor={textColor} />;
  }

  const maxRank = teams.length + 1;

  return (
    <div
      ref={scrollContainerRef}
      className="display-comp-results w-full h-screen overflow-y-auto scrollbar-hide p-2"
      style={resultsTheme(colorBG, textColor)}
    >
      <div ref={contentRef} className="space-y-8 pb-10">
        <ResultsHeader
          name={name}
          selectedDanceName={
            dances.find((d) => d.id === selectedDanceId)?.name ||
            'Overall Standings'
          }
          fontSize2={fontSize2}
          fontSizeTime={fontSize2}
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
          fontSize={fontSize}
          fontSize2={fontSizeTime}
          fontSizeTime={fontSize2}
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
  colorBG,
  textColor,
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
} & ResultsThemeProps) {
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
    return <PendingResults colorBG={colorBG} textColor={textColor} />;
  }

  const maxActualScore = Math.max(...teamScores.map((t) => t.score), 1);

  return (
    <div
      ref={scrollContainerRef}
      className="display-comp-results w-full h-screen overflow-y-auto scrollbar-hide p-2"
      style={resultsTheme(colorBG, textColor)}
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
                        <span className="text-shadow-lg">{team.name}</span> (
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
  fontSize2,
  fontSizeTime,
}: {
  name: string;
  selectedDanceName: string;
} & Pick<ResultsTypographyProps, 'fontSize2' | 'fontSizeTime'>) {
  return (
    <div className="bg-white shadow-sm sm:rounded-3xl p-8 border border-stone-200/60 flex flex-col sm:flex-row sm:items-center justify-between space-y-4 sm:space-y-0">
      <h2 className="text-3xl font-bold text-stone-900 tracking-tight flex items-center" style={fontSizeStyle(fontSizeTime)}>
        <Icon name="Flag" className="mr-3 h-7 w-7 text-violet-600" />
        {name}
      </h2>
      <p className="block w-full sm:w-64 pl-4 pr-10 py-3 text-base bg-stone-50 font-medium rounded-xl border border-stone-100" style={fontSizeStyle(fontSize2)}>
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
                <p className="text-shadow-lg text-5xl font-bold">{team.name}</p>
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

function PendingResults({ colorBG, textColor }: ResultsThemeProps) {
  return (
    <div
      className="display-comp-results text-center py-20 bg-white rounded-3xl shadow-sm border border-stone-200"
      style={resultsTheme(colorBG, textColor)}
    >
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
