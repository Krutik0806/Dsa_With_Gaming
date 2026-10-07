
import type { SkillStat } from "@/lib/types";

const SHORT: Record<string, string> = {
  Complexity: "Complexity",
  "Arrays & Hashing": "Arrays",
  "Lists, Stacks & Queues": "Stacks/Q",
  "Trees & Graphs": "Trees",
  "Sorting & Searching": "Search",
  "Recursion & DP": "DP",
};

export function SkillRadar({ skills }: { skills: SkillStat[] }) {
  const n = skills.length;
  if (n < 3) return null;
  const size = 300;
  const cx = size / 2;
  const cy = size / 2;
  const R = 92;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i: number, r: number) => [cx + Math.cos(angle(i)) * r, cy + Math.sin(angle(i)) * r] as const;

  const ring = (frac: number) =>
    skills
      .map((_, i) => {
        const [x, y] = pt(i, R * frac);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");

  const valuePoints = skills
    .map((s, i) => {
      const [x, y] = pt(i, R * Math.max(0.04, s.value / 100));
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const hasData = skills.some((s) => s.value > 0);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto h-auto w-full max-w-[300px]" role="img" aria-label="Skill radar chart">
      <defs>
        <filter id="cc-radar-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <radialGradient id="cc-radar-core" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.1" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={cx} cy={cy} r={R} fill="url(#cc-radar-core)" />
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <polygon
          key={f}
          points={ring(f)}
          fill="none"
          stroke={f === 1 ? "#3f3f46" : "#303036"}
          strokeWidth={f === 1 ? 1.5 : 1}
          strokeDasharray={f === 1 ? undefined : "2 4"}
        />
      ))}
      {skills.map((_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="#303036" strokeWidth="1" />;
      })}
      <polygon
        points={valuePoints}
        fill="rgba(52,211,153,0.16)"
        stroke={hasData ? "#34d399" : "#3f3f46"}
        strokeWidth="2"
        strokeLinejoin="round"
        filter={hasData ? "url(#cc-radar-glow)" : undefined}
        className="transition-all duration-700"
      />
      {skills.map((s, i) => {
        const [x, y] = pt(i, R * Math.max(0.04, s.value / 100));
        return <circle key={i} cx={x} cy={y} r={hasData && s.value > 0 ? 3.5 : 3} fill={hasData && s.value > 0 ? "#34d399" : "#3f3f46"} />;
      })}
      {skills.map((s, i) => {
        const [x, y] = pt(i, R + 26);
        return (
          <text
            key={s.category}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-zinc-500 font-mono"
            fontSize="10"
            fontWeight="600"
          >
            {SHORT[s.category] ?? s.category}
          </text>
        );
      })}
      {skills.map((s, i) => {
        const [x, y] = pt(i, R + 40);
        return (
          <text key={`v-${s.category}`} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="fill-emerald-400 font-mono" fontSize="9">
            {s.value}%
          </text>
        );
      })}
    </svg>
  );
}
