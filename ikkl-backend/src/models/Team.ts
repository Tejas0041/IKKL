import mongoose, { Schema, Document } from "mongoose";

export interface ITeam extends Document {
  id: string;
  name: string;
  shortName: string;
  color: string;
  logo?: string;
}

const TeamSchema = new Schema<ITeam>({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  shortName: { type: String, required: true },
  color: { type: String, required: true },
  logo: { type: String },
}, { timestamps: true });

export const Team = mongoose.model<ITeam>("Team", TeamSchema);
