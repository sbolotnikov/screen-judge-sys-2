
import React, { useState, useEffect, useRef } from 'react';
import { Judge, Couple } from '../types';

interface JudgePanelProps {
  judge: Judge;
  couples: Couple[];
  dance: string;
  onSubmit: (judgeId: number, rankings: Record<number, number>) => void;
  isSubmitted: boolean;
  existingRankings?: Record<number, number>; // coupleId -> rank
}

const JudgePanel: React.FC<JudgePanelProps> = ({ judge, couples, dance, onSubmit, isSubmitted, existingRankings }) => {
  const [rankedCouples, setRankedCouples] = useState<Couple[]>([]);
  const draggedItem = useRef<number | null>(null);
  const draggedOverItem = useRef<number | null>(null);

  useEffect(() => {
    // If we have existing rankings for this dance/judge, use them to order the list
    if (existingRankings && Object.keys(existingRankings).length > 0) {
      const sorted = [...couples].sort((a, b) => {
        const rankA = existingRankings[a.id] || 999;
        const rankB = existingRankings[b.id] || 999;
        return rankA - rankB;
      });
      setRankedCouples(sorted);
    } else {
      // Otherwise randomize initial order for fairness
      setRankedCouples([...couples].sort(() => Math.random() - 0.5));
    }
  }, [couples, dance, existingRankings]);

  const handleDragStart = (index: number) => {
    draggedItem.current = index;
  };
  
  const handleDragEnter = (index: number) => {
    draggedOverItem.current = index;
  };

  const handleDragEnd = () => {
    if (draggedItem.current !== null && draggedOverItem.current !== null) {
      const copyRankedCouples = [...rankedCouples];
      const draggedItemContent = copyRankedCouples.splice(draggedItem.current, 1)[0];
      copyRankedCouples.splice(draggedOverItem.current, 0, draggedItemContent);
      setRankedCouples(copyRankedCouples);
    }
    draggedItem.current = null;
    draggedOverItem.current = null;
  };

  const handleSubmit = () => {
    const rankings: Record<number, number> = {};
    rankedCouples.forEach((couple, index) => {
      rankings[couple.id] = index + 1;
    });
    onSubmit(judge.id, rankings);
  };

  return (
    <div className={`bg-slate-800 rounded-2xl border border-slate-700 shadow-xl p-6 transition-all duration-300 ${isSubmitted ? 'border-emerald-500/30' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white">{judge.name}</h3>
        {isSubmitted && (
          <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase px-2 py-0.5 rounded border border-emerald-500/20">
            Locked
          </span>
        )}
      </div>
      
      <p className="text-xs text-slate-500 mb-6 uppercase tracking-wider font-bold">
        {dance} - Ranking order
      </p>
      
      <div className="space-y-2">
        {rankedCouples.map((couple, index) => (
          <div
            key={couple.id}
            draggable={!isSubmitted}
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            className={`flex items-center p-3 rounded-xl transition-all duration-200 group ${
              !isSubmitted 
                ? 'bg-slate-900/50 border border-slate-700/50 hover:border-sky-500/50 cursor-grab active:cursor-grabbing' 
                : 'bg-slate-900/30 border border-slate-800 opacity-60'
            }`}
          >
            <div className={`w-8 h-8 flex-shrink-0 rounded-lg flex items-center justify-center font-black text-sm mr-4 transition-colors ${
              !isSubmitted ? 'bg-sky-500/10 text-sky-400 group-hover:bg-sky-500 text-white' : 'bg-slate-800 text-slate-500'
            }`}>
              {index + 1}
            </div>
            <div className="font-bold text-slate-200">{couple.name}</div>
          </div>
        ))}
      </div>
      
      <button
        onClick={handleSubmit}
        disabled={isSubmitted}
        className={`w-full mt-8 font-bold py-3 px-4 rounded-xl transition-all duration-300 transform active:scale-95 ${
          isSubmitted 
            ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
            : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-600/10'
        }`}
      >
        {isSubmitted ? 'Rankings Submitted' : 'Submit My Rankings'}
      </button>
    </div>
  );
};

export default JudgePanel;
