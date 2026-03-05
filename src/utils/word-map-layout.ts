import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force';

import type { WordMapNode, WordMapLink } from '@/types/vocabulary';

// ─── Constants ──────────────────────────────────────────────
const SIMULATION_TICKS = 300;
const LINK_DISTANCE = 80;
const CHARGE_STRENGTH = -200;
const COLLIDE_RADIUS = 40;

// ─── d3 simulation node type ────────────────────────────────
interface SimNode extends SimulationNodeDatum {
  id: string;
}

interface SimLink extends SimulationLinkDatum<SimNode> {
  source: string | SimNode;
  target: string | SimNode;
}

/**
 * Compute node positions using d3-force synchronous simulation.
 * 300 ticks for 30 nodes completes in <10ms.
 * Returns nodes with x/y populated (mutated in place by d3).
 */
export function computeWordMapLayout(
  nodes: WordMapNode[],
  links: WordMapLink[],
  width: number,
  height: number
): { nodes: WordMapNode[]; links: WordMapLink[] } {
  if (nodes.length === 0) return { nodes, links };

  // d3-force mutates input arrays — clone to avoid side effects
  const simNodes: SimNode[] = nodes.map((n) => ({ ...n }));
  const simLinks: SimLink[] = links.map((l) => ({ ...l }));

  const simulation = forceSimulation<SimNode>(simNodes)
    .force(
      'link',
      forceLink<SimNode, SimLink>(simLinks)
        .id((d) => d.id)
        .distance(LINK_DISTANCE)
    )
    .force('charge', forceManyBody().strength(CHARGE_STRENGTH))
    .force('center', forceCenter(width / 2, height / 2))
    .force('collide', forceCollide(COLLIDE_RADIUS))
    .stop();

  // Run synchronously
  for (let i = 0; i < SIMULATION_TICKS; i++) simulation.tick();

  // Copy computed positions back to original nodes
  for (let i = 0; i < nodes.length; i++) {
    nodes[i].x = simNodes[i].x;
    nodes[i].y = simNodes[i].y;
  }

  return { nodes, links };
}

/**
 * Static circular layout for budget devices — no d3-force physics.
 * Root node at center, members evenly spaced on a circle.
 */
export function computeStaticCircularLayout(
  nodes: WordMapNode[],
  links: WordMapLink[],
  width: number,
  height: number
): { nodes: WordMapNode[]; links: WordMapLink[] } {
  if (nodes.length === 0) return { nodes, links };

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.35;

  // First node (root) at center
  nodes[0].x = cx;
  nodes[0].y = cy;

  // Remaining nodes evenly spaced on a circle
  const memberCount = nodes.length - 1;
  for (let i = 1; i < nodes.length; i++) {
    const angle = (2 * Math.PI * (i - 1)) / memberCount;
    nodes[i].x = cx + radius * Math.cos(angle);
    nodes[i].y = cy + radius * Math.sin(angle);
  }

  return { nodes, links };
}
