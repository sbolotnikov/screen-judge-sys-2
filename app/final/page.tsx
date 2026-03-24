'use client';
import React, { useState, useEffect, FC } from 'react';
import { AppView, Event, Judge, Couple } from '../../types/types2';
import SetupScreen from './components/SetupScreen';
import EventsDashboard from './components/EventsDashboard';
import CompetitionView from './components/CompetitionView';

const Page: FC = ({}) => {
  const [appView, setAppView] = useState<AppView>(AppView.DASHBOARD);
  const [events, setEvents] = useState<Event[]>(() => {
    try {
      const savedEvents = localStorage.getItem('danceEvents');
      return savedEvents ? JSON.parse(savedEvents) : [];
    } catch (error) {
      console.error("Failed to parse events from localStorage", error);
      return [];
    }
  });
  const [activeEventId, setActiveEventId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('danceEvents', JSON.stringify(events));
  }, [events]);

  const handleNavigateToSetup = () => {
    setAppView(AppView.SETUP);
  };

  const handleSetupComplete = (eventData: { name: string; judges: Judge[]; couples: Couple[]; dances: string[] }) => {
    const newEvent: Event = {
      id: Date.now().toString(),
      ...eventData,
      status: 'IN_PROGRESS',
      rankings: {},
      danceResults: {},
      finalResults: [],
    };
    setEvents(prev => [...prev, newEvent]);
    setActiveEventId(newEvent.id);
    setAppView(AppView.COMPETITION);
  };
  
  const handleOpenEvent = (eventId: string) => {
    setActiveEventId(eventId);
    setAppView(AppView.COMPETITION);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      setEvents(prev => prev.filter(event => event.id !== eventId));
    }
  };

  const handleUpdateEvent = (updatedEvent: Event) => {
    setEvents(prev => prev.map(event => event.id === updatedEvent.id ? updatedEvent : event));
  };
  
  const handleBackToDashboard = () => {
    setActiveEventId(null);
    setAppView(AppView.DASHBOARD);
  };

  const handleImportEvent = (importedEvent: Event) => {
    // Add check to prevent duplicates if user imports the same file twice
    setEvents(prev => {
        const exists = prev.some(e => e.id === importedEvent.id);
        if (exists) {
            // Replace existing
            return prev.map(e => e.id === importedEvent.id ? importedEvent : e);
        }
        return [...prev, importedEvent];
    });
    alert(`Imported competition: ${importedEvent.name}`);
  };
  
  const renderContent = () => {
    switch (appView) {
      case AppView.SETUP:
        return <SetupScreen onSetupComplete={handleSetupComplete} onCancel={handleBackToDashboard} />;
      
      case AppView.COMPETITION:
        const activeEvent = events.find(e => e.id === activeEventId);
        if (activeEvent) {
          return (
            <CompetitionView 
              key={activeEvent.id} 
              event={activeEvent} 
              onUpdateEvent={handleUpdateEvent} 
              onBackToDashboard={handleBackToDashboard}
            />
          );
        }
        handleBackToDashboard();
        return null;

      case AppView.DASHBOARD:
      default:
        return (
          <EventsDashboard 
            events={events} 
            onCreate={handleNavigateToSetup} 
            onOpen={handleOpenEvent} 
            onDelete={handleDeleteEvent}
            onImport={handleImportEvent}
          />
        );
    }
  };

  return <div className="antialiased w-screen relative min-h-screen overflow-auto">{renderContent()}</div>;
};

export default Page;