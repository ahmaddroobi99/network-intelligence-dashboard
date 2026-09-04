export const NODE_TYPES = [
  "person",
  "company",
  "project",
  "technology",
  "dataset",
  "location",
  "event",
] as const;

export type NodeType = (typeof NODE_TYPES)[number];

export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  description?: string;
  metadata?: Record<string, string | number>;
  importance?: number;
  cluster?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  relationship: string;
  weight?: number;
  directed?: boolean;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export type SimulationStatus = "running" | "stabilizing" | "frozen";

export interface ViewTransform {
  x: number;
  y: number;
  k: number;
}

export interface GraphTheme {
  canvas: string;
  grid: string;
  edge: string;
  edgeMuted: string;
  edgeActive: string;
  label: string;
  labelMuted: string;
  halo: string;
  pin: string;
  searchRing: string;
}

export const NODE_TYPE_LABELS: Record<NodeType, string> = {
  person: "Person",
  company: "Company",
  project: "Project",
  technology: "Technology",
  dataset: "Dataset",
  location: "Location",
  event: "Event",
};

export const CLUSTER_LABELS: Record<string, string> = {
  acme: "Acme AI",
  robotics: "Robotics",
  infra: "Infrastructure",
  research: "Research",
  geo: "Geography",
};
