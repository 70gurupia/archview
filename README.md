# 📐 ArchView: MCP Visual Server & Codebase Intelligence Engine v5.0

> Servidor **Model Context Protocol (MCP)** 100% local, determinístico e gratuito para análise estática de repositórios, grafos de chamadas, observabilidade Prometheus, traces OpenTelemetry, arquitetura C4, mapas mentais, organogramas e geração de HTML standalone offline.

---

## 🏛️ Visão da Arquitetura do Sistema

```mermaid
flowchart TD
  subgraph sg_1[" Clientes e Consumidores "]
    ai_client(["<b>👤 IA / Desenvolvedor</b><br/>Claude Desktop, Cursor, Antigravity ou Terminal"])
    browser_user(["<b>👤 Usuário no Navegador</b><br/>Observability Hub, Codebase Explorer e Exportação HTML Offline"])
  end

  subgraph sg_2[" Servidores e Backend "]
    mcp_server["<b>📦 ArchView MCP Server</b><br/><i>TypeScript / Node.js 20</i><br/>Orquestrador de 11 ferramentas MCP, AST e HTML Generator"]
    engine_v3["<b>📦 Motor de Codebase Intelligence</b><br/><i>TypeScript Lexical Engine (< 200ms)</i><br/>Parsers AST TS/JS e léxico universal (Python, Go, Java, Rust)"]
    html_engine["<b>📦 Motor Standalone HTML</b><br/><i>HTML5 / CSS / Mermaid</i><br/>Construtor de páginas offline interativas e dashboards"]
    sse_server["<b>📦 Express SSE & Prometheus Hub</b><br/><i>Express 5 / Porta 3001</i><br/>Transmissão SSE, exportador /metrics e entrega de HTML"]
  end

  subgraph sg_3[" Camada de Persistência "]
    storage[("<b>💾 Armazenamento output/</b><br/><i>Local Disk / JSON / HTML</i><br/>Diretório local com sintaxes Mermaid, manifestos JSON e páginas HTML")]
  end

  subgraph sg_4[" Interface Gráfica Web "]
    web_studio["<b>📦 Web Studio SPA (Low-CPU)</b><br/><i>Alpine.js (~15KB) / Vite / CSS GPU</i><br/>Observability Hub, Codebase Explorer, Editor e Download HTML"]
  end

  ai_client -->|"Envia comandos MCP (11 Tools) [JSON-RPC (stdio)]"| mcp_server
  mcp_server -->|"Executa varreduras de código [AST / Regex]"| engine_v3
  mcp_server -->|"Gera páginas HTML autocontidas [TypeScript Engine]"| html_engine
  mcp_server -->|"Inicia em background [In-process]"| sse_server
  mcp_server -->|"Persiste .mmd, .html e .meta.json [Filesystem]"| storage
  sse_server -->|"Lê e grava arquivos com assertSafePath [fs]"| storage
  sse_server -.->|"Transmite eventos /events [Server-Sent Events]"| web_studio
  web_studio -->|"Renderiza diagramas com 0% CPU em repouso [HTML5 / SVG DOM]"| browser_user
  web_studio -->|"Dispara scans e consulta métricas/HTML [REST JSON]"| sse_server

  classDef default fill:#F8FAFC,stroke:#64748B,stroke-width:1.5px,color:#1E293B,rx:8px,ry:8px;
  classDef primary fill:#1E40AF,stroke:#3B82F6,stroke-width:2px,color:#FFFFFF,rx:8px,ry:8px;
  classDef success fill:#0F766E,stroke:#14B8A6,stroke-width:2px,color:#FFFFFF,rx:8px,ry:8px;
  classDef accent fill:#3730A3,stroke:#818CF8,stroke-width:2px,color:#FFFFFF,rx:8px,ry:8px;
  classDef warning fill:#D97706,stroke:#F59E0B,stroke-width:2px,color:#FFFFFF,rx:8px,ry:8px;
  classDef danger fill:#B91C1C,stroke:#EF4444,stroke-width:2px,color:#FFFFFF,rx:8px,ry:8px;
  class ai_client accent;
  class browser_user accent;
  class mcp_server primary;
  class engine_v3 primary;
  class html_engine primary;
  class sse_server primary;
  class storage success;
  class web_studio primary;
```

---

## 🌟 Funcionalidades e Recursos

```mermaid
mindmap
  root(("ArchView v5.0 Ecosystem"))
    ("🛠️ Ferramentas MCP Nativas (11 Tools)")
      generate_mindmap (Mapas Mentais Radiais)
      generate_orgchart (Organogramas Hierárquicos DFS)
      generate_architecture_diagram (Modelo C4 com Subgrafos)
      generate_flowchart (Fluxogramas e Pipelines)
      scan_codebase_topology (Topologia C4 Automática)
      trace_call_graph (Grafo Bidirecional Inbound/Outbound)
      trace_execution_flow (Sequence Diagrams de Logs)
      analyze_codebase_overview (Raio-X 360 de Repositórios)
      get_system_observability (Telemetria Prometheus & Charts)
      export_html_report (HTML Standalone e Dashboards)
      export_diagram (Exportação SVG/PNG/4K no Cliente)
    ("🌐 Geração de HTML & Dashboards (v5.0)")
      Geração automática de .html standalone por diagrama
      Dashboard executivo consolidado (All-in-One)
      100% Autocontido e offline-first (Zero Servidor)
      Pan/Zoom com aceleração por hardware
      Seletor dos 4 temas visuais e exportador PNG/SVG
    ("📈 Observabilidade e SRE")
      Endpoint /metrics no padrão texto Prometheus
      Métricas de Runtime Node.js (CPU, Heap, EventLoop)
      Histogramas de latência e contadores por diagrama
      Tracing com OpenTelemetry SDK e exportador OTLP
      Health check enriquecido com níveis de degradação
    ("🧠 Codebase Intelligence Engine")
      AST Léxica para TypeScript e JavaScript
      Parser Léxico Universal (Python, Go, Java, Rust, C#, PHP)
      Detecção de Frameworks (Express, Nest, FastAPI, Fiber)
      Resolução Determinística de Chamadas Cruzadas
      Execução instantânea (< 200ms) sem IA e sem WASM
    ("🎨 Web Studio Interativo (Low-CPU)")
      Botões de download de HTML individual e Dashboard
      Aba Observability Hub com telemetria em tempo real
      Aba Codebase Explorer com disparo de scans
      Editor Split-View com live preview
      Playground Didático MCP
    ("🛡️ Segurança e Governança")
      Anti-Path Traversal estrito (assertSafePath)
      Validação de Schemas Zod com guardrails
      Scanner SAST Local e GitHub CodeQL
      Pentest Automatizado 8 Vetores OWASP
      DOM Sanitizado sem injeção direta de HTML
```

---

## ⚡ Ciclo de Vida da Requisição e Ingestão

```mermaid
flowchart TB
  subgraph sg_1[" 1. Entrada e Segurança "]
    input_source(["🚀 Entrada: IA (stdio), Web Studio ou HTTP REST"])
    sec_filter["Filtro de Segurança (assertSafePath & Zod)"]
    valid_gate{"❓ Payload Válido e Seguro?"}
    error_block["Retorna Erro Estruturado (McpError)"]
    end_error(["🏁 Execução com Erro"])
  end

  subgraph sg_2[" 2. Motor Core & Inteligência "]
    select_engine["Seleciona Motor (Diagramação Core ou Codebase AST)"]
    build_mermaid["Gera Sintaxe Mermaid (C4, Flowchart, Sequence ou Mindmap)"]
    write_meta[("💾 Grava .mmd e .meta.json no output/")]
    sse_emit[["📬 Dispara SSE (diagram.created / updated)"]]
    resp_client["Retorna JSON de Sucesso para IA/UI"]
  end

  subgraph sg_3[" 3. Experiência Web Reativa "]
    fe_catch["Web Studio recebe evento SSE instantaneamente"]
    apply_themes["Aplica Temas, Subgrafos e Estilização SVG"]
    user_actions["Navegação Codebase, Zoom GPU ou Exportação 4K"]
    end_done(["🏁 Visualização Interativa Concluída"])
  end

  input_source --> sec_filter
  sec_filter --> valid_gate
  valid_gate -- "Sim" --> select_engine
  valid_gate -- "Não" --> error_block
  error_block --> end_error
  select_engine --> build_mermaid
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