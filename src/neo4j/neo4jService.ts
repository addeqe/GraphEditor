import { getSession } from './neo4jDriver';
import { Edge, Node } from '@xyflow/react';

export const saveNodes = async (nodes: Node[]) => {
  const session = getSession();
  try {
    for (const node of nodes) {
        await session.run(
        `
        MERGE (n:Node {id: $id})
         SET n.label = $label, n.x = $x, n.y = $y, n.type = $type`,
        {
          id: node.id,
          label: node.data.label,
          x: node.position.x,
          y: node.position.y,
          type: node.type
        }
      );
    }
  } finally {
    await session.close();
  }
};

export const saveEdges = async (edges) => {
  const session = getSession();
  try {
    for (const edge of edges) {
      await session.run(
        `
        MATCH (a:Node {id: $source}), (b:Node {id: $target})
        MERGE (a)-[r:CONNECTED]->(b)
        ON CREATE SET r.id = $id, r.type = $type, r.markerEndType = $markerEndType`,
        {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type,
          markerEndType: edge.markerEnd?.type
        }
      );
    }
  } finally {
    await session.close();
  }
};


export const deleteNodes =  async (nodesToDelete: Node[]) => {
  const session = getSession();
  try {
    for (const nodeToDelete of nodesToDelete) {
      await session.run(
        `
        MATCH (n:Node {id: $id})
         DETACH DELETE n;`,
          {
          id: nodeToDelete.id,
        }
      );
    }
  } finally {
    await session.close();
  }
};


export const deleteEdges = async (edgesToDelete: Edge[]) => {
  const session = getSession();
  try {
    for (const edgeToDelete of edgesToDelete) {
      await session.run(
        `
        MATCH ()-[e]-()
        WHERE e.id = $id
        DELETE e;`,
          {
          id: edgeToDelete.id,
        }
      );
    }
  } finally {
    await session.close();
  }
};


export const loadFlowFromDB = async (): Promise<{ nodes: Node[], edges: Edge[] }> => {
  const session = getSession();
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  try {
    const result = await session.run(`
      MATCH (n:Node)
      OPTIONAL MATCH (n)-[r:CONNECTED]->(m)
      RETURN n, r, m
    `);

    result.records.forEach(record => {
      const n = record.get('n').properties;
      const m = record.get('m')?.properties;
      const r = record.get('r')?.properties;

      if (!nodes.find(node => node.id === n.id)) {
        nodes.push({
          id: String(n.id),
          position: { x: n.x, y: n.y },
          data: { label: n.label },
          type: n.type
        });
      }

      if (m && !nodes.find(node => node.id === m.id)) {
        nodes.push({
          id: String(m.id),
          position: { x: m.x, y: m.y },
          data: { label: m.label },
          type: m.type
        });
      }

if (r) {
    const markerEndType = r.markerEndType;
    const markerEnd = markerEndType ? { type: markerEndType } : undefined;//ingen aning varför man måste göra såhär, men det var en lösning som funkade

    edges.push({  
      id: r.id || `${n.id}-${m.id}`,
      source: n.id,
      target: m.id,
      type: r.type,
      markerEnd: markerEnd
    });
  }
    });

    return { nodes, edges };

  } finally {
    await session.close();
  }
};
