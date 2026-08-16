import fs from 'fs';
import path from 'path';
import { parseTypeScriptFile } from './ast-parser-ts.js';
import { parseLexicalFile } from './ast-parser-lexical.js';
const DEFAULT_IGNORED_DIRS = new Set([
    'node_modules',
    '.git',
    '.svn',
    '.hg',
    'dist',
    'build',
    'out',
    '.next',
    '.nuxt',
    '.venv',
    'venv',
    'env',
    'vendor',
    'target',
    'bin',
    'obj',
    '__pycache__',
    '.pytest_cache',
    'coverage',
    '.turbo',
    '.idea',
    '.vscode'
]);
const SUPPORTED_EXTENSIONS = new Set([
    '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
    '.py', '.go', '.java', '.kt', '.rs', '.php', '.cs'
]);
export function scanCodebase(targetPath, options = {}) {
    const rootPath = path.resolve(targetPath);
    if (!fs.existsSync(rootPath)) {
        throw new Error(`Diretório não encontrado: ${targetPath}`);
    }
    const maxDepth = options.maxDepth || 8;
    const maxFiles = options.maxFiles || 500;
    const ignoredDirs = new Set([...DEFAULT_IGNORED_DIRS, ...(options.excludeDirs || [])]);
    const allowedExtensions = options.includeExtensions ? new Set(options.includeExtensions) : SUPPORTED_EXTENSIONS;
    const parsedFiles = [];
    const languageCounts = {};
    let totalLinesOfCode = 0;
    const projectName = path.basename(rootPath) || 'project';
    const detectedFrameworks = new Set();
    // 1. Check root package manifests for framework detection
    detectFrameworksFromManifests(rootPath, detectedFrameworks);
    // 2. Recursive scan
    function scanDir(currentPath, currentDepth) {
        const dirName = path.basename(currentPath);
        const relPath = path.relative(rootPath, currentPath) || '.';
        const children = [];
        if (currentDepth > maxDepth) {
            return { name: dirName, path: currentPath, relativePath: relPath, type: 'directory', children: [] };
        }
        try {
            const entries = fs.readdirSync(currentPath, { withFileTypes: true });
            // Sort: directories first, then files
            entries.sort((a, b) => {
                if (a.isDirectory() === b.isDirectory())
                    return a.name.localeCompare(b.name);
                return a.isDirectory() ? -1 : 1;
            });
            for (const entry of entries) {
                const fullPath = path.join(currentPath, entry.name);
                const entryRelPath = path.relative(rootPath, fullPath);
                if (entry.isDirectory()) {
                    if (ignoredDirs.has(entry.name) || entry.name.startsWith('.'))
                        continue;
                    children.push(scanDir(fullPath, currentDepth + 1));
                }
                else if (entry.isFile()) {
                    const ext = path.extname(entry.name).toLowerCase();
                    if (!allowedExtensions.has(ext))
                        continue;
                    if (parsedFiles.length >= maxFiles)
                        continue;
                    try {
                        const content = fs.readFileSync(fullPath, 'utf-8');
                        let parsed;
                        if (['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'].includes(ext)) {
                            parsed = parseTypeScriptFile(fullPath, entryRelPath, content);
                        }
                        else {
                            parsed = parseLexicalFile(fullPath, entryRelPath, content);
                        }
                        parsedFiles.push(parsed);
                        totalLinesOfCode += parsed.linesOfCode;
                        languageCounts[parsed.language] = (languageCounts[parsed.language] || 0) + 1;
                        if (parsed.framework)
                            detectedFrameworks.add(parsed.framework);
                        children.push({
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
                        });
                    }
                    catch {
                        // Ignore unparseable files
                    }
                }
            }
        }
        catch {
            // Permission / access issues
        }
        return {
            name: dirName,
            path: currentPath,
            relativePath: relPath,
            type: 'directory',
            children
        };
    }
    const directoryTree = scanDir(rootPath, 0);
    // 3. Resolve Cross-Module Calls
    const crossModuleCalls = resolveCrossModuleCalls(parsedFiles);
    return {
        rootPath,
        projectName,
        totalFiles: parsedFiles.length,
        totalLinesOfCode,
        languages: languageCounts,
        frameworks: Array.from(detectedFrameworks),
        files: parsedFiles,
        directoryTree,
        crossModuleCalls
    };
}
function detectFrameworksFromManifests(rootPath, frameworks) {
    // package.json
    const pkgPath = path.join(rootPath, 'package.json');
    if (fs.existsSync(pkgPath)) {
        try {
            const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
            const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
            if (allDeps['express'])
                frameworks.add('Express');
            if (allDeps['@nestjs/core'])
                frameworks.add('NestJS');
            if (allDeps['next'])
                frameworks.add('Next.js');
            if (allDeps['fastify'])
                frameworks.add('Fastify');
            if (allDeps['react'])
                frameworks.add('React');
            if (allDeps['vue'])
                frameworks.add('Vue');
            if (allDeps['@angular/core'])
                frameworks.add('Angular');
            if (allDeps['alpinejs'])
                frameworks.add('Alpine.js');
        }
        catch { }
    }
    // requirements.txt / pyproject.toml
    const reqPath = path.join(rootPath, 'requirements.txt');
    if (fs.existsSync(reqPath)) {
        try {
            const reqs = fs.readFileSync(reqPath, 'utf-8');
            if (/fastapi/i.test(reqs))
                frameworks.add('FastAPI');
            if (/django/i.test(reqs))
                frameworks.add('Django');
            if (/flask/i.test(reqs))
                frameworks.add('Flask');
        }
        catch { }
    }
    // go.mod
    const goModPath = path.join(rootPath, 'go.mod');
    if (fs.existsSync(goModPath)) {
        try {
            const goMod = fs.readFileSync(goModPath, 'utf-8');
            if (/github\.com\/gin-gonic\/gin/i.test(goMod))
                frameworks.add('Gin');
            if (/github\.com\/gofiber\/fiber/i.test(goMod))
                frameworks.add('Fiber');
            if (/github\.com\/labstack\/echo/i.test(goMod))
                frameworks.add('Echo');
        }
        catch { }
    }
}
function resolveCrossModuleCalls(files) {
    const calls = [];
    const symbolToFileMap = new Map();
    // Map exported symbols to file relative paths
    files.forEach(f => {
        f.exports.forEach(exp => {
            symbolToFileMap.set(exp, f.relativePath);
        });
        f.symbols.filter(s => s.isExported).forEach(s => {
            symbolToFileMap.set(s.name, f.relativePath);
        });
    });
    files.forEach(file => {
        // 1. Resolve through direct imports
        file.imports.forEach(imp => {
            // Find matching target file
            const targetFile = files.find(f => {
                const normSource = imp.source.replace(/^\.\//, '').replace(/^\.\.\//, '').replace(/\.(js|ts|jsx|tsx)$/, '');
                const normRel = f.relativePath.replace(/\.(js|ts|jsx|tsx)$/, '');
                return normRel.endsWith(normSource) || normRel === normSource;
            });
            if (targetFile && targetFile.relativePath !== file.relativePath) {
                imp.specifiers.forEach(spec => {
                    // Check if this imported symbol was called in the file
                    const wasCalled = file.calls.some(c => c.calleeName === spec || c.targetModule === spec);
                    calls.push({
                        fromFile: file.relativePath,
                        fromSymbol: file.symbols[0]?.name || 'module',
                        toFile: targetFile.relativePath,
                        toSymbol: spec,
                        callCount: wasCalled ? 1 : 1
                    });
                });
            }
        });
        // 2. Resolve through calls matching known global exported symbols
        file.calls.forEach(call => {
            const targetFilePath = symbolToFileMap.get(call.calleeName) || (call.targetModule ? symbolToFileMap.get(call.targetModule) : undefined);
            if (targetFilePath && targetFilePath !== file.relativePath) {
                const existing = calls.find(c => c.fromFile === file.relativePath && c.toFile === targetFilePath && c.toSymbol === call.calleeName);
                if (existing) {
                    existing.callCount++;
                }
                else {
                    calls.push({
                        fromFile: file.relativePath,
                        fromSymbol: call.callerName,
                        toFile: targetFilePath,
                        toSymbol: call.calleeName,
                        callCount: 1
                    });
                }
            }
        });
    });
    return calls;
}
