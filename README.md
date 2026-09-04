# Network Intelligence Dashboard

Production-quality interactive force-directed graph for exploring relationships across a technology ecosystem — people, companies, projects, technologies, datasets, locations, and events.

The canvas is the workspace. Chrome stays quiet: a compact header, floating controls, a sliding inspector, and live simulation status.

## Overview

Open the app and you land on a dark, full-bleed network of the Pacific Northwest research stack. Drag a node, search for `machine`, click Alice Chen, reheat the layout, freeze it, or load a 500-node stress graph from Settings.

The visualization is built so the UI never fights the simulation: React owns selection, search, and chrome; a canvas engine owns forces, hit-testing, zoom, and paint.

## Features

- Force-directed layout with cluster gravity
- Drag to pin nodes; double-click to pin or unpin
- Wheel zoom toward cursor, pinch zoom, pan
- Click to inspect; hover for neighbor emphasis and a tooltip
- Search by name, id, type, or description (`/` to focus, `Esc` to clear)
- Reheat, freeze, reset, fit, and center-selected
- Toggle node labels, edge labels, and neighbor highlighting
- Dark (default) and light themes, persisted locally
- Sample graph (~45 nodes / 88 edges) and a 500-node performance dataset
- Keyboard-accessible controls, visible focus, and shape+color node types

## Architecture

```
UI chrome (header, inspector, search)
        ↓
Graph state (Zustand — selection, flags, dataset)
        ↓
Force simulation (d3-force, outside React)
        ↓
Canvas renderer (rAF, DPR-aware, LOD labels)
        ↓
Interaction layer (pointer, wheel, pinch, hit-test)
```

Graph data is a plain `GraphData` object (`nodes` + `edges`). Swap the sample dataset for a REST, GraphQL, or graph-database payload without rewriting the renderer.

## Technology stack

| Piece | Choice | Why |
| --- | --- | --- |
| App shell | TanStack Start + React 19 | Typed routes, SSR-safe preview, Vite HMR |
| Styling | Tailwind v4 + CSS tokens | One palette, dark/light without restyling components |
| Simulation | `d3-force` | Stable, well-understood force layout |
| Rendering | Canvas 2D | Smooth at 500+ nodes; UI state is not updated per frame |
| Spatial index | `d3-quadtree` available; linear hit-test for current sizes | Fast enough under 1k nodes |
| Icons | lucide-react | Accessible, consistent stroke icons |

## Performance

- Simulation ticks do **not** write React state. The canvas redraws on `requestAnimationFrame` only when dirty.
- Labels level-of-detail: edge labels and dense node labels drop at low zoom or on large graphs.
- Unrelated nodes dim instead of being re-laid-out.
- Frozen simulations stop the force timer entirely.
- Device pixel ratio is capped at 2.

## Local development

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

## Deployment

Repository: [ahmaddroobi99/network-intelligence-dashboard](https://github.com/ahmaddroobi99/network-intelligence-dashboard)

This project is a TanStack Start app. Production builds emit a Vercel/Nitro output (`npm run build`).

### Netlify

A Netlify project is provisioned at `network-intelligence-dashboard.netlify.app`.

`netlify.toml` builds with `npm run build`. If the host expects a static publish directory, point it at the generated client assets after a successful build. SPA fallback is configured so refreshes do not 404.

1. Connect the GitHub repository to the Netlify project.
2. Build command: `npm run build`
3. Confirm the production URL loads on desktop and mobile.

Do not commit secrets or `.env` files.

## Future improvements

- API-backed graph data (REST / GraphQL / WebSocket)
- Neo4j or other graph-database adapters
- Community detection beyond authored clusters
- Shortest-path highlighting
- Graph analytics (betweenness, PageRank)
- Import / export of GraphJSON
- Optional authentication for private graphs
