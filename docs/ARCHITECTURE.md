# 🏗️ Arquitetura do Sistema: MCP Visual Server v2.0

Documentação técnica da arquitetura, fluxo de dados e decisões de design do **MCP Visual Server & Frontend Engine**.

---

## 1. Visão Geral dos Containers (Modelo C4 - Nível 2)

O diagrama abaixo ilustra os containers executáveis, limites de processo e canais de comunicação do sistema:

```mermaid
C4Container
  title Arquitetura MCP Visual Server v2.0
  Person(ai_client, "IA / Usuário", "Claude Desktop, Cursor, Antigravity")
  Container(mcp_server, "MCP Server Daemon", "TypeScript / Node.js 20", "Executa tools e gerencia estado")
  Container(sse_server, "Express SSE & REST", "Express 5 / Porta 3001", "Serviço de streaming e listagem de diagramas")
  ContainerDb(storage, "Diretório output/", "JSON / MMD Files", "Armazenamento local de diagramas e metadados")
  Container(web_studio, "Web Studio SPA", "Alpine.js / Vite / Vanilla CSS", "Galeria e estúdio de visualização com 4 temas")
  Person(browser_user, "Desenvolvedor / Usuário", "Navega nas abas, troca temas e exporta imagens")
  Rel(ai_client, mcp_server, "Envia requisições MCP", "JSON-RPC (stdio)")
  Rel(mcp_server, sse_server, "Inicia em background", "In-process")
  Rel(mcp_server, storage, "Persiste .mmd e .meta.json", "Filesystem")
  Rel(sse_server, storage, "Lê arquivos gerados", "fs.readdirSync")
  Rel(sse_server, web_studio, "Transmite eventos /events", "SSE Stream")
  Rel(web_studio, browser_user, "Renderiza interface interativa", "HTML5 / SVG DOM")
```

---

## 2. Mapa Conceitual do Ecossistema

Visão completa das funcionalidades, camadas de comunicação e garantias de segurança:

```mermaid
mindmap
  root(("MCP Visual Server v2.0"))
    ("🛠️ Ferramentas de Diagramação")
      generate_mindmap (Mapas Mentais)
      generate_orgchart (Organogramas com DFS)
      generate_architecture_diagram (Modelo C4)
      generate_flowchart (Fluxogramas lógicos)
      export_diagram (Exportação SVG/PNG)
    ("⚡ Comunicação e Tempo Real")
      MCP Stdio (JSON-RPC para IA)
      Express API REST (porta 3001)
      Server-Sent Events (/events)
      Contrato meta.json padronizado
    ("🎨 Frontend e Temas")
      Alpine.js reativo (~15KB)
      4 Temas (Educacional, Corporativo, Minimal, Dark)
      Pós-processador SVG DOM (Camada 3)
      Controles de Zoom, Pan e Exportação 2x
    ("🛡️ Segurança e Qualidade")
      Anti-Path Traversal rigoroso
      Detecção de Ciclos Hierárquicos
      Pentest 8 Vetores OWASP
      Suítes TDD, ODD e E2E
```

---

## 3. Estrutura Modular e Hierarquia de Componentes

Organização interna dos módulos do backend e do frontend:

```mermaid
graph TD
  core["<b>VisualServer Core</b><br/>Orquestrador Central MCP"]
  tools["<b>Camada de Tools</b><br/>Geradores Especializados"]
  infra["<b>Infra & Streaming</b><br/>Express + SSE (3001)"]
  frontend["<b>Frontend Web Studio</b><br/>Vite + Alpine.js (5173)"]
  t_mind["<b>Mindmap Tool</b><br/>Gerador de Mapas Mentais<br/><i>Tools</i>"]
  t_org["<b>Orgchart Tool</b><br/>Validador DFS & Árvore<br/><i>Tools</i>"]
  t_arch["<b>Architecture Tool</b><br/>Modelo C4 (C1-C3)<br/><i>Tools</i>"]
  t_flow["<b>Flowchart Tool</b><br/>Processos e Decisões<br/><i>Tools</i>"]
  t_exp["<b>Export Tool</b><br/>Cli Mermaid (SVG/PNG)<br/><i>Tools</i>"]
  themes["<b>Motor de 4 Temas</b><br/>Camada 1 (Mermaid) & 2 (CSS)<br/><i>UI</i>"]
  post_proc["<b>Pós-Processador SVG</b><br/>Camada 3 (DOM SVG)<br/><i>UI</i>"]
  core --> tools
  core --> infra
  infra --> frontend
  tools --> t_mind
  tools --> t_org
  tools --> t_arch
  tools --> t_flow
  tools --> t_exp
  frontend --> themes
  themes --> post_proc

  classDef default fill:#F8FAFC,stroke:#64748B,stroke-width:1.5px,color:#1E293B,rx:6px,ry:6px;
  classDef lvl0 fill:#1E40AF,stroke:#1D4ED8,stroke-width:2px,color:#FFFFFF,rx:8px,ry:8px;
  classDef lvl1 fill:#2563EB,stroke:#3B82F6,stroke-width:2px,color:#FFFFFF,rx:6px,ry:6px;
  classDef lvl2 fill:#DBEAFE,stroke:#60A5FA,stroke-width:1.5px,color:#1E40AF,rx:6px,ry:6px;
  classDef lvl3 fill:#F1F5F9,stroke:#94A3B8,stroke-width:1.5px,color:#334155,rx:4px,ry:4px;
  class core lvl0;
  class tools lvl1;
  class infra lvl1;
  class frontend lvl1;
  class t_mind lvl2;
  class t_org lvl2;
  class t_arch lvl2;
  class t_flow lvl2;
  class t_exp lvl2;
  class themes lvl2;
  class post_proc lvl3;
```

---

## 4. Ciclo de Vida da Requisição e Renderização em Tempo Real

Fluxo de ponta a ponta desde a chamada da ferramenta pela IA até a renderização no navegador:

```mermaid
flowchart TB
  req_in(["IA invoca Tool MCP (ex: generate_orgchart)"])
  sec_check["Validação de Segurança (Anti-Path Traversal & Zod)"]
  valid_eval{"Input Válido & Seguro?"}
  err_resp["Retorna Erro Estruturado (McpErrorPayload)"]
  end_fail(["Execução Interrompida com Erro"])
  build_syntax["Gera Sintaxe Mermaid Pura (.mmd) e Valida Ciclos"]
  save_disk["Grava slug-id.mmd e slug-id.meta.json no output/"]
  sse_broadcast["Dispara Evento SSE (diagram.created)"]
  resp_mcp["Retorna JSON de Sucesso para a IA"]
  fe_receive["Frontend Alpine.js recebe notificação via EventSource"]
  render_layers["Aplica 3 Camadas: themeVariables -> CSS Vars -> SVG DOM"]
  end_success(["Diagrama Renderizado e Pronto para Interação/Exportação"])
  req_in --> sec_check
  sec_check --> valid_eval
  valid_eval -- "Sim" --> build_syntax
  valid_eval -- "Não" --> err_resp
  err_resp --> end_fail
  build_syntax --> save_disk
  save_disk --> sse_broadcast
  sse_broadcast --> resp_mcp
  resp_mcp --> fe_receive
  fe_receive --> render_layers
  render_layers --> end_success
```

---

## 5. Pipeline de Estilização em 3 Camadas

Para garantir diagramas profissionais e consistentes sem comprometer a performance em máquinas modestas, o MCP Visual Server adota uma abordagem híbrida:

1. **Camada 1 (`themeVariables`):** Injetada diretamente no parser do Mermaid (`mermaid.initialize()`), configurando cores base de nós, fontes, bordas e arestas.
2. **Camada 2 (CSS Variables):** Variáveis dinâmicas no elemento `:root` do frontend, atualizando temas da interface, botões e cartões em tempo real.
3. **Camada 3 (Pós-Processamento SVG DOM):** Manipulação pontual do SVG gerado para aplicar sombras suaves (`feDropShadow`), cantos arredondados padronizados e diferenciação semântica para elementos C4 (bancos de dados tracejados, atores com bordas arredondadas).
