import { useEffect, useRef } from 'react'; //I used this video to understand the API and the code that made this work https://www.youtube.com/watch?v=y2-sgZh49dQ
import { forceSimulation, forceLink, forceManyBody, forceCenter } from 'https://esm.sh/d3-force@3'; //I also used this guide https://observablehq.com/@d3/disjoint-force-directed-graph/2

export const useForceLayout = (onNodesChange) => {
  const simulationRef = useRef();

  useEffect(() => {
    const simulation = forceSimulation()
      .force('link', forceLink().id(d => d.id).distance(150))
      .force('charge', forceManyBody().strength(-500))
      .force('center', forceCenter())
      .alphaDecay(0.01)
      .on('tick', () => {
        const changes = simulation.nodes().map(node => ({
          id: node.id,
          type: 'position',
          position: { x: node.x, y: node.y },
        }));
        if (onNodesChange) {
          onNodesChange(changes);
        }
      });

    simulation.stop();
    simulationRef.current = simulation;

    return () => {
      simulation.stop();
    };
  }, [onNodesChange]);

  const runLayout = (nodes, edges) => {
    return new Promise((resolve) => {
      if (simulationRef.current) {
        simulationRef.current.on('end', () => {
          const finalSimulationNodes = simulationRef.current.nodes();


          const finalNodesWithData = nodes.map(originalNode => {
            const correspondingSimNode = finalSimulationNodes.find(simNode => simNode.id === originalNode.id);
            
            if (!correspondingSimNode) return originalNode;

            return {
              ...originalNode,
              position: {
                x: correspondingSimNode.x,
                y: correspondingSimNode.y
              }
            };
          });

          resolve(finalNodesWithData);
        });

        simulationRef.current.nodes(nodes);
        simulationRef.current.force('link').links(edges);
        simulationRef.current.force('center', forceCenter(window.innerWidth / 2, window.innerHeight / 2));
        simulationRef.current.alpha(1).restart();
      } else {
        resolve(nodes);
      }
    });
  };

  return { runLayout };
};