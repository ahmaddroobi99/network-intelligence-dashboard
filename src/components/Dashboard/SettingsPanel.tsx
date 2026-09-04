import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useGraphStore } from "@/lib/graph/store";
import { cn } from "@/lib/utils";

export function SettingsPanel() {
  const open = useGraphStore((s) => s.settingsOpen);
  const setSettingsOpen = useGraphStore((s) => s.setSettingsOpen);
  const dataset = useGraphStore((s) => s.dataset);
  const setDataset = useGraphStore((s) => s.setDataset);
  const showNodeLabels = useGraphStore((s) => s.showNodeLabels);
  const showEdgeLabels = useGraphStore((s) => s.showEdgeLabels);
  const highlightNeighbors = useGraphStore((s) => s.highlightNeighbors);
  const toggleNodeLabels = useGraphStore((s) => s.toggleNodeLabels);
  const toggleEdgeLabels = useGraphStore((s) => s.toggleEdgeLabels);
  const toggleNeighbors = useGraphStore((s) => s.toggleNeighbors);
  const theme = useGraphStore((s) => s.theme);
  const setTheme = useGraphStore((s) => s.setTheme);

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Close settings"
          onClick={() => setSettingsOpen(false)}
          className="absolute inset-0 z-30 bg-background/40 transition-opacity duration-[var(--motion-fast)]"
        />
      ) : null}
      <section
        className={cn(
          "absolute inset-y-0 right-0 z-40 flex w-full max-w-sm flex-col bg-elevated shadow-[var(--shadow-border)]",
          "transition-transform duration-[var(--motion-slow)] ease-[var(--ease-smooth-out)]",
          open ? "translate-x-0" : "translate-x-full",
        )}
        aria-hidden={!open}
        inert={!open ? true : undefined}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <div>
            <h2 className="font-display text-lg tracking-tight">Settings</h2>
            <p className="text-sm text-muted">Display, dataset, and simulation</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Close settings"
            onClick={() => setSettingsOpen(false)}
          >
            <X className="size-4" />
          </Button>
        </div>
        <Separator />
        <div className="space-y-6 overflow-auto px-5 py-5">
          <fieldset>
            <legend className="mb-2 text-2xs font-medium uppercase tracking-[0.16em] text-subtle">
              Dataset
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <Choice
                active={dataset === "sample"}
                onClick={() => setDataset("sample")}
                title="Pacific ecosystem"
                detail="45 nodes"
              />
              <Choice
                active={dataset === "large"}
                onClick={() => setDataset("large")}
                title="Stress graph"
                detail="500 nodes"
              />
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-2xs font-medium uppercase tracking-[0.16em] text-subtle">
              Appearance
            </legend>
            <div className="grid grid-cols-2 gap-2">
              <Choice
                active={theme === "dark"}
                onClick={() => setTheme("dark")}
                title="Dark"
                detail="Primary"
              />
              <Choice
                active={theme === "light"}
                onClick={() => setTheme("light")}
                title="Light"
                detail="Paper"
              />
            </div>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="mb-2 text-2xs font-medium uppercase tracking-[0.16em] text-subtle">
              Graph layers
            </legend>
            <ToggleRow
              label="Node labels"
              pressed={showNodeLabels}
              onPressed={toggleNodeLabels}
            />
            <ToggleRow
              label="Edge labels"
              pressed={showEdgeLabels}
              onPressed={toggleEdgeLabels}
            />
            <ToggleRow
              label="Highlight neighbors"
              pressed={highlightNeighbors}
              onPressed={toggleNeighbors}
            />
          </fieldset>
          <div>
            <p className="mb-2 text-2xs font-medium uppercase tracking-[0.16em] text-subtle">
              Shortcuts
            </p>
            <ul className="space-y-1.5 text-sm text-muted">
              <Li keys="/" label="Focus search" />
              <Li keys="Esc" label="Clear search / deselect" />
              <Li keys="Scroll" label="Zoom toward cursor" />
              <Li keys="Drag" label="Move a node or pan" />
              <Li keys="Double-click" label="Pin or unpin a node" />
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

function Choice({
  active,
  onClick,
  title,
  detail,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  detail: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-xl px-3 py-2.5 text-left shadow-[var(--shadow-border)]",
        active ? "bg-panel text-foreground" : "text-muted hover:text-foreground",
      )}
    >
      <span className="block text-sm font-medium">{title}</span>
      <span className="block text-2xs text-subtle">{detail}</span>
    </button>
  );
}

function ToggleRow({
  label,
  pressed,
  onPressed,
}: {
  label: string;
  pressed: boolean;
  onPressed: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPressed}
      aria-pressed={pressed}
      className="flex w-full items-center justify-between rounded-xl px-1 py-1.5 text-sm text-foreground"
    >
      {label}
      <span
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors duration-150",
          pressed ? "bg-foreground" : "bg-panel",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-4 rounded-full bg-background transition-transform duration-150",
            pressed ? "translate-x-4" : "translate-x-0.5",
          )}
        />
      </span>
    </button>
  );
}

function Li({ keys, label }: { keys: string; label: string }) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <kbd className="rounded-md bg-panel px-1.5 py-0.5 font-mono text-2xs text-foreground">
        {keys}
      </kbd>
    </li>
  );
}
