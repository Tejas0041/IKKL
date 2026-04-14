import { io, Socket } from "socket.io-client";

const URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:3000";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io(URL, { transports: ["websocket", "polling"] });
  }
  return socket;
}

export interface ScoreUpdate {
  scoreA: number;
  scoreB: number;
  status: string;
  scoringTeam: "A" | "B";
  points: number;
  category: "normal" | "dive";
  teamName: string;
}

export interface TimerUpdate {
  matchId: string;
  seconds: number;
  ms?: number;
  running: boolean;
  visible: boolean;
}
