import { useState, useCallback, useEffect} from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge, Position, Background, Controls, BackgroundVariant, MarkerType} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomEdge from "./components/CustomEdge"
import { axisNodes, axisEdges, initialEdges, initialNodes} from './flow/Flow.constants';
import { saveEdges, saveNodes, deleteNodes, deleteEdges, exportGraph, importCombinedGraphFromData ,loadVersionFromDB , getAllVersions, saveNewVersion} from './neo4j/neo4jService';
import { useFlowHandlers } from './components/useCallback';
import noLabel from './components/NoLabel';
import { useForceLayout } from './hooks/useForceLayout';
import "./App.css";

export default function App() {

  const edgeTypes = {
    custom: CustomEdge, noLabel
  };

  const nodeTypes = {
  
  };


  const [nrOfNodes, setNrOfNodes] = useState(0);
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedNodeType, setSelectedNodeType] = useState("default"); 
  const [selectedEdgeColor, setSelectedEdgeColor] = useState("default"); 
  const [selectedGraphType, setSelectedGraphType] = useState("default"); 
  const [dataForExport, setDataForExport] = useState([]);
  const [selectedEdgeWeight, setSelectedEdgeWeight] = useState(0); 
  const [isInputDisabled, setIsInputDisabled] = useState(true);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [versions, setVersions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const { onNodesChange, onEdgesChange, onConnect } = useFlowHandlers(setNodes, setEdges, selectedEdgeColor, selectedEdgeWeight, isInputDisabled);

const addNode = () => {
  const newNode = {
    id: crypto.randomUUID(),
    type: selectedNodeType,
    position: { x: 0, y: 0 },
    data: { label: "Node " + (nodes.length + 1) }
  };
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
/*console.log("selected x:" + selectedNode?.position.x + " selected y:"+selectedNode?.position.y);*/
  const handleSave = async () => {

    await saveNewVersion(nodes, edges); 
    console.log("saved current graph.");
    fetchVersions(); 
  };

  const handleUndo = () => {
     if (currentVersionIndex < versions.length - 1) {
       setCurrentVersionIndex(currentVersionIndex + 1);
     }
   };

   const handleRedo = () => {
     if (currentVersionIndex > 0) {
       setCurrentVersionIndex(currentVersionIndex - 1);
     }
   };
  
  const deleteEdgesOrNodes = async () =>
  {
    //databas
    const deletedNodes = nodes.filter((n) => n.selected);
    const deletedEdges = edges.filter((e) => e.selected);

    //reactflow
    const newNodes = nodes.filter((n) => !n.selected);
    const newEdges = edges.filter((e) => !e.selected);

    //databas
    await deleteNodes(deletedNodes);
    await deleteEdges(deletedEdges);

    //reactflow
    setNodes(newNodes);
    setEdges(newEdges);
}
 useEffect(() => {
    fetchVersions();
  }, []);
 useEffect(() => {
     if (versions.length === 0 || !versions[currentVersionIndex]) return;

     const loadVersion = async () => {
       const versionIdToLoad = versions[currentVersionIndex].versionId;
       const { nodes: loadedNodes, edges: loadedEdges } = await loadVersionFromDB(versionIdToLoad);
       setNodes(loadedNodes);
       setEdges(loadedEdges);
     };

     loadVersion();
 }, [currentVersionIndex, versions]);
       const fetchVersions = async () => {
       const allVersions = await getAllVersions();
       setVersions(allVersions);
       setCurrentVersionIndex(0); 
     };
const { runLayout } = useForceLayout(onNodesChange); //forcedirected
const handleGraphTypeChange = async () => {
  setIsProcessing(true);
  try {
    const finalNodesAfterLayout = await runLayout(nodes, edges);

    await saveNewVersion(finalNodesAfterLayout, edges); //mst göra så för att annars savear den mitt i
    console.log("Saved");

    await fetchVersions();

  } catch (error) {
    console.error(error);
  } finally {
    setIsProcessing(false);
  }
};
const handleCombinedImport = async () => {
  const fileInput = document.getElementById("csvfile");
  if (!fileInput.files || fileInput.files.length === 0) {
    alert("chose csv");
    return;
  }
  const file = fileInput.files[0];

  const reader = new FileReader();
  reader.onload = async (event) => {
    const csvData = event.target.result;
    
    const lines = csvData.trim().split(/\r?\n/);//for both windows, linux and mac
    const headers = lines[0].split(',').map(h => h.trim());
    const dataAsObjects = lines.slice(1).map(line => {
      const values = line.split(',');
      let obj = {};
      headers.forEach((header, index) => {
        obj[header] = (values[index] || "").trim();
      });
      return obj;
    });

    try {
      await importCombinedGraphFromData(dataAsObjects);
      fetchVersions(); 
    } catch (error) {
      console.error( error);
    }
  };
  reader.readAsText(file);
};
  
  const importAndSave = async() =>{
    handleCombinedImport();
    handleSave();
  }

const handleExportCsv = async () => {
    try {
        const data = await exportGraph();
        
        if (!data || data.length === 0) {
            console.log("need something on graph to export");
            return;
        }
        const headers = Object.keys(data[0]);
        let csvContent = "";
        csvContent += headers.join(',') + '\n';
        for (const row of data) {
            let rowValues = [];
            for (const header of headers) {
                let value = row[header];
                let stringValue = (value === null || value === undefined) ? '' : String(value);
                rowValues.push(stringValue);
            }
            csvContent += rowValues.join(',') + '\n';
        }
        const blob = new Blob([csvContent]);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'data.csv'; 
        link.click();
        URL.revokeObjectURL(link.href);

        console.log("csv exported");
        
    } catch (error) {
        console.error(error);
    }
};
  return (
    <>
  <button onClick={() => setShowNavbar(!showNavbar)}>{showNavbar ? '↑' : '↓'}</button>
      {showNavbar &&
        <div className="navbar">
          <input type="file" id="csvfile" accept='.csv' />
          <button onClick={importAndSave}>Import csv</button>
<div><button onClick={handleExportCsv}>Download Graph(CSV)</button>
        </div>
          <label htmlFor="graphType">Graph type:</label>
          <select id="graphType" value={selectedGraphType} onChange={handleGraphTypeChange}>
            <option value="manual">Manual</option>
            <option value="forceDirected">Force Directed</option>
          </select>
          <label htmlFor="edgeColor">Edge Color:</label>
          <select id="edgeColor" value={selectedEdgeColor} onChange={(e) => setSelectedEdgeColor(e.target.value)} >
            <option value="default">Default</option>
            <option value="red">Red</option>
          </select>
          <label>Edge Weight:</label><input type="number" className="input" size={10} disabled={isInputDisabled} value={selectedEdgeWeight} onChange={(e) => setSelectedEdgeWeight(Number(e.target.value))} />
          <button onClick={() => setIsInputDisabled(!isInputDisabled)}>
            {isInputDisabled ? "Activate" : "Deactivate"}
          </button>

          <button onClick={addNode}>Add Node</button>
          <button onClick={deleteEdgesOrNodes}>Delete Node/Edge</button>
          <label>Change Node Name:</label><input type="text" onChange={changeLabel} />
          <input type="number" className="input" min="0" value={nrOfNodes} onChange={(e) => setNrOfNodes(Number(e.target.value))} />
          <button onClick={addNrOfNodes}>Add {nrOfNodes} Nodes</button>
          <button onClick={handleSave}>Save</button>
          <button onClick={handleUndo} disabled={currentVersionIndex >= versions.length - 1}>Undo</button>
          <button onClick={handleRedo} disabled={currentVersionIndex === 0}>Redo</button>

        </div>}

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