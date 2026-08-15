import { saveDiagramWithMeta } from '../utils/meta.js';
export function generateMindmapMermaid(input) {
    let mermaid = `mindmap\n`;
    mermaid += `  root(("${input.central_topic}"))\n`;
    let totalNodes = 1;
    let maxBranchDepth = 1;
    const processBranch = (branch, depth) => {
        totalNodes++;
        if (depth > maxBranchDepth)
            maxBranchDepth = depth;
        const indent = '  '.repeat(depth + 1);
        if (typeof branch === 'string') {
            const sanitized = branch.replace(/"/g, "'");
            mermaid += `${indent}["${sanitized}"]\n`;
        }
        else {
            let nodeText = branch.title.replace(/"/g, "'");
            if (input.style?.show_icons !== false && branch.icons && branch.icons.length > 0) {
                nodeText = `${branch.icons.join(' ')} ${nodeText}`;
            }
            mermaid += `${indent}("${nodeText}")\n`;
            if (branch.sub_branches && branch.sub_branches.length > 0) {
                branch.sub_branches.forEach(sub => processBranch(sub, depth + 1));
            }
        }
    };
    input.branches.forEach(branch => processBranch(branch, 1));
    return { syntax: mermaid, nodeCount: totalNodes, maxDepth: maxBranchDepth };
}
export function executeMindmap(input) {
    const startTime = Date.now();
    if (!input.central_topic || !input.branches || input.branches.length === 0) {
        throw new Error('Validação: "central_topic" e ao menos um ramo em "branches" são obrigatórios.');
    }
    const { syntax, nodeCount, maxDepth } = generateMindmapMermaid(input);
    return saveDiagramWithMeta({
        type: 'mindmap',
        title: input.central_topic,
        description: input.description,
        mermaidSyntax: syntax,
        suggestedTheme: input.style?.palette || 'educational',
        nodeCount,
        maxDepth,
        startTime,
        tags: ['mapa-mental', 'educacional', 'resumo'],
        outputPath: input.output_path
    });
}
