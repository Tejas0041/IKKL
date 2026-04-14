import { io, Socket } from "socket.io-client";

const URL = (import.meta.env.VITE_API_URL as string)?.replace("/api", "") || "http://localhost:3000";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) socket = io(URL, { transports: ["websocket", "polling"] });
  return socket;
}
