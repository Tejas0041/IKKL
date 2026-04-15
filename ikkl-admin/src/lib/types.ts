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

export type VictoryType = "POINTS" | "TIME";

export interface Match {
  id: string;
  matchId?: string;
  teamA: Team;
  teamB: Team;
  dateStr: string;
  time: string;
  venue: string;
  status: MatchStatus;
  scoreA?: number;
  scoreB?: number;
  inning?: number;
  inning1ScoreA?: number;
  inning1ScoreB?: number;
  inningBreak?: boolean;
  victoryType?: VictoryType;
  winMarginSeconds?: number;
  statsA?: MatchStats;
  statsB?: MatchStats;
}
