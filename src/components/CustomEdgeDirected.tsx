import { EdgeLabelRenderer, BaseEdge, getSmoothStepPath, EdgeProps, MarkerType } from '@xyflow/react';
 
const CustomEdgeDirected = ({ id, data, ...props }: EdgeProps) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath(props);
  const edgeColor = {
    default: '#b1b1bियत',
    red: '#FF0072',
    orange: '#FF6B00',
    yellow: '#FFD500',
    green: '#00C48C',
    teal: '#00A8B5',
    blue: '#007AFF',
    purple: '#8A4FFF',
    pink: '#FF8FD1',
    dark: '#2B2B2E'  
  };

  const isPath = data?.isPath;
  const strokeColor = isPath ? 'lime' : (edgeColor[data?.color] || edgeColor.default);
  const strokeWidth = isPath ? 4 : 2.5;

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={{ stroke: strokeColor, strokeWidth }} animated={isPath}
      markerEnd={{type: MarkerType.ArrowClosed, width: 25, height: 25}}/>
      {data.label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute', 
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: '#ffcc00',
              padding: 5,
              borderRadius: 5,
              fontSize: 10,
              fontWeight: 700,
            }}
            className="nodrag nopan"
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};

export default CustomEdgeDirected;