import path from 'path';
import { scanCodebase } from '../engine/universal-scanner.js';
import { lintArchitecture, ArchitectureRule, LintResult } from '../engine/rule-engine.js';

export interface LintArchitectureInput {
  path?: string;
  rules?: ArchitectureRule[];
}

export interface LintArchitectureOutput {
  success: boolean;
  project_path: string;
  summary: {
    passed: boolean;
    total_rules: number;
    violations_count: number;
    errors_count: number;
    warnings_count: number;
  };
  violations: Array<{
    rule_id: string;
    rule_name: string;
    severity: 'error' | 'warning';
    message: string;
    from_module: string;
    to_module?: string;
  }>;
  markdown: string;
}

export function executeLintArchitecture(input: LintArchitectureInput): LintArchitectureOutput {
  const targetPath = input.path ? path.resolve(process.cwd(), input.path) : process.cwd();
  const topology = scanCodebase(targetPath);
  const lintResult: LintResult = lintArchitecture(topology, input.rules);

  let md = `## 🛡️ Relatório de Linter Arquitetural — ArchView\n\n`;
  md += `- **Diretório:** \`${targetPath}\`\n`;
  md += `- **Status:** ${lintResult.passed ? '✅ **APROVADO (Sem Violações Críticas)**' : '❌ **REPROVADO (Violações Detectadas)**'}\n`;
  md += `- **Regras Avaliadas:** ${lintResult.total_rules}\n`;
  md += `- **Erros:** ${lintResult.errors_count} | **Avisos:** ${lintResult.warnings_count}\n\n`;

  if (lintResult.violations.length > 0) {
    md += `### ⚠️ Violações Encontradas\n\n`;
    for (const v of lintResult.violations) {
      const icon = v.severity === 'error' ? '🔴' : '🟡';
      md += `* ${icon} **[${v.rule_id}] ${v.rule_name}** (${v.severity.toUpperCase()}):\n`;
      md += `  * ${v.message}\n`;
    }
  } else {
    md += `> ✅ **Nenhuma violação arquitetural detectada!** Todas as regras de fronteira de camadas e acoplamento foram respeitadas.\n`;
  }

  return {
    success: true,
    project_path: targetPath,
    summary: {
      passed: lintResult.passed,
      total_rules: lintResult.total_rules,
      violations_count: lintResult.violations_count,
      errors_count: lintResult.errors_count,
      warnings_count: lintResult.warnings_count
    },
    violations: lintResult.violations,
    markdown: md
  };
}
