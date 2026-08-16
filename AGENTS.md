# 🤖 Diretrizes para Agentes Autônomos (AGENTS.md)

Este repositório contém o **ArchView (MCP Visual Server, Web Studio & Codebase Intelligence Engine v5.0)**.
Todos os agentes de IA (Jules, Claude, Antigravity, Devin) que operarem neste projeto devem seguir rigorosamente as regras abaixo.

---

## 🛠️ Comandos de Verificação do Projeto
- **Compilação Backend:** `npm run build:server`
- **Compilação Frontend:** `npm run build:frontend`
- **Compilação Completa:** `npm run build`
- **Suíte de Testes Completa (TDD Unitário, TDD v3, TDD v4, TDD v5, ODD, Pentest OWASP, SAST Scanner e Integration v2):** `npm test`
- **Servidor Local MCP + SSE:** `npm start` (inicia processo stdio e servidor SSE na porta 3001)

---

## 🔒 Regras Críticas de Segurança e Performance
1. **Low-CPU / Low-Memory:** O frontend utiliza Alpine.js e Vanilla CSS (0% de CPU em repouso). Não introduzir frameworks pesados de Virtual DOM nem bibliotecas infladas.
2. **Zero Dados Pessoais / Segredos:** Não commitar caminhos locais do host (`/home/...`), credenciais, tokens ou segredos.
3. **Isolamento Estrito de Arquivos:** Sempre usar `assertSafePath` para garantir que gravações fiquem contidas na pasta `output/` e bloquear tentativas de path traversal.
4. **Sem Travessão:** Usar vírgulas, dois-pontos, parênteses ou pontos no lugar de travessões em toda documentação, commits e interface em português do Brasil.
5. **Geração Offline de HTML:** Todos os arquivos `.html` devem ser gerados de forma 100% autocontida com runtime `mermaid.min.js` embutido inline, sem depender de internet nem de CDN externo.
