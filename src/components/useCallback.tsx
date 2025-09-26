import { useCallback } from 'react';
import { applyNodeChanges, applyEdgeChanges, addEdge, MarkerType } from '@xyflow/react';

export const useFlowHandlers = (setNodes, setEdges, selectedEdgeColor, selectedEdgeWeight, isInputDisabled) => {
  const onNodesChange = useCallback(
    (changes) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [setNodes]
  );
  
  const onEdgesChange = useCallback(
    (changes) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [setEdges]
  );
  const currentWeight = !isInputDisabled ? selectedEdgeWeight : null;
  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        id: crypto.randomUUID(),
        type: !isInputDisabled ? "custom": "noLabel",
        markerEnd: {
          type: MarkerType.Arrow,
        },
        data: {
          color: selectedEdgeColor,
          weight: currentWeight,
          label: currentWeight
        },
      }; console.log("edge created with weight and color: ", selectedEdgeWeight, selectedEdgeColor);
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges, selectedEdgeColor, selectedEdgeWeight, isInputDisabled]
  );

  return { onNodesChange, onEdgesChange, onConnect };
};