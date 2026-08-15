import { DiagramMeta } from '../types/index.js';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Gera um arquivo HTML autocontido e interativo para um único diagrama.
 */
export function generateStandaloneDiagramHtml(meta: DiagramMeta, mermaidCode: string): string {
  const title = escapeHtml(meta.title || 'Diagrama ArchView');
  const description = escapeHtml(meta.description || 'Visualização interativa offline gerada pelo ArchView');
  const cleanCode = mermaidCode.trim();
  const jsonMeta = JSON.stringify(meta, null, 2);

  return `<!DOCTYPE html>
<html lang="pt-BR" data-theme="${meta.style?.suggested_theme || 'educational'}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} | ArchView</title>
  <style>
    :root {
      --bg-body: #0F172A;
      --bg-card: #1E293B;
      --bg-panel: #334155;
      --text-main: #F8FAFC;
      --text-muted: #94A3B8;
      --border-color: #475569;
      --accent-color: #38BDF8;
      --accent-hover: #0EA5E9;
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 16px;
      --shadow-lg: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
    }

    [data-theme="educational"] {
      --bg-body: #F0F9FF;
      --bg-card: #FFFFFF;
      --bg-panel: #E0F2FE;
      --text-main: #0C4A6E;
      --text-muted: #0284C7;
      --border-color: #BAE6FD;
      --accent-color: #0284C7;
      --accent-hover: #0369A1;
      --shadow-lg: 0 10px 25px -5px rgba(2, 132, 199, 0.15);
    }

    [data-theme="corporate"] {
      --bg-body: #F8FAFC;
      --bg-card: #FFFFFF;
      --bg-panel: #F1F5F9;
      --text-main: #0F172A;
      --text-muted: #64748B;
      --border-color: #CBD5E1;
      --accent-color: #2563EB;
      --accent-hover: #1D4ED8;
      --shadow-lg: 0 10px 25px -5px rgba(15, 23, 42, 0.1);
    }

    [data-theme="minimal"] {
      --bg-body: #FFFFFF;
      --bg-card: #FAFAFA;
      --bg-panel: #F4F4F5;
      --text-main: #18181B;
      --text-muted: #71717A;
      --border-color: #E4E4E7;
      --accent-color: #18181B;
      --accent-hover: #27272A;
      --shadow-lg: 0 4px 12px rgba(0,0,0,0.05);
    }

    [data-theme="dark"] {
      --bg-body: #090D16;
      --bg-card: #131B2E;
      --bg-panel: #1E293B;
      --text-main: #F1F5F9;
      --text-muted: #94A3B8;
      --border-color: #334155;
      --accent-color: #38BDF8;
      --accent-hover: #7DD3FC;
      --shadow-lg: 0 10px 25px -5px rgba(0, 0, 0, 0.7);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg-body);
      color: var(--text-main);
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
      transition: background-color 200ms ease, color 200ms ease;
    }

    header {
      background: var(--bg-card);
      border-bottom: 1px solid var(--border-color);
      padding: 0.75rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
    }

    .brand-title {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .brand-title h1 {
      font-size: 1.1rem;
      font-weight: 700;
    }

    .brand-title span {
      font-size: 0.8rem;
      color: var(--text-muted);
      background: var(--bg-panel);
      padding: 0.15rem 0.5rem;
      border-radius: var(--radius-sm);
    }

    .toolbar {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn {
      background: var(--bg-panel);
      color: var(--text-main);
      border: 1px solid var(--border-color);
      padding: 0.4rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      transition: all 150ms ease;
      font-weight: 500;
    }

    .btn:hover {
      background: var(--border-color);
      transform: translateY(-1px);
    }

    .btn.primary {
      background: var(--accent-color);
      color: #FFFFFF;
      border-color: var(--accent-color);
    }

    .btn.primary:hover {
      background: var(--accent-hover);
    }

    select.theme-select {
      background: var(--bg-panel);
      color: var(--text-main);
      border: 1px solid var(--border-color);
      padding: 0.4rem 0.6rem;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      cursor: pointer;
    }

    main {
      flex: 1;
      position: relative;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
      background-image: radial-gradient(var(--border-color) 1px, transparent 1px);
      background-size: 24px 24px;
      cursor: grab;
    }

    main:active {
      cursor: grabbing;
    }

    #viewport {
      transform-origin: 0 0;
      transition: transform 50ms ease-out;
      will-change: transform;
      user-select: none;
    }

    .meta-drawer {
      position: absolute;
      bottom: 1rem;
      left: 1rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.75rem 1rem;
      font-size: 0.75rem;
      color: var(--text-muted);
      box-shadow: var(--shadow-lg);
      max-width: 320px;
      z-index: 5;
      backdrop-filter: blur(8px);
    }

    .meta-drawer strong {
      color: var(--text-main);
    }

    .zoom-controls {
      position: absolute;
      bottom: 1rem;
      right: 1rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      display: flex;
      gap: 0.25rem;
      padding: 0.25rem;
      box-shadow: var(--shadow-lg);
      z-index: 5;
    }

    .toast {
      position: absolute;
      top: 4.5rem;
      right: 1.5rem;
      background: var(--accent-color);
      color: #FFFFFF;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 500;
      box-shadow: var(--shadow-lg);
      opacity: 0;
      transition: opacity 200ms ease;
      pointer-events: none;
      z-index: 20;
    }

    .toast.show {
      opacity: 1;
    }
  </style>
</head>
<body>

  <header>
    <div class="brand-title">
      <h1>${title}</h1>
      <span>${escapeHtml(meta.type)}</span>
    </div>

    <div class="toolbar">
      <select class="theme-select" id="themeSelect" onchange="changeTheme(this.value)">
        <option value="educational" ${meta.style?.suggested_theme === 'educational' ? 'selected' : ''}>🎓 Educacional</option>
        <option value="corporate" ${meta.style?.suggested_theme === 'corporate' ? 'selected' : ''}>🏢 Corporativo</option>
        <option value="minimal" ${meta.style?.suggested_theme === 'minimal' ? 'selected' : ''}>⚪ Minimalista</option>
        <option value="dark" ${meta.style?.suggested_theme === 'dark' ? 'selected' : ''}>🌑 Modo Escuro</option>
      </select>

      <button class="btn" onclick="copyMermaid()">📋 Copiar Mermaid</button>
      <button class="btn" onclick="exportSvg()">🖼️ Baixar SVG</button>
      <button class="btn primary" onclick="exportPng(2)">📸 Baixar PNG HD</button>
      <button class="btn primary" onclick="exportPng(4)">✨ PNG 4K</button>
    </div>
  </header>

  <main id="canvasContainer">
    <div id="viewport">
      <div id="diagramContainer" class="mermaid">
${cleanCode}
      </div>
    </div>

    <div class="meta-drawer">
      <div><strong>Descrição:</strong> ${description}</div>
      <div style="margin-top: 0.35rem;"><strong>Nós:</strong> ${meta.stats?.node_count || '-'} • <strong>Render:</strong> ${meta.stats?.generation_time_ms || 0}ms • <strong>Criado:</strong> ${new Date(meta.created_at).toLocaleDateString('pt-BR')}</div>
    </div>

    <div class="zoom-controls">
      <button class="btn" onclick="zoomIn()" title="Aumentar Zoom">🔍 +</button>
      <button class="btn" onclick="resetZoom()" title="Resetar">100%</button>
      <button class="btn" onclick="zoomOut()" title="Diminuir Zoom">🔍 -</button>
    </div>

    <div id="toast" class="toast">Código Mermaid copiado!</div>
  </main>

  <!-- Runtime Mermaid Standalone -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    const rawMermaidCode = ${JSON.stringify(cleanCode)};
    const metadata = ${jsonMeta};

    let zoom = 1.0;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let startX = 0;
    let startY = 0;

    const viewport = document.getElementById('viewport');
    const container = document.getElementById('canvasContainer');

    function updateTransform() {
      viewport.style.transform = \`translate(\${panX}px, \${panY}px) scale(\${zoom})\`;
    }

    function zoomIn() {
      zoom = Math.min(zoom * 1.25, 5.0);
      updateTransform();
    }

    function zoomOut() {
      zoom = Math.max(zoom / 1.25, 0.2);
      updateTransform();
    }

    function resetZoom() {
      zoom = 1.0;
      panX = 0;
      panY = 0;
      updateTransform();
    }

    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      zoom = Math.min(Math.max(zoom * factor, 0.2), 5.0);
      updateTransform();
    }, { passive: false });

    container.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isPanning = true;
      startX = e.clientX - panX;
      startY = e.clientY - panY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isPanning) return;
      panX = e.clientX - startX;
      panY = e.clientY - startY;
      updateTransform();
    });

    window.addEventListener('mouseup', () => {
      isPanning = false;
    });

    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    }

    function copyMermaid() {
      navigator.clipboard.writeText(rawMermaidCode).then(() => {
        showToast('✅ Código Mermaid copiado!');
      });
    }

    function changeTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      reRender();
    }

    function getMermaidThemeConfig(theme) {
      if (theme === 'dark') {
        return { theme: 'dark', themeVariables: { darkMode: true, background: '#131B2E' } };
      } else if (theme === 'corporate') {
        return { theme: 'neutral', themeVariables: { primaryColor: '#2563EB', primaryTextColor: '#FFFFFF' } };
      } else if (theme === 'minimal') {
        return { theme: 'base', themeVariables: { primaryColor: '#F4F4F5', primaryTextColor: '#18181B' } };
      }
      return { theme: 'default', themeVariables: { primaryColor: '#0284C7', primaryTextColor: '#FFFFFF' } };
    }

    async function reRender() {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'educational';
      const conf = getMermaidThemeConfig(currentTheme);
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        ...conf
      });

      const diagEl = document.getElementById('diagramContainer');
      diagEl.removeAttribute('data-processed');
      diagEl.textContent = rawMermaidCode;
      await mermaid.run({ nodes: [diagEl] });
    }

    function exportSvg() {
      const svg = document.querySelector('#diagramContainer svg');
      if (!svg) return;
      const serializer = new XMLSerializer();
      const blob = new Blob([serializer.serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = \`\${metadata.id || 'diagram'}.svg\`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('✅ SVG exportado com sucesso!');
    }

    function exportPng(scale = 2) {
      const svg = document.querySelector('#diagramContainer svg');
      if (!svg) return;

      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      const img = new Image();
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const bbox = svg.getBoundingClientRect();
        const width = (bbox.width || 800) * scale;
        const height = (bbox.height || 600) * scale;

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const currentTheme = document.documentElement.getAttribute('data-theme') || 'educational';
        ctx.fillStyle = currentTheme === 'dark' ? '#090D16' : '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (!blob) return;
          const pngUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = \`\${metadata.id || 'diagram'}_\${scale}x.png\`;
          a.click();
          URL.revokeObjectURL(pngUrl);
          showToast(\`✅ PNG \${scale === 4 ? '4K' : 'HD'} exportado!\`);
        }, 'image/png');
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }

    document.addEventListener('DOMContentLoaded', async () => {
      if (typeof mermaid !== 'undefined') {
        await reRender();
      }
    });
  </script>
</body>
</html>`;
}

/**
 * Gera um Dashboard Executivo Consolidado contendo todos os diagramas em uma única página navegável offline.
 */
export function generateDashboardHtml(diagrams: Array<{ meta: DiagramMeta; code: string }>): string {
  const jsonDiagrams = JSON.stringify(diagrams);

  return `<!DOCTYPE html>
<html lang="pt-BR" data-theme="corporate">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ArchView Executive Dashboard | Relatório Consolidado</title>
  <style>
    :root {
      --bg-body: #F8FAFC;
      --bg-card: #FFFFFF;
      --bg-panel: #F1F5F9;
      --text-main: #0F172A;
      --text-muted: #64748B;
      --border-color: #CBD5E1;
      --accent-color: #2563EB;
      --accent-hover: #1D4ED8;
      --radius-sm: 6px;
      --radius-md: 10px;
      --radius-lg: 16px;
      --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
      --shadow-md: 0 4px 6px -1px rgba(0,0,0,0.1);
      --shadow-lg: 0 10px 25px -5px rgba(15, 23, 42, 0.1);
    }

    [data-theme="dark"] {
      --bg-body: #090D16;
      --bg-card: #131B2E;
      --bg-panel: #1E293B;
      --text-main: #F1F5F9;
      --text-muted: #94A3B8;
      --border-color: #334155;
      --accent-color: #38BDF8;
      --accent-hover: #7DD3FC;
      --shadow-lg: 0 10px 25px -5px rgba(0, 0, 0, 0.7);
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: var(--bg-body);
      color: var(--text-main);
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    aside {
      width: 320px;
      background: var(--bg-card);
      border-right: 1px solid var(--border-color);
      display: flex;
      flex-direction: column;
      z-index: 10;
    }

    .aside-header {
      padding: 1.25rem;
      border-bottom: 1px solid var(--border-color);
    }

    .aside-header h1 {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text-main);
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .aside-search {
      padding: 0.75rem 1.25rem;
      border-bottom: 1px solid var(--border-color);
    }

    .search-input {
      width: 100%;
      background: var(--bg-panel);
      border: 1px solid var(--border-color);
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-sm);
      color: var(--text-main);
      font-size: 0.85rem;
      outline: none;
    }

    .diagram-list {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;
    }

    .diagram-item {
      padding: 0.75rem 1rem;
      border-radius: var(--radius-sm);
      margin-bottom: 0.25rem;
      cursor: pointer;
      transition: all 150ms ease;
      border: 1px solid transparent;
    }

    .diagram-item:hover {
      background: var(--bg-panel);
    }

    .diagram-item.active {
      background: var(--bg-panel);
      border-color: var(--accent-color);
    }

    .diagram-item-title {
      font-weight: 600;
      font-size: 0.85rem;
      margin-bottom: 0.2rem;
      color: var(--text-main);
    }

    .diagram-item-meta {
      font-size: 0.75rem;
      color: var(--text-muted);
      display: flex;
      justify-content: space-between;
    }

    main {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      position: relative;
    }

    header {
      background: var(--bg-card);
      border-bottom: 1px solid var(--border-color);
      padding: 0.75rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .canvas-area {
      flex: 1;
      position: relative;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
      background-image: radial-gradient(var(--border-color) 1px, transparent 1px);
      background-size: 24px 24px;
      cursor: grab;
    }

    .canvas-area:active {
      cursor: grabbing;
    }

    #viewport {
      transform-origin: 0 0;
      transition: transform 50ms ease-out;
      will-change: transform;
      user-select: none;
    }

    .btn {
      background: var(--bg-panel);
      color: var(--text-main);
      border: 1px solid var(--border-color);
      padding: 0.4rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      transition: all 150ms ease;
      font-weight: 500;
    }

    .btn:hover {
      background: var(--border-color);
    }

    .btn.primary {
      background: var(--accent-color);
      color: #FFFFFF;
      border-color: var(--accent-color);
    }

    .btn.primary:hover {
      background: var(--accent-hover);
    }
  </style>
</head>
<body>

  <aside>
    <div class="aside-header">
      <h1>📐 ArchView Dashboard</h1>
      <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 0.25rem;">Relatório Consolidado de Arquitetura</p>
    </div>

    <div class="aside-search">
      <input type="text" id="searchInput" class="search-input" placeholder="Buscar diagramas..." oninput="filterDiagrams(this.value)">
    </div>

    <div class="diagram-list" id="diagramList"></div>
  </aside>

  <main>
    <header>
      <div>
        <h2 id="currentTitle" style="font-size: 1.1rem;">Selecione um diagrama</h2>
        <p id="currentDesc" style="font-size: 0.8rem; color: var(--text-muted);"></p>
      </div>

      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <select class="search-input" style="width: auto; padding: 0.35rem 0.5rem;" onchange="changeTheme(this.value)">
          <option value="corporate">🏢 Corporativo</option>
          <option value="educational">🎓 Educacional</option>
          <option value="dark">🌑 Dark</option>
        </select>
        <button class="btn" onclick="copyMermaid()">📋 Copiar Código</button>
        <button class="btn primary" onclick="exportPng()">📸 Baixar PNG</button>
      </div>
    </header>

    <div class="canvas-area" id="canvasContainer">
      <div id="viewport">
        <div id="diagramContainer" class="mermaid"></div>
      </div>
    </div>
  </main>

  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    const diagrams = ${jsonDiagrams};
    let activeIndex = 0;
    let zoom = 1.0;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let startX = 0;
    let startY = 0;

    const viewport = document.getElementById('viewport');
    const container = document.getElementById('canvasContainer');

    function updateTransform() {
      viewport.style.transform = \`translate(\${panX}px, \${panY}px) scale(\${zoom})\`;
    }

    container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      zoom = Math.min(Math.max(zoom * factor, 0.2), 5.0);
      updateTransform();
    }, { passive: false });

    container.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      isPanning = true;
      startX = e.clientX - panX;
      startY = e.clientY - panY;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isPanning) return;
      panX = e.clientX - startX;
      panY = e.clientY - startY;
      updateTransform();
    });

    window.addEventListener('mouseup', () => { isPanning = false; });

    function renderList(filtered = diagrams) {
      const listEl = document.getElementById('diagramList');
      listEl.replaceChildren();
      filtered.forEach((d, idx) => {
        const item = document.createElement('div');
        item.className = \`diagram-item \${idx === activeIndex ? 'active' : ''}\`;
        item.onclick = () => selectDiagram(idx);

        const titleEl = document.createElement('div');
        titleEl.className = 'diagram-item-title';
        titleEl.textContent = d.meta.title;

        const metaEl = document.createElement('div');
        metaEl.className = 'diagram-item-meta';
        const typeSpan = document.createElement('span');
        typeSpan.textContent = d.meta.type;
        const nodeSpan = document.createElement('span');
        nodeSpan.textContent = \`\${d.meta.stats?.node_count || 0} nós\`;
        metaEl.appendChild(typeSpan);
        metaEl.appendChild(nodeSpan);

        item.appendChild(titleEl);
        item.appendChild(metaEl);
        listEl.appendChild(item);
      });
    }

    function filterDiagrams(q) {
      const filtered = diagrams.filter(d => 
        d.meta.title.toLowerCase().includes(q.toLowerCase()) || 
        d.meta.type.toLowerCase().includes(q.toLowerCase())
      );
      renderList(filtered);
    }

    async function selectDiagram(idx) {
      activeIndex = idx;
      renderList();
      const selected = diagrams[idx];
      if (!selected) return;

      document.getElementById('currentTitle').textContent = selected.meta.title;
      document.getElementById('currentDesc').textContent = selected.meta.description || '';

      const diagEl = document.getElementById('diagramContainer');
      diagEl.removeAttribute('data-processed');
      diagEl.textContent = selected.code;

      zoom = 1.0; panX = 0; panY = 0; updateTransform();
      await mermaid.run({ nodes: [diagEl] });
    }

    function changeTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      mermaid.initialize({ startOnLoad: false, theme: theme === 'dark' ? 'dark' : 'neutral' });
      selectDiagram(activeIndex);
    }

    function copyMermaid() {
      const code = diagrams[activeIndex]?.code || '';
      navigator.clipboard.writeText(code);
      alert('Código Mermaid copiado!');
    }

    function exportPng() {
      const svg = document.querySelector('#diagramContainer svg');
      if (!svg) return;
      const serializer = new XMLSerializer();
      const svgBlob = new Blob([serializer.serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width * 2 || 1600;
        canvas.height = img.height * 2 || 1200;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = \`\${diagrams[activeIndex]?.meta.id || 'diagram'}.png\`;
          a.click();
        });
      };
      img.src = url;
    }

    document.addEventListener('DOMContentLoaded', () => {
      mermaid.initialize({ startOnLoad: false, theme: 'neutral' });
      renderList();
      if (diagrams.length > 0) {
        selectDiagram(0);
      }
    });
  </script>
</body>
</html>`;
}
