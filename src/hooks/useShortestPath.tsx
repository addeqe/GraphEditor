import { useState, useMemo, useCallback } from 'react'; // Importera useCallback
import type { Node, Edge } from '@xyflow/react';
import { findShortestPath } from "../components/djikstra";

export function useShortestPath(nodesToProcess: Node[], edgesToProcess: Edge[]) {
  const [isPathfinding, setIsPathfinding] = useState(false);
  const [startNodeId, setStartNodeId] = useState<string | null>(null);
  const [endNodeId, setEndNodeId] = useState<string | null>(null);
  const [shortestPath, setShortestPath] = useState<{ path: string[]; distance: number } | null>(null);

  const startPathfinding = useCallback(() => {
    setIsPathfinding(true);
    setStartNodeId(null);
    setEndNodeId(null);
    setShortestPath(null);
  }, []);

  const cancelPathfinding = useCallback(() => {
    setIsPathfinding(false);
    setStartNodeId(null);
    setEndNodeId(null);
    setShortestPath(null);
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    if (!isPathfinding) return;

    if (!startNodeId) {
      setStartNodeId(nodeId);
      return;
    } 
    
    if (startNodeId && nodeId !== startNodeId) {
      setEndNodeId(nodeId);
      const result = findShortestPath(nodesToProcess, edgesToProcess, startNodeId, nodeId);
      setShortestPath(result);
      setIsPathfinding(false);
    }
  }, [isPathfinding, startNodeId, nodesToProcess, edgesToProcess]);


  const highlightedNodes = useMemo(() => {
    if (!shortestPath?.path || shortestPath.path.length === 0) {
      return nodesToProcess;
    }
    const pathNodeIds = new Set(shortestPath.path);
    return nodesToProcess.map(node => ({
      ...node,
      style: {
        ...node.style,
        background: pathNodeIds.has(node.id) ? '#90EE90' : undefined,
        border: pathNodeIds.has(node.id) ? '2px solid green' : undefined,
      }
    }));
  }, [nodesToProcess, shortestPath]);


  const highlightedEdges = useMemo(() => { 
    if (!shortestPath?.path || shortestPath.path.length === 0) {
      return edgesToProcess;
    }
    const pathEdgeIds = new Set<string>();

    for (let i = 0; i < shortestPath.path.length - 1; i++) {
        const source = shortestPath.path[i];
        const target = shortestPath.path[i + 1];

        const edge = edgesToProcess.find(e => 
            (e.source === source && e.target === target) ||
            (e.source === target && e.target === source)
        );
        if (edge) {
            pathEdgeIds.add(edge.id);
        }
    }

    return edgesToProcess.map(edge => ({
      ...edge,
      animated: pathEdgeIds.has(edge.id),
      data: {
        ...edge.data,
        isPath: pathEdgeIds.has(edge.id),
      },
    }));
  }, [edgesToProcess, shortestPath]);

  return {
    isPathfinding,
    startNodeId,
    shortestPath,
    startPathfinding,
    cancelPathfinding,
    handleNodeClick,
    highlightedNodes,
    highlightedEdges,
  };
}

