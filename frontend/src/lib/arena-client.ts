
// ─── Arena live client — human matchmaking over WebSocket ────────────────────
// Singleton socket to the arena relay (mini-services/arena, port 3003 through
// the gateway). Pages import the typed helpers and wire their own handlers.

import { io, type Socket } from "socket.io-client";

export type ArenaMode = "QUIZ" | "CODE";

export interface ArenaQueueStats {
  online: number;
  inQueue: { QUIZ: number; CODE: number };
}

export interface ArenaOpponent {
  userId: string;
  name: string;
  rating: number;
  color: string;
  frame: string | null;
}

export interface ArenaMatchFound {
  matchId: string;
  mode: ArenaMode;
  seed: number;
  startsAt: number;
  opponent: ArenaOpponent;
}

export interface ArenaQuizLock {
  round: number;
  pick: number;
  timeMs: number;
  points: number;
}

export interface ArenaCodeSubmit {
  passed: number;
  total: number;
  timeSec: number;
  label: string;
  accepted: boolean;
}

let socket: Socket | null = null;
let connected = false;

export function getArenaSocket(): Socket {
  if (!socket) {
    socket = io({
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 1000,
      timeout: 8000,
    });
    socket.on("connect", () => {
      connected = true;
    });
    socket.on("disconnect", () => {
      connected = false;
    });
  }
  return socket;
}

export function isArenaConnected(): boolean {
  return connected;
}

/** Subscribe to live presence stats (players online / in queue). Returns an
 *  unsubscribe fn. Fires immediately with the last known value if connected. */
export function onQueueStats(cb: (stats: ArenaQueueStats) => void): () => void {
  const s = getArenaSocket();
  const handler = (stats: ArenaQueueStats) => cb(stats);
  s.on("queue:stats", handler);
  return () => {
    s.off("queue:stats", handler);
  };
}

/** Fire-and-forget queue join. */
export function joinQueue(payload: {
  userId: string;
  name: string;
  rating: number;
  mode: ArenaMode;
  color: string;
  frame: string | null;
  difficulty?: string;
}): void {
  getArenaSocket().emit("queue:join", payload);
}

export function leaveQueue(): void {
  getArenaSocket().emit("queue:leave");
}

export function emitQuizLock(payload: { matchId: string; round: number; pick: number; timeMs: number; points: number }): void {
  getArenaSocket().emit("quiz:lock", payload);
}

export function emitCodeSubmit(payload: { matchId: string; passed: number; total: number; timeSec: number; label: string; accepted: boolean }): void {
  getArenaSocket().emit("code:submit", payload);
}

export function emitMatchEnd(matchId: string): void {
  getArenaSocket().emit("match:end", { matchId });
}
