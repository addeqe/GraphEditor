
import { useCallback } from 'react';
import { applyNodeChanges, applyEdgeChanges, addEdge, MarkerType } from '@xyflow/react';

export const useFlowHandlers = (setNodes, setEdges) => {
  const onNodesChange = useCallback(
    (changes) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [setNodes]
  );
  
  const onEdgesChange = useCallback(
    (changes) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [setEdges]
  );
  
  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        id: crypto.randomUUID(),
        type: "custom",
        markerEnd: {
          type: MarkerType.Arrow,
        },
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  return { onNodesChange, onEdgesChange, onConnect };
};