import type { SimulationLinkDatum, SimulationNodeDatum } from "d3-force";
import type { GraphNode, GraphTheme, NodeType, ViewTransform } from "./types";
import { NODE_COLORS } from "./visual";
import { relationshipLabel } from "./graphUtils";

export interface SimNode extends GraphNode, SimulationNodeDatum {
  radius: number;
  degree: number;
}

export interface SimLink extends SimulationLinkDatum<SimNode> {
  id: string;
  relationship: string;
  weight: number;
  directed: boolean;
}

export interface DrawFrame {
  nodes: SimNode[];
  links: SimLink[];
  transform: ViewTransform;
  selectedId: string | null;
  hoveredId: string | null;
  searchMatches: Set<string>;
  neighborIds: Set<string>;
  relatedEdgeIds: Set<string>;
  pinnedIds: Set<string>;
  showNodeLabels: boolean;
  showEdgeLabels: boolean;
  highlightNeighbors: boolean;
  theme: GraphTheme;
  width: number;
  height: number;
  searching: boolean;
}

function linkNode(end: SimLink["source"] | SimLink["target"]): SimNode | null {
  if (typeof end === "object" && end) return end;
  return null;
}

function isFocused(
  id: string,
  frame: DrawFrame,
): boolean {
  if (!frame.selectedId && !frame.hoveredId && !frame.searching) return true;
  if (frame.selectedId === id || frame.hoveredId === id) return true;
  if (frame.searchMatches.has(id)) return true;
  if (frame.highlightNeighbors && frame.neighborIds.has(id)) return true;
  return false;
}

function isEdgeFocused(link: SimLink, frame: DrawFrame): boolean {
  if (!frame.selectedId && !frame.hoveredId && !frame.searching) return true;
  if (frame.relatedEdgeIds.has(link.id)) return true;
  const s = linkNode(link.source);
  const t = linkNode(link.target);
  if (!s || !t) return false;
  if (frame.searchMatches.has(s.id) && frame.searchMatches.has(t.id)) return true;
  return false;
}

function drawShape(
  ctx: CanvasRenderingContext2D,
  type: NodeType,
  x: number,
  y: number,
  r: number,
) {
  ctx.beginPath();
  switch (type) {
    case "company": {
      const s = r * 0.92;
      const rad = r * 0.28;
      roundedRect(ctx, x - s, y - s, s * 2, s * 2, rad);
      break;
    }
    case "project": {
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r, y);
      ctx.lineTo(x, y + r);
      ctx.lineTo(x - r, y);
      ctx.closePath();
      break;
    }
    case "technology": {
      hexagon(ctx, x, y, r, 0);
      break;
    }
    case "dataset": {
      roundedRect(ctx, x - r * 1.15, y - r * 0.72, r * 2.3, r * 1.44, r * 0.45);
      break;
    }
    case "location": {
      ctx.moveTo(x, y - r);
      ctx.lineTo(x + r * 0.92, y + r * 0.78);
      ctx.lineTo(x - r * 0.92, y + r * 0.78);
      ctx.closePath();
      break;
    }
    case "event": {
      star(ctx, x, y, r, 5);
      break;
    }
    default: {
      ctx.arc(x, y, r, 0, Math.PI * 2);
    }
  }
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function hexagon(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  rot: number,
) {
  for (let i = 0; i < 6; i += 1) {
    const a = rot + (Math.PI / 3) * i - Math.PI / 6;
    const px = x + Math.cos(a) * r;
    const py = y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function star(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  points: number,
) {
  const inner = r * 0.48;
  for (let i = 0; i < points * 2; i += 1) {
    const rad = i % 2 === 0 ? r : inner;
    const a = -Math.PI / 2 + (Math.PI * i) / points;
    const px = x + Math.cos(a) * rad;
    const py = y + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  endR: number,
  color: string,
  width: number,
) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const tipX = x2 - ux * (endR + 1);
  const tipY = y2 - uy * (endR + 1);
  const size = Math.max(4.5, 5.5 * width);
  ctx.beginPath();
  ctx.moveTo(tipX, tipY);
  ctx.lineTo(tipX - ux * size - uy * size * 0.55, tipY - uy * size + ux * size * 0.55);
  ctx.lineTo(tipX - ux * size + uy * size * 0.55, tipY - uy * size - ux * size * 0.55);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

function drawGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  transform: ViewTransform,
  color: string,
) {
  const step = 48 * transform.k;
  if (step < 18) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  const offsetX = transform.x % step;
  const offsetY = transform.y % step;
  ctx.beginPath();
  for (let x = offsetX; x < width; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = offsetY; y < height; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();
  ctx.restore();
}

export function drawGraph(ctx: CanvasRenderingContext2D, frame: DrawFrame) {
  const { width, height, transform, theme } = frame;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = theme.canvas;
  ctx.fillRect(0, 0, width, height);
  drawGrid(ctx, width, height, transform, theme.grid);

  ctx.setTransform(transform.k, 0, 0, transform.k, transform.x, transform.y);

  const lodLabels = transform.k >= 0.72 && frame.nodes.length <= 180;
  const lodEdges = transform.k >= 0.9;

  for (const link of frame.links) {
    const s = linkNode(link.source);
    const t = linkNode(link.target);
    if (!s || !t || s.x == null || s.y == null || t.x == null || t.y == null) continue;
    const focused = isEdgeFocused(link, frame);
    const alphaBoost = focused ? 1 : 0.28;
    const color = focused ? theme.edgeActive : theme.edgeMuted;
    const width = (0.7 + (link.weight ?? 0.5) * 1.4) / Math.sqrt(transform.k);
    ctx.globalAlpha = alphaBoost;
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(t.x, t.y);
    ctx.stroke();
    if (link.directed && focused) {
      drawArrow(ctx, s.x, s.y, t.x, t.y, t.radius, color, width);
    }
    ctx.globalAlpha = 1;
  }

  if (frame.showEdgeLabels && lodEdges) {
    ctx.font = `${11 / transform.k}px "IBM Plex Sans", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const link of frame.links) {
      const s = linkNode(link.source);
      const t = linkNode(link.target);
      if (!s || !t || s.x == null || s.y == null || t.x == null || t.y == null) continue;
      if (!isEdgeFocused(link, frame) && frame.links.length > 40) continue;
      const mx = (s.x + t.x) / 2;
      const my = (s.y + t.y) / 2;
      const angle = Math.atan2(t.y - s.y, t.x - s.x);
      const flipped = angle > Math.PI / 2 || angle < -Math.PI / 2;
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(flipped ? angle + Math.PI : angle);
      ctx.fillStyle = theme.labelMuted;
      ctx.globalAlpha = 0.9;
      ctx.fillText(relationshipLabel(link.relationship), 0, -6 / transform.k);
      ctx.restore();
    }
  }

  const ordered = frame.nodes;
  for (const node of ordered) {
    if (node.x == null || node.y == null) continue;
    const focused = isFocused(node.id, frame);
    const hovered = node.id === frame.hoveredId;
    const selected = node.id === frame.selectedId;
    const matched = frame.searchMatches.has(node.id);
    const r = node.radius * (hovered || selected ? 1.16 : 1);
    ctx.globalAlpha = focused ? 1 : 0.16;

    if (selected) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 8, 0, Math.PI * 2);
      ctx.fillStyle = theme.halo;
      ctx.fill();
    }

    if (matched && !selected) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, r + 5, 0, Math.PI * 2);
      ctx.strokeStyle = theme.searchRing;
      ctx.lineWidth = 2 / transform.k;
      ctx.stroke();
    }

    drawShape(ctx, node.type, node.x, node.y, r);
    ctx.fillStyle = NODE_COLORS[node.type];
    ctx.fill();
    ctx.lineWidth = (selected ? 2.2 : 1.15) / transform.k;
    ctx.strokeStyle = selected ? theme.label : "rgba(9, 9, 11, 0.45)";
    ctx.stroke();

    if (frame.pinnedIds.has(node.id)) {
      ctx.beginPath();
      ctx.arc(node.x + r * 0.72, node.y - r * 0.72, 2.4 / transform.k, 0, Math.PI * 2);
      ctx.fillStyle = theme.pin;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  const showLabels =
    frame.showNodeLabels && (lodLabels || Boolean(frame.selectedId || frame.hoveredId || frame.searching));
  if (showLabels) {
    ctx.font = `${600} ${13 / transform.k}px "IBM Plex Sans", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const hasFocus = Boolean(frame.selectedId || frame.hoveredId || frame.searching);
    for (const node of ordered) {
      if (node.x == null || node.y == null) continue;
      const focused = isFocused(node.id, frame);
      if (hasFocus && !focused) continue;
      if (!hasFocus && !lodLabels && (node.importance ?? 0) < 0.78) continue;
      if (!focused && (frame.nodes.length > 80 || transform.k < 0.85)) continue;
      ctx.globalAlpha = focused ? 0.92 : 0.35;
      ctx.fillStyle = theme.label;
      ctx.fillText(node.label, node.x, node.y + node.radius + 6 / transform.k);
      ctx.globalAlpha = 1;
    }
  }
}

export function hitTestNode(
  nodes: SimNode[],
  worldX: number,
  worldY: number,
): SimNode | null {
  for (let i = nodes.length - 1; i >= 0; i -= 1) {
    const node = nodes[i]!;
    if (node.x == null || node.y == null) continue;
    const dx = worldX - node.x;
    const dy = worldY - node.y;
    const hitR = node.radius + 6;
    if (dx * dx + dy * dy <= hitR * hitR) return node;
  }
  return null;
}

export function screenToWorld(
  sx: number,
  sy: number,
  transform: ViewTransform,
): { x: number; y: number } {
  return {
    x: (sx - transform.x) / transform.k,
    y: (sy - transform.y) / transform.k,
  };
}

export function worldToScreen(
  wx: number,
  wy: number,
  transform: ViewTransform,
): { x: number; y: number } {
  return {
    x: wx * transform.k + transform.x,
    y: wy * transform.k + transform.y,
  };
}
