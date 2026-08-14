# 📜 Regras de Execução do Jules para o Projeto ArchView

> Carregado para o agente Jules em todas as sessões e refatorações no repositório `70gurupia/archview`.

---

## 🎯 Princípio Central: Alto Desempenho Visual com Baixo Consumo de Recursos (Low-CPU/RAM)

O ambiente de execução local pode possuir hardware modesto. Todas as implementações no frontend e backend DEVEM seguir:
1. **Zero Virtual DOM pesado:** Manter a stack em Alpine.js (~15KB) e Vanilla CSS puro. Não instalar React, Next.js ou bibliotecas pesadas de animação.
2. **GPU Acceleration:** Animações e transformações de Zoom/Pan DEVEM utilizar `transform: translate3d(...)` e `scale(...)` aplicados diretamente no container SVG, NUNCA re-renderizando a sintaxe Mermaid a cada frame.
3. **Debounce em Edição:** No editor de código Mermaid, aplicar debounce de 350ms antes de disparar `mermaid.render()`.
4. **0% CPU em Idle:** Nenhuma animação em loop infinito com JavaScript (como `requestAnimationFrame` contínuo). Usar transições CSS acionadas apenas por eventos de hover/click.
5. **Acessibilidade de Movimento:** Respeitar estritamente `@media (prefers-reduced-motion: reduce)`.

---

## 🔒 Segurança e Privacidade (OWASP & Zero Dados Pessoais)

1. **Zero Dados Pessoais:** NUNCA incluir nomes de usuários locais (ex: caminhos `/home/...`), emails pessoais, senhas ou tokens no código, testes ou documentação.
2. **Anti-Path Traversal:** Toda manipulação de arquivo DEVE utilizar a função `assertSafePath` em `src/utils/meta.ts` para garantir que arquivos fiquem estritamente contidos em `output/`.
3. **Detecção de Ciclos:** Hierarquias em organogramas DEVEM passar pelo validador DFS (`detectCycle`) em `src/tools/orgchart.ts` antes de gerar a sintaxe.
4. **Sanitização de Sinks:** NUNCA injetar strings não tratadas em `innerHTML`.

---

## 🚦 Os 13 Gates Obrigatórios de Qualidade

Antes de considerar qualquer tarefa pronta, passe e valide:
1. `/ponytail`: Código enxuto, sem abstrações desnecessárias.
2. `/autoresearch`: Otimização máxima de tempo de resposta e consumo de memória.
3. `/improve`: Tratamento de edge cases e resiliência a inputs inválidos.
4. `/secure-code`: OWASP Proactive Controls presentes.
5. `/nlp-gate`: Português do Brasil com acentuação correta, sem travessões (usar vírgula, dois-pontos ou parênteses).
6. `/copy-gate`: Textos e tutoriais didáticos, objetivos e sem jargões confusos.
7. `/complexity-gate`: Complexidade ciclomática de funções inferior a 10.
8. `/dependency-structure`: 0 dependências circulares.
9. `/motion-gate`: Transições suaves com suporte a `prefers-reduced-motion`.
10. `/agent-security-audit`: Nenhuma permissão excessiva ou comando perigoso.
11. `/load-test`: API REST e SSE leves com latência inferior a 15ms.
12. `/e2e-testing`: Suíte completa passando via `npm test`.
13. `/ci-pipeline`: Builds do backend (`tsc`) e frontend (`vite build`) sem erros.
