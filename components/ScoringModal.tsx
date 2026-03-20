"use client";

import { useEffect } from 'react';
import { Dance, EventData, Judge, ScoreValue, Team } from '@/types/types';
import { Icon } from '@/components/Icon';
import usePartySettings from '@/hooks/usePartySettings';
import Image from 'next/image';

/**
 * Scoring Page
 * Allows judges to input scores (Gold, Silver, Bronze) for each team per dance.
 */
export default function ScoringPage({
  partyID, 
  id,
  scores,
  teams,
  dances,
  selectedDanceId,
  judges,
}: {
  partyID: string;
  id: string;
  scores: EventData['scores'];
  teams: Team[];
  dances: Dance[];
  selectedDanceId: string;
  judges: Judge[];
}) {
  const { updateEventField, setCompID } = usePartySettings();

  useEffect(() => {
    if (partyID) {
      setCompID(partyID);
    }
  }, [partyID, setCompID]);

  useEffect(() => {
    console.log('ScoringPage rendered with:', { partyID, id, scores, selectedDanceId });
  }, [partyID, id, scores, selectedDanceId]);

  /**
   * Handles updating a specific score for a team by a judge in a specific dance.
   */
  const handleScoreChange = async (
    judgeId: string,
    danceId: string,
    teamId: string,
    score: ScoreValue,
  ) => {
    if (!id) return;
    
    // Create a deep copy of scores to avoid mutating the original prop
    const newScores = JSON.parse(JSON.stringify(scores || {}));
    
    if (!newScores[danceId]) newScores[danceId] = {};
    if (!newScores[danceId][judgeId]) newScores[danceId][judgeId] = {};

    // Toggle off if clicking the same score, otherwise set new score
    if (newScores[danceId][judgeId][teamId] === score) {
      newScores[danceId][judgeId][teamId] = null;
    } else {
      newScores[danceId][judgeId][teamId] = score;
    }

    try {
      await updateEventField(id, 'scores', newScores);
    } catch (err) {
      console.error('Error updating scores:', err);
    }
  };

  /**
   * Returns the appropriate CSS classes based on whether a score button is selected.
   */
  const getScoreColor = (score: ScoreValue, currentScore: ScoreValue) => {
    if (score !== currentScore)
      return 'bg-stone-50 text-stone-400 border-stone-200 hover:bg-stone-100 hover:text-stone-600';
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

      {judges.map((judge) => (
        <div
          key={judge.id}
          className="bg-white shadow-sm sm:rounded-3xl border border-stone-200/60 overflow-hidden"
        >
          <div className="px-6 py-5 flex items-center bg-stone-50/80 border-b border-stone-200/80">
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
            <h2 className="text-2xl font-bold text-stone-900">{judge.name}</h2>
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
                    const currentScore =
                      scores[dance.id]?.[judge.id]?.[team.id] || null;

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

                        <div className="flex space-x-2 w-full justify-center">
                          <button
                            onClick={() =>
                              handleScoreChange(
                                judge.id,
                                dance.id,
                                team.id,
                                'gold',
                              )
                            }
                            className={`flex-1 py-2 text-xs font-bold rounded-full border transition-all duration-200 ${getScoreColor(
                              'gold',
                              currentScore,
                            )}`}
                          >
                            Gold
                          </button>
                          <button
                            onClick={() =>
                              handleScoreChange(
                                judge.id,
                                dance.id,
                                team.id,
                                'silver',
                              )
                            }
                            className={`flex-1 py-2 text-xs font-bold rounded-full border transition-all duration-200 ${getScoreColor(
                              'silver',
                              currentScore,
                            )}`}
                          >
                            Silver
                          </button>
                          <button
                            onClick={() =>
                              handleScoreChange(
                                judge.id,
                                dance.id,
                                team.id,
                                'bronze',
                              )
                            }
                            className={`flex-1 py-2 text-xs font-bold rounded-full border transition-all duration-200 ${getScoreColor(
                              'bronze',
                              currentScore,
                            )}`}
                          >
                            Bronze
                          </button>
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