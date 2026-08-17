export const STANDALONE_HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="pt-BR" data-theme="__THEME__">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>__TITLE__ | ArchView</title>
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
      color: var(--text-main);
    }

    .brand-title span {
      font-size: 0.75rem;
      padding: 0.2rem 0.5rem;
      border-radius: var(--radius-sm);
      background: var(--bg-panel);
      color: var(--accent-color);
      font-weight: 600;
      text-transform: uppercase;
    }

    .toolbar {
      display: flex;
      gap: 0.5rem;
      align-items: center;
    }

    .theme-select {
      background: var(--bg-panel);
      color: var(--text-main);
      border: 1px solid var(--border-color);
      padding: 0.35rem 0.65rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      cursor: pointer;
      outline: none;
    }

    .btn {
      background: var(--bg-panel);
      color: var(--text-main);
      border: 1px solid var(--border-color);
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      transition: all 150ms ease;
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

    main {
      flex: 1;
      position: relative;
      overflow: hidden;
      cursor: grab;
      display: flex;
      justify-content: center;
      align-items: center;
      background: var(--bg-body);
    }

    main:active {
      cursor: grabbing;
    }

    #viewport {
      transform-origin: center center;
      transition: transform 50ms ease-out;
      will-change: transform;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 3rem;
      min-width: 100%;
      min-height: 100%;
    }

    #diagramContainer {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
    }

    #diagramContainer svg {
      max-width: none !important;
      height: auto;
    }

    .floating-controls {
      position: absolute;
      bottom: 1.5rem;
      right: 1.5rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 0.5rem;
      display: flex;
      gap: 0.35rem;
      box-shadow: var(--shadow-lg);
      z-index: 20;
    }

    .zoom-btn {
      background: var(--bg-panel);
      color: var(--text-main);
      border: 1px solid var(--border-color);
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      cursor: pointer;
    }

    .zoom-btn:hover {
      background: var(--border-color);
    }

    .meta-drawer {
      position: absolute;
      bottom: 1.5rem;
      left: 1.5rem;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: var(--radius-md);
      padding: 1rem;
      max-width: 380px;
      box-shadow: var(--shadow-lg);
      z-index: 20;
      font-size: 0.85rem;
    }

    .meta-drawer h3 {
      font-size: 0.95rem;
      margin-bottom: 0.35rem;
      color: var(--text-main);
    }

    .meta-drawer p {
      color: var(--text-muted);
      margin-bottom: 0.5rem;
      line-height: 1.4;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 0.3rem;
    }

    .tag {
      background: var(--bg-panel);
      color: var(--accent-color);
      padding: 0.15rem 0.4rem;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .toast {
      position: fixed;
      top: 1rem;
      left: 50%;
      transform: translateX(-50%) translateY(-100px);
      background: var(--bg-card);
      color: var(--text-main);
      border: 1px solid var(--accent-color);
      padding: 0.75rem 1.5rem;
      border-radius: var(--radius-md);
      box-shadow: var(--shadow-lg);
      font-size: 0.9rem;
      font-weight: 600;
      transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 100;
    }

    .toast.show {
      transform: translateX(-50%) translateY(0);
    }
  </style>
  __SCRIPT_TAG__
</head>
<body>
  <div id="toast" class="toast">Notificação</div>

  <header>
    <div class="brand-title">
      <h1>__TITLE__</h1>
      <span>Offline Ready</span>
    </div>

    <div class="toolbar">
      <select id="themeSelector" class="theme-select" onchange="changeTheme(this.value)">
        <option value="educational">Tema Educacional</option>
        <option value="corporate">Tema Corporativo</option>
        <option value="minimal">Tema Minimalista</option>
        <option value="dark">Tema Dark Modern</option>
      </select>

      <button class="btn" onclick="copyMermaidCode()">
        📋 Copiar Mermaid
      </button>

      <button class="btn" onclick="exportSvg()">
        🖼️ Baixar SVG
      </button>

      <button class="btn primary" onclick="exportPng(2)">
        ⚡ PNG HD
      </button>

      <button class="btn" onclick="exportPng(4)">
        💎 PNG 4K
      </button>
    </div>
  </header>

  <main id="mainContainer">
    <div id="viewport">
      <div id="diagramContainer">
        <!-- Rendered Mermaid SVG injected here -->
      </div>
    </div>

    <div class="floating-controls">
      <button class="zoom-btn" onclick="zoomIn()" title="Zoom In">+</button>
      <button class="zoom-btn" onclick="zoomOut()" title="Zoom Out">-</button>
      <button class="zoom-btn" onclick="resetZoom()" title="Reset">⟲</button>
    </div>

    <div class="meta-drawer">
      <h3>__TITLE__</h3>
      <p>__DESCRIPTION__</p>
      <div class="tags" id="tagList"></div>
    </div>
  </main>

  <script id="diagram-metadata" type="application/json">
__JSON_META__
  </script>

  <script id="diagram-code" type="text/plain">
__CLEAN_CODE__
  </script>

  <script>
    const metadata = JSON.parse(document.getElementById('diagram-metadata').textContent);
    const rawMermaidCode = document.getElementById('diagram-code').textContent.trim();

    let zoom = 1.0;
    let panX = 0;
    let panY = 0;
    let isPanning = false;
    let startX = 0;
    let startY = 0;

    const viewport = document.getElementById('viewport');
    const mainEl = document.getElementById('mainContainer');
    const themeSelect = document.getElementById('themeSelector');

    if (metadata.style && metadata.style.suggested_theme) {
      themeSelect.value = metadata.style.suggested_theme;
    }

    if (metadata.tags && Array.isArray(metadata.tags)) {
      const tagList = document.getElementById('tagList');
      metadata.tags.forEach(t => {
        const span = document.createElement('span');
        span.className = 'tag';
        span.textContent = '#' + t;
        tagList.appendChild(span);
      });
    }

    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2500);
    }

    function updateTransform() {
      viewport.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + zoom + ')';
    }

    function adjustZoom(factor) {
      zoom = Math.min(Math.max(zoom * factor, 0.1), 10.0);
      updateTransform();
    }

    function zoomIn() {
      adjustZoom(1.2);
    }

    function zoomOut() {
      adjustZoom(0.8);
    }

    function resetZoom() {
      resetTransform();
    }

    function resetTransform() {
      zoom = 1.0;
      panX = 0;
      panY = 0;
      updateTransform();
    }

    mainEl.addEventListener('wheel', (e) => {
      e.preventDefault();
      const factor = e.deltaY < 0 ? 1.1 : 0.9;
      zoom = Math.min(Math.max(zoom * factor, 0.1), 10.0);
      updateTransform();
    }, { passive: false });

    mainEl.addEventListener('mousedown', (e) => {
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

    function changeTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      reRender();
    }

    function copyMermaidCode() {
      navigator.clipboard.writeText(rawMermaidCode).then(() => {
        showToast('📋 Código Mermaid copiado para o clipboard!');
      });
    }

    function getMermaidApi() {
      if (typeof mermaid !== 'undefined' && typeof mermaid.render === 'function') return mermaid;
      if (typeof mermaid !== 'undefined' && mermaid.default && typeof mermaid.default.render === 'function') return mermaid.default;
      if (typeof globalThis.mermaid !== 'undefined' && typeof globalThis.mermaid.render === 'function') return globalThis.mermaid;
      if (typeof globalThis.mermaid !== 'undefined' && globalThis.mermaid.default && typeof globalThis.mermaid.default.render === 'function') return globalThis.mermaid.default;
      return null;
    }

    async function reRender() {
      const mermaidApi = getMermaidApi();
      const diagEl = document.getElementById('diagramContainer');
      if (!mermaidApi) {
        console.error('Mermaid runtime não encontrado');
        if (diagEl) {
          diagEl.replaceChildren();
          const errBox = document.createElement('div');
          errBox.style.cssText = 'color: #EF4444; padding: 1.5rem; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color); font-family: monospace;';
          errBox.textContent = '⚠️ Biblioteca Mermaid não carregada corretamente no navegador.';
          diagEl.appendChild(errBox);
        }
        return;
      }

      const currentTheme = document.documentElement.getAttribute('data-theme') || 'educational';
      let mermaidTheme = 'default';
      if (currentTheme === 'dark') mermaidTheme = 'dark';
      else if (currentTheme === 'corporate') mermaidTheme = 'neutral';
      else if (currentTheme === 'minimal') mermaidTheme = 'base';

      mermaidApi.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: mermaidTheme,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
      });

      try {
        const id = 'mermaidSvg_' + Math.random().toString(36).substring(2, 9);
        const { svg } = await mermaidApi.render(id, rawMermaidCode);
        const parser = new DOMParser();
        const doc = parser.parseFromString(svg, 'image/svg+xml');
        diagEl.replaceChildren(doc.documentElement);
      } catch (err) {
        console.error('Erro ao renderizar Mermaid:', err);
        diagEl.replaceChildren();
        const errBox = document.createElement('div');
        errBox.style.cssText = 'color: #EF4444; padding: 1.5rem; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color); font-family: monospace;';
        errBox.textContent = '⚠️ Erro de renderização Mermaid: ' + (err && err.message ? err.message : err);
        diagEl.appendChild(errBox);
      }
    }

    function exportSvg() {
      const svg = document.querySelector('#diagramContainer svg');
      if (!svg) return;
      const serializer = new XMLSerializer();
      const blob = new Blob([serializer.serializeToString(svg)], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (metadata.id || 'diagram') + '.svg';
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
          a.download = (metadata.id || 'diagram') + '_' + scale + 'x.png';
          a.click();
          URL.revokeObjectURL(pngUrl);
          showToast('✅ PNG ' + (scale === 4 ? '4K' : 'HD') + ' exportado!');
        }, 'image/png');
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }

    function init() {
      reRender();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  </script>
</body>
</html>`;

export const DASHBOARD_HTML_TEMPLATE = `<!DOCTYPE html>
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
      padding: 0.5rem 0.75rem;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-color);
      background: var(--bg-panel);
      color: var(--text-main);
      font-size: 0.85rem;
      outline: none;
    }

    .diagram-list {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .diagram-item {
      padding: 0.75rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      transition: background 150ms ease;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .diagram-item:hover {
      background: var(--bg-panel);
    }

    .diagram-item.active {
      background: var(--accent-color);
      color: #FFFFFF;
    }

    .diagram-item.active .diagram-item-meta {
      color: rgba(255, 255, 255, 0.8);
    }

    .diagram-item-title {
      font-weight: 600;
      font-size: 0.9rem;
    }

    .diagram-item-meta {
      font-size: 0.75rem;
      color: var(--text-muted);
      display: flex;
      gap: 0.5rem;
    }

    main {
      flex: 1;
      display: flex;
      flex-direction: column;
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

    .header-info h2 {
      font-size: 1.1rem;
      font-weight: 700;
    }

    .header-info p {
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .header-actions {
      display: flex;
      gap: 0.5rem;
    }

    .btn {
      background: var(--bg-panel);
      color: var(--text-main);
      border: 1px solid var(--border-color);
      padding: 0.35rem 0.75rem;
      border-radius: var(--radius-sm);
      font-size: 0.85rem;
      cursor: pointer;
    }

    .canvas-container {
      flex: 1;
      overflow: hidden;
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: grab;
      background: var(--bg-body);
    }

    .canvas-container:active {
      cursor: grabbing;
    }

    #viewport {
      display: flex;
      justify-content: center;
      align-items: center;
      min-width: 100%;
      min-height: 100%;
      padding: 3rem;
      transform-origin: center center;
      transition: transform 50ms ease-out;
    }

    #diagramContainer {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 100%;
      height: 100%;
    }

    #diagramContainer svg {
      max-width: none !important;
      height: auto;
    }
  </style>
  __SCRIPT_TAG__
</head>
<body>
  <aside>
    <div class="aside-header">
      <h1>📊 Executive Dashboard</h1>
    </div>
    <div class="aside-search">
      <input type="text" class="search-input" placeholder="🔍 Filtrar diagramas..." oninput="filterDiagrams(this.value)" />
    </div>
    <div class="diagram-list" id="diagramList"></div>
  </aside>

  <main>
    <header>
      <div class="header-info">
        <h2 id="currentTitle">Carregando Diagrama...</h2>
        <p id="currentDesc">Visualização consolidada de arquitetura e processos</p>
      </div>
      <div class="header-actions">
        <button class="btn" onclick="copyMermaid()">📋 Copiar Código</button>
        <button class="btn" onclick="exportPng()">🖼️ Exportar PNG</button>
      </div>
    </header>

    <div class="canvas-container" id="canvasContainer">
      <div id="viewport">
        <div id="diagramContainer"></div>
      </div>
    </div>
  </main>

  <script>
    const diagrams = __JSON_DIAGRAMS__;
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
      viewport.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + zoom + ')';
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

    function getMermaidApi() {
      if (typeof mermaid !== 'undefined' && typeof mermaid.render === 'function') return mermaid;
      if (typeof mermaid !== 'undefined' && mermaid.default && typeof mermaid.default.render === 'function') return mermaid.default;
      if (typeof globalThis.mermaid !== 'undefined' && typeof globalThis.mermaid.render === 'function') return globalThis.mermaid;
      if (typeof globalThis.mermaid !== 'undefined' && globalThis.mermaid.default && typeof globalThis.mermaid.default.render === 'function') return globalThis.mermaid.default;
      return null;
    }

    function renderList(filtered = diagrams) {
      const listEl = document.getElementById('diagramList');
      listEl.replaceChildren();
      filtered.forEach((d) => {
        const realIdx = diagrams.indexOf(d);
        const item = document.createElement('div');
        item.className = 'diagram-item ' + (realIdx === activeIndex ? 'active' : '');
        item.onclick = () => selectDiagram(realIdx);

        const titleEl = document.createElement('div');
        titleEl.className = 'diagram-item-title';
        titleEl.textContent = d.meta.title;

        const metaEl = document.createElement('div');
        metaEl.className = 'diagram-item-meta';
        const typeSpan = document.createElement('span');
        typeSpan.textContent = d.meta.type;
        const nodeSpan = document.createElement('span');
        nodeSpan.textContent = (d.meta.stats?.node_count || 0) + ' nós';
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
      zoom = 1.0; panX = 0; panY = 0; updateTransform();

      const mermaidApi = getMermaidApi();
      if (!mermaidApi) {
        console.error('Mermaid runtime não disponível no dashboard.');
        if (diagEl) {
          diagEl.replaceChildren();
          const errBox = document.createElement('div');
          errBox.style.cssText = 'color: #EF4444; padding: 1.5rem; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color); font-family: monospace;';
          errBox.textContent = '⚠️ Biblioteca Mermaid não carregada corretamente no navegador.';
          diagEl.appendChild(errBox);
        }
        return;
      }

      const currentTheme = document.documentElement.getAttribute('data-theme') || 'corporate';
      mermaidApi.initialize({
        startOnLoad: false,
        securityLevel: 'loose',
        theme: currentTheme === 'dark' ? 'dark' : (currentTheme === 'educational' ? 'default' : 'neutral')
      });

      try {
        const id = 'dashMermaidSvg_' + Math.random().toString(36).substring(2, 9);
        const { svg } = await mermaidApi.render(id, selected.code);
        const parser = new DOMParser();
        const doc = parser.parseFromString(svg, 'image/svg+xml');
        diagEl.replaceChildren(doc.documentElement);
      } catch (err) {
        console.error('Erro ao renderizar Mermaid:', err);
        diagEl.replaceChildren();
        const errBox = document.createElement('div');
        errBox.style.cssText = 'color: #EF4444; padding: 1.5rem; background: var(--bg-card); border-radius: var(--radius-md); border: 1px solid var(--border-color); font-family: monospace;';
        errBox.textContent = '⚠️ Erro de renderização: ' + (err && err.message ? err.message : err);
        diagEl.appendChild(errBox);
      }
    }

    function changeTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
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
          a.download = (diagrams[activeIndex]?.meta.id || 'diagram') + '.png';
          a.click();
        });
      };
      img.src = url;
    }

    function init() {
      renderList();
      if (diagrams.length > 0) {
        selectDiagram(0);
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  </script>
</body>
</html>`;
