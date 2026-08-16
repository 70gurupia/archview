import { ParsedFile, CodeSymbol, FileImport, FileCall, RouteEndpoint } from './types.js';

interface ParserState {
  currentScope: string;
  pendingDecorators: string[];
  inMultiLineComment: boolean;
}

function handleComments(lineText: string, state: ParserState): string | null {
  let trimmed = lineText.trim();
  if (state.inMultiLineComment) {
    if (trimmed.includes('*/')) {
      state.inMultiLineComment = false;
      trimmed = trimmed.split('*/')[1].trim();
    } else {
      return null;
    }
  }
  if (trimmed.startsWith('/*')) {
    if (!trimmed.includes('*/')) {
      state.inMultiLineComment = true;
      return null;
    }
    trimmed = trimmed.replace(/\/\*.*?\*\//g, '').trim();
  }
  return (!trimmed || trimmed.startsWith('//')) ? null : trimmed;
}

function parseDecorators(trimmed: string, lineNum: number, routes: RouteEndpoint[], state: ParserState): boolean {
  if (!trimmed.startsWith('@')) return false;
  state.pendingDecorators.push(trimmed);

  const httpMatch = trimmed.match(/@(Get|Post|Put|Delete|Patch)(?:\(['"]([^'"]*)['"]\))?/i);
  if (httpMatch) {
    routes.push({
      path: httpMatch[2] ? `/${httpMatch[2].replace(/^\//, '')}` : '/',
      method: httpMatch[1].toUpperCase() as any,
      handler: `Line ${lineNum}`,
      line: lineNum
    });
  }

  const ctrlMatch = trimmed.match(/@Controller\(['"]([^'"]*)['"]\)/i);
  if (ctrlMatch) {
    routes.push({
      path: ctrlMatch[1] ? `/${ctrlMatch[1].replace(/^\//, '')}` : '/',
      method: 'ALL',
      handler: `Controller (Line ${lineNum})`,
      line: lineNum
    });
  }
  return true;
}

function parseImports(trimmed: string, imports: FileImport[]): boolean {
  if (!trimmed.startsWith('import ')) return false;
  const impMatch = trimmed.match(/^import\s+(?:(\*\s+as\s+[A-Za-z0-9_]+)|([A-Za-z0-9_]+)|(?:\{\s*([^}]+)\s*\}))\s+from\s+['"]([^'"]+)['"]/);
  if (impMatch) {
    const specifiers: string[] = [];
    if (impMatch[2]) specifiers.push(impMatch[2]);
    if (impMatch[1]) specifiers.push(impMatch[1].replace(/\*\s+as\s+/, '').trim());
    if (impMatch[3]) {
      impMatch[3].split(',').forEach(s => {
        const spec = s.split(' as ')[0].trim();
        if (spec) specifiers.push(spec);
      });
    }
    imports.push({
      source: impMatch[4],
      specifiers,
      isDefault: Boolean(impMatch[2]),
      isNamespace: Boolean(impMatch[1])
    });
  } else {
    const rawSource = trimmed.match(/['"]([^'"]+)['"]/);
    if (rawSource) {
      imports.push({ source: rawSource[1], specifiers: [], isDefault: false, isNamespace: false });
    }
  }
  return true;
}

function parseExports(trimmed: string, exports: string[]): void {
  if (trimmed.startsWith('export {')) {
    const expList = trimmed.match(/^export\s*\{\s*([^}]+)\s*\}/);
    if (expList) {
      expList[1].split(',').forEach(e => {
        const exp = e.split(' as ')[0].trim();
        if (exp) exports.push(exp);
      });
    }
  }
}

function parseClasses(cleanDefLine: string, isExportLine: boolean, lineNum: number, symbols: CodeSymbol[], exports: string[], routes: RouteEndpoint[], state: ParserState): boolean {
  const classMatch = cleanDefLine.match(/^(?:abstract\s+)?(class|interface)\s+([A-Za-z0-9_]+)/);
  if (!classMatch) return false;
  const name = classMatch[2];
  if (isExportLine) exports.push(name);

  symbols.push({
    name,
    kind: classMatch[1] === 'interface' ? 'interface' : 'class',
    line: lineNum,
    isExported: isExportLine,
    decorators: [...state.pendingDecorators]
  });

  if (routes.length > 0 && routes[routes.length - 1].handler.startsWith('Controller (Line')) {
    routes[routes.length - 1].handler = `${name} (Controller)`;
  }

  state.pendingDecorators = [];
  state.currentScope = name;
  return true;
}

function parseFunctions(cleanDefLine: string, isExportLine: boolean, lineNum: number, symbols: CodeSymbol[], exports: string[], routes: RouteEndpoint[], state: ParserState): boolean {
  const funcMatch = cleanDefLine.match(/^(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(([^\)]*)\)/);
  if (!funcMatch) return false;
  const name = funcMatch[1];
  const params = funcMatch[2].split(',').map(p => p.split(':')[0].trim()).filter(Boolean);
  if (isExportLine) exports.push(name);

  symbols.push({
    name,
    kind: 'function',
    line: lineNum,
    isExported: isExportLine,
    params,
    decorators: [...state.pendingDecorators]
  });

  if (routes.length > 0 && routes[routes.length - 1].line === lineNum - state.pendingDecorators.length) {
    routes[routes.length - 1].handler = name;
  }

  state.pendingDecorators = [];
  state.currentScope = name;
  return true;
}

function parseMethods(trimmed: string, lineNum: number, symbols: CodeSymbol[], routes: RouteEndpoint[], state: ParserState): boolean {
  const methodMatch = trimmed.match(/^(?:public|private|protected)?\s*(?:static\s+)?(?:async\s+)?([A-Za-z0-9_]+)\s*\(([^\)]*)\)/);
  if (!methodMatch || /^(if|for|while|switch|catch|function|return|constructor)$/.test(methodMatch[1])) {
    return false;
  }
  const name = methodMatch[1];
  const params = methodMatch[2].split(',').map(p => p.split(':')[0].trim()).filter(Boolean);

  symbols.push({
    name,
    kind: 'function',
    line: lineNum,
    isExported: false,
    params,
    decorators: [...state.pendingDecorators]
  });

  if (routes.length > 0 && routes[routes.length - 1].line === lineNum - state.pendingDecorators.length) {
    routes[routes.length - 1].handler = name;
  }

  state.pendingDecorators = [];
  state.currentScope = name;
  return true;
}

function parseArrowFunctions(cleanDefLine: string, isExportLine: boolean, lineNum: number, symbols: CodeSymbol[], exports: string[], state: ParserState): boolean {
  const arrowMatch = cleanDefLine.match(/^(?:const|let|var)\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s*)?\(([^\)]*)\)\s*=>/);
  if (!arrowMatch) return false;
  const name = arrowMatch[1];
  const params = arrowMatch[2].split(',').map(p => p.split(':')[0].trim()).filter(Boolean);
  if (isExportLine) exports.push(name);

  symbols.push({
    name,
    kind: 'function',
    line: lineNum,
    isExported: isExportLine,
    params
  });

  state.pendingDecorators = [];
  state.currentScope = name;
  return true;
}

function parseExpressRoutes(trimmed: string, lineNum: number, routes: RouteEndpoint[]): void {
  const match = trimmed.match(/(?:app|router|server)\.(get|post|put|delete|patch)\(['"]([^'"]*)['"],\s*(?:async\s+)?(?:\([^\)]*\)\s*=>|function|\(?([A-Za-z0-9_\.]+)\)?)/i);
  if (match) {
    routes.push({
      path: match[2] || '/',
      method: match[1].toUpperCase() as any,
      handler: match[3] || 'anonymousHandler',
      line: lineNum
    });
  }
}

function parseCalls(lineText: string, lineNum: number, calls: FileCall[], currentScope: string): void {
  const callMatches = lineText.matchAll(/(?:this\.)?([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\(/g);
  for (const match of callMatches) {
    const calleeName = match[2];
    if (!/^(log|warn|error|info|push|pop|map|forEach|filter|reduce|slice|split|join|includes|find|bind|then|catch)$/.test(calleeName)) {
      calls.push({
        callerName: currentScope,
        calleeName,
        targetModule: match[1],
        line: lineNum
      });
    }
  }
}

function inferLayer(lowerPath: string, routesCount: number): ParsedFile['layer'] {
  if (/controller|handler|endpoint|route/.test(lowerPath) || routesCount > 0) return 'controller';
  if (/service|usecase|business|domain|manager/.test(lowerPath)) return 'service';
  if (/repository|dao|repo|db|database|prisma|query|storage/.test(lowerPath)) return 'repository';
  if (/model|entity|schema|type|dto|interface/.test(lowerPath)) return 'model';
  if (/client|api|gateway|fetch|http|sdk|provider/.test(lowerPath)) return 'client';
  if (/middleware|guard|auth|interceptor|filter|pipe/.test(lowerPath)) return 'middleware';
  if (/util|helper|common|shared|lib/.test(lowerPath)) return 'util';
  if (/config|setting|env|constant/.test(lowerPath)) return 'config';
  return 'other';
}

export function parseTypeScriptFile(filePath: string, relativePath: string, sourceText: string): ParsedFile {
  const lines = sourceText.split('\n');
  const imports: FileImport[] = [];
  const exports: string[] = [];
  const symbols: CodeSymbol[] = [];
  const calls: FileCall[] = [];
  const routes: RouteEndpoint[] = [];
  const state: ParserState = { currentScope: 'global', pendingDecorators: [], inMultiLineComment: false };

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    const trimmed = handleComments(lineText, state);
    if (!trimmed) return;

    if (parseDecorators(trimmed, lineNum, routes, state)) return;
    if (parseImports(trimmed, imports)) return;
    parseExports(trimmed, exports);

    const isExport = trimmed.startsWith('export ');
    const cleanLine = isExport ? trimmed.replace(/^export\s+(?:default\s+)?/, '') : trimmed;

    if (parseClasses(cleanLine, isExport, lineNum, symbols, exports, routes, state)) return;
    if (parseFunctions(cleanLine, isExport, lineNum, symbols, exports, routes, state)) return;
    if (parseMethods(trimmed, lineNum, symbols, routes, state)) return;
    if (parseArrowFunctions(cleanLine, isExport, lineNum, symbols, exports, state)) return;

    state.pendingDecorators = [];
    parseExpressRoutes(trimmed, lineNum, routes);
    parseCalls(lineText, lineNum, calls, state.currentScope);
  });

  return {
    filePath,
    relativePath,
    language: (relativePath.endsWith('.ts') || relativePath.endsWith('.tsx')) ? 'TypeScript' : 'JavaScript',
    framework: (relativePath.endsWith('.tsx') || relativePath.endsWith('.jsx')) ? 'React' : undefined,
    linesOfCode: lines.length,
    imports,
    exports,
    symbols,
    calls,
    routes,
    layer: inferLayer(relativePath.toLowerCase(), routes.length)
  };
}
