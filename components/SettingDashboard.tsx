"use client";

import { useState, useEffect } from 'react';
import { Team, Dance, Judge, EventData } from '@/types/types';
import { Icon } from '@/components/Icon';
import Image from 'next/image';
import usePartySettings from '@/hooks/usePartySettings';

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
}: {
  partyID: string;
  id: string;
  name: string;
  teams: Team[];
  dances: Dance[];
  judges: Judge[];
}) {
  const [isJudgeModalOpen, setIsJudgeModalOpen] = useState(false);
  const [availableJudges, setAvailableJudges] = useState<Judge[]>([]);
  const [loadingJudges, setLoadingJudges] = useState(false);
  const { updateEventField, setCompID } = usePartySettings();

  useEffect(() => {
    if (partyID) {
      setCompID(partyID);
    }
  }, [partyID, setCompID]);

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
        <input
          type="text"
          value={name || ''}
          onChange={(e) => handleChange(e.target.value, 'name')}
          placeholder="Enter Event Name"
          className="w-full max-w-md rounded-xl border-stone-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-lg p-3 border transition-colors bg-stone-50 focus:bg-white"
        />
      </div>

      <div className="bg-white shadow-sm sm:rounded-3xl p-8 border border-stone-200/60">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-violet-100 rounded-xl">
              <Icon name="Users" className="h-6 w-6 text-violet-600" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900">Teams</h2>
          </div>
          <button
            onClick={addTeam}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-violet-600 hover:bg-violet-700 shadow-sm transition-colors"
          >
            <Icon name="Plus" className="mr-2 h-4 w-4" /> Add Team
          </button>
        </div>
        <div className="space-y-4">
          {teams.length === 0 && (
            <p className="text-stone-500 italic">No teams added yet.</p>
          )}
          {teams.map((team, index) => (
            <div
              key={team.id}
              className="flex items-center space-x-4 p-4 border border-stone-200 rounded-2xl bg-stone-50/50 hover:bg-white transition-colors"
            >
              <input
                type="text"
                value={team.name}
                onChange={(e) => updateTeam(index, 'name', e.target.value)}
                placeholder="Team Name"
                className="flex-1 rounded-xl border-stone-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm p-2.5 border"
              />
              <div className="relative">
                <input
                  type="color"
                  value={team.color}
                  onChange={(e) => updateTeam(index, 'color', e.target.value)}
                  className="h-11 w-11 rounded-xl border border-stone-300 p-1 cursor-pointer bg-white"
                />
              </div>
              <input
                type="text"
                value={team.logo}
                onChange={(e) => updateTeam(index, 'logo', e.target.value)}
                placeholder="Logo URL (optional)"
                className="flex-1 rounded-xl border-stone-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm p-2.5 border"
              />
              <div className="h-12 w-12 rounded-full overflow-hidden bg-stone-200 flex-shrink-0">
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

      <div className="bg-white shadow-sm sm:rounded-3xl p-8 border border-stone-200/60">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-pink-100 rounded-xl">
              <Icon name="Music" className="h-6 w-6 text-pink-600" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900">Dances</h2>
          </div>
          <button
            onClick={addDance}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-violet-600 hover:bg-violet-700 shadow-sm transition-colors"
          >
            <Icon name="Plus" className="mr-2 h-4 w-4" /> Add Dance
          </button>
        </div>
        <div className="space-y-4">
          {dances.length === 0 && (
            <p className="text-stone-500 italic">No dances added yet.</p>
          )}
          {dances.map((dance, index) => (
            <div
              key={dance.id}
              className="flex items-center space-x-4 p-4 border border-stone-200 rounded-2xl bg-stone-50/50 hover:bg-white transition-colors"
            >
              <input
                type="text"
                value={dance.name}
                onChange={(e) => updateDance(index, 'name', e.target.value)}
                placeholder="Dance Name (e.g., Waltz, Rumba)"
                className="flex-1 rounded-xl border-stone-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm p-2.5 border"
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

      <div className="bg-white shadow-sm sm:rounded-3xl p-8 border border-stone-200/60">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-100 rounded-xl">
              <Icon name="Gavel" className="h-6 w-6 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-stone-900">Judges</h2>
          </div>
          <button
            onClick={addJudge}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-violet-600 hover:bg-violet-700 shadow-sm transition-colors"
          >
            <Icon name="Plus" className="mr-2 h-4 w-4" /> Add Judge
          </button>
        </div>
        <div className="space-y-4">
          {judges.length === 0 && (
            <p className="text-stone-500 italic">No judges added yet.</p>
          )}
          {judges.map((judge, index) => (
            <div
              key={judge.id}
              className="flex items-center space-x-4 p-4 border border-stone-200 rounded-2xl bg-stone-50/50 hover:bg-white transition-colors"
            >
              <div className="h-12 w-12 rounded-full overflow-hidden bg-stone-200 flex-shrink-0">
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
              <input
                type="text"
                value={judge.name}
                onChange={(e) => updateJudge(index, 'name', e.target.value)}
                placeholder="Judge Name"
                className="flex-1 rounded-xl border-stone-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm p-2.5 border"
              />
              <input
                type="text"
                value={judge.image}
                onChange={(e) => updateJudge(index, 'image', e.target.value)}
                placeholder="Image URL (optional)"
                className="flex-1 rounded-xl border-stone-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 sm:text-sm p-2.5 border"
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
                      <div className="h-12 w-12 rounded-full overflow-hidden bg-stone-100 flex-shrink-0">
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