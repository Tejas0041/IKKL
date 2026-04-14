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

const TeamRefSchema = new Schema({
  id: String,
  name: String,
  shortName: String,
  color: String,
  logo: String,
}, { _id: false });

export interface IMatch extends Document {
  matchId: string;
  teamA: typeof TeamRefSchema;
  teamB: typeof TeamRefSchema;
  dateStr: string;
  time: string;
  venue: string;
  status: "LIVE" | "UPCOMING" | "COMPLETED";
  scoreA?: number;
  scoreB?: number;
  inning?: number; // 1 or 2
  inning1ScoreA?: number;
  inning1ScoreB?: number;
  statsA?: typeof MatchStatsSchema;
  statsB?: typeof MatchStatsSchema;
}

const MatchSchema = new Schema<IMatch>({
  matchId: { type: String, required: true, unique: true },
  teamA: { type: TeamRefSchema, required: true },
  teamB: { type: TeamRefSchema, required: true },
  dateStr: { type: String, required: true },
  time: { type: String, required: true },
  venue: { type: String, required: true },
  status: { type: String, enum: ["LIVE", "UPCOMING", "COMPLETED"], default: "UPCOMING" },
  scoreA: Number,
  scoreB: Number,
  inning: { type: Number, default: 1 },
  inning1ScoreA: Number,
  inning1ScoreB: Number,
  statsA: MatchStatsSchema,
  statsB: MatchStatsSchema,
}, { timestamps: true });

export const Match = mongoose.model<IMatch>("Match", MatchSchema);
