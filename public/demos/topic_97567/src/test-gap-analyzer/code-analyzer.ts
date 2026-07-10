import * as fs from 'fs';
import * as path from 'path';
import { CodeChange, FunctionInfo } from './types';
import { readFileSafe, getAllTsFiles, calculateCyclomaticComplexity } from './utils';

export class CodeAnalyzer {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  analyzeFile(filePath: string): CodeChange | null {
    const content = readFileSafe(filePath);
    if (!content) return null;

    const functions = this.extractFunctions(content);

    return {
      filePath,
      changeType: 'modified',
      addedLines: content.split('\n').length,
      removedLines: 0,
      functions,
      timestamp: new Date().toISOString(),
    };
  }

  analyzeDirectory(dirPath: string): CodeChange[] {
    const files = getAllTsFiles(dirPath);
    return files
      .map(file => this.analyzeFile(file))
      .filter((change): change is CodeChange => change !== null);
  }

  private extractFunctions(content: string): FunctionInfo[] {
    const functions: FunctionInfo[] = [];

    const exportAsyncFuncRegex = /export\s+async\s+function\s+(\w+)/g;
    const exportFuncRegex = /export\s+function\s+(\w+)/g;
    const asyncFuncRegex = /(?:^|\n)async\s+function\s+(\w+)/g;
    const funcRegex = /(?:^|\n)function\s+(\w+)/g;

    const patterns = [
      { regex: exportAsyncFuncRegex, isExported: true, isAsync: true },
      { regex: exportFuncRegex, isExported: true, isAsync: false },
      { regex: asyncFuncRegex, isExported: false, isAsync: true },
      { regex: funcRegex, isExported: false, isAsync: false },
    ];

    for (const { regex, isExported, isAsync } of patterns) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        const name = match[1];
        const startLine = content.substring(0, match.index).split('\n').length;

        functions.push({
          name,
          startLine,
          endLine: this.findFunctionEnd(content, match.index),
          complexity: this.calculateFunctionComplexity(content, match.index),
          parameters: [],
          isExported,
          isAsync,
        });
      }
    }

    return functions;
  }

  private findFunctionEnd(content: string, startIndex: number): number {
    let braceCount = 0;
    let started = false;

    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === '{') {
        braceCount++;
        started = true;
      } else if (content[i] === '}') {
        braceCount--;
        if (started && braceCount === 0) {
          return content.substring(0, i).split('\n').length;
        }
      }
    }

    return content.split('\n').length;
  }

  private calculateFunctionComplexity(content: string, startIndex: number): number {
    const functionBody = this.extractFunctionBody(content, startIndex);
    return calculateCyclomaticComplexity(functionBody, 0);
  }

  private extractFunctionBody(content: string, startIndex: number): string {
    let braceCount = 0;
    let bodyStart = -1;

    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === '{') {
        if (bodyStart === -1) bodyStart = i;
        braceCount++;
      } else if (content[i] === '}') {
        braceCount--;
        if (bodyStart !== -1 && braceCount === 0) {
          return content.substring(bodyStart, i + 1);
        }
      }
    }

    return '';
  }

  private calculateFileComplexity(content: string): number {
    const lines = content.split('\n');
    let complexity = 1;

    for (const line of lines) {
      const trimmed = line.trim();
      if (
        /^\s*(if|for|while|switch|case|catch|\&\&|\|\||\?)\s/.test(trimmed) ||
        /\belse\s+if\b/.test(trimmed)
      ) {
        complexity++;
      }
    }

    return complexity;
  }

  detectLogicPatterns(content: string): {
    hasErrorHandling: boolean;
    hasAsyncAwait: boolean;
    hasConditionals: boolean;
    hasLoops: boolean;
    hasDataValidation: boolean;
  } {
    return {
      hasErrorHandling: /\b(try|catch|throw|finally)\b/.test(content),
      hasAsyncAwait: /\b(async|await)\b/.test(content),
      hasConditionals: /\b(if|else|switch|case|\?)\b/.test(content),
      hasLoops: /\b(for|while|do|forEach|map|filter|reduce)\b/.test(content),
      hasDataValidation: /\b(validate|sanitize|check|verify|parse|decode)\b/i.test(content),
    };
  }

  isBusinessCritical(filePath: string): boolean {
    const criticalPatterns = [
      /\/api\//,
      /\/lib\/(local-db|auth|achievement|analytics)/,
      /\/contexts\//,
      /\/hooks\//,
    ];

    return criticalPatterns.some(pattern => pattern.test(filePath));
  }
}
