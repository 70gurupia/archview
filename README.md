# 📐 ArchView: MCP Visual Server & Frontend Engine v2.0

> Servidor **Model Context Protocol (MCP)** 100% local e gratuito para geração, estilização e visualização de mapas mentais, organogramas, diagramas de arquitetura (C4 Model) e fluxogramas com IA.

---

## 🏛️ Visão da Arquitetura do Sistema

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

## 🌟 Funcionalidades e Recursos

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

## ⚡ Ciclo de Vida da Requisição

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
# Roda TDD, ODD, Pentest (8 vetores OWASP) e E2E:
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
- [📚 Referência de Ferramentas e Schemas (API)](docs/API.md)
- [📋 Quadro Kanban e Backlog](KANBAN.md)
- [📈 Relatório de Progresso e Métricas](PROGRESS.md)
- [📝 Histórico de Versões (Changelog)](CHANGELOG.md)