import { EdgeLabelRenderer, BaseEdge, getSmoothStepPath } from '@xyflow/react';
 
const noLabel = ({ id, data, ...props }) => {
  const [edgePath] = getSmoothStepPath(props);
  const edgeColor = {
    default: '#b1b1b7',
    red: '#FF0072',
  };

  const strokeColor = edgeColor[data.color] || edgeColor["default"];
  return (
    <>
      <BaseEdge id={id} path={edgePath} style={{stroke:strokeColor}}/>
    </>
  );
};
//source: https://github.com/xyflow/xyflow/blob/main/packages/react/src/components/EdgeLabelRenderer/index.tsx
export default noLabel;