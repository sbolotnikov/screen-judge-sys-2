export type ScreenSettingsContextType = {
  darkMode: boolean;
  changeTheme: (a: boolean) => void;
  hideNav: boolean;
  changeNav: (a: boolean) => void;
};

export type TablePage = {
  id: string;
  name: string;
  data: Record<string, unknown>; // Generic object type for table data
  settings: Record<string, unknown>; // Generic object type for table settings
};
export type Team ={
  id: string;
  name: string;
  color: string;
  logo: string;
}

export type Dance ={
  id: string;
  name: string;
}

export type Judge = {
  id: string;
  name: string;
  image: string;
}

export type ScoreValue = 'gold' | 'silver' | 'bronze' | number | null;

export type JudgingFormat = 'Original' | 'Final' | 'MultiRound' | 'MultipleFinals';

export type MultipleFinal = {
  id: string;
  name: string;
  teamIds: string[];
  danceIds: string[];
  judgeIds: string[];
  resultsFinalized?: boolean;
};

export type CompetitionRound = {
  id: string;
  name: string;
  type: 'preliminary' | 'final';
  danceIds: string[];
  judgeIds: string[];
  competitorCount: number;
  selectionCount: number;
  plannedAdvancers: number;
  eligibleTeamIds: string[];
  advancingTeamIds?: string[];
  status: 'setup' | 'active' | 'awaiting_advance' | 'completed';
};

export type EventData = {
  id: string;
  name?: string;
  createdAt?: number;
  teams: Team[];
  dances: Dance[];
  judges: Judge[];
  judgingFormat?: JudgingFormat;
  // scores structure: { [danceId]: { [judgeId]: { [teamId]: ScoreValue } } }
  scores: Record<string, Record<string, Record<string, ScoreValue>>>;
  // finalized structure: { [danceId]: { [judgeId]: boolean } }
  finalized?: Record<string, Record<string, boolean>>;
  // releasedDances structure: { [danceId]: boolean }
  releasedDances?: Record<string, boolean>;
  rounds?: CompetitionRound[];
  activeRoundId?: string;
  roundScores?: Record<string, Record<string, Record<string, Record<string, ScoreValue>>>>;
  roundFinalized?: Record<string, Record<string, Record<string, boolean>>>;
  roundReleasedDances?: Record<string, Record<string, boolean>>;
  multipleFinals?: MultipleFinal[];
  multipleFinalScores?: Record<string, Record<string, Record<string, Record<string, ScoreValue>>>>;
  multipleFinalFinalized?: Record<string, Record<string, Record<string, boolean>>>;
}

export interface Placement {
  coupleId: string;
  rank: number;
  marks: number[];
  majorityCount: number;
  majoritySum: number;
  decisionColumn?: number;
  isTie?: boolean;
}

export interface FinalResult {
  coupleId: string;
  totalScore: number;
  dancePlacements: Record<string, number>;
  finalRank: number;
  rule10Resolution?: {
    rank: number;
    isTie: boolean;
  };
  rule11Contested?: boolean;
  rule11Resolution?: {
    placementsAsMarks: number[];
    tieBreakRank: number;
    majorityCount: number;
    majoritySum: number;
  };
}

export type Rankings = Record<string, Record<string, Record<string, number>>>;
