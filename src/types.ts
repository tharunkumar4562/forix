export interface Team {
  team_name: string;
  group: string;
  elo_rating: number;
  recent_form: string;
  avg_goals_scored: number;
  avg_goals_conceded: number;
  key_player: string;
  key_player_stat: string;
  flag_emoji: string;
  confederation: string;
}

export interface PredictionResult {
  teamA_win_prob: number;
  teamB_win_prob: number;
  draw_prob: number;
  predicted_score: string;
  analysis: string;
  key_battle: string;
  tactical_tip: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  category: "Insight" | "Tactics" | "Preview" | "Breaking" | string;
  summary: string;
  content: string;
  date: string;
  readTime: string;
  tags: string[];
}

export interface MatchFixture {
  id: string;
  group: string;
  teamA: string;
  teamB: string;
  date: string;
  time: string;
  stadium: string;
  played: boolean;
  score?: string;
  flagsA?: string[];
  flagsB?: string[];
}

// ---- Live API Types (worldcup26.ir) ----

export interface LiveGame {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: string;
  away_score: string;
  home_scorers: string;
  away_scorers: string;
  group: string;
  matchday: string;
  local_date: string;
  stadium_id: string;
  finished: string;         // "TRUE" | "FALSE"
  time_elapsed: string;     // "finished" | "notstarted" | "1'" | "45+2'" etc.
  type: string;             // "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final"
  home_team_name_en: string;
  away_team_name_en: string;
  home_team_label?: string; // for knockout rounds
  away_team_label?: string;
}

export interface LiveTeamAPI {
  id: string;
  name_en: string;
  flag: string;             // full URL e.g. https://flagcdn.com/w80/ar.png
  fifa_code: string;
  iso2: string;
  groups: string;
}

export interface LiveGroupTeamEntry {
  team_id: string;
  mp: string;
  w: string;
  d: string;
  l: string;
  pts: string;
  gf: string;
  ga: string;
  gd: string;
}

export interface LiveGroup {
  name: string;
  teams: LiveGroupTeamEntry[];
}

export interface LiveStadium {
  id: string;
  name_en: string;
  fifa_name: string;
  city_en: string;
  country_en: string;
  capacity: number;
}

