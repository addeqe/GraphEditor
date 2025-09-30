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

export const saveEdges = async (edges: Edge[], versionId, relationshipType) => {
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
        MERGE (a)-[r:${relationshipType}]->(b)
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

export const loadVersionFromDB = async (versionId) => {
  const session = getSession();
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  try {
    const result = await session.run(`
      MATCH (n:Node)-[:PART_OF_VERSION]->(:Version {versionId: $versionId})
      WITH COLLECT(n) AS versionNodes
      UNWIND versionNodes AS n
      OPTIONAL MATCH (n)-[r:CONNECTED|HAS_CHILD]->(m)
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
        const edgeLabel = r.weight;

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
      MATCH ()-[r:CONNECTED|HAS_CHILD]-()
      WHERE r.versionId IS NULL
      SET r.versionId = $versionId
    `, { versionId });

  } finally {
    await session.close();
  }
};

export const saveNewVersion = async (nodes, edges, relationshipType) => {
  const versionId = await createNewVersion();
  await saveNodes(nodes, versionId);
  await saveEdges(edges, versionId, relationshipType);
  await assignVersionToAllInDB(versionId);

  console.log("Data saved on version, relationshipType:", versionId, relationshipType);
  
  return versionId;
};
export const importCombinedGraphFromData = async (data) => {
  const session = getSession();
  try {
    await session.run(`
        UNWIND $data AS row
        WITH row
        WHERE row.label IS NOT NULL AND row.label <> ""
        MERGE (n:Node {id: row.id})
        SET
          n.label = row.label,
          n.x = coalesce(toFloat(row.x), '0'),
          n.y = coalesce(toFloat(row.y), '0'),
          n.type = coalesce(row.nodeType, 'default')
      `, { data });

    await session.run(`
      UNWIND $data AS row
      WITH row
      WHERE row.source IS NOT NULL AND row.source <> ""
      MATCH (sourceNode:Node {id: row.source})
      MATCH (targetNode:Node {id: row.target})
      MERGE (sourceNode)-[r:CONNECTED {id: row.id}]->(targetNode)
      SET
        r.type = coalesce(row.edgeType, 'custom'),
        r.markerEnd = coalesce(row.markerEnd, 'arrow'),
        r.color = coalesce(row.color, 'default'),
        r.weight = toFloat(coalesce(row.weight, 0))
    `, { data });

    console.log("imported sucessful");
    
  } finally {
    await session.close();
  }
};


export const exportGraph =  async () => {
  const session = getSession();
  try {
      const result = await session.run(
      `
      MATCH (n)
      WHERE n.id IS NOT NULL
      RETURN
          n.id AS id,
          n.label AS label,
          n.x AS x,
          n.y AS y,
          "" AS source,
          "" AS target,
          "" AS nodeType,
          "" AS edgeType,
          "" AS markerEnd,
          "" AS color,
          "" AS weight

      UNION ALL

      MATCH (source)-[r:CONNECTED|HAS_CHILD]->(target)
      RETURN
          edge.id AS id,
          "" AS label,
          "" AS x,
          "" AS y,
          source.id AS source,
          target.id AS target,
          "" AS nodeType,
          edge.type AS edgeType,
          edge.markerEnd AS markerEnd,
          edge.color AS color,
          edge.weight AS weight`,
          {
        }
    );
    const data = result.records.map(record => record.toObject());
    return data;
    }
 finally {
    await session.close();
  }
};