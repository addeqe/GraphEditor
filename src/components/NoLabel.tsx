import { BaseEdge, getSmoothStepPath, EdgeProps } from '@xyflow/react';
 
const NoLabel = ({ id, data, ...props }: EdgeProps) => {
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

  const isPath = data?.isPath;
  const strokeColor = isPath ? 'lime' : (edgeColor[data?.color] || edgeColor.default);
  const strokeWidth = isPath ? 3 : 1.5;

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={{ stroke: strokeColor, strokeWidth }} animated={isPath} />
    </>
  );
};

export default NoLabel;