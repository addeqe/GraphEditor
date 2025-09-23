import { version } from 'react';
import { getSession } from './neo4jDriver';
import { Edge, Node } from '@xyflow/react';



export const createNewVersion = async () => {
  const session = getSession();

  const versionId = crypto.randomUUID();
  const timestamp = new Date().toISOString(); //rekomenderat av neo4j själva men vet inte vad detta innebär

  try {
    await session.run(
      "CREATE (v:Version {versionId: $versionId, timestamp: $timestamp})",
      { versionId, timestamp }
    );
    return versionId;
  } finally {
    await session.close();
  }
}

export const saveNodes = async (nodes: Node[], versionId) => {
  const session = getSession();
  try {
    for (const node of nodes) {
      const nodeType = node.type || "default"
      if (!node.versionId)
      { node.versionId = versionId };
        await session.run(
        `
        MERGE (n:Node {id: $id})
        SET n.label = $label, n.x = $x, n.y = $y, n.type = $type
        WITH n
        MERGE (v:Version {versionId: $versionId})
        CREATE (n)-[:PART_OF_VERSION]->(v)`,
        {
          id: node.id,
          label: node.data.label,
          x: node.position.x,
          y: node.position.y,
          type: nodeType,
          versionId: versionId
        }
      );
    }
  } finally {
    await session.close();
  }
};

export const saveEdges = async (edges: Edge[], versionId) => {
  const session = getSession();
  try {
    for (const edge of edges) {
      const markerEnd = edge.markerEnd?.type || "default"
      const edgeColor = edge.data?.color || null;
      const edgeWeight = edge.data?.weight || 0;
      if (!edge.versionId)
      { edge.versionId = versionId };
      await session.run(
        `
        MATCH (a:Node {id: $source}), (b:Node {id: $target})
        MERGE (a)-[r:CONNECTED]->(b)
        SET r.id = $id, r.type = $type, r.markerEndType = $markerEndType, r.color = $color, r.weight = $weight, r.versionId = $versionId`,
        {
          id: edge.id,
          source: edge.source,
          target: edge.target,
          type: edge.type,
          markerEndType: markerEnd,
          color: edgeColor,
          weight: edgeWeight,
          versionId:edge.versionId
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

/* gammal version ska raderas senare
export const loadFlowFromDB = async (): Promise<{ nodes: Node[], edges: Edge[] }> => {
  const session = getSession();
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  try {
    const result = await session.run(`
      MATCH (v:Version)
      WITH v ORDER BY v.timestamp DESC LIMIT 1
      MATCH (n:Node)
      WHERE (n)-[:PART_OF_VERSION]->(v)
      OPTIONAL MATCH (n)-[r:CONNECTED]->(m)
      WHERE r.versionId = v.versionId
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
    const edgeColor = r.color;
    const edgeWeight = r.weight;

    edges.push({  
      id: r.id || `${n.id}-${m.id}`,
      source: n.id,
      target: m.id,
      type: r.type,
      markerEnd: markerEnd,
      data: {
        color: edgeColor,
        weight: edgeWeight,
        label: edgeWeight
      }
    });
  }
    });

    return { nodes, edges };

  } finally {
    await session.close();
  }
};*/

export const loadVersionFromDB = async (versionId) => {
  const session = getSession();
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  try {
    const result = await session.run(`
      MATCH (n:Node)-[:PART_OF_VERSION]->(:Version {versionId: $versionId})
      WITH COLLECT(n) AS versionNodes
      UNWIND versionNodes AS n
      OPTIONAL MATCH (n)-[r:CONNECTED]->(m)
      WHERE m IN versionNodes
      
      RETURN n, r, m
    `, { versionId });


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
        const markerEnd = markerEndType ? { type: markerEndType } : undefined;
        const edgeColor = r.color;
        const edgeWeight = r.weight;
        const edgeLabel = r.label;

        edges.push({  
          id: r.id || `${n.id}-${m.id}`,
          source: n.id,
          target: m.id,
          type: r.type,
          markerEnd: markerEnd,
          data: {
            color: edgeColor,
            weight: edgeWeight,
            label: edgeLabel
          }
        });
      }
    });
    return { nodes, edges };

  } finally {
    await session.close();
  }
};

export const getAllVersions = async () => {
  const session = getSession();
  try {
    const result = await session.run('MATCH (v:Version) RETURN v ORDER BY v.timestamp DESC');
    return result.records.map(record => record.get('v').properties);
  } finally {
    await session.close();
  }
};

export const assignVersionToAllInDB = async (versionId) => {
  const session = getSession();
  try {
    await session.run(`
      MATCH (n:Node)
      WHERE NOT (n)-[:PART_OF_VERSION]->(:Version)
      WITH n
      MERGE (v:Version {versionId: $versionId})
      CREATE (n)-[:PART_OF_VERSION]->(v)
    `, { versionId });

    await session.run(`
      MATCH ()-[r:CONNECTED]-()
      WHERE r.versionId IS NULL
      SET r.versionId = $versionId
    `, { versionId });

  } finally {
    await session.close();
  }
};