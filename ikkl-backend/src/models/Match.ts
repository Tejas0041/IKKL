import mongoose, { Schema, Document } from "mongoose";

const PlayerStatsSchema = new Schema({
  id: String,
  name: String,
  points: Number,
}, { _id: false });

const TouchStatsSchema = new Schema({
  count: Number,
  points: Number,
}, { _id: false });

const MatchStatsSchema = new Schema({
  normalTouches: TouchStatsSchema,
  diveTouches: TouchStatsSchema,
  totalPoints: Number,
  topPlayers: [PlayerStatsSchema],
  innings: { type: [Number], default: [0, 0] },
}, { _id: false });

const ScoreHistoryEntrySchema = new Schema({
  team: { type: String, enum: ["A", "B"], required: true },
  teamName: String,
  points: Number,
  category: { type: String, enum: ["normal", "dive"] },
  inning: Number,
  timerSeconds: Number,  // remaining seconds on match timer when scored
  scoredAt: { type: Date, default: Date.now },
}, { _id: true });

const TeamRefSchema = new Schema({
  id: String,
  name: String,
  shortName: String,
  color: String,
  logo: String,
}, { _id: false });

export interface IScoreHistoryEntry {
  _id?: string;
  team: "A" | "B";
  teamName?: string;
  points?: number;
  category?: "normal" | "dive";
  inning?: number;
  timerSeconds?: number;
  scoredAt?: Date;
}

export interface IMatch extends Document {
  matchId: string;
  teamA: typeof TeamRefSchema;
  teamB: typeof TeamRefSchema;
  dateStr: string;
  time: string;
  venue: string;
  matchType: "league" | "final";  // league = 2 innings, final = up to 4 innings
  status: "LIVE" | "UPCOMING" | "COMPLETED";
  scoreA?: number;
  scoreB?: number;
  inning?: number;
  inning1ScoreA?: number;
  inning1ScoreB?: number;
  inning3ScoreA?: number;  // score snapshot after inning 3 (final only)
  inning3ScoreB?: number;
  inningBreak?: boolean;        // true during the break between innings
  victoryType?: "POINTS" | "TIME"; // how the match was decided
  winMarginSeconds?: number;       // only set when victoryType === "TIME"
  statsA?: typeof MatchStatsSchema;
  statsB?: typeof MatchStatsSchema;
  scoreHistory?: IScoreHistoryEntry[];
}

const MatchSchema = new Schema<IMatch>({
  matchId: { type: String, required: true, unique: true },
  teamA: { type: TeamRefSchema, required: true },
  teamB: { type: TeamRefSchema, required: true },
  dateStr: { type: String, required: true },
  time: { type: String, required: true },
  venue: { type: String, required: true },
  matchType: { type: String, enum: ["league", "final"], default: "league" },
  status: { type: String, enum: ["LIVE", "UPCOMING", "COMPLETED"], default: "UPCOMING" },
  scoreA: Number,
  scoreB: Number,
  inning: { type: Number, default: 1 },
  inning1ScoreA: Number,
  inning1ScoreB: Number,
  inning3ScoreA: Number,
  inning3ScoreB: Number,
  inningBreak: { type: Boolean, default: false },
  victoryType: { type: String, enum: ["POINTS", "TIME"] },
  winMarginSeconds: Number,
  statsA: MatchStatsSchema,
  statsB: MatchStatsSchema,
  scoreHistory: { type: [ScoreHistoryEntrySchema], default: [] },
}, { timestamps: true });

export const Match = mongoose.model<IMatch>("Match", MatchSchema);
