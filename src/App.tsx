import { useState, useCallback, useEffect} from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge, Position, Background, Controls, NodeResizer, BackgroundVariant, MarkerType} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import ResizableNodeSelected from './components/ResizableNodeSelected';
import CustomEdge from "./components/CustomEdge"
import { axisNodes, axisEdges, initialEdges, initialNodes} from './flow/Flow.constants';
import { Link } from '@chakra-ui/react';
import { saveEdges, saveNodes, loadFlowFromDB } from './neo4j/neo4jService';
import { useFlowHandlers } from './components/useCallback';

export default function App() {

  const edgeTypes = {
    custom: CustomEdge,
  };

  const nodeTypes = {
    ResizableNodeSelected: ResizableNodeSelected
  };


  const [nrOfNodes, setNrOfNodes] = useState(0);
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedNodeType, setSelectedNodeType] = useState("default"); 
  const { onNodesChange, onEdgesChange, onConnect } = useFlowHandlers(setNodes, setEdges);

const addNode = () => {
    const newNode = {
      id: crypto.randomUUID(),
      type: selectedNodeType,
      position: { x: 0, y: 0 },
      data: { label: "Node " + (nodes.length + 1) }

    }
    setNodes([...nodes, newNode]);
  };
  const addNrOfNodes = () => {
    const newNode = [];
    for (let i = 0; i < nrOfNodes; i++) {
      newNode.push({
        id: crypto.randomUUID(),
        position: { x: 0, y: 0 },
        data: { label: "Node " + (nodes.length + i + 1) }
      });
    }
    setNodes([...nodes, ...newNode]);
  };
  const handleSelectionChange = useCallback(({nodes}) => {
  if (nodes.length > 0) {
    setSelectedNode(nodes[0]);
  } else {
    setSelectedNode(null);
  }
  }, []);
  
const changeLabel = (e) => {
  const newLabel = e.target.value;
  setNodes((nodes) =>
    nodes.map((node) =>
      node.id === selectedNode?.id
        ? { ...node, data: { ...node.data, label: newLabel } }
        : node
    )
  );
};

  const selectedX = selectedNode?.position.x;
  const selectedY = selectedNode?.position.y;
  console.log("Nodens position:", selectedX, selectedY)

  const handleSave = async () => {
    await saveNodes(nodes);
    await saveEdges(edges);
  };

  useEffect(() => {
  const loadFlow = async () => {
    const { nodes, edges } = await loadFlowFromDB();
    setNodes(nodes);
    setEdges(edges);
  };
  loadFlow();
}, []);
  
  return (
    <>
  <label htmlFor="nodeTypes">Node Types:</label>
  <select id="nodeTypes" value={selectedNodeType} onChange={(e) => setSelectedNodeType(e.target.value)} >
    
  <option value="">Default</option>
  <option value="ResizableNodeSelected">Resizeable</option>
      </select> 
      <button onClick={addNode}>Add Node</button>
      <button onClick={() => { setNodes((nds) => nds.filter((n) => !n.selected)); setEdges((eds) => eds.filter((e) => !e.selected));}}>Delete node/edge</button>
      <label>Change Node Name:</label><input type="text" /*value={selectedNode?.data.label} */onChange={changeLabel }/>
      <input type="number" value={nrOfNodes} onChange={(e) => setNrOfNodes(Number(e.target.value))} /><button onClick={addNrOfNodes}>Add {nrOfNodes} Nodes</button>
      <button onClick={handleSave}>Save</button>

      <h1>(X: {selectedX}) (Y: {selectedY})</h1>

    <div style={{ width: '100vw', height: '100vh' }}>
        <ReactFlow
        nodes={[...axisNodes, ...nodes]}
        edges={[...axisEdges, ...edges]}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
          defaultViewport={{ x: window.innerWidth / 2, y: window.innerHeight / 2, zoom: 1 }}
          onSelectionChange={handleSelectionChange}
        >
      <Background 
        gap={50}
        size={1}
        color="#8888883f"
        variant={BackgroundVariant.Lines}
          />
      </ReactFlow>  
    </div>
      </>
  );
}