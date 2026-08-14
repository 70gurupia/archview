import fs from 'fs';
import path from 'path';
export function generateArchitectureMermaid(input) {
    let mermaid = `C4Context\n`;
    if (input.c4_level === 'C2-container')
        mermaid = `C4Container\n`;
    if (input.c4_level === 'C3-component')
        mermaid = `C4Component\n`;
    mermaid += `  title System Architecture: ${input.system_name}\n`;
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
                mermaid += `  Container(${el.id}, "${el.name}", "${el.technology || 'Technology'}", "${el.description}")\n`;
                break;
            case 'component':
                mermaid += `  Component(${el.id}, "${el.name}", "${el.technology || 'Technology'}", "${el.description}")\n`;
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
        if (el.relationships) {
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
    mermaid += `  UpdateElementStyle(person, $bgColor="#08427b", $fontColor="#ffffff", $borderColor="#052e56")\n`;
    return mermaid;
}
export function executeArchitecture(input) {
    const mermaidSyntax = generateArchitectureMermaid(input);
    const markdown = `\`\`\`mermaid\n${mermaidSyntax}\n\`\`\``;
    let outPath = input.output_path || 'architecture.md';
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
