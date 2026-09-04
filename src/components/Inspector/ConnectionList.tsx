import { relationshipLabel } from "@/lib/graph/graphUtils";
import type { IndexedGraph } from "@/lib/graph/graphUtils";
import { NODE_TYPE_LABELS } from "@/lib/graph/types";
import { NODE_COLORS } from "@/lib/graph/visual";
import { useGraphStore } from "@/lib/graph/store";

export function ConnectionList({
  nodeId,
  indexed,
}: {
  nodeId: string;
  indexed: IndexedGraph;
}) {
  const selectNode = useGraphStore((s) => s.selectNode);
  const edges = indexed.edgesByNode.get(nodeId) ?? [];

  if (edges.length === 0) {
    return <p className="text-sm text-muted">No recorded connections.</p>;
  }

  return (
    <ul className="space-y-0.5">
      {edges.map((edge) => {
        const otherId = edge.source === nodeId ? edge.target : edge.source;
        const other = indexed.byId.get(otherId);
        if (!other) return null;
        const outbound = edge.source === nodeId;
        return (
          <li key={edge.id}>
            <button
              type="button"
              onClick={() => selectNode(other.id, true)}
              className="flex w-full items-start gap-2 rounded-xl px-2 py-1.5 text-left hover:bg-panel"
            >
              <span
                className="mt-1.5 size-2 shrink-0 rounded-full"
                style={{ background: NODE_COLORS[other.type] }}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-foreground">
                  {other.label}
                </span>
                <span className="block text-2xs text-subtle">
                  {outbound ? "→" : "←"} {relationshipLabel(edge.relationship)}
                  <span className="ml-1.5 uppercase tracking-wider">
                    {NODE_TYPE_LABELS[other.type]}
                  </span>
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
