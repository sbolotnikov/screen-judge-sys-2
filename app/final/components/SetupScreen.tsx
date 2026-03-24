
import React, { useState } from 'react';
import { DEFAULT_DANCES } from '../constants';
import { Judge, Couple } from '@/types/types2';

interface SetupScreenProps {
  onSetupComplete: (eventData: { name: string; judges: Judge[]; couples: Couple[]; dances: string[] }) => void;
  onCancel: () => void;
}

/**
 * SetupScreen Component
 * 
 * This component handles the initial configuration of a DanceSport competition.
 * It allows the user to define:
 * - Event Name
 * - Judges (must be an odd number for majority logic to work correctly)
 * - Couples (participants)
 * - Dances (e.g., Waltz, Tango, Cha Cha)
 * 
 * It performs basic validation before passing the configuration back to the main App.
 */
const SetupScreen: React.FC<SetupScreenProps> = ({ onSetupComplete, onCancel }) => {
  const [eventName, setEventName] = useState('');
  const [judgesInput, setJudgesInput] = useState('Judge 1\nJudge 2\nJudge 3');
  const [couplesInput, setCouplesInput] = useState('101\n102\n103\n104\n105\n106');
  const [dancesInput, setDancesInput] = useState(DEFAULT_DANCES.join(', '));
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles the form submission, validates the input, and triggers the onSetupComplete callback.
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const danceArray = dancesInput.split(',').map(d => d.trim()).filter(d => d);
    const judgesArray = judgesInput.split('\n').map((name, i) => ({ id: i + 1, name: name.trim() })).filter(j => j.name);
    const couplesArray = couplesInput.split('\n').map((name, i) => ({ id: i + 1, name: name.trim() })).filter(c => c.name);

    if (!eventName) {
      setError("Please enter an event name.");
      return;
    }

    if (judgesArray.length % 2 === 0) {
      setError("Number of judges must be uneven (e.g., 3, 5, 7, 9).");
      return;
    }

    if (couplesArray.length < 2) {
      setError("At least 2 couples are required.");
      return;
    }

    if (danceArray.length === 0) {
      setError("At least one dance is required.");
      return;
    }

    onSetupComplete({
      name: eventName.trim(),
      judges: judgesArray,
      couples: couplesArray,
      dances: danceArray,
    });
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-slate-900 p-4 absolute top-0 left-0">
      <div className="w-full max-w-lg bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-700">
        <h1 className="text-4xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-500 mb-8">
          Competition Setup
        </h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg text-red-400 text-sm font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Event Name</label>
            <input
              type="text"
              value={eventName}
              onChange={(e) => setEventName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all"
              placeholder="e.g., Grand Slam 2024"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Judges (Uneven count)</label>
              <textarea
                value={judgesInput}
                onChange={(e) => setJudgesInput(e.target.value)}
                rows={4}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all resize-none"
                placeholder="One judge per line..."
              />
              <p className="mt-1 text-[10px] text-slate-500 italic">Current count: {judgesInput.split('\n').filter(l => l.trim()).length}</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Couples</label>
              <textarea
                value={couplesInput}
                onChange={(e) => setCouplesInput(e.target.value)}
                rows={4}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all resize-none"
                placeholder="One couple per line..."
              />
              <p className="mt-1 text-[10px] text-slate-500 italic">Current count: {couplesInput.split('\n').filter(l => l.trim()).length}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Dances (Comma separated)</label>
            <input
              type="text"
              value={dancesInput}
              onChange={(e) => setDancesInput(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all"
              placeholder="Waltz, Tango, Foxtrot..."
            />
          </div>

          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-6 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-sky-500/20 transition-all transform hover:scale-105 active:scale-95"
            >
              Create Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SetupScreen;
