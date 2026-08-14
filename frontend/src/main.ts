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

    async init() {
      applyCssTheme(this.activeTheme);
      await this.loadDiagrams();
      this.initSse();
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

    closeModal() {
      this.selectedDiagram = null;
      this.zoom = 1.0;
    },

    async renderSelectedDiagram() {
      if (!this.selectedDiagram || !this.selectedDiagram.content) return;
      const targetEl = document.getElementById('modal-render-target');
      if (!targetEl) return;

      this.isRendering = true;
      targetEl.innerHTML = '<div style="color:var(--text-muted);padding:2rem;">Renderizando diagrama...</div>';

      try {
        const themeConfig = THEMES[this.activeTheme] || THEMES.educational;
        mermaid.initialize({
          startOnLoad: false,
          securityLevel: 'loose',
          theme: themeConfig.mermaid.theme,
          themeVariables: themeConfig.mermaid.themeVariables
        });

        const uniqueId = `svg-main-${this.selectedDiagram.id}-${Date.now()}`;
        const cleanMermaid = this.selectedDiagram.content.replace(/```mermaid\n?/g, '').replace(/```/g, '').trim();
        const { svg } = await mermaid.render(uniqueId, cleanMermaid);

        targetEl.innerHTML = svg;
        const svgEl = targetEl.querySelector('svg');
        if (svgEl) {
          postProcessSvg(svgEl, this.activeTheme);
        }
      } catch (err: any) {
        targetEl.innerHTML = `<div style="color:#EF4444;padding:2rem;">Erro ao renderizar Mermaid: ${err.message}</div>`;
      } finally {
        this.isRendering = false;
      }
    },

    zoomIn() {
      this.zoom = Math.min(this.zoom + 0.15, 2.5);
    },

    zoomOut() {
      this.zoom = Math.max(this.zoom - 0.15, 0.4);
    },

    zoomReset() {
      this.zoom = 1.0;
    },

    async handleExportPng() {
      const svgEl = document.querySelector('#modal-render-target svg') as SVGElement;
      if (!svgEl || !this.selectedDiagram) return;
      await exportSvgToPng(svgEl, `${this.selectedDiagram.id}.png`, 2);
      this.showToast('PNG de alta resolução exportado com sucesso!');
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
