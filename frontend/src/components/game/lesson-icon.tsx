import { ArrowDownUp, BookOpen, Boxes, Gauge, GitBranch, Layers, ScanSearch, Sigma, Waypoints } from "lucide-react";

const MAP: Record<string, typeof Gauge> = {
  gauge: Gauge,
  boxes: Boxes,
  "arrow-down-up": ArrowDownUp,
  "scan-search": ScanSearch,
  layers: Layers,
  "git-branch": GitBranch,
  waypoints: Waypoints,
  sigma: Sigma,
};

export function LessonIcon({ icon, className }: { icon: string; className?: string }) {
  const Icon = MAP[icon] ?? BookOpen;
  return <Icon className={className} />;
}
