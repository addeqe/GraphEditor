import { BaseEdge, EdgeLabelRenderer, EdgeProps, getSmoothStepPath, getStraightPath } from "@xyflow/react";
import { IconButton } from '@chakra-ui/react';
import { DeleteIcon } from "@chakra-ui/icons";
export default function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
  targetPosition,
  });

  return (
    <>
          <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} />
    </>
  );
}