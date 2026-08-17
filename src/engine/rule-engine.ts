import { CodebaseTopology } from './types.js';
import { calculateCodebaseMetrics } from './metrics-engine.js';

export interface ArchitectureRule {
  id: string;
  name: string;
  type: 'forbidden_layer_call' | 'max_efferent_coupling' | 'no_circular_dependencies' | 'forbidden_direct_import';
  severity: 'error' | 'warning';
  params: Record<string, any>;
}

export interface RuleViolation {
  rule_id: string;
  rule_name: string;
  severity: 'error' | 'warning';
  message: string;
  from_module: string;
  to_module?: string;
}

export interface LintResult {
  passed: boolean;
  total_rules: number;
  violations_count: number;
  errors_count: number;
  warnings_count: number;
  violations: RuleViolation[];
}

export const DEFAULT_RULES: ArchitectureRule[] = [
  {
    id: 'RULE-001',
    name: 'Proibir Chamada Direta de Controller para Repository',
    type: 'forbidden_layer_call',
    severity: 'error',
    params: { from_layer: 'controller', to_layer: 'repository' }
  },
  {
    id: 'RULE-002',
    name: 'Proibir Dependências Circulares',
    type: 'no_circular_dependencies',
    severity: 'error',
    params: {}
  },
  {
    id: 'RULE-003',
    name: 'Limite Máximo de Acoplamento Eferente',
    type: 'max_efferent_coupling',
    severity: 'warning',
    params: { max_efferent: 12 }
  }
];

function checkLayerRule(rule: ArchitectureRule, topology: CodebaseTopology): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const layerMap = new Map<string, string>();
  for (const f of topology.files) {
    layerMap.set(f.relativePath, f.layer || 'other');
  }

  for (const call of topology.crossModuleCalls) {
    const fromLayer = layerMap.get(call.fromFile);
    const toLayer = layerMap.get(call.toFile);
    if (fromLayer === rule.params.from_layer && toLayer === rule.params.to_layer) {
      violations.push({
        rule_id: rule.id,
        rule_name: rule.name,
        severity: rule.severity,
        message: `Violação de Camada: Módulo '${call.fromFile}' (${fromLayer}) não pode chamar diretamente '${call.toFile}' (${toLayer}).`,
        from_module: call.fromFile,
        to_module: call.toFile
      });
    }
  }
  return violations;
}

function checkCircularRule(rule: ArchitectureRule, topology: CodebaseTopology): RuleViolation[] {
  const metrics = calculateCodebaseMetrics(topology);
  return metrics.circular_dependencies.map(circ => ({
    rule_id: rule.id,
    rule_name: rule.name,
    severity: rule.severity,
    message: `Dependência Circular detectada entre '${circ.from}' e '${circ.to}'.`,
    from_module: circ.from,
    to_module: circ.to
  }));
}

function checkCouplingRule(rule: ArchitectureRule, topology: CodebaseTopology): RuleViolation[] {
  const violations: RuleViolation[] = [];
  const metrics = calculateCodebaseMetrics(topology);
  const maxCe = rule.params.max_efferent || 10;

  for (const [file, c] of Object.entries(metrics.coupling)) {
    if (c.efferent > maxCe) {
      violations.push({
        rule_id: rule.id,
        rule_name: rule.name,
        severity: rule.severity,
        message: `Alto Acoplamento Eferente: Módulo '${file}' possui Ce = ${c.efferent} (limite máximo permitido: ${maxCe}).`,
        from_module: file
      });
    }
  }
  return violations;
}

export function lintArchitecture(topology: CodebaseTopology, customRules?: ArchitectureRule[]): LintResult {
  const rules = customRules && customRules.length > 0 ? customRules : DEFAULT_RULES;
  const violations: RuleViolation[] = [];

  for (const rule of rules) {
    if (rule.type === 'forbidden_layer_call') {
      violations.push(...checkLayerRule(rule, topology));
    } else if (rule.type === 'no_circular_dependencies') {
      violations.push(...checkCircularRule(rule, topology));
    } else if (rule.type === 'max_efferent_coupling') {
      violations.push(...checkCouplingRule(rule, topology));
    }
  }

  const errorsCount = violations.filter(v => v.severity === 'error').length;
  const warningsCount = violations.filter(v => v.severity === 'warning').length;

  return {
    passed: errorsCount === 0,
    total_rules: rules.length,
    violations_count: violations.length,
    errors_count: errorsCount,
    warnings_count: warningsCount,
    violations
  };
}
