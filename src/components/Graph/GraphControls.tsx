import type { ReactNode } from "react";
import {
  Flame,
  Focus,
  Lock,
  Minus,
  Plus,
  RotateCcw,
  Scan,
  Snowflake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useGraphStore } from "@/lib/graph/store";

function Control({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={label}
          onClick={onClick}
          className="size-9 text-muted hover:text-foreground"
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

export function GraphControls() {
  const engineApi = useGraphStore((s) => s.engineApi);
  const status = useGraphStore((s) => s.status);
  const selectedId = useGraphStore((s) => s.selectedId);
  const frozen = status === "frozen";

  return (
    <div className="absolute left-3 top-3 z-10 flex flex-col rounded-2xl bg-elevated/90 p-1 shadow-[var(--shadow-border)] backdrop-blur-sm md:left-4 md:top-4">
      <Control label="Zoom in" onClick={() => engineApi?.zoomBy(1.18)}>
        <Plus className="size-4" />
      </Control>
      <Control label="Zoom out" onClick={() => engineApi?.zoomBy(0.84)}>
        <Minus className="size-4" />
      </Control>
      <Control label="Fit graph to viewport" onClick={() => engineApi?.fit()}>
        <Scan className="size-4" />
      </Control>
      <Control
        label="Center selected node"
        onClick={() => selectedId && engineApi?.centerNode(selectedId)}
      >
        <Focus className="size-4" />
      </Control>
      <Control label="Reset layout" onClick={() => engineApi?.reset()}>
        <RotateCcw className="size-4" />
      </Control>
      <Control label="Reheat simulation" onClick={() => engineApi?.reheat()}>
        <Flame className="size-4" />
      </Control>
      <Control
        label={frozen ? "Unfreeze simulation" : "Freeze simulation"}
        onClick={() => (frozen ? engineApi?.unfreeze() : engineApi?.freeze())}
      >
        {frozen ? <Lock className="size-4" /> : <Snowflake className="size-4" />}
      </Control>
    </div>
  );
}
