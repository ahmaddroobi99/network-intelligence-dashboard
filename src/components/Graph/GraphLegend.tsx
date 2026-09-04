import { NODE_COLORS } from "@/lib/graph/visual";
import { NODE_TYPE_LABELS, NODE_TYPES, type NodeType } from "@/lib/graph/types";

function TypeMark({ type }: { type: NodeType }) {
  const color = NODE_COLORS[type];
  const common = "size-2.5 shrink-0 border border-black/30";
  switch (type) {
    case "person":
      return <span className={`${common} rounded-full`} style={{ background: color }} />;
    case "company":
      return <span className={`${common} rounded-[3px]`} style={{ background: color }} />;
    case "project":
      return (
        <span
          className={`${common} rotate-45 rounded-[1px]`}
          style={{ background: color }}
        />
      );
    case "technology":
      return (
        <span
          className={common}
          style={{
            background: color,
            clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
            border: "none",
          }}
        />
      );
    case "dataset":
      return (
        <span
          className="h-2 w-3 shrink-0 rounded-full border border-black/30"
          style={{ background: color }}
        />
      );
    case "location":
      return (
        <span
          className="size-2.5 shrink-0"
          style={{
            background: color,
            clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
          }}
        />
      );
    case "event":
      return (
        <span
          className="size-2.5 shrink-0"
          style={{
            background: color,
            clipPath:
              "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)",
          }}
        />
      );
    default:
      return <span className={`${common} rounded-full`} style={{ background: color }} />;
  }
}

export function GraphLegend() {
  return (
    <aside className="absolute bottom-3 left-3 z-10 hidden max-w-44 rounded-2xl bg-elevated/90 p-3 shadow-[var(--shadow-border)] backdrop-blur-sm sm:block md:bottom-4 md:left-4">
      <p className="mb-2 text-2xs font-medium uppercase tracking-[0.16em] text-subtle">
        Node types
      </p>
      <ul className="space-y-1.5">
        {NODE_TYPES.map((type) => (
          <li key={type} className="flex items-center gap-2 text-xs text-muted">
            <TypeMark type={type} />
            <span>{NODE_TYPE_LABELS[type]}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
