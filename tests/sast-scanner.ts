import fs from 'fs';
import path from 'path';

interface SecurityIssue {
  file: string;
  line: number;
  rule: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  snippet: string;
}

const RULES = [
  {
    id: 'SEC-001',
    name: 'Unsafe Eval / Dynamic Code Execution',
    severity: 'HIGH' as const,
    pattern: /\b(eval|new Function)\s*\(/,
    description: 'Uso de eval ou new Function permite execução arbitrária de código.'
  },
  {
    id: 'SEC-002',
    name: 'Unsafe Shell Command Execution',
    severity: 'HIGH' as const,
    pattern: /\b(exec|execSync)\s*\(\s*`/,
    description: 'Uso de interpolação de strings em comandos shell sem sanitização.'
  },
  {
    id: 'SEC-003',
    name: 'Hardcoded Secret / Token Pattern',
    severity: 'HIGH' as const,
    pattern: /(api[_-]?key|secret|password|bearer\s+[a-zA-Z0-9_\-\.]{20,})/i,
    description: 'Possível segredo ou chave de API hardcoded.'
  },
  {
    id: 'SEC-004',
    name: 'Unsafe Prototype Access',
    severity: 'MEDIUM' as const,
    pattern: /__proto__|constructor\s*\[\s*['"]prototype['"]\s*\]/,
    description: 'Risco de poluição de protótipo (Prototype Pollution).'
  },
  {
    id: 'SEC-005',
    name: 'Dangerous HTML Injection Sinks',
    severity: 'MEDIUM' as const,
    pattern: /innerHTML\s*=\s*[^"'][^;]+/,
    description: 'Inserção direta em innerHTML sem sanitização DOMPurify.'
  }
];

function scanDirectory(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (file === 'node_modules' || file === 'dist' || file === 'build' || file === '.git') continue;
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDirectory(fullPath, fileList);
    } else if (file.endsWith('.ts') || file.endsWith('.js') || file.endsWith('.html')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

export function runSastScan(): SecurityIssue[] {
  console.log('🛡️ === [SAST] Análise Estática de Segurança (Equivalente Bandit para JS/TS) ===\n');

  const srcDir = path.join(process.cwd(), 'src');
  const frontendSrcDir = path.join(process.cwd(), 'frontend', 'src');
  const files = [...scanDirectory(srcDir), ...scanDirectory(frontendSrcDir)];

  const issues: SecurityIssue[] = [];

  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file);
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      // Ignorar comentários
      const trimmed = line.trim();
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return;

      for (const rule of RULES) {
        if (rule.pattern.test(line)) {
          issues.push({
            file: relativePath,
            line: idx + 1,
            rule: `${rule.id}: ${rule.name}`,
            severity: rule.severity,
            description: rule.description,
            snippet: line.trim()
          });
        }
      }
    });
  }

  if (issues.length === 0) {
    console.log(`✅ Nenhum problema de segurança detectado em ${files.length} arquivos analisados.`);
    console.log('🛡️ 0 vulnerabilidades de alta, média ou baixa severidade.\n');
  } else {
    console.warn(`⚠️ ${issues.length} possíveis problemas detectados:`);
    issues.forEach(iss => {
      console.warn(`  [${iss.severity}] ${iss.file}:${iss.line} - ${iss.rule}`);
      console.warn(`    Snippet: ${iss.snippet}`);
    });
  }

  return issues;
}

if (process.argv[1] && process.argv[1].endsWith('sast-scanner.ts')) {
  const findings = runSastScan();
  if (findings.filter(f => f.severity === 'HIGH').length > 0) {
    process.exit(1);
  }
}
