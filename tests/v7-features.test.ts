import assert from 'node:assert';
import { executeCompressForLlm } from '../src/tools/compress-llm.js';
import { calculateCodebaseMetrics, estimateFileComplexity } from '../src/engine/metrics-engine.js';
import { scanCodebase } from '../src/engine/universal-scanner.js';
import { estimateTokenCount } from '../src/utils/meta.js';
import { executeCloneAndScan } from '../src/tools/clone-scan.js';

console.log('🧪 === [TDD v7.0] Suíte de Testes de Novas Ferramentas e Otimização de Tokens ===\n');

// 1. Teste de Estimativa de Tokens
console.log('1. Testando Estimativa Nativas de Tokens (tiktoken)...');
const sampleText = 'flowchart TD\n  A[Start] --> B[Process] --> C[End]';
const tokens = estimateTokenCount(sampleText);
assert(tokens > 0, 'Estimativa de tokens deve retornar valor positivo');
console.log(`  ✅ Estimativa de tokens validada: "${sampleText.substring(0, 20)}..." -> ${tokens} tokens`);

// 2. Teste da Engine de Métricas de Qualidade
console.log('\n2. Testando Engine de Métricas de Qualidade de Código...');
const topology = scanCodebase(process.cwd(), { maxDepth: 4 });
const metrics = calculateCodebaseMetrics(topology);

assert(metrics.total_files > 0, 'Total de arquivos deve ser maior que zero');
assert(typeof metrics.avg_complexity === 'number', 'Complexidade média deve ser numérica');
assert(Array.isArray(metrics.hotspots), 'Hotspots devem ser retornados em array');

console.log(`  ✅ Métricas calculadas com sucesso: ${metrics.total_files} arquivos, Complexidade Média: ${metrics.avg_complexity}`);

// 3. Teste da Ferramenta compress_for_llm
console.log('\n3. Testando Ferramenta MCP compress_for_llm...');
const compressed = executeCompressForLlm({ path: process.cwd() });

assert(compressed.estimated_tokens > 0, 'Tokens estimados do resumo devem ser maiores que zero');
assert(compressed.summary.project_name, 'Resumo deve conter nome do projeto');
assert(compressed.markdown.includes('Resumo Arquitetural Comprimido'), 'Markdown deve incluir cabeçalho descritivo');

console.log(`  ✅ Resumo estruturado gerado com sucesso (~${compressed.estimated_tokens} tokens)`);

// 4. Teste de Validação de URL na Ferramenta clone_and_scan
console.log('\n4. Testando Validação da Ferramenta clone_and_scan...');
let blocked = false;
try {
  executeCloneAndScan({ repo_url: 'https://evil.com/malicious.git' });
} catch (err: any) {
  if (err.message.includes('inválida')) {
    blocked = true;
  }
}
assert(blocked, 'URL não-oficial fora do GitHub/GitLab deve ser rejeitada');
console.log('  ✅ Validação de domínio oficial HTTPS/SSH em clone_and_scan aprovada com sucesso.');

console.log('\n🎉 === Todos os testes da Fase 7.0 passaram com 100% de sucesso! ===\n');
