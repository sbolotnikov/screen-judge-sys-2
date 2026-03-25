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
  }, [selectedDanceId, currentJudgeId, scores, finalized]); // Added scores and finalized to dependencies to react to admin changes

  const isFinalized = (judgeId: string) => {
    return finalized?.[selectedDanceId]?.[judgeId] === true;
  };

  /**
   * Handles updating a specific score locally.
   */
  const handleScoreChange = (
    teamId: string,
    score: ScoreValue,
  ) => {
    if (!currentJudgeId) return;
    
    if (isFinalized(currentJudgeId)) return;

    const newLocalScores = { ...localScores };

    if (judgingFormat === 'Final') {
      // In Final format, if this place is already taken by another team, clear it from them
      if (score !== null) {
        Object.keys(newLocalScores).forEach(tId => {
          if (newLocalScores[tId] === score) {
            newLocalScores[tId] = null;
          }
        });
      }
    }

    // Toggle off if clicking the same score, otherwise set new score
    if (newLocalScores[teamId] === score) {
      newLocalScores[teamId] = null;
    } else {
      newLocalScores[teamId] = score;
    }

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

  /**
   * Returns the appropriate CSS classes based on whether a score button is selected.
   */
  const getScoreColor = (score: ScoreValue, currentScore: ScoreValue, isJudgeFinalized: boolean) => {
    if (score !== currentScore)
      return 'bg-stone-50 text-stone-400 border-stone-200 ' + (!isJudgeFinalized ? 'hover:bg-stone-100 hover:text-stone-600' : '');
    
    if (typeof score === 'number') {
      return 'bg-violet-600 text-white border-violet-700 shadow-md scale-105';
    }

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

  return (
    <div className="space-y-10 pb-12">
      <div>
        <h1 className="text-4xl font-extrabold text-stone-900 tracking-tight">
          Scoring
        </h1>
        <p className="mt-2 text-stone-500 text-lg">
          Record marks for each team by judge and dance.
        </p>
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
                <h3 className="text-xl font-bold text-stone-800 mb-6 flex items-center">
                  <span className="w-2 h-6 bg-violet-500 rounded-full mr-3"></span>
                  {dance.name}
                </h3>

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
                          {judgingFormat === 'Original' ? (
                            <>
                              <button
                                onClick={() =>
                                  handleScoreChange(team.id, 'gold')
                                }
                                disabled={isJudgeFinalized}
                                className={`flex-1 py-2 text-xs font-bold rounded-full border transition-all duration-200 ${getScoreColor('gold', currentScore, isJudgeFinalized)}`}
                              >
                                Gold
                              </button>
                              <button
                                onClick={() =>
                                  handleScoreChange(team.id, 'silver')
                                }
                                disabled={isJudgeFinalized}
                                className={`flex-1 py-2 text-xs font-bold rounded-full border transition-all duration-200 ${getScoreColor('silver', currentScore, isJudgeFinalized)}`}
                              >
                                Silver
                              </button>
                              <button
                                onClick={() =>
                                  handleScoreChange(team.id, 'bronze')
                                }
                                disabled={isJudgeFinalized}
                                className={`flex-1 py-2 text-xs font-bold rounded-full border transition-all duration-200 ${getScoreColor('bronze', currentScore, isJudgeFinalized)}`}
                              >
                                Bronze
                              </button>
                            </>
                          ) : (
                            <div className="grid grid-cols-4 gap-2 w-full">
                              {teams.map((_, i) => (
                                <button
                                  key={i + 1}
                                  onClick={() =>
                                    handleScoreChange(team.id, i + 1)
                                  }
                                  disabled={isJudgeFinalized}
                                  className={`py-2 text-xs font-bold rounded-lg border transition-all duration-200 ${getScoreColor(i + 1, currentScore, isJudgeFinalized)}`}
                                >
                                  {i + 1}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}