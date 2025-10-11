import { useState, useCallback, useEffect, useMemo} from 'react';
import { ReactFlow,MiniMap, applyNodeChanges, applyEdgeChanges, addEdge, Position, Background, Controls, BackgroundVariant, MarkerType, Edge, Node} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomEdge from "./components/CustomEdge"
import { axisNodes, axisEdges, initialEdges, initialNodes} from './flow/Flow.constants';
import { saveEdges, saveNodes, deleteNodes, deleteEdges, exportGraph, importCombinedGraphFromData ,loadVersionFromDB , getAllVersions, saveNewVersion, ClearGraph} from './neo4j/neo4jService';
import { useFlowHandlers } from './components/useCallback';
import noLabel from './components/NoLabel';
import { useForceLayout } from './hooks/useForceLayout';
import { useHierarchicalLayout } from './hooks/useHierarchicalLayout';
import { useCircularLayout } from './hooks/useCircularLayout';
import { useShortestPath } from './hooks/useShortestPath';
import customNode from './components/customNode';
import Menu from './components/menu';

import "./App.css";
import CustomEdgeDirected from './components/CustomEdgeDirected';


export default function App() {

  const edgeTypes = {
    custom: CustomEdge,
    noLabel: noLabel,
    directed: CustomEdgeDirected,
  };

  const nodeTypes = {
    circle: customNode
  };

  const [nrOfNodes, setNrOfNodes] = useState(0);
  const [nodes, setNodes] = useState(initialNodes);
  const [edges, setEdges] = useState(initialEdges);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);
  const [selectedNodeType, setSelectedNodeType] = useState("default"); 
  const [selectedEdgeColor, setSelectedEdgeColor] = useState("default"); 
  const [selectedGraphType, setSelectedGraphType] = useState("default"); 


  const [selectedEdgeOrNode, setSelectedEdgeOrNode] = useState("default"); 
  const [selectedNodeOption, setSelectedNodeOption] = useState("default"); 

  const [selectedEdgeOption, setSelectedEdgeOption] = useState("default"); 
  const [specificEdgeOption, setSpecificEdgeOption] = useState("default");
  const [specificNodeOption, setSpecificNodeOption] = useState("default"); 
  const [selectedNodeSearch, setSelectedNodeSearch] = useState("default"); 


  const lowercaseSpecificEdgeOption = specificEdgeOption.toLowerCase();
  const lowercaseSpecificNodeOption = specificNodeOption.toLowerCase();

  const [dataForExport, setDataForExport] = useState([]);
  const [selectedEdgeWeight, setSelectedEdgeWeight] = useState(0); 
  const [isInputDisabled, setIsInputDisabled] = useState(true);
  const [isSnapGridDisabled, setIsSnapGridDisabled] = useState(true);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(0);
  const [versions, setVersions] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const { onNodesChange, onEdgesChange, onConnect } = useFlowHandlers(setNodes, setEdges, selectedEdgeColor, selectedEdgeWeight, isInputDisabled);
  const { runLayout: runForceLayout } = useForceLayout(onNodesChange); 
  const { runLayout: runHierarchicalLayout } = useHierarchicalLayout();
  const { runLayout: runCircularLayout } = useCircularLayout();

const addNode = () => {
  const newNode = {
    id: crypto.randomUUID(),
    position: { x: 0, y: 0 },
    type: "circle",
    data: { label: "Node " + (nodes.length + 1) }
  };
  setNodes([...nodes, newNode]);
  };
  const addNrOfNodes = () => {
    const newNode = [];
    for (let i = 0; i < nrOfNodes; i++) {
      newNode.push({
        id: crypto.randomUUID(),
        type: "circle",
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

  let relationshipType = "CONNECTED";
  if (selectedGraphType === "hierarchical") {
    relationshipType = "HAS_CHILD"
    };
    if (selectedGraphType === "default") {
      relationshipType = "CONNECTED"
    };

    await saveNewVersion(nodes, edges, relationshipType); 
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
  

const handleGraphTypeChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const layoutType = event.target.value;
    setSelectedGraphType(layoutType);
    const updatedEdges = edges.map(edge => {
        if (layoutType === "forceDirected") {
            switch (edge.type) {
                case 'custom':
                    return { ...edge, type: 'directed' };
                case 'noLabel':
                    return { ...edge, type: 'directed' };
                default:
                    return edge;
            }
        } else {
              switch (edge.type) {

                  case 'directed':
                      return { ...edge, type: 'directed' };
                  default:
                      return edge;
              }
            }
        }
    );
    setEdges(updatedEdges);



    setIsProcessing(true);
    try {
        let finalNodesAfterLayout = nodes;

        if (layoutType === "forceDirected") {
            finalNodesAfterLayout = await runForceLayout(nodes, edges);
        } else if (layoutType === "hierarchical") {
            finalNodesAfterLayout = runHierarchicalLayout(nodes, edges);
        } else if (layoutType === "circular") {
            finalNodesAfterLayout = runCircularLayout(nodes, edges);
        } else {
            setIsProcessing(false);
            return;
        }

        setNodes(finalNodesAfterLayout);
        await saveNewVersion(finalNodesAfterLayout, updatedEdges, layoutType);

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
  
const nodeToDisplay = useMemo((): Node[] => {
  const displayAllNodes = nodes;
  let optionToReturn = displayAllNodes;
  const displayNodesByID = nodes.filter(
    node => node.data?.label === specificNodeOption
  );
  if (selectedNodeOption === "id") {
    optionToReturn = displayNodesByID;
  }
  return optionToReturn;
}, [nodes, specificNodeOption, selectedNodeOption]); //try for optimization but did absolutely nothing.



const edgeToDisplay = useMemo((): Edge[] => {
  const displayAllEdges = edges;
  let optionToReturn = displayAllEdges;
  
  const displayEdgesByWeight = edges.filter(edge => edge.data?.weight === Number(lowercaseSpecificEdgeOption));
  const displayEdgesByColor = edges.filter(edge => edge.data?.color === lowercaseSpecificEdgeOption);
    if (selectedEdgeOption == "color") {
      optionToReturn = displayEdgesByColor;
    }
    if (selectedEdgeOption == "weight") {
      optionToReturn = displayEdgesByWeight;
    }
  return optionToReturn;
}, [edges, specificEdgeOption, selectedEdgeOption]);

const {
    isPathfinding,
    startNodeId,
    shortestPath,
    startPathfinding,
    cancelPathfinding,
    handleNodeClick,
    highlightedNodes,
    highlightedEdges, 
  } = useShortestPath(nodeToDisplay, edgeToDisplay);



const nodeToSearch = (nodes: Node[], selectedNodeSearch: string): string => {
  const filteredNodes = nodes.filter(node => node.data?.label === selectedNodeSearch);

  if (filteredNodes.length === 0) {
    return "";
  }
  const lines = filteredNodes.map(node =>
    `|${node.data?.label}, X: ${node.position.x}, Y: ${node.position.y}|`
  );

  return lines.join("\n");
};
const resultSearch = nodeToSearch(nodes, selectedNodeSearch);

const onSelectionChange = useCallback(
  ({ nodes: selectedNodes, edges: selectedEdges }: { nodes: Node[]; edges: Edge[] }) => {
    
    if (isPathfinding && selectedNodes.length > 0) {
      handleNodeClick(selectedNodes[0].id);
    } else if (selectedNodes.length > 0) {
      setSelectedNode(selectedNodes[0]);
    } else {
      setSelectedNode(null);
    }

    if (selectedEdges.length > 0) {
      setSelectedEdge(selectedEdges[0]);
    } else {
      setSelectedEdge(null);
    }
  },
  [isPathfinding, handleNodeClick, setSelectedNode, setSelectedEdge]
);

const changeSelectedEdgeColor = (newColor: string) => {

    const updatedEdges = edges.map((edge) => {
      if (edge.id === selectedEdge.id) {
        return {
          ...edge,
          data: {
            ...edge.data,
            color: newColor,
          },
        };
      }

      return edge;
    });

    setEdges(updatedEdges);
  };

  const changeSelectedEdgeWeight = (newWeight: number) => {

    const updatedEdges = edges.map((edge) => {
      if (edge.id === selectedEdge.id) {
        return {
          ...edge,
          type: "custom",
          data: {
            ...edge.data,
            weight: newWeight,
            label: newWeight,
          },
        };
      }

      return edge;
    });

    setEdges(updatedEdges);
  };

  const cleargraph = async()=> {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }

    const importAndSave = async() =>{
    await handleCombinedImport();
    handleSave();
  }


  const nodesForFlow = useMemo(() => {
    const nodeMap = new Map(nodeToDisplay.map(n => [n.id, n]));
    highlightedNodes.forEach(hn => nodeMap.set(hn.id, hn));
    return [...axisNodes, ...Array.from(nodeMap.values())];
  }, [nodeToDisplay, highlightedNodes]);

  const edgesForFlow = useMemo(() => {
    const edgeMap = new Map(edgeToDisplay.map(e => [e.id, e]));
    highlightedEdges.forEach(he => edgeMap.set(he.id, he));
    return [...axisEdges, ...Array.from(edgeMap.values())];
  }, [edgeToDisplay, highlightedEdges]);
  return (
    <>
<Menu
        // Graph props
        selectedGraphType={selectedGraphType}
        handleGraphTypeChange={handleGraphTypeChange}
        importAndSave={importAndSave}
        handleExportCsv={handleExportCsv}
        cleargraph={cleargraph}
        isSnapGridDisabled={isSnapGridDisabled}
        setIsSnapGridDisabled={setIsSnapGridDisabled}
        handleSave={handleSave}
        handleUndo={handleUndo}
        handleRedo={handleRedo}
        // Edge props
        selectedEdgeColor={selectedEdgeColor}
        setSelectedEdgeColor={setSelectedEdgeColor}
        changeSelectedEdgeColor={() => changeSelectedEdgeColor(selectedEdgeColor)}
        selectedEdgeWeight={selectedEdgeWeight}
        setSelectedEdgeWeight={setSelectedEdgeWeight}
        isInputDisabled={isInputDisabled}
        setIsInputDisabled={setIsInputDisabled}
        changeSelectedEdgeWeight={() => changeSelectedEdgeWeight(selectedEdgeWeight)}

        // Node props
        addNode={addNode}
        addNrOfNodes={addNrOfNodes}
        nrOfNodes={nrOfNodes}
        setNrOfNodes={setNrOfNodes}
        changeLabel={changeLabel}
        selectedNode={selectedNode}

        // Analyze props
        startPathfinding={startPathfinding}
        selectedNodeSearch={selectedNodeSearch}
        setSelectedNodeSearch={setSelectedNodeSearch}
      />
  

       {shortestPath && (
        <div className="info-box bottom-right">
          {shortestPath.path.length > 0 ? (
            <p>Shortest Path: {shortestPath.distance.toFixed(2)}</p>
          ) : (
            <p style={{ color: '#d92027' }}>No path found</p>
          )}
        </div>
      )}

      {/* FIX: Visar resultat för sökning */}
      {resultSearch && (
        <div className="info-box bottom-left">
          <pre>{resultSearch}</pre>
        </div>
      )}
    <div style={{ width: '100vw', height: '100vh' }}>
        <ReactFlow
        nodes={[...axisNodes, ...nodesForFlow]}
        edges={[...axisEdges, ...edgesForFlow]}
          
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
        defaultViewport={{ x: window.innerWidth / 2, y: window.innerHeight / 2, zoom: 1 }}
        onSelectionChange={onSelectionChange}
        snapToGrid={isSnapGridDisabled}
        snapGrid={[50,50]}  
        onlyRenderVisibleElements={true}
        >
      {nodes.length < 1000 && 
      <MiniMap 
      nodeStrokeWidth={200}
      pannable zoomable
      position='top-right'
      nodeStrokeColor={"#3d0e0eff"}
      nodeBorderRadius={6000}
      nodeColor={"#3d0e0eff"}
      bgColor='#fcfcfc'
      maskColor='#000000ff'
       />}
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