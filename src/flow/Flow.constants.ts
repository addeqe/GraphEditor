import { Node, Edge, MarkerType } from "@xyflow/react";  

export const axisEdges = [
    {
      id: 'x-axis',
      source: 'x-start',
      target: 'x-end',
      style: { stroke: 'black', strokeWidth: 2 },
      animated: false,
    },
    {
      id: 'y-axis',
      source: 'y-start',
      target: 'y-end',
      style: { stroke: 'black', strokeWidth: 2 },
      animated: false,
    },
  ];

export  const axisNodes = [
    { id: 'x-start', position: { x: -10000, y: 0 }, data: { label: '' } },
    { id: 'x-end', position: { x: 10000, y: 0 }, data: { label: '' } },
    { id: 'y-start', position: { x: 0, y: -10000 }, data: { label: '' } },
    { id: 'y-end', position: { x: 0, y: 10000 }, data: { label: '' } },
  ];

export const initialNodes: Node[] = [
    {
        id: "1",
        position: { x: 0, y: 0 },
        data: { label: "Node 1" },
    },
    {
        id: "2",
        position: { x: 200, y: -200 },
        data: { label: "Node 2" },
    },
];
const weights = 2;
export const initialEdges: Edge[] = [
    {
        id: "1-2",
        source: "1",
        target: "2",
        type: "custom",
        markerEnd: {
            type: MarkerType.Arrow
    },
        
    data: {
        weight: weights,
        label: weights
        }
    },
];

