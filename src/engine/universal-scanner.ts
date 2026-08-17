import fs from 'fs';
import path from 'path';
import { CodebaseTopology, ParsedFile, DirectoryNode, CrossModuleCall } from './types.js';
import { parseTypeScriptFile } from './ast-parser-ts.js';
import { parseLexicalFile } from './ast-parser-lexical.js';
import { globalAstCache } from './ast-cache.js';

const DEFAULT_IGNORED_DIRS = new Set([
  'node_modules', '.git', '.svn', '.hg', 'dist', 'build', 'out',
  '.next', '.nuxt', '.venv', 'venv', 'env', 'vendor', 'target',
  'bin', 'obj', '__pycache__', '.pytest_cache', 'coverage', '.turbo',
  '.idea', '.vscode'
]);

const SUPPORTED_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.py', '.go', '.java', '.kt', '.rs', '.php', '.cs'
]);

const JS_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);

export interface ScanOptions {
  maxDepth?: number;
  maxFiles?: number;
  excludeDirs?: string[];
  includeExtensions?: string[];
}

function checkNodeManifest(rootPath: string, frameworks: Set<string>): void {
  const pkgPath = path.join(rootPath, 'package.json');
  if (!fs.existsSync(pkgPath)) return;
  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    const frameworkMap: Record<string, string> = {
      express: 'Express',
      '@nestjs/core': 'NestJS',
      next: 'Next.js',
      fastify: 'Fastify',
      react: 'React',
      vue: 'Vue',
      '@angular/core': 'Angular',
      alpinejs: 'Alpine.js'
    };
    for (const [dep, name] of Object.entries(frameworkMap)) {
      if (allDeps[dep]) frameworks.add(name);
    }
  } catch {
    // Ignora erro de JSON malformado
  }
}

function checkPythonManifest(rootPath: string, frameworks: Set<string>): void {
  const reqPath = path.join(rootPath, 'requirements.txt');
  if (!fs.existsSync(reqPath)) return;
  try {
    const reqs = fs.readFileSync(reqPath, 'utf-8');
    if (/fastapi/i.test(reqs)) frameworks.add('FastAPI');
    if (/django/i.test(reqs)) frameworks.add('Django');
    if (/flask/i.test(reqs)) frameworks.add('Flask');
  } catch {
    // Ignora erro de leitura
  }
}

function checkGoManifest(rootPath: string, frameworks: Set<string>): void {
  const goModPath = path.join(rootPath, 'go.mod');
  if (!fs.existsSync(goModPath)) return;
  try {
    const goMod = fs.readFileSync(goModPath, 'utf-8');
    if (/gin-gonic\/gin/i.test(goMod)) frameworks.add('Gin');
    if (/gofiber\/fiber/i.test(goMod)) frameworks.add('Fiber');
    if (/labstack\/echo/i.test(goMod)) frameworks.add('Echo');
  } catch {
    // Ignora erro de leitura
  }
}

function parseSourceFile(fullPath: string, entryRelPath: string, ext: string): ParsedFile {
  const content = fs.readFileSync(fullPath, 'utf-8');
  const cached = globalAstCache.get(fullPath, content);
  if (cached) {
    return cached;
  }

  const parsed = JS_EXTENSIONS.has(ext)
    ? parseTypeScriptFile(fullPath, entryRelPath, content)
    : parseLexicalFile(fullPath, entryRelPath, content);

  globalAstCache.set(fullPath, content, parsed);
  return parsed;
}

interface ScannerContext {
  rootPath: string;
  maxDepth: number;
  maxFiles: number;
  ignoredDirs: Set<string>;
  allowedExtensions: Set<string>;
  parsedFiles: ParsedFile[];
  languageCounts: Record<string, number>;
  totalLinesOfCode: { count: number };
  detectedFrameworks: Set<string>;
}

function processDirectoryEntry(
  entry: fs.Dirent,
  currentPath: string,
  currentDepth: number,
  ctx: ScannerContext,
  scanDirFn: (path: string, depth: number) => DirectoryNode
): DirectoryNode | null {
  const fullPath = path.join(currentPath, entry.name);
  const entryRelPath = path.relative(ctx.rootPath, fullPath);

  if (entry.isDirectory()) {
    if (ctx.ignoredDirs.has(entry.name) || entry.name.startsWith('.')) return null;
    return scanDirFn(fullPath, currentDepth + 1);
  }

  const ext = path.extname(entry.name).toLowerCase();
  if (!ctx.allowedExtensions.has(ext) || ctx.parsedFiles.length >= ctx.maxFiles) return null;

  try {
    const parsed = parseSourceFile(fullPath, entryRelPath, ext);
    ctx.parsedFiles.push(parsed);
    ctx.totalLinesOfCode.count += parsed.linesOfCode;
    ctx.languageCounts[parsed.language] = (ctx.languageCounts[parsed.language] || 0) + 1;
    if (parsed.framework) ctx.detectedFrameworks.add(parsed.framework);

    return {
      name: entry.name,
      path: fullPath,
      relativePath: entryRelPath,
      type: 'file',
      fileInfo: {
        language: parsed.language,
        linesOfCode: parsed.linesOfCode,
        symbolCount: parsed.symbols.length,
        layer: parsed.layer
      }
    };
  } catch {
    return null;
  }
}

export function scanCodebase(targetPath: string, options: ScanOptions = {}): CodebaseTopology {
  const rootPath = path.resolve(targetPath);
  if (!fs.existsSync(rootPath)) {
    throw new Error(`Diretório não encontrado: ${targetPath}`);
  }

  const ctx: ScannerContext = {
    rootPath,
    maxDepth: options.maxDepth || 8,
    maxFiles: options.maxFiles || 500,
    ignoredDirs: new Set([...DEFAULT_IGNORED_DIRS, ...(options.excludeDirs || [])]),
    allowedExtensions: options.includeExtensions ? new Set(options.includeExtensions) : SUPPORTED_EXTENSIONS,
    parsedFiles: [],
    languageCounts: {},
    totalLinesOfCode: { count: 0 },
    detectedFrameworks: new Set<string>()
  };

  checkNodeManifest(rootPath, ctx.detectedFrameworks);
  checkPythonManifest(rootPath, ctx.detectedFrameworks);
  checkGoManifest(rootPath, ctx.detectedFrameworks);

  function scanDir(currentPath: string, currentDepth: number): DirectoryNode {
    const dirName = path.basename(currentPath);
    const relPath = path.relative(rootPath, currentPath) || '.';
    const children: DirectoryNode[] = [];

    if (currentDepth > ctx.maxDepth) {
      return { name: dirName, path: currentPath, relativePath: relPath, type: 'directory', children: [] };
    }

    try {
      const entries = fs.readdirSync(currentPath, { withFileTypes: true });
      entries.sort((a, b) => (a.isDirectory() === b.isDirectory() ? a.name.localeCompare(b.name) : a.isDirectory() ? -1 : 1));

      for (const entry of entries) {
        const child = processDirectoryEntry(entry, currentPath, currentDepth, ctx, scanDir);
        if (child) children.push(child);
      }
    } catch {
      // Ignora erro de permissão
    }

    return { name: dirName, path: currentPath, relativePath: relPath, type: 'directory', children };
  }

  const directoryTree = scanDir(rootPath, 0);
  const crossModuleCalls = resolveCrossModuleCalls(ctx.parsedFiles);

  return {
    rootPath,
    projectName: path.basename(rootPath) || 'project',
    totalFiles: ctx.parsedFiles.length,
    totalLinesOfCode: ctx.totalLinesOfCode.count,
    languages: ctx.languageCounts,
    frameworks: Array.from(ctx.detectedFrameworks),
    files: ctx.parsedFiles,
    directoryTree,
    crossModuleCalls
  };
}

function resolveImportCalls(file: ParsedFile, files: ParsedFile[], calls: CrossModuleCall[]): void {
  for (const imp of file.imports) {
    const normSource = imp.source.replace(/^\.\//, '').replace(/^\.\.\//, '').replace(/\.(js|ts|jsx|tsx)$/, '');
    const targetFile = files.find(f => {
      const normRel = f.relativePath.replace(/\.(js|ts|jsx|tsx)$/, '');
      return normRel.endsWith(normSource) || normRel === normSource;
    });

    if (targetFile && targetFile.relativePath !== file.relativePath) {
      for (const spec of imp.specifiers) {
        calls.push({
          fromFile: file.relativePath,
          fromSymbol: file.symbols[0]?.name || 'module',
          toFile: targetFile.relativePath,
          toSymbol: spec,
          callCount: 1
        });
      }
    }
  }
}

function resolveSymbolCalls(file: ParsedFile, symbolToFileMap: Map<string, string>, calls: CrossModuleCall[]): void {
  for (const call of file.calls) {
    const targetFilePath = symbolToFileMap.get(call.calleeName) || (call.targetModule ? symbolToFileMap.get(call.targetModule) : undefined);
    if (targetFilePath && targetFilePath !== file.relativePath) {
      const existing = calls.find(c => c.fromFile === file.relativePath && c.toFile === targetFilePath && c.toSymbol === call.calleeName);
      if (existing) {
        existing.callCount++;
      } else {
        calls.push({
          fromFile: file.relativePath,
          fromSymbol: call.callerName,
          toFile: targetFilePath,
          toSymbol: call.calleeName,
          callCount: 1
        });
      }
    }
  }
}

function resolveCrossModuleCalls(files: ParsedFile[]): CrossModuleCall[] {
  const calls: CrossModuleCall[] = [];
  const symbolToFileMap = new Map<string, string>();

  for (const f of files) {
    for (const exp of f.exports) symbolToFileMap.set(exp, f.relativePath);
    for (const s of f.symbols) {
      if (s.isExported) symbolToFileMap.set(s.name, f.relativePath);
    }
  }

  for (const file of files) {
    resolveImportCalls(file, files, calls);
    resolveSymbolCalls(file, symbolToFileMap, calls);
  }

  return calls;
}
