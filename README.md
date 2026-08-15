# 📐 ArchView: MCP Visual Server & Frontend Engine v2.0

> Servidor **Model Context Protocol (MCP)** 100% local, determinístico e gratuito para geração, edição ao vivo, estilização e visualização de mapas mentais, organogramas, diagramas de arquitetura (C4 Model) e fluxogramas com IA.

---

## 🏛️ Visão da Arquitetura do Sistema

```mermaid
flowchart TD
  subgraph Clients[" 💻 Clientes & Interfaces "]
    ai["🤖 <b>IA / LLM</b><br/>Claude Desktop, Cursor, Antigravity"]
    browser["🌐 <b>Navegador Web</b><br/>Usuário no Web Studio"]
  end

  subgraph Core[" ⚡ ArchView Core (Processo Único • Porta 3001) "]
    mcp["⚙️ <b>MCP Server Daemon</b><br/>JSON-RPC (stdio) • TypeScript"]
    sse["📡 <b>Express SSE & REST Hub</b><br/>Streaming de Eventos em Tempo Real"]
    engine["🔍 <b>Engine de Diagramação</b><br/>Mindmap, OrgChart (DFS), C4, Flow"]
  end

  subgraph Storage[" 💾 Armazenamento Local "]
    disk[("📁 <b>Diretório output/</b><br/>.mmd (Mermaid) + .meta.json")]
  end

  subgraph Studio[" 🎨 Web Studio SPA (Low-CPU) "]
    spa["🖥️ <b>Interface Reativa</b><br/>Alpine.js (~15KB) • 4 Temas"]
    editor["✏️ <b>Editor Split-View</b><br/>Live Preview + Validação"]
    play["🧪 <b>Playground MCP</b><br/>Gerador de Prompts & JSON"]
  end

  ai -->|"JSON-RPC (stdio)"| mcp
  mcp -->|"Executa & Valida"| engine
  engine -->|"Grava Arquivos"| disk
  mcp -->|"Notifica Evento"| sse
  sse -->|"Stream SSE (/events)"| spa
  spa -->|"Lê e Salva Edições"| sse
  browser <-->|"Interage & Exporta 4K"| spa
  spa --- editor
  spa --- play

  classDef clientBox fill:#1E293B,stroke:#3B82F6,stroke-width:2px,color:#FFFFFF,rx:8px,ry:8px;
  classDef coreBox fill:#1E40AF,stroke:#60A5FA,stroke-width:2px,color:#FFFFFF,rx:8px,ry:8px;
  classDef storeBox fill:#0F766E,stroke:#14B8A6,stroke-width:2px,color:#FFFFFF,rx:8px,ry:8px;
  classDef studioBox fill:#3730A3,stroke:#818CF8,stroke-width:2px,color:#FFFFFF,rx:8px,ry:8px;

  class ai,browser clientBox;
  class mcp,sse,engine coreBox;
  class disk storeBox;
  class spa,editor,play studioBox;
```

---

## 🌟 Funcionalidades e Recursos

```mermaid
mindmap
  root(("ArchView v2.0 & Roadmap v3.0"))
    ("🛠️ Ferramentas MCP Nativas")
      generate_mindmap (Mapas Mentais)
      generate_orgchart (Organogramas com DFS)
      generate_architecture_diagram (Modelo C4)
      generate_flowchart (Fluxogramas lógicos)
      export_diagram (Exportação SVG/PNG/4K)
    ("⚡ Comunicação e Streaming")
      MCP Stdio JSON-RPC (Claude, Cursor, Antigravity)
      Express 5 API REST (porta 3001)
      Server-Sent Events (/events em tempo real)
      Endpoint PUT /api/diagrams/:id para edição
    ("🎨 Web Studio Interativo (Low-CPU)")
      Editor Split-View com live preview
      Playground Didático MCP (gerador de prompts/JSON)
      Tour de Onboarding na primeira visita
      GPU-Accelerated Pan e Zoom (0% CPU em repouso)
      4 Temas (Educacional, Corporativo, Minimal, Dark)
    ("🛡️ Segurança e Governança")
      Anti-Path Traversal estrito (assertSafePath)
      Scanner SAST Local e GitHub CodeQL
      Pentest Automatizado 8 Vetores OWASP
      Dependabot e PR Quality Bot no CI/CD
    ("🗺️ Roadmap v3.0 (Codebase Intelligence)")
      scan_codebase_topology (Visão C4 automática)
      trace_call_graph (Grafo de quem chama quem)
      trace_execution_flow (Diagrama de sequência de logs)
      analyze_codebase_overview (Raio-X de projetos)
      Ingestão Híbrida (Arquivo JSON + POST /api/ingest/trace)
```

---

## ⚡ Ciclo de Vida da Requisição e Interatividade

```mermaid
flowchart TB
  subgraph sg_1[" 1. Entrada e Segurança "]
    input_source(["🚀 Entrada: IA (stdio) ou Web Studio"])
    sec_filter["Filtro de Segurança (Anti-Traversal & Zod)"]
    valid_gate{"❓ Payload Válido e Seguro?"}
    error_block["Retorna Erro Estruturado (McpError)"]
    end_error(["🏁 Execução com Erro"])
  end

  subgraph sg_2[" 2. Motor Core & Persistência "]
    build_mermaid["Gera Sintaxe Mermaid com Algoritmo DFS Anti-Ciclo"]
    write_meta[("💾 Grava .mmd e .meta.json no output/")]
    sse_emit[["📬 Dispara SSE (diagram.created / updated)"]]
    resp_client["Retorna JSON de Sucesso para IA/UI"]
  end

  subgraph sg_3[" 3. Experiência Web Reativa "]
    fe_catch["Web Studio recebe evento sem polling"]
    apply_themes["Aplica 3 Camadas de Estilo e Temas"]
    user_actions["GPU Pan/Zoom, Live Edit ou Exportação 4K"]
    end_done(["🏁 Diagrama Pronto e Interativo"])
  end

  input_source --> sec_filter
  sec_filter --> valid_gate
  valid_gate -- "Sim" --> build_mermaid
  valid_gate -- "Não" --> error_block
  error_block --> end_error
  build_mermaid --> write_meta
  write_meta -.-> sse_emit
  sse_emit --> resp_client
  resp_client --> fe_catch
  fe_catch --> apply_themes
  apply_themes --> user_actions
  user_actions --> end_done

  classDef default fill:#F8FAFC,stroke:#64748B,stroke-width:1.5px,color:#1E293B,rx:8px,ry:8px;
  classDef primary fill:#1E40AF,stroke:#3B82F6,stroke-width:2px,color:#FFFFFF,rx:8px,ry:8px;
  classDef success fill:#0F766E,stroke:#14B8A6,stroke-width:2px,color:#FFFFFF,rx:8px,ry:8px;
  classDef accent fill:#3730A3,stroke:#818CF8,stroke-width:2px,color:#FFFFFF,rx:8px,ry:8px;
  classDef warning fill:#D97706,stroke:#F59E0B,stroke-width:2px,color:#FFFFFF,rx:8px,ry:8px;
  classDef danger fill:#B91C1C,stroke:#EF4444,stroke-width:2px,color:#FFFFFF,rx:8px,ry:8px;
  class input_source primary;
  class valid_gate warning;
  class end_error danger;
  class write_meta success;
  class sse_emit warning;
  class end_done danger;
```

---

## 🚀 Como Iniciar

### 1. Instalação e Compilação
```bash
git clone https://github.com/70gurupia/archview.git
cd archview
npm install
npm run build
```

### 2. Executar Todas as Suítes de Testes
```bash
# Roda SAST, TDD, ODD, Pentest (8 vetores OWASP) e E2E:
npm test
```

### 3. Iniciar o Servidor MCP & Frontend Web
```bash
# Inicia o servidor MCP stdio + API/SSE na porta 3001:
npm start

# Ou execute o frontend em modo desenvolvimento na porta 5173:
npm run dev:frontend
```

---

## 🔌 Configuração em Clientes MCP

### Claude Desktop / Cursor / Antigravity
Adicione ao seu arquivo de configuração de servidores MCP (substitua pelo caminho do diretório onde você clonou o repositório):

```json
{
  "mcpServers": {
    "archview": {
      "command": "node",
      "args": ["/caminho/absoluto/para/archview/build/server.js"]
    }
  }
}
```

---

## 📚 Documentação Adicional

- [📖 Documentação Completa da Arquitetura](docs/ARCHITECTURE.md)
- [🗺️ Roadmap de Evolução (v3.0 Codebase Intelligence)](ROADMAP.md)
- [📚 Referência de Ferramentas e Schemas (API)](docs/API.md)
- [📋 Quadro Kanban e Backlog](KANBAN.md)
- [📈 Relatório de Progresso e Métricas](PROGRESS.md)
- [📝 Histórico de Versões (Changelog)](CHANGELOG.md)