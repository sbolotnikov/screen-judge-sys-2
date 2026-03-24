'use client';
import React, { useState, useCallback } from 'react';
import { Event, Rankings, Placement, FinalResult } from '@/types/types2';
import JudgePanel from './JudgePanel';
import MasterPanel from './MasterPanel';
import FinalResults from './FinalResults';
import { calculateDancePlacements, calculateFinalResults } from '@/services/skatingSystem';

interface CompetitionViewProps {
    event: Event;
    onUpdateEvent: (updatedEvent: Event) => void;
    onBackToDashboard: () => void;
}

const CompetitionView: React.FC<CompetitionViewProps> = ({ event, onUpdateEvent, onBackToDashboard }) => {
    const [currentDance, setCurrentDance] = useState<string>(event.dances[0]);

    const handleJudgeSubmit = useCallback((judgeId: number, submittedRankings: Record<number, number>) => {
        const updatedEvent = { ...event };
        updatedEvent.rankings = {
            ...updatedEvent.rankings,
            [currentDance]: {
                ...(updatedEvent.rankings[currentDance] || {}),
                [judgeId]: submittedRankings,
            }
        };
        onUpdateEvent(updatedEvent);
    }, [currentDance, event, onUpdateEvent]);

    const handleCalculateDanceResults = () => {
        const rankingsForDance = event.rankings[currentDance];
        if (rankingsForDance) {
            const results = calculateDancePlacements(rankingsForDance, event.couples, event.judges.length);
            const updatedEvent = { ...event };
            updatedEvent.danceResults = {
                ...updatedEvent.danceResults,
                [currentDance]: results
            };
            onUpdateEvent(updatedEvent);
        }
    };
    
    const handleFinishCompetition = () => {
        const judgeIds = event.judges.map(j => Number(j.id));
        const final = calculateFinalResults(event.danceResults, event.couples, event.dances, event.rankings, judgeIds);
        const updatedEvent = { ...event, finalResults: final, status: 'COMPLETED' as 'COMPLETED' };
        onUpdateEvent(updatedEvent);
    };

    if (event.status === 'COMPLETED') {
        return <FinalResults 
            event={event}
            onBackToDashboard={onBackToDashboard} 
        />;
    }

    const submissions = event.rankings[currentDance] || {};
    const danceResults = event.danceResults[currentDance] || [];
    const allDancesHaveResults = event.dances.every(dance => event.danceResults[dance] && event.danceResults[dance].length > 0);

    return (
      <div className="p-4 sm:p-8 min-h-screen bg-slate-900 w-full relative overflow-auto">
        <div className="max-w-7xl mx-auto absolute top-0 left-0">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                    {event.name}
                </h1>
                <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(event, null, 2));
                        const downloadAnchorNode = document.createElement('a');
                        downloadAnchorNode.setAttribute("href", dataStr);
                        downloadAnchorNode.setAttribute("download", `${event.name.replace(/\s+/g, '_')}_draft.json`);
                        document.body.appendChild(downloadAnchorNode);
                        downloadAnchorNode.click();
                        downloadAnchorNode.remove();
                      }} 
                      className="bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold py-2 px-6 rounded-xl border border-slate-700 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Export Draft
                    </button>
                    <button 
                      onClick={onBackToDashboard} 
                      className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-6 rounded-xl border border-slate-700 transition-all active:scale-95"
                    >
                        &larr; Dashboard
                    </button>
                </div>
            </div>
            
            <div className="mb-8 overflow-x-auto">
                <div className="flex space-x-2 bg-slate-800/50 p-1.5 rounded-2xl border border-slate-700/50 inline-flex min-w-full sm:min-w-0">
                    {event.dances.map(dance => (
                        <button
                            key={dance}
                            onClick={() => setCurrentDance(dance)}
                            className={`px-6 py-2.5 text-sm font-black whitespace-nowrap rounded-xl transition-all duration-300 flex items-center gap-2 ${currentDance === dance ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                        >
                            {dance}
                            {event.danceResults[dance] && (
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                {event.judges.map(judge => (
                  <JudgePanel
                    key={`${currentDance}-${judge.id}`}
                    judge={judge}
                    couples={event.couples}
                    dance={currentDance}
                    onSubmit={handleJudgeSubmit}
                    isSubmitted={!!submissions[judge.id]}
                    existingRankings={submissions[judge.id]}
                  />
                ))}
              </div>
              <div className="lg:col-span-1">
                <MasterPanel
                  judges={event.judges}
                  couples={event.couples}
                  dance={currentDance}
                  submissions={Object.keys(submissions).reduce((acc, jid) => ({ ...acc, [jid]: true }), {})}
                  onCalculate={handleCalculateDanceResults}
                  onFinishCompetition={handleFinishCompetition}
                  results={danceResults}
                  isCompletable={allDancesHaveResults}
                  rawRankings={submissions}
                />
              </div>
            </div>
        </div>
      </div>
    );
};

export default CompetitionView;
