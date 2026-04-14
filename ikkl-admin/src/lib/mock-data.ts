import type { Match, Team } from "./types";

export const TEAMS: Record<string, Team> = {
  THU: { id: "THU", name: "Thunderbolts", shortName: "THU", color: "#3b82f6" },
  PHO: { id: "PHO", name: "Phoenix Riders", shortName: "PHO", color: "#f97316" },
  VEL: { id: "VEL", name: "Velocity Squad", shortName: "VEL", color: "#a855f7" },
  STE: { id: "STE", name: "Steel Hawks", shortName: "STE", color: "#94a3b8" },
  BLA: { id: "BLA", name: "Blaze Warriors", shortName: "BLA", color: "#ef4444" },
  NIG: { id: "NIG", name: "Night Runners", shortName: "NIG", color: "#4338ca" },
  CYC: { id: "CYC", name: "Cyclone FC", shortName: "CYC", color: "#2dd4bf" },
  IRO: { id: "IRO", name: "Iron Tigers", shortName: "IRO", color: "#d97706" },
};

export const MOCK_MATCHES: Match[] = [
  { id: "m1", teamA: TEAMS.THU, teamB: TEAMS.PHO, dateStr: "March 28", time: "2:00 PM", venue: "Ground A", status: "COMPLETED", scoreA: 34, scoreB: 28 },
  { id: "m2", teamA: TEAMS.BLA, teamB: TEAMS.NIG, dateStr: "March 28", time: "4:30 PM", venue: "Ground B", status: "COMPLETED", scoreA: 41, scoreB: 35 },
  { id: "m3", teamA: TEAMS.VEL, teamB: TEAMS.STE, dateStr: "March 29", time: "11:00 AM", venue: "Ground A", status: "COMPLETED", scoreA: 29, scoreB: 32 },
  { id: "m4", teamA: TEAMS.CYC, teamB: TEAMS.IRO, dateStr: "March 29", time: "2:00 PM", venue: "Ground B", status: "LIVE", scoreA: 21, scoreB: 18 },
  { id: "m5", teamA: TEAMS.THU, teamB: TEAMS.BLA, dateStr: "March 29", time: "4:30 PM", venue: "Ground A", status: "UPCOMING" },
  { id: "m6", teamA: TEAMS.PHO, teamB: TEAMS.NIG, dateStr: "March 30", time: "10:00 AM", venue: "Ground B", status: "UPCOMING" },
  { id: "m7", teamA: TEAMS.STE, teamB: TEAMS.CYC, dateStr: "March 30", time: "2:00 PM", venue: "Ground A", status: "UPCOMING" },
  { id: "m8", teamA: TEAMS.IRO, teamB: TEAMS.VEL, dateStr: "March 30", time: "4:00 PM", venue: "Ground B", status: "UPCOMING" },
];
