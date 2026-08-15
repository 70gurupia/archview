export type SymbolKind = 'function' | 'class' | 'interface' | 'route' | 'model' | 'service' | 'variable';

export interface CodeSymbol {
  name: string;
  kind: SymbolKind;
  line: number;
  isExported: boolean;
  params?: string[];
  returnType?: string;
  decorators?: string[];
}

export interface FileImport {
  source: string;
  specifiers: string[];
  isDefault: boolean;
  isNamespace: boolean;
  resolvedPath?: string;
}

export interface FileCall {
  callerName: string;
  calleeName: string;
  line: number;
  targetModule?: string;
}

export interface RouteEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'ALL';
  handler: string;
  line: number;
}

export interface ParsedFile {
  filePath: string;
  relativePath: string;
  language: string;
  framework?: string;
  linesOfCode: number;
  imports: FileImport[];
  exports: string[];
  symbols: CodeSymbol[];
  calls: FileCall[];
  routes: RouteEndpoint[];
  layer?: 'controller' | 'service' | 'repository' | 'model' | 'client' | 'middleware' | 'util' | 'config' | 'other';
}

export interface DirectoryNode {
  name: string;
  path: string;
  relativePath: string;
  type: 'file' | 'directory';
  children?: DirectoryNode[];
  fileInfo?: {
    language: string;
    linesOfCode: number;
    symbolCount: number;
    layer?: string;
  };
}

export interface CrossModuleCall {
  fromFile: string;
  fromSymbol: string;
  toFile: string;
  toSymbol: string;
  callCount: number;
}

export interface CodebaseTopology {
  rootPath: string;
  projectName: string;
  totalFiles: number;
  totalLinesOfCode: number;
  languages: { [lang: string]: number };
  frameworks: string[];
  files: ParsedFile[];
  directoryTree: DirectoryNode;
  crossModuleCalls: CrossModuleCall[];
}

export interface TraceSpan {
  id?: string;
  timestamp?: string | number;
  service?: string;
  from: string;
  to: string;
  action: string;
  status?: 'success' | 'error' | 'warning' | 'info';
  durationMs?: number;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ParsedTraceFlow {
  title: string;
  description?: string;
  participants: string[];
  spans: TraceSpan[];
  hasErrors: boolean;
}
