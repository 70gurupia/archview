import { startSseServer, broadcastEvent } from '../src/utils/sse.js';
import { executeMindmap } from '../src/tools/mindmap.js';
import fs from 'fs';
import path from 'path';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[FAIL] ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runOddSuite() {
  console.log('📊 === [ODD] Suíte de Testes de Observabilidade e Métricas ===\n');

  // 1. Iniciar servidor SSE na porta de teste 3002
  console.log('1. Inicialização e Observabilidade do Servidor SSE:');
  const server = await startSseServer(3002);
  assert(server !== null, 'Servidor SSE/REST iniciado com sucesso');

  // 2. Health check
  const healthRes = await fetch('http://localhost:3002/api/health');
  const health = await healthRes.json();
  assert(health.status === 'ok', 'Health check reporta status ok');
  assert(typeof health.uptime === 'number' && health.uptime >= 0, 'Health check reporta métrica de uptime válida');
  assert(health.version === '3.0.0', 'Health check reporta versão semântica 3.0.0');

  // 3. Métricas no meta.json gerado
  console.log('\n2. Auditoria de Métricas e Telemetria de Diagrama:');
  const startTime = Date.now();
  const res = executeMindmap({
    central_topic: 'Métricas de Observabilidade',
    branches: [
      { title: 'Tempo de Resposta', sub_branches: ['p50', 'p95', 'p99'] },
      { title: 'Conectividade', sub_branches: ['SSE Heartbeat', 'Reconexão'] }
    ]
  });

  assert(fs.existsSync(res.meta_path), 'Arquivo meta.json foi criado no disco');
  const meta = JSON.parse(fs.readFileSync(res.meta_path, 'utf-8'));

  assert(meta.stats.node_count === 8, 'Métrica node_count calculada com exatidão (1 raiz + 2 ramos + 5 sub-ramos = 8)');
  assert(typeof meta.stats.generation_time_ms === 'number' && meta.stats.generation_time_ms >= 0, 'Métrica generation_time_ms rastreada');
  assert(!isNaN(Date.parse(meta.created_at)), 'created_at segue formato ISO 8601 válido');
  assert(meta.schema_version === '2.0', 'schema_version segue padrão 2.0');

  // 4. Teste de Endpoint de Listagem
  console.log('\n3. Observabilidade e Integridade da API REST:');
  const listRes = await fetch('http://localhost:3002/api/diagrams');
  const list = await listRes.json();
  assert(Array.isArray(list) && list.length > 0, 'API /api/diagrams retorna array de diagramas');

  const isSortedDesc = list.every((item: any, i: number) => {
    if (i === 0) return true;
    return new Date(list[i - 1].created_at).getTime() >= new Date(item.created_at).getTime();
  });
  assert(isSortedDesc, 'API /api/diagrams retorna diagramas ordenados decrescente por created_at');

  // 5. Teste de Endpoint de Atualização Local
  const firstId = list[0].id;

  const putRes = await fetch(`http://localhost:3002/api/diagrams/${firstId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'graph TD\n A-->B' })
  });
  const putData = await putRes.json();
  assert(putData.success === true, 'API PUT /api/diagrams/:id permite salvar edições no disco');

  // 6. Teste de Consulta Individual por ID
  const singleRes = await fetch(`http://localhost:3002/api/diagrams/${firstId}`);
  const single = await singleRes.json();
  assert(single.id === firstId, 'API /api/diagrams/:id recupera metadados exatos do diagrama solicitado');
  assert(typeof single.content === 'string' && single.content.length > 0, 'API /api/diagrams/:id inclui conteúdo Mermaid');

  server.close();
  console.log('\n🎉 [ODD] Todos os testes de observabilidade passaram com 100% de sucesso!\n');
}

runOddSuite().catch(err => {
  console.error('[ODD ERROR]', err);
  process.exit(1);
});
