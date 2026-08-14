# 🚀 MEGA PROMPT PARA O JULES: POLIMENTO VISUAL, INTERATIVIDADE, DIDÁTICA E LOW-CPU ENGINE

Você atuará como um Engenheiro Frontend & MCP Sênior encarregado de implementar uma suíte completa de **polimento de UI/UX, interatividade em tempo real, playground didático e otimizações extremas para computadores de baixo custo (Low-CPU/RAM)** no projeto **ArchView** (`70gurupia/archview`).

---

## 🎯 1. DIRETRIZES FUNDAMENTAIS DE ARQUITETURA & HARDWARE

> **Restrição de Hardware:** O usuário opera em uma máquina com recursos modestos. Cada ciclo de CPU e byte de RAM deve ser respeitado.

1. **Zero Virtual DOM pesado:** Mantenha estritamente a arquitetura leve baseada em **Alpine.js (~15KB)** e **Vanilla CSS**. Não instale React, Vue, Next.js, Framer Motion ou bibliotecas que mantenham reconciliação pesada de Virtual DOM.
2. **0% CPU em Idle:** Nenhuma animação ou renderização deve rodar em loops contínuos de JavaScript (como `requestAnimationFrame` sem interação). Todas as animações devem ser transições CSS acionadas exclusivamente por eventos do usuário (`hover`, `click`, `focus`).
3. **GPU-Accelerated Pan & Zoom:** O Zoom e Pan interativo deve manipular o SVG via `transform: translate3d(x, y, 0) scale(z)` com aceleração de hardware pela GPU (`will-change: transform`). NUNCA recompile o código Mermaid durante o arraste ou zoom.
4. **Debounce em Edição ao Vivo:** Qualquer edição de código Mermaid no navegador deve ter um debounce de 350ms antes de invocar `mermaid.render()`.
5. **Acessibilidade & Preferência de Movimento:** Toda animação e transição DEVE respeitar estritamente a query `@media (prefers-reduced-motion: reduce)`.

---

## 🎨 2. MÓDULO DE INTERATIVIDADE: EDITOR SPLIT-VIEW & INSPETOR VISUAL

Aprimore o **Web Studio** (`frontend/src/main.ts`, `frontend/index.html`, `frontend/src/styles.css`):

### 2.1 Editor de Código Mermaid em Tempo Real (Split-View)
- Adicione um botão "✏️ Modo Editor" em cada cartão de diagrama.
- Ao ativar, abra uma gaveta ou modal dividido (Split-View):
  - **Lado Esquerdo:** Editor de texto leve com numeração de linhas, indentação automática com tecla Tab e validação sintática do Mermaid com tratamento gracioso de erros (mostrando uma badge vermelha suave em caso de erro, sem travar a interface).
  - **Lado Direito:** Preview do diagrama em tempo real atualizado com debounce de 350ms e aplicação das 3 camadas de estilização (Mermaid Variables + CSS Vars + SVG DOM Post-Processor).
- Botão "💾 Salvar Alterações Localmente" e botão "📋 Copiar Código Mermaid".

### 2.2 Inspetor Visual de Nós com Efeito Hover
- Ao passar o cursor ou clicar sobre nós do diagrama no DOM SVG, aplique um destaque sutil de iluminação (`stroke-width: 2.5px; filter: drop-shadow(...)`).
- Clique no nó exibe um mini-tooltip/card no canto inferior do canvas contendo:
  - Identificador do nó (`ID`).
  - Rótulo/Nome principal.
  - Cargo/Tecnologia ou metadados associados.

### 2.3 Controles Avançados de Exportação
- Além do SVG e PNG (2x), inclua:
  - **PNG em Ultra-Definição (4K / 3x):** Para apresentações e relatórios executivos.
  - **Fundo Transparente vs. Fundo do Tema:** Alternador para exportar imagens com fundo transparente ou com a cor do tema ativo.
  - **Cópia Direta para a Área de Transferência:** Botão para copiar a imagem SVG/PNG direto para a memória (via `navigator.clipboard.write`).

---

## 🎓 3. MÓDULO DE DIDÁTICA: PLAYGROUND MCP & GUIA DE ONBOARDING

### 3.1 Playground Interativo de Ferramentas MCP
Crie uma nova aba/seção dedicada no estúdio: **"🧪 Playground MCP"**:
- **Seletor de Ferramenta:** Abas ou botões para as 4 ferramentas (`generate_mindmap`, `generate_orgchart`, `generate_architecture_diagram`, `generate_flowchart`).
- **Formulário Visual Rápido:** Campos simples para preencher títulos, ramos ou nós sem precisar escrever código manualmente.
- **Gerador de Prompt para IA:** Caixa com o prompt perfeito pronto para copiar e colar no Claude Desktop, Cursor ou Gemini (ex: *"Crie um organograma de engenharia com 3 níveis..."*).
- **Gerador de Payload JSON-RPC:** Caixa exibindo o JSON exato da tool call com botão de cópia rápida.
- **Botão "⚡ Testar no Estúdio":** Gera e renderiza o diagrama no estúdio local instantaneamente.

### 3.2 Tour Guiado de Onboarding na Primeira Visita
- Modal elegante e discreto de 3 passos explicando:
  1. *O que é o ArchView:* Servidor MCP local para diagramação rápida e sem custos de nuvem.
  2. *Como usar com IA:* Configure seu cliente MCP no Claude/Cursor e os diagramas aparecerão aqui automaticamente via SSE em tempo real.
  3. *Temas e Exportação:* Escolha entre os 4 temas (Educacional, Corporativo, Minimal e Dark) e baixe seus diagramas em alta resolução.
- Opção *"Não exibir novamente"* salva no `localStorage`.

---

## 📱 4. POLIMENTO DE UI/UX & RESPONSIVIDADE FLUIDA

1. **Paleta de Cores e Temas de Alto Contraste:**
   - **Dark Mode OLED:** Fundo `#0B0F19`, cartões `#111827`, bordas `#1F2937`, texto `#F9FAFB`.
   - **Corporate:** Fundo `#F8FAFC`, azul corporativo `#1E40AF`, bordas `#E2E8F0`.
   - **Educational:** Fundo `#FFFBEB`, tons quentes `#D97706`, nós suaves `#FEF3C7`.
   - **Minimal:** Fundo `#FFFFFF`, preto/cinza neutro `#18181B`.
2. **Responsividade Completa (Mobile/Tablet/Desktop):**
   - Header colapsável em telas menores que 768px.
   - Controles de canvas flutuantes e adaptados para toque (touch-friendly com áreas de toque de no mínimo 44x44px).
   - Drawer retrátil para navegação lateral em mobile.
3. **Atalhos de Teclado (Hotkeys):**
   - `Ctrl + 1` / `Ctrl + 2` / `Ctrl + 3` / `Ctrl + 4`: Alternar entre as 4 abas de diagramas.
   - `Ctrl + T`: Alternar ciclicamente entre os 4 temas.
   - `Ctrl + 0`: Resetar zoom e centralizar diagrama.
   - `Esc`: Fechar modais e painéis laterais.

---

## 🔒 5. REGRAS DE SEGURANÇA E ZERO DADOS PESSOAIS

1. **Nenhum Dado Pessoal:** NUNCA inclua caminhos locais de usuários (como `/home/...`), nomes reais ou segredos.
2. **Anti-Path Traversal:** Todas as gravações e leituras de arquivos DEVEM passar por `assertSafePath` em `src/utils/meta.ts`.
3. **Sem Travessão:** NUNCA use travessão (—). Use vírgula, dois-pontos ou parênteses no lugar.
4. **Respeito aos Gates:** Antes de finalizar, execute `npm run build` e `npm test` garantindo que todos os testes passem com 100% de sucesso.

---

## 🚀 6. PLANO DE EXECUÇÃO SUGERIDO

1. **Frontend:**
   - Atualizar `frontend/src/main.ts`, `frontend/index.html` e `frontend/src/styles.css` adicionando o Editor Split-View, o Playground MCP, o Tour de Onboarding e os atalhos de teclado.
   - Atualizar `frontend/src/export-helper.ts` com suporte a 4K e fundo transparente.
2. **Backend & Testes:**
   - Adicionar testes no `tests/tdd-unit.test.ts` e `tests/odd-observability.test.ts` cobrindo as novas funcionalidades.
   - Rodar `npm run build` e `npm test` para certificar que tudo compila e passa sem erros.
