/**
 * CAMADA 3: Pós-Processamento SVG (DOM)
 * Aplica refinamentos visuais pós-renderização:
 * - Arredondamento suave de cantos (rx, ry)
 * - Identificação semântica e customização de nós C4 (Person, Container, Database, Queue)
 * - Adição de filtros SVG de sombra suave (drop-shadow)
 */

function injectSoftShadowFilter(svgElement: SVGElement, themeId: string): string {
  const filterId = 'visual-soft-shadow';
  let defs = svgElement.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    svgElement.insertBefore(defs, svgElement.firstChild);
  }

  if (!defs.querySelector(`#${filterId}`)) {
    const filter = document.createElementNS('http://www.w3.org/2000/svg', 'filter');
    filter.setAttribute('id', filterId);
    filter.setAttribute('x', '-10%');
    filter.setAttribute('y', '-10%');
    filter.setAttribute('width', '130%');
    filter.setAttribute('height', '130%');

    const isDark = themeId === 'dark';
    const shadowColor = isDark ? 'rgba(0, 0, 0, 0.6)' : 'rgba(15, 23, 42, 0.08)';

    const feDropShadow = document.createElementNS('http://www.w3.org/2000/svg', 'feDropShadow');
    feDropShadow.setAttribute('dx', '0');
    feDropShadow.setAttribute('dy', '2');
    feDropShadow.setAttribute('stdDeviation', '3');
    feDropShadow.setAttribute('flood-color', shadowColor);
    feDropShadow.setAttribute('flood-opacity', '1');
    filter.appendChild(feDropShadow);
    defs.appendChild(filter);
  }

  return filterId;
}

function roundRectCorners(svgElement: SVGElement, filterId: string): void {
  const rects = svgElement.querySelectorAll<SVGRectElement>('rect.basic, rect.actor, .node rect, .cluster rect');
  rects.forEach(rect => {
    if (!rect.hasAttribute('rx') || rect.getAttribute('rx') === '0') {
      rect.setAttribute('rx', '8');
      rect.setAttribute('ry', '8');
    }
    rect.style.filter = `url(#${filterId})`;
  });
}

function styleC4SemanticNodes(svgElement: SVGElement): void {
  const textNodes = svgElement.querySelectorAll('text');
  textNodes.forEach(textNode => {
    const content = textNode.textContent || '';

    if (content.includes('Database') || content.includes('ContainerDb')) {
      const parent = textNode.closest('g');
      const rect = parent?.querySelector('rect');
      if (rect) {
        rect.style.stroke = '#F59E0B';
        rect.style.strokeWidth = '2px';
        rect.style.strokeDasharray = '4 2';
      }
    }

    if (content.includes('Person')) {
      const parent = textNode.closest('g');
      const rect = parent?.querySelector('rect');
      if (rect) {
        rect.setAttribute('rx', '16');
        rect.setAttribute('ry', '16');
      }
    }
  });
}

function adjustEdgeReadability(svgElement: SVGElement): void {
  const edgePaths = svgElement.querySelectorAll<SVGPathElement>('.edgePath path');
  edgePaths.forEach(path => {
    path.style.strokeWidth = '1.75px';
  });
}

export function postProcessSvg(svgElement: SVGElement, themeId: string): void {
  try {
    const filterId = injectSoftShadowFilter(svgElement, themeId);
    roundRectCorners(svgElement, filterId);
    styleC4SemanticNodes(svgElement);
    adjustEdgeReadability(svgElement);
  } catch (err) {
    console.warn('[Post-Processing SVG Warning]', err);
  }
}
