import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import { KGNode, KGEdge, KGNodeWithDegree, Provenance } from './types.js';

export class KnowledgeGraphDB {
  public db: Database.Database;
  private dbPath: string;

  constructor(customPath?: string) {
    this.dbPath = customPath || process.env.ARCHVIEW_DB_PATH || path.join(process.cwd(), 'output', 'archview.db');
    
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS nodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        label TEXT NOT NULL,
        name TEXT NOT NULL,
        qualified_name TEXT UNIQUE,
        properties TEXT DEFAULT '{}',
        provenance TEXT NOT NULL DEFAULT 'EXTRACTED',
        source TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE INDEX IF NOT EXISTS idx_nodes_label ON nodes(label);
      CREATE INDEX IF NOT EXISTS idx_nodes_name ON nodes(name);
      CREATE INDEX IF NOT EXISTS idx_nodes_qualified_name ON nodes(qualified_name);

      CREATE TABLE IF NOT EXISTS edges (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        source_id INTEGER NOT NULL,
        target_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        properties TEXT DEFAULT '{}',
        provenance TEXT NOT NULL DEFAULT 'EXTRACTED',
        weight REAL NOT NULL DEFAULT 1.0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (source_id) REFERENCES nodes(id) ON DELETE CASCADE,
        FOREIGN KEY (target_id) REFERENCES nodes(id) ON DELETE CASCADE,
        UNIQUE(source_id, target_id, type)
      );

      CREATE INDEX IF NOT EXISTS idx_edges_source ON edges(source_id);
      CREATE INDEX IF NOT EXISTS idx_edges_target ON edges(target_id);
      CREATE INDEX IF NOT EXISTS idx_edges_type ON edges(type);

      CREATE TABLE IF NOT EXISTS communities (
        node_id INTEGER NOT NULL,
        community_id INTEGER NOT NULL,
        algorithm TEXT NOT NULL DEFAULT 'manual',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        PRIMARY KEY (node_id, algorithm),
        FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS metadata (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INTEGER,
        label TEXT,
        qualified_name TEXT,
        source TEXT,
        timestamp TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS telemetry_spans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        trace_id TEXT NOT NULL,
        span_id TEXT NOT NULL,
        tool TEXT NOT NULL,
        duration_ms REAL NOT NULL,
        error TEXT,
        timestamp TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE VIRTUAL TABLE IF NOT EXISTS nodes_fts USING fts5(
        name,
        qualified_name,
        properties,
        content='nodes',
        content_rowid='id',
        tokenize='unicode61'
      );

      CREATE TRIGGER IF NOT EXISTS nodes_ai AFTER INSERT ON nodes BEGIN
        INSERT INTO nodes_fts(rowid, name, qualified_name, properties)
        VALUES (new.id, new.name, COALESCE(new.qualified_name, ''), new.properties);
      END;

      CREATE TRIGGER IF NOT EXISTS nodes_ad AFTER DELETE ON nodes BEGIN
        INSERT INTO nodes_fts(nodes_fts, rowid, name, qualified_name, properties)
        VALUES ('delete', old.id, old.name, COALESCE(old.qualified_name, ''), old.properties);
      END;

      CREATE TRIGGER IF NOT EXISTS nodes_au AFTER UPDATE ON nodes BEGIN
        INSERT INTO nodes_fts(nodes_fts, rowid, name, qualified_name, properties)
        VALUES ('delete', old.id, old.name, COALESCE(old.qualified_name, ''), old.properties);
        INSERT INTO nodes_fts(rowid, name, qualified_name, properties)
        VALUES (new.id, new.name, COALESCE(new.qualified_name, ''), new.properties);
      END;
    `);
  }

  public addNode(node: KGNode): KGNode {
    const qName = node.qualified_name || `${node.label.toLowerCase()}:${node.name.toLowerCase().replace(/\s+/g, '-')}`;
    const props = JSON.stringify(node.properties || {});
    const prov = node.provenance || 'EXTRACTED';

    const stmt = this.db.prepare(`
      INSERT INTO nodes (label, name, qualified_name, properties, provenance, source)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const res = stmt.run(node.label, node.name, qName, props, prov, node.source || null);
    const createdId = Number(res.lastInsertRowid);
    
    this.logAudit('node_create', 'node', createdId, node.label, qName, node.source);
    return { ...node, id: createdId, qualified_name: qName };
  }

  public upsertNode(node: KGNode): KGNode {
    const qName = node.qualified_name || `${node.label.toLowerCase()}:${node.name.toLowerCase().replace(/\s+/g, '-')}`;
    const props = JSON.stringify(node.properties || {});
    const prov = node.provenance || 'EXTRACTED';

    const stmt = this.db.prepare(`
      INSERT INTO nodes (label, name, qualified_name, properties, provenance, source)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(qualified_name) DO UPDATE SET
        name = excluded.name,
        properties = excluded.properties,
        provenance = excluded.provenance,
        source = COALESCE(excluded.source, nodes.source),
        updated_at = datetime('now')
    `);

    const res = stmt.run(node.label, node.name, qName, props, prov, node.source || null);
    const id = res.lastInsertRowid ? Number(res.lastInsertRowid) : (this.getNodeByQualifiedName(qName)?.id || 0);

    this.logAudit('node_upsert', 'node', id, node.label, qName, node.source);
    return { ...node, id, qualified_name: qName };
  }

  public addNodesBatch(nodes: KGNode[]): KGNode[] {
    const insertTx = this.db.transaction((items: KGNode[]) => {
      return items.map(n => this.upsertNode(n));
    });
    return insertTx(nodes);
  }

  public addEdge(edge: KGEdge): KGEdge {
    const props = JSON.stringify(edge.properties || {});
    const prov = edge.provenance || 'EXTRACTED';
    const weight = edge.weight ?? 1.0;

    const stmt = this.db.prepare(`
      INSERT INTO edges (source_id, target_id, type, properties, provenance, weight)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(source_id, target_id, type) DO UPDATE SET
        weight = excluded.weight,
        properties = excluded.properties,
        provenance = excluded.provenance
    `);

    const res = stmt.run(edge.source_id, edge.target_id, edge.type, props, prov, weight);
    const id = Number(res.lastInsertRowid);

    this.logAudit('edge_create', 'edge', id, edge.type, `${edge.source_id}->${edge.target_id}`, 'mcp');
    return { ...edge, id };
  }

  public addEdgesBatch(edges: KGEdge[]): KGEdge[] {
    const insertTx = this.db.transaction((items: KGEdge[]) => {
      return items.map(e => this.addEdge(e));
    });
    return insertTx(edges);
  }

  public deleteNode(idOrQualifiedName: string | number): boolean {
    const isNum = typeof idOrQualifiedName === 'number';
    const stmt = isNum
      ? this.db.prepare('DELETE FROM nodes WHERE id = ?')
      : this.db.prepare('DELETE FROM nodes WHERE qualified_name = ?');

    const res = stmt.run(idOrQualifiedName);
    const deleted = res.changes > 0;
    if (deleted) {
      this.logAudit('node_delete', 'node', isNum ? idOrQualifiedName : undefined, undefined, String(idOrQualifiedName), 'mcp');
    }
    return deleted;
  }

  public getNode(idOrQualifiedName: string | number): KGNode | null {
    if (typeof idOrQualifiedName === 'number') {
      const row = this.db.prepare('SELECT * FROM nodes WHERE id = ?').get(idOrQualifiedName) as any;
      return this.formatNodeRow(row);
    }
    return this.getNodeByQualifiedName(idOrQualifiedName);
  }

  public getNodeByQualifiedName(qName: string): KGNode | null {
    const row = this.db.prepare('SELECT * FROM nodes WHERE qualified_name = ?').get(qName) as any;
    return this.formatNodeRow(row);
  }

  private formatNodeRow(row: any): KGNode | null {
    if (!row) return null;
    return {
      id: row.id,
      label: row.label,
      name: row.name,
      qualified_name: row.qualified_name,
      properties: JSON.parse(row.properties || '{}'),
      provenance: row.provenance as Provenance,
      source: row.source,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  public searchGraph(queryText: string, labelFilter?: string, limit = 25): KGNode[] {
    let rows: any[] = [];
    if (queryText.trim().length > 0) {
      try {
        const ftsQuery = queryText.replace(/[^a-zA-Z0-9_\u00C0-\u00FF]/g, ' ').trim();
        if (ftsQuery) {
          const sql = labelFilter
            ? 'SELECT n.* FROM nodes n JOIN nodes_fts f ON n.id = f.rowid WHERE nodes_fts MATCH ? AND n.label = ? LIMIT ?'
            : 'SELECT n.* FROM nodes n JOIN nodes_fts f ON n.id = f.rowid WHERE nodes_fts MATCH ? LIMIT ?';
          rows = labelFilter ? this.db.prepare(sql).all(ftsQuery + '*', labelFilter, limit) : this.db.prepare(sql).all(ftsQuery + '*', limit);
        }
      } catch {
        // Fallback to LIKE
        const pattern = `%${queryText}%`;
        const sql = labelFilter
          ? 'SELECT * FROM nodes WHERE (name LIKE ? OR qualified_name LIKE ?) AND label = ? LIMIT ?'
          : 'SELECT * FROM nodes WHERE (name LIKE ? OR qualified_name LIKE ?) LIMIT ?';
        rows = labelFilter ? this.db.prepare(sql).all(pattern, pattern, labelFilter, limit) : this.db.prepare(sql).all(pattern, pattern, limit);
      }
    } else {
      const sql = labelFilter ? 'SELECT * FROM nodes WHERE label = ? LIMIT ?' : 'SELECT * FROM nodes LIMIT ?';
      rows = labelFilter ? this.db.prepare(sql).all(labelFilter, limit) : this.db.prepare(sql).all(limit);
    }

    return rows.map(r => this.formatNodeRow(r)!);
  }

  public getAllNodes(labelFilter?: string): KGNode[] {
    const sql = labelFilter ? 'SELECT * FROM nodes WHERE label = ?' : 'SELECT * FROM nodes';
    const rows = labelFilter ? this.db.prepare(sql).all(labelFilter) : this.db.prepare(sql).all();
    return rows.map(r => this.formatNodeRow(r)!);
  }

  public getAllEdges(typeFilter?: string): KGEdge[] {
    const sql = typeFilter ? 'SELECT * FROM edges WHERE type = ?' : 'SELECT * FROM edges';
    const rows = (typeFilter ? this.db.prepare(sql).all(typeFilter) : this.db.prepare(sql).all()) as any[];
    return rows.map(r => ({
      id: r.id,
      source_id: r.source_id,
      target_id: r.target_id,
      type: r.type,
      properties: JSON.parse(r.properties || '{}'),
      provenance: r.provenance,
      weight: r.weight,
      created_at: r.created_at
    }));
  }

  public setCommunity(nodeId: number, communityId: number, algorithm = 'louvain'): void {
    const stmt = this.db.prepare(`
      INSERT INTO communities (node_id, community_id, algorithm)
      VALUES (?, ?, ?)
      ON CONFLICT(node_id, algorithm) DO UPDATE SET
        community_id = excluded.community_id,
        created_at = datetime('now')
    `);
    stmt.run(nodeId, communityId, algorithm);
  }

  public getCommunities(algorithm = 'louvain'): Record<number, number> {
    const rows = this.db.prepare('SELECT node_id, community_id FROM communities WHERE algorithm = ?').all(algorithm) as any[];
    const result: Record<number, number> = {};
    for (const r of rows) {
      result[r.node_id] = r.community_id;
    }
    return result;
  }

  public logAudit(event: string, entityType: string, entityId?: number, label?: string, qualifiedName?: string, source?: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO audit_log (event, entity_type, entity_id, label, qualified_name, source)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(event, entityType, entityId ?? null, label ?? null, qualifiedName ?? null, source ?? 'system');
  }

  public recordTelemetry(traceId: string, spanId: string, tool: string, durationMs: number, error?: string): void {
    const stmt = this.db.prepare(`
      INSERT INTO telemetry_spans (trace_id, span_id, tool, duration_ms, error)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(traceId, spanId, tool, durationMs, error ?? null);
  }

  public healthCheck(): { status: string; node_count: number; edge_count: number; database_size_bytes: number } {
    const nodeCount = (this.db.prepare('SELECT COUNT(*) as count FROM nodes').get() as any).count;
    const edgeCount = (this.db.prepare('SELECT COUNT(*) as count FROM edges').get() as any).count;
    const stats = fs.statSync(this.dbPath);
    return {
      status: 'healthy',
      node_count: nodeCount,
      edge_count: edgeCount,
      database_size_bytes: stats.size
    };
  }

  public close(): void {
    this.db.close();
  }
}
