export type DiagramType = 'mindmap' | 'orgchart' | 'architecture' | 'flowchart';

export interface DiagramFiles {
  mermaid: string;
  meta: string;
  html?: string | null;
  svg?: string | null;
  png?: string | null;
}

export interface DiagramPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}

export interface DiagramStats {
  node_count: number;
  max_depth?: number;
  generation_time_ms: number;
}

export interface DiagramMeta {
  schema_version: string;
  id: string;
  type: DiagramType;
  subtype?: string;
  title: string;
  description?: string;
  source: string;
  created_at: string;
  updated_at: string;
  files: DiagramFiles;
  style: {
    suggested_theme: 'educational' | 'corporate' | 'minimal' | 'dark';
    applied_theme?: string | null;
    palette?: Partial<DiagramPalette>;
  };
  stats: DiagramStats;
  tags?: string[];
}

export interface ToolExecutionResult {
  file_path: string;
  meta_path: string;
  html_path?: string;
  format: string;
  markdown: string;
  meta: DiagramMeta;
}

export interface McpErrorPayload {
  code: 'VALIDATION_ERROR' | 'PATH_TRAVERSAL' | 'MERMAID_ERROR' | 'EXPORT_ERROR' | 'INTERNAL_ERROR';
  message: string;
  suggestion?: string;
}
