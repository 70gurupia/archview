# ArchView Tkinter Desktop Studio (`viewer-tk`)

Interface gráfica desktop nativa, rápida e leve desenvolvida em **Python 3 / Tkinter** para o **ArchView v7.1**.

---

## 🚀 Funcionalidades

1. **Galeria de Diagramas & Moléculas:** Visualização instantânea de diagramas Mermaid (`output/`) e abertura direta no navegador em HTML.
2. **Linter Arquitetural:** Execução visual da ferramenta `lint_architecture` com relatório de regras de Clean Architecture e violações em tempo real.
3. **Architecture Diff:** Comparador visual de arquiteturas entre duas pastas ou versões do projeto com score de desvio (*Drift Score*).
4. **Compressor LLM:** Geração de resumo estruturado em JSON (~2KB) com economia de mais de 99% de tokens de contexto.

---

## 📦 Como Executar

### 1. Via Script NPM (da raiz do projeto):
```bash
npm run gui:tk
```

### 2. Via Script dentro de `viewer-tk/`:
```bash
./viewer-tk/run.sh
```

### 3. Via Python Direto:
```bash
python3 viewer-tk/main.py
```
