import { saveDiagramWithMeta, getSemanticIcon, getDesignSystemClassDefs, getNodeClass } from '../utils/meta.js';
export function generateArchitectureMermaid(input) {
    if (input.style?.notation === 'flowchart') {
        const dir = input.style.direction || 'TD';
        let mermaid = `flowchart ${dir}\n`;
        // Group elements by subgraph if group is provided
        const groups = {};
        const ungrouped = [];
        input.elements.forEach(el => {
            if (el.group) {
                if (!groups[el.group])
                    groups[el.group] = [];
                groups[el.group].push(el);
            }
            else {
                ungrouped.push(el);
            }
        });
        const renderElement = (el) => {
            let open = '[';
            let close = ']';
            let tech = el.technology ? `<br/><i>${el.technology}</i>` : '';
            const icon = getSemanticIcon(el.type, el.name);
            switch (el.type) {
                case 'person':
                    open = '([';
                    close = '])';
                    break;
                case 'database':
                    open = '[(';
                    close = ')]';
                    break;
                case 'queue':
                    open = '[[';
                    close = ']]';
                    break;
                case 'external':
                    open = '[/';
                    close = '/]';
                    break;
                default:
                    open = '[';
                    close = ']';
                    break;
            }
            return `    ${el.id}${open}"<b>${icon}${el.name}</b>${tech}<br/>${el.description}"${close}\n`;
        };
        let groupIdx = 0;
        Object.entries(groups).forEach(([groupName, elements]) => {
            groupIdx++;
            mermaid += `  subgraph sg_${groupIdx}[" ${groupName} "]\n`;
            elements.forEach(el => {
                mermaid += renderElement(el);
            });
            mermaid += `  end\n\n`;
        });
        ungrouped.forEach(el => {
            mermaid += renderElement(el).replace(/^    /, '  ');
        });
        input.elements.forEach(el => {
            if (el.relationships && el.relationships.length > 0) {
                el.relationships.forEach(rel => {
                    const targetEl = input.elements.find(e => e.id === rel.target);
                    const isAsync = targetEl?.type === 'queue' || /event|queue|stream|sse|async|kafka|rabbit/i.test(rel.technology || '') || /event|ass[ií]ncrono|fila|stream/i.test(rel.description || '');
                    const tech = rel.technology ? ` [${rel.technology}]` : '';
                    if (isAsync) {
                        mermaid += `  ${el.id} -.->|"${rel.description}${tech}"| ${rel.target}\n`;
                    }
                    else {
                        mermaid += `  ${el.id} -->|"${rel.description}${tech}"| ${rel.target}\n`;
                    }
                });
            }
        });
        // Apply Design System ClassDefs & Node styling
        mermaid += getDesignSystemClassDefs();
        input.elements.forEach(el => {
            const cls = getNodeClass(el.type);
            if (cls !== 'default') {
                mermaid += `  class ${el.id} ${cls};\n`;
            }
        });
        return mermaid;
    }
    let mermaid = `C4Context\n`;
    if (input.c4_level === 'C2-container')
        mermaid = `C4Container\n`;
    if (input.c4_level === 'C3-component')
        mermaid = `C4Component\n`;
    mermaid += `  title ${input.system_name}\n`;
    // Elements
    input.elements.forEach(el => {
        switch (el.type) {
            case 'person':
                mermaid += `  Person(${el.id}, "${el.name}", "${el.description}")\n`;
                break;
            case 'system':
                mermaid += `  System(${el.id}, "${el.name}", "${el.description}")\n`;
                break;
            case 'container':
                mermaid += `  Container(${el.id}, "${el.name}", "${el.technology || 'Container'}", "${el.description}")\n`;
                break;
            case 'component':
                mermaid += `  Component(${el.id}, "${el.name}", "${el.technology || 'Component'}", "${el.description}")\n`;
                break;
            case 'database':
                mermaid += `  ContainerDb(${el.id}, "${el.name}", "${el.technology || 'Database'}", "${el.description}")\n`;
                break;
            case 'queue':
                mermaid += `  ContainerQueue(${el.id}, "${el.name}", "${el.technology || 'Queue'}", "${el.description}")\n`;
                break;
            case 'external':
                mermaid += `  System_Ext(${el.id}, "${el.name}", "${el.description}")\n`;
                break;
        }
    });
    // Relationships
    input.elements.forEach(el => {
        if (el.relationships && el.relationships.length > 0) {
            el.relationships.forEach(rel => {
                if (rel.technology && input.style?.show_technology !== false) {
                    mermaid += `  Rel(${el.id}, ${rel.target}, "${rel.description}", "${rel.technology}")\n`;
                }
                else {
                    mermaid += `  Rel(${el.id}, ${rel.target}, "${rel.description}")\n`;
                }
            });
        }
    });
    return mermaid;
}
export function executeArchitecture(input) {
    const startTime = Date.now();
    if (!input.c4_level || !input.system_name || !input.elements || input.elements.length === 0) {
        throw new Error('Validação: "c4_level", "system_name" e ao menos um elemento são obrigatórios.');
    }
    const mermaidSyntax = generateArchitectureMermaid(input);
    return saveDiagramWithMeta({
        type: 'architecture',
        title: input.system_name,
        description: input.description,
        mermaidSyntax,
        suggestedTheme: input.style?.palette || 'corporate',
        nodeCount: input.elements.length,
        startTime,
        tags: ['c4-model', input.c4_level, 'arquitetura', 'software'],
        outputPath: input.output_path
    });
}
