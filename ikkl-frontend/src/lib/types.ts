export type MatchStatus = "LIVE" | "UPCOMING" | "COMPLETED";

export interface Team {
  id: string;
  name: string;
  shortName: string;
  color: string;
  logo?: string;
}

export interface PlayerStats {
  id: string;
  name: string;
  points: number;
}

export interface MatchStats {
  normalTouches: { count: number; points: number };
  diveTouches: { count: number; points: number };
  totalPoints: number;
  topPlayers: PlayerStats[];
  innings: [number, number];
}

export type MatchType = "league" | "final";
export type VictoryType = "POINTS" | "TIME";

export interface ScoreHistoryEntry {
  _id?: string;
  team: "A" | "B";
  teamName?: string;
  points?: number;
  category?: "normal" | "dive";
  inning?: number;
  timerSeconds?: number | null;
  scoredAt?: string;
}

export interface Match {
  id: string;
  matchId?: string;
  teamA: Team;
  teamB: Team;
  dateStr: string;
  time: string;
  venue: string;
  matchType: MatchType;
  status: MatchStatus;
  scoreA?: number;
  scoreB?: number;
  inning?: number;
  inning1ScoreA?: number;
  inning1ScoreB?: number;
  inning3ScoreA?: number;
  inning3ScoreB?: number;
  inningBreak?: boolean;
  victoryType?: VictoryType;    // how the match was decided
  winMarginSeconds?: number;    // set when victoryType === "TIME"
  statsA?: MatchStats;
  statsB?: MatchStats;
  scoreHistory?: ScoreHistoryEntry[];
}

export interface PointsRow {
  team: Team;
  played: number;
  won: number;
  lost: number;
  pf: number;
  pa: number;
  pts: number;
}
