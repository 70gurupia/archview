import { z } from 'zod';
// Guardrail constants
const MAX_NODES = 50;
const MAX_DEPTH = 5;
// ---- SCHEMAS ----
export const MindmapBranchSchema = z.lazy(() => z.object({
    title: z.string().min(1).max(100),
    icons: z.array(z.string()).max(3).optional(),
    sub_branches: z.array(z.union([z.string().min(1).max(100), MindmapBranchSchema])).max(20).optional()
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
    output_path: z.string().optional()
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
    output_path: z.string().optional()
});
export const ArchitectureElementSchema = z.object({
    id: z.string().min(1).max(50),
    type: z.enum(["person", "system", "container", "component", "database", "queue", "external"]),
    name: z.string().min(1).max(100),
    description: z.string().min(1).max(255),
    technology: z.string().max(100).optional(),
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
        show_technology: z.boolean().optional(),
        palette: z.enum(['educational', 'corporate', 'minimal', 'dark']).optional()
    }).optional(),
    output_path: z.string().optional()
});
export const FlowchartStepSchema = z.object({
    id: z.string().min(1).max(50),
    type: z.enum(["start", "end", "process", "decision", "input", "output", "subprocess"]),
    label: z.string().min(1).max(100),
    next: z.array(z.union([
        z.string().min(1).max(50),
        z.object({
            id: z.string().min(1).max(50),
            label: z.string().max(100).optional()
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
    output_path: z.string().optional()
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
// ---- GUARDRAILS ----
export function validateMindmapGuardrails(branches) {
    let nodeCount = 1; // 1 for central topic
    let maxDepth = 0;
    function traverse(b, depth) {
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
                }
                else if (typeof sub === 'object' && sub !== null) {
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
