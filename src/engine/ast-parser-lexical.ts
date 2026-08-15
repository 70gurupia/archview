import { ParsedFile, CodeSymbol, FileImport, FileCall, RouteEndpoint } from './types.js';

export function parseLexicalFile(filePath: string, relativePath: string, sourceText: string): ParsedFile {
  const ext = relativePath.split('.').pop()?.toLowerCase() || '';
  const lines = sourceText.split('\n');
  const linesOfCode = lines.length;

  const imports: FileImport[] = [];
  const exports: string[] = [];
  const symbols: CodeSymbol[] = [];
  const calls: FileCall[] = [];
  const routes: RouteEndpoint[] = [];

  let language = 'Unknown';
  let framework: string | undefined;

  switch (ext) {
    case 'py':
      language = 'Python';
      parsePython(lines, imports, exports, symbols, calls, routes);
      break;
    case 'go':
      language = 'Go';
      parseGo(lines, imports, exports, symbols, calls, routes);
      break;
    case 'java':
    case 'kt':
      language = ext === 'kt' ? 'Kotlin' : 'Java';
      parseJavaKotlin(lines, imports, exports, symbols, calls, routes);
      break;
    case 'rs':
      language = 'Rust';
      parseRust(lines, imports, exports, symbols, calls, routes);
      break;
    case 'php':
      language = 'PHP';
      parsePHP(lines, imports, exports, symbols, calls, routes);
      break;
    case 'cs':
      language = 'C#';
      parseCSharp(lines, imports, exports, symbols, calls, routes);
      break;
    default:
      language = ext.toUpperCase();
      parseGeneric(lines, imports, symbols, calls);
      break;
  }

  // Infer framework from imports / annotations
  if (language === 'Python') {
    if (imports.some(i => i.source.includes('fastapi')) || routes.some(r => r.handler.includes('fastapi'))) framework = 'FastAPI';
    else if (imports.some(i => i.source.includes('django'))) framework = 'Django';
    else if (imports.some(i => i.source.includes('flask'))) framework = 'Flask';
  } else if (language === 'Go') {
    if (imports.some(i => i.source.includes('gin-gonic'))) framework = 'Gin';
    else if (imports.some(i => i.source.includes('gofiber'))) framework = 'Fiber';
    else if (imports.some(i => i.source.includes('echo'))) framework = 'Echo';
  } else if (language === 'Java' || language === 'Kotlin') {
    if (imports.some(i => i.source.includes('springframework'))) framework = 'Spring Boot';
    else if (imports.some(i => i.source.includes('quarkus'))) framework = 'Quarkus';
  }

  // Infer layer from file path and content
  const lowerPath = relativePath.toLowerCase();
  let layer: ParsedFile['layer'] = 'other';
  if (/controller|handler|endpoint|route|view/.test(lowerPath) || routes.length > 0) {
    layer = 'controller';
  } else if (/service|usecase|business|domain|manager/.test(lowerPath)) {
    layer = 'service';
  } else if (/repository|dao|repo|db|database|model|entity|schema|table/.test(lowerPath)) {
    layer = 'repository';
  } else if (/client|api|gateway|fetch|http|sdk|provider/.test(lowerPath)) {
    layer = 'client';
  } else if (/middleware|guard|auth|interceptor|filter/.test(lowerPath)) {
    layer = 'middleware';
  } else if (/util|helper|common|shared|lib/.test(lowerPath)) {
    layer = 'util';
  } else if (/config|setting|env|constant/.test(lowerPath)) {
    layer = 'config';
  }

  return {
    filePath,
    relativePath,
    language,
    framework,
    linesOfCode,
    imports,
    exports,
    symbols,
    calls,
    routes,
    layer
  };
}

// 1. Python Parser
function parsePython(lines: string[], imports: FileImport[], exports: string[], symbols: CodeSymbol[], calls: FileCall[], routes: RouteEndpoint[]) {
  let currentScope = 'global';
  let pendingDecorators: string[] = [];

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    const trimmed = lineText.trim();
    if (!trimmed || trimmed.startsWith('#')) return;

    // Decorators: @app.get('/users'), @router.post(...)
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

    // Imports: import os, from app.services import UserService, AuthService
    if (trimmed.startsWith('import ')) {
      const mod = trimmed.replace(/^import\s+/, '').split(' as ')[0].trim();
      imports.push({ source: mod, specifiers: [mod], isDefault: true, isNamespace: false });
    } else if (trimmed.startsWith('from ')) {
      const fromMatch = trimmed.match(/^from\s+([\w\.]+)\s+import\s+(.+)$/);
      if (fromMatch) {
        const source = fromMatch[1];
        const specifiers = fromMatch[2].split(',').map(s => s.split(' as ')[0].trim()).filter(Boolean);
        imports.push({ source, specifiers, isDefault: false, isNamespace: false });
      }
    }

    // Class: class UserService(BaseService):
    const classMatch = trimmed.match(/^class\s+([A-Za-z0-9_]+)(?:\([^\)]*\))?:/);
    if (classMatch) {
      const name = classMatch[1];
      exports.push(name);
      symbols.push({
        name,
        kind: 'class',
        line: lineNum,
        isExported: true,
        decorators: [...pendingDecorators]
      });
      pendingDecorators = [];
      currentScope = name;
      return;
    }

    // Function: def get_user_by_id(user_id: int) -> User:
    const funcMatch = trimmed.match(/^def\s+([A-Za-z0-9_]+)\s*\(([^\)]*)\)/);
    if (funcMatch) {
      const name = funcMatch[1];
      const params = funcMatch[2].split(',').map(p => p.split(':')[0].trim()).filter(Boolean);
      const isPublic = !name.startsWith('_');
      if (isPublic) exports.push(name);

      symbols.push({
        name,
        kind: 'function',
        line: lineNum,
        isExported: isPublic,
        params,
        decorators: [...pendingDecorators]
      });

      // Update route handler name if route decorator preceded this function
      if (routes.length > 0 && routes[routes.length - 1].line === lineNum - pendingDecorators.length) {
        routes[routes.length - 1].handler = name;
      }

      pendingDecorators = [];
      currentScope = name;
      return;
    }

    pendingDecorators = [];

    // Calls: service.call(), do_work()
    const callMatches = lineText.matchAll(/([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\(/g);
    for (const match of callMatches) {
      calls.push({
        callerName: currentScope,
        calleeName: match[2],
        targetModule: match[1],
        line: lineNum
      });
    }
  });
}

// 2. Go Parser
function parseGo(lines: string[], imports: FileImport[], exports: string[], symbols: CodeSymbol[], calls: FileCall[], routes: RouteEndpoint[]) {
  let currentScope = 'global';
  let inImportBlock = false;

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    const trimmed = lineText.trim();
    if (!trimmed || trimmed.startsWith('//')) return;

    if (trimmed === 'import (') {
      inImportBlock = true;
      return;
    }
    if (inImportBlock) {
      if (trimmed === ')') {
        inImportBlock = false;
        return;
      }
      const mod = trimmed.replace(/"/g, '').trim();
      if (mod) imports.push({ source: mod, specifiers: [mod.split('/').pop() || mod], isDefault: true, isNamespace: false });
      return;
    }
    if (trimmed.startsWith('import ')) {
      const mod = trimmed.replace(/import\s+"?([^"]+)"?/, '$1').trim();
      imports.push({ source: mod, specifiers: [mod.split('/').pop() || mod], isDefault: true, isNamespace: false });
      return;
    }

    // Struct / Interface: type UserService struct { ... }
    const typeMatch = trimmed.match(/^type\s+([A-Za-z0-9_]+)\s+(struct|interface)\b/);
    if (typeMatch) {
      const name = typeMatch[1];
      const isExported = /^[A-Z]/.test(name);
      if (isExported) exports.push(name);
      symbols.push({
        name,
        kind: typeMatch[2] === 'interface' ? 'interface' : 'class',
        line: lineNum,
        isExported
      });
      return;
    }

    // Function: func (s *Service) Method(ctx context.Context) error
    const methodMatch = trimmed.match(/^func\s+\([^\)]+\)\s+([A-Za-z0-9_]+)\s*\(([^\)]*)\)/);
    const funcMatch = trimmed.match(/^func\s+([A-Za-z0-9_]+)\s*\(([^\)]*)\)/);
    if (methodMatch || funcMatch) {
      const name = (methodMatch || funcMatch)![1];
      const isExported = /^[A-Z]/.test(name);
      if (isExported) exports.push(name);
      symbols.push({
        name,
        kind: 'function',
        line: lineNum,
        isExported
      });
      currentScope = name;
      return;
    }

    // Go Routes: r.GET("/path", handler), http.HandleFunc("/path", handler)
    const routeMatch = trimmed.match(/(?:r|router|e|app)\.(GET|POST|PUT|DELETE|PATCH)\(['"]([^'"]*)['"],\s*([A-Za-z0-9_\.]+)\)/i);
    if (routeMatch) {
      routes.push({
        path: routeMatch[2] || '/',
        method: routeMatch[1].toUpperCase() as any,
        handler: routeMatch[3] || 'Handler',
        line: lineNum
      });
    }

    // Calls
    const callMatches = lineText.matchAll(/([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\(/g);
    for (const match of callMatches) {
      calls.push({
        callerName: currentScope,
        calleeName: match[2],
        targetModule: match[1],
        line: lineNum
      });
    }
  });
}

// 3. Java / Kotlin Parser
function parseJavaKotlin(lines: string[], imports: FileImport[], exports: string[], symbols: CodeSymbol[], calls: FileCall[], routes: RouteEndpoint[]) {
  let currentScope = 'global';
  let pendingAnnotations: string[] = [];

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    const trimmed = lineText.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*')) return;

    // Annotations: @GetMapping("/users"), @RestController
    if (trimmed.startsWith('@')) {
      pendingAnnotations.push(trimmed);
      const httpMatch = trimmed.match(/@(Get|Post|Put|Delete|Patch)Mapping(?:\(['"]([^'"]*)['"]\))?/i);
      if (httpMatch) {
        routes.push({
          path: httpMatch[2] || '/',
          method: httpMatch[1].toUpperCase() as any,
          handler: `Line ${lineNum}`,
          line: lineNum
        });
      }
      return;
    }

    // Import: import com.example.service.UserService;
    if (trimmed.startsWith('import ')) {
      const mod = trimmed.replace(/^import\s+/, '').replace(/;$/, '').trim();
      const spec = mod.split('.').pop() || mod;
      imports.push({ source: mod, specifiers: [spec], isDefault: true, isNamespace: false });
      return;
    }

    // Class / Interface: public class UserService {
    const classMatch = trimmed.match(/(?:public|protected|private)?\s*(?:static|abstract|final)?\s*(class|interface|record)\s+([A-Za-z0-9_]+)/);
    if (classMatch) {
      const name = classMatch[2];
      exports.push(name);
      symbols.push({
        name,
        kind: classMatch[1] === 'interface' ? 'interface' : 'class',
        line: lineNum,
        isExported: true,
        decorators: [...pendingAnnotations]
      });
      pendingAnnotations = [];
      currentScope = name;
      return;
    }

    // Method: public UserResponse getUserById(Long id) {
    const methodMatch = trimmed.match(/(?:public|protected|private)\s+[\w<>,\[\]]+\s+([A-Za-z0-9_]+)\s*\(([^\)]*)\)/);
    if (methodMatch) {
      const name = methodMatch[1];
      if (!/^(if|for|while|switch|catch)$/.test(name)) {
        symbols.push({
          name,
          kind: 'function',
          line: lineNum,
          isExported: true,
          decorators: [...pendingAnnotations]
        });

        if (routes.length > 0 && routes[routes.length - 1].line === lineNum - pendingAnnotations.length) {
          routes[routes.length - 1].handler = name;
        }

        pendingAnnotations = [];
        currentScope = name;
        return;
      }
    }

    pendingAnnotations = [];

    // Method Calls
    const callMatches = lineText.matchAll(/([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\(/g);
    for (const match of callMatches) {
      calls.push({
        callerName: currentScope,
        calleeName: match[2],
        targetModule: match[1],
        line: lineNum
      });
    }
  });
}

// 4. Rust Parser
function parseRust(lines: string[], imports: FileImport[], exports: string[], symbols: CodeSymbol[], calls: FileCall[], routes: RouteEndpoint[]) {
  let currentScope = 'global';

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    const trimmed = lineText.trim();
    if (!trimmed || trimmed.startsWith('//')) return;

    if (trimmed.startsWith('use ')) {
      const mod = trimmed.replace(/^use\s+/, '').replace(/;$/, '').trim();
      imports.push({ source: mod, specifiers: [mod.split('::').pop() || mod], isDefault: true, isNamespace: false });
      return;
    }

    const structMatch = trimmed.match(/(?:pub\s+)?(struct|enum|trait)\s+([A-Za-z0-9_]+)/);
    if (structMatch) {
      const name = structMatch[2];
      const isExported = trimmed.startsWith('pub ');
      if (isExported) exports.push(name);
      symbols.push({
        name,
        kind: structMatch[1] === 'trait' ? 'interface' : 'class',
        line: lineNum,
        isExported
      });
      return;
    }

    const fnMatch = trimmed.match(/(?:pub\s+)?(?:async\s+)?fn\s+([A-Za-z0-9_]+)\s*\(/);
    if (fnMatch) {
      const name = fnMatch[1];
      const isExported = trimmed.startsWith('pub ');
      if (isExported) exports.push(name);
      symbols.push({
        name,
        kind: 'function',
        line: lineNum,
        isExported
      });
      currentScope = name;
      return;
    }

    const callMatches = lineText.matchAll(/([A-Za-z0-9_]+)(?:::|\.)([A-Za-z0-9_]+)\(/g);
    for (const match of callMatches) {
      calls.push({
        callerName: currentScope,
        calleeName: match[2],
        targetModule: match[1],
        line: lineNum
      });
    }
  });
}

// 5. PHP Parser
function parsePHP(lines: string[], imports: FileImport[], exports: string[], symbols: CodeSymbol[], calls: FileCall[], routes: RouteEndpoint[]) {
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

    const classMatch = trimmed.match(/(?:abstract\s+|final\s+)?(class|interface)\s+([A-Za-z0-9_]+)/);
    if (classMatch) {
      const name = classMatch[2];
      exports.push(name);
      symbols.push({
        name,
        kind: classMatch[1] === 'interface' ? 'interface' : 'class',
        line: lineNum,
        isExported: true
      });
      currentScope = name;
      return;
    }

    const funcMatch = trimmed.match(/(?:public|protected|private)?\s*function\s+([A-Za-z0-9_]+)\s*\(/);
    if (funcMatch) {
      const name = funcMatch[1];
      exports.push(name);
      symbols.push({
        name,
        kind: 'function',
        line: lineNum,
        isExported: true
      });
      currentScope = name;
      return;
    }
  });
}

// 6. C# Parser
function parseCSharp(lines: string[], imports: FileImport[], exports: string[], symbols: CodeSymbol[], calls: FileCall[], routes: RouteEndpoint[]) {
  let currentScope = 'global';

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    const trimmed = lineText.trim();
    if (!trimmed || trimmed.startsWith('//')) return;

    if (trimmed.startsWith('using ') && !trimmed.includes('(')) {
      const mod = trimmed.replace(/^using\s+/, '').replace(/;$/, '').trim();
      imports.push({ source: mod, specifiers: [mod.split('.').pop() || mod], isDefault: true, isNamespace: false });
      return;
    }

    const classMatch = trimmed.match(/(?:public|internal|private)?\s*(?:static|abstract|sealed)?\s*(class|interface|record|struct)\s+([A-Za-z0-9_]+)/);
    if (classMatch) {
      const name = classMatch[2];
      exports.push(name);
      symbols.push({
        name,
        kind: classMatch[1] === 'interface' ? 'interface' : 'class',
        line: lineNum,
        isExported: true
      });
      currentScope = name;
      return;
    }

    const methodMatch = trimmed.match(/(?:public|internal|private)\s+(?:static|async\s+)?[\w<>,\[\]]+\s+([A-Za-z0-9_]+)\s*\(/);
    if (methodMatch) {
      const name = methodMatch[1];
      if (!/^(if|for|while|switch|catch)$/.test(name)) {
        symbols.push({
          name,
          kind: 'function',
          line: lineNum,
          isExported: true
        });
        currentScope = name;
      }
    }
  });
}

function parseGeneric(lines: string[], imports: FileImport[], symbols: CodeSymbol[], calls: FileCall[]) {
  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    const trimmed = lineText.trim();
    const funcMatch = trimmed.match(/(?:function|def|fn|func)\s+([A-Za-z0-9_]+)/);
    if (funcMatch) {
      symbols.push({
        name: funcMatch[1],
        kind: 'function',
        line: lineNum,
        isExported: true
      });
    }
  });
}
