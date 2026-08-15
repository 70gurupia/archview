import Alpine from 'alpinejs';
import mermaid from 'mermaid';
import { THEMES, applyCssTheme } from './themes.js';
import { postProcessSvg } from './post-processor.js';
import { exportSvgToPng, exportSvg, copyToClipboard } from './export-helper.js';

export interface DiagramItem {
  id: string;
  type: 'mindmap' | 'orgchart' | 'architecture' | 'flowchart' | string;
  title: string;
  description?: string;
  created_at: string;
  updated_at?: string;
  content: string;
  stats?: {
    node_count?: number;
    max_depth?: number;
    generation_time_ms?: number;
  };
  style?: {
    suggested_theme?: string;
    applied_theme?: string | null;
  };
  tags?: string[];
}

// Initial mermaid setup
mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'loose',
  suppressErrorRendering: true
});

document.addEventListener('alpine:init', () => {
  Alpine.data('visualApp', () => ({
    diagrams: [] as DiagramItem[],
    activeTab: 'all',
    searchQuery: '',
    selectedDiagram: null as DiagramItem | null,
    activeTheme: 'educational',
    zoom: 1.0,
    toastMessage: null as string | null,
    toastTimeout: undefined as ReturnType<typeof setTimeout> | undefined,
    sseStatus: 'connecting' as 'connected' | 'connecting' | 'disconnected',
    isRendering: false,

    // New states
    showOnboarding: false,
    neverShowOnboarding: false,
    playgroundTool: 'mindmap',
    playgroundTitle: '',
    playgroundDesc: '',
    editorMode: false,
    editorContent: '',
    syntaxError: false,
    exportTransparent: false,

    // Codebase Explorer v3.0
    codebaseScanPath: '.',
    codebaseTargetSymbol: '',
    codebaseLoading: false,

    // Pan & Zoom
    panX: 0,
    panY: 0,
    isPanning: false,
    startX: 0,
    startY: 0,

    // Inspector
    inspectedNode: null as { id: string, label: string, metadata?: string } | null,

    async init() {
      applyCssTheme(this.activeTheme);
      await this.loadDiagrams();
      this.initSse();

      const tourSeen = localStorage.getItem('archview_tour_seen');
      if (!tourSeen) {
        this.showOnboarding = true;
      }
    },

    async loadDiagrams() {
      try {
        const res = await fetch('/api/diagrams');
        if (res.ok) {
          this.diagrams = await res.json();
          this.$nextTick(() => {
            this.renderThumbnails();
          });
        }
      } catch (err) {
        console.error('Erro ao carregar diagramas:', err);
      }
    },

    initSse() {
      try {
        const eventSource = new EventSource('/events');

        eventSource.onopen = () => {
          this.sseStatus = 'connected';
        };

        eventSource.addEventListener('diagram.created', async (e: MessageEvent) => {
          const newDiag = JSON.parse(e.data);
          this.showToast(`Novo diagrama gerado: ${newDiag.title}`);
          await this.loadDiagrams();
        });

        eventSource.addEventListener('diagram.updated', async (e: MessageEvent) => {
          const updated = JSON.parse(e.data);
          this.showToast(`Diagrama atualizado: ${updated.id}`);
          await this.loadDiagrams();
        });

        eventSource.onerror = () => {
          this.sseStatus = 'disconnected';
        };
      } catch {
        this.sseStatus = 'disconnected';
      }
    },

    get filteredDiagrams(): DiagramItem[] {
      return this.diagrams.filter(diag => {
        const matchesTab = this.activeTab === 'all' || diag.type === this.activeTab;
        const matchesSearch = !this.searchQuery || 
          diag.title.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
          (diag.description && diag.description.toLowerCase().includes(this.searchQuery.toLowerCase()));
        return matchesTab && matchesSearch;
      });
    },

    setTab(tab: string) {
      this.activeTab = tab;
      this.$nextTick(() => {
        this.renderThumbnails();
      });
    },

    setTheme(themeId: string) {
      this.activeTheme = themeId;
      applyCssTheme(themeId);
      if (this.selectedDiagram) {
        this.renderSelectedDiagram();
      }
      this.$nextTick(() => {
        this.renderThumbnails();
      });
    },

    async renderThumbnails() {
      const themeConfig = THEMES[this.activeTheme] || THEMES.educational;
      
      for (const diag of this.filteredDiagrams) {
        const el = document.getElementById(`thumb-${diag.id}`);
        if (!el || !diag.content) continue;

        try {
          mermaid.initialize({
            startOnLoad: false,
            securityLevel: 'loose',
            theme: themeConfig.mermaid.theme,
            themeVariables: themeConfig.mermaid.themeVariables
          });

          const uniqueId = `svg-thumb-${diag.id}-${Date.now()}`;
          const cleanMermaid = diag.content.replace(/```mermaid\n?/g, '').replace(/```/g, '').trim();
          const { svg } = await mermaid.render(uniqueId, cleanMermaid);
          el.innerHTML = svg;

          const svgEl = el.querySelector('svg');
          if (svgEl) {
            postProcessSvg(svgEl, this.activeTheme);
          }
        } catch {
          el.innerHTML = `<span style="font-size:0.8rem;color:var(--text-muted);">Prévia indisponível</span>`;
        }
      }
    },

    selectDiagram(diag: DiagramItem) {
      this.selectedDiagram = diag;
      this.zoom = 1.0;
      if (diag.style?.suggested_theme && THEMES[diag.style.suggested_theme]) {
        this.activeTheme = diag.style.suggested_theme;
        applyCssTheme(this.activeTheme);
      }
      this.$nextTick(() => {
        this.renderSelectedDiagram();
      });
    },

    closeModals() {
      this.selectedDiagram = null;
      this.zoom = 1.0;
      this.panX = 0;
      this.panY = 0;
      this.editorMode = false;
    },

    closeOnboarding() {
      this.showOnboarding = false;
      if (this.neverShowOnboarding) {
        localStorage.setItem('archview_tour_seen', 'true');
      }
    },

    cycleTheme() {
      const themes = ['educational', 'corporate', 'minimal', 'dark'];
      const idx = themes.indexOf(this.activeTheme);
      this.setTheme(themes[(idx + 1) % themes.length]);
    },

    toggleEditorMode() {
      this.editorMode = !this.editorMode;
      if (this.editorMode && this.selectedDiagram) {
        this.editorContent = this.selectedDiagram.content;
      }
    },

    insertTab(e: Event) {
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      this.editorContent = this.editorContent.substring(0, start) + "  " + this.editorContent.substring(end);
      this.$nextTick(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      });
    },

    async saveEditedDiagram() {
      if (!this.selectedDiagram) return;
      try {
        const res = await fetch(`/api/diagrams/${this.selectedDiagram.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: this.editorContent })
        });

        if (res.ok) {
          this.selectedDiagram.content = this.editorContent;
          this.showToast('Alterações salvas localmente!');
          await this.loadDiagrams();
        } else {
          this.showToast('Erro ao salvar no servidor.');
        }
      } catch (err) {
        this.showToast('Erro na conexão ao salvar.');
      }
    },


    async renderSelectedDiagram(fromEditor = false) {
      const contentToRender = fromEditor ? this.editorContent : (this.selectedDiagram?.content || '');
      if (!contentToRender) return;
      const targetEl = document.getElementById('modal-render-target');
      if (!targetEl) return;

      this.isRendering = true;
      if (!fromEditor) {
        targetEl.innerHTML = '<div style="color:var(--text-muted);padding:2rem;">Renderizando diagrama...</div>';
      }

      try {
        const themeConfig = THEMES[this.activeTheme] || THEMES.educational;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: themeConfig.mermaid.theme,
          themeVariables: themeConfig.mermaid.themeVariables
        });

        const uniqueId = `svg-main-${this.selectedDiagram?.id || 'editor'}-${Date.now()}`;
        const cleanMermaid = contentToRender.replace(/```mermaid\n?/g, '').replace(/```/g, '').trim();

        // Parse before render to catch errors without breaking UI
        await mermaid.parse(cleanMermaid);
        this.syntaxError = false;

        const { svg } = await mermaid.render(uniqueId, cleanMermaid);

        targetEl.innerHTML = svg;
        const svgEl = targetEl.querySelector('svg');
        if (svgEl) {
          postProcessSvg(svgEl, this.activeTheme);
          this.bindNodeEvents(svgEl);
        }
      } catch (err: any) {
        this.syntaxError = true;
        if (!fromEditor) {
          targetEl.innerHTML = `<div style="color:#EF4444;padding:2rem;">Erro ao renderizar Mermaid: ${err.message}</div>`;
        }
      } finally {
        this.isRendering = false;
      }
    },

    bindNodeEvents(svgEl: SVGElement) {
      const nodes = svgEl.querySelectorAll('.node');
      nodes.forEach(node => {
        // Apply hover effects via JS or just CSS class, let's use events for tooltip
        (node as HTMLElement).addEventListener('mouseenter', (e) => {
           const id = node.id || 'N/A';
           const labelEl = node.querySelector('.nodeLabel') || node.querySelector('.label');
           const label = labelEl ? labelEl.textContent || 'N/A' : 'N/A';
           // Find any title tag for metadata
           const titleEl = node.querySelector('title');
           const meta = titleEl ? titleEl.textContent : undefined;

           this.inspectedNode = { id, label, metadata: meta || undefined };

           // Highlight
           const rectOrCircle = node.querySelector('rect, circle, polygon, path');
           if(rectOrCircle) {
             (rectOrCircle as HTMLElement).style.strokeWidth = '3px';
             (rectOrCircle as HTMLElement).style.filter = 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))';
           }
        });

        (node as HTMLElement).addEventListener('mouseleave', (e) => {
           this.inspectedNode = null;
           // Remove highlight
           const rectOrCircle = node.querySelector('rect, circle, polygon, path');
           if(rectOrCircle) {
             (rectOrCircle as HTMLElement).style.strokeWidth = '';
             (rectOrCircle as HTMLElement).style.filter = '';
           }
        });
      });
    },

    zoomIn() {
      this.zoom = Math.min(this.zoom + 0.15, 2.5);
    },

    zoomOut() {
      this.zoom = Math.max(this.zoom - 0.15, 0.4);
    },

    zoomReset() {
      this.zoom = 1.0;
      this.panX = 0;
      this.panY = 0;
    },

    handleWheel(e: WheelEvent) {
      if (e.ctrlKey) {
        if (e.deltaY > 0) this.zoomOut();
        else this.zoomIn();
      } else {
        this.panX -= e.deltaX;
        this.panY -= e.deltaY;
      }
    },

    startPan(e: MouseEvent) {
      this.isPanning = true;
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
    },

    doPan(e: MouseEvent) {
      if (!this.isPanning) return;
      this.panX = e.clientX - this.startX;
      this.panY = e.clientY - this.startY;
    },

    endPan() {
      this.isPanning = false;
    },

    async handleExportPng(scale = 2) {
      const svgEl = document.querySelector('#modal-render-target svg') as SVGElement;
      if (!svgEl || !this.selectedDiagram) return;
      const bg = this.exportTransparent ? 'transparent' : undefined;
      await exportSvgToPng(svgEl, `${this.selectedDiagram.id}.png`, scale, bg);
      this.showToast(`PNG (${scale}x) exportado com sucesso!`);
    },

    async handleCopyImage() {
       const svgEl = document.querySelector('#modal-render-target svg') as SVGElement;
       if (!svgEl) return;
       // Calling the new helper
       const bg = this.exportTransparent ? 'transparent' : undefined;
       const { exportSvgToClipboard } = await import('./export-helper.js');
       const success = await exportSvgToClipboard(svgEl, bg);
       if (success) {
         this.showToast('Imagem copiada para a área de transferência!');
       } else {
         this.showToast('Erro ao copiar imagem.');
       }
    },

    handleExportSvg() {
      const svgEl = document.querySelector('#modal-render-target svg') as SVGElement;
      if (!svgEl || !this.selectedDiagram) return;
      exportSvg(svgEl, `${this.selectedDiagram.id}.svg`);
      this.showToast('SVG vetorial exportado com sucesso!');
    },

    async handleCopyMarkdown() {
      if (!this.selectedDiagram || !this.selectedDiagram.content) return;
      const clean = this.selectedDiagram.content.replace(/```mermaid\n?/g, '').replace(/```/g, '').trim();
      const markdown = '```mermaid\n' + clean + '\n```';
      const success = await copyToClipboard(markdown);
      if (success) {
        this.showToast('Código Mermaid copiado para a área de transferência!');
      }
    },

    showToast(msg: string) {
      this.toastMessage = msg;
      if (this.toastTimeout) clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => {
        this.toastMessage = null;
      }, 3000);
    },

    formatDate(dateStr: string) {
      try {
        return new Date(dateStr).toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch {
        return dateStr;
      }
    },

    async copyText(text: string) {
      const success = await copyToClipboard(text);
      if (success) this.showToast('Copiado para a área de transferência!');
    },

    getPlaygroundPrompt() {
      const tool = this.playgroundTool;
      const title = this.playgroundTitle || 'Exemplo';
      const desc = this.playgroundDesc || 'Item 1, Item 2';

      if (tool === 'mindmap') {
        return `Gere um mapa mental com o tópico central "${title}" e os ramos: ${desc}.`;
      } else if (tool === 'orgchart') {
        return `Crie um organograma para a empresa/departamento "${title}" incluindo: ${desc}.`;
      } else if (tool === 'architecture') {
        return `Desenhe um diagrama de arquitetura C4 (nível C2) para o sistema "${title}" com os seguintes componentes: ${desc}.`;
      } else {
         return `Crie um fluxograma para o processo "${title}" com os passos: ${desc}.`;
      }
    },

    getPlaygroundPayload() {
      const tool = this.playgroundTool;
      const title = this.playgroundTitle || 'Exemplo';

      let args = {};
      if (tool === 'mindmap') {
        args = { central_topic: title, branches: [{ title: 'Exemplo', sub_branches: ['Sub'] }] };
      } else if (tool === 'orgchart') {
        args = { title, nodes: [{ id: 'ceo', label: 'CEO', role: 'Exec' }] };
      } else if (tool === 'architecture') {
        args = { c4_level: 'C2-container', system_name: title, elements: [] };
      } else {
        args = { title, steps: [{ id: 'start', type: 'start', label: 'Inicio' }] };
      }

      return JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: tool,
        params: args
      }, null, 2);
    },

    async scanCodebaseTopology() {
      this.codebaseLoading = true;
      try {
        const res = await fetch('/api/codebase/scan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: this.codebaseScanPath })
        });
        const data = await res.json();
        if (data.success) {
          await this.loadDiagrams();
          this.setTab('architecture');
          this.showToast('✅ Topologia C4 mapeada com sucesso!');
        } else {
          this.showToast(`❌ Erro: ${data.error}`);
        }
      } catch (err: any) {
        this.showToast(`❌ Falha na requisição: ${err.message}`);
      } finally {
        this.codebaseLoading = false;
      }
    },

    async traceSymbolCallGraph() {
      if (!this.codebaseTargetSymbol) return;
      this.codebaseLoading = true;
      try {
        const res = await fetch('/api/codebase/trace-call', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            path: this.codebaseScanPath,
            symbol_name: this.codebaseTargetSymbol
          })
        });
        const data = await res.json();
        if (data.success) {
          await this.loadDiagrams();
          this.setTab('flowchart');
          this.showToast(`✅ Grafo de chamadas de "${this.codebaseTargetSymbol}" gerado!`);
        } else {
          this.showToast(`❌ Erro: ${data.error}`);
        }
      } catch (err: any) {
        this.showToast(`❌ Falha na requisição: ${err.message}`);
      } finally {
        this.codebaseLoading = false;
      }
    },

    getTabEmoji(type: string) {
      switch (type) {
        case 'mindmap': return '🧠';
        case 'orgchart': return '🏢';
        case 'architecture': return '📐';
        case 'flowchart': return '🔄';
        default: return '📊';
      }
    }
  }));
});

Alpine.start();
