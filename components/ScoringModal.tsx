"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { CompetitionRound, Dance, EventData, Judge, ScoreValue, Team, JudgingFormat } from '@/types/types';
import { Icon } from '@/components/Icon';
import usePartySettings from '@/hooks/usePartySettings';
import Image from 'next/image';

const EMPTY_ROUNDS: CompetitionRound[] = [];
const EMPTY_ROUND_SCORES: NonNullable<EventData['roundScores']> = {};
const EMPTY_ROUND_FINALIZED: NonNullable<EventData['roundFinalized']> = {};

/**
 * Scoring Page
 * Allows judges to input scores (Gold, Silver, Bronze) or Places (1, 2, 3...) for each team per dance.
 */
export default function ScoringPage({
  partyID, 
  id,
  scores,
  finalized,
  teams,
  dances,
  selectedDanceId,
  judges,
  currentJudgeId,
  judgingFormat = 'Original',
  rounds = EMPTY_ROUNDS,
  activeRoundId,
  roundScores = EMPTY_ROUND_SCORES,
  roundFinalized = EMPTY_ROUND_FINALIZED,
}: {
  partyID: string;
  id: string;
  scores: EventData['scores'];
  finalized?: EventData['finalized'];
  teams: Team[];
  dances: Dance[];
  selectedDanceId: string;
  judges: Judge[];
  currentJudgeId: string;
  judgingFormat: JudgingFormat;
  rounds?: CompetitionRound[];
  activeRoundId?: string;
  roundScores?: EventData['roundScores'];
  roundFinalized?: EventData['roundFinalized'];
}) {
  const scoringPageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const changedElements: Array<{ element: HTMLElement; previousValue: string }> = [];
    const preventScrollReload = (element: HTMLElement) => {
      changedElements.push({ element, previousValue: element.style.overscrollBehaviorY });
      element.style.overscrollBehaviorY = 'none';
    };

    preventScrollReload(document.documentElement);
    preventScrollReload(document.body);

    let ancestor = scoringPageRef.current?.parentElement;
    while (ancestor) {
      const overflowY = window.getComputedStyle(ancestor).overflowY;
      if (overflowY === 'auto' || overflowY === 'scroll') {
        preventScrollReload(ancestor);
      }
      ancestor = ancestor.parentElement;
    }

    return () => {
      changedElements.forEach(({ element, previousValue }) => {
        element.style.overscrollBehaviorY = previousValue;
      });
    };
  }, []);

  const { setCompID } = usePartySettings();
  const activeRound = judgingFormat === 'MultiRound'
    ? rounds.find(round => round.id === activeRoundId) ||
      rounds.find(round => round.status === 'active')
    : undefined;
  const activeRoundTeamIds = useMemo(
    () => activeRound?.eligibleTeamIds.length ? activeRound.eligibleTeamIds : teams.map(team => team.id),
    [activeRound, teams]
  );
  const activeRoundDanceIds = useMemo(
    () => activeRound?.danceIds.length ? activeRound.danceIds : dances.map(dance => dance.id),
    [activeRound, dances]
  );
  const activeRoundJudgeIds = useMemo(
    () => activeRound?.judgeIds.length ? activeRound.judgeIds : judges.map(judge => judge.id),
    [activeRound, judges]
  );
  const activeRoundCompetitorCount = activeRound?.competitorCount
    ? Math.min(activeRound.competitorCount, activeRoundTeamIds.length)
    : activeRoundTeamIds.length;
  const scoringTeams = activeRound
    ? teams.filter(team => activeRoundTeamIds.includes(team.id)).slice(0, activeRoundCompetitorCount)
    : teams;
  const scoringDances = activeRound
    ? dances.filter(dance => activeRoundDanceIds.includes(dance.id))
    : dances;
  const scoringJudges = activeRound
    ? judges.filter(judge => activeRoundJudgeIds.includes(judge.id))
    : judges;
  const effectiveScores = useMemo(
    () => activeRound ? (roundScores?.[activeRound.id] || {}) : scores,
    [activeRound, roundScores, scores]
  );
  const effectiveFinalized = useMemo(
    () => activeRound ? (roundFinalized?.[activeRound.id] || {}) : finalized,
    [activeRound, roundFinalized, finalized]
  );
  const [currentDanceId, setCurrentDanceId] = useState(
    activeRoundDanceIds[0] || selectedDanceId
  );
  const [localScores, setLocalScores] = useState<Record<string, ScoreValue>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [hasBackup, setHasBackup] = useState(false);
  const currentJudgeIsFinalized = effectiveFinalized?.[currentDanceId]?.[currentJudgeId] === true;

  // Sync currentDanceId with selectedDanceId from props when it changes
  // This allows the admin to still "force" a dance if they change it
  useEffect(() => {
    if (selectedDanceId) {
      setCurrentDanceId(selectedDanceId);
    }
  }, [selectedDanceId]);

  useEffect(() => {
    if (activeRound && !activeRoundDanceIds.includes(currentDanceId)) {
      setCurrentDanceId(activeRoundDanceIds[0] || '');
    }
  }, [activeRound, activeRoundDanceIds, currentDanceId]);

  useEffect(() => {
    if (partyID) {
      setCompID(partyID);
    }
  }, [partyID, setCompID]);

  // Generate a unique key for backup based on party, event, dance, and judge
  const backupKey = `scoring_backup_${partyID}_${id}_${activeRound?.id || 'standard'}_${currentDanceId}_${currentJudgeId}`;

  // Restore from backup on mount or when context changes
  useEffect(() => {
    if (currentJudgeId && !currentJudgeIsFinalized) {
      const savedBackup = localStorage.getItem(backupKey);
      if (savedBackup) {
        try {
          const parsedBackup = JSON.parse(savedBackup);
          const dbScores = effectiveScores[currentDanceId]?.[currentJudgeId] || {};
          
          // Only restore if backup is different from DB to avoid redundant alerts
          if (JSON.stringify(parsedBackup) !== JSON.stringify(dbScores)) {
            console.log('Restoring scoring backup:', parsedBackup);
            setLocalScores(parsedBackup);
            setHasBackup(true);
            return;
          }
        } catch (e) {
          console.error('Failed to parse scoring backup', e);
        }
      }
      
      // If no backup or backup matches DB, sync with current judge's scores for the selected dance from DB
      const dbScores = effectiveScores[currentDanceId]?.[currentJudgeId] || {};
      setLocalScores(previous =>
        JSON.stringify(previous) === JSON.stringify(dbScores) ? previous : dbScores
      );
      setHasBackup(false);
    }
  }, [currentDanceId, currentJudgeId, effectiveScores, currentJudgeIsFinalized, backupKey]);

  // Save to backup whenever localScores changes
  useEffect(() => {
    if (Object.keys(localScores).length > 0 && !currentJudgeIsFinalized) {
      localStorage.setItem(backupKey, JSON.stringify(localScores));
    } else if (currentJudgeIsFinalized) {
      // Clear backup if finalized
      localStorage.removeItem(backupKey);
      setHasBackup(false);
    }
  }, [localScores, backupKey, currentJudgeIsFinalized]);

  const clearBackup = () => {
    localStorage.removeItem(backupKey);
    setHasBackup(false);
    // Re-sync with DB
    const dbScores = effectiveScores[currentDanceId]?.[currentJudgeId] || {};
    setLocalScores(dbScores);
  };

  const isFinalized = (judgeId: string) => {
    return effectiveFinalized?.[currentDanceId]?.[judgeId] === true;
  };

  /**
   * Handles updating a specific score locally for Original format.
   */
  const handleScoreChange = (
    teamId: string,
    score: ScoreValue,
  ) => {
    if (!currentJudgeId || isFinalized(currentJudgeId)) return;

    const newLocalScores = { ...localScores };

    // Toggle off if clicking the same score, otherwise set new score
    if (newLocalScores[teamId] === score) {
      newLocalScores[teamId] = null;
    } else {
      newLocalScores[teamId] = score;
    }

    setLocalScores(newLocalScores);
  };

  const handlePreliminaryToggle = (teamId: string) => {
    if (!activeRound || isFinalized(currentJudgeId)) return;
    const isSelected = localScores[teamId] === 1;
    if (!isSelected && selectedCount >= activeRound.selectionCount) return;
    setLocalScores({ ...localScores, [teamId]: isSelected ? null : 1 });
  };

  /**
   * Final Format Logic: Assign a team to a specific rank.
   * - If the team is from the pool:
   *    - Target occupied: shifts existing teams down.
   *    - Target empty: direct assignment.
   * - If the team is already ranked:
   *    - Target occupied: swaps positions.
   *    - Target empty: moves to new position.
   */
  const handleAssignRank = (teamId: string, targetRank: number) => {
    if (!currentJudgeId || isFinalized(currentJudgeId)) return;

    // 1. Create an ordered array of the current rankings
    const rankedArray: (string | null)[] = Array(scoringTeams.length).fill(null);
    Object.entries(localScores).forEach(([tId, rank]) => {
      if (typeof rank === 'number' && rank >= 1 && rank <= scoringTeams.length) {
        rankedArray[rank - 1] = tId;
      }
    });

    const sourceIndex = rankedArray.indexOf(teamId);
    const targetIndex = targetRank - 1;
    const teamAtTarget = rankedArray[targetIndex];

    if (sourceIndex !== -1) {
      // TEAM ALREADY RANKED: Move or Swap
      if (teamAtTarget) {
        // Swap the two teams (No shifting of others)
        rankedArray[sourceIndex] = teamAtTarget;
        rankedArray[targetIndex] = teamId;
      } else {
        // Move to empty slot (No shifting of others)
        rankedArray[sourceIndex] = null;
        rankedArray[targetIndex] = teamId;
      }
    } else {
      // TEAM FROM POOL: Assign or Shift
      if (teamAtTarget) {
        // OCCUPIED: Insert and shift everything below down
        rankedArray.splice(targetIndex, 0, teamId);
      } else {
        // EMPTY: Just fill the spot (No shifting of others)
        rankedArray[targetIndex] = teamId;
      }
    }
    
    // 4. Any team pushed beyond the last slot is effectively "unranked"
    // We truncate to teams.length to maintain the pool consistency
    const finalRankedIds = rankedArray.slice(0, scoringTeams.length);

    // 5. Convert back to the Record format required by the state
    const newLocalScores: Record<string, ScoreValue> = {};
    finalRankedIds.forEach((tId, index) => {
      if (tId) {
        newLocalScores[tId] = index + 1;
      }
    });

    setLocalScores(newLocalScores);
    setSelectedTeamId(null);
  };

  const handleUnassignRank = (teamId: string) => {
    if (!currentJudgeId || isFinalized(currentJudgeId)) return;
    const newLocalScores = { ...localScores };
    delete newLocalScores[teamId];
    setLocalScores(newLocalScores);
  };

  const handleFinalize = async () => {
    if (!currentJudgeId || isSaving) return;

    if (!confirm('Are you sure you want to finalize and send results? You will not be able to change them afterwards.')) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      // Keep an immutable copy for every retry. The local backup is deliberately
      // retained until the API confirms that these exact marks are in MongoDB.
      const submittedScores = JSON.parse(JSON.stringify(localScores));
      const maxAttempts = 3;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
          const response = await fetch('/api/scoring/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              partyId: partyID,
              eventId: id,
              danceId: currentDanceId,
              judgeId: currentJudgeId,
              roundId: activeRound?.id,
              scores: submittedScores,
            }),
          });
          const result = await response.json();
          if (!response.ok || result.verified !== true) {
            throw new Error(result.error || 'The saved marks could not be verified');
          }
          lastError = null;
          break;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error('Unknown save error');
          if (attempt < maxAttempts) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
          }
        }
      }

      if (lastError) throw lastError;
      localStorage.removeItem(backupKey);
      setHasBackup(false);
    } catch (err) {
      console.error('Error finalizing scores:', err);
      setSaveError('Marks were not confirmed in the database. Your backup is safe; please submit again.');
      alert('Marks were not confirmed in the database. Your backup is safe; please submit again.');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedCount = Object.values(localScores).filter(score => score === 1).length;
  const allTeamsMarked = activeRound?.type === 'preliminary'
    ? selectedCount === activeRound.selectionCount
    : scoringTeams.length > 0 && scoringTeams.every(team => {
    const s = localScores[team.id];
    return s !== null && s !== undefined;
  });

  const getScoreColor = (score: ScoreValue, currentScore: ScoreValue, isJudgeFinalized: boolean) => {
    if (score !== currentScore)
      return 'bg-stone-50 text-stone-400 border-stone-200 ' + (!isJudgeFinalized ? 'hover:bg-stone-100 hover:text-stone-600' : '');
    
    switch (score) {
      case 'gold':
        return 'bg-amber-400 text-amber-950 border-amber-500 shadow-md scale-105';
      case 'silver':
        return 'bg-slate-200 text-slate-800 border-slate-300 shadow-md scale-105';
      case 'bronze':
        return 'bg-orange-600 text-white border-orange-700 shadow-md scale-105';
      default:
        return 'bg-stone-50 text-stone-400 border-stone-200';
    }
  };

  const nextDanceId = (() => {
    const currentIndex = scoringDances.findIndex(d => d.id === currentDanceId);
    if (currentIndex !== -1 && currentIndex < scoringDances.length - 1) {
      return scoringDances[currentIndex + 1].id;
    }
    return null;
  })();

  const handleNextDance = () => {
    if (nextDanceId) {
      setCurrentDanceId(nextDanceId);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (judgingFormat === 'MultiRound' && !activeRound) {
    return (
      <div ref={scoringPageRef} className="text-center py-20 bg-white rounded-3xl shadow-sm border border-stone-200 overscroll-y-none">
        <Icon name="Activity" className="h-10 w-10 text-amber-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-stone-900">Waiting for an active round</h3>
        <p className="mt-2 text-stone-500">The administrator must configure and activate the next competition round.</p>
      </div>
    );
  }

  if (scoringJudges.length === 0 || scoringDances.length === 0 || scoringTeams.length === 0 ||
      (activeRound && !activeRoundJudgeIds.includes(currentJudgeId))) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-stone-200">
        <div className="mx-auto w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-4">
          <Icon name="Award" className="h-10 w-10 text-stone-400" />
        </div>
        <h3 className="text-xl font-bold text-stone-900">Missing Data</h3>
        <p className="mt-2 text-stone-500 max-w-sm mx-auto">
          You are not assigned to the active round, or the round is missing eligible couples and dances.
        </p>
      </div>
    );
  }

  const unrankedTeams = scoringTeams.filter(t => localScores[t.id] === null || localScores[t.id] === undefined);

  return (
    <div ref={scoringPageRef} className="space-y-10 pb-5 overscroll-y-none">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-stone-900 tracking-tight">
            Scoring
          </h1>
          <p className="mt-2 text-stone-500 text-lg">
            {activeRound?.type === 'preliminary'
              ? `Choose exactly ${activeRound.selectionCount} couples. Each selection is one point.`
              : judgingFormat === 'Original'
              ? 'Assign Gold, Silver, or Bronze to each team.' 
              : 'Rank the teams from 1st to last place.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-violet-100 text-violet-800 px-4 py-2 rounded-2xl text-sm font-bold border border-violet-200">
            {activeRound ? activeRound.name : `Format: ${judgingFormat}`}
          </div>
          <select 
            value={currentDanceId}
            onChange={(e) => setCurrentDanceId(e.target.value)}
            className="bg-white border border-stone-200 text-stone-900 text-sm font-bold rounded-2xl px-4 py-2 focus:ring-violet-500 focus:border-violet-500"
          >
            {scoringDances.map(dance => (
              <option key={dance.id} value={dance.id}>
                {dance.name} {finalized?.[dance.id]?.[currentJudgeId] ? '✓' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {scoringJudges.filter(j => j.id === currentJudgeId).map((judge) => (
        <div
          key={judge.id}
          className="bg-white shadow-sm sm:rounded-3xl border border-stone-200/60 overflow-hidden"
        >
          <div className="px-6 py-5 flex items-center justify-between bg-stone-50/80 border-b border-stone-200/80">
            <div className="flex items-center">
              {judge.image ? (
                <Image
                  src={judge.image}
                  alt={judge.name}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover mr-4 shadow-sm border-2 border-white"
                  unoptimized
                />
              ) : (
                <div className="h-12 w-12 rounded-full bg-violet-100 flex items-center justify-center mr-4 shadow-sm border-2 border-white">
                  <span className="text-violet-800 font-bold text-lg">
                    {judge.name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h2 className="text-2xl font-bold text-stone-900">{judge.name}</h2>
                {isFinalized(judge.id) && (
                  <span className="text-xs font-bold text-green-600 uppercase tracking-wider flex items-center">
                    <Icon name="Award" className="h-3 w-3 mr-1" /> Results Finalized
                  </span>
                )}
                {!isFinalized(judge.id) && hasBackup && (
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider flex items-center mt-1">
                    <Icon name="Activity" className="h-3 w-3 mr-1" /> Backup Restored
                    <button 
                      onClick={clearBackup}
                      className="ml-2 text-[10px] bg-amber-100 hover:bg-amber-200 px-1.5 py-0.5 rounded text-amber-800 transition-colors"
                    >
                      Reset to DB
                    </button>
                  </span>
                )}
                {saveError && (
                  <span className="text-xs font-bold text-red-600 mt-1 block" role="alert">
                    {saveError}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {isFinalized(judge.id) && nextDanceId && (
                <button
                  onClick={handleNextDance}
                  className="inline-flex items-center px-6 py-2.5 border border-violet-200 text-sm font-bold rounded-full text-violet-700 bg-violet-50 hover:bg-violet-100 shadow-sm transition-all"
                >
                  Next Dance <Icon name="ChevronRight" className="ml-2 h-4 w-4" />
                </button>
              )}
              {!isFinalized(judge.id) && allTeamsMarked && (
                <button
                  onClick={handleFinalize}
                  disabled={isSaving}
                  className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-bold rounded-full text-white bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  <Icon name="Award" className="mr-2 h-4 w-4" /> 
                  {isSaving ? 'Saving...' : 'Finalize & Send Results'}
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-stone-100">
            {scoringDances.filter((dance) => dance.id === currentDanceId).map((dance) => (
              <div key={dance.id} className="px-6 py-8">
                <h3 className="text-xl font-bold text-stone-800 mb-8 flex items-center">
                  <span className="w-2 h-6 bg-violet-500 rounded-full mr-3"></span>
                  {dance.name}
                </h3>

                {activeRound?.type === 'preliminary' ? (
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <p className="font-bold text-stone-700">Selected {selectedCount} of {activeRound.selectionCount}</p>
                      <div className="h-2 flex-1 mx-4 rounded-full bg-stone-100 overflow-hidden">
                        <div className="h-full bg-violet-500" style={{ width: `${Math.min(100, (selectedCount / activeRound.selectionCount) * 100)}%` }} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {scoringTeams.map((team, index) => {
                        const selected = localScores[team.id] === 1;
                        const disabled = isFinalized(judge.id) || (!selected && selectedCount >= activeRound.selectionCount);
                        return (
                          <button
                            key={team.id}
                            type="button"
                            disabled={disabled}
                            onClick={() => handlePreliminaryToggle(team.id)}
                            className={`p-4 rounded-2xl border-2 text-left transition-all disabled:cursor-not-allowed ${selected ? 'border-violet-500 bg-violet-50 text-violet-900' : 'border-stone-200 bg-white text-stone-700 disabled:opacity-40'}`}
                          >
                            <span className="block text-xs uppercase tracking-wider text-stone-400">Couple {index + 1}</span>
                            <span className="block font-bold truncate">{team.name || team.id}</span>
                            <span className="block text-xs mt-2">{selected ? 'Selected · 1 point' : 'Select'}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : judgingFormat === 'Original' ? (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    {scoringTeams.map((team) => {
                      const currentScore = localScores[team.id] || null;
                      const isJudgeFinalized = isFinalized(judge.id);

                      return (
                        <div
                          key={team.id}
                          className="border border-stone-200 rounded-2xl p-3 flex flex-col items-center space-y-4 bg-white hover:shadow-md transition-shadow"
                          style={{
                            borderTopColor: team.color,
                            borderTopWidth: '6px',
                          }}
                        >
                          <div className="flex items-center space-x-3 w-full">
                            {team.logo ? (
                              <Image
                                src={team.logo}
                                alt={team.name}
                                width={40}
                                height={40}
                                className="h-10 w-10 rounded-full object-cover shadow-sm"
                                unoptimized
                              />
                            ) : (
                              <div
                                className="h-10 w-10 rounded-full flex items-center justify-center shadow-sm"
                                style={{ backgroundColor: team.color }}
                              >
                                <span className="text-white text-sm font-bold">
                                  {team.name.charAt(0)}
                                </span>
                              </div>
                            )}
                            <span className="font-bold text-stone-900 truncate text-lg">
                              {team.name}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2 w-full justify-center">
                            <button
                              onClick={() => handleScoreChange(team.id, 'gold')}
                              disabled={isJudgeFinalized}
                              className={`flex-1 py-2 text-xs font-bold rounded-full border transition-all duration-200 ${getScoreColor('gold', currentScore, isJudgeFinalized)}`}
                            >
                              Gold
                            </button>
                            <button
                              onClick={() => handleScoreChange(team.id, 'silver')}
                              disabled={isJudgeFinalized}
                              className={`flex-1 py-2 text-xs font-bold rounded-full border transition-all duration-200 ${getScoreColor('silver', currentScore, isJudgeFinalized)}`}
                            >
                              Silver
                            </button>
                            <button
                              onClick={() => handleScoreChange(team.id, 'bronze')}
                              disabled={isJudgeFinalized}
                              className={`flex-1 py-2 text-xs font-bold rounded-full border transition-all duration-200 ${getScoreColor('bronze', currentScore, isJudgeFinalized)}`}
                            >
                              Bronze
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="space-y-10">
                    {/* Step 1: Available Pool */}
                    <div className="bg-stone-50 rounded-3xl p-6 border border-stone-200">
                      <h4 className="text-sm font-black text-stone-400 uppercase tracking-widest mb-4">
                        Step 1: Select a Team
                      </h4>
                      <div className="flex flex-wrap gap-4">
                        {scoringTeams.map(team => {
                          const isRanked = localScores[team.id] !== null && localScores[team.id] !== undefined;
                          const isSelected = selectedTeamId === team.id;
                          const isJudgeFinalized = isFinalized(judge.id);

                          return (
                            <div 
                              key={team.id}
                              onClick={() => !isJudgeFinalized && setSelectedTeamId(isSelected ? null : team.id)}
                              className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer group flex items-center space-x-3 min-w-[160px] ${
                                isSelected ? 'border-violet-600 bg-violet-50 ring-4 ring-violet-100' : 
                                isRanked ? 'border-stone-100 bg-stone-50/50 opacity-40 hover:opacity-100' : 'border-white bg-white shadow-sm hover:shadow-md hover:border-stone-300'
                              }`}
                            >
                              <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold" style={{ backgroundColor: team.color }}>
                                {team.logo ? (
                                  <Image src={team.logo} alt="" width={40} height={40} className="w-full h-full rounded-full object-cover" unoptimized />
                                ) : team.name.charAt(0)}
                              </div>
                              <span className="font-bold text-stone-700 truncate">{team.name}</span>
                              
                              {isRanked && (
                                <div className="absolute -top-2 -right-2 bg-green-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm">
                                  {localScores[team.id]}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Step 2: Ranking Slots */}
                    <div className="grid grid-cols-1 ">
                      <div className="flex items-center gap-4 mb-6">
                        <h4 className="text-sm font-black text-stone-400 uppercase tracking-widest mb-4">
                          Step 2: Assign to a Placement
                        </h4>
                      </div>
                      {Array.from({ length: scoringTeams.length }, (_, i) => {
                        const rank = i + 1;
                        const teamAtRankId = Object.keys(localScores).find(tId => localScores[tId] === rank);
                        const teamAtRank = scoringTeams.find(t => t.id === teamAtRankId);
                        const isJudgeFinalized = isFinalized(judge.id);

                        return (
                          <div 
                            key={rank}
                            onClick={() => {
                              if (isJudgeFinalized) return;
                              if (selectedTeamId) {
                                handleAssignRank(selectedTeamId, rank);
                              } else if (teamAtRank) {
                                setSelectedTeamId(teamAtRank.id);
                              }
                            }}
                            className={`flex items-center p-4 rounded-3xl border-2 transition-all group ${
                              teamAtRank ? 'bg-white border-stone-200' : 'bg-stone-50 border-dashed border-stone-200'
                            } ${!isJudgeFinalized ? 'cursor-pointer hover:border-violet-400 hover:bg-violet-50 hover:scale-[1.02]' : ''} ${
                              selectedTeamId && teamAtRankId === selectedTeamId ? 'ring-4 ring-violet-100 border-violet-600' : ''
                            }`}
                          >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl mr-5 transition-colors ${
                              teamAtRank ? 'bg-stone-900 text-white' : 'bg-stone-200 text-stone-400 group-hover:bg-violet-200 group-hover:text-violet-600'
                            }`}>
                              {rank}
                            </div>
                            
                            {teamAtRank ? (
                              <div className="flex items-center flex-1 min-w-0">
                                <div className="w-8 h-8 rounded-full mr-3 flex-shrink-0" style={{ backgroundColor: teamAtRank.color }}>
                                  {teamAtRank.logo && <Image src={teamAtRank.logo} alt="" width={32} height={32} className="w-full h-full rounded-full object-cover" unoptimized />}
                                </div>
                                <span className="font-bold text-stone-900 truncate text-lg">{teamAtRank.name}</span>
                                {!isJudgeFinalized && (
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); handleUnassignRank(teamAtRank.id); }}
                                    className="ml-auto p-2 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                                  >
                                    <Icon name="X" className="w-5 h-5" />
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="flex-1">
                                <span className="text-stone-400 font-medium italic">
                                  {!isJudgeFinalized && selectedTeamId ? `Place ${scoringTeams.find(t => t.id === selectedTeamId)?.name} here` : 'Empty Slot'}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
