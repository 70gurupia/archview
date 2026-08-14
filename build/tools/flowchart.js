import fs from 'fs';
import path from 'path';
export function generateFlowchartMermaid(input) {
    const direction = input.style?.direction || 'TD';
    let mermaid = `flowchart ${direction}\n`;
    // Define nodes
    input.steps.forEach(step => {
        let shapeOpen = '[';
        let shapeClose = ']';
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
            case 'input':
            case 'output':
                shapeOpen = '(/';
                shapeClose = '/)';
                break;
            case 'subprocess':
                shapeOpen = '[[';
                shapeClose = ']]';
                break;
        }
        mermaid += `  ${step.id}${shapeOpen}"${step.label}"${shapeClose}\n`;
    });
    // Define edges
    input.steps.forEach(step => {
        if (step.next) {
            step.next.forEach(n => {
                if (typeof n === 'string') {
                    mermaid += `  ${step.id} --> ${n}\n`;
                }
                else {
                    mermaid += `  ${step.id} -- "${n.label}" --> ${n.id}\n`;
                }
            });
        }
    });
    return mermaid;
}
export function executeFlowchart(input) {
    const mermaidSyntax = generateFlowchartMermaid(input);
    const markdown = `\`\`\`mermaid\n${mermaidSyntax}\n\`\`\``;
    let outPath = input.output_path || 'flowchart.md';
    const outDir = path.join(process.cwd(), 'output');
    const resolvedPath = path.resolve(outDir, outPath);
    if (!resolvedPath.startsWith(outDir)) {
        throw new Error('Path traversal detected. Output must be within the output directory.');
    }
    if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
    }
    fs.writeFileSync(resolvedPath, markdown, 'utf8');
    return {
        file_path: resolvedPath,
        format: 'markdown',
        markdown: markdown
    };
}
