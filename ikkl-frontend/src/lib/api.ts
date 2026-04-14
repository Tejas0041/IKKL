import type { Match, Team } from "./types";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function fetchMatches(params?: { status?: string; team?: string }): Promise<Match[]> {
  try {
    const url = new URL(`${BASE}/matches`);
    if (params?.status) url.searchParams.set("status", params.status);
    if (params?.team) url.searchParams.set("team", params.team);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error("Failed to fetch matches");
    return res.json();
  } catch {
    const { MOCK_MATCHES } = await import("./mock-data");
    return MOCK_MATCHES;
  }
}

export async function fetchMatch(matchId: string) {
  const res = await fetch(`${BASE}/matches/${matchId}`);
  if (!res.ok) throw new Error("Match not found");
  return res.json();
}

export async function fetchTeams(): Promise<Team[]> {
  try {
    const res = await fetch(`${BASE}/teams`);
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchSettings(): Promise<Record<string, string>> {
  try {
    const res = await fetch(`${BASE}/settings`);
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return { leagueStartDate: "2026-04-03T00:00", leagueEndDate: "2026-04-05T00:00", leagueVenue: "Parade Ground, IIEST Shibpur" };
  }
}

export async function fetchTimer(matchId: string): Promise<{ remainingMs: number; running: boolean; visible: boolean; savedAt: number | null }> {
  try {
    const res = await fetch(`${BASE}/timer/${matchId}`);
    if (!res.ok) throw new Error();
    return res.json();
  } catch {
    return { remainingMs: 7 * 60 * 1000, running: false, visible: true, savedAt: null };
  }
}
