# 🤖 Diretrizes para Agentes Autônomos (AGENTS.md)

Este repositório contém o **ArchView (MCP Visual Server & Web Studio v2.0)**.
Todos os agentes de IA (Jules, Claude, Antigravity, Devin) que operarem neste projeto devem seguir rigorosamente as regras abaixo.

---

## 🛠️ Comandos de Verificação do Projeto
- **Compilação Backend:** `npm run build:server`
- **Compilação Frontend:** `npm run build:frontend`
- **Compilação Completa:** `npm run build`
- **Suíte de Testes Completa (TDD, ODD, Pentest, SAST, E2E):** `npm test`
- **Servidor Local MCP + SSE:** `npm start` (abre porta 3001)

---

## 🔒 Regras Críticas de Segurança e Performance
1. **Low-CPU / Low-Memory:** O frontend utiliza Alpine.js e Vanilla CSS. Não introduzir frameworks pesados de Virtual DOM nem bibliotecas infladas.
2. **Zero Dados Pessoais:** Não commitar caminhos locais (`/home/...`), emails de desenvolvedores ou segredos.
3. **Isolamento de Arquivos:** Sempre usar `assertSafePath` para garantir que gravações fiquem contidas na pasta `output/`.
4. **Sem Travessão:** Usar vírgulas, dois-pontos ou parênteses no lugar de travessões em toda documentação e interface em português do Brasil.
