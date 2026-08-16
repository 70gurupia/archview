import path from 'path';
import { scanCodebase } from '../engine/universal-scanner.js';
import { saveDiagramWithMeta, getDesignSystemClassDefs } from '../utils/meta.js';
export function generateCallGraphMermaid(symbolName, targetFile, inbound, outbound, direction = 'LR') {
    let mermaid = `flowchart ${direction}\n`;
    const targetId = `target_${sanitize(symbolName)}`;
    const targetLabel = targetFile ? `${symbolName}<br/><i>📄 ${path.basename(targetFile)}</i>` : symbolName;
    // Group inbound callers by file
    const inboundByFile = {};
    inbound.forEach(inb => {
        if (!inboundByFile[inb.callerFile])
            inboundByFile[inb.callerFile] = [];
        if (!inboundByFile[inb.callerFile].includes(inb.callerSymbol)) {
            inboundByFile[inb.callerFile].push(inb.callerSymbol);
        }
    });
    // Group outbound callees by file
    const outboundByFile = {};
    outbound.forEach(out => {
        if (!outboundByFile[out.targetFile])
            outboundByFile[out.targetFile] = [];
        if (!outboundByFile[out.targetFile].includes(out.calleeSymbol)) {
            outboundByFile[out.targetFile].push(out.calleeSymbol);
        }
    });
    // 1. Render Inbound Subgraphs (Callers)
    let inIdx = 0;
    Object.entries(inboundByFile).forEach(([file, syms]) => {
        inIdx++;
        mermaid += `  subgraph sg_in_${inIdx}[" ⬅️ De onde veio: ${path.basename(file)} "]\n`;
        syms.forEach(sym => {
            const symId = `in_${sanitize(file)}_${sanitize(sym)}`;
            mermaid += `    ${symId}["⚙️ ${sym}"]\n`;
        });
        mermaid += `  end\n\n`;
    });
    // 2. Render Target Symbol (Center)
    mermaid += `  subgraph sg_target[" 🎯 Símbolo em Foco "]\n`;
    mermaid += `    ${targetId}{{"<b>🌟 ${targetLabel}</b>"}}\n`;
    mermaid += `  end\n\n`;
    // 3. Render Outbound Subgraphs (Callees)
    let outIdx = 0;
    Object.entries(outboundByFile).forEach(([file, syms]) => {
        outIdx++;
        mermaid += `  subgraph sg_out_${outIdx}[" ➡️ Para onde vai: ${path.basename(file)} "]\n`;
        syms.forEach(sym => {
            const symId = `out_${sanitize(file)}_${sanitize(sym)}`;
            mermaid += `    ${symId}["🧩 ${sym}"]\n`;
        });
        mermaid += `  end\n\n`;
    });
    // 4. Connect Inbound -> Target
    inbound.forEach(inb => {
        const symId = `in_${sanitize(inb.callerFile)}_${sanitize(inb.callerSymbol)}`;
        mermaid += `  ${symId} -->|"chama"| ${targetId}\n`;
    });
    // 5. Connect Target -> Outbound
    outbound.forEach(out => {
        const symId = `out_${sanitize(out.targetFile)}_${sanitize(out.calleeSymbol)}`;
        mermaid += `  ${targetId} -->|"executa"| ${symId}\n`;
    });
    // Fallback if isolated
    if (inbound.length === 0 && outbound.length === 0) {
        mermaid += `  ${targetId} -.-> empty_node["Nenhuma chamada cruzada detectada"]\n`;
    }
    // 6. Apply Design System ClassDefs
    mermaid += getDesignSystemClassDefs();
    mermaid += `  class ${targetId} primary;\n`;
    inbound.forEach(inb => {
        const symId = `in_${sanitize(inb.callerFile)}_${sanitize(inb.callerSymbol)}`;
        mermaid += `  class ${symId} warning;\n`;
    });
    outbound.forEach(out => {
        const symId = `out_${sanitize(out.targetFile)}_${sanitize(out.calleeSymbol)}`;
        mermaid += `  class ${symId} success;\n`;
    });
    return mermaid;
}
export function executeTraceCallGraph(input) {
    const startTime = Date.now();
    if (!input.symbol_name) {
        throw new Error('Validação: "symbol_name" é obrigatório para rastreamento de chamadas.');
    }
    const targetDir = input.path || process.cwd();
    const topology = scanCodebase(targetDir, { maxDepth: 6 });
    // Locate matching symbol across files
    const targetSymbol = input.symbol_name.trim();
    let matchedFile = input.file_path;
    if (!matchedFile) {
        const foundFile = topology.files.find(f => f.symbols.some(s => s.name === targetSymbol) || f.exports.includes(targetSymbol));
        if (foundFile)
            matchedFile = foundFile.relativePath;
    }
    // Find Inbound callers: Who calls targetSymbol or matchedFile?
    const inbound = [];
    topology.crossModuleCalls.forEach(call => {
        if (call.toSymbol === targetSymbol || (matchedFile && call.toFile === matchedFile)) {
            inbound.push({
                callerFile: call.fromFile,
                callerSymbol: call.fromSymbol,
                count: call.callCount
            });
        }
    });
    // Find Outbound callees: What does matchedFile call?
    const outbound = [];
    if (matchedFile) {
        topology.crossModuleCalls.forEach(call => {
            if (call.fromFile === matchedFile) {
                outbound.push({
                    targetFile: call.toFile,
                    calleeSymbol: call.toSymbol,
                    count: call.callCount
                });
            }
        });
    }
    const direction = input.direction || 'LR';
    const mermaidSyntax = generateCallGraphMermaid(targetSymbol, matchedFile, inbound, outbound, direction);
    const title = input.title || `Grafo de Chamadas: ${targetSymbol}`;
    const description = input.description || `Rastreamento bidirecional (${inbound.length} chamadores inbound, ${outbound.length} dependências outbound)`;
    return saveDiagramWithMeta({
        type: 'flowchart',
        title,
        description,
        mermaidSyntax,
        suggestedTheme: 'minimal',
        nodeCount: inbound.length + outbound.length + 1,
        startTime,
        tags: ['callgraph', 'trace', 'dependencias', targetSymbol.toLowerCase()],
        outputPath: input.output_path
    });
}
function sanitize(str) {
    return str.replace(/[^A-Za-z0-9_]/g, '_');
}
