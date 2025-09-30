import { hierarchy, tree, HierarchyPointNode } from 'd3-hierarchy';
import { Node, Edge } from '@xyflow/react';
//found most inspiration through https://d3js.org/d3-hierarchy, 

interface TreeNode extends Node {
  children?: TreeNode[];
}

const NODE_WIDTH = 200;
const NODE_HEIGHT = 100;
const HORIZONTAL_SPACING = 600;

export const useHierarchicalLayout = () => {
  const runLayout = (nodes: Node[], edges: Edge[]): Node[] => {
    if (nodes.length === 0) return [];

    const nodeMap = new Map<string, TreeNode>();
    nodes.forEach(node => nodeMap.set(node.id, { ...node, children: [] }));

    edges.forEach(edge => {
      const parent = nodeMap.get(edge.source);
      const child = nodeMap.get(edge.target);
      if (parent && child) {
        parent.children?.push(child);
      }
    });

    const targetIds = new Set(edges.map(edge => edge.target));
    let rootNodes = Array.from(nodeMap.values()).filter(node => !targetIds.has(node.id));

    if (rootNodes.length === 0 && nodes.length > 0) {
      rootNodes.push(nodeMap.get(nodes[0].id)!);
    }

    const positionMap = new Map<string, { x: number; y: number }>();

    rootNodes.forEach((root, index) => {
      const hierarchyRoot = hierarchy(root);
      const treeLayout = tree<TreeNode>().nodeSize([NODE_WIDTH, NODE_HEIGHT]);
      const layout = treeLayout(hierarchyRoot);

      layout.descendants().forEach(d3Node => {
        positionMap.set(d3Node.data.id, {
          x: d3Node.x + index * HORIZONTAL_SPACING,
          y: d3Node.y
        });
      });
    });

    const newNodes = nodes.map(node => {
      const newPosition = positionMap.get(node.id);
      if (newPosition) {
        return {
          ...node,
          position: { x: newPosition.x, y: newPosition.y }
        };
      }
      return node;
    });

    return newNodes;
  };

  return { runLayout };
};
