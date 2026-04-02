'use client';
import { createContext, useState, useContext, ReactNode } from 'react';
import { collection, doc, updateDoc, arrayUnion, arrayRemove, useCollection, useDocument } from '@/hooks/useMongoDb';
const db = null;
import { EventData } from '@/types/types';

interface PartyContextType {
  image: string;
  name: string;
  message: string;
  message2: string;
  fontSize2: number;
  mode: string;
  fontName: string;
  fontSize: number;
  fontSizeTime: number;
  frameStyle: string;
  displayedPictures: { link: string; name: string; dances: string[] }[];
  displayedVideos: {
    name: string;
    image: string;
    link: string;
    dances: string[];
  }[];
  videoChoice: { link: string; name: string };
  compLogo: { link: string; name: string };
  titleBarHider: boolean;
  showUrgentMessage: boolean;
  showTable: boolean;
  tablePages: {
    name: string;
    tableRows: string[];
    rowsPictures: string[] | undefined;
    rowsChecked: boolean[];
  }[];
  tableChoice: number;
  showHeatNumber: boolean;
  heatNum: string;
  showSVGAnimation: boolean;
  showBackdrop: boolean;
  unmuteVideos: boolean;
  displayedPicturesAuto: { link: string; name: string }[];
  seconds: number;
  manualPicture: { link: string; name: string };
  savedMessages: string[];
  textColor: string;
  colorBG: string;
  id: string;
  animationSpeed: number;
  speedVariation: number;
  particleCount: number;
  maxSize: number;
  animationOption: number;
  rainAngle: number;
  originX: number;
  originY: number;
  compChoice: string;
  particleTypes: string[];
  events: EventData[];
  eventID: string;
  selectedDanceId?: string;
  selectedDanceIdJudge?: string;
}
interface ReturnPartyContextType extends PartyContextType {
  setCompID: (id: string) => void;
  addEvent: (event: Omit<EventData, 'id'>) => Promise<void>;
  addEvents: (events: EventData[]) => Promise<void>;
  updateEvent: (eventId: string, event: Partial<EventData>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  updateEventField: <K extends keyof EventData>(eventId: string, field: K, value: EventData[K]) => Promise<void>;
}

export const PartyContext = createContext<ReturnPartyContextType>(
  {} as ReturnPartyContextType,
);

export function PartySettingsProvider({ children }: { children: ReactNode }) {
  const [compID, setCompID] = useState('00');
  const partyArray: PartyContextType = {
    image: '',
    name: '',
    message: '',
    message2: '',
    fontSize2: 5,
    mode: '',
    fontName: '',
    fontSize: 10,
    fontSizeTime: 10,
    frameStyle: 'No frame',
    displayedPictures: [],
    displayedVideos: [],
    videoChoice: { link: '', name: '' },
    compLogo: { link: '', name: '' },
    titleBarHider: false,
    showUrgentMessage: false,
    showTable: false,
    unmuteVideos: false,
    selectedDanceId: 'all',
    selectedDanceIdJudge: '',
    tablePages: [
      {
        name: '',
        tableRows: [''],
        rowsPictures: undefined,
        rowsChecked: [false],
      },
    ],
    tableChoice: 0,
    showHeatNumber: false,
    heatNum: '',
    showSVGAnimation: false,
    showBackdrop: false,
    displayedPicturesAuto: [],
    seconds: 0,
    manualPicture: { link: '', name: '' },
    savedMessages: [''],
    textColor: '',
    colorBG: '',
    id: '',
    animationSpeed: 0,
    speedVariation: 0,
    particleCount: 0,
    maxSize: 0,
    animationOption: 0,
    rainAngle: 0,
    originX: 0,
    originY: 0,
    compChoice: '112',
    events: [],
    eventID: '',
    particleTypes: [
      'star',
      'kiss',
      'snowflake',
      'heart',
      'tower',
      'LP',
      'maple',
      'rose',
      'diamond',
      'clover',
      'streamer',
      'lightning',
      'hydrangea',
      'fred',
    ],
  };

  const [value, loading, error] = useDocument(doc(db, 'parties', compID), {
    snapshotListenOptions: { includeMetadataChanges: true },
  });
 
  const party = value
    ? ({ ...partyArray, ...value.data(), id: compID } as PartyContextType)
    : partyArray;

  const addEvent = async (event: Omit<EventData, 'id'>) => {
    if (!compID || compID === '00') return;
    const newEvent: EventData = { ...event, id: crypto.randomUUID() };
    await updateDoc(doc(db, 'parties', compID), {
      events: arrayUnion(newEvent),
    });
  };

  const addEvents = async (newEvents: EventData[]) => {
    if (!compID || compID === '00' || !newEvents.length) return;
    
    // Ensure all new events have IDs and create a clean merge
    const sanitizedEvents = newEvents.map(event => ({
      ...event,
      id: event.id || crypto.randomUUID(),
      createdAt: event.createdAt || Date.now()
    }));

    // We merge with existing events to avoid replacing everything if that's preferred
    // but here we might want to just append them to the existing array in Firestore
    // Using arrayUnion with multiple elements might work if db driver supports it, 
    // but let's just update the whole array for simplicity and reliability here
    const updatedEvents = [...party.events, ...sanitizedEvents];
    
    await updateDoc(doc(db, 'parties', compID), {
      events: updatedEvents,
    });
  };

  const deleteEvent = async (eventId: string) => {
    if (!compID || compID === '00') return;
    const eventToRemove = party.events.find((e) => e.id === eventId);
    if (eventToRemove) {
      await updateDoc(doc(db, 'parties', compID), {
        events: arrayRemove(eventToRemove),
      });
    }
  };

  const updateEvent = async (eventId: string, updatedEvent: Partial<EventData>) => {
    if (!compID || compID === '00') return;
    const newEvents = party.events.map((e) =>
      e.id === eventId ? { ...e, ...updatedEvent } : e,
    );
    await updateDoc(doc(db, 'parties', compID), {
      events: newEvents,
    });
  };

  const updateEventField = async <K extends keyof EventData>(
    eventId: string,
    field: K,
    value: EventData[K],
  ) => {
    if (!compID || compID === '00') return;
    
    // Safety check: avoid updating if events are empty but we have an eventId (likely loading stale)
    if (party.events.length === 0 && eventId) {
      console.warn("Update aborted: events array is empty in current state.");
      return;
    }

    const newEvents = party.events.map((e) =>
      e.id === eventId ? { ...e, [field]: value } : e,
    );
    
    await updateDoc(doc(db, 'parties', compID), {
      events: newEvents,
    });
  };

  const contextValue: ReturnPartyContextType = {
    ...party,
    setCompID,
    addEvent,
    addEvents,
    updateEvent,
    deleteEvent,
    updateEventField
  };

  return (
    <PartyContext.Provider value={contextValue}>
      {children}
    </PartyContext.Provider>
  );
}

export default function usePartySettings(): ReturnPartyContextType {
  const context = useContext(PartyContext);
  return context;
}
