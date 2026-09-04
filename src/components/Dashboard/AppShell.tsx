import { useEffect } from "react";
import { Header } from "@/components/Dashboard/Header";
import { MetricsBar } from "@/components/Dashboard/MetricsBar";
import { SettingsPanel } from "@/components/Dashboard/SettingsPanel";
import { GraphControls } from "@/components/Graph/GraphControls";
import { GraphLegend } from "@/components/Graph/GraphLegend";
import { GraphTooltip } from "@/components/Graph/GraphTooltip";
import { NetworkCanvas } from "@/components/Graph/NetworkCanvas";
import { NodeInspector } from "@/components/Inspector/NodeInspector";
import { TooltipProvider } from "@/components/ui/tooltip";
import { hydratePreferences, useGraphStore } from "@/lib/graph/store";

export function AppShell() {
  const hintVisible = useGraphStore((s) => s.hintVisible);
  const dismissHint = useGraphStore((s) => s.dismissHint);

  useEffect(() => {
    hydratePreferences();
  }, []);

  useEffect(() => {
    if (!hintVisible) return;
    const t = window.setTimeout(() => dismissHint(), 5200);
    return () => window.clearTimeout(t);
  }, [hintVisible, dismissHint]);

  return (
    <TooltipProvider delayDuration={250}>
      <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
        <Header />
        <div className="relative min-h-0 flex-1">
          <NetworkCanvas />
          <GraphControls />
          <GraphLegend />
          <GraphTooltip />
          <NodeInspector />
          <SettingsPanel />
          {hintVisible ? (
            <p className="pointer-events-none absolute bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-full bg-elevated/90 px-3 py-1.5 text-xs text-muted shadow-[var(--shadow-border)]">
              Drag nodes · scroll to zoom · click to inspect
            </p>
          ) : null}
        </div>
        <MetricsBar />
      </div>
    </TooltipProvider>
  );
}
