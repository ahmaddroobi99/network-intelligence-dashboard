import { useMemo } from "react";
import { indexGraph, neighborTypeCounts } from "@/lib/graph/graphUtils";
import { useGraphStore } from "@/lib/graph/store";
import { NODE_TYPE_LABELS } from "@/lib/graph/types";

export function GraphTooltip() {
  const hoveredId = useGraphStore((s) => s.hoveredId);
  const tooltipPos = useGraphStore((s) => s.tooltipPos);
  const data = useGraphStore((s) => s.data);
  const selectedId = useGraphStore((s) => s.selectedId);

  const indexed = useMemo(() => indexGraph(data), [data]);
  const node = hoveredId ? indexed.byId.get(hoveredId) : undefined;

  if (!node || !tooltipPos || hoveredId === selectedId) return null;

  const degree = indexed.degree.get(node.id) ?? 0;
  const counts = neighborTypeCounts(node.id, indexed);

  return (
    <div
      className="pointer-events-none absolute z-20 w-56 rounded-xl bg-elevated/95 p-3 shadow-[var(--shadow-border)] backdrop-blur-sm"
      style={{
        left: tooltipPos.x + 16,
        top: tooltipPos.y + 16,
      }}
    >
      <p className="text-sm font-medium tracking-tight text-foreground">{node.label}</p>
      <p className="mt-0.5 text-2xs font-medium uppercase tracking-[0.14em] text-subtle">
        {NODE_TYPE_LABELS[node.type]}
      </p>
      {node.description ? (
        <p className="mt-2 text-xs leading-snug text-muted">{node.description}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-2xs text-subtle">
        <span>
          Connections <span className="tabular-nums text-foreground">{degree}</span>
        </span>
        {counts.project ? (
          <span>
            Projects <span className="tabular-nums text-foreground">{counts.project}</span>
          </span>
        ) : null}
        {counts.company ? (
          <span>
            Companies <span className="tabular-nums text-foreground">{counts.company}</span>
          </span>
        ) : null}
      </div>
    </div>
  );
}
