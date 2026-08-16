import path from 'path';
import { scanCodebase } from '../engine/universal-scanner.js';
import { generateTopologyMermaid } from './scan-topology.js';
import { executeMindmap } from './mindmap.js';
import { saveDiagramWithMeta } from '../utils/meta.js';
export function executeAnalyzeOverview(input) {
    const startTime = Date.now();
    const targetDir = input.path || process.cwd();
    const topology = scanCodebase(targetDir, { maxDepth: 6 });
    // 1. Generate Mindmap of Modules
    const topBranches = Object.entries(topology.files.reduce((acc, file) => {
        const dir = path.dirname(file.relativePath) || 'Raiz';
        if (!acc[dir])
            acc[dir] = [];
        if (acc[dir].length < 6) {
            acc[dir].push(`${path.basename(file.relativePath)} (${file.symbols.length} símbolos)`);
        }
        return acc;
    }, {})).map(([dirName, fileNames]) => ({
        title: `📁 ${dirName}`,
        icons: ['📦'],
        sub_branches: fileNames
    }));
    const mindmapRes = executeMindmap({
        central_topic: topology.projectName,
        description: `Visão Geral Modular: ${topology.totalFiles} arquivos e ${topology.totalLinesOfCode} linhas de código`,
        branches: topBranches.slice(0, 10),
        style: { palette: 'educational' },
        output_path: input.output_path ? `overview-mindmap-${input.output_path}` : undefined
    });
    // 2. Generate Topology Diagram
    const topologySyntax = generateTopologyMermaid(topology, 'hybrid', 'TD');
    const title = input.title || `Raio-X de Codebase: ${topology.projectName}`;
    const frameworksStr = topology.frameworks.length > 0 ? `Frameworks: ${topology.frameworks.join(', ')} • ` : '';
    const description = input.description || `${frameworksStr}${topology.totalFiles} arquivos analisados • ${topology.totalLinesOfCode} linhas de código`;
    const diagResult = saveDiagramWithMeta({
        type: 'architecture',
        title,
        description,
        mermaidSyntax: topologySyntax,
        suggestedTheme: 'corporate',
        nodeCount: topology.totalFiles,
        startTime,
        tags: ['overview', 'codebase', 'raio-x', 'topology', ...topology.frameworks.map(f => f.toLowerCase())],
        outputPath: input.output_path
    });
    // Append rich markdown summary
    diagResult.markdown += `\n\n### 📊 Métricas do Repositório\n` +
        `- **Projeto:** \`${topology.projectName}\`\n` +
        `- **Total de Arquivos:** ${topology.totalFiles}\n` +
        `- **Linhas de Código:** ${topology.totalLinesOfCode}\n` +
        `- **Linguagens:** ${Object.entries(topology.languages).map(([l, c]) => `${l} (${c} arquivos)`).join(', ')}\n` +
        `- **Frameworks Detectados:** ${topology.frameworks.length > 0 ? topology.frameworks.join(', ') : 'Padrão / Vanilla'}\n` +
        `- **Chamadas Cruzadas entre Módulos:** ${topology.crossModuleCalls.length}\n` +
        `- **Mapa Mental Complementar:** \`${mindmapRes.file_path}\`\n`;
    return diagResult;
}
