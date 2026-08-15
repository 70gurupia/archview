import assert from 'assert';
import { parseTypeScriptFile } from '../src/engine/ast-parser-ts.js';
import { parseLexicalFile } from '../src/engine/ast-parser-lexical.js';
import { scanCodebase } from '../src/engine/universal-scanner.js';
import { parseTraceToSequence } from '../src/engine/trace-parser.js';
import { executeScanTopology } from '../src/tools/scan-topology.js';
import { executeTraceCallGraph } from '../src/tools/trace-callgraph.js';
import { executeTraceExecution } from '../src/tools/trace-execution.js';
import { executeAnalyzeOverview } from '../src/tools/analyze-overview.js';

function runV3TestSuite() {
  console.log('🧪 === [TDD v3.0] Suíte de Testes do Motor de Codebase Intelligence ===\n');

  // 1. AST Parser TypeScript
  console.log('1. Testes de AST Parser TypeScript (ast-parser-ts.ts):');
  const tsCode = `
    import { Router } from 'express';
    import { UserService } from './user.service';

    export class UserController {
      private router = Router();
      constructor(private userService: UserService) {
        this.setupRoutes();
      }

      private setupRoutes() {
        this.router.get('/users', (req, res) => this.getUsers(req, res));
        this.router.post('/users', (req, res) => this.createUser(req, res));
      }

      public async getUsers(req: any, res: any) {
        const users = await this.userService.findAll();
        res.json(users);
      }

      public async createUser(req: any, res: any) {
        return this.userService.create(req.body);
      }
    }
  `;

  const parsedTs = parseTypeScriptFile('/fake/user.controller.ts', 'src/controllers/user.controller.ts', tsCode);
  assert(parsedTs.language === 'TypeScript', 'Detecta linguagem TypeScript');
  assert(parsedTs.layer === 'controller', 'Identifica camada controller automaticamente');
  assert(parsedTs.symbols.some(s => s.name === 'UserController' && s.kind === 'class'), 'Extrai classe UserController');
  assert(parsedTs.symbols.some(s => s.name === 'getUsers' && s.kind === 'function'), 'Extrai método getUsers');
  assert(parsedTs.imports.some(i => i.source === './user.service' && i.specifiers.includes('UserService')), 'Extrai imports tipados');
  assert(parsedTs.routes.length >= 2, 'Extrai rotas Express (GET e POST)');
  assert(parsedTs.calls.some(c => c.calleeName === 'findAll'), 'Rastreia chamada ao método userService.findAll()');
  console.log('  ✓ Parser TypeScript extrai classes, métodos, rotas Express e chamadas internas');

  // 2. Parser Léxico Universal (Python, Go, Java)
  console.log('\n2. Testes de Parser Léxico Universal (ast-parser-lexical.ts):');

  // Python
  const pyCode = `
from fastapi import FastAPI, Depends
from services.auth import AuthService

app = FastAPI()

@app.get("/api/v1/profile")
def get_user_profile(token: str = Depends()):
    return AuthService.validate_and_get(token)

class UserProfile:
    def __init__(self, name: str):
        self.name = name
`;
  const parsedPy = parseLexicalFile('/fake/main.py', 'app/main.py', pyCode);
  assert(parsedPy.language === 'Python', 'Detecta linguagem Python');
  assert(parsedPy.framework === 'FastAPI', 'Detecta framework FastAPI');
  assert(parsedPy.routes.some(r => r.path === '/api/v1/profile' && r.method === 'GET'), 'Extrai rota FastAPI com decorator');
  assert(parsedPy.symbols.some(s => s.name === 'UserProfile' && s.kind === 'class'), 'Extrai classe Python');
  assert(parsedPy.calls.some(c => c.calleeName === 'validate_and_get'), 'Extrai chamada de método AuthService');
  console.log('  ✓ Parser Python extrai classes, decorators FastAPI e chamadas');

  // Go
  const goCode = `
package handlers

import (
	"net/http"
	"github.com/gofiber/fiber/v2"
	"myproject/services"
)

type UserHandler struct {
	Service *services.UserService
}

func (h *UserHandler) GetUser(c *fiber.Ctx) error {
	user := h.Service.FindUser(c.Params("id"))
	return c.JSON(user)
}
`;
  const parsedGo = parseLexicalFile('/fake/user_handler.go', 'pkg/handlers/user_handler.go', goCode);
  assert(parsedGo.language === 'Go', 'Detecta linguagem Go');
  assert(parsedGo.framework === 'Fiber', 'Detecta framework Go Fiber');
  assert(parsedGo.symbols.some(s => s.name === 'UserHandler' && s.kind === 'class'), 'Extrai struct Go');
  assert(parsedGo.symbols.some(s => s.name === 'GetUser' && s.kind === 'function'), 'Extrai método Go com receiver');
  assert(parsedGo.calls.some(c => c.calleeName === 'FindUser'), 'Extrai chamada de método h.Service.FindUser');
  console.log('  ✓ Parser Go extrai structs, receivers, pacotes e chamadas');

  // 3. Scanner Universal e Topologia
  console.log('\n3. Testes de Scanner Universal (universal-scanner.ts):');
  const topology = scanCodebase(process.cwd(), { maxDepth: 5 });
  assert(topology.totalFiles > 0, 'Varre arquivos do repositório');
  assert(topology.totalLinesOfCode > 100, 'Calcula total de linhas de código');
  assert(topology.languages['TypeScript'] > 0, 'Detecta arquivos TypeScript no projeto');
  assert(topology.frameworks.includes('Express') || topology.frameworks.includes('Alpine.js'), 'Detecta frameworks do projeto (Express/Alpine)');
  assert(topology.directoryTree.children && topology.directoryTree.children.length > 0, 'Constrói árvore hierárquica de diretórios');
  assert(topology.crossModuleCalls.length > 0, 'Resolve chamadas cruzadas entre arquivos do repositório');
  console.log(`  ✓ Scanner mapeou ${topology.totalFiles} arquivos, ${topology.totalLinesOfCode} linhas e ${topology.crossModuleCalls.length} chamadas cruzadas`);

  // 4. Parser de Traces e Diagramas de Sequência (trace-parser.ts)
  console.log('\n4. Testes de Parser de Traces (trace-parser.ts):');
  const sampleTrace = {
    title: 'Fluxo de Checkout e Pagamento',
    trace_data: [
      { from: 'Frontend SPA', to: 'API Gateway', action: 'POST /api/checkout', durationMs: 45 },
      { from: 'API Gateway', to: 'PaymentService', action: 'ProcessPayment(token)', durationMs: 120 },
      { from: 'PaymentService', to: 'Postgres DB', action: 'INSERT INTO transactions', durationMs: 15 },
      { from: 'PaymentService', to: 'Kafka', action: 'Publish(payment.confirmed)', durationMs: 8 }
    ]
  };
  const traceSeq = parseTraceToSequence(sampleTrace);
  assert(traceSeq.mermaid.includes('sequenceDiagram'), 'Gera cabeçalho sequenceDiagram');
  assert(traceSeq.mermaid.includes('autonumber'), 'Habilita numeração automática de passos');
  assert(traceSeq.mermaid.includes('Frontend_SPA ->> API_Gateway: POST /api/checkout (45ms)'), 'Renderiza chamada síncrona com duração');
  assert(traceSeq.mermaid.includes('database Postgres_DB as 💾 Postgres DB'), 'Identifica participante de banco de dados');
  assert(traceSeq.mermaid.includes('participant Kafka as 📬 Kafka'), 'Identifica participante de fila/mensageria');
  console.log('  ✓ Parser de traces gera sequenceDiagram rico com durações e participantes semânticos');

  // 5. Testes de Execução das 4 Ferramentas MCP v3.0
  console.log('\n5. Testes das Ferramentas MCP v3.0:');

  // Tool 1: scan_codebase_topology
  const topResult = executeScanTopology({
    title: 'Topologia do Próprio ArchView',
    view_mode: 'hybrid',
    max_depth: 4
  });
  assert(topResult.file_path.endsWith('.mmd'), 'scan_codebase_topology gera arquivo .mmd');
  assert(topResult.markdown.includes('flowchart TD'), 'Topologia utiliza flowchart TD');
  assert(topResult.markdown.includes('subgraph sg_'), 'Topologia agrupa por subgrafos de diretórios');
  console.log('  ✓ executeScanTopology gera diagrama de topologia C4 com subgrafos');

  // Tool 2: trace_call_graph
  const callResult = executeTraceCallGraph({
    symbol_name: 'generateFlowchartMermaid',
    direction: 'LR'
  });
  assert(callResult.markdown.includes('flowchart LR'), 'trace_call_graph utiliza flowchart LR widescreen');
  assert(callResult.markdown.includes('target_generateFlowchartMermaid'), 'Destaca o símbolo em foco no centro');
  console.log('  ✓ executeTraceCallGraph gera grafo bidirecional centrado no símbolo');

  // Tool 3: trace_execution_flow
  const execResult = executeTraceExecution({
    title: 'Trace de Teste',
    trace_data: [
      { from: 'User', to: 'Server', action: 'GET /status' },
      { from: 'Server', to: 'Database', action: 'Query', status: 'error', error: 'Connection timeout' }
    ]
  });
  assert(execResult.markdown.includes('sequenceDiagram'), 'trace_execution_flow gera diagrama de sequência');
  assert(execResult.markdown.includes('alt Erro na Execução'), 'Renderiza bloco alt/else para status de erro');
  console.log('  ✓ executeTraceExecution renderiza tratamento de erros em blocos alt/else');

  // Tool 4: analyze_codebase_overview
  const overResult = executeAnalyzeOverview({
    title: 'Raio-X Completo'
  });
  assert(overResult.markdown.includes('Métricas do Repositório'), 'analyze_codebase_overview inclui relatório de métricas');
  assert(overResult.markdown.includes('Total de Arquivos'), 'Relatório contém contagem de arquivos e linhas');
  console.log('  ✓ executeAnalyzeOverview gera raio-x completo 360 com mapa mental e métricas');

  console.log('\n🎉 [TDD v3.0] Todos os testes do motor de Codebase Intelligence passaram com 100% de sucesso!\n');
}

runV3TestSuite();


