const BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

function getToken() { return localStorage.getItem("ikkl_token") || ""; }

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(getToken() ? { "Authorization": `Bearer ${getToken()}` } : {}),
      ...((options?.headers as Record<string, string>) || {}),
    },
    ...options,
  });
  if (res.status === 401) {
    localStorage.removeItem("ikkl_token");
    window.location.href = "/";
    throw new Error("Unauthorized");
  }
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const api = {
  login: async (email: string, password: string): Promise<string> => {
    const res = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error((await res.json() as { error: string }).error || "Login failed");
    const data = await res.json() as { token: string };
    return data.token;
  },
  getMatches: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return req<unknown[]>(`/matches${qs}`);
  },
  getMatch: (id: string) => req<unknown>(`/matches/${id}`),
  createMatch: (data: unknown) => req<unknown>("/matches", { method: "POST", body: JSON.stringify(data) }),
  updateMatch: (id: string, data: unknown) => req<unknown>(`/matches/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  updateScore: (id: string, data: { scoreA: number; scoreB: number; status?: string; scoringTeam?: "A" | "B"; points?: number; category?: "normal" | "dive"; teamName?: string }) =>
    req<unknown>(`/matches/${id}/score`, { method: "PATCH", body: JSON.stringify(data) }),
  endInning: (id: string, action: "end_inning1" | "end_match") =>
    req<unknown>(`/matches/${id}/inning`, { method: "PATCH", body: JSON.stringify({ action }) }),
  deleteMatch: (id: string) => req<unknown>(`/matches/${id}`, { method: "DELETE" }),
  getTeams: () => req<unknown[]>("/teams"),
  createTeam: (data: unknown) => req<unknown>("/teams", { method: "POST", body: JSON.stringify(data) }),
  updateTeam: (id: string, data: unknown) => req<unknown>(`/teams/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTeam: (id: string) => req<unknown>(`/teams/${id}`, { method: "DELETE" }),
  getSettings: () => req<Record<string, string>>("/settings"),
  updateSetting: (key: string, value: string) => req<unknown>(`/settings/${key}`, { method: "PUT", body: JSON.stringify({ value }) }),
  getTimer: (matchId: string) => req<{ remainingMs: number; running: boolean; visible: boolean; savedAt: number | null }>(`/timer/${matchId}`),
  saveTimer: (matchId: string, data: { remainingMs: number; running: boolean; visible: boolean }) =>
    req<unknown>(`/timer/${matchId}`, { method: "PUT", body: JSON.stringify(data) }),
  uploadFile: async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${BASE}/upload`, {
      method: "POST",
      headers: { ...(getToken() ? { "Authorization": `Bearer ${getToken()}` } : {}) },
      body: form,
    });
    if (res.status === 401) { localStorage.removeItem("ikkl_token"); window.location.href = "/"; throw new Error("Unauthorized"); }
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json() as { url: string };
    return data.url;
  },
};
