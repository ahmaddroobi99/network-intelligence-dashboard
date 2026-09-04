import type { GraphData, GraphEdge, GraphNode, NodeType } from "./types";

export interface IndexedGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  byId: Map<string, GraphNode>;
  degree: Map<string, number>;
  adjacency: Map<string, string[]>;
  edgesByNode: Map<string, GraphEdge[]>;
  clusters: string[];
}

export function indexGraph(data: GraphData): IndexedGraph {
  const byId = new Map<string, GraphNode>();
  for (const node of data.nodes) byId.set(node.id, node);

  const edges = data.edges.filter(
    (edge) => byId.has(edge.source) && byId.has(edge.target),
  );

  const degree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();
  const edgesByNode = new Map<string, GraphEdge[]>();
  const clusterSet = new Set<string>();

  for (const node of data.nodes) {
    degree.set(node.id, 0);
    adjacency.set(node.id, []);
    edgesByNode.set(node.id, []);
    if (node.cluster) clusterSet.add(node.cluster);
  }

  for (const edge of edges) {
    degree.set(edge.source, (degree.get(edge.source) ?? 0) + 1);
    degree.set(edge.target, (degree.get(edge.target) ?? 0) + 1);
    adjacency.get(edge.source)?.push(edge.target);
    adjacency.get(edge.target)?.push(edge.source);
    edgesByNode.get(edge.source)?.push(edge);
    edgesByNode.get(edge.target)?.push(edge);
  }

  return {
    nodes: data.nodes,
    edges,
    byId,
    degree,
    adjacency,
    edgesByNode,
    clusters: [...clusterSet],
  };
}

export function searchNodes(nodes: GraphNode[], query: string): GraphNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return nodes.filter((node) => {
    if (node.label.toLowerCase().includes(q)) return true;
    if (node.id.toLowerCase().includes(q)) return true;
    if (node.type.toLowerCase().includes(q)) return true;
    if (node.description?.toLowerCase().includes(q)) return true;
    if (node.cluster?.toLowerCase().includes(q)) return true;
    if (node.metadata) {
      return Object.values(node.metadata).some((value) =>
        String(value).toLowerCase().includes(q),
      );
    }
    return false;
  });
}

export function neighborTypeCounts(
  nodeId: string,
  indexed: IndexedGraph,
): Partial<Record<NodeType, number>> {
  const counts: Partial<Record<NodeType, number>> = {};
  for (const id of indexed.adjacency.get(nodeId) ?? []) {
    const neighbor = indexed.byId.get(id);
    if (!neighbor) continue;
    counts[neighbor.type] = (counts[neighbor.type] ?? 0) + 1;
  }
  return counts;
}

export function relationshipLabel(raw: string): string {
  return raw.replaceAll("_", " ");
}

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

const SATELLITE_TYPES: NodeType[] = [
  "person",
  "project",
  "technology",
  "dataset",
  "company",
];

/** Deterministic expansion used for the 500-node performance dataset. */
export function expandGraph(base: GraphData, targetNodes: number): GraphData {
  if (targetNodes <= base.nodes.length) return base;
  const rand = mulberry32(42);
  const nodes: GraphNode[] = base.nodes.map((node) => ({ ...node }));
  const edges: GraphEdge[] = base.edges.map((edge) => ({ ...edge }));
  const hubs = [...nodes].sort(
    (a, b) => (b.importance ?? 0) - (a.importance ?? 0),
  );

  let i = 0;
  while (nodes.length < targetNodes) {
    const hub = hubs[i % hubs.length]!;
    const type = SATELLITE_TYPES[Math.floor(rand() * SATELLITE_TYPES.length)]!;
    const id = `sat_${i.toString().padStart(3, "0")}`;
    nodes.push({
      id,
      label: `${type === "person" ? "Contributor" : "Unit"} ${i + 1}`,
      type,
      description: `Satellite ${type} connected through ${hub.label}.`,
      importance: 0.18 + rand() * 0.35,
      cluster: hub.cluster,
      metadata: { hub: hub.label, generated: "true" },
    });
    edges.push({
      id: `e_${id}_${hub.id}`,
      source: id,
      target: hub.id,
      relationship: type === "person" ? "collaborates_with" : "related_to",
      weight: 0.3 + rand() * 0.4,
      directed: true,
    });
    if (rand() > 0.55 && i > 0) {
      const other = hubs[Math.floor(rand() * Math.min(8, hubs.length))]!;
      if (other.id !== hub.id) {
        edges.push({
          id: `e_${id}_${other.id}`,
          source: id,
          target: other.id,
          relationship: "related_to",
          weight: 0.2 + rand() * 0.3,
        });
      }
    }
    i += 1;
  }

  return { nodes, edges };
}
