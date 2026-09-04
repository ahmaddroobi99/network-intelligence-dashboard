import { SearchBar } from "@/components/Dashboard/SearchBar";
import { indexGraph } from "@/lib/graph/graphUtils";
import { useGraphStore } from "@/lib/graph/store";

export function MetricsBar() {
  const data = useGraphStore((s) => s.data);
  const selectedId = useGraphStore((s) => s.selectedId);
  const status = useGraphStore((s) => s.status);
  const showNodeLabels = useGraphStore((s) => s.showNodeLabels);
  const showEdgeLabels = useGraphStore((s) => s.showEdgeLabels);
  const highlightNeighbors = useGraphStore((s) => s.highlightNeighbors);
  const toggleNodeLabels = useGraphStore((s) => s.toggleNodeLabels);
  const toggleEdgeLabels = useGraphStore((s) => s.toggleEdgeLabels);
  const toggleNeighbors = useGraphStore((s) => s.toggleNeighbors);
  const indexed = indexGraph(data);

  return (
    <footer className="z-20 flex shrink-0 flex-col gap-2 border-t border-border px-3 py-2 md:h-11 md:flex-row md:items-center md:px-4 md:py-0">
      <div className="md:hidden">
        <SearchBar />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-2xs uppercase tracking-[0.12em] text-subtle">
        <span>
          Nodes{" "}
          <span className="tabular-nums text-foreground">{indexed.nodes.length}</span>
        </span>
        <span>
          Edges{" "}
          <span className="tabular-nums text-foreground">{indexed.edges.length}</span>
        </span>
        <span>
          Clusters{" "}
          <span className="tabular-nums text-foreground">{indexed.clusters.length}</span>
        </span>
        <span>
          Selected{" "}
          <span className="tabular-nums text-foreground">{selectedId ? 1 : 0}</span>
        </span>
        <span className="hidden sm:inline">
          Simulation{" "}
          <span className="text-foreground">
            {status === "frozen" ? "Frozen" : status === "stabilizing" ? "Stabilizing" : "Running"}
          </span>
        </span>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-1">
        <Toggle pressed={showNodeLabels} onPressed={toggleNodeLabels} label="Node labels" />
        <Toggle pressed={showEdgeLabels} onPressed={toggleEdgeLabels} label="Edge labels" />
        <Toggle
          pressed={highlightNeighbors}
          onPressed={toggleNeighbors}
          label="Neighbors"
        />
      </div>
    </footer>
  );
}

function Toggle({
  pressed,
  onPressed,
  label,
}: {
  pressed: boolean;
  onPressed: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onPressed}
      className={
        pressed
          ? "h-7 rounded-lg bg-panel px-2.5 text-2xs font-medium uppercase tracking-[0.12em] text-foreground"
          : "h-7 rounded-lg px-2.5 text-2xs font-medium uppercase tracking-[0.12em] text-subtle hover:text-foreground"
      }
    >
      {label}
    </button>
  );
}
