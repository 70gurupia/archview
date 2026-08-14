```mermaid
flowchart TD
  A(["Recebe Request (JSON)"]) --> B
  B["Valida Schema e Segurança"] --> C
  C{"Input Válido?"} -- "Sim" --> D\n  C{"Input Válido?"} -- "Não" --> G
  D["Gera Código Mermaid (Markdown)"] --> E
  E["Exporta (mmdc -> SVG/PNG)"] --> F
  F(["Retorna Preview + Caminho do Arquivo"])
  G(["Retorna Erro MCP"])

```