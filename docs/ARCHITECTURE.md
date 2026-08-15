# 🏗️ Arquitetura do Sistema: ArchView v3.0 (Codebase Intelligence & Flow Tracing)

Documentação técnica da arquitetura, fluxo de dados, guardrails de segurança e subsistemas do **ArchView (MCP Visual Server, Web Studio & Codebase Engine)**.

---

## 1. Visão Geral da Arquitetura de Containers (C2 Container)

O diagrama abaixo ilustra os containers executáveis, limites de processo e canais de comunicação do sistema:

```mermaid
flowchart TD
  subgraph sg_1[" Clientes e Consumidores "]
    ai_client(["<b>👤 IA / Desenvolvedor</b><br/>Claude Desktop, Cursor, Antigravity ou Terminal"])
    browser_user(["<b>👤 Usuário no Navegador</b><br/>Codebase Explorer, Editor Split-View e Exportação 4K"])
  end

  subgraph sg_2[" Servidores e Backend "]
    mcp_server["<b>📦 ArchView MCP Server</b><br/><i>TypeScript / Node.js 20</i><br/>Orquestrador de 9 ferramentas MCP e motor de AST"]
    engine_v3["<b>📦 Motor de Codebase Intelligence</b><br/><i>TypeScript Lexical Engine (< 200ms)</i><br/>Parsers AST TS/JS e léxico universal (Python, Go, Java, Rust)"]
    sse_server["<b>📦 Express SSE & REST</b><br/><i>Express 5 / Porta 3001</i><br/>Transmissão em tempo real e endpoints de ingestão de traces"]
  end

  subgraph sg_3[" Camada de Persistência "]
    storage[("<b>💾 Armazenamento output/</b><br/><i>Local Disk / JSON</i><br/>Diretório local com sintaxes Mermaid e manifestos JSON")]
  end

  subgraph sg_4[" Interface Gráfica Web "]
    web_studio["<b>📦 Web Studio SPA (Low-CPU)</b><br/><i>Alpine.js (~15KB) / Vite / CSS GPU</i><br/>Codebase Explorer, Editor ao vivo e 4 Temas visuais"]
  end

  ai_client -->|"Envia comandos MCP [JSON-RPC (stdio)]"| mcp_server
  mcp_server -->|"Executa varreduras de código [AST / Regex]"| engine_v3
  mcp_server -->|"Inicia em background [In-process]"| sse_server
  mcp_server -->|"Persiste .mmd e .meta.json [Filesystem]"| storage
  sse_server -->|"Lê e grava arquivos com assertSafePath [fs]"| storage
  sse_server -.->|"Transmite eventos /events [Server-Sent Events]"| web_studio
  web_studio -->|"Renderiza diagramas com 0% CPU em repouso [HTML5 / SVG DOM]"| browser_user
  web_studio -->|"Dispara scans e salva edições [REST JSON]"| sse_server

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
  class sse_server primary;
  class storage success;
  class web_studio primary;
```

---

## 2. Mapa Conceitual do Ecossistema v3.0

Visão completa das funcionalidades, camadas de comunicação, garantias de segurança e recursos do motor de codebase intelligence:

```mermaid
mindmap
  root(("ArchView v3.0 Ecosystem"))
    ("🛠️ Ferramentas MCP Nativas (9 Tools)")
      generate_mindmap (Mapas Mentais Radiais)
      generate_orgchart (Organogramas Hierárquicos DFS)
      generate_architecture_diagram (Modelo C4 com Subgrafos)
      generate_flowchart (Fluxogramas e Pipelines)
      scan_codebase_topology (Topologia C4 Automática)
      trace_call_graph (Grafo Bidirecional Inbound/Outbound)
      trace_execution_flow (Sequence Diagrams de Logs)
      analyze_codebase_overview (Raio-X 360 de Repositórios)
      export_diagram (Exportação SVG/PNG/4K no Cliente)
    ("🧠 Codebase Intelligence (v3.0 Engine)")
      AST Léxica para TypeScript e JavaScript
      Parser Léxico Universal (Python, Go, Java, Rust, C#, PHP)
      Detecção de Frameworks (Express, Nest, FastAPI, Fiber, Gin)
      Resolução Determinística de Chamadas Cruzadas
      Execução instantânea (< 200ms) sem IA e sem WASM
    ("⚡ Comunicação e Streaming")
      MCP Stdio JSON-RPC (Claude, Cursor, Antigravity)
      Express 5 API REST na porta 3001
      Server-Sent Events (/events em tempo real)
      Endpoint POST /api/ingest/trace para logs HTTP
      Endpoints POST /api/codebase/* para varreduras remotas
    ("🎨 Web Studio Interativo (Low-CPU)")
      Aba Codebase Explorer com disparo de scans
      Editor Split-View com live preview
      Playground Didático MCP
      GPU-Accelerated Pan e Zoom (0% CPU em repouso)
      4 Temas (Educacional, Corporativo, Minimal, Dark)
    ("🛡️ Segurança e Governança")
      Anti-Path Traversal estrito (assertSafePath)
      Validação de Schemas Zod com guardrails
      Scanner SAST Local e GitHub CodeQL
      Pentest Automatizado 8 Vetores OWASP
      DOM Sanitizado sem injeção direta de HTML
```

---

## 3. Estrutura Modular e Hierarquia de Componentes

Organização interna dos módulos do backend, do estúdio web e do motor de codebase intelligence:

```mermaid
graph TD
  core["<b>ArchView Core</b><br/>Orquestrador Central MCP (stdio)"]
  engine_v3["<b>Codebase Engine (v3.0)</b><br/>AST & Flow Tracing Determinístico"]
  tools_layer["<b>Camada de Tools (9 Tools)</b><br/>Geradores Especializados com Zod"]
  infra_layer["<b>Infra & Streaming</b><br/>Express 5 + SSE Hub (3001) + Rate Limit"]
  web_studio["<b>Web Studio SPA (Low-CPU)</b><br/>Alpine.js + Vite (5173)"]
  qa_sec["<b>QA & Segurança SAST</b><br/>CodeQL, Pentest OWASP, TDD/ODD"]

  v3_ast_ts["<b>AST Parser TS/JS</b><br/>Classes, rotas e métodos<br/><i>Engine</i>"]
  v3_ast_lex["<b>Universal Lexical Parser</b><br/>Python, Go, Java, Rust, C#<br/><i>Engine</i>"]
  v3_scanner["<b>Universal Scanner</b><br/>Varredura e resolução de deps<br/><i>Engine</i>"]
  v3_trace_p["<b>Trace/Log Parser</b><br/>Transpilação para sequenceDiagram<br/><i>Engine</i>"]

  t_mind["<b>Mindmap Tool</b><br/>Mapas Mentais Radiais<br/><i>Tools</i>"]
  t_org["<b>Orgchart Tool</b><br/>Validador DFS e Árvore<br/><i>Tools</i>"]
  t_arch["<b>Architecture Tool</b><br/>Modelo C4 com Subgrafos<br/><i>Tools</i>"]
  t_flow["<b>Flowchart Tool</b><br/>Processos e Decisões<br/><i>Tools</i>"]
  t_scan_top["<b>scan_codebase_topology</b><br/>Topologia C4 de Diretórios<br/><i>Tools</i>"]
  t_trace_call["<b>trace_call_graph</b><br/>Grafo de Chamadas Bidirecional<br/><i>Tools</i>"]
  t_trace_exec["<b>trace_execution_flow</b><br/>Diagramas de Sequência<br/><i>Tools</i>"]
  t_overview["<b>analyze_codebase_overview</b><br/>Raio-X 360 do Repositório<br/><i>Tools</i>"]

  ui_explorer["<b>Codebase Explorer</b><br/>Painel de varredura e grafos<br/><i>UI</i>"]
  ui_editor["<b>Editor Split-View</b><br/>Edição ao vivo com preview<br/><i>UI</i>"]
  ui_play["<b>Playground MCP</b><br/>Gerador didático de prompts e JSON<br/><i>UI</i>"]
  ui_canvas["<b>GPU Canvas Pan/Zoom</b><br/>Aceleração por hardware CSS<br/><i>UI</i>"]
  ui_themes["<b>Motor de 4 Temas</b><br/>3 Camadas (Variables + CSS + SVG DOM)<br/><i>UI</i>"]

  core --> engine_v3
  core --> tools_layer
  core --> infra_layer
  infra_layer --> web_studio
  core --> qa_sec

  engine_v3 --> v3_ast_ts
  engine_v3 --> v3_ast_lex
  engine_v3 --> v3_scanner
  engine_v3 --> v3_trace_p

  tools_layer --> t_mind
  tools_layer --> t_org
  tools_layer --> t_arch
  tools_layer --> t_flow
  tools_layer --> t_scan_top
  tools_layer --> t_trace_call
  tools_layer --> t_trace_exec
  tools_layer --> t_overview

  web_studio --> ui_explorer
  web_studio --> ui_editor
  web_studio --> ui_play
  web_studio --> ui_canvas
  web_studio --> ui_themes

  classDef default fill:#F8FAFC,stroke:#64748B,stroke-width:1.5px,color:#1E293B,rx:6px,ry:6px;
  classDef lvl0 fill:#1E40AF,stroke:#1D4ED8,stroke-width:2px,color:#FFFFFF,rx:8px,ry:8px;
  classDef lvl1 fill:#2563EB,stroke:#3B82F6,stroke-width:2px,color:#FFFFFF,rx:6px,ry:6px;
  classDef lvl2 fill:#DBEAFE,stroke:#60A5FA,stroke-width:1.5px,color:#1E40AF,rx:6px,ry:6px;
  classDef lvl3 fill:#F1F5F9,stroke:#94A3B8,stroke-width:1.5px,color:#334155,rx:4px,ry:4px;
  class core lvl0;
  class tools_layer lvl1;
  class infra_layer lvl1;
  class web_studio lvl1;
  class qa_sec lvl1;
  class engine_v3 lvl1;
  class t_mind lvl2;
  class t_org lvl2;
  class t_arch lvl2;
  class t_flow lvl2;
  class t_exp lvl2;
  class ui_editor lvl2;
  class ui_play lvl2;
  class ui_tour lvl2;
  class ui_canvas lvl2;
  class ui_themes lvl2;
  class v3_scan lvl2;
  class v3_call lvl2;
  class v3_flow lvl2;
```

---

## 4. Ciclo de Vida da Requisição e Guardrails

Fluxo de ponta a ponta desde o acionamento (via IA ou Web Studio) até a renderização e exportação:

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

## 5. Pipeline de Estilização em 3 Camadas

1. **Camada 1 (`themeVariables`):** Injetada no parser Mermaid (`mermaid.initialize()`) para configurar as cores e fontes de base.
2. **Camada 2 (CSS Variables):** Injetada no elemento `:root` do frontend para temas e componentes reativos.
3. **Camada 3 (Pós-Processamento SVG DOM):** Injeção de sombras suaves (`feDropShadow`), bordas arredondadas e diferenciação semântica para bancos de dados, pessoas e containers.
