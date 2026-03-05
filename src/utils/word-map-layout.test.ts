import { computeWordMapLayout, computeStaticCircularLayout } from './word-map-layout';
import type { WordMapNode, WordMapLink } from '@/types/vocabulary';

function makeNodes(count: number): WordMapNode[] {
  const nodes: WordMapNode[] = [{ id: 'root-1', word: 'happy', type: 'root', cardId: null }];
  for (let i = 1; i < count; i++) {
    nodes.push({
      id: `member-${i}`,
      word: `word${i}`,
      type: 'family',
      cardId: i,
      partOfSpeech: 'adj',
    });
  }
  return nodes;
}

function makeLinks(nodes: WordMapNode[]): WordMapLink[] {
  return nodes.slice(1).map((n) => ({
    source: 'root-1',
    target: n.id,
    label: 'form',
  }));
}

describe('computeWordMapLayout', () => {
  it('returns empty arrays for empty input', () => {
    const result = computeWordMapLayout([], [], 300, 300);
    expect(result.nodes).toEqual([]);
    expect(result.links).toEqual([]);
  });

  it('computes x and y positions for all nodes', () => {
    const nodes = makeNodes(5);
    const links = makeLinks(nodes);
    const result = computeWordMapLayout(nodes, links, 300, 300);

    for (const node of result.nodes) {
      expect(typeof node.x).toBe('number');
      expect(typeof node.y).toBe('number');
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
    }
  });

  it('centers layout roughly around width/2, height/2', () => {
    const nodes = makeNodes(7);
    const links = makeLinks(nodes);
    const width = 400;
    const height = 400;
    const result = computeWordMapLayout(nodes, links, width, height);

    const avgX = result.nodes.reduce((sum, n) => sum + (n.x ?? 0), 0) / result.nodes.length;
    const avgY = result.nodes.reduce((sum, n) => sum + (n.y ?? 0), 0) / result.nodes.length;

    // Average should be within 50px of center
    expect(Math.abs(avgX - width / 2)).toBeLessThan(50);
    expect(Math.abs(avgY - height / 2)).toBeLessThan(50);
  });

  it('handles 30 nodes (full mode max) without errors', () => {
    const nodes = makeNodes(30);
    const links = makeLinks(nodes);
    const result = computeWordMapLayout(nodes, links, 500, 500);

    expect(result.nodes).toHaveLength(30);
    expect(result.links).toHaveLength(29);
    // All should have positions
    for (const node of result.nodes) {
      expect(node.x).toBeDefined();
      expect(node.y).toBeDefined();
    }
  });

  it('does not produce overlapping positions for connected nodes', () => {
    const nodes = makeNodes(7);
    const links = makeLinks(nodes);
    const result = computeWordMapLayout(nodes, links, 300, 300);

    // Check that no two nodes share the exact same position
    for (let i = 0; i < result.nodes.length; i++) {
      for (let j = i + 1; j < result.nodes.length; j++) {
        const dist = Math.hypot(
          (result.nodes[i].x ?? 0) - (result.nodes[j].x ?? 0),
          (result.nodes[i].y ?? 0) - (result.nodes[j].y ?? 0)
        );
        expect(dist).toBeGreaterThan(1); // At least 1px apart
      }
    }
  });

  it('completes in under 200ms for 30 nodes', () => {
    const nodes = makeNodes(30);
    const links = makeLinks(nodes);
    const start = performance.now();
    computeWordMapLayout(nodes, links, 500, 500);
    const elapsed = performance.now() - start;
    // Jest environment is slower than native; 200ms is generous CI threshold
    expect(elapsed).toBeLessThan(200);
  });

  it('single node returns valid position', () => {
    const nodes: WordMapNode[] = [{ id: 'root-1', word: 'hello', type: 'root', cardId: null }];
    const result = computeWordMapLayout(nodes, [], 200, 200);
    expect(result.nodes).toHaveLength(1);
    expect(typeof result.nodes[0].x).toBe('number');
    expect(typeof result.nodes[0].y).toBe('number');
  });
});

describe('computeStaticCircularLayout', () => {
  it('returns empty arrays for empty input', () => {
    const result = computeStaticCircularLayout([], [], 300, 300);
    expect(result.nodes).toEqual([]);
    expect(result.links).toEqual([]);
  });

  it('places root node at center', () => {
    const nodes = makeNodes(5);
    const links = makeLinks(nodes);
    const result = computeStaticCircularLayout(nodes, links, 400, 400);

    expect(result.nodes[0].x).toBe(200);
    expect(result.nodes[0].y).toBe(200);
  });

  it('places member nodes on a circle around center', () => {
    const nodes = makeNodes(5);
    const links = makeLinks(nodes);
    const width = 400;
    const height = 400;
    const result = computeStaticCircularLayout(nodes, links, width, height);
    const radius = Math.min(width, height) * 0.35;

    for (let i = 1; i < result.nodes.length; i++) {
      const dist = Math.hypot(
        (result.nodes[i].x ?? 0) - width / 2,
        (result.nodes[i].y ?? 0) - height / 2
      );
      expect(dist).toBeCloseTo(radius, 5);
    }
  });

  it('does not produce overlapping positions', () => {
    const nodes = makeNodes(7);
    const links = makeLinks(nodes);
    const result = computeStaticCircularLayout(nodes, links, 300, 300);

    for (let i = 0; i < result.nodes.length; i++) {
      for (let j = i + 1; j < result.nodes.length; j++) {
        const dist = Math.hypot(
          (result.nodes[i].x ?? 0) - (result.nodes[j].x ?? 0),
          (result.nodes[i].y ?? 0) - (result.nodes[j].y ?? 0)
        );
        expect(dist).toBeGreaterThan(1);
      }
    }
  });

  it('handles single node', () => {
    const nodes: WordMapNode[] = [{ id: 'root-1', word: 'hello', type: 'root', cardId: null }];
    const result = computeStaticCircularLayout(nodes, [], 200, 200);
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].x).toBe(100);
    expect(result.nodes[0].y).toBe(100);
  });
});
