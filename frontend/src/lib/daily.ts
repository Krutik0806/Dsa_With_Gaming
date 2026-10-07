// ─── Daily challenge ─────────────────────────────────────────────────────────
// One deterministic problem per calendar day — everyone in the arena faces
// the same one, and the first solve of the day banks double XP.

import { PROBLEMS, type Problem } from "./data/problems";

export function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Deterministic date hash → problem index (same for everyone that day). */
export function dailyProblem(): Problem {
  const key = todayKey();
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return PROBLEMS[h % PROBLEMS.length];
}

export function isDailyProblem(slug: string): boolean {
  return dailyProblem().slug === slug;
}

/** XP value of a problem by difficulty (mirrors XP_REWARDS). */
export function xpForProblem(difficulty: Problem["difficulty"]): number {
  return difficulty === "EASY" ? 100 : difficulty === "MEDIUM" ? 200 : 300;
}
