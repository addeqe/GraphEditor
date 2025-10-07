import { Node, Edge } from '@xyflow/react';

// Definiera konstanter för layouten. Dessa kan justeras.
const RADIUS = 400; // Cirkelns radie i pixlar
const CENTER_X = 600; // Cirkelns mittpunkt på X-axeln
const CENTER_Y = 300; // Cirkelns mittpunkt på Y-axeln

export const useCircularLayout = () => {
  const runLayout = (nodes: Node[], edges: Edge[]): Node[] => {
    // Om det inte finns några noder, returnera en tom array.
    if (nodes.length === 0) {
      return [];
    }

    const nodeCount = nodes.length;

    // Mappa över noderna för att skapa en ny array med uppdaterade positioner.
    const newNodes = nodes.map((node, index) => {
      // Beräkna vinkeln för varje nod för att fördela dem jämnt runt cirkeln.
      const angle = (index / nodeCount) * 2 * Math.PI;

      // Beräkna nodens nya X- och Y-koordinater med hjälp av trigonometri.
      const x = CENTER_X + RADIUS * Math.cos(angle);
      const y = CENTER_Y + RADIUS * Math.sin(angle);

      // Returnera en kopia av noden med den nya positionen.
      return {
        ...node,
        position: { x, y },
      };
    });

    return newNodes;
  };

  // Returnera funktionen så att den kan användas från komponenten.
  return { runLayout };
};