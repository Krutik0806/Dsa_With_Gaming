// ─── Real-Time Arena Relay & Matchmaking Server ──────────────────────────────
import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";

export type ArenaMode = "QUIZ" | "CODE";

interface QueueEntry {
  socketId: string;
  userId: string;
  name: string;
  rating: number;
  mode: ArenaMode;
  difficulty: string;
  color: string;
  frame: string | null;
  joinedAt: number;
}

interface ActiveMatch {
  matchId: string;
  mode: ArenaMode;
  seed: number;
  p1: QueueEntry;
  p2: QueueEntry;
}

export function setupArenaServer(httpServer: HttpServer, frontendUrl: string) {
  const io = new Server(httpServer, {
    cors: {
      origin: frontendUrl || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  const queues: Record<ArenaMode, QueueEntry[]> = {
    QUIZ: [],
    CODE: [],
  };

  const activeMatches = new Map<string, ActiveMatch>();
  const socketToMatch = new Map<string, string>();

  function broadcastStats() {
    io.emit("stats:queue", {
      online: io.engine.clientsCount,
      inQueue: {
        QUIZ: queues.QUIZ.length,
        CODE: queues.CODE.length,
      },
    });
  }

  function tryMatch(mode: ArenaMode) {
    const queue = queues[mode];
    if (queue.length < 2) return;

    // Pick top 2 players
    const p1 = queue.shift()!;
    const p2 = queue.shift()!;

    const matchId = `live_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const seed = Math.floor(Math.random() * 1000000);
    const startsAt = Date.now() + 2500;

    activeMatches.set(matchId, { matchId, mode, seed, p1, p2 });
    socketToMatch.set(p1.socketId, matchId);
    socketToMatch.set(p2.socketId, matchId);

    const s1 = io.sockets.sockets.get(p1.socketId);
    const s2 = io.sockets.sockets.get(p2.socketId);

    if (s1) s1.join(matchId);
    if (s2) s2.join(matchId);

    // Notify Player 1
    if (s1) {
      s1.emit("match:found", {
        matchId,
        mode,
        seed,
        startsAt,
        opponent: {
          userId: p2.userId,
          name: p2.name,
          rating: p2.rating,
          color: p2.color,
          frame: p2.frame,
        },
      });
    }

    // Notify Player 2
    if (s2) {
      s2.emit("match:found", {
        matchId,
        mode,
        seed,
        startsAt,
        opponent: {
          userId: p1.userId,
          name: p1.name,
          rating: p1.rating,
          color: p1.color,
          frame: p1.frame,
        },
      });
    }

    broadcastStats();
  }

  io.on("connection", (socket: Socket) => {
    broadcastStats();

    // Player joins matchmaking queue
    socket.on("queue:join", (data: Omit<QueueEntry, "socketId" | "joinedAt">) => {
      const mode = data.mode || "CODE";
      // Remove any existing entry for this socket or user
      queues[mode] = queues[mode].filter(
        (e) => e.socketId !== socket.id && e.userId !== data.userId
      );

      const entry: QueueEntry = {
        ...data,
        socketId: socket.id,
        joinedAt: Date.now(),
      };

      queues[mode].push(entry);
      broadcastStats();

      // Check if matchmaking criteria met
      tryMatch(mode);
    });

    // Player leaves matchmaking queue
    socket.on("queue:leave", () => {
      for (const mode of ["QUIZ", "CODE"] as ArenaMode[]) {
        queues[mode] = queues[mode].filter((e) => e.socketId !== socket.id);
      }
      broadcastStats();
    });

    // ── Code clash event relay ──────────────────────────────────────────────
    socket.on("code:submit", (data: { matchId: string; passed: number; total: number; timeSec: number; label: string; accepted: boolean }) => {
      socket.to(data.matchId).emit("code:opp:submit", data);
    });

    // ── Quiz clash event relay ──────────────────────────────────────────────
    socket.on("quiz:lock", (data: { matchId: string; round: number; pick: number; timeMs: number; points: number }) => {
      socket.to(data.matchId).emit("quiz:opp:lock", data);
    });

    // Match cleanly completed or voided
    socket.on("match:end", (data: { matchId: string }) => {
      activeMatches.delete(data.matchId);
      socketToMatch.delete(socket.id);
      socket.leave(data.matchId);
    });

    // Disconnection cleanup
    socket.on("disconnect", () => {
      for (const mode of ["QUIZ", "CODE"] as ArenaMode[]) {
        queues[mode] = queues[mode].filter((e) => e.socketId !== socket.id);
      }

      const matchId = socketToMatch.get(socket.id);
      if (matchId) {
        socket.to(matchId).emit("opp:left");
        activeMatches.delete(matchId);
        socketToMatch.delete(socket.id);
      }

      broadcastStats();
    });
  });

  return io;
}
