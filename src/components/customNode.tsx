import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';


const CircleNode: React.FC<NodeProps> = ({ data }) => {
  return (
    <>  
    <Handle type="source" position={Position.Right} />
    <Handle type="target" position={Position.Left} />

      <div
        style={{
          backgroundColor: '#3585e6ff', 
          width: 100,
          height: 100,
          borderRadius: '50%',
          border: '2px solid #140f7cff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          color: '#ffffffff',
          fontWeight: 'bold',
          padding: '5px',
        }}
      >
        {data.label}
      </div>
    </>
  );
};

export default memo(CircleNode);
