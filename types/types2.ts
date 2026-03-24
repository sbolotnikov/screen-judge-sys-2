export enum AppView {
  DASHBOARD = 'DASHBOARD',
  SETUP = 'SETUP',
  COMPETITION = 'COMPETITION',
}

export interface Judge {
  id: number;
  name: string;
  image?: string;
}

export interface Couple {
  id: number;
  name: string;
}

export interface Placement {
  coupleId: number;
  rank: number;
  marks: number[];
  majorityCount: number;
  majoritySum: number;
  isTie?: boolean;
}

export interface FinalResult {
  coupleId: number;
  totalScore: number;
  dancePlacements: Record<string, number>;
  finalRank: number;
  rule10Resolution?: {
    rank: number;
    isTie: boolean;
  };
  rule11Resolution?: {
    placementsAsMarks: number[];
    tieBreakRank: number;
    majorityCount: number;
    majoritySum: number;
  };
}

export type Rankings = Record<string, Record<number, Record<number, number>>>;

export interface Event {
  id: string;
  name: string;
  judges: Judge[];
  couples: Couple[];
  dances: string[];
  status: 'IN_PROGRESS' | 'COMPLETED';
  rankings: Rankings;
  danceResults: Record<string, Placement[]>;
  finalResults: FinalResult[];
}
