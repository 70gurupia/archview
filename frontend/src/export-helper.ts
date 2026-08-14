/**
 * Utilitários de exportação client-side (SVG / PNG 2x retina / Clipboard)
 */

export async function exportSvgToPng(svgElement: SVGElement, filename: string, scale = 2, background?: string): Promise<void> {
  const svgXml = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const bbox = svgElement.getBoundingClientRect();
    const width = (bbox.width || 800) * scale;
    const height = (bbox.height || 600) * scale;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (background !== 'transparent') {
      ctx.fillStyle = background || getComputedStyle(document.body).backgroundColor || '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }

    ctx.drawImage(img, 0, 0, width, height);
    URL.revokeObjectURL(url);

    const pngUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = pngUrl;
    a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  img.src = url;
}

export function exportSvg(svgElement: SVGElement, filename: string): void {
  const svgXml = new XMLSerializer().serializeToString(svgElement);
  const blob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.svg') ? filename : `${filename}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Falha ao copiar:', err);
    return false;
  }
}

export async function exportSvgToClipboard(svgElement: SVGElement, background?: string): Promise<boolean> {
  return new Promise((resolve) => {
    const svgXml = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgXml], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const img = new Image();
    img.onload = async () => {
      const bbox = svgElement.getBoundingClientRect();
      const scale = 2; // Copying in 2x by default
      const width = (bbox.width || 800) * scale;
      const height = (bbox.height || 600) * scale;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(false);

      if (background !== 'transparent') {
        ctx.fillStyle = background || getComputedStyle(document.body).backgroundColor || '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);

      canvas.toBlob(async (blob) => {
        if (!blob) return resolve(false);
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob
            })
          ]);
          resolve(true);
        } catch (err) {
          console.error('Falha ao copiar imagem:', err);
          resolve(false);
        }
      }, 'image/png');
    };
    img.src = url;
  });
}
