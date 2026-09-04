import type { GraphTheme, NodeType } from "./types";

export const NODE_COLORS: Record<NodeType, string> = {
  person: "#8ecae6",
  company: "#cbb8a4",
  project: "#9dc3b0",
  technology: "#7eb8c9",
  dataset: "#c4a8b4",
  location: "#b3b0c9",
  event: "#c9c2a4",
};

export function readCssVar(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return value || fallback;
}

export function readTheme(): GraphTheme {
  const isLight = document.documentElement.classList.contains("light");
  if (isLight) {
    return {
      canvas: readCssVar("--bg", "#f3f1ea"),
      grid: "rgba(28, 25, 23, 0.06)",
      edge: "rgba(28, 25, 23, 0.22)",
      edgeMuted: "rgba(28, 25, 23, 0.06)",
      edgeActive: "rgba(28, 25, 23, 0.55)",
      label: "#1c1917",
      labelMuted: "rgba(28, 25, 23, 0.45)",
      halo: "rgba(28, 25, 23, 0.18)",
      pin: "#1c1917",
      searchRing: "#3d6b7a",
    };
  }
  return {
    canvas: readCssVar("--bg", "#09090b"),
    grid: "rgba(244, 244, 245, 0.035)",
    edge: "rgba(228, 228, 231, 0.18)",
    edgeMuted: "rgba(228, 228, 231, 0.045)",
    edgeActive: "rgba(196, 214, 222, 0.78)",
    label: "#f4f4f5",
    labelMuted: "rgba(244, 244, 245, 0.38)",
    halo: "rgba(196, 214, 222, 0.22)",
    pin: "#f4f4f5",
    searchRing: "#9eb6c4",
  };
}

export function nodeRadius(importance: number, degree: number): number {
  const base = 9 + importance * 10;
  const degreeBoost = Math.min(7, Math.sqrt(degree) * 1.6);
  return base + degreeBoost;
}
