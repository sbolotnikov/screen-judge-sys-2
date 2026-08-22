import type { EventData, Placement, Rankings } from '@/types/types';
import { calculateDancePlacements, calculateFinalResults } from '@/services/skatingSystem';

type PdfDocument = InstanceType<typeof import('jspdf')['jsPDF']>;
type AutoTable = typeof import('jspdf-autotable')['default'];

const safeName = (value: string) => value.replace(/[^a-z0-9_-]+/gi, '_').replace(/^_+|_+$/g, '');

export async function exportEventsResultsPdf(events: EventData[]) {
  if (!events.length || typeof window === 'undefined') return;
  const { jsPDF } = await import('jspdf/dist/jspdf.umd.min.js');
  const { default: autoTable } = await import('jspdf-autotable');
  const doc = new jsPDF('l', 'mm', 'a4');

  events.forEach((event, eventIndex) => {
    if (eventIndex) doc.addPage();
    addEventResults(doc, autoTable, event);
  });

  const date = new Date().toISOString().slice(0, 10);
  doc.save(`${events.length === 1 ? safeName(events[0].name || 'event') : 'selected_events'}_results_${date}.pdf`);
}

function addEventResults(doc: PdfDocument, autoTable: AutoTable, event: EventData) {
  const title = event.name || 'Unnamed Event';
  doc.setFontSize(21);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.text(`Format: ${event.judgingFormat || 'Original'}`, 14, 25);

  if (event.judgingFormat === 'MultiRound') return addMultiRound(doc, autoTable, event);
  if (event.judgingFormat === 'MultipleFinals') return addMultipleFinals(doc, autoTable, event);

  const dances = event.dances.filter(dance => event.releasedDances?.[dance.id]);
  if (!dances.length) return addEmptyMessage(doc, 'No released results are available for this event.');

  if ((event.judgingFormat || 'Original') === 'Original') {
    const ranked = event.teams.map(team => ({
      team,
      points: dances.reduce((total, dance) => total + event.judges.reduce((subtotal, judge) => {
        if (!event.finalized?.[dance.id]?.[judge.id]) return subtotal;
        const mark = event.scores[dance.id]?.[judge.id]?.[team.id];
        return subtotal + (mark === 'gold' ? 3 : mark === 'silver' ? 2 : mark === 'bronze' ? 1 : 0);
      }, 0), 0),
    })).sort((a, b) => b.points - a.points);
    autoTable(doc, {
      startY: 31,
      head: [['Rank', 'Team', 'Total points']],
      body: ranked.map((item, index) => [index + 1, item.team.name, item.points]),
      theme: 'grid', headStyles: { fillColor: [139, 92, 246] },
    });
    dances.forEach(dance => {
      doc.addPage();
      doc.setFontSize(16); doc.text(`${title} - ${dance.name}`, 14, 18);
      autoTable(doc, {
        startY: 24,
        head: [['Team', ...event.judges.map(judge => judge.name)]],
        body: event.teams.map(team => [team.name, ...event.judges.map(judge => event.finalized?.[dance.id]?.[judge.id] ? event.scores[dance.id]?.[judge.id]?.[team.id] ?? '-' : '-')]),
        theme: 'grid',
      });
    });
    return;
  }

  addSkatingSummary(doc, autoTable, event, event.teams, dances.map(dance => dance.id), event.judges.map(judge => judge.id), event.scores, 31);
}

function addMultiRound(doc: PdfDocument, autoTable: AutoTable, event: EventData) {
  const rounds = event.rounds || [];
  if (!rounds.length) return addEmptyMessage(doc, 'No competition rounds are available for this event.');
  rounds.forEach((round, index) => {
    if (index) doc.addPage();
    if (index) { doc.setFontSize(21); doc.text(event.name || 'Unnamed Event', 14, 18); }
    doc.setFontSize(15); doc.text(round.name, 14, index ? 27 : 34);
    const startY = index ? 33 : 40;
    const teams = event.teams.filter(team => !round.eligibleTeamIds.length || round.eligibleTeamIds.includes(team.id));
    if (round.type === 'preliminary') {
      const danceIds = round.danceIds.length ? round.danceIds : event.dances.map(dance => dance.id);
      const judgeIds = round.judgeIds.length ? round.judgeIds : event.judges.map(judge => judge.id);
      const totals = teams.map(team => ({ team, points: danceIds.reduce((sum, danceId) => sum + judgeIds.reduce((judgeSum, judgeId) => {
        const mark = event.roundScores?.[round.id]?.[danceId]?.[judgeId]?.[team.id];
        return judgeSum + (typeof mark === 'number' ? mark : 0);
      }, 0), 0) })).sort((a, b) => b.points - a.points);
      autoTable(doc, { startY, head: [['Rank', 'Couple', 'Points', 'Result']], body: totals.map((item, rank) => [rank + 1, item.team.name, item.points, round.advancingTeamIds?.includes(item.team.id) ? 'Advanced' : '']), theme: 'grid' });
      return;
    }
    const danceIds = (round.danceIds.length ? round.danceIds : event.dances.map(dance => dance.id)).filter(id => event.roundReleasedDances?.[round.id]?.[id]);
    const judgeIds = round.judgeIds.length ? round.judgeIds : event.judges.map(judge => judge.id);
    if (!danceIds.length) addEmptyMessage(doc, 'No released results are available for this round.', startY);
    else addSkatingSummary(doc, autoTable, event, teams, danceIds, judgeIds, event.roundScores?.[round.id] || {}, startY);
  });
}

function addMultipleFinals(doc: PdfDocument, autoTable: AutoTable, event: EventData) {
  const finals = (event.multipleFinals || []).filter(item => item.resultsFinalized);
  if (!finals.length) return addEmptyMessage(doc, 'No finalized results are available for this event.');
  finals.forEach((final, index) => {
    if (index) doc.addPage();
    if (index) { doc.setFontSize(21); doc.text(event.name || 'Unnamed Event', 14, 18); }
    doc.setFontSize(15); doc.text(final.name, 14, index ? 27 : 34);
    const teams = event.teams.filter(team => final.teamIds.includes(team.id));
    addSkatingSummary(doc, autoTable, event, teams, final.danceIds, final.judgeIds, event.multipleFinalScores?.[final.id] || {}, index ? 33 : 40);
  });
}

function addSkatingSummary(doc: PdfDocument, autoTable: AutoTable, event: EventData, teams: EventData['teams'], danceIds: string[], judgeIds: string[], scores: EventData['scores'], startY: number) {
  const rankings: Rankings = {};
  const danceResults: Record<string, Placement[]> = {};
  danceIds.forEach(danceId => {
    rankings[danceId] = {};
    judgeIds.forEach(judgeId => {
      rankings[danceId][judgeId] = {};
      teams.forEach(team => {
        const mark = scores[danceId]?.[judgeId]?.[team.id];
        rankings[danceId][judgeId][team.id] = typeof mark === 'number' ? mark : teams.length + 1;
      });
    });
    danceResults[danceId] = calculateDancePlacements(rankings[danceId], teams, judgeIds.length);
  });
  const results = calculateFinalResults(danceResults, teams, danceIds, rankings, judgeIds);
  autoTable(doc, {
    startY,
    head: [['Rank', 'Couple', ...danceIds.map(id => event.dances.find(dance => dance.id === id)?.name || id), 'Total']],
    body: results.map(result => [result.finalRank, teams.find(team => team.id === result.coupleId)?.name || result.coupleId, ...danceIds.map(id => result.dancePlacements[id] ?? '-'), result.totalScore]),
    theme: 'grid', headStyles: { fillColor: [139, 92, 246] },
  });
}

function addEmptyMessage(doc: PdfDocument, message: string, y = 34) {
  doc.setFontSize(12);
  doc.text(message, 14, y);
}
