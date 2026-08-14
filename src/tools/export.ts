import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { broadcastEvent } from '../utils/sse.js';

const execAsync = promisify(exec);

export interface ExportInput {
  source_path: string;
  target_format: 'svg' | 'png' | 'pdf';
  target_path?: string;
  options?: {
    width?: number;
    height?: number;
    scale?: number;
    background?: string;
    theme?: string;
  };
}

export async function executeExport(input: ExportInput): Promise<{ file_path: string, format: string }> {
  const outDir = path.join(process.cwd(), 'output');

  if (/[;&|`$]/.test(input.source_path) || (input.target_path && /[;&|`$]/.test(input.target_path))) {
    throw new Error('Segurança: Caracteres de injeção de comando detectados no caminho do arquivo.');
  }

  // Resolve source path
  let sourcePath = input.source_path.replace(/\\/g, '/');
  if (!path.isAbsolute(sourcePath)) {
    sourcePath = path.resolve(outDir, sourcePath);
  }

  // Anti-path traversal for source
  if (!sourcePath.startsWith(outDir) && !sourcePath.startsWith(process.cwd())) {
    throw new Error('Segurança: O arquivo de origem deve estar localizado no diretório output/.');
  }

  if (!fs.existsSync(sourcePath)) {
    throw new Error(`Arquivo de origem não encontrado: ${sourcePath}`);
  }

  // Determine target path
  let targetPath = input.target_path;
  if (!targetPath) {
    const ext = path.extname(sourcePath);
    targetPath = sourcePath.replace(new RegExp(`${ext}$`), `.${input.target_format}`);
  } else if (!path.isAbsolute(targetPath)) {
    targetPath = path.resolve(outDir, targetPath);
  }

  // Anti-path traversal for target
  if (!targetPath.startsWith(outDir)) {
    throw new Error('Segurança: Path traversal detectado. A saída deve estar no diretório output/.');
  }

  // Build mmdc command
  const localMmdc = path.resolve(process.cwd(), 'node_modules', '.bin', 'mmdc');
  const mmdcBin = fs.existsSync(localMmdc) ? `"${localMmdc}"` : 'npx -y @mermaid-js/mermaid-cli';
  let cmd = `${mmdcBin} -i "${sourcePath}" -o "${targetPath}"`;

  if (input.options?.width) cmd += ` -w ${input.options.width}`;
  if (input.options?.height) cmd += ` -H ${input.options.height}`;
  if (input.options?.scale) cmd += ` -s ${input.options.scale}`;
  if (input.options?.background) cmd += ` -b "${input.options.background}"`;
  if (input.options?.theme) cmd += ` -t ${input.options.theme}`;

  try {
    await execAsync(cmd);

    // If a corresponding .meta.json exists, update its files property
    const metaCandidate = sourcePath.replace(/\.(mmd|md)$/, '.meta.json');
    if (fs.existsSync(metaCandidate)) {
      try {
        const meta = JSON.parse(fs.readFileSync(metaCandidate, 'utf-8'));
        if (input.target_format === 'svg') meta.files.svg = path.basename(targetPath);
        if (input.target_format === 'png') meta.files.png = path.basename(targetPath);
        meta.updated_at = new Date().toISOString();
        fs.writeFileSync(metaCandidate, JSON.stringify(meta, null, 2), 'utf-8');

        broadcastEvent('diagram.updated', {
          id: meta.id,
          type: meta.type,
          format: input.target_format,
          file: path.basename(targetPath)
        });
      } catch {
        // Ignora falha de atualização de meta
      }
    }

    return {
      file_path: targetPath,
      format: input.target_format
    };
  } catch (err: any) {
    throw new Error(`Falha na exportação com Mermaid CLI: ${err.message}`);
  }
}
