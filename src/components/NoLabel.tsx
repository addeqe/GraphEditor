import { EdgeLabelRenderer, BaseEdge, getSmoothStepPath } from '@xyflow/react';
 
const noLabel = ({ id, data, ...props }) => {
  const [edgePath] = getSmoothStepPath(props);
  const edgeColor = {
    default: '#b1b1b7',
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

  const strokeColor = edgeColor[data.color] || edgeColor["default"];
  return (
    <>
      <BaseEdge id={id} path={edgePath} style={{stroke:strokeColor}}/>
    </>
  );
};
//source: https://github.com/xyflow/xyflow/blob/main/packages/react/src/components/EdgeLabelRenderer/index.tsx
export default noLabel;