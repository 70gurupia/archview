import { saveDiagramWithMeta, getSemanticIcon, getDesignSystemClassDefs, getNodeClass } from '../utils/meta.js';
export function generateFlowchartMermaid(input) {
    // Direcionamento inteligente: se não especificado, fluxos com decisões usam TD e pipelines sequenciais usam LR widescreen
    const hasDecisions = input.steps.some(s => s.type === 'decision' || (s.next && s.next.length > 1));
    const direction = input.style?.direction || (hasDecisions ? 'TD' : 'LR');
    let mermaid = `flowchart ${direction}\n`;
    // Group steps by subgraph if group is provided
    const groups = {};
    const ungrouped = [];
    input.steps.forEach(step => {
        if (step.group) {
            if (!groups[step.group])
                groups[step.group] = [];
            groups[step.group].push(step);
        }
        else {
            ungrouped.push(step);
        }
    });
    const renderStep = (step) => {
        let shapeOpen = '[';
        let shapeClose = ']';
        const icon = getSemanticIcon(step.type, step.label);
        switch (step.type) {
            case 'start':
            case 'end':
                shapeOpen = '([';
                shapeClose = '])';
                break;
            case 'decision':
                shapeOpen = '{';
                shapeClose = '}';
                break;
            case 'database':
                shapeOpen = '[(';
                shapeClose = ')]';
                break;
            case 'queue':
            case 'subprocess':
                shapeOpen = '[[';
                shapeClose = ']]';
                break;
            case 'document':
                shapeOpen = '[\\';
                shapeClose = '\\]';
                break;
            case 'input':
            case 'output':
                shapeOpen = '([/';
                shapeClose = '/])';
                break;
            default:
                shapeOpen = '[';
                shapeClose = ']';
                break;
        }
        return `    ${step.id}${shapeOpen}"${icon}${step.label}"${shapeClose}\n`;
    };
    let groupIdx = 0;
    Object.entries(groups).forEach(([groupName, steps]) => {
        groupIdx++;
        mermaid += `  subgraph sg_${groupIdx}[" ${groupName} "]\n`;
        steps.forEach(step => {
            mermaid += renderStep(step);
        });
        mermaid += `  end\n\n`;
    });
    ungrouped.forEach(step => {
        mermaid += renderStep(step).replace(/^    /, '  ');
    });
    // Define edges with semantic connection styles
    input.steps.forEach(step => {
        if (step.next) {
            step.next.forEach(n => {
                if (typeof n === 'string') {
                    const targetStep = input.steps.find(s => s.id === n);
                    const isAsync = targetStep?.type === 'queue' || targetStep?.type === 'subprocess';
                    if (isAsync) {
                        mermaid += `  ${step.id} -.-> ${n}\n`;
                    }
                    else {
                        mermaid += `  ${step.id} --> ${n}\n`;
                    }
                }
                else if (n && n.id) {
                    const targetStep = input.steps.find(s => s.id === n.id);
                    const isAsync = n.style === 'dashed' || (!n.style && (targetStep?.type === 'queue' || targetStep?.type === 'subprocess'));
                    const labelStr = n.label ? `"${n.label}"` : '';
                    if (isAsync) {
                        mermaid += labelStr ? `  ${step.id} -. ${labelStr} .-> ${n.id}\n` : `  ${step.id} -.-> ${n.id}\n`;
                    }
                    else {
                        mermaid += labelStr ? `  ${step.id} -- ${labelStr} --> ${n.id}\n` : `  ${step.id} --> ${n.id}\n`;
                    }
                }
            });
        }
    });
    // Apply Design System ClassDefs & Node styling
    mermaid += getDesignSystemClassDefs();
    input.steps.forEach(step => {
        const cls = getNodeClass(step.type);
        if (cls !== 'default') {
            mermaid += `  class ${step.id} ${cls};\n`;
        }
    });
    return mermaid;
}
export function executeFlowchart(input) {
    const startTime = Date.now();
    if (!input.title || !input.steps || input.steps.length === 0) {
        throw new Error('Validação: "title" e ao menos um passo em "steps" são obrigatórios.');
    }
    const mermaidSyntax = generateFlowchartMermaid(input);
    return saveDiagramWithMeta({
        type: 'flowchart',
        title: input.title,
        description: input.description,
        mermaidSyntax,
        suggestedTheme: input.style?.palette || 'educational',
        nodeCount: input.steps.length,
        startTime,
        tags: ['fluxograma', 'processo', 'algoritmo'],
        outputPath: input.output_path
    });
}
