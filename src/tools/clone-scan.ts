import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { executeScanTopology } from './scan-topology.js';
import { ToolExecutionResult } from '../types/index.js';

export interface CloneScanInput {
  repo_url: string;
  title?: string;
  view_mode?: 'hybrid' | 'layered' | 'folders';
  direction?: 'TD' | 'LR';
  max_depth?: number;
}

export function executeCloneAndScan(input: CloneScanInput): ToolExecutionResult {
  const url = input.repo_url ? input.repo_url.trim() : '';
  if (!url || (!url.startsWith('https://github.com') && !url.startsWith('https://gitlab.com') && !url.startsWith('git@'))) {
    throw new Error('URL de repositório inválida. Apenas repositórios oficiais HTTPS/SSH do GitHub ou GitLab são permitidos.');
  }

  const shortId = crypto.randomBytes(4).toString('hex');
  const tempDir = path.join('/tmp', `archview-clone-${shortId}`);

  try {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });

    // Clone shallow repository (depth 1) via safe array execution
    execFileSync('git', ['clone', '--depth', '1', url, tempDir], { stdio: 'pipe', timeout: 30000 });

    const repoName = url.split('/').pop()?.replace(/\.git$/, '') || 'remote-repo';
    const result = executeScanTopology({
      path: tempDir,
      title: input.title || `Topologia Remota: ${repoName}`,
      view_mode: input.view_mode,
      direction: input.direction,
      max_depth: input.max_depth || 5
    });

    result.markdown = `### 🌐 Repositório Remoto Analisado com Sucesso!\n- **URL:** \`${url}\`\n` + result.markdown;
    return result;
  } finally {
    // Cleanup temporary clone directory
    if (fs.existsSync(tempDir)) {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {
        // Ignora erro de cleanup
      }
    }
  }
}
