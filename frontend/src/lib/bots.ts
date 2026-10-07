// ─── Bot roster: your opponents in the arena ─────────────────────────────────
// In this demo, matchmaking pairs you against AI-driven opponents so a battle
// is always one click away. The same match pipeline (ELO, history, analysis)
// is used for human opponents in a production deployment.

export interface Bot {
  name: string;
  rating: number;
  skill: number; // 0..1 accuracy / problem-solving power
  tagline: string;
  color: string; // hex accent for avatar
}

export const BOTS: Bot[] = [
  { name: "byte_bandit", rating: 926, skill: 0.52, tagline: "Submits first, debugs later", color: "#f97316" },
  { name: "segfault_sam", rating: 968, skill: 0.55, tagline: "Still scared of pointers", color: "#a1a1aa" },
  { name: "queue_quinn", rating: 1002, skill: 0.58, tagline: "FIFO enthusiast", color: "#5eead4" },
  { name: "nullptr_ninja", rating: 1044, skill: 0.6, tagline: "Silent but rusty", color: "#34d399" },
  { name: "heap_hydra", rating: 1088, skill: 0.63, tagline: "Always sifts up", color: "#fbbf24" },
  { name: "bfs_baron", rating: 1141, skill: 0.66, tagline: "Explores level by level", color: "#a3e635" },
  { name: "cache_miss", rating: 1187, skill: 0.69, tagline: "Locality? never heard of it", color: "#fb923c" },
  { name: "lambda_lord", rating: 1243, skill: 0.72, tagline: "Functional until the end", color: "#2dd4bf" },
  { name: "recursion_raven", rating: 1312, skill: 0.75, tagline: "Defined in terms of itself", color: "#f472b6" },
  { name: "graph_goblin", rating: 1385, skill: 0.78, tagline: "Knows all the short paths", color: "#eab308" },
  { name: "dp_dragon", rating: 1466, skill: 0.82, tagline: "Optimal substructure incarnate", color: "#34d399" },
  { name: "mutex_max", rating: 1611, skill: 0.86, tagline: "Never races, always wins", color: "#ef4444" },
];

/** Pick an opponent close to the player's rating, with slight jitter. */
export function pickBot(userRating: number): { bot: Bot; rating: number } {
  const weighted = BOTS.map((b) => {
    const dist = Math.abs(b.rating - userRating);
    return { bot: b, w: 1 / (dist + 60) };
  });
  const total = weighted.reduce((s, x) => s + x.w, 0);
  let r = Math.random() * total;
  let chosen = weighted[0].bot;
  for (const x of weighted) {
    r -= x.w;
    if (r <= 0) {
      chosen = x.bot;
      break;
    }
  }
  const jitter = Math.round((Math.random() - 0.5) * 70);
  return { bot: chosen, rating: Math.max(400, chosen.rating + jitter) };
}
