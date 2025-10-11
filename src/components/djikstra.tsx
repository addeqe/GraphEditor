import type { Node, Edge } from '@xyflow/react';

export function findShortestPath( //djikstra, most of this is c++ code I've done before but rewritten to js
  nodes: Node[],
  edges: Edge[],
  startNodeId: string,
  endNodeId: string
): { path: string[]; distance: number } {
  const graph: Map<string, { node: string; weight: number }[]> = new Map();

  nodes.forEach(node => {
    graph.set(node.id, []);
  });

  edges.forEach(edge => {
    const weight = Number(edge.data?.weight) || 1;
    graph.get(edge.source)?.push({ node: edge.target, weight });
    graph.get(edge.target)?.push({ node: edge.source, weight });
  });

  const distances: Map<string, number> = new Map();
  const previous: Map<string, string | null> = new Map();
  const priorityQueue: Set<string> = new Set();

  nodes.forEach(node => {
    distances.set(node.id, Infinity);
    previous.set(node.id, null);
    priorityQueue.add(node.id);
  });

  distances.set(startNodeId, 0);

  while (priorityQueue.size > 0) {
    let closestNodeId: string | null = null;
    let smallestDistance = Infinity;

    for (const nodeId of priorityQueue) {
      const distance = distances.get(nodeId)!;
      if (distance < smallestDistance) {
        smallestDistance = distance;
        closestNodeId = nodeId;
      }
    }
    
    if (!closestNodeId || closestNodeId === endNodeId) {
      break;
    }

    priorityQueue.delete(closestNodeId);

    const neighbors = graph.get(closestNodeId) || [];
    for (const neighbor of neighbors) {
      const newDistance = smallestDistance + neighbor.weight;
      
      if (newDistance < distances.get(neighbor.node)!) {
        distances.set(neighbor.node, newDistance);
        previous.set(neighbor.node, closestNodeId);
      }
    }
  }

  const path: string[] = [];
  let currentNode: string | null = endNodeId;

  if (distances.get(endNodeId) === Infinity) {
    return { path: [], distance: Infinity };
  }

  while (currentNode) {
    path.unshift(currentNode);
    currentNode = previous.get(currentNode) || null;
  }
  
  if (path[0] === startNodeId) {
    return { path, distance: distances.get(endNodeId)! };
  } else {
    return { path: [], distance: Infinity };
  }
}