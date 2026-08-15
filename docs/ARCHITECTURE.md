# Arquitetura - ArchView v2.0

## Visão Geral
ArchView é um servidor MCP projetado para operar com 0% idle CPU e mínimo footprint de RAM.

## Componentes Principais
1. **MCP Server (stdio):** Processo principal, rodando via tsx/node, interpreta as requisições `CallToolRequest` vindas de um LLM Client.
2. **REST / SSE API (Porta 3001):**
   - Transmite eventos assíncronos (`diagram.created`) via Server-Sent Events.
   - Fornece payload REST para a listagem dos diagramas locais.
   - Aplica `express-rate-limit` (anti-spam) e validação severa de origens CORS.
3. **Validação Zod & Guardrails:**
   - Antes da transpilação para `.mmd`, os inputs passam por Zod para limitar tamanhos e calcular ciclos/profundidades, estourando exceção imediata caso passem de 50 nós.
   - Sanitização de strings para purgar `<script>` antes de salvar.
4. **Web UI (Frontend):**
   - Feito puramente em **Alpine.js**. Não usa reconciliadores de v-dom.
   - Motor acelerado via hardware GPU `translate3d` para Pan/Zoom, eliminando recálculos pesados.
   - Respeita `prefers-reduced-motion` no sistema do usuário.
