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

export type ScoreValue = 'gold' | 'silver' | 'bronze' | null;

export type EventData = {
  id: string;
  name?: string;
  createdAt?: number;
  teams: Team[];
  dances: Dance[];
  judges: Judge[];
  // scores structure: { [danceId]: { [judgeId]: { [teamId]: ScoreValue } } }
  scores: Record<string, Record<string, Record<string, ScoreValue>>>;
}
