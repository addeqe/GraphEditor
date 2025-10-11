import { Node, Edge } from '@xyflow/react';
//easiest of them all, just calculate the middle
const RADIUS = 400;
const CENTER_X = 600;
const CENTER_Y = 300;

export const useCircularLayout = () => {
  const runLayout = (nodes: Node[], edges: Edge[]): Node[] => {
    if (nodes.length === 0) {
      return [];
    }

    const nodeCount = nodes.length;

    const newNodes = nodes.map((node, index) => {
      const angle = (index / nodeCount) * 2 * Math.PI;

      const x = CENTER_X + RADIUS * Math.cos(angle);
      const y = CENTER_Y + RADIUS * Math.sin(angle); //dont really know what cos and sin is

      return {
        ...node,
        position: { x, y },
      };
    });

    return newNodes;
  };

  return { runLayout };
};