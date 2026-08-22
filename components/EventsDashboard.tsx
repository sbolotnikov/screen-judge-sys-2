'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

type SessionUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role?: string | null;
};
import { Icon } from '@/components/Icon';
import SettingsDashboard from './SettingDashboard';
import { Team, Dance, Judge, ScoreValue, JudgingFormat, EventData } from '@/types/types';
import ScoringPage from './ScoringModal';
import DisplayCompResults from './DisplayCompResults';
import MultipleFinalsScoring from './MultipleFinalsScoring';
import usePartySettings from '@/hooks/usePartySettings';
import { exportEventsResultsPdf } from '@/utils/exportEventsResultsPdf';

/**
 * Dashboard Page
 * Displays a list of all events (parties) and allows creating or deleting them.
 */
export default function EventsDashboard({ id }: { id?: string }) {
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;
  const {
    events,
    addEvent,
    addEvents,
    deleteEvent,
    setCompID,
    selectedDanceId,
    selectedDanceIdJudge,
    colorBG,
    textColor,
    fontSize,
    fontSize2,
    fontSizeTime,
  } = usePartySettings();

  useEffect(() => {
    if (id) {
      setCompID(id);
    }
  }, [id, setCompID]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newJudgingFormat, setNewJudgingFormat] =
    useState<JudgingFormat>('Original');
  const [eventID, setEventID] = useState<string | null>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const downloadJson = (data: unknown, fileName: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  };

  /**
   * Exports all events in the current list as a JSON file.
   */
  const handleExportAll = () => {
    if (events.length === 0) return;
    downloadJson(events, `events_${new Date().toISOString().split('T')[0]}.json`);
  };

  /**
   * Handles importing events from a JSON file.
   */
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const fileText = String(event.target?.result || '').replace(/^\uFEFF/, '');
        const importedData: unknown = JSON.parse(fileText);
        const sourceEvents = Array.isArray(importedData)
          ? importedData
          : importedData && typeof importedData === 'object' && Array.isArray((importedData as { events?: unknown }).events)
            ? (importedData as { events: unknown[] }).events
            : [importedData];

        const isValid = sourceEvents.every(value => {
          if (!value || typeof value !== 'object') return false;
          const candidate = value as Partial<EventData>;
          return Array.isArray(candidate.teams) && Array.isArray(candidate.dances) && Array.isArray(candidate.judges);
        });
        if (!isValid) {
          alert("Invalid file format. Please ensure the file contains valid event data.");
          return;
        }

        const existingIds = new Set(events.map(existingEvent => existingEvent.id));
        const newEventsArray: EventData[] = (sourceEvents as EventData[]).map(importedEvent => {
          const importedId = typeof importedEvent.id === 'string' && importedEvent.id
            ? importedEvent.id
            : crypto.randomUUID();
          const eventId = existingIds.has(importedId) ? crypto.randomUUID() : importedId;
          existingIds.add(eventId);
          const judgingFormat = importedEvent.judgingFormat === 'MultipleFinals'
            ? 'MultipleFinals'
            : importedEvent.judgingFormat === 'MultiRound' ||
            String(importedEvent.judgingFormat || '').toLowerCase().includes('round')
            ? 'MultiRound'
            : importedEvent.judgingFormat === 'Final' ? 'Final' : 'Original';
          const rounds = Array.isArray(importedEvent.rounds)
            ? importedEvent.rounds.map((round, index) => ({
                id: typeof round.id === 'string' && round.id ? round.id : crypto.randomUUID(),
                name: round.name || `Round ${index + 1}`,
                type: round.type === 'final' ? 'final' as const : 'preliminary' as const,
                danceIds: Array.isArray(round.danceIds) ? round.danceIds : [],
                judgeIds: Array.isArray(round.judgeIds) ? round.judgeIds : [],
                competitorCount: Number(round.competitorCount) || importedEvent.teams.length,
                selectionCount: Math.max(1, Number(round.selectionCount) || 1),
                plannedAdvancers: Math.max(1, Number(round.plannedAdvancers) || 1),
                eligibleTeamIds: Array.isArray(round.eligibleTeamIds) ? round.eligibleTeamIds : [],
                advancingTeamIds: Array.isArray(round.advancingTeamIds) ? round.advancingTeamIds : undefined,
                status: ['setup', 'active', 'awaiting_advance', 'completed'].includes(round.status)
                  ? round.status
                  : index === 0 ? 'active' as const : 'setup' as const,
              }))
            : [];
          return {
            ...importedEvent,
            id: eventId,
            judgingFormat,
            scores: importedEvent.scores || {},
            finalized: importedEvent.finalized || {},
            releasedDances: importedEvent.releasedDances || {},
            rounds,
            activeRoundId: rounds.some(round => round.id === importedEvent.activeRoundId)
              ? importedEvent.activeRoundId
              : rounds.find(round => round.status === 'active')?.id,
            roundScores: importedEvent.roundScores || {},
            roundFinalized: importedEvent.roundFinalized || {},
            roundReleasedDances: importedEvent.roundReleasedDances || {},
            multipleFinals: importedEvent.multipleFinals || [],
            multipleFinalScores: importedEvent.multipleFinalScores || {},
            multipleFinalFinalized: importedEvent.multipleFinalFinalized || {},
          };
        });

        await addEvents(newEventsArray);
        alert(`Successfully imported ${newEventsArray.length} event(s).`);
      } catch (err) {
        console.error('Error importing events:', err);
        alert(`Could not import the JSON file: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    };
    reader.readAsText(file);
    // Reset input value to allow importing same file again if needed
    e.target.value = '';
  };

  // Derive teams, dances, and judges directly from events array and eventID
  const selectedEvent = events.find((e) => e.id === eventID);
  const judgeEvents = user?.role === 'Judge'
    ? events.filter((event) =>
        event.judgingFormat === 'MultipleFinals'
          ? event.multipleFinals?.some(final => final.judgeIds.includes(user.id))
          : event.judges.some(judge => judge.id === user.id) ||
            event.rounds?.some(round => round.judgeIds.includes(user.id)))
    : [];
  const selectedJudgeEventIndex = judgeEvents.findIndex(event => event.id === eventID);
  const previousJudgeEventId = selectedJudgeEventIndex > 0
    ? judgeEvents[selectedJudgeEventIndex - 1].id
    : null;
  const nextJudgeEventId = selectedJudgeEventIndex >= 0 && selectedJudgeEventIndex < judgeEvents.length - 1
    ? judgeEvents[selectedJudgeEventIndex + 1].id
    : null;
  const teams: Team[] = selectedEvent?.teams || [];
  const dances: Dance[] = selectedEvent?.dances || [];
  const judges: Judge[] = selectedEvent?.judges || [];
  const eventName: string = selectedEvent?.name || '';
  const scores: Record<
    string,
    Record<string, Record<string, ScoreValue>>
  > = selectedEvent?.scores || {};
  const finalized: Record<
    string,
    Record<string, boolean>
  > = selectedEvent?.finalized || {};
  const releasedDances: Record<string, boolean> =
    selectedEvent?.releasedDances || {};

  /**
   * Exports a single event as a JSON file.
   */
  const handleExportEvent = (event: EventData) => {
    downloadJson(event, `event_${event.name?.replace(/\s+/g, '_') || event.id}.json`);
  };

  const handleExportSelectedResults = async () => {
    const selectedEvents = events.filter(event => selectedEventIds.includes(event.id));
    if (!selectedEvents.length) return;
    setIsExportingPdf(true);
    try {
      await exportEventsResultsPdf(selectedEvents);
    } catch (err) {
      console.error('Error generating combined PDF:', err);
      alert('Failed to generate the PDF. Please try again.');
    } finally {
      setIsExportingPdf(false);
    }
  };

  /**
   * Handles the creation of a new event in the events array.
   */
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim() || !id || id === '00') return;
    try {
      await addEvent({
        name: newEventName.trim(),
        createdAt: Date.now(),
        teams: [],
        dances: [],
        judges: [],
        judgingFormat: newJudgingFormat,
        scores: {},
        multipleFinals: [],
        multipleFinalScores: {},
        multipleFinalFinalized: {},
      });
      setIsCreateModalOpen(false);
      setNewEventName('');
      setNewJudgingFormat('Original');
    } catch (err) {
      console.error('Error creating event:', err);
    }
  };

  /**
   * Confirms and executes the deletion of an event from the events array.
   */
  const confirmDelete = async () => {
    if (!eventToDelete || !id || id === '00') return;
    try {
      await deleteEvent(eventToDelete);
      setEventToDelete(null);
      if (eventID === eventToDelete) setEventID(null);
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  if (!id || id === '00')
    return (
      <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-stone-200">
        <h3 className="text-xl font-bold text-stone-900">
          Please choose a party first
        </h3>
      </div>
    );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        {eventID==null && <div className="p-1">
          <h1 className="text-4xl font-extrabold text-stone-900 tracking-tight">
            My Events
          </h1>
          <p className="mt-2 text-stone-500 text-lg">
            Manage your dance competitions
          </p>
        </div>}
        <div className="flex flex-row space-x-4">
          {' '}
          {session?.user &&
            ((session.user as SessionUser).role === 'Admin' ||
              (session.user as SessionUser).role === 'User') && eventID == null && (
              <>
                <button
                  onClick={handleExportSelectedResults}
                  disabled={selectedEventIds.length === 0 || isExportingPdf}
                  className="inline-flex items-center px-4 py-2.5 border border-green-200 text-sm font-medium rounded-full text-green-700 bg-green-50 hover:bg-green-100 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon name="Download" className="mr-2 h-5 w-5" />
                  {isExportingPdf ? 'Creating PDF…' : `Results PDF (${selectedEventIds.length})`}
                </button>
                <button
                  onClick={handleExportAll}
                  disabled={events.length === 0}
                  className="inline-flex items-center px-4 py-2.5 border border-stone-200 text-sm font-medium rounded-full text-stone-700 bg-white hover:bg-stone-50 shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon name="Download" className="mr-2 h-5 w-5" /> Export All
                </button>
                <div className="relative">
                  <input
                    type="file"
                    id="import-events"
                    accept=".json"
                    onChange={handleImport}
                    className="hidden"
                  />
                  <label
                    htmlFor="import-events"
                    className="inline-flex items-center px-4 py-2.5 border border-stone-200 text-sm font-medium rounded-full text-stone-700 bg-white hover:bg-stone-50 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    <Icon name="Upload" className="mr-2 h-5 w-5" /> Import
                  </label>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-full text-white bg-violet-600 hover:bg-violet-700 shadow-md hover:shadow-lg transition-all"
                >
                  <Icon name="Plus" className="mr-2 h-5 w-5" /> New Event
                </button>
              </>
            )}
          {session?.user &&
            ((session.user as SessionUser).role === 'Admin' ||
              (session.user as SessionUser).role === 'User' ||
              (session.user as SessionUser).role === 'Judge') &&
           eventID != null && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setEventID(null);
                }}
                className="inline-flex mt-10 items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-full text-white bg-violet-600 hover:bg-violet-700 shadow-md hover:shadow-lg transition-all"
              >
                <Icon name="X" className="mr-2 h-5 w-5" /> Back
              </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {session && (session.user as SessionUser).role === 'Judge' ? (
           eventID == null ? 
          (judgeEvents
            .map((event) => {
              return (
                <button
                  type="button"
                  key={event.id}
                  onClick={() => setEventID(event.id)}
                  className="group grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-stone-200 bg-white px-4 py-3 text-left shadow-sm transition-all hover:border-violet-300 hover:bg-violet-50/30 hover:shadow-md sm:grid-cols-[auto_minmax(0,1fr)_110px_110px_auto]"
                >
                  <div className="shrink-0 rounded-lg bg-violet-50 p-2 group-hover:bg-violet-100">
                    <Icon name="Calendar" className="h-5 w-5 text-violet-600" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-bold text-stone-900 sm:text-lg">
                      {event.name || 'Unnamed Event'}
                    </h2>
                    <p className="mt-0.5 text-xs text-stone-500">
                      {event.judgingFormat || 'Original'}
                    </p>
                    <div className="mt-1 flex gap-3 text-xs text-stone-500 sm:hidden">
                      <span>{event.teams?.length || 0} teams</span>
                      <span>{event.dances?.length || 0} dances</span>
                    </div>
                  </div>
                  <div className="hidden text-center sm:block">
                    <p className="font-bold text-stone-900">{event.teams?.length || 0}</p>
                    <p className="text-xs uppercase tracking-wide text-stone-500">Teams</p>
                  </div>
                  <div className="hidden border-l border-stone-100 text-center sm:block">
                    <p className="font-bold text-stone-900">{event.dances?.length || 0}</p>
                    <p className="text-xs uppercase tracking-wide text-stone-500">Dances</p>
                  </div>
                  <span className="inline-flex items-center gap-1 font-medium text-violet-600">
                    <span className="hidden sm:inline">Open</span>
                    <Icon name="ChevronRight" className="h-5 w-5" />
                  </span>
                </button>
              );
            })):(<></>)
        ) : eventID == null ? (
          events.map((event) => {
            return (
              <div
                key={event.id}
                onClick={(e) => {
                  e.preventDefault();
                  setEventID(event.id);
                }}
                className="block bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 relative group border border-stone-200/60 hover:border-violet-200 cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex min-w-0 flex-1 items-center space-x-4 pr-20">
                    <input
                      type="checkbox"
                      checked={selectedEventIds.includes(event.id)}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setSelectedEventIds(current => e.target.checked
                        ? [...current, event.id]
                        : current.filter(id => id !== event.id))}
                      className="h-5 w-5 shrink-0 accent-violet-600"
                      aria-label={`Select ${event.name || 'Unnamed Event'} for PDF export`}
                    />
                    <div className="shrink-0 p-3 bg-violet-50 rounded-2xl group-hover:bg-violet-100 transition-colors">
                      <Icon
                        name="Calendar"
                        className="h-7 w-7 text-violet-600"
                      />
                    </div>
                    <h2 className="min-w-0 whitespace-normal break-words text-xl font-bold text-stone-900">
                      {event.name || 'Unnamed Event'}
                    </h2>
                  </div>
                  <div className="absolute top-6 right-6 flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleExportEvent(event);
                      }}
                      className="p-2 text-stone-400 hover:text-violet-600 hover:bg-violet-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                      title="Export Event"
                    >
                      <Icon name="Download" className="h-5 w-5" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEventToDelete(event.id);
                      }}
                      className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-full opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete Event"
                    >
                      <Icon name="Trash2" className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-4 border-t border-stone-100 pt-4 sm:absolute sm:right-32 sm:top-3 sm:mt-0 sm:w-72 sm:border-0 sm:pt-0">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-stone-900">
                      {event.teams?.length || 0}
                    </p>
                    <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mt-1">
                      Teams
                    </p>
                  </div>
                  <div className="text-center border-l border-r border-stone-100">
                    <p className="text-2xl font-bold text-stone-900">
                      {event.dances?.length || 0}
                    </p>
                    <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mt-1">
                      Dances
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-stone-900">
                      {event.judges?.length || 0}
                    </p>
                    <p className="text-xs font-medium text-stone-500 uppercase tracking-wider mt-1">
                      Judges
                    </p>
                  </div>
                </div>

                {session?.user &&
                  ((session.user as SessionUser).role === 'Admin' ||
                    (session.user as SessionUser).role === 'User') && (
                    <div className="mt-3 flex items-center text-violet-600 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                      Manage Event{' '}
                      <Icon name="ChevronRight" className="ml-1 h-4 w-4" />
                    </div>
                  )}
              </div>
            );
          })
        ) : (
          <></>
        )}

        {events.length === 0 && (
          <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-stone-200">
            <div className="mx-auto w-20 h-20 bg-stone-50 rounded-full flex items-center justify-center mb-4">
              <Icon name="Calendar" className="h-10 w-10 text-stone-400" />
            </div>
            <h3 className="text-xl font-bold text-stone-900">
              No events found
            </h3>
            <p className="mt-2 text-stone-500 max-w-sm mx-auto">
              Create your first dance competition event to start adding teams,
              dances, and judges.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-6 inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-medium rounded-full text-violet-700 bg-violet-100 hover:bg-violet-200 transition-colors"
            >
              <Icon name="Plus" className="mr-2 h-5 w-5" /> Create Event
            </button>
          </div>
        )}
      </div>
      {eventID && user?.role === 'Admin' && (
        <div className="mt-8 w-full">
          <SettingsDashboard
            partyID={id}
            id={eventID}
            name={eventName}
            teams={teams}
            dances={dances}
            judges={judges}
            scores={scores}
            finalized={finalized}
            releasedDances={releasedDances}
            judgingFormat={selectedEvent?.judgingFormat || 'Original'}
            rounds={selectedEvent?.rounds}
            activeRoundId={selectedEvent?.activeRoundId}
            roundScores={selectedEvent?.roundScores}
            roundFinalized={selectedEvent?.roundFinalized}
            roundReleasedDances={selectedEvent?.roundReleasedDances}
            multipleFinals={selectedEvent?.multipleFinals}
            multipleFinalScores={selectedEvent?.multipleFinalScores}
            multipleFinalFinalized={selectedEvent?.multipleFinalFinalized}
          />
          {selectedEvent?.judgingFormat !== 'MultipleFinals' && <DisplayCompResults
            name={eventName}
            scores={scores}
            teams={teams}
            dances={dances}
            judges={judges}
            selectedDanceId={selectedDanceId!}
            judgingFormat={selectedEvent?.judgingFormat || 'Original'}
            releasedDances={releasedDances}
            finalized={finalized}
            rounds={selectedEvent?.rounds}
            activeRoundId={selectedEvent?.activeRoundId}
            roundScores={selectedEvent?.roundScores}
            roundFinalized={selectedEvent?.roundFinalized}
            roundReleasedDances={selectedEvent?.roundReleasedDances}
            isAnimationOn={false}
            colorBG={colorBG}
            textColor={textColor}
            fontSize={fontSize}
            fontSize2={fontSize2}
            fontSizeTime={fontSizeTime}
          />}
        </div>
      )}
      {eventID && user?.role === 'Judge' && (
        <div className="mt-1 w-full">
          {selectedEvent?.judgingFormat === 'MultipleFinals' ? <MultipleFinalsScoring
            key={eventID}
            partyId={id!}
            eventId={eventID}
            eventName={eventName}
            judgeId={user.id}
            teams={teams}
            dances={dances}
            finals={selectedEvent.multipleFinals || []}
            scores={selectedEvent.multipleFinalScores || {}}
            finalized={selectedEvent.multipleFinalFinalized || {}}
            onPreviousEvent={previousJudgeEventId ? () => setEventID(previousJudgeEventId) : undefined}
            onNextEvent={nextJudgeEventId ? () => setEventID(nextJudgeEventId) : undefined}
          /> : <ScoringPage
            key={eventID}
            partyID={id!}
            id={eventID}
            eventName={eventName}
            scores={scores}
            teams={teams}
            dances={dances}
            selectedDanceId={selectedDanceIdJudge!}
            judges={judges}
            currentJudgeId={user.id}
            judgingFormat={selectedEvent?.judgingFormat || 'Original'}
            finalized={finalized}
            rounds={selectedEvent?.rounds}
            activeRoundId={selectedEvent?.activeRoundId}
            roundScores={selectedEvent?.roundScores}
            roundFinalized={selectedEvent?.roundFinalized}
            onPreviousEvent={previousJudgeEventId ? () => setEventID(previousJudgeEventId) : undefined}
            onNextEvent={nextJudgeEventId ? () => setEventID(nextJudgeEventId) : undefined}
          />}
        </div>
      )}
      {/* Create Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 transform transition-all">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-stone-900">
                Create New Event
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 bg-stone-100 hover:bg-stone-200 p-2 rounded-full transition-colors"
              >
                <Icon name="X" className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateEvent}>
              <div className="mb-6">
                <label
                  htmlFor="eventName"
                  className="block text-sm font-semibold text-stone-700 mb-2"
                >
                  Event Name
                </label>
                <input
                  type="text"
                  id="eventName"
                  autoFocus
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  className="w-full rounded-xl border-stone-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-lg p-3 border transition-colors"
                  placeholder="e.g., Spring Dance Competition"
                  required
                />
              </div>
              <div className="mb-6">
                <label
                  htmlFor="judgingFormat"
                  className="block text-sm font-semibold text-stone-700 mb-2"
                >
                  Judging Format
                </label>
                <select
                  id="judgingFormat"
                  value={newJudgingFormat}
                  onChange={(e) =>
                    setNewJudgingFormat(e.target.value as JudgingFormat)
                  }
                  className="w-full rounded-xl border-stone-300 shadow-sm focus:border-violet-500 focus:ring-violet-500 text-lg p-3 border transition-colors bg-white"
                >
                  <option value="Original">
                    Original (Gold, Silver, Bronze)
                  </option>
                  <option value="Final">Final (Ranking 1 to last)</option>
                  <option value="MultiRound">2 rounds and more (Ranking 1 to last)</option>
                  <option value="MultipleFinals">Multiple finals judged together</option>
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 border border-stone-200 rounded-full text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 border border-transparent rounded-full shadow-md text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 transition-colors"
                >
                  Create Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {eventToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 transform transition-all">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <Icon name="Trash2" className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-stone-900 mb-3">
              Delete Event
            </h3>
            <p className="text-stone-500 mb-8 text-lg leading-relaxed">
              Are you sure you want to delete this event? All data, including
              teams, dances, and scores, will be permanently lost.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setEventToDelete(null)}
                className="px-5 py-2.5 border border-stone-200 rounded-full text-sm font-medium text-stone-700 hover:bg-stone-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2.5 border border-transparent rounded-full shadow-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
