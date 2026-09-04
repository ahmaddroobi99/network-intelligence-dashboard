import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
} from "d3-force";
import { indexGraph } from "./graphUtils";
import {
  drawGraph,
  hitTestNode,
  screenToWorld,
  worldToScreen,
  type SimLink,
  type SimNode,
} from "./renderer";
import type { GraphData, SimulationStatus, ViewTransform } from "./types";
import { nodeRadius, readTheme } from "./visual";

const CLUSTER_TARGETS: Record<string, { x: number; y: number }> = {
  acme: { x: -180, y: -70 },
  robotics: { x: 200, y: -40 },
  infra: { x: 40, y: 180 },
  research: { x: -40, y: -210 },
  geo: { x: 210, y: 160 },
};

export interface EngineCallbacks {
  onSelect: (id: string | null) => void;
  onHover: (id: string | null, pos: { x: number; y: number } | null) => void;
  onStatus: (status: SimulationStatus) => void;
}

export interface EngineOptions {
  showNodeLabels: boolean;
  showEdgeLabels: boolean;
  highlightNeighbors: boolean;
  searchIds: Set<string>;
  selectedId: string | null;
}

export class GraphEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private simulation: Simulation<SimNode, SimLink>;
  private nodes: SimNode[];
  private links: SimLink[];
  private transform: ViewTransform = { x: 0, y: 0, k: 1 };
  private raf = 0;
  private running = true;
  private frozen = false;
  private needsDraw = true;
  private dpr = 1;
  private width = 0;
  private height = 0;
  private options: EngineOptions;
  private callbacks: EngineCallbacks;
  private pinned = new Set<string>();
  private neighborIds = new Set<string>();
  private relatedEdgeIds = new Set<string>();
  private adjacency: Map<string, string[]>;
  private pointer: {
    mode: "none" | "drag-node" | "pan";
    id: string | null;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    moved: boolean;
    nodeStartX: number;
    nodeStartY: number;
  } = {
    mode: "none",
    id: null,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    moved: false,
    nodeStartX: 0,
    nodeStartY: 0,
  };
  private pointers = new Map<number, { x: number; y: number }>();
  private pinch: { dist: number; k: number } | null = null;
  private resizeObserver: ResizeObserver;
  private initial: { x: number; y: number; fx: number | null; fy: number | null }[] = [];
  private autoFitUntil = 0;
  private autoFitTick = 0;
  private inset = { top: 24, right: 24, bottom: 24, left: 24 };
  private status: SimulationStatus = "running";

  constructor(
    canvas: HTMLCanvasElement,
    data: GraphData,
    callbacks: EngineCallbacks,
    options: EngineOptions,
  ) {
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Canvas 2D context unavailable");
    this.canvas = canvas;
    this.ctx = ctx;
    this.callbacks = callbacks;
    this.options = options;

    const indexed = indexGraph(data);
    this.adjacency = indexed.adjacency;
    this.nodes = indexed.nodes.map((node, i) => {
      const degree = indexed.degree.get(node.id) ?? 0;
      const cluster = CLUSTER_TARGETS[node.cluster ?? ""] ?? { x: 0, y: 0 };
      const angle = (i / indexed.nodes.length) * Math.PI * 2;
      return {
        ...node,
        degree,
        radius: nodeRadius(node.importance ?? 0.5, degree),
        x: cluster.x + Math.cos(angle) * 40,
        y: cluster.y + Math.sin(angle) * 40,
      };
    });
    const byId = new Map(this.nodes.map((n) => [n.id, n]));
    this.links = indexed.edges.map((edge) => ({
      ...edge,
      source: byId.get(edge.source) ?? edge.source,
      target: byId.get(edge.target) ?? edge.target,
      weight: edge.weight ?? 0.5,
      directed: edge.directed ?? true,
    }));

    this.simulation = forceSimulation(this.nodes)
      .force(
        "link",
        forceLink<SimNode, SimLink>(this.links)
          .id((d) => d.id)
          .distance((d) => 56 + (1 - (d.weight ?? 0.5)) * 50)
          .strength((d) => 0.35 + (d.weight ?? 0.5) * 0.35),
      )
      .force("charge", forceManyBody<SimNode>().strength(-150).distanceMax(380))
      .force(
        "collide",
        forceCollide<SimNode>().radius((d) => d.radius + 8).iterations(2),
      )
      .force("center", forceCenter(0, 0).strength(0.08))
      .force(
        "x",
        forceX<SimNode>((d) => CLUSTER_TARGETS[d.cluster ?? ""]?.x ?? 0).strength(0.06),
      )
      .force(
        "y",
        forceY<SimNode>((d) => CLUSTER_TARGETS[d.cluster ?? ""]?.y ?? 0).strength(0.06),
      )
      .alpha(1)
      .alphaDecay(0.018)
      .velocityDecay(0.32);

    this.simulation.on("tick", () => {
      this.needsDraw = true;
      this.autoFitTick += 1;
      if (performance.now() < this.autoFitUntil && this.autoFitTick % 6 === 0) {
        this.fit(true);
      }
      if (!this.frozen) this.setStatus(this.simulation.alpha() < 0.04 ? "stabilizing" : "running");
    });
    this.simulation.on("end", () => {
      if (!this.frozen) this.setStatus("stabilizing");
    });

    this.initial = this.nodes.map((n) => ({
      x: n.x ?? 0,
      y: n.y ?? 0,
      fx: n.fx ?? null,
      fy: n.fy ?? null,
    }));

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(canvas.parentElement ?? canvas);
    this.bind();
    this.resize();
    this.autoFitUntil = performance.now() + 2800;
    this.fit(true);
    this.loop();
  }

  updateOptions(partial: Partial<EngineOptions>) {
    this.options = { ...this.options, ...partial };
    if (partial.selectedId !== undefined) this.computeFocus(partial.selectedId);
    this.needsDraw = true;
  }

  private computeFocus(selectedId: string | null) {
    this.neighborIds = new Set();
    this.relatedEdgeIds = new Set();
    const focus = selectedId ?? this.options.selectedId;
    if (!focus) return;
    for (const id of this.adjacency.get(focus) ?? []) this.neighborIds.add(id);
    for (const link of this.links) {
      const s = typeof link.source === "object" ? link.source.id : String(link.source);
      const t = typeof link.target === "object" ? link.target.id : String(link.target);
      if (s === focus || t === focus) this.relatedEdgeIds.add(link.id);
    }
  }

  private setStatus(status: SimulationStatus) {
    if (this.status === status) return;
    this.status = status;
    this.callbacks.onStatus(status);
  }

  reheat() {
    this.frozen = false;
    this.running = true;
    this.simulation.alpha(0.9).restart();
    this.setStatus("running");
    this.needsDraw = true;
  }

  freeze() {
    this.frozen = true;
    this.simulation.stop();
    this.setStatus("frozen");
    this.needsDraw = true;
  }

  unfreeze() {
    this.frozen = false;
    this.simulation.alpha(0.15).restart();
    this.setStatus("running");
  }

  toggleFreeze() {
    if (this.frozen) this.unfreeze();
    else this.freeze();
  }

  reset() {
    this.pinned.clear();
    this.nodes.forEach((node, i) => {
      const seed = this.initial[i];
      node.fx = null;
      node.fy = null;
      node.vx = 0;
      node.vy = 0;
      if (seed) {
        node.x = seed.x;
        node.y = seed.y;
      }
    });
    this.fit(true);
    this.reheat();
  }

  setInset(inset: Partial<typeof this.inset>) {
    this.inset = { ...this.inset, ...inset };
    this.needsDraw = true;
  }

  fit(instant = false) {
    if (this.nodes.length === 0) return;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const node of this.nodes) {
      if (node.x == null || node.y == null) continue;
      minX = Math.min(minX, node.x - node.radius);
      minY = Math.min(minY, node.y - node.radius);
      maxX = Math.max(maxX, node.x + node.radius);
      maxY = Math.max(maxY, node.y + node.radius);
    }
    const bw = Math.max(80, maxX - minX);
    const bh = Math.max(80, maxY - minY);
    const availW = Math.max(120, this.width - this.inset.left - this.inset.right);
    const availH = Math.max(120, this.height - this.inset.top - this.inset.bottom);
    const k = Math.min(availW / bw, availH / bh, 1.85);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    this.transform = {
      k,
      x: this.inset.left + availW / 2 - cx * k,
      y: this.inset.top + availH / 2 - cy * k,
    };
    void instant;
    this.needsDraw = true;
  }

  centerNode(id: string) {
    const node = this.nodes.find((n) => n.id === id);
    if (!node || node.x == null || node.y == null) return;
    this.transform.x = this.width / 2 - node.x * this.transform.k;
    this.transform.y = this.height / 2 - node.y * this.transform.k;
    this.needsDraw = true;
  }

  zoomBy(factor: number, origin?: { x: number; y: number }) {
    const ox = origin?.x ?? this.width / 2;
    const oy = origin?.y ?? this.height / 2;
    const next = clamp(this.transform.k * factor, 0.18, 4.2);
    const world = screenToWorld(ox, oy, this.transform);
    this.transform.k = next;
    this.transform.x = ox - world.x * next;
    this.transform.y = oy - world.y * next;
    this.needsDraw = true;
  }

  pinNode(id: string, pinned: boolean) {
    const node = this.nodes.find((n) => n.id === id);
    if (!node) return;
    if (pinned) {
      this.pinned.add(id);
      node.fx = node.x ?? 0;
      node.fy = node.y ?? 0;
    } else {
      this.pinned.delete(id);
      node.fx = null;
      node.fy = null;
      if (!this.frozen) this.reheat();
    }
    this.needsDraw = true;
  }

  isPinned(id: string) {
    return this.pinned.has(id);
  }

  getScreenPosition(id: string) {
    const node = this.nodes.find((n) => n.id === id);
    if (!node || node.x == null || node.y == null) return null;
    return worldToScreen(node.x, node.y, this.transform);
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.simulation.stop();
    this.resizeObserver.disconnect();
    this.unbind();
  }

  private loop = () => {
    this.raf = requestAnimationFrame(this.loop);
    if (!this.needsDraw) return;
    this.needsDraw = false;
    drawGraph(this.ctx, {
      nodes: this.nodes,
      links: this.links,
      transform: this.transform,
      selectedId: this.options.selectedId,
      hoveredId: this.hoverId,
      searchMatches: this.options.searchIds,
      neighborIds: this.neighborIds,
      relatedEdgeIds: this.relatedEdgeIds,
      pinnedIds: this.pinned,
      showNodeLabels: this.options.showNodeLabels,
      showEdgeLabels: this.options.showEdgeLabels,
      highlightNeighbors: this.options.highlightNeighbors,
      theme: readTheme(),
      width: this.width,
      height: this.height,
      searching: this.options.searchIds.size > 0,
    });
  };

  private hoverId: string | null = null;

  private resize() {
    const parent = this.canvas.parentElement ?? this.canvas;
    const rect = parent.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = Math.max(1, rect.width);
    this.height = Math.max(1, rect.height);
    this.canvas.width = Math.floor(this.width * this.dpr);
    this.canvas.height = Math.floor(this.height * this.dpr);
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.needsDraw = true;
  }

  private localPoint(event: PointerEvent | WheelEvent | MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  private bind() {
    this.canvas.addEventListener("pointerdown", this.onPointerDown);
    this.canvas.addEventListener("pointermove", this.onPointerMove);
    this.canvas.addEventListener("pointerup", this.onPointerUp);
    this.canvas.addEventListener("pointercancel", this.onPointerUp);
    this.canvas.addEventListener("pointerleave", this.onPointerLeave);
    this.canvas.addEventListener("wheel", this.onWheel, { passive: false });
    this.canvas.addEventListener("dblclick", this.onDblClick);
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  private unbind() {
    this.canvas.removeEventListener("pointerdown", this.onPointerDown);
    this.canvas.removeEventListener("pointermove", this.onPointerMove);
    this.canvas.removeEventListener("pointerup", this.onPointerUp);
    this.canvas.removeEventListener("pointercancel", this.onPointerUp);
    this.canvas.removeEventListener("pointerleave", this.onPointerLeave);
    this.canvas.removeEventListener("wheel", this.onWheel);
    this.canvas.removeEventListener("dblclick", this.onDblClick);
  }

  private onPointerDown = (event: PointerEvent) => {
    this.autoFitUntil = 0;
    this.canvas.setPointerCapture(event.pointerId);
    const pt = this.localPoint(event);
    this.pointers.set(event.pointerId, pt);
    if (this.pointers.size === 2) {
      const [a, b] = [...this.pointers.values()];
      if (a && b) {
        this.pinch = {
          dist: Math.hypot(a.x - b.x, a.y - b.y),
          k: this.transform.k,
        };
        this.pointer.mode = "none";
      }
      return;
    }
    const world = screenToWorld(pt.x, pt.y, this.transform);
    const hit = hitTestNode(this.nodes, world.x, world.y);
    if (hit) {
      this.pointer = {
        mode: "drag-node",
        id: hit.id,
        startX: pt.x,
        startY: pt.y,
        lastX: pt.x,
        lastY: pt.y,
        moved: false,
        nodeStartX: hit.x ?? 0,
        nodeStartY: hit.y ?? 0,
      };
      hit.fx = hit.x;
      hit.fy = hit.y;
      this.canvas.style.cursor = "grabbing";
    } else {
      this.pointer = {
        mode: "pan",
        id: null,
        startX: pt.x,
        startY: pt.y,
        lastX: pt.x,
        lastY: pt.y,
        moved: false,
        nodeStartX: 0,
        nodeStartY: 0,
      };
      this.canvas.style.cursor = "grabbing";
    }
  };

  private onPointerMove = (event: PointerEvent) => {
    const pt = this.localPoint(event);
    if (this.pointers.has(event.pointerId)) this.pointers.set(event.pointerId, pt);

    if (this.pointers.size === 2 && this.pinch) {
      const [a, b] = [...this.pointers.values()];
      if (a && b) {
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const factor = dist / (this.pinch.dist || 1);
        const targetK = clamp(this.pinch.k * factor, 0.18, 4.2);
        this.zoomBy(targetK / this.transform.k, mid);
      }
      return;
    }

    if (this.pointer.mode === "drag-node" && this.pointer.id) {
      const dx = pt.x - this.pointer.startX;
      const dy = pt.y - this.pointer.startY;
      if (Math.hypot(dx, dy) > 3) this.pointer.moved = true;
      const node = this.nodes.find((n) => n.id === this.pointer.id);
      if (node) {
        const world = screenToWorld(pt.x, pt.y, this.transform);
        node.fx = world.x;
        node.fy = world.y;
        node.x = world.x;
        node.y = world.y;
        this.pinned.add(node.id);
        if (!this.frozen) this.simulation.alpha(0.25).restart();
        this.needsDraw = true;
      }
      return;
    }

    if (this.pointer.mode === "pan") {
      const dx = pt.x - this.pointer.lastX;
      const dy = pt.y - this.pointer.lastY;
      if (Math.hypot(pt.x - this.pointer.startX, pt.y - this.pointer.startY) > 3) {
        this.pointer.moved = true;
      }
      this.transform.x += dx;
      this.transform.y += dy;
      this.pointer.lastX = pt.x;
      this.pointer.lastY = pt.y;
      this.needsDraw = true;
      return;
    }

    const world = screenToWorld(pt.x, pt.y, this.transform);
    const hit = hitTestNode(this.nodes, world.x, world.y);
    const nextId = hit?.id ?? null;
    this.canvas.style.cursor = hit ? "pointer" : "grab";
    if (nextId !== this.hoverId) {
      this.hoverId = nextId;
      if (nextId) this.computeFocus(this.options.selectedId ?? nextId);
      else this.computeFocus(this.options.selectedId);
      this.callbacks.onHover(
        nextId,
        nextId && hit && hit.x != null && hit.y != null
          ? worldToScreen(hit.x, hit.y, this.transform)
          : null,
      );
      this.needsDraw = true;
    }
  };

  private onPointerUp = (event: PointerEvent) => {
    this.pointers.delete(event.pointerId);
    if (this.pointers.size < 2) this.pinch = null;
    if (this.pointer.mode === "drag-node" && this.pointer.id) {
      const node = this.nodes.find((n) => n.id === this.pointer.id);
      if (node && !this.pointer.moved) {
        this.callbacks.onSelect(node.id);
        this.computeFocus(node.id);
      }
      this.needsDraw = true;
    } else if (this.pointer.mode === "pan" && !this.pointer.moved) {
      this.callbacks.onSelect(null);
      this.computeFocus(null);
      this.needsDraw = true;
    }
    this.pointer.mode = "none";
    this.pointer.id = null;
    this.canvas.style.cursor = "grab";
    try {
      this.canvas.releasePointerCapture(event.pointerId);
    } catch {
      /* already released */
    }
  };

  private onPointerLeave = () => {
    if (this.pointer.mode !== "none") return;
    this.hoverId = null;
    this.callbacks.onHover(null, null);
    this.computeFocus(this.options.selectedId);
    this.needsDraw = true;
    this.canvas.style.cursor = "grab";
  };

  private onWheel = (event: WheelEvent) => {
    this.autoFitUntil = 0;
    event.preventDefault();
    const pt = this.localPoint(event);
    const factor = event.deltaY < 0 ? 1.08 : 0.92;
    this.zoomBy(factor, pt);
  };

  private onDblClick = (event: MouseEvent) => {
    const pt = this.localPoint(event);
    const world = screenToWorld(pt.x, pt.y, this.transform);
    const hit = hitTestNode(this.nodes, world.x, world.y);
    if (!hit) {
      this.fit();
      return;
    }
    this.pinNode(hit.id, !this.pinned.has(hit.id));
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}
