import fs from 'fs';
import path from 'path';
import { ExportInputSchema } from '../utils/validation.js';

export interface ExportInput {
  source_path?: string;
  diagram_id?: string;
  target_format?: 'svg' | 'png' | 'pdf' | 'html';
  target_path?: string;
  options?: {
    width?: number;
    height?: number;
    scale?: number;
    background?: string;
    theme?: string;
  };
}

export interface ExportResult {
  file_path: string;
  format: string;
  html_export_path?: string;
  message: string;
  markdown: string;
}

export async function executeExport(input: ExportInput): Promise<ExportResult> {
  const targetId = input.diagram_id || input.source_path || '';
  if (targetId && /[;`$&|><\\]/.test(targetId)) {
    throw new Error(`Tentativa de injeção de comando bloqueada: ${targetId}`);
  }
  if (input.target_path && /[;`$&|><\\]/.test(input.target_path)) {
    throw new Error(`Tentativa de injeção de comando bloqueada: ${input.target_path}`);
  }

  const outDir = path.join(process.cwd(), 'output');
  const format = input.target_format || 'html';

  let matchedHtml: string | undefined;
  if (fs.existsSync(outDir)) {
    const files = fs.readdirSync(outDir);
    const htmlFiles = files.filter(f => f.endsWith('.html'));
    matchedHtml = htmlFiles.find(f => targetId ? f.includes(targetId) : true);
  }

  const htmlPath = matchedHtml ? path.join(outDir, matchedHtml) : path.join(outDir, 'archview-dashboard.html');

  const message = `A exportação em alta fidelidade (${format.toUpperCase()}) é gerenciada de forma autônoma e segura pelo arquivo HTML interativo offline. Abra o arquivo HTML diretamente no seu navegador para baixar SVG, PNG HD (2x) ou PNG 4K sem sobrecarga de CPU no servidor.`;
  const markdown = `### 📦 Exportação de Diagrama\n\n- **Arquivo Visualizador Offline:** \`${htmlPath}\`\n- **Formatos Suportados:** SVG Vetorial, PNG HD (2x), PNG Ultra HD (4K)\n- **Como Exportar:** Abra o arquivo HTML no seu navegador e utilize os botões da barra superior para download imediato.`;

  return {
    file_path: htmlPath,
    format,
    html_export_path: htmlPath,
    message,
    markdown
  };
}
