# 📐 ArchView: MCP Visual Server & Frontend Engine v2.0

> Servidor **Model Context Protocol (MCP)** 100% local, determinístico e gratuito para geração, edição ao vivo, estilização e visualização de mapas mentais, organogramas, diagramas de arquitetura (C4 Model) e fluxogramas com IA.

---

## 🏛️ Visão da Arquitetura do Sistema (Modelo C4)

```mermaid
C4Container
  title Arquitetura do ArchView v2.0
  Person(ai_client, "IA / Desenvolvedor", "Claude Desktop, Cursor, Antigravity ou Terminal")
  Container(mcp_server, "ArchView MCP Daemon", "TypeScript / Node.js 20", "Executa tools de diagramação e gerencia estado")
  Container(sse_server, "Express SSE & REST", "Express 5 / Porta 3001", "Transmissão de eventos em tempo real e API REST")
  ContainerDb(storage, "Armazenamento output/", "Local Disk / JSON", "Diretório local com sintaxes Mermaid e manifestos JSON")
  Container(web_studio, "Web Studio SPA (Low-CPU)", "Alpine.js (~15KB) / Vite / CSS GPU", "Galeria reativa com Editor Split-View, Playground e 4 Temas")
  Person(browser_user, "Usuário no Navegador", "Edita diagramas, usa o playground e exporta em até 4K")
  Rel(ai_client, mcp_server, "Envia requisições MCP", "JSON-RPC (stdio)")
  Rel(mcp_server, sse_server, "Inicia em background", "In-process")
  Rel(mcp_server, storage, "Persiste .mmd e .meta.json", "Filesystem")
  Rel(sse_server, storage, "Lê e grava arquivos editados", "fs / assertSafePath")
  Rel(sse_server, web_studio, "Transmite stream /events", "Server-Sent Events")
  Rel(web_studio, browser_user, "Renderiza interface com 0% CPU em repouso", "HTML5 / SVG DOM")
  Rel(web_studio, sse_server, "Salva edições ao vivo (PUT /api/diagrams/:id)", "REST JSON")
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
  input_source(["Entrada: IA (MCP stdio), Playground Web ou Editor Split-View"])
  sec_filter["Filtro de Segurança (Anti-Path Traversal & Validação Zod)"]
  valid_gate{"Payload Válido e Seguro?"}
  error_block["Retorna Erro Estruturado (McpErrorPayload)"]
  end_error(["Execução Interrompida com Erro"])
  build_mermaid["Gera Sintaxe Mermaid Pura (.mmd) com Algoritmo DFS Anti-Ciclo"]
  write_meta["Grava slug-id.mmd e slug-id.meta.json no output/"]
  sse_emit["Dispara Evento SSE (diagram.created ou diagram.updated)"]
  resp_client["Retorna JSON de Sucesso para a IA ou UI"]
  fe_catch["Web Studio recebe evento via EventSource sem polling"]
  apply_themes["Aplica 3 Camadas: themeVariables -> CSS Vars -> SVG DOM Post-Processor"]
  user_actions["Interações: GPU Pan/Zoom, Inspetor de Nós, Edição ao Vivo ou Exportação 4K"]
  end_done(["Diagrama Pronto e Interativo"])
  input_source --> sec_filter
  sec_filter --> valid_gate
  valid_gate -- "Sim" --> build_mermaid
  valid_gate -- "Não" --> error_block
  error_block --> end_error
  build_mermaid --> write_meta
  write_meta --> sse_emit
  sse_emit --> resp_client
  resp_client --> fe_catch
  fe_catch --> apply_themes
  apply_themes --> user_actions
  user_actions --> end_done
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