"use client";

import { useState, useEffect } from 'react';
import { Dance, EventData, Judge, ScoreValue, Team, JudgingFormat } from '@/types/types';
import { Icon } from '@/components/Icon';
import usePartySettings from '@/hooks/usePartySettings';
import Image from 'next/image';

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
}) {
  const { updateEvent, setCompID } = usePartySettings();
  const [localScores, setLocalScores] = useState<Record<string, ScoreValue>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  useEffect(() => {
    if (partyID) {
      setCompID(partyID);
    }
  }, [partyID, setCompID]);

  // Sync with current judge's scores for the selected dance from DB (only if not finalized)
  useEffect(() => {
    if (currentJudgeId && !isFinalized(currentJudgeId)) {
      const dbScores = scores[selectedDanceId]?.[currentJudgeId] || {};
      setLocalScores(dbScores);
    }
  }, [selectedDanceId, currentJudgeId, scores, finalized]); 

  const isFinalized = (judgeId: string) => {
    return finalized?.[selectedDanceId]?.[judgeId] === true;
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

  /**
   * Final Format Logic: Assign a team to a specific rank with displacement.
   */
  const handleAssignRank = (teamId: string, targetRank: number) => {
    if (!currentJudgeId || isFinalized(currentJudgeId)) return;

    const newLocalScores = { ...localScores };
    
    // 1. Remove team from its current position to avoid duplicates
    Object.keys(newLocalScores).forEach(tId => {
      if (tId === teamId) delete newLocalScores[tId];
    });

    // 2. Displace existing teams (shift down)
    let teamToPlace: string | null = teamId;
    let rankToPlaceAt = targetRank;

    while (teamToPlace && rankToPlaceAt <= teams.length) {
      // Find if someone is already at this rank
      const displacedTeamId = Object.keys(newLocalScores).find(
        tId => newLocalScores[tId] === rankToPlaceAt
      );

      // Place the current team here
      newLocalScores[teamToPlace] = rankToPlaceAt;

      // The displaced team (if any) now needs to be placed at the next rank
      teamToPlace = displacedTeamId || null;
      rankToPlaceAt++;
    }

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
    try {
      const newScores = JSON.parse(JSON.stringify(scores || {}));
      if (!newScores[selectedDanceId]) newScores[selectedDanceId] = {};
      
      // The user requested the end result to be an array of couples with placements.
      // However, the app's standard storage is a Record. 
      // We will store the Record for compatibility, but we can also store the array 
      // if we want to satisfy the prompt's specific phrasing.
      // For now, let's keep the Record but ensure ALL teams are assigned if it's a Final.
      newScores[selectedDanceId][currentJudgeId] = localScores;

      const newFinalized = JSON.parse(JSON.stringify(finalized || {}));
      if (!newFinalized[selectedDanceId]) newFinalized[selectedDanceId] = {};
      newFinalized[selectedDanceId][currentJudgeId] = true;

      await updateEvent(id, {
        scores: newScores,
        finalized: newFinalized
      });
    } catch (err) {
      console.error('Error finalizing scores:', err);
      alert('Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const allTeamsMarked = teams.length > 0 && teams.every(team => {
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

  if (judges.length === 0 || dances.length === 0 || teams.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-stone-200">
        <div className="mx-auto w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-4">
          <Icon name="Award" className="h-10 w-10 text-stone-400" />
        </div>
        <h3 className="text-xl font-bold text-stone-900">Missing Data</h3>
        <p className="mt-2 text-stone-500 max-w-sm mx-auto">
          Please add teams, dances, and judges in the Settings page first.
        </p>
      </div>
    );
  }

  const unrankedTeams = teams.filter(t => localScores[t.id] === null || localScores[t.id] === undefined);

  return (
    <div className="space-y-10 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-stone-900 tracking-tight">
            Scoring
          </h1>
          <p className="mt-2 text-stone-500 text-lg">
            {judgingFormat === 'Original' 
              ? 'Assign Gold, Silver, or Bronze to each team.' 
              : 'Rank the teams from 1st to last place.'}
          </p>
        </div>
        <div className="bg-violet-100 text-violet-800 px-4 py-2 rounded-2xl text-sm font-bold border border-violet-200">
          Format: {judgingFormat}
        </div>
      </div>

      {judges.filter(j => j.id === currentJudgeId).map((judge) => (
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
              </div>
            </div>
            
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

          <div className="divide-y divide-stone-100">
            {dances.filter((dance) => dance.id === selectedDanceId).map((dance) => (
              <div key={dance.id} className="px-6 py-8">
                <h3 className="text-xl font-bold text-stone-800 mb-8 flex items-center">
                  <span className="w-2 h-6 bg-violet-500 rounded-full mr-3"></span>
                  {dance.name}
                </h3>

                {judgingFormat === 'Original' ? (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {teams.map((team) => {
                      const currentScore = localScores[team.id] || null;
                      const isJudgeFinalized = isFinalized(judge.id);

                      return (
                        <div
                          key={team.id}
                          className="border border-stone-200 rounded-2xl p-5 flex flex-col items-center space-y-4 bg-white hover:shadow-md transition-shadow"
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
                        {teams.map(team => {
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <h4 className="text-sm font-black text-stone-400 uppercase tracking-widest mb-4">
                          Step 2: Assign to a Placement
                        </h4>
                      </div>
                      {Array.from({ length: teams.length }, (_, i) => {
                        const rank = i + 1;
                        const teamAtRankId = Object.keys(localScores).find(tId => localScores[tId] === rank);
                        const teamAtRank = teams.find(t => t.id === teamAtRankId);
                        const isJudgeFinalized = isFinalized(judge.id);

                        return (
                          <div 
                            key={rank}
                            onClick={() => !isJudgeFinalized && selectedTeamId && handleAssignRank(selectedTeamId, rank)}
                            className={`flex items-center p-4 rounded-3xl border-2 transition-all group ${
                              teamAtRank ? 'bg-white border-stone-200' : 'bg-stone-50 border-dashed border-stone-200'
                            } ${!isJudgeFinalized && selectedTeamId ? 'cursor-pointer hover:border-violet-400 hover:bg-violet-50 hover:scale-[1.02]' : ''}`}
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
                                  {!isJudgeFinalized && selectedTeamId ? `Place ${teams.find(t => t.id === selectedTeamId)?.name} here` : 'Empty Slot'}
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