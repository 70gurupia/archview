import { z } from 'zod';

// Guardrail constants
const MAX_NODES = 50;
const MAX_DEPTH = 5;

// ---- SCHEMAS ----

export const MindmapBranchSchema: z.ZodType<any> = z.lazy(() => z.object({
  title: z.string().min(1).max(100),
  icons: z.array(z.string()).max(3).optional(),
  sub_branches: z.array(
    z.union([z.string().min(1).max(100), MindmapBranchSchema])
  ).max(20).optional()
}));

export const MindmapInputSchema = z.object({
  central_topic: z.string().min(1).max(100),
  branches: z.array(MindmapBranchSchema).min(1).max(20),
  style: z.object({
    theme: z.enum(['default', 'forest', 'dark', 'neutral']).optional(),
    palette: z.enum(['educational', 'corporate', 'minimal', 'dark']).optional(),
    layout: z.enum(['radial', 'tree-left', 'tree-right']).optional(),
    show_icons: z.boolean().optional()
  }).optional(),
  output_path: z.string().optional(),
  target_dir: z.string().optional()
});

export const OrgchartNodeSchema = z.object({
  id: z.string().min(1).max(50),
  label: z.string().min(1).max(100),
  role: z.string().min(1).max(100),
  department: z.string().max(100).optional(),
  level: z.number().min(0).max(10).optional(),
  reports_to: z.string().max(50).optional(),
  metadata: z.object({
    email: z.string().email().optional(),
    team_size: z.number().min(0).optional()
  }).optional()
});

export const OrgchartInputSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(255).optional(),
  nodes: z.array(OrgchartNodeSchema).min(1).max(MAX_NODES),
  style: z.object({
    color_by_level: z.boolean().optional(),
    show_metadata: z.boolean().optional(),
    layout: z.enum(['vertical', 'horizontal']).optional(),
    palette: z.enum(['educational', 'corporate', 'minimal', 'dark']).optional()
  }).optional(),
  output_path: z.string().optional(),
  target_dir: z.string().optional()
});

export const ArchitectureElementSchema = z.object({
  id: z.string().min(1).max(50),
  type: z.enum(["person", "system", "container", "component", "database", "queue", "external"]),
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(255),
  technology: z.string().max(100).optional(),
  group: z.string().max(100).optional(),
  relationships: z.array(z.object({
    target: z.string().min(1).max(50),
    description: z.string().min(1).max(100),
    technology: z.string().max(100).optional()
  })).max(20).optional()
});

export const ArchitectureInputSchema = z.object({
  c4_level: z.enum(["C1-context", "C2-container", "C3-component", "C4-code"]),
  system_name: z.string().min(1).max(100),
  description: z.string().max(255).optional(),
  elements: z.array(ArchitectureElementSchema).min(1).max(MAX_NODES),
  style: z.object({
    notation: z.enum(['c4', 'flowchart']).optional(),
    show_technology: z.boolean().optional(),
    direction: z.enum(['TB', 'LR', 'BT', 'RL']).optional(),
    palette: z.enum(['educational', 'corporate', 'minimal', 'dark']).optional()
  }).optional(),
  output_path: z.string().optional(),
  target_dir: z.string().optional()
});

export const FlowchartStepSchema = z.object({
  id: z.string().min(1).max(50),
  type: z.enum(["start", "end", "process", "decision", "input", "output", "subprocess", "database", "queue", "document"]),
  label: z.string().min(1).max(100),
  group: z.string().max(100).optional(),
  next: z.array(z.union([
    z.string().min(1).max(50),
    z.object({
      id: z.string().min(1).max(50),
      label: z.string().max(100).optional(),
      style: z.enum(['solid', 'dashed', 'dotted', 'thick']).optional()
    })
  ])).max(10).optional(),
  details: z.string().max(255).optional()
});

export const FlowchartInputSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(255).optional(),
  steps: z.array(FlowchartStepSchema).min(1).max(MAX_NODES),
  style: z.object({
    direction: z.enum(["TB", "LR", "BT", "RL"]).optional(),
    palette: z.enum(['educational', 'corporate', 'minimal', 'dark']).optional()
  }).optional(),
  output_path: z.string().optional(),
  target_dir: z.string().optional()
});

export const ExportInputSchema = z.object({
  source_path: z.string().min(1),
  target_format: z.enum(["svg", "png", "pdf"]),
  target_path: z.string().optional(),
  options: z.object({
    width: z.number().min(100).max(4000).optional(),
    height: z.number().min(100).max(4000).optional(),
    scale: z.number().min(1).max(4).optional(),
    background: z.string().optional(),
    theme: z.string().optional()
  }).optional()
});

export const ScanTopologyInputSchema = z.object({
  path: z.string().optional(),
  title: z.string().max(100).optional(),
  description: z.string().max(255).optional(),
  view_mode: z.enum(['hybrid', 'layered', 'folders']).optional(),
  direction: z.enum(['TD', 'LR', 'BT', 'RL']).optional(),
  max_depth: z.number().min(1).max(10).optional(),
  output_path: z.string().optional()
});

export const TraceCallGraphInputSchema = z.object({
  path: z.string().optional(),
  symbol_name: z.string().min(1).max(100),
  file_path: z.string().optional(),
  depth: z.number().min(1).max(5).optional(),
  direction: z.enum(['LR', 'TD', 'RL', 'BT']).optional(),
  title: z.string().max(100).optional(),
  description: z.string().max(255).optional(),
  output_path: z.string().optional()
});

export const TraceExecutionInputSchema = z.object({
  title: z.string().max(100).optional(),
  description: z.string().max(255).optional(),
  trace_data: z.any().optional(),
  raw_log: z.string().optional(),
  log_file_path: z.string().optional(),
  output_path: z.string().optional(),
  target_dir: z.string().optional()
});

export const AnalyzeOverviewInputSchema = z.object({
  path: z.string().optional(),
  title: z.string().max(100).optional(),
  description: z.string().max(255).optional(),
  output_path: z.string().optional()
});

export const ObservabilityInputSchema = z.object({
  include_prometheus_raw: z.boolean().optional(),
  generate_chart: z.enum(['xychart', 'quadrant', 'none']).optional(),
  output_path: z.string().optional(),
  target_dir: z.string().optional()
});

export const ExportHtmlInputSchema = z.object({
  diagram_id: z.string().optional(),
  mode: z.enum(['single', 'dashboard']).optional(),
  theme: z.enum(['educational', 'corporate', 'minimal', 'dark']).optional(),
  output_path: z.string().optional(),
  target_dir: z.string().optional()
});



// ---- GUARDRAILS ----

export function validateMindmapGuardrails(branches: any[]) {
  let nodeCount = 1; // 1 for central topic
  let maxDepth = 0;

  function traverse(b: any, depth: number) {
    if (depth > MAX_DEPTH) {
      throw new Error(`Máximo ${MAX_DEPTH} níveis de profundidade permitidos.`);
    }
    maxDepth = Math.max(maxDepth, depth);
    nodeCount++;

    if (nodeCount > MAX_NODES) {
      throw new Error(`Máximo ${MAX_NODES} nós permitidos no MVP.`);
    }

    if (Array.isArray(b.sub_branches)) {
      for (const sub of b.sub_branches) {
        if (typeof sub === 'string') {
          nodeCount++;
          if (nodeCount > MAX_NODES) {
             throw new Error(`Máximo ${MAX_NODES} nós permitidos no MVP.`);
          }
          maxDepth = Math.max(maxDepth, depth + 1);
        } else if (typeof sub === 'object' && sub !== null) {
          traverse(sub, depth + 1);
        }
      }
    }
  }

  for (const b of branches) {
    traverse(b, 1);
  }

  return { nodeCount, maxDepth };
}
