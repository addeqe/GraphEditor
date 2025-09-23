import { EdgeLabelRenderer, BaseEdge, getSmoothStepPath } from '@xyflow/react';
 
const CustomEdge = ({ id, data, ...props }) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath(props);
  const edgeColor = {
    default: '#b1b1b7',
    red: '#FF0072',
  };

  const strokeColor = edgeColor[data.color] || edgeColor["default"];
  return (
    <>
      <BaseEdge id={id} path={edgePath} style={{stroke:strokeColor}}/>
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute', 
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: '#ffcc00',
            padding: 5,
            borderRadius: 5,
            fontSize: 5,
            fontWeight: 700,
          }}
          className="nodrag nopan"
        >
          {data.label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};
//source: https://github.com/xyflow/xyflow/blob/main/packages/react/src/components/EdgeLabelRenderer/index.tsx
export default CustomEdge;