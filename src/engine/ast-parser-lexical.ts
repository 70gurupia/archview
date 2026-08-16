import { ParsedFile, CodeSymbol, FileImport, FileCall, RouteEndpoint } from './types.js';

type ParserFn = (lines: string[], imports: FileImport[], exports: string[], symbols: CodeSymbol[], calls: FileCall[], routes: RouteEndpoint[]) => void;

const LAYER_RULES: Array<{ regex: RegExp; layer: ParsedFile['layer'] }> = [
  { regex: /controller|handler|endpoint|route|view/, layer: 'controller' },
  { regex: /service|usecase|business|domain|manager/, layer: 'service' },
  { regex: /repository|dao|repo|db|database|model|entity|schema|table/, layer: 'repository' },
  { regex: /client|api|gateway|fetch|http|sdk|provider/, layer: 'client' },
  { regex: /middleware|guard|auth|interceptor|filter/, layer: 'middleware' },
  { regex: /util|helper|common|shared|lib/, layer: 'util' },
  { regex: /config|setting|env|constant/, layer: 'config' }
];

function inferLayer(lowerPath: string, routesCount: number): ParsedFile['layer'] {
  if (routesCount > 0) return 'controller';
  for (const rule of LAYER_RULES) {
    if (rule.regex.test(lowerPath)) return rule.layer;
  }
  return 'other';
}

function inferPythonFramework(imports: FileImport[], routes: RouteEndpoint[]): string | undefined {
  if (imports.some(i => i.source.includes('fastapi')) || routes.some(r => r.handler.includes('fastapi'))) return 'FastAPI';
  if (imports.some(i => i.source.includes('django'))) return 'Django';
  if (imports.some(i => i.source.includes('flask'))) return 'Flask';
  return undefined;
}

function inferGoFramework(imports: FileImport[]): string | undefined {
  if (imports.some(i => i.source.includes('gin-gonic'))) return 'Gin';
  if (imports.some(i => i.source.includes('gofiber'))) return 'Fiber';
  if (imports.some(i => i.source.includes('echo'))) return 'Echo';
  return undefined;
}

function inferJvmFramework(imports: FileImport[]): string | undefined {
  if (imports.some(i => i.source.includes('springframework'))) return 'Spring Boot';
  if (imports.some(i => i.source.includes('quarkus'))) return 'Quarkus';
  return undefined;
}

function inferFramework(language: string, imports: FileImport[], routes: RouteEndpoint[]): string | undefined {
  if (language === 'Python') return inferPythonFramework(imports, routes);
  if (language === 'Go') return inferGoFramework(imports);
  if (language === 'Java' || language === 'Kotlin') return inferJvmFramework(imports);
  return undefined;
}

export function parseLexicalFile(filePath: string, relativePath: string, sourceText: string): ParsedFile {
  const ext = relativePath.split('.').pop()?.toLowerCase() || '';
  const lines = sourceText.split('\n');

  const imports: FileImport[] = [];
  const exports: string[] = [];
  const symbols: CodeSymbol[] = [];
  const calls: FileCall[] = [];
  const routes: RouteEndpoint[] = [];

  const handler = PARSER_DISPATCH[ext];
  const language = handler ? handler.language : ext.toUpperCase();

  if (handler) {
    handler.parse(lines, imports, exports, symbols, calls, routes);
  } else {
    parseGeneric(lines, imports, symbols, calls);
  }

  const framework = inferFramework(language, imports, routes);
  const layer = inferLayer(relativePath.toLowerCase(), routes.length);

  return {
    filePath,
    relativePath,
    language,
    framework,
    linesOfCode: lines.length,
    imports,
    exports,
    symbols,
    calls,
    routes,
    layer
  };
}

// 1. Python Parser Helpers
function parsePythonImport(trimmed: string, imports: FileImport[]): boolean {
  if (trimmed.startsWith('import ')) {
    const mod = trimmed.replace(/^import\s+/, '').split(' as ')[0].trim();
    imports.push({ source: mod, specifiers: [mod], isDefault: true, isNamespace: false });
    return true;
  }
  if (trimmed.startsWith('from ')) {
    const fromMatch = trimmed.match(/^from\s+([\w\.]+)\s+import\s+(.+)$/);
    if (fromMatch) {
      const source = fromMatch[1];
      const specifiers = fromMatch[2].split(',').map(s => s.split(' as ')[0].trim()).filter(Boolean);
      imports.push({ source, specifiers, isDefault: false, isNamespace: false });
      return true;
    }
  }
  return false;
}

function parsePythonClassOrFunc(
  trimmed: string,
  lineNum: number,
  pendingDecorators: string[],
  exports: string[],
  symbols: CodeSymbol[],
  routes: RouteEndpoint[]
): string | null {
  const classMatch = trimmed.match(/^class\s+([A-Za-z0-9_]+)(?:\([^\)]*\))?:/);
  if (classMatch) {
    const name = classMatch[1];
    exports.push(name);
    symbols.push({ name, kind: 'class', line: lineNum, isExported: true, decorators: [...pendingDecorators] });
    return name;
  }

  const funcMatch = trimmed.match(/^def\s+([A-Za-z0-9_]+)\s*\(([^\)]*)\)/);
  if (funcMatch) {
    const name = funcMatch[1];
    const params = funcMatch[2].split(',').map(p => p.split(':')[0].trim()).filter(Boolean);
    const isPublic = !name.startsWith('_');
    if (isPublic) exports.push(name);

    symbols.push({ name, kind: 'function', line: lineNum, isExported: isPublic, params, decorators: [...pendingDecorators] });
    if (routes.length > 0 && routes[routes.length - 1].line === lineNum - pendingDecorators.length) {
      routes[routes.length - 1].handler = name;
    }
    return name;
  }
  return null;
}

function parsePython(lines: string[], imports: FileImport[], exports: string[], symbols: CodeSymbol[], calls: FileCall[], routes: RouteEndpoint[]): void {
  let currentScope = 'global';
  let pendingDecorators: string[] = [];

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    const trimmed = lineText.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    if (trimmed.startsWith('@')) {
      pendingDecorators.push(trimmed);
      const routeMatch = trimmed.match(/@(?:app|router|api)\.(get|post|put|delete|patch)\(['"]([^'"]*)['"]\)/i);
      if (routeMatch) {
        routes.push({
          path: routeMatch[2] || '/',
          method: routeMatch[1].toUpperCase() as any,
          handler: `Line ${lineNum}`,
          line: lineNum
        });
      }
      return;
    }

    if (parsePythonImport(trimmed, imports)) return;

    const newScope = parsePythonClassOrFunc(trimmed, lineNum, pendingDecorators, exports, symbols, routes);
    if (newScope) {
      currentScope = newScope;
      pendingDecorators = [];
      return;
    }

    pendingDecorators = [];
    const callMatches = lineText.matchAll(/([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\(/g);
    for (const match of callMatches) {
      calls.push({ callerName: currentScope, calleeName: match[2], targetModule: match[1], line: lineNum });
    }
  });
}

// 2. Go Parser Helpers
function parseGoImport(trimmed: string, imports: FileImport[]): void {
  const mod = trimmed.replace(/import\s+"?([^"]+)"?/, '$1').replace(/"/g, '').trim();
  if (mod) {
    imports.push({ source: mod, specifiers: [mod.split('/').pop() || mod], isDefault: true, isNamespace: false });
  }
}

function parseGoSymbol(trimmed: string, lineNum: number, exports: string[], symbols: CodeSymbol[]): string | null {
  const typeMatch = trimmed.match(/^type\s+([A-Za-z0-9_]+)\s+(struct|interface)\b/);
  if (typeMatch) {
    const name = typeMatch[1];
    const isExported = /^[A-Z]/.test(name);
    if (isExported) exports.push(name);
    symbols.push({ name, kind: typeMatch[2] === 'interface' ? 'interface' : 'class', line: lineNum, isExported });
    return name;
  }

  const methodMatch = trimmed.match(/^func\s+\([^\)]+\)\s+([A-Za-z0-9_]+)\s*\(([^\)]*)\)/);
  const funcMatch = trimmed.match(/^func\s+([A-Za-z0-9_]+)\s*\(([^\)]*)\)/);
  if (methodMatch || funcMatch) {
    const name = (methodMatch || funcMatch)![1];
    const isExported = /^[A-Z]/.test(name);
    if (isExported) exports.push(name);
    symbols.push({ name, kind: 'function', line: lineNum, isExported });
    return name;
  }
  return null;
}

function parseGo(lines: string[], imports: FileImport[], exports: string[], symbols: CodeSymbol[], calls: FileCall[], routes: RouteEndpoint[]): void {
  let currentScope = 'global';
  let inImportBlock = false;

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    const trimmed = lineText.trim();
    if (!trimmed || trimmed.startsWith('//')) return;

    if (trimmed === 'import (') { inImportBlock = true; return; }
    if (inImportBlock) {
      if (trimmed === ')') { inImportBlock = false; return; }
      parseGoImport(trimmed, imports);
      return;
    }
    if (trimmed.startsWith('import ')) { parseGoImport(trimmed, imports); return; }

    const newScope = parseGoSymbol(trimmed, lineNum, exports, symbols);
    if (newScope) { currentScope = newScope; return; }

    const routeMatch = trimmed.match(/(?:r|router|e|app)\.(GET|POST|PUT|DELETE|PATCH)\(['"]([^'"]*)['"],\s*([A-Za-z0-9_\.]+)\)/i);
    if (routeMatch) {
      routes.push({ path: routeMatch[2] || '/', method: routeMatch[1].toUpperCase() as any, handler: routeMatch[3] || 'Handler', line: lineNum });
    }

    const callMatches = lineText.matchAll(/([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\(/g);
    for (const match of callMatches) {
      calls.push({ callerName: currentScope, calleeName: match[2], targetModule: match[1], line: lineNum });
    }
  });
}

// 3. Java / Kotlin Parser Helpers
function parseJavaAnnotation(trimmed: string, lineNum: number, routes: RouteEndpoint[]): boolean {
  if (!trimmed.startsWith('@')) return false;
  const httpMatch = trimmed.match(/@(Get|Post|Put|Delete|Patch)Mapping(?:\(['"]([^'"]*)['"]\))?/i);
  if (httpMatch) {
    routes.push({ path: httpMatch[2] || '/', method: httpMatch[1].toUpperCase() as any, handler: `Line ${lineNum}`, line: lineNum });
  }
  return true;
}

function parseJavaImport(trimmed: string, imports: FileImport[]): boolean {
  if (!trimmed.startsWith('import ')) return false;
  const mod = trimmed.replace(/^import\s+/, '').replace(/;$/, '').trim();
  imports.push({ source: mod, specifiers: [mod.split('.').pop() || mod], isDefault: true, isNamespace: false });
  return true;
}

function parseJavaClassSymbol(trimmed: string, lineNum: number, pendingAnnotations: string[], exports: string[], symbols: CodeSymbol[]): string | null {
  const classMatch = trimmed.match(/(?:public|protected|private)?\s*(?:static|abstract|final)?\s*(class|interface|record)\s+([A-Za-z0-9_]+)/);
  if (!classMatch) return null;
  const name = classMatch[2];
  exports.push(name);
  symbols.push({ name, kind: classMatch[1] === 'interface' ? 'interface' : 'class', line: lineNum, isExported: true, decorators: [...pendingAnnotations] });
  return name;
}

function parseJavaMethodSymbol(trimmed: string, lineNum: number, pendingAnnotations: string[], symbols: CodeSymbol[], routes: RouteEndpoint[]): string | null {
  const methodMatch = trimmed.match(/(?:public|protected|private)\s+[\w<>,\[\]]+\s+([A-Za-z0-9_]+)\s*\(([^\)]*)\)/);
  if (!methodMatch || /^(if|for|while|switch|catch)$/.test(methodMatch[1])) return null;
  const name = methodMatch[1];
  symbols.push({ name, kind: 'function', line: lineNum, isExported: true, decorators: [...pendingAnnotations] });
  if (routes.length > 0 && routes[routes.length - 1].line === lineNum - pendingAnnotations.length) {
    routes[routes.length - 1].handler = name;
  }
  return name;
}

function parseJavaSymbol(trimmed: string, lineNum: number, pendingAnnotations: string[], exports: string[], symbols: CodeSymbol[], routes: RouteEndpoint[]): string | null {
  return parseJavaClassSymbol(trimmed, lineNum, pendingAnnotations, exports, symbols) ||
         parseJavaMethodSymbol(trimmed, lineNum, pendingAnnotations, symbols, routes);
}

function parseJavaKotlin(lines: string[], imports: FileImport[], exports: string[], symbols: CodeSymbol[], calls: FileCall[], routes: RouteEndpoint[]): void {
  let currentScope = 'global';
  let pendingAnnotations: string[] = [];

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    const trimmed = lineText.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) return;

    if (parseJavaAnnotation(trimmed, lineNum, routes)) {
      pendingAnnotations.push(trimmed);
      return;
    }

    if (parseJavaImport(trimmed, imports)) return;

    const newScope = parseJavaSymbol(trimmed, lineNum, pendingAnnotations, exports, symbols, routes);
    if (newScope) {
      currentScope = newScope;
      pendingAnnotations = [];
      return;
    }

    pendingAnnotations = [];
    const callMatches = lineText.matchAll(/([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\(/g);
    for (const match of callMatches) {
      calls.push({ callerName: currentScope, calleeName: match[2], targetModule: match[1], line: lineNum });
    }
  });
}

// 4. Rust Parser Helpers
function parseRustImport(trimmed: string, imports: FileImport[]): boolean {
  if (!trimmed.startsWith('use ')) return false;
  const mod = trimmed.replace(/^use\s+/, '').replace(/;$/, '').trim();
  imports.push({ source: mod, specifiers: [mod.split('::').pop() || mod], isDefault: true, isNamespace: false });
  return true;
}

function parseRustSymbol(trimmed: string, lineNum: number, exports: string[], symbols: CodeSymbol[]): string | null {
  const structMatch = trimmed.match(/(?:pub\s+)?(struct|enum|trait)\s+([A-Za-z0-9_]+)/);
  if (structMatch) {
    const name = structMatch[2];
    const isExported = trimmed.startsWith('pub ');
    if (isExported) exports.push(name);
    symbols.push({ name, kind: structMatch[1] === 'trait' ? 'interface' : 'class', line: lineNum, isExported });
    return name;
  }

  const fnMatch = trimmed.match(/(?:pub\s+)?(?:async\s+)?fn\s+([A-Za-z0-9_]+)\s*\(/);
  if (fnMatch) {
    const name = fnMatch[1];
    const isExported = trimmed.startsWith('pub ');
    if (isExported) exports.push(name);
    symbols.push({ name, kind: 'function', line: lineNum, isExported });
    return name;
  }
  return null;
}

function parseRust(lines: string[], imports: FileImport[], exports: string[], symbols: CodeSymbol[], calls: FileCall[], _routes: RouteEndpoint[]): void {
  let currentScope = 'global';

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    const trimmed = lineText.trim();
    if (!trimmed || trimmed.startsWith('//')) return;

    if (parseRustImport(trimmed, imports)) return;

    const newScope = parseRustSymbol(trimmed, lineNum, exports, symbols);
    if (newScope) {
      currentScope = newScope;
      return;
    }

    const callMatches = lineText.matchAll(/([A-Za-z0-9_]+)::([A-Za-z0-9_]+)\(/g);
    for (const match of callMatches) {
      calls.push({ callerName: currentScope, calleeName: match[2], targetModule: match[1], line: lineNum });
    }
  });
}

// 5. PHP Parser
function parsePHP(lines: string[], imports: FileImport[], exports: string[], symbols: CodeSymbol[], calls: FileCall[], _routes: RouteEndpoint[]): void {
  let currentScope = 'global';

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    const trimmed = lineText.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('#')) return;

    if (trimmed.startsWith('use ')) {
      const mod = trimmed.replace(/^use\s+/, '').replace(/;$/, '').trim();
      imports.push({ source: mod, specifiers: [mod.split('\\').pop() || mod], isDefault: true, isNamespace: false });
      return;
    }

    const classMatch = trimmed.match(/(?:abstract\s+|final\s+)?(class|interface|trait)\s+([A-Za-z0-9_]+)/);
    if (classMatch) {
      const name = classMatch[2];
      exports.push(name);
      symbols.push({ name, kind: classMatch[1] === 'interface' ? 'interface' : 'class', line: lineNum, isExported: true });
      currentScope = name;
      return;
    }

    const fnMatch = trimmed.match(/(?:public|protected|private)?\s*function\s+([A-Za-z0-9_]+)\s*\(/);
    if (fnMatch) {
      const name = fnMatch[1];
      symbols.push({ name, kind: 'function', line: lineNum, isExported: true });
      currentScope = name;
      return;
    }

    const callMatches = lineText.matchAll(/([A-Za-z0-9_]+)->([A-Za-z0-9_]+)\(/g);
    for (const match of callMatches) {
      calls.push({ callerName: currentScope, calleeName: match[2], targetModule: match[1], line: lineNum });
    }
  });
}

// 6. C# Parser Helpers
function parseCSharpUsing(trimmed: string, imports: FileImport[]): boolean {
  if (!trimmed.startsWith('using ') || trimmed.includes('(')) return false;
  const mod = trimmed.replace(/^using\s+/, '').replace(/;$/, '').trim();
  imports.push({ source: mod, specifiers: [mod.split('.').pop() || mod], isDefault: true, isNamespace: false });
  return true;
}

function parseCSharpSymbol(trimmed: string, lineNum: number, exports: string[], symbols: CodeSymbol[]): string | null {
  const classMatch = trimmed.match(/(?:public|protected|private|internal)?\s*(?:static|abstract|sealed)?\s*(class|interface|struct|record)\s+([A-Za-z0-9_]+)/);
  if (classMatch) {
    const name = classMatch[2];
    exports.push(name);
    symbols.push({ name, kind: classMatch[1] === 'interface' ? 'interface' : 'class', line: lineNum, isExported: true });
    return name;
  }

  const methodMatch = trimmed.match(/(?:public|protected|private|internal)\s+[\w<>,\[\]]+\s+([A-Za-z0-9_]+)\s*\(/);
  if (methodMatch && !/^(if|for|while|switch|catch)$/.test(methodMatch[1])) {
    const name = methodMatch[1];
    symbols.push({ name, kind: 'function', line: lineNum, isExported: true });
    return name;
  }
  return null;
}

function parseCSharp(lines: string[], imports: FileImport[], exports: string[], symbols: CodeSymbol[], calls: FileCall[], _routes: RouteEndpoint[]): void {
  let currentScope = 'global';

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    const trimmed = lineText.trim();
    if (!trimmed || trimmed.startsWith('//')) return;

    if (parseCSharpUsing(trimmed, imports)) return;

    const newScope = parseCSharpSymbol(trimmed, lineNum, exports, symbols);
    if (newScope) {
      currentScope = newScope;
      return;
    }

    const callMatches = lineText.matchAll(/([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\(/g);
    for (const match of callMatches) {
      calls.push({ callerName: currentScope, calleeName: match[2], targetModule: match[1], line: lineNum });
    }
  });
}

// 7. Generic Parser
function parseGeneric(lines: string[], imports: FileImport[], symbols: CodeSymbol[], calls: FileCall[]): void {
  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    const trimmed = lineText.trim();
    if (!trimmed) return;

    const fnMatch = trimmed.match(/function\s+([A-Za-z0-9_]+)/);
    if (fnMatch) {
      symbols.push({ name: fnMatch[1], kind: 'function', line: lineNum, isExported: true });
    }
  });
}

const PARSER_DISPATCH: Record<string, { language: string; parse: ParserFn }> = {
  py: { language: 'Python', parse: parsePython },
  go: { language: 'Go', parse: parseGo },
  java: { language: 'Java', parse: parseJavaKotlin },
  kt: { language: 'Kotlin', parse: parseJavaKotlin },
  rs: { language: 'Rust', parse: parseRust },
  php: { language: 'PHP', parse: parsePHP },
  cs: { language: 'C#', parse: parseCSharp }
};
