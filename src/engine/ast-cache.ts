import crypto from 'crypto';
import { ParsedFile } from './types.js';

export interface CacheEntry {
  hash: string;
  timestamp: number;
  data: ParsedFile;
}

export class AstCache {
  private cache: Map<string, CacheEntry> = new Map();

  public calculateHash(content: string): string {
    return crypto.createHash('sha256').update(content || '', 'utf8').digest('hex');
  }

  public get(filePath: string, content: string): ParsedFile | null {
    const entry = this.cache.get(filePath);
    if (!entry) return null;

    const currentHash = this.calculateHash(content);
    if (entry.hash === currentHash) {
      return entry.data;
    }
    return null;
  }

  public set(filePath: string, content: string, data: ParsedFile): void {
    const hash = this.calculateHash(content);
    this.cache.set(filePath, {
      hash,
      timestamp: Date.now(),
      data
    });
  }

  public clear(): void {
    this.cache.clear();
  }

  public size(): number {
    return this.cache.size;
  }
}

export const globalAstCache = new AstCache();
