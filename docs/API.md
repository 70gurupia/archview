# 📚 Documentação das Ferramentas MCP (API Reference)

O **MCP Visual Server v2.0** expõe 5 ferramentas para clientes MCP (Claude Desktop, Cursor, Antigravity, etc.).

---

## 1. `generate_mindmap`
Gera mapas mentais radiais ou em árvore para estudos, aulas e documentação técnica.

### Input Schema
```json
{
  "central_topic": "string (obrigatório)",
  "description": "string (opcional)",
  "branches": [
    {
      "title": "string (obrigatório)",
      "icons": ["string (opcional)"],
      "sub_branches": ["array de strings ou sub-ramos"]
    }
  ],
  "style": {
    "palette": "educational | corporate | minimal | dark",
    "layout": "radial | tree-left | tree-right",
    "show_icons": "boolean"
  },
  "output_path": "string (opcional)"
}
```

---

## 2. `generate_orgchart`
Gera organogramas hierárquicos com validação de ciclos e estilos por nível.

### Input Schema
```json
{
  "title": "string (obrigatório)",
  "description": "string (opcional)",
  "nodes": [
    {
      "id": "string (obrigatório)",
      "label": "string (obrigatório)",
      "role": "string (obrigatório)",
      "department": "string (opcional)",
      "level": "number (0=C-level, 1=Gerente, 2=Lead, 3=Dev)",
      "reports_to": "string (id do supervisor ou null)",
      "metadata": {
        "team_size": "number",
        "email": "string"
      }
    }
  ],
  "style": {
    "color_by_level": "boolean",
    "show_metadata": "boolean",
    "layout": "vertical | horizontal",
    "palette": "educational | corporate | minimal | dark"
  },
  "output_path": "string (opcional)"
}
```

---

## 3. `generate_architecture_diagram`
Gera diagramas de arquitetura de software seguindo o Modelo C4 (C1 Contexto, C2 Container, C3 Componente).

### Input Schema
```json
{
  "c4_level": "C1-context | C2-container | C3-component | C4-code",
  "system_name": "string (obrigatório)",
  "description": "string (opcional)",
  "elements": [
    {
      "id": "string (obrigatório)",
      "type": "person | system | container | component | database | queue | external",
      "name": "string (obrigatório)",
      "description": "string (obrigatório)",
      "technology": "string (opcional)",
      "relationships": [
        {
          "target": "string (id do elemento alvo)",
          "description": "string",
          "technology": "string (opcional)"
        }
      ]
    }
  ],
  "style": {
    "show_technology": "boolean",
    "palette": "educational | corporate | minimal | dark"
  },
  "output_path": "string (opcional)"
}
```

---

## 4. `generate_flowchart`
Gera fluxogramas de processos lógicos e árvores de decisão.

### Input Schema
```json
{
  "title": "string (obrigatório)",
  "description": "string (opcional)",
  "steps": [
    {
      "id": "string (obrigatório)",
      "type": "start | end | process | decision | input | output | subprocess",
      "label": "string (obrigatório)",
      "next": ["ids ou objetos { id: string, label: string }"]
    }
  ],
  "style": {
    "direction": "TB | LR | BT | RL",
    "palette": "educational | corporate | minimal | dark"
  },
  "output_path": "string (opcional)"
}
```

---

## 5. `export_diagram`
Exporta diagramas Mermaid para SVG ou PNG.

### Input Schema
```json
{
  "source_path": "string (caminho do arquivo na pasta output/)",
  "target_format": "svg | png | pdf",
  "target_path": "string (opcional)",
  "options": {
    "scale": 2,
    "background": "string"
  }
}
```
