/**
 * CAMADA 3: Pós-Processamento SVG (DOM)
 * Aplica refinamentos visuais pós-renderização:
 * - Arredondamento suave de cantos (rx, ry)
 * - Identificação semântica e customização de nós C4 (Person, Container, Database, Queue)
 * - Adição de filtros SVG de sombra suave (drop-shadow)
 */

export function postProcessSvg(svgElement: SVGElement, themeId: string): void {
  try {
    // 1. Injetar filtro de sombra suave no <defs>
    let defs = svgElement.querySelector('defs');
    if (!defs) {
      defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
      svgElement.insertBefore(defs, svgElement.firstChild);
    }

    const filterId = 'visual-soft-shadow';
    if (!defs.querySelector(`#${filterId}`)) {
      const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
      filter.setAttribute('id', filterId);
      filter.setAttribute('x', '-10%');
      filter.setAttribute('y', '-10%');
      filter.setAttribute('width', '130%');
      filter.setAttribute('height', '130%');

      const isDark = themeId === 'dark';
      const shadowColor = isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(15, 23, 42, 0.08)';

      filter.innerHTML = `
        <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="${shadowColor}" flood-opacity="1"/>
      `;
      defs.appendChild(filter);
    }

    // 2. Arredondar nós e aplicar filtro
    const rects = svgElement.querySelectorAll<SVGRectElement>('rect.basic, rect.actor, .node rect, .cluster rect');
    rects.forEach(rect => {
      if (!rect.hasAttribute('rx') || rect.getAttribute('rx') === '0') {
        rect.setAttribute('rx', '8');
        rect.setAttribute('ry', '8');
      }
      rect.style.filter = `url(#${filterId})`;
    });

    // 3. Estilização C4 Model (Person, Container, Database, Queue)
    const textNodes = svgElement.querySelectorAll('text');
    textNodes.forEach(textNode => {
      const content = textNode.textContent || '';

      // Database
      if (content.includes('[Container: Database]') || content.includes('Database') || content.includes('ContainerDb')) {
        const parent = textNode.closest('g');
        if (parent) {
          const rect = parent.querySelector('rect');
          if (rect) {
            rect.style.stroke = '#F59E0B';
            rect.style.strokeWidth = '2px';
            rect.style.strokeDasharray = '4 2';
          }
        }
      }

      // Person
      if (content.includes('[Person]') || content.includes('Person')) {
        const parent = textNode.closest('g');
        if (parent) {
          const rect = parent.querySelector('rect');
          if (rect) {
            rect.setAttribute('rx', '16');
            rect.setAttribute('ry', '16');
          }
        }
      }
    });

    // 4. Ajustar fontes e legibilidade das arestas
    const edgePaths = svgElement.querySelectorAll<SVGPathElement>('.edgePath path');
    edgePaths.forEach(path => {
      path.style.strokeWidth = '1.75px';
    });

  } catch (err) {
    console.warn('[Post-Processing SVG Warning]', err);
  }
}
