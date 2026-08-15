import { ParsedFile, CodeSymbol, FileImport, FileCall, RouteEndpoint } from './types.js';

export function parseTypeScriptFile(filePath: string, relativePath: string, sourceText: string): ParsedFile {
  const lines = sourceText.split('\n');
  const linesOfCode = lines.length;

  const imports: FileImport[] = [];
  const exports: string[] = [];
  const symbols: CodeSymbol[] = [];
  const calls: FileCall[] = [];
  const routes: RouteEndpoint[] = [];

  let currentScope: string = 'global';
  let pendingDecorators: string[] = [];
  let inMultiLineComment = false;

  lines.forEach((lineText, idx) => {
    const lineNum = idx + 1;
    let trimmed = lineText.trim();

    // Handle multiline comments
    if (inMultiLineComment) {
      if (trimmed.includes('*/')) {
        inMultiLineComment = false;
        trimmed = trimmed.split('*/')[1].trim();
      } else {
        return;
      }
    }
    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) {
        inMultiLineComment = true;
        return;
      }
      trimmed = trimmed.replace(/\/\*.*?\*\//g, '').trim();
    }

    if (!trimmed || trimmed.startsWith('//')) return;

    // Decorators (@Controller('/users'), @Get('/'), @Injectable())
    if (trimmed.startsWith('@')) {
      pendingDecorators.push(trimmed);
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
      return;
    }

    // 1. Imports: import { UserService, AuthService } from './user.service'; import express from 'express';
    if (trimmed.startsWith('import ')) {
      const impMatch = trimmed.match(/^import\s+(?:(\*\s+as\s+[A-Za-z0-9_]+)|([A-Za-z0-9_]+)|(?:\{\s*([^}]+)\s*\}))\s+from\s+['"]([^'"]+)['"]/);
      if (impMatch) {
        const namespace = impMatch[1];
        const defaultImp = impMatch[2];
        const namedImps = impMatch[3];
        const source = impMatch[4];

        const specifiers: string[] = [];
        let isDefault = false;
        let isNamespace = false;

        if (defaultImp) {
          isDefault = true;
          specifiers.push(defaultImp);
        }
        if (namespace) {
          isNamespace = true;
          specifiers.push(namespace.replace(/\*\s+as\s+/, '').trim());
        }
        if (namedImps) {
          namedImps.split(',').forEach(s => {
            const spec = s.split(' as ')[0].trim();
            if (spec) specifiers.push(spec);
          });
        }

        imports.push({ source, specifiers, isDefault, isNamespace });
      } else {
        // Fallback for simple require/import
        const rawSource = trimmed.match(/['"]([^'"]+)['"]/);
        if (rawSource) {
          imports.push({ source: rawSource[1], specifiers: [], isDefault: false, isNamespace: false });
        }
      }
      return;
    }

    // 2. Export Declarations: export { a, b }
    if (trimmed.startsWith('export {')) {
      const expList = trimmed.match(/^export\s*\{\s*([^}]+)\s*\}/);
      if (expList) {
        expList[1].split(',').forEach(e => {
          const exp = e.split(' as ')[0].trim();
          if (exp) exports.push(exp);
        });
      }
    }

    // 3. Classes and Interfaces: export class UserService, interface UserDto
    const isExportLine = trimmed.startsWith('export ');
    const cleanDefLine = isExportLine ? trimmed.replace(/^export\s+(?:default\s+)?/, '') : trimmed;

    const classMatch = cleanDefLine.match(/^(?:abstract\s+)?(class|interface)\s+([A-Za-z0-9_]+)/);
    if (classMatch) {
      const name = classMatch[2];
      const kind = classMatch[1] === 'interface' ? 'interface' : 'class';
      if (isExportLine) exports.push(name);

      symbols.push({
        name,
        kind,
        line: lineNum,
        isExported: isExportLine,
        decorators: [...pendingDecorators]
      });

      if (routes.length > 0 && routes[routes.length - 1].handler.startsWith('Controller (Line')) {
        routes[routes.length - 1].handler = `${name} (Controller)`;
      }

      pendingDecorators = [];
      currentScope = name;
      return;
    }

    // 4. Function Declarations: export function calculateTotal(a: number, b: number)
    const funcMatch = cleanDefLine.match(/^(?:async\s+)?function\s+([A-Za-z0-9_]+)\s*\(([^\)]*)\)/);
    if (funcMatch) {
      const name = funcMatch[1];
      const params = funcMatch[2].split(',').map(p => p.split(':')[0].trim()).filter(Boolean);
      if (isExportLine) exports.push(name);

      symbols.push({
        name,
        kind: 'function',
        line: lineNum,
        isExported: isExportLine,
        params,
        decorators: [...pendingDecorators]
      });

      if (routes.length > 0 && routes[routes.length - 1].line === lineNum - pendingDecorators.length) {
        routes[routes.length - 1].handler = name;
      }

      pendingDecorators = [];
      currentScope = name;
      return;
    }

    // 5. Method Declarations: public async getUsers(req, res), private validate()
    const methodMatch = trimmed.match(/^(?:public|private|protected)?\s*(?:static\s+)?(?:async\s+)?([A-Za-z0-9_]+)\s*\(([^\)]*)\)/);
    if (methodMatch && !/^(if|for|while|switch|catch|function|return|constructor)$/.test(methodMatch[1])) {
      const name = methodMatch[1];
      const params = methodMatch[2].split(',').map(p => p.split(':')[0].trim()).filter(Boolean);

      symbols.push({
        name,
        kind: 'function',
        line: lineNum,
        isExported: false,
        params,
        decorators: [...pendingDecorators]
      });

      if (routes.length > 0 && routes[routes.length - 1].line === lineNum - pendingDecorators.length) {
        routes[routes.length - 1].handler = name;
      }

      pendingDecorators = [];
      currentScope = name;
      return;
    }

    // 6. Arrow Functions: const myHandler = async (req, res) => ...
    const arrowMatch = cleanDefLine.match(/^(?:const|let|var)\s+([A-Za-z0-9_]+)\s*=\s*(?:async\s+)?\(([^\)]*)\)\s*=>/);
    if (arrowMatch) {
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

      pendingDecorators = [];
      currentScope = name;
      return;
    }

    pendingDecorators = [];

    // 7. Express / Fastify / Router endpoints: router.get('/users', handler), app.post(...)
    const expressRouteMatch = trimmed.match(/(?:app|router|server)\.(get|post|put|delete|patch)\(['"]([^'"]*)['"],\s*(?:async\s+)?(?:\([^\)]*\)\s*=>|function|\(?([A-Za-z0-9_\.]+)\)?)/i);
    if (expressRouteMatch) {
      routes.push({
        path: expressRouteMatch[2] || '/',
        method: expressRouteMatch[1].toUpperCase() as any,
        handler: expressRouteMatch[3] || 'anonymousHandler',
        line: lineNum
      });
    }

    // 8. Method Calls: this.userService.findAll(), saveDiagramWithMeta()
    const callMatches = lineText.matchAll(/(?:this\.)?([A-Za-z0-9_]+)\.([A-Za-z0-9_]+)\(/g);
    for (const match of callMatches) {
      const targetModule = match[1];
      const calleeName = match[2];
      if (!/^(log|warn|error|info|push|pop|map|forEach|filter|reduce|slice|split|join|includes|find|bind|then|catch)$/.test(calleeName)) {
        calls.push({
          callerName: currentScope,
          calleeName,
          targetModule,
          line: lineNum
        });
      }
    }
  });

  // Infer layer
  const lowerPath = relativePath.toLowerCase();
  let layer: ParsedFile['layer'] = 'other';
  if (/controller|handler|endpoint|route/.test(lowerPath) || routes.length > 0) {
    layer = 'controller';
  } else if (/service|usecase|business|domain|manager/.test(lowerPath)) {
    layer = 'service';
  } else if (/repository|dao|repo|db|database|prisma|query|storage/.test(lowerPath)) {
    layer = 'repository';
  } else if (/model|entity|schema|type|dto|interface/.test(lowerPath)) {
    layer = 'model';
  } else if (/client|api|gateway|fetch|http|sdk|provider/.test(lowerPath)) {
    layer = 'client';
  } else if (/middleware|guard|auth|interceptor|filter|pipe/.test(lowerPath)) {
    layer = 'middleware';
  } else if (/util|helper|common|shared|lib/.test(lowerPath)) {
    layer = 'util';
  } else if (/config|setting|env|constant/.test(lowerPath)) {
    layer = 'config';
  }

  const isTypeScript = relativePath.endsWith('.ts') || relativePath.endsWith('.tsx');
  const isReact = relativePath.endsWith('.tsx') || relativePath.endsWith('.jsx');

  return {
    filePath,
    relativePath,
    language: isTypeScript ? 'TypeScript' : 'JavaScript',
    framework: isReact ? 'React' : undefined,
    linesOfCode,
    imports,
    exports,
    symbols,
    calls,
    routes,
    layer
  };
}
