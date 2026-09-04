import { useEffect, useRef } from "react";
import { GraphEngine } from "@/lib/graph/engine";
import { searchNodes } from "@/lib/graph/graphUtils";
import { useGraphStore } from "@/lib/graph/store";

export function NetworkCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GraphEngine | null>(null);
  const data = useGraphStore((s) => s.data);
  const dataset = useGraphStore((s) => s.dataset);
  const selectedId = useGraphStore((s) => s.selectedId);
  const searchQuery = useGraphStore((s) => s.searchQuery);
  const showNodeLabels = useGraphStore((s) => s.showNodeLabels);
  const showEdgeLabels = useGraphStore((s) => s.showEdgeLabels);
  const highlightNeighbors = useGraphStore((s) => s.highlightNeighbors);
  const theme = useGraphStore((s) => s.theme);
  const selectNode = useGraphStore((s) => s.selectNode);
  const setHovered = useGraphStore((s) => s.setHovered);
  const setStatus = useGraphStore((s) => s.setStatus);
  const setEngineApi = useGraphStore((s) => s.setEngineApi);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const searchIds = new Set(
      searchNodes(data.nodes, searchQuery).map((n) => n.id),
    );
    const engine = new GraphEngine(
      canvas,
      data,
      {
        onSelect: (id) => selectNode(id),
        onHover: (id, pos) => setHovered(id, pos),
        onStatus: setStatus,
      },
      {
        showNodeLabels,
        showEdgeLabels,
        highlightNeighbors,
        searchIds,
        selectedId: null,
      },
    );
    engineRef.current = engine;
    setEngineApi({
      reheat: () => engine.reheat(),
      freeze: () => engine.freeze(),
      unfreeze: () => engine.unfreeze(),
      reset: () => engine.reset(),
      fit: () => engine.fit(),
      centerNode: (id) => engine.centerNode(id),
      zoomBy: (factor) => engine.zoomBy(factor),
      pinNode: (id, pinned) => engine.pinNode(id, pinned),
      isPinned: (id) => engine.isPinned(id),
      getScreenPosition: (id) => engine.getScreenPosition(id),
      setInset: (inset) => engine.setInset(inset),
    });
    return () => {
      engine.destroy();
      engineRef.current = null;
      setEngineApi(null);
    };
    // Engine is recreated only when the dataset changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, dataset]);

  useEffect(() => {
    const searchIds = new Set(
      searchNodes(data.nodes, searchQuery).map((n) => n.id),
    );
    engineRef.current?.updateOptions({
      selectedId,
      showNodeLabels,
      showEdgeLabels,
      highlightNeighbors,
      searchIds,
    });
  }, [
    data.nodes,
    selectedId,
    searchQuery,
    showNodeLabels,
    showEdgeLabels,
    highlightNeighbors,
    theme,
  ]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 size-full touch-none cursor-grab"
      aria-label="Force-directed network graph"
      role="img"
    />
  );
}
