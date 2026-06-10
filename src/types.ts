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
}
