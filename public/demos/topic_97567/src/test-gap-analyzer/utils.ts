import * as fs from 'fs';
import * as path from 'path';
import { FunctionInfo } from './types';

export function readFileSafe(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

export function getAllTsFiles(dir: string, excludeDirs: string[] = ['node_modules', '__tests__', '.test.ts', '.spec.ts']): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!excludeDirs.some(ex => entry.name.includes(ex))) {
        files.push(...getAllTsFiles(fullPath, excludeDirs));
      }
    } else if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      files.push(fullPath);
    }
  }

  return files;
}

export function getExistingTestFile(sourceFile: string): string | null {
  const extensions = ['.test.ts', '.spec.ts', '.test.tsx', '.spec.tsx'];
  const basePath = sourceFile.replace(/\.(ts|tsx)$/, '');

  for (const ext of extensions) {
    const testFile = basePath + ext;
    if (fs.existsSync(testFile)) {
      return testFile;
    }
  }

  const testDir = path.dirname(sourceFile) + '/__tests__';
  const baseName = path.basename(sourceFile, path.extname(sourceFile));
  const testFile = path.join(testDir, baseName + '.test.ts');

  if (fs.existsSync(testFile)) {
    return testFile;
  }

  return null;
}

export function extractFunctionSignatures(content: string): FunctionInfo[] {
  const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)|(?:export\s+)?(?:const|let|var)\s+(\w+)\s*(?::\s*\([^)]*\)\s*(?:=>|:))|class\s+(\w+)/g;
  const functions: FunctionInfo[] = [];
  let match;

  while ((match = functionRegex.exec(content)) !== null) {
    const name = match[1] || match[2] || match[3];
    if (name && !['if', 'else', 'for', 'while', 'switch', 'try', 'catch'].includes(name)) {
      functions.push({
        name,
        startLine: content.substring(0, match.index).split('\n').length,
        endLine: 0,
        complexity: 1,
        parameters: [],
        isExported: match[0].startsWith('export'),
        isAsync: /\basync\s/.test(match[0]),
      });
    }
  }

  return functions;
}

export function calculateCyclomaticComplexity(content: string, functionStart: number): number {
  const lines = content.split('\n');
  let complexity = 1;

  const controlFlowKeywords = ['if', 'else if', 'for', 'while', 'case', 'catch', '&&', '||', '?'];

  for (let i = functionStart; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes('}')) break;

    for (const keyword of controlFlowKeywords) {
      if (line.includes(keyword)) {
        complexity++;
      }
    }
  }

  return complexity;
}

export function isComplexLogic(code: string): boolean {
  const complexity = calculateCyclomaticComplexity(code, 0);
  return complexity >= 3;
}

export function hasErrorHandling(code: string): boolean {
  return code.includes('try') || code.includes('catch') || code.includes('throw');
}

export function formatFilePath(filePath: string, projectRoot: string): string {
  return path.relative(projectRoot, filePath).replace(/\\/g, '/');
}

export function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function toCamelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toLowerCase());
}

export function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}
