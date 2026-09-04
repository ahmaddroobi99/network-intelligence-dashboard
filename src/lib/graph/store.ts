import { create } from "zustand";
import { SAMPLE_GRAPH } from "@/data/sampleGraph";
import { expandGraph, indexGraph, searchNodes } from "./graphUtils";
import type { GraphData, SimulationStatus } from "./types";

export type DatasetId = "sample" | "large";

export interface EngineApi {
  reheat: () => void;
  freeze: () => void;
  unfreeze: () => void;
  reset: () => void;
  fit: () => void;
  centerNode: (id: string) => void;
  zoomBy: (factor: number) => void;
  pinNode: (id: string, pinned: boolean) => void;
  isPinned: (id: string) => boolean;
  getScreenPosition: (id: string) => { x: number; y: number } | null;
  setInset: (inset: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  }) => void;
}

interface GraphStore {
  data: GraphData;
  dataset: DatasetId;
  selectedId: string | null;
  hoveredId: string | null;
  tooltipPos: { x: number; y: number } | null;
  searchQuery: string;
  searchOpen: boolean;
  searchIndex: number;
  status: SimulationStatus;
  showNodeLabels: boolean;
  showEdgeLabels: boolean;
  highlightNeighbors: boolean;
  theme: "dark" | "light";
  settingsOpen: boolean;
  inspectorOpen: boolean;
  engineApi: EngineApi | null;
  hintVisible: boolean;
  setEngineApi: (api: EngineApi | null) => void;
  selectNode: (id: string | null, center?: boolean) => void;
  setHovered: (id: string | null, pos?: { x: number; y: number } | null) => void;
  setSearch: (query: string) => void;
  setSearchOpen: (open: boolean) => void;
  moveSearchIndex: (delta: number) => void;
  activateSearchIndex: () => void;
  setStatus: (status: SimulationStatus) => void;
  toggleNodeLabels: () => void;
  toggleEdgeLabels: () => void;
  toggleNeighbors: () => void;
  setTheme: (theme: "dark" | "light") => void;
  setSettingsOpen: (open: boolean) => void;
  setDataset: (dataset: DatasetId) => void;
  dismissHint: () => void;
}

function graphForDataset(dataset: DatasetId): GraphData {
  return dataset === "large" ? expandGraph(SAMPLE_GRAPH, 500) : SAMPLE_GRAPH;
}

function persistTheme(theme: "dark" | "light") {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  document.documentElement.classList.toggle("light", theme === "light");
  try {
    localStorage.setItem("ni-theme", theme);
  } catch {
    /* ignore quota */
  }
}

function persistFlag(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

export const useGraphStore = create<GraphStore>((set, get) => ({
  data: SAMPLE_GRAPH,
  dataset: "sample",
  selectedId: null,
  hoveredId: null,
  tooltipPos: null,
  searchQuery: "",
  searchOpen: false,
  searchIndex: 0,
  status: "running",
  showNodeLabels: true,
  showEdgeLabels: false,
  highlightNeighbors: true,
  theme: "dark",
  settingsOpen: false,
  inspectorOpen: false,
  engineApi: null,
  hintVisible: true,
  setEngineApi: (api) => set({ engineApi: api }),
  selectNode: (id, center) => {
    set({
      selectedId: id,
      inspectorOpen: Boolean(id),
      searchOpen: false,
    });
    if (id && center) get().engineApi?.centerNode(id);
  },
  setHovered: (id, pos) =>
    set({ hoveredId: id, tooltipPos: id ? (pos ?? null) : null }),
  setSearch: (query) => {
    const matches = searchNodes(get().data.nodes, query);
    set({
      searchQuery: query,
      searchOpen: query.trim().length > 0,
      searchIndex: 0,
    });
    if (query.trim() && matches.length === 0) {
      /* keep open to show empty state */
    }
  },
  setSearchOpen: (open) => set({ searchOpen: open }),
  moveSearchIndex: (delta) => {
    const matches = searchNodes(get().data.nodes, get().searchQuery);
    if (matches.length === 0) return;
    const next =
      (get().searchIndex + delta + matches.length) % matches.length;
    set({ searchIndex: next });
  },
  activateSearchIndex: () => {
    const matches = searchNodes(get().data.nodes, get().searchQuery);
    const node = matches[get().searchIndex];
    if (!node) return;
    get().selectNode(node.id, true);
  },
  setStatus: (status) => set({ status }),
  toggleNodeLabels: () => {
    const next = !get().showNodeLabels;
    persistFlag("ni-node-labels", next);
    set({ showNodeLabels: next });
  },
  toggleEdgeLabels: () => {
    const next = !get().showEdgeLabels;
    persistFlag("ni-edge-labels", next);
    set({ showEdgeLabels: next });
  },
  toggleNeighbors: () => {
    const next = !get().highlightNeighbors;
    persistFlag("ni-neighbors", next);
    set({ highlightNeighbors: next });
  },
  setTheme: (theme) => {
    persistTheme(theme);
    set({ theme });
  },
  setSettingsOpen: (open) => set({ settingsOpen: open }),
  setDataset: (dataset) => {
    const data = graphForDataset(dataset);
    set({
      dataset,
      data,
      selectedId: null,
      hoveredId: null,
      searchQuery: "",
      searchOpen: false,
      inspectorOpen: false,
    });
  },
  dismissHint: () => {
    try {
      localStorage.setItem("ni-hint", "0");
    } catch {
      /* ignore */
    }
    set({ hintVisible: false });
  },
}));

export function hydratePreferences() {
  if (typeof window === "undefined") return;
  try {
    const theme = localStorage.getItem("ni-theme");
    if (theme === "light" || theme === "dark") {
      useGraphStore.getState().setTheme(theme);
    } else {
      persistTheme("dark");
    }
    const nodeLabels = localStorage.getItem("ni-node-labels");
    const edgeLabels = localStorage.getItem("ni-edge-labels");
    const neighbors = localStorage.getItem("ni-neighbors");
    const hint = localStorage.getItem("ni-hint");
    useGraphStore.setState({
      showNodeLabels: nodeLabels === null ? true : nodeLabels === "1",
      showEdgeLabels: edgeLabels === "1",
      highlightNeighbors: neighbors === null ? true : neighbors === "1",
      hintVisible: hint !== "0",
    });
  } catch {
    persistTheme("dark");
  }
}

export function useIndexedGraph() {
  return indexGraph(useGraphStore.getState().data);
}
