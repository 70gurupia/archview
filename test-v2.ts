import { executeMindmap } from './src/tools/mindmap.js';
import { executeOrgchart } from './src/tools/orgchart.js';
import { executeArchitecture } from './src/tools/architecture.js';
import { executeFlowchart } from './src/tools/flowchart.js';
import fs from 'fs';

async function runTests() {
  console.log("=== Testando MCP Visual Server v2.0 ===");

  // 1. Mindmap
  console.log("\n1. Testando generate_mindmap...");
  const mindmapRes = executeMindmap({
    central_topic: "Ecossistema MCP Visual",
    description: "Visão geral da arquitetura de visualização local",
    branches: [
      {
        title: "Ferramentas",
        icons: ["🛠️"],
        sub_branches: ["Mindmap", "OrgChart", "C4 Architecture", "Flowchart"]
      },
      {
        title: "Temas e Estilos",
        icons: ["🎨"],
        sub_branches: ["Educational", "Corporate", "Minimal", "Dark"]
      },
      {
        title: "Comunicação",
        icons: ["⚡"],
        sub_branches: ["MCP Stdio", "SSE Stream (3001)", "REST API"]
      }
    ],
    style: { palette: "educational" }
  });
  console.log("✅ Mindmap gerado:", mindmapRes.file_path);
  console.log("✅ Meta gerado:", mindmapRes.meta_path);

  // 2. Orgchart
  console.log("\n2. Testando generate_orgchart...");
  const orgRes = executeOrgchart({
    title: "Estrutura Organizacional de Engenharia",
    description: "Hierarquia do time de desenvolvimento de software",
    nodes: [
      { id: "cto", label: "Carlos Souza", role: "CTO / VP de Engenharia", level: 0, reports_to: null },
      { id: "eng_mgr", label: "Beatriz Lima", role: "Gerente de Engenharia", department: "Produto & Core", level: 1, reports_to: "cto", metadata: { team_size: 12 } },
      { id: "tech_lead", label: "Lucas Rocha", role: "Tech Lead Frontend", department: "Frontend", level: 2, reports_to: "eng_mgr" },
      { id: "dev_sec", label: "Mariana Costa", role: "Especialista em Segurança", department: "SecOps", level: 2, reports_to: "eng_mgr" },
      { id: "dev_fe", label: "Gabriel Santos", role: "Dev Frontend Pleno", department: "Frontend", level: 3, reports_to: "tech_lead" }
    ],
    style: { color_by_level: true, palette: "corporate" }
  });
  console.log("✅ Orgchart gerado:", orgRes.file_path);
  console.log("✅ Meta gerado:", orgRes.meta_path);

  // 3. Architecture C4
  console.log("\n3. Testando generate_architecture_diagram (C2 Container)...");
  const archRes = executeArchitecture({
    c4_level: "C2-container",
    system_name: "Plataforma de Pagamentos",
    description: "Containers e serviços da arquitetura de checkout",
    elements: [
      { id: "user", type: "person", name: "Cliente", description: "Usuário que realiza o pedido" },
      {
        id: "web_app",
        type: "container",
        name: "Web SPA",
        description: "Interface do usuário",
        technology: "Vue / Vite",
        relationships: [{ target: "api_gateway", description: "Envia requisições HTTPS", technology: "REST/JSON" }]
      },
      {
        id: "api_gateway",
        type: "container",
        name: "API Gateway",
        description: "Roteador e autenticador",
        technology: "Go / Kong",
        relationships: [
          { target: "payment_svc", description: "Chama processamento", technology: "gRPC" },
          { target: "db_main", description: "Persiste sessão", technology: "TCP" }
        ]
      },
      {
        id: "payment_svc",
        type: "container",
        name: "Serviço de Pagamentos",
        description: "Orquestrador financeiro",
        technology: "Node.js / TS",
        relationships: [{ target: "queue_orders", description: "Publica eventos de pagamento", technology: "AMQP" }]
      },
      { id: "db_main", type: "database", name: "PostgreSQL", description: "Banco de dados principal", technology: "PostgreSQL 16" },
      { id: "queue_orders", type: "queue", name: "RabbitMQ", description: "Fila de mensagens assíncronas", technology: "RabbitMQ" }
    ],
    style: { palette: "corporate" }
  });
  console.log("✅ Arquitetura gerada:", archRes.file_path);
  console.log("✅ Meta gerado:", archRes.meta_path);

  // 4. Flowchart
  console.log("\n4. Testando generate_flowchart...");
  const flowRes = executeFlowchart({
    title: "Pipeline de Validação e Deploy",
    description: "Fluxo automatizado de CI/CD",
    steps: [
      { id: "start", type: "start", label: "Git Push (main)", next: ["lint"] },
      { id: "lint", type: "process", label: "Executar Linter e Typecheck", next: ["test"] },
      { id: "test", type: "process", label: "Executar Testes Unitários", next: ["eval_test"] },
      { id: "eval_test", type: "decision", label: "Testes Passaram?", next: [{ id: "build", label: "Sim" }, { id: "notify_fail", label: "Não" }] },
      { id: "build", type: "process", label: "Construir Bundle de Produção", next: ["deploy"] },
      { id: "deploy", type: "process", label: "Deploy no Cluster", next: ["end_success"] },
      { id: "notify_fail", type: "process", label: "Notificar Equipe no Slack", next: ["end_fail"] },
      { id: "end_success", type: "end", label: "Deploy Concluído com Sucesso" },
      { id: "end_fail", type: "end", label: "Pipeline Interrompido" }
    ],
    style: { direction: "TB", palette: "educational" }
  });
  console.log("✅ Flowchart gerado:", flowRes.file_path);
  console.log("✅ Meta gerado:", flowRes.meta_path);

  // Verificar se os arquivos existem no disco
  const outDir = "./output";
  const files = fs.readdirSync(outDir);
  console.log(`\n📁 Arquivos presentes na pasta output/ (${files.length} arquivos):`);
  files.forEach(f => console.log(` - ${f}`));

  console.log("\n✨ Todos os testes das 4 tools passaram com sucesso!");
}

runTests().catch(console.error);
