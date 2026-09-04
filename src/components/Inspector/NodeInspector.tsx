import { Pin, PinOff, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { ConnectionList } from "@/components/Inspector/ConnectionList";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import {
  indexGraph,
  neighborTypeCounts,
} from "@/lib/graph/graphUtils";
import { useGraphStore } from "@/lib/graph/store";
import { CLUSTER_LABELS, NODE_TYPE_LABELS } from "@/lib/graph/types";
import { NODE_COLORS } from "@/lib/graph/visual";
import { cn } from "@/lib/utils";

export function NodeInspector() {
  const selectedId = useGraphStore((s) => s.selectedId);
  const inspectorOpen = useGraphStore((s) => s.inspectorOpen);
  const data = useGraphStore((s) => s.data);
  const selectNode = useGraphStore((s) => s.selectNode);
  const engineApi = useGraphStore((s) => s.engineApi);
  const desktop = useMediaQuery("(min-width: 768px)");
  const indexed = useMemo(() => indexGraph(data), [data]);
  const node = selectedId ? indexed.byId.get(selectedId) : undefined;
  const [pinTick, setPinTick] = useState(0);
  void pinTick;

  const open = desktop || (inspectorOpen && Boolean(selectedId));

  useEffect(() => {
    engineApi?.setInset({
      top: 24,
      left: 72,
      bottom: 24,
      right: desktop ? 360 : 24,
    });
  }, [desktop, engineApi]);
  const counts = node ? neighborTypeCounts(node.id, indexed) : {};
  const degree = node ? (indexed.degree.get(node.id) ?? 0) : 0;
  const pinned = node ? Boolean(engineApi?.isPinned(node.id)) : false;

  return (
    <aside
      className={cn(
        "absolute z-20 flex flex-col overflow-hidden bg-elevated/95 shadow-[var(--shadow-border)] backdrop-blur-sm",
        "inset-x-3 bottom-3 max-h-[52vh] rounded-t-2xl rounded-b-2xl",
        "md:inset-y-4 md:right-16 md:left-auto md:w-80 md:max-h-none md:rounded-2xl",
        "transition-[opacity,transform] duration-[var(--motion-slow)] ease-[var(--ease-smooth-out)]",
        open
          ? "pointer-events-auto translate-y-0 opacity-100 md:translate-x-0"
          : "pointer-events-none translate-y-3 opacity-0 md:translate-x-3 md:translate-y-0",
      )}
      aria-hidden={!open}
    >
      {!node ? (
        <div className="flex flex-1 flex-col justify-center px-5 py-8">
          <p className="font-display text-base tracking-tight text-foreground">
            Select a node
          </p>
          <p className="mt-1 text-sm text-muted">
            Click any node to inspect its details.
          </p>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3 px-4 py-4">
            <span
              className="mt-1 size-2.5 shrink-0 rounded-full"
              style={{ background: NODE_COLORS[node.type] }}
            />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-lg leading-tight tracking-tight text-foreground">
                {node.label}
              </h2>
              <p className="mt-1 text-2xs font-medium uppercase tracking-[0.16em] text-subtle">
                {NODE_TYPE_LABELS[node.type]}
                {node.cluster ? ` · ${CLUSTER_LABELS[node.cluster] ?? node.cluster}` : ""}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label={pinned ? "Unpin node" : "Pin node"}
              onClick={() => {
                engineApi?.pinNode(node.id, !pinned);
                setPinTick((n) => n + 1);
              }}
            >
              {pinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Close inspector"
              onClick={() => selectNode(null)}
            >
              <X className="size-4" />
            </Button>
          </div>
          <p className="px-4 pb-3 text-sm leading-relaxed text-muted">
            {node.description}
          </p>
          <Separator />
          <div className="grid grid-cols-3 gap-2 px-4 py-3">
            <Stat label="Degree" value={degree} />
            <Stat label="Importance" value={Math.round((node.importance ?? 0) * 100)} suffix="%" />
            <Stat
              label="Projects"
              value={counts.project ?? 0}
            />
          </div>
          <Separator />
          <div className="px-4 py-3">
            <p className="mb-2 text-2xs font-medium uppercase tracking-[0.16em] text-subtle">
              Properties
            </p>
            <dl className="space-y-1.5 text-sm">
              <Row term="ID" detail={node.id} mono />
              {node.metadata
                ? Object.entries(node.metadata).map(([key, value]) => (
                    <Row
                      key={key}
                      term={key}
                      detail={String(value)}
                    />
                  ))
                : null}
            </dl>
          </div>
          <Separator />
          <div className="min-h-0 flex-1 overflow-auto px-2 py-3">
            <p className="mb-1 px-2 text-2xs font-medium uppercase tracking-[0.16em] text-subtle">
              Connections
            </p>
            <ConnectionList nodeId={node.id} indexed={indexed} />
          </div>
        </>
      )}
    </aside>
  );
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: number;
  suffix?: string;
}) {
  return (
    <div>
      <p className="text-2xs uppercase tracking-[0.14em] text-subtle">{label}</p>
      <p className="mt-0.5 font-display text-lg tabular-nums tracking-tight text-foreground">
        {value}
        {suffix ? <span className="text-sm text-muted">{suffix}</span> : null}
      </p>
    </div>
  );
}

function Row({
  term,
  detail,
  mono,
}: {
  term: string;
  detail: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-2xs uppercase tracking-[0.12em] text-subtle">{term}</dt>
      <dd
        className={cn(
          "truncate text-right text-sm text-foreground",
          mono && "font-mono text-xs",
        )}
      >
        {detail}
      </dd>
    </div>
  );
}
