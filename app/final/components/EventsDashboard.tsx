'use client';
import React, { useRef } from 'react';
import { Event } from '@/types/types2';

interface EventsDashboardProps {
    events: Event[];
    onCreate: () => void;
    onOpen: (eventId: string) => void;
    onDelete: (eventId: string) => void;
    onImport: (importedEvent: Event) => void;
}

const EventsDashboard: React.FC<EventsDashboardProps> = ({ events, onCreate, onOpen, onDelete, onImport }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                // Basic validation
                if (json.name && json.id && Array.isArray(json.judges) && Array.isArray(json.couples)) {
                    onImport(json);
                } else {
                    alert("Invalid JSON format. Please ensure this is a valid DanceSport Pro export.");
                }
            } catch (err) {
                alert("Failed to parse JSON file.");
            }
        };
        reader.readAsText(file);
        // Reset input
        e.target.value = '';
    };

    return (
        <div className="min-h-screen bg-slate-900 p-4 sm:p-12 w-full relative overflow-auto">
            <div className="max-w-4xl mx-auto absolute top-0 left-0">
                <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
                    <div className="text-center md:text-left">
                        <h1 className="text-5xl font-black text-white tracking-tighter mb-2">DanceSport Pro</h1>
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Professional Skating System Scorer</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                        <button
                            onClick={handleImportClick}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-black py-4 px-8 rounded-2xl border border-slate-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Import JSON
                        </button>
                        <button
                            onClick={onCreate}
                            className="bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black py-4 px-10 rounded-2xl shadow-xl shadow-sky-600/20 transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <span className="text-xl">+</span> New Event
                        </button>
                    </div>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept=".json" 
                        className="hidden" 
                    />
                </div>

                {events.length === 0 ? (
                    <div className="text-center bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-3xl p-20 flex flex-col items-center">
                        <div className="w-20 h-20 bg-slate-900 rounded-full flex items-center justify-center mb-6 text-slate-700">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black text-slate-300 mb-2">No Active Competitions</h2>
                        <p className="text-slate-500 font-medium max-w-xs">Create your first dance event or import existing results to get started.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {events.sort((a,b) => parseInt(b.id) - parseInt(a.id)).map(event => (
                            <div key={event.id} className="group relative bg-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-center shadow-lg border border-slate-700/50 hover:border-sky-500/50 transition-all duration-300 overflow-hidden">
                                <div className="absolute top-0 left-0 w-1.5 h-full bg-slate-700 group-hover:bg-sky-500 transition-all"></div>
                                <div className="text-center sm:text-left mb-6 sm:mb-0">
                                    <h3 className="text-2xl font-black text-white group-hover:text-sky-400 transition-colors mb-2">{event.name}</h3>
                                    <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${event.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                                            {event.status === 'COMPLETED' ? 'Finalized' : 'Draft'}
                                        </span>
                                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-900 text-slate-500 border border-slate-700">
                                            {event.dances.length} Dances
                                        </span>
                                        <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-slate-900 text-slate-500 border border-slate-700">
                                            {event.couples.length} Couples
                                        </span>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                     <button
                                        onClick={() => {
                                            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(event, null, 2));
                                            const downloadAnchorNode = document.createElement('a');
                                            downloadAnchorNode.setAttribute("href", dataStr);
                                            downloadAnchorNode.setAttribute("download", `${event.name.replace(/\s+/g, '_')}_${event.status.toLowerCase()}.json`);
                                            document.body.appendChild(downloadAnchorNode);
                                            downloadAnchorNode.click();
                                            downloadAnchorNode.remove();
                                        }}
                                        className="w-12 h-12 flex items-center justify-center bg-slate-900 rounded-xl text-slate-500 hover:text-sky-400 hover:bg-sky-500/10 transition-all border border-slate-700"
                                        title="Export JSON"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                        </svg>
                                    </button>
                                     <button
                                        onClick={() => onDelete(event.id)}
                                        className="w-12 h-12 flex items-center justify-center bg-slate-900 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all border border-slate-700"
                                        aria-label="Delete event"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => onOpen(event.id)}
                                        className="bg-sky-600 hover:bg-sky-500 text-white font-black py-3 px-8 rounded-xl shadow-lg transition-all transform active:scale-95"
                                    >
                                        {event.status === 'COMPLETED' ? 'View Final' : 'Open System'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default EventsDashboard;
