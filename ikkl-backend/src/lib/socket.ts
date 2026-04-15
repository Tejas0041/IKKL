import { Server as SocketServer } from "socket.io";
import type { Server as HttpServer } from "http";

let io: SocketServer | null = null;

export function initSocket(server: HttpServer) {
  io = new SocketServer(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.on("connection", (socket) => {
    socket.on("join:match", (matchId: string) => socket.join(`match:${matchId}`));
    socket.on("leave:match", (matchId: string) => socket.leave(`match:${matchId}`));

    // Timer control from admin
    socket.on("timer:update", (data: { matchId: string; seconds: number; ms: number; running: boolean; visible: boolean }) => {
      io?.to(`match:${data.matchId}`).emit("timer:update", data);
    });

    // Break timer control from admin
    socket.on("break:update", (data: { matchId: string; seconds: number; running: boolean }) => {
      io?.to(`match:${data.matchId}`).emit("break:update", data);
    });
  });

  return io;
}

export function emitScoreUpdate(matchId: string, payload: {
  scoreA: number;
  scoreB: number;
  status: string;
  scoringTeam: "A" | "B";
  points: number;
  category: "normal" | "dive";
  teamName: string;
}) {
  io?.to(`match:${matchId}`).emit("score:update", payload);
  io?.emit("scores:changed"); // global broadcast for navbar live indicator
}

export function getIO() { return io; }
