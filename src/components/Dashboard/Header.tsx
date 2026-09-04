import { Moon, Settings2, Share2, Sun } from "lucide-react";
import { SearchBar } from "@/components/Dashboard/SearchBar";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { indexGraph, searchNodes } from "@/lib/graph/graphUtils";
import { useGraphStore } from "@/lib/graph/store";

export function Header() {
  const data = useGraphStore((s) => s.data);
  const status = useGraphStore((s) => s.status);
  const theme = useGraphStore((s) => s.theme);
  const setTheme = useGraphStore((s) => s.setTheme);
  const setSettingsOpen = useGraphStore((s) => s.setSettingsOpen);
  const searchQuery = useGraphStore((s) => s.searchQuery);
  const indexed = indexGraph(data);
  const matchCount = searchQuery.trim()
    ? searchNodes(data.nodes, searchQuery).length
    : null;

  const statusLabel =
    status === "frozen"
      ? "Frozen"
      : status === "stabilizing"
        ? "Stabilizing"
        : "Running";

  return (
    <header className="z-20 flex h-14 shrink-0 items-center gap-3 border-b border-border px-3 md:px-4">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg bg-elevated shadow-[var(--shadow-border)]">
          <Share2 className="size-3.5 rotate-90 text-accent" aria-hidden />
        </span>
        <div className="min-w-0 leading-tight">
          <p className="truncate font-display text-sm font-medium tracking-tight text-foreground">
            Network Intelligence
          </p>
          <p className="hidden truncate text-2xs text-subtle sm:block">
            Interactive relationship explorer
          </p>
        </div>
      </div>

      <div className="mx-auto hidden min-w-0 flex-1 justify-center md:flex">
        <SearchBar />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden items-center gap-3 pr-2 text-2xs uppercase tracking-[0.12em] text-subtle lg:flex">
          <Metric label="Nodes" value={indexed.nodes.length} />
          <Metric label="Edges" value={indexed.edges.length} />
          {matchCount !== null ? <Metric label="Matches" value={matchCount} /> : null}
          <span className="flex items-center gap-1.5">
            <span
              className={
                status === "frozen"
                  ? "size-1.5 rounded-full bg-muted"
                  : status === "running"
                    ? "size-1.5 rounded-full bg-accent"
                    : "size-1.5 rounded-full bg-warn"
              }
            />
            {statusLabel}
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle theme</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Open settings"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Settings</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <span className="flex items-center gap-1.5">
      {label}
      <span className="tabular-nums text-foreground">{value}</span>
    </span>
  );
}
