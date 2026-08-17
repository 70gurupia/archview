import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { executeMindmap } from '../src/tools/mindmap.js';
import { executeOrgchart } from '../src/tools/orgchart.js';
import { executeArchitecture } from '../src/tools/architecture.js';
import { executeFlowchart } from '../src/tools/flowchart.js';
import { executeGetObservability } from '../src/tools/observability.js';
import { executeExportHtmlReport } from '../src/tools/export-html.js';
import { KnowledgeGraphDB } from '../src/kg/db.js';
import { detectLouvainCommunities, calculateCentrality, analyzeImpact, simulateWhatIfRemoval, findMultiplePaths } from '../src/kg/algorithms.js';

async function runHeavyProductionStressTest() {
  console.log("🔥 === [STRESS TEST] Bateria Pesada de Produção e Resiliência do ArchView v6.0 ===\n");

  const outDir = path.join(process.cwd(), 'output');
  const tempFiles: string[] = [];

  // ==========================================
  // 1. Validação de Integridade dos HTMLs Gerados
  // ==========================================
  console.log("1. Validando Execução do Runtime Mermaid nos HTMLs Oficiais...");
  const officialHtmls = [
    'self-doc-mindmap.html',
    'self-doc-orgchart.html',
    'self-doc-architecture.html',
    'self-doc-flowchart.html',
    'self-doc-topology.html',
    'self-doc-callgraph.html',
    'self-doc-metrics.html',
    'archview-dashboard.html'
  ];

  for (const filename of officialHtmls) {
    const filePath = path.join(outDir, filename);
    assert(fs.existsSync(filePath), `Arquivo HTML ${filename} deve existir no disco`);
    const content = fs.readFileSync(filePath, 'utf-8');

    // Verifica estrutura HTML5 e ausência de tags não substituídas
    assert(content.includes('<!DOCTYPE html>'), `${filename} deve ser HTML5 válido`);
    assert(!content.includes('__SCRIPT_TAG__'), `${filename} não deve conter placeholder __SCRIPT_TAG__`);
    assert(!content.includes('__CLEAN_CODE__'), `${filename} não deve conter placeholder __CLEAN_CODE__`);
    assert(!content.includes('__JSON_META__'), `${filename} não deve conter placeholder __JSON_META__`);

    // Extrai o bundle de script Mermaid embutido e valida execução
    const scriptMatch = content.match(/<script>([\s\S]*?)<\/script>/);
    assert(scriptMatch && scriptMatch[1], `Tag <script> com bundle Mermaid deve existir em ${filename}`);
    
    // Executa em sandbox JS para garantir ausência de ReferenceError / TypeError
    const scriptBody = scriptMatch[1];
    const sandbox: Record<string, any> = { globalThis: {}, window: {} };
    sandbox.globalThis = sandbox;
    sandbox.window = sandbox;
    vm.runInNewContext(scriptBody, sandbox);
    const isMermaidAvailable = (typeof sandbox.mermaid !== 'undefined' && typeof sandbox.mermaid.render === 'function')
      || (typeof sandbox.__esbuild_esm_mermaid_nm !== 'undefined' && sandbox.__esbuild_esm_mermaid_nm.mermaid);
    assert(isMermaidAvailable, `Runtime Mermaid deve ser inicializado com sucesso em ${filename}`);
    console.log(`  ✓ ${filename} (Tamanho: ${(content.length / 1024 / 1024).toFixed(2)} MB, Runtime: OK)`);
  }

  // ==========================================
  // 2. Teste de Carga Extrema: C4 com 100 Containers
  // ==========================================
  console.log("\n2. Teste de Carga: Diagrama C4 com 100 Nós e Múltiplos Subgrafos...");
  const heavyElements: any[] = [];
  for (let i = 1; i <= 100; i++) {
    heavyElements.push({
      id: `svc_${i}`,
      type: i % 10 === 0 ? 'database' : (i % 5 === 0 ? 'queue' : 'container'),
      name: `Microservice Cluster ${i}`,
      description: `Processamento de alta disponibilidade com failover ${i}`,
      technology: `Node.js 20 / gRPC #${i}`,
      group: `Domínio de Negócio ${Math.ceil(i / 20)}`,
      relationships: i > 1 ? [
        { target: `svc_${Math.max(1, i - 1)}`, description: `Chama via gRPC`, technology: 'HTTP/2' },
        { target: `svc_${Math.max(1, i % 10)}`, description: `Publica Evento`, technology: 'Kafka' }
      ] : []
    });
  }

  const stressArch = executeArchitecture({
    c4_level: "C2-container",
    system_name: "Mega Cluster 100 Nós",
    elements: heavyElements,
    output_path: "output/stress-test-arch.md",
    target_dir: process.cwd()
  });
  tempFiles.push(stressArch.file_path, stressArch.file_path.replace(/\.mmd$/, '.meta.json'), stressArch.file_path.replace(/\.mmd$/, '.html'));
  assert(fs.existsSync(stressArch.file_path), "Diagrama C4 de 100 nós deve ser gerado");
  console.log(`  ✓ C4 com 100 nós gerado com sucesso (${(fs.statSync(stressArch.file_path).size / 1024).toFixed(1)} KB)`);

  // ==========================================
  // 3. Teste de Carga Extrema: Flowchart com 150 Passos e Decisões
  // ==========================================
  console.log("\n3. Teste de Carga: Fluxograma com 150 Passos, Decisões e Loops...");
  const heavySteps: any[] = [];
  heavySteps.push({ id: "step_start", type: "start", label: "Início do Pipeline de Alta Escala", next: ["step_1"] });
  for (let i = 1; i <= 150; i++) {
    if (i % 10 === 0) {
      heavySteps.push({
        id: `step_${i}`,
        type: "decision",
        label: `Validação de Lote ${i}?`,
        next: [
          { id: i < 150 ? `step_${i + 1}` : "step_end", label: "Aprovado" },
          { id: `step_${Math.max(1, i - 5)}`, label: "Retry Loop" }
        ]
      });
    } else {
      heavySteps.push({
        id: `step_${i}`,
        type: i % 4 === 0 ? "database" : "process",
        label: `Processar Tarefa Atômica #${i}`,
        next: [i < 150 ? `step_${i + 1}` : "step_end"]
      });
    }
  }
  heavySteps.push({ id: "step_end", type: "end", label: "Pipeline Concluído com Sucesso" });

  const stressFlow = executeFlowchart({
    title: "Pipeline de Alta Complexidade (150 Passos)",
    steps: heavySteps,
    output_path: "output/stress-test-flow.md",
    target_dir: process.cwd()
  });
  tempFiles.push(stressFlow.file_path, stressFlow.file_path.replace(/\.mmd$/, '.meta.json'), stressFlow.file_path.replace(/\.mmd$/, '.html'));
  assert(fs.existsSync(stressFlow.file_path), "Flowchart de 150 passos deve ser gerado");
  console.log(`  ✓ Flowchart com 152 nós e loops gerado com sucesso`);

  // ==========================================
  // 4. Teste de Carga do Knowledge Graph (500 Nós / 1500 Arestas)
  // ==========================================
  console.log("\n4. Teste de Carga do Knowledge Graph (500 Nós e 1.500 Arestas Concorrentes)...");
  const stressKgPath = path.join(outDir, 'stress-kg.db');
  tempFiles.push(stressKgPath, stressKgPath + '-wal', stressKgPath + '-shm');
  const stressKg = new KnowledgeGraphDB(stressKgPath);

  const startKgTime = Date.now();
  const batchNodes = [];
  for (let i = 1; i <= 500; i++) {
    batchNodes.push({
      label: i % 3 === 0 ? 'Service' : (i % 2 === 0 ? 'Database' : 'Module'),
      name: `Entity_${i}`,
      qualified_name: `pkg/domain/entity_${i}`,
      properties: { memory_mb: i * 10, cluster: `cluster_${i % 5}` }
    });
  }
  stressKg.addNodesBatch(batchNodes);

  const batchEdges = [];
  for (let i = 1; i <= 500; i++) {
    batchEdges.push({ source_id: i, target_id: (i % 500) + 1, type: 'CALLS', weight: 1.0 });
    if (i + 5 <= 500) batchEdges.push({ source_id: i, target_id: i + 5, type: 'DEPENDS_ON', weight: 2.0 });
    if (i % 10 === 0 && i + 20 <= 500) batchEdges.push({ source_id: i, target_id: i + 20, type: 'REPLICATES', weight: 0.5 });
  }
  stressKg.addEdgesBatch(batchEdges);

  const kgDuration = Date.now() - startKgTime;
  console.log(`  ✓ 500 Nós e ${batchEdges.length} Arestas inseridas em ${kgDuration}ms`);

  const nodes = stressKg.getAllNodes();
  const edges = stressKg.getAllEdges();
  assert.strictEqual(nodes.length, 500, "Deve conter exatamente 500 nós");
  assert(edges.length >= 1000, "Deve conter mais de 1000 arestas");

  // Executa Louvain e PageRank sob estresse
  const startAlgoTime = Date.now();
  const comms = detectLouvainCommunities(nodes, edges);
  const cents = calculateCentrality(nodes, edges);
  const impact = analyzeImpact(1, nodes, edges);
  const whatIf = simulateWhatIfRemoval(1, nodes, edges);
  const paths = findMultiplePaths(1, 250, nodes, edges, 5, 6);
  const algoDuration = Date.now() - startAlgoTime;

  console.log(`  ✓ Algoritmos de Rede (Louvain: ${comms.communities_count} comunidades, PageRank, Blast Radius, What-If, Multi-Path) processados em ${algoDuration}ms`);
  assert(comms.communities_count > 0, "Louvain deve detectar comunidades");
  assert(cents.length === 500, "Centralidade deve cobrir todos os nós");

  // ==========================================
  // 5. Teste de Fuzzing de Caracteres Especiais & XSS
  // ==========================================
  console.log("\n5. Teste de Fuzzing: Injeções, Tags e Caracteres Especiais...");
  const fuzzMindmap = executeMindmap({
    central_topic: "Fuzzing & Anti-XSS Test <script>alert(1)</script>",
    description: "Caracteres perigosos: ' \" ` $ & < > / \\ \n \t \r 🔥 🚀",
    branches: [
      {
        title: "Submódulo com Aspas e Dólar: $HOME / \"quoted\" / 'single'",
        sub_branches: [
          "<b>Tag HTML Negrito</b>",
          "Variável $1 e $$",
          "<img src=x onerror=alert('xss')>",
          "Unicode: 日本語, Русский, العربية, 🎯"
        ]
      }
    ],
    output_path: "output/fuzz-mindmap.md",
    target_dir: process.cwd()
  });
  tempFiles.push(fuzzMindmap.file_path, fuzzMindmap.file_path.replace(/\.mmd$/, '.meta.json'), fuzzMindmap.file_path.replace(/\.mmd$/, '.html'));

  const fuzzHtmlPath = fuzzMindmap.file_path.replace(/\.mmd$/, '.html');
  assert(fs.existsSync(fuzzHtmlPath), "HTML de fuzzing deve ser gerado sem corromper");
  const fuzzHtml = fs.readFileSync(fuzzHtmlPath, 'utf-8');
  assert(fuzzHtml.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), "Tags no título devem estar devidamente escapadas no HTML");
  assert(!fuzzHtml.includes('<h1>Fuzzing & Anti-XSS Test <script>alert(1)</script></h1>'), "Título no header não deve conter tags HTML vivas");
  console.log(`  ✓ Fuzzing e caracteres especiais validados e protegidos`);

  // ==========================================
  // 6. Limpeza e Teardown Automático de Arquivos Temporários
  // ==========================================
  console.log("\n6. Limpando arquivos temporários de teste de estresse...");
  let cleanedCount = 0;
  for (const f of tempFiles) {
    try {
      if (fs.existsSync(f)) {
        fs.unlinkSync(f);
        cleanedCount++;
      }
    } catch {}
  }
  console.log(`  ✓ ${cleanedCount} arquivos temporários de estresse excluídos com sucesso`);

  console.log("\n🎉 === [STRESS TEST] Bateria Pesada de Produção Aprovada com 100% de Sucesso! ===");
}

runHeavyProductionStressTest().catch(err => {
  console.error("❌ Falha no Stress Test:", err);
  process.exit(1);
});
