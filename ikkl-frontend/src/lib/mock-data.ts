import type { Match, Team } from "./types";

export const TEAMS: Record<string, Team> = {
  THU: { id: "THU", name: "Thunderbolts", shortName: "THU", color: "bg-blue-500" },
  PHO: { id: "PHO", name: "Phoenix Riders", shortName: "PHO", color: "bg-orange-500" },
  VEL: { id: "VEL", name: "Velocity Squad", shortName: "VEL", color: "bg-purple-500" },
  STE: { id: "STE", name: "Steel Hawks", shortName: "STE", color: "bg-slate-400" },
  BLA: { id: "BLA", name: "Blaze Warriors", shortName: "BLA", color: "bg-red-600" },
  NIG: { id: "NIG", name: "Night Runners", shortName: "NIG", color: "bg-indigo-900" },
  CYC: { id: "CYC", name: "Cyclone FC", shortName: "CYC", color: "bg-teal-400" },
  IRO: { id: "IRO", name: "Iron Tigers", shortName: "IRO", color: "bg-amber-600" },
};

export const MOCK_MATCHES: Match[] = [
  {
    id: "m1", teamA: TEAMS.THU, teamB: TEAMS.PHO,
    dateStr: "March 28", time: "2:00 PM", venue: "Ground A", status: "COMPLETED", matchType: "league",
    scoreA: 34, scoreB: 28,
    statsA: { normalTouches: { count: 18, points: 18 }, diveTouches: { count: 8, points: 16 }, totalPoints: 34, topPlayers: [{ id: "p1", name: "Arjun Mehta", points: 12 }, { id: "p2", name: "Raj Singh", points: 8 }, { id: "p3", name: "Dev Patel", points: 7 }], innings: [15, 19] },
    statsB: { normalTouches: { count: 16, points: 16 }, diveTouches: { count: 6, points: 12 }, totalPoints: 28, topPlayers: [{ id: "p4", name: "Ravi Kumar", points: 10 }, { id: "p5", name: "Sam Nair", points: 9 }, { id: "p6", name: "Kiran Das", points: 5 }], innings: [14, 14] }
  },
  {
    id: "m2", teamA: TEAMS.BLA, teamB: TEAMS.NIG,
    dateStr: "March 28", time: "4:30 PM", venue: "Ground B", status: "COMPLETED", matchType: "league",
    scoreA: 41, scoreB: 35,
    statsA: { normalTouches: { count: 21, points: 21 }, diveTouches: { count: 10, points: 20 }, totalPoints: 41, topPlayers: [{ id: "p7", name: "Vikram Sen", points: 15 }, { id: "p8", name: "Amit Bose", points: 12 }], innings: [20, 21] },
    statsB: { normalTouches: { count: 19, points: 19 }, diveTouches: { count: 8, points: 16 }, totalPoints: 35, topPlayers: [{ id: "p9", name: "Suresh Das", points: 14 }, { id: "p10", name: "Rahul Jha", points: 11 }], innings: [18, 17] }
  },
  { id: "m3", teamA: TEAMS.VEL, teamB: TEAMS.STE, dateStr: "March 29", time: "11:00 AM", venue: "Ground A", status: "COMPLETED", matchType: "league", scoreA: 29, scoreB: 32, statsA: { normalTouches: { count: 15, points: 15 }, diveTouches: { count: 7, points: 14 }, totalPoints: 29, topPlayers: [{ id: "p11", name: "Suresh Das", points: 12 }, { id: "p12", name: "Tariq Ali", points: 9 }], innings: [14, 15] }, statsB: { normalTouches: { count: 16, points: 16 }, diveTouches: { count: 8, points: 16 }, totalPoints: 32, topPlayers: [{ id: "p13", name: "Manish Gupta", points: 14 }, { id: "p14", name: "Ojas Singh", points: 10 }], innings: [16, 16] } },
  { id: "m4", teamA: TEAMS.CYC, teamB: TEAMS.IRO, dateStr: "March 29", time: "2:00 PM", venue: "Ground B", status: "LIVE", matchType: "league", scoreA: 21, scoreB: 18 },
  { id: "m5", teamA: TEAMS.THU, teamB: TEAMS.BLA, dateStr: "March 29", time: "4:30 PM", venue: "Ground A", status: "UPCOMING", matchType: "league" },
  { id: "m6", teamA: TEAMS.PHO, teamB: TEAMS.NIG, dateStr: "March 30", time: "10:00 AM", venue: "Ground B", status: "UPCOMING", matchType: "league" },
  { id: "m7", teamA: TEAMS.STE, teamB: TEAMS.CYC, dateStr: "March 30", time: "2:00 PM", venue: "Ground A", status: "UPCOMING", matchType: "league" },
  { id: "m8", teamA: TEAMS.IRO, teamB: TEAMS.VEL, dateStr: "March 30", time: "4:00 PM", venue: "Ground B", status: "UPCOMING", matchType: "league" },
  { id: "m9", teamA: TEAMS.NIG, teamB: TEAMS.THU, dateStr: "April 1", time: "11:00 AM", venue: "Ground A", status: "UPCOMING", matchType: "league" },
  { id: "m10", teamA: TEAMS.BLA, teamB: TEAMS.PHO, dateStr: "April 1", time: "3:00 PM", venue: "Ground B", status: "UPCOMING", matchType: "league" },
  { id: "m11", teamA: TEAMS.VEL, teamB: TEAMS.CYC, dateStr: "April 2", time: "11:00 AM", venue: "Ground A", status: "UPCOMING", matchType: "league" },
  { id: "m12", teamA: TEAMS.STE, teamB: TEAMS.IRO, dateStr: "April 2", time: "3:00 PM", venue: "Ground B", status: "UPCOMING", matchType: "league" },
];

export const HIGHLIGHTS = {
  matchesPlayed: 12,
  totalPointsScored: 284,
  activeTeams: 8,
  avgPointsMatch: 47,
};
