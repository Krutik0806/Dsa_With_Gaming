
import type { VizKind } from "@/lib/data/lessons";
import { SortViz } from "./sort-viz";
import { TwoPointerViz } from "./two-pointer-viz";
import { BinSearchViz } from "./binsearch-viz";
import { StackViz } from "./stack-viz";
import { BSTViz } from "./bst-viz";
import { BFSViz } from "./bfs-viz";
import { DPViz } from "./dp-viz";
import { BigOViz } from "./big-o-viz";

export function LessonViz({ kind }: { kind: VizKind }) {
  switch (kind) {
    case "big-o":
      return <BigOViz />;
    case "sort":
      return <SortViz />;
    case "two-pointer":
      return <TwoPointerViz />;
    case "binsearch":
      return <BinSearchViz />;
    case "stack":
      return <StackViz />;
    case "bst":
      return <BSTViz />;
    case "bfs":
      return <BFSViz />;
    case "dp":
      return <DPViz />;
    default:
      return null;
  }
}
