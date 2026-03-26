"use client";

import { useState, useEffect } from 'react';
import { Team, Dance, Judge, EventData, JudgingFormat, Placement, Rankings } from '@/types/types';
import { Icon } from '@/components/Icon';
import Image from 'next/image';
import usePartySettings from '@/hooks/usePartySettings';
import { BlurInput } from './BlurInput';

/**
 * Settings Page
 * Allows event organizers to configure the event name, teams, dances, and judges.
 */
export default function SettingsDashboard({
  partyID,
  id,
  name,
  teams,
  dances,
  judges,
  scores,
  finalized,
  releasedDances,
  judgingFormat,
}: {
  partyID: string;
  id: string;
  name: string;
  teams: Team[];
  dances: Dance[];
  judges: Judge[];
  scores: EventData['scores'];
  finalized?: EventData['finalized'];
  releasedDances?: EventData['releasedDances'];
  judgingFormat: JudgingFormat;
}) {
  const [isJudgeModalOpen, setIsJudgeModalOpen] = useState(false);
  const [availableJudges, setAvailableJudges] = useState<Judge[]>([]);
  const [loadingJudges, setLoadingJudges] = useState(false);
  const { updateEventField, setCompID, updateEvent } = usePartySettings();
   const [isTeamsOpen, setIsTeamsOpen] = useState(false);
  const [isDancesOpen, setIsDancesOpen] = useState(false);
  const [isJudgesOpen, setIsJudgesOpen] = useState(false);

  useEffect(() => {
    if (partyID) {
      setCompID(partyID);
    }
  }, [partyID, setCompID]);

  const clearAllMarks = async () => {
    if (confirm('Are you sure you want to clear all marks, finalized status, and released dances for this event? This action cannot be undone.')) {
      try {
        if (!id) return;
        await updateEvent(id, {
          scores: {},
          finalized: {},
          releasedDances: {}
        });
      } catch (err) {
        console.error('Error clearing marks:', err);
      }
    }
  };

  const toggleJudgeFinalized = async (judgeId: string, danceId?: string) => {
    try {
      const newFinalized = JSON.parse(JSON.stringify(finalized || {}));
      
      if (danceId) {
        // Toggle for specific dance
        if (!newFinalized[danceId]) newFinalized[danceId] = {};
        newFinalized[danceId][judgeId] = !newFinalized[danceId][judgeId];
      } else {
        // Unfinalize ALL results for this judge
        if (!confirm(`Are you sure you want to unfinalize ALL results for this judge? They will be able to edit their marks again.`)) {
          return;
        }
        Object.keys(newFinalized).forEach(dId => {
          if (newFinalized[dId][judgeId]) {
            delete newFinalized[dId][judgeId];
          }
        });
      }
      
      await updateEventField(id, 'finalized', newFinalized);
    } catch (err) {
      console.error('Error toggling judge finalized:', err);
    }
  };

  const releaseDance = async (danceId: string) => {
    try {
      const newReleased = JSON.parse(JSON.stringify(releasedDances || {}));
      newReleased[danceId] = !newReleased[danceId];
      await updateEventField(id, 'releasedDances', newReleased);
    } catch (err) {
      console.error('Error releasing dance:', err);
    }
  };

  const exportResultsToPDF = async () => {
    if (typeof window === 'undefined') return;
    
    try {
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');
      const { calculateDancePlacements, calculateFinalResults } = await import('@/services/skatingSystem');

      const doc = new jsPDF('l', 'mm', 'a4'); // Use landscape for better table width
      const pageWidth = doc.internal.pageSize.getWidth();
      const released = dances.filter(d => releasedDances?.[d.id]);

      // Title
      doc.setFontSize(22);
      doc.text(name || 'Competition Results', pageWidth / 2, 20, { align: 'center' });
      doc.setFontSize(14);
      doc.text(`Format: ${judgingFormat}`, pageWidth / 2, 28, { align: 'center' });

      if (judgingFormat === 'Original') {
        // ORIGINAL FORMAT EXPORT
        doc.setFontSize(18);
        doc.text('Summary of Results', 14, 40);

        const teamScores = teams.map((team) => {
          let total = 0;
          released.forEach((dance) => {
            const danceScores = scores[dance.id] || {};
            const danceFinalized = finalized?.[dance.id] || {};
            judges.forEach((judge) => {
              if (danceFinalized[judge.id]) {
                const score = danceScores[judge.id]?.[team.id];
                if (score === 'gold') total += 3;
                else if (score === 'silver') total += 2;
                else if (score === 'bronze') total += 1;
              }
            });
          });
          return { ...team, score: total };
        });

        teamScores.sort((a, b) => b.score - a.score);

        autoTable(doc, {
          startY: 45,
          head: [['Rank', 'Team Name', 'Total Points']],
          body: teamScores.map((team, index) => [index + 1, team.name, team.score]),
          theme: 'grid',
          headStyles: { fillColor: [139, 92, 246] },
        });

        released.forEach((dance) => {
          doc.addPage();
          doc.setFontSize(18);
          doc.text(`Marks: ${dance.name}`, 14, 20);
          const head = [['Team', ...judges.map(j => j.name)]];
          const body = teams.map(team => {
            const row = [team.name];
            judges.forEach(judge => {
              const isJudgeFinished = finalized?.[dance.id]?.[judge.id];
              const mark = scores[dance.id]?.[judge.id]?.[team.id];
              if (!isJudgeFinished || !mark) row.push('-');
              else row.push(typeof mark === 'string' ? mark.charAt(0).toUpperCase() + mark.slice(1) : mark.toString());
            });
            return row;
          });
          autoTable(doc, { startY: 25, head, body, theme: 'grid', headStyles: { fillColor: [219, 39, 119] } });
        });
      } else {
        // FINAL (SKATING SYSTEM) FORMAT EXPORT
        
        // 1. Calculate Results
        const allDanceResults: Record<string, Placement[]> = {};
        released.forEach(dance => {
          const rankingsForDance: Record<string, Record<string, number>> = {};
          judges.forEach(j => {
            rankingsForDance[j.id] = {};
            teams.forEach(t => {
              const val = scores[dance.id]?.[j.id]?.[t.id];
              rankingsForDance[j.id][t.id] = typeof val === 'number' ? val : teams.length + 1;
            });
          });
          allDanceResults[dance.id] = calculateDancePlacements(rankingsForDance, teams, judges.length);
        });

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
          released,
          rawRankings,
          judges.map(j => j.id)
        );

        // 2. Overall Standings Page
        doc.setFontSize(18);
        doc.text('Overall Standings (Skating System)', 14, 40);
        
        const summaryHead = [['Rank', 'Team', ...released.map(d => d.name), 'Sum of Places', 'Final Rank']];
        const summaryBody = finalResults.map(res => [
          res.finalRank.toString(),
          teams.find(t => t.id === res.coupleId)?.name || res.coupleId,
          ...released.map(d => res.dancePlacements[d.id]?.toString() || '-'),
          res.totalScore.toString(),
          res.finalRank.toString()
        ]);

        autoTable(doc, {
          startY: 45,
          head: summaryHead,
          body: summaryBody,
          theme: 'grid',
          headStyles: { fillColor: [139, 92, 246] },
        });

        // 3. Individual Dance Tabulations
        released.forEach(dance => {
          doc.addPage();
          doc.setFontSize(18);
          doc.text(`Dance Tabulation: ${dance.name}`, 14, 20);
          
          const dancePlacements = allDanceResults[dance.id] || [];
          const head = [['Team', ...judges.map((_, i) => `J${i+1}`), ...Array.from({length: teams.length}, (_, i) => `1-${i+1}`), 'Result']];
          
          const body = dancePlacements.sort((a,b) => a.rank - b.rank).map(p => {
            const teamName = teams.find(t => t.id === p.coupleId)?.name || p.coupleId;
            const marks = judges.map(j => scores[dance.id]?.[j.id]?.[p.coupleId] || '-');
            const majorities = Array.from({length: teams.length}, (_, i) => {
              const colRank = i + 1;
              const m = judges.map(j => scores[dance.id]?.[j.id]?.[p.coupleId]).filter(v => typeof v === 'number');
              const count = m.filter(v => v <= colRank).length;
              const sum = m.filter(v => v <= colRank).reduce((a, b) => a + b, 0);
              return count >= (Math.floor(judges.length / 2) + 1) ? `${count} (${sum})` : count.toString();
            });
            return [teamName, ...marks, ...majorities, p.rank.toString()];
          });

          autoTable(doc, { startY: 25, head, body, theme: 'grid', headStyles: { fillColor: [16, 185, 129] }, styles: { fontSize: 8 } });
        });

        // 4. Multi-Dance Tie-Breakers (Rule 10 & 11)
        if (released.length > 1) {
          doc.addPage();
          doc.setFontSize(18);
          doc.text('Multi-Dance Resolutions (Rule 10/11)', 14, 20);

          const r10Head = [['Team', ...released.map(d => d.name.substring(0,3)), ...Array.from({length: teams.length}, (_, i) => `1-${i+1}`), 'Total']];
          const r10Body = finalResults.map(r => {
            const teamName = teams.find(t => t.id === r.coupleId)?.name || r.coupleId;
            const dancePlaces = released.map(d => r.dancePlacements[d.id]);
            const counts = Array.from({length: teams.length}, (_, i) => {
              const colRank = i + 1;
              const c = dancePlaces.filter(v => v <= colRank).length;
              const s = dancePlaces.filter(v => v <= colRank).reduce((a, b) => a + b, 0);
              return `${c} (${s})`;
            });
            return [teamName, ...dancePlaces, ...counts, r.totalScore.toString()];
          });

          autoTable(doc, { startY: 25, head: r10Head, body: r10Body, theme: 'grid', headStyles: { fillColor: [5, 150, 105] }, styles: { fontSize: 8 } });
        }
      }

      doc.save(`${name || 'results'}_results.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  const fetchJudges = async () => {
    setLoadingJudges(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        type User = {
          id: string;
          name?: string;
          email?: string;
          image?: string;
          role?: string;
        };

        const judgesOnly = data.users
          .filter((user: User) => user.role === 'Judge')
          .map((user: User) => ({
            id: user.id,
            name: user.name || user.email,
            image: user.image || '',
          }));
        setAvailableJudges(judgesOnly);
      }
    } catch (err) {
      console.error('Error fetching judges:', err);
    } finally {
      setLoadingJudges(false);
    }
  };

  const selectJudge = (judge: Judge) => {
    if (judges.some((j) => j.id === judge.id)) {
      alert('This judge is already added.');
      return;
    }
    handleChange([...judges, judge], 'judges');
    setIsJudgeModalOpen(false);
  };

  /**
   * Generic handler to update a specific field in the party document.
   * Uses TypeScript generics to ensure type safety (no 'any').
   */
  const handleChange = async <K extends keyof EventData>(
    val: EventData[K],
    field: K,
  ) => {
    try {
      if (!id) return;
      await updateEventField(id, field, val);
    } catch (err) {
      console.error('Error updating document:', err);
    }
  };

  const addTeam = () => {
    const newTeam: Team = {
      id: crypto.randomUUID(),
      name: '',
      color: '#8b5cf6',
      logo: '',
    };
    handleChange([...teams, newTeam], 'teams');
  };

  const updateTeam = (index: number, field: keyof Team, val: string) => {
    const newTeams = [...teams];
    newTeams[index] = { ...newTeams[index], [field]: val };
    handleChange(newTeams, 'teams');
  };

  const deleteTeam = (index: number) => {
    const newTeams = teams.filter((_, i) => i !== index);
    handleChange(newTeams, 'teams');
  };

  const addDance = () => {
    const newDance: Dance = { id: crypto.randomUUID(), name: '' };
    handleChange([...dances, newDance], 'dances');
  };

  const updateDance = (index: number, field: keyof Dance, val: string) => {
    const newDances = [...dances];
    newDances[index] = { ...newDances[index], [field]: val };
    handleChange(newDances, 'dances');
  };

  const deleteDance = (index: number) => {
    const newDances = dances.filter((_, i) => i !== index);
    handleChange(newDances, 'dances');
  };

  const addJudge = () => {
    fetchJudges();
    setIsJudgeModalOpen(true);
  };

  const updateJudge = (index: number, field: keyof Judge, val: string) => {
    const newJudges = [...judges];
    newJudges[index] = { ...newJudges[index], [field]: val };
    handleChange(newJudges, 'judges');
  };

  const deleteJudge = (index: number) => {
    const newJudges = judges.filter((_, i) => i !== index);
    handleChange(newJudges, 'judges');
  };

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      <div>
        <h1 className="text-4xl font-extrabold text-stone-900 tracking-tight">
          Settings
        </h1>
        <p className="mt-2 text-stone-500 text-lg">
          Configure your event details, teams, and judges.
        </p>
      </div>

      <div className="bg-white shadow-sm sm:rounded-3xl p-8 border border-stone-200/60">
        <div className="flex items-center space-x-3 mb-4">
          <h2 className="text-2xl font-bold text-stone-900">Event Name</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-1">
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
              Name
            </label>
            <BlurInput
              value={name || ''}
              onUpdate={(val) => handleChange(val, 'name')}
              placeholder="Enter Event Name"
              className="w-full rounded-xl border-stone-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-lg p-3 border transition-colors bg-stone-50 focus:bg-white"
            />
          </div>
          <div className="w-full sm:w-64">
            <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1">
              Judging Format
            </label>
            <select
              value={judgingFormat}
              onChange={(e) => handleChange(e.target.value as JudgingFormat, 'judgingFormat')}
              className="w-full rounded-xl border-stone-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-lg p-3 border transition-colors bg-stone-50"
            >
              <option value="Original">Original (Gold, Silver, Bronze)</option>
              <option value="Final">Final (Ranking 1 to last)</option>
            </select>
          </div>
        </div>
        </div>

      <div className={`flex ${isTeamsOpen || isDancesOpen || isJudgesOpen ? 'flex-wrap' : 'flex-row'}`}>

      <div className={`bg-white shadow-sm sm:rounded-3xl p-2 m-1border border-stone-200/60 ${isTeamsOpen ? 'w-full': 'w-1/3'}`}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-violet-100 rounded-xl">
              <Icon name="Users" className="h-6 w-6 text-violet-600" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 text-center">Teams: {teams.length}</h2>
          </div>
          {isTeamsOpen ?(<div className="space-x-2">
            <button
            onClick={addTeam}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-violet-600 hover:bg-violet-700 shadow-sm transition-colors"
          >
            <Icon name="Plus" className="mr-2 h-4 w-4" /> Add Team
          </button>
          <button
            onClick={() => setIsTeamsOpen(false)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-violet-600 hover:bg-violet-700 shadow-sm transition-colors"
          >
            <Icon name="EyeOff" className="mr-2 h-4 w-4" /> Close
          </button>
          </div>):(<button
            onClick={() => setIsTeamsOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-violet-600 hover:bg-violet-700 shadow-sm transition-colors"
          >
            <Icon name={ 'Eye'} className="h-6 w-6"/> Manage Teams
          </button>)}
        </div>
        <div className="space-y-4">
          {teams.length === 0 && (
            <p className="text-stone-500 italic">No teams added yet.</p>
          )}
          {isTeamsOpen &&teams.map((team, index) => (
            <div
              key={team.id}
              className="flex items-center space-x-4 p-4 border border-stone-200 rounded-2xl bg-stone-50/50 hover:bg-white transition-colors"
            >
              <BlurInput
                value={team.name}
                onUpdate={(val) => updateTeam(index, 'name', val)}
                placeholder="Team Name"
                className="flex-1 rounded-xl shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm p-2.5 border border-[#776548] text-[#444]"
              />
              <div className="relative">
                <input
                  type="color"
                  value={team.color}
                  onChange={(e) => updateTeam(index, 'color', e.target.value)}
                  className="h-11 w-11 rounded-xl border border-[#776548] text-[#444] p-1 cursor-pointer bg-white"
                />
              </div>
              <BlurInput
                type="text"
                value={team.logo}
                onUpdate={(val) => updateTeam(index, 'logo', val)}
                placeholder="Logo URL (optional)"
                className="flex-1 rounded-xl border border-[#776548] text-[#444] shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm p-2.5"
              />
              <div className="h-12 w-12 rounded-full overflow-hidden bg-stone-200 shrink-0">
                {team.logo ? (
                  <Image
                    src={team.logo}
                    alt={team.name}
                    width={50}
                    height={50}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-stone-400">
                    <Icon name="Image" className="h-6 w-6" />
                  </div>
                )}
              </div>
              <button
                onClick={() => deleteTeam(index)}
                className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              >
                <Icon name="Trash2" className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className={`bg-white shadow-sm sm:rounded-3xl p-2 m-1 border border-stone-200/60 ${isDancesOpen ? 'w-full': 'w-1/3'}`}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-pink-100 rounded-xl">
              <Icon name="Music" className="h-6 w-6 text-pink-600" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 text-center">Dances: {dances.length}</h2>
          </div>

          {isDancesOpen ?(<div className="space-x-2">
             <button
            onClick={addDance}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-violet-600 hover:bg-violet-700 shadow-sm transition-colors"
          >
            <Icon name="Plus" className="mr-2 h-4 w-4" /> Add Dance
          </button>
          <button
            onClick={() => setIsDancesOpen(false)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-violet-600 hover:bg-violet-700 shadow-sm transition-colors"
          >
            <Icon name="EyeOff" className="mr-2 h-4 w-4" /> Close
          </button>
          </div>):(<button
            onClick={() => setIsDancesOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-violet-600 hover:bg-violet-700 shadow-sm transition-colors"
          >
             <Icon name={ 'Eye'} className="h-6 w-6"/> Manage Dances
          </button>)}


         
        </div>
        <div className="space-y-4">
          {dances.length === 0 && (
            <p className="text-stone-500 italic">No dances added yet.</p>
          )}
          {isDancesOpen && dances.map((dance, index) => (
            <div
              key={dance.id}
              className="flex items-center space-x-4 p-4 border border-stone-200 rounded-2xl bg-stone-50/50 hover:bg-white transition-colors"
            >
              <BlurInput
                value={dance.name}
                onUpdate={(val) => updateDance(index, 'name', val)}
                placeholder="Dance Name (e.g., Waltz, Rumba)"
                className="flex-1 rounded-xl border border-[#776548] text-[#444] shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm p-2.5"
              />
              <button
                onClick={() => deleteDance(index)}
                className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              >
                <Icon name="Trash2" className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div  className={`bg-white shadow-sm sm:rounded-3xl p-2 m-1 border border-stone-200/60 ${isJudgesOpen ? 'w-full': 'w-1/3'}`}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 rounded-xl">
              <Icon name="Gavel" className="h-6 w-6 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900 text-center">Judges: {judges.length}</h2>
          </div>


          {isJudgesOpen ?(<div className="space-x-2">
          <button
            onClick={addJudge}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-violet-600 hover:bg-violet-700 shadow-sm transition-colors"
          >
            <Icon name="Plus" className="mr-2 h-4 w-4" /> Add Judge
          </button>
          <button
            onClick={() => setIsJudgesOpen(false)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-violet-600 hover:bg-violet-700 shadow-sm transition-colors"
          >
            <Icon name="EyeOff" className="mr-2 h-4 w-4" /> Close
          </button>
          </div>):(<button
            onClick={() => setIsJudgesOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-violet-600 hover:bg-violet-700 shadow-sm transition-colors"
          >
             <Icon name={ 'Eye'} className="h-6 w-6"/> Manage Judges
          </button>)}



        </div>
        <div className="space-y-4">
          {judges.length === 0 && (
            <p className="text-stone-500 italic">No judges added yet.</p>
          )}
          {isJudgesOpen && judges.map((judge, index) => (
            <div
              key={judge.id}
              className="flex items-center space-x-4 p-4 border border-stone-200 rounded-2xl bg-stone-50/50 hover:bg-white transition-colors"
            >
              <div className="h-12 w-12 rounded-full overflow-hidden bg-stone-200 shrink-0">
                {judge.image ? (
                  <Image
                    src={judge.image}
                    alt={judge.name}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-stone-400">
                    <Icon name="User" className="h-6 w-6" />
                  </div>
                )}
              </div>
              <BlurInput
                value={judge.name}
                onUpdate={(val) => updateJudge(index, 'name', val)}
                placeholder="Judge Name"
                className="flex-1 rounded-xl border border-[#776548] text-[#444] shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm p-2.5"
              />
              <BlurInput
                type="text"
                value={judge.image}
                onUpdate={(val) => updateJudge(index, 'image', val)}
                placeholder="Image URL (optional)"
                className="flex-1 rounded-xl border border-[#776548] text-[#444] shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm p-2.5"
              />
              <button
                onClick={() => deleteJudge(index)}
                className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              >
                <Icon name="Trash2" className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      </div>




</div>



<div className="bg-white shadow-sm sm:rounded-3xl p-8 border border-stone-200/60">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-amber-100 rounded-xl">
            <Icon name="Gavel" className="h-6 w-6 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900">Judge Results Status</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {judges.length === 0 && (
            <p className="text-stone-500 italic col-span-full">No judges added yet.</p>
          )}
          {judges.map((judge) => (
            <div key={judge.id} className="flex flex-col p-4 border border-stone-200 rounded-2xl bg-stone-50/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3 truncate">
                  {judge.image ? (
                    <Image src={judge.image} alt={judge.name} width={32} height={32} className="h-8 w-8 rounded-full object-cover" unoptimized />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-stone-200 flex items-center justify-center">
                      <Icon name="User" className="h-4 w-4 text-stone-400" />
                    </div>
                  )}
                  <span className="font-bold text-stone-900 truncate">{judge.name}</span>
                </div>
                <button
                  onClick={() => toggleJudgeFinalized(judge.id)}
                  className="text-[10px] font-bold uppercase tracking-tighter text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2 py-1 rounded-md transition-colors"
                  title="Unfinalize ALL for this judge"
                >
                  Unfinalize All
                </button>
              </div>
              <div className="flex items-center justify-end flex-wrap gap-1.5 mt-2">
                {dances.map(dance => {
                  const isFinished = finalized?.[dance.id]?.[judge.id];
                  return (
                    <button
                      key={dance.id}
                      onClick={() => toggleJudgeFinalized(judge.id, dance.id)}
                      title={`${dance.name}: ${isFinished ? 'Finalized' : 'Pending'} (Click to toggle)`}
                      className={`w-4 h-4 rounded-full border border-white shadow-sm transition-all hover:scale-125 ${isFinished ? 'bg-green-500' : 'bg-stone-300'}`}
                    ></button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white shadow-sm sm:rounded-3xl p-8 border border-stone-200/60">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-red-100 rounded-xl">
            <Icon name="Settings" className="h-6 w-6 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900">Actions</h2>
        </div>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={exportResultsToPDF}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-white bg-green-600 hover:bg-green-700 shadow-sm transition-colors"
          >
            <Icon name="Download" className="mr-2 h-5 w-5" /> Export Released Results to PDF
          </button>
          <button
            onClick={clearAllMarks}
            className="inline-flex items-center px-6 py-3 border border-red-200 text-base font-medium rounded-full text-red-700 bg-red-50 hover:bg-red-100 shadow-sm transition-colors"
          >
            <Icon name="Trash2" className="mr-2 h-5 w-5" /> Clear All Marks
          </button>
        </div>

        <div className="mt-8">
          <h3 className="text-lg font-bold text-stone-900 mb-4 flex items-center">
            <Icon name="Award" className="mr-2 h-5 w-5 text-violet-600" /> Release Dance Results
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {dances.length === 0 && (
              <p className="text-stone-500 italic">No dances added yet.</p>
            )}
            {dances.map((dance) => {
              const allFinished = judges.length > 0 && judges.every(j => finalized?.[dance.id]?.[j.id]);
              const isReleased = releasedDances?.[dance.id];
              
              return (
                <div key={dance.id} className="flex items-center justify-between p-4 border border-stone-200 rounded-2xl bg-stone-50/30">
                  <div className="flex items-center space-x-3">
                    <span className="font-bold text-stone-900">{dance.name}</span>
                    {!allFinished && (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                        Waiting for Judges
                      </span>
                    )}
                    {allFinished && !isReleased && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                        Ready to Release
                      </span>
                    )}
                    {isReleased && (
                      <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                        Released to Screen
                      </span>
                    )}
                  </div>
                  <button
                    disabled={!allFinished && !isReleased}
                    onClick={() => releaseDance(dance.id)}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all ${
                      isReleased 
                        ? 'bg-violet-600 text-white hover:bg-violet-700' 
                        : allFinished 
                          ? 'bg-white border-2 border-green-600 text-green-600 hover:bg-green-50' 
                          : 'bg-stone-100 text-stone-400 cursor-not-allowed'
                    }`}
                  >
                    {isReleased ? 'Unrelease' : 'Release Results'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Judge Selection Modal */}
      {isJudgeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-8 transform transition-all max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-stone-900">
                Select a Judge
              </h3>
              <button
                onClick={() => setIsJudgeModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 bg-stone-100 hover:bg-stone-200 p-2 rounded-full transition-colors"
              >
                <Icon name="X" className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2">
              {loadingJudges ? (
                <div className="flex justify-center py-10">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-violet-600"></div>
                </div>
              ) : availableJudges.length === 0 ? (
                <p className="text-center py-10 text-stone-500">{`No users with 'Judge' role found.`}</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {availableJudges.map((judge) => (
                    <button
                      key={judge.id}
                      onClick={() => selectJudge(judge)}
                      className="flex items-center space-x-4 p-4 border border-stone-200 rounded-2xl hover:border-violet-300 hover:bg-violet-50 transition-all text-left"
                    >
                      <div className="h-12 w-12 rounded-full overflow-hidden bg-stone-100 shrink-0">
                        {judge.image ? (
                          <Image
                            src={judge.image}
                            alt={judge.name}
                            width={48}
                            height={48}
                            className="h-full w-full object-cover"
                            unoptimized
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-stone-400">
                            <Icon name="User" className="h-6 w-6" />
                          </div>
                        )}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-stone-900 truncate">
                          {judge.name}
                        </p>
                        <p className="text-xs text-stone-500 truncate">
                          ID: {judge.id}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setIsJudgeModalOpen(false)}
                className="px-6 py-2.5 border border-stone-200 rounded-full text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}