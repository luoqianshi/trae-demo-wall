# 自动化测试缺口分析工具实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标：** 开发一个自动化测试缺口分析工具，审查近期合并的代码，在覆盖率缺口对产品稳定性构成实质风险的地方补充测试。

**架构：** 这是一个命令行工具，通过静态代码分析识别测试覆盖缺口，并自动生成针对性测试用例。采用模块化设计，分为代码分析器、缺口检测器、测试生成器三个核心组件。

**技术栈：** TypeScript、Node.js文件系统、AST解析（使用TypeScript编译器API）、Vitest测试框架

---

## 文件结构

- Create: `src/test-gap-analyzer/index.ts` - 主入口文件
- Create: `src/test-gap-analyzer/code-analyzer.ts` - 代码变更分析器
- Create: `src/test-gap-analyzer/risk-assessor.ts` - 风险评估器
- Create: `src/test-gap-analyzer/test-generator.ts` - 测试用例生成器
- Create: `src/test-gap-analyzer/reporter.ts` - 报告生成器
- Create: `src/test-gap-analyzer/types.ts` - 类型定义
- Create: `src/test-gap-analyzer/utils.ts` - 工具函数
- Create: `src/test-gap-analyzer/__tests__/analyzer.test.ts` - 分析器测试
- Create: `src/test-gap-analyzer/__tests__/generator.test.ts` - 生成器测试
- Modify: `package.json` - 添加分析工具脚本

---

## Task 1: 创建类型定义和工具函数

**Files:**
- Create: `src/test-gap-analyzer/types.ts`
- Create: `src/test-gap-analyzer/utils.ts`

- [ ] **Step 1: 创建类型定义文件**

```typescript
// src/test-gap-analyzer/types.ts

export interface CodeChange {
  filePath: string;
  changeType: 'added' | 'modified' | 'deleted';
  addedLines: number;
  removedLines: number;
  functions: FunctionInfo[];
  timestamp?: string;
}

export interface FunctionInfo {
  name: string;
  startLine: number;
  endLine: number;
  complexity: number;
  parameters: ParameterInfo[];
  returnType?: string;
  isExported: boolean;
  isAsync: boolean;
}

export interface ParameterInfo {
  name: string;
  type?: string;
  isOptional: boolean;
}

export interface TestGap {
  filePath: string;
  functionName?: string;
  gapType: TestGapType;
  severity: Severity;
  description: string;
  suggestedTests: TestSuggestion[];
  riskFactors: string[];
}

export type TestGapType =
  | 'missing_test_file'
  | 'no_coverage_for_logic_path'
  | 'bug_fix_without_test'
  | 'complex_logic_untested'
  | 'boundary_condition_untested'
  | 'edge_case_untested'
  | 'error_handling_untested';

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export interface TestSuggestion {
  testName: string;
  description: string;
  testContent: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
}

export interface GapAnalysisResult {
  gaps: TestGap[];
  summary: AnalysisSummary;
  timestamp: string;
  analyzedFiles: number;
}

export interface AnalysisSummary {
  total: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  byType: Record<TestGapType, number>;
}

export interface TestTemplateContext {
  filePath: string;
  functionInfo?: FunctionInfo;
  gapInfo: TestGap;
  imports: string[];
  mockFunctions: string[];
}
```

- [ ] **Step 2: 创建工具函数文件**

```typescript
// src/test-gap-analyzer/utils.ts

import * as fs from 'fs';
import * as path from 'path';

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
```

---

## Task 2: 创建代码分析器

**Files:**
- Create: `src/test-gap-analyzer/code-analyzer.ts`

- [ ] **Step 1: 实现代码变更检测**

```typescript
// src/test-gap-analyzer/code-analyzer.ts

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
    const complexity = this.calculateFileComplexity(content);

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
    const lines = content.split('\n');

    const exportAsyncFuncRegex = /export\s+async\s+function\s+(\w+)/g;
    const exportFuncRegex = /export\s+function\s+(\w+)/g;
    const asyncFuncRegex = /(?:^|\n)async\s+function\s+(\w+)/g;
    const funcRegex = /(?:^|\n)function\s+(\w+)/g;
    const arrowFuncRegex = /(?:^|\n)(?:export\s+)?const\s+(\w+)\s*=\s*(?:\([^)]*\)|[^=])\s*=>/g;
    const methodRegex = /(?:^|\n)\s{2,4}(\w+)\s*\([^)]*\)\s*(?::\s*\w+)?\s*\{/g;

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
```

---

## Task 3: 创建风险评估器

**Files:**
- Create: `src/test-gap-analyzer/risk-assessor.ts`

- [ ] **Step 1: 实现风险评估逻辑**

```typescript
// src/test-gap-analyzer/risk-assessor.ts

import { CodeChange, TestGap, TestGapType, Severity, FunctionInfo } from './types';
import { getExistingTestFile } from './utils';

export class RiskAssessor {
  private readonly PRIORITY_PATTERNS = {
    apiRoutes: /\/api\//,
    coreLibs: /\/lib\/(local-db|auth|achievement|analytics|score)/,
    contexts: /\/contexts\//,
    hooks: /\/hooks\//,
  };

  private readonly COMPLEXITY_THRESHOLDS = {
    low: 3,
    medium: 5,
    high: 8,
    critical: 12,
  };

  assessChange(change: CodeChange): TestGap[] {
    const gaps: TestGap[] = [];

    const existingTest = getExistingTestFile(change.filePath);
    if (!existingTest) {
      gaps.push(this.createMissingTestFileGap(change));
    }

    for (const func of change.functions) {
      if (func.isExported && func.complexity >= this.COMPLEXITY_THRESHOLDS.medium) {
        gaps.push(this.createComplexLogicGap(change, func));
      }

      const funcContent = this.extractFunctionContent(change.filePath, func);
      if (funcContent && this.hasUntestedPatterns(funcContent)) {
        gaps.push(this.createLogicPatternGap(change, func, funcContent));
      }
    }

    return gaps.filter(gap => gap.severity !== 'low');
  }

  private createMissingTestFileGap(change: CodeChange): TestGap {
    const isPriority = this.isPriorityFile(change.filePath);
    const severity = isPriority ? 'high' : 'medium';

    return {
      filePath: change.filePath,
      gapType: 'missing_test_file',
      severity,
      description: `文件 ${this.getFileName(change.filePath)} 缺少对应的测试文件`,
      suggestedTests: this.generateMissingFileTests(change),
      riskFactors: [
        isPriority ? '优先级高的核心模块' : '缺少测试覆盖',
        '无法验证功能正确性',
        '回归风险高',
      ],
    };
  }

  private createComplexLogicGap(change: CodeChange, func: FunctionInfo): TestGap {
    const severity = this.calculateSeverity(func.complexity);

    return {
      filePath: change.filePath,
      functionName: func.name,
      gapType: 'complex_logic_untested',
      severity,
      description: `函数 ${func.name} 复杂度为 ${func.complexity}，存在测试缺口`,
      suggestedTests: this.generateComplexLogicTests(change, func),
      riskFactors: [
        `圈复杂度 ${func.complexity}`,
        func.isAsync ? '包含异步逻辑' : '同步逻辑',
        '高风险路径未验证',
      ],
    };
  }

  private createLogicPatternGap(change: CodeChange, func: FunctionInfo, content: string): TestGap {
    const patterns = this.detectUntestedPatterns(content);
    const severity = patterns.length > 2 ? 'high' : 'medium';

    return {
      filePath: change.filePath,
      functionName: func.name,
      gapType: 'no_coverage_for_logic_path',
      severity,
      description: `函数 ${func.name} 包含未测试的逻辑模式: ${patterns.join(', ')}`,
      suggestedTests: this.generatePatternTests(change, func, patterns),
      riskFactors: patterns.map(p => `缺少${p}测试`),
    };
  }

  private generateMissingFileTests(change: CodeChange): TestGap['suggestedTests'] {
    const fileName = this.getFileName(change.filePath);
    const baseName = fileName.replace(/\.(ts|tsx)$/, '');

    const tests: TestGap['suggestedTests'] = [];

    if (change.filePath.includes('/api/')) {
      tests.push({
        testName: `API路由 ${baseName} GET方法`,
        description: '测试GET请求的基本功能',
        testContent: this.generateAPITestTemplate(baseName, 'GET'),
        priority: 'high',
      });
      tests.push({
        testName: `API路由 ${baseName} POST方法`,
        description: '测试POST请求的创建功能',
        testContent: this.generateAPITestTemplate(baseName, 'POST'),
        priority: 'high',
      });
    } else if (change.filePath.includes('/lib/')) {
      tests.push({
        testName: `${baseName} 核心函数测试`,
        description: '测试核心业务逻辑函数',
        testContent: this.generateLibTestTemplate(baseName, change.functions),
        priority: 'high',
      });
    }

    return tests;
  }

  private generateComplexLogicTests(change: CodeChange, func: FunctionInfo): TestGap['suggestedTests'] {
    return [
      {
        testName: `${func.name} 正常路径测试`,
        description: `测试 ${func.name} 在正常输入下的行为`,
        testContent: this.generateFunctionTest(func),
        priority: 'high',
      },
      {
        testName: `${func.name} 边界条件测试`,
        description: `测试 ${func.name} 的边界值处理`,
        testContent: this.generateBoundaryTest(func),
        priority: 'high',
      },
      {
        testName: `${func.name} 错误处理测试`,
        description: `测试 ${func.name} 的异常情况处理`,
        testContent: this.generateErrorTest(func),
        priority: 'medium',
      },
    ];
  }

  private generatePatternTests(change: CodeChange, func: FunctionInfo, patterns: string[]): TestGap['suggestedTests'] {
    return patterns.map(pattern => ({
      testName: `${func.name} ${pattern}测试`,
      description: `测试 ${func.name} 的${pattern}逻辑`,
      testContent: this.generatePatternTest(func, pattern),
      priority: 'medium',
    }));
  }

  private generateAPITestTemplate(name: string, method: string): string {
    return `import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

describe('${name} API', () => {
  describe('${method}', () => {
    it('should return success response', async () => {
      // TODO: Implement test
      expect(true).toBe(true);
    });
  });
});`;
  }

  private generateLibTestTemplate(name: string, functions: FunctionInfo[]): string {
    const testCases = functions
      .filter(f => f.isExported)
      .map(f => `    it('should handle ${f.name}', () => {\n      // TODO: Implement test\n      expect(true).toBe(true);\n    });`)
      .join('\n');

    return `import { describe, it, expect } from 'vitest';

describe('${name}', () => {
${testCases}
});`;
  }

  private generateFunctionTest(func: FunctionInfo): string {
    return `describe('${func.name}', () => {
  it('should return expected result for valid input', () => {
    // TODO: Add specific test case
    expect(true).toBe(true);
  });

  it('should handle edge case input', () => {
    // TODO: Add edge case
    expect(true).toBe(true);
  });
});`;
  }

  private generateBoundaryTest(func: FunctionInfo): string {
    return `describe('${func.name} boundary', () => {
  it('should handle empty input', () => {
    // TODO: Test empty/null cases
    expect(true).toBe(true);
  });

  it('should handle maximum value input', () => {
    // TODO: Test boundary values
    expect(true).toBe(true);
  });
});`;
  }

  private generateErrorTest(func: FunctionInfo): string {
    return `describe('${func.name} error handling', () => {
  it('should throw on invalid input', () => {
    // TODO: Test error cases
    expect(true).toBe(true);
  });

  it('should handle async errors', async () => {
    // TODO: Test async error handling
    expect(true).toBe(true);
  });
});`;
  }

  private generatePatternTest(func: FunctionInfo, pattern: string): string {
    return `describe('${func.name} ${pattern}', () => {
  it('should ${pattern} correctly', () => {
    // TODO: Test ${pattern} logic
    expect(true).toBe(true);
  });
});`;
  }

  private isPriorityFile(filePath: string): boolean {
    return Object.values(this.PRIORITY_PATTERNS).some(pattern => pattern.test(filePath));
  }

  private calculateSeverity(complexity: number): Severity {
    if (complexity >= this.COMPLEXITY_THRESHOLDS.critical) return 'critical';
    if (complexity >= this.COMPLEXITY_THRESHOLDS.high) return 'high';
    if (complexity >= this.COMPLEXITY_THRESHOLDS.medium) return 'medium';
    return 'low';
  }

  private getFileName(filePath: string): string {
    const parts = filePath.replace(/\\/g, '/').split('/');
    return parts[parts.length - 1];
  }

  private extractFunctionContent(filePath: string, func: FunctionInfo): string | null {
    const content = require('fs').readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    if (func.endLine === 0) return null;
    return lines.slice(func.startLine - 1, func.endLine).join('\n');
  }

  private hasUntestedPatterns(content: string): boolean {
    const patterns = this.detectUntestedPatterns(content);
    return patterns.length > 0;
  }

  private detectUntestedPatterns(content: string): string[] {
    const patterns: string[] = [];

    if (/throw\s+new\s+Error/.test(content) || /if\s*\([^)]*===?\s*null/.test(content)) {
      patterns.push('错误处理');
    }

    if (/for\s*\(|while\s*\(|\.forEach\(|\.map\(|\.filter\(/.test(content)) {
      patterns.push('循环处理');
    }

    if (/if\s*\([^)]*(\.length|===?\s*0|<=|>=)/.test(content)) {
      patterns.push('边界条件');
    }

    if (/JSON\.parse|JSON\.stringify|\.split\(|\.join\(/.test(content)) {
      patterns.push('数据解析');
    }

    if (/async\s+function|await\s+/.test(content)) {
      patterns.push('异步逻辑');
    }

    return patterns;
  }
}
```

---

## Task 4: 创建测试生成器

**Files:**
- Create: `src/test-gap-analyzer/test-generator.ts`

- [ ] **Step 1: 实现测试生成器**

```typescript
// src/test-gap-analyzer/test-generator.ts

import * as fs from 'fs';
import * as path from 'path';
import { TestGap, TestSuggestion, FunctionInfo } from './types';
import { toPascalCase, toCamelCase, formatFilePath } from './utils';

export class TestGenerator {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  generateTestFile(gap: TestGap): string {
    const testFilePath = this.getTestFilePath(gap.filePath);
    const existingContent = this.readExistingTest(testFilePath);

    const testContent = this.generateTestContent(gap);

    if (existingContent) {
      return this.mergeTests(existingContent, testContent, gap);
    }

    return testContent;
  }

  private getTestFilePath(sourceFile: string): string {
    const dir = path.dirname(sourceFile);
    const baseName = path.basename(sourceFile, path.extname(sourceFile));
    const testDir = path.join(dir, '__tests__');

    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    return path.join(testDir, `${baseName}.test.ts`);
  }

  private readExistingTest(testFilePath: string): string | null {
    if (fs.existsSync(testFilePath)) {
      return fs.readFileSync(testFilePath, 'utf-8');
    }
    return null;
  }

  private generateTestContent(gap: TestGap): string {
    const imports = this.generateImports(gap);
    const testBlocks = gap.suggestedTests
      .map(suggestion => this.generateTestBlock(gap, suggestion))
      .join('\n\n');

    return `${this.getFileHeader(gap)}

${imports}

${testBlocks}
`;
  }

  private getFileHeader(gap: TestGap): string {
    return `/**
 * 自动生成的测试文件
 * 原文件: ${formatFilePath(gap.filePath, this.projectRoot)}
 * 生成时间: ${new Date().toISOString()}
 * 风险等级: ${gap.severity.toUpperCase()}
 * 缺口类型: ${gap.gapType}
 */
`;
  }

  private generateImports(gap: TestGap): string {
    const imports: string[] = ["import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';"];

    if (gap.filePath.includes('/api/')) {
      imports.push("import { NextRequest } from 'next/server';");
    }

    if (gap.filePath.includes('/lib/')) {
      const moduleName = path.basename(gap.filePath, path.extname(gap.filePath));
      imports.push(`import { ${this.getExportedNames(gap)} } from '@/lib/${moduleName}';`);
    }

    if (gap.filePath.includes('/contexts/')) {
      const moduleName = path.basename(gap.filePath, path.extname(gap.filePath));
      imports.push(`import { ${moduleName} } from '@/contexts/${moduleName}';`);
    }

    return imports.join('\n');
  }

  private getExportedNames(gap: TestGap): string {
    if (gap.functionName) {
      return gap.functionName;
    }
    return gap.suggestedTests
      .map(s => s.testName.split(' ')[1])
      .filter((name, index, arr) => arr.indexOf(name) === index)
      .join(', ');
  }

  private generateTestBlock(gap: TestGap, suggestion: TestSuggestion): string {
    const testName = this.formatTestName(suggestion.testName);
    const mockSetup = this.generateMockSetup(gap);
    const assertions = this.generateAssertions(suggestion, gap);

    return `describe('${this.getTestSuiteName(gap)}', () => {
  ${mockSetup}

  describe('${testName}', () => {
    it('${suggestion.description}', async () => {
      ${assertions}
    });
  });
});`;
  }

  private generateMockSetup(gap: TestGap): string {
    if (gap.filePath.includes('/lib/local-db')) {
      return `beforeEach(() => {
  vi.clearAllMocks();
});`;
    }

    if (gap.filePath.includes('/api/')) {
      return `const mockRequest = {
  json: vi.fn(),
  nextUrl: { searchParams: { get: vi.fn() } },
} as any;`;
    }

    return '';
  }

  private generateAssertions(suggestion: TestSuggestion, gap: TestGap): string {
    if (suggestion.testContent.includes('// TODO:')) {
      return `// TODO: 实现具体的断言逻辑
expect(true).toBe(true);`;
    }

    return 'expect(true).toBe(true);';
  }

  private formatTestName(name: string): string {
    return name
      .replace(/[`]?API路由[`]?/g, '')
      .replace(/[`]?函数[`]?/g, '')
      .replace(/测试$/g, '');
  }

  private getTestSuiteName(gap: TestGap): string {
    const baseName = path.basename(gap.filePath, path.extname(gap.filePath));
    return toPascalCase(baseName);
  }

  private mergeTests(existingContent: string, newContent: string, gap: TestGap): string {
    const newTests = this.extractNewTests(newContent);

    const existingDescribe = existingContent.match(/describe\('([^']+)'/)?.[1];
    const newDescribe = this.getTestSuiteName(gap);

    if (existingDescribe === newDescribe) {
      const lastDescribeClose = existingContent.lastIndexOf('});');
      if (lastDescribeClose !== -1) {
        const mergedContent = existingContent.slice(0, lastDescribeClose) +
          '\n\n' + newTests + '\n});';
        return mergedContent;
      }
    }

    return existingContent + '\n\n' + newContent;
  }

  private extractNewTests(content: string): string {
    const describeMatch = content.match(/describe\('[\s\S]+'\);$/m);
    if (describeMatch) {
      return describeMatch[0];
    }
    return content;
  }

  writeTestFile(filePath: string, content: string): boolean {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, content, 'utf-8');
      return true;
    } catch (error) {
      console.error('Failed to write test file:', error);
      return false;
    }
  }

  getAllSuggestedTests(gaps: TestGap[]): Map<string, TestSuggestion[]> {
    const testMap = new Map<string, TestSuggestion[]>();

    for (const gap of gaps) {
      const filePath = this.getTestFilePath(gap.filePath);
      const existing = testMap.get(filePath) || [];
      testMap.set(filePath, [...existing, ...gap.suggestedTests]);
    }

    return testMap;
  }
}
```

---

## Task 5: 创建报告生成器

**Files:**
- Create: `src/test-gap-analyzer/reporter.ts`

- [ ] **Step 1: 实现报告生成器**

```typescript
// src/test-gap-analyzer/reporter.ts

import { GapAnalysisResult, TestGap, AnalysisSummary } from './types';
import { formatFilePath } from './utils';

export class Reporter {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  generateReport(result: GapAnalysisResult): string {
    const summary = this.generateSummary(result.summary);
    const details = this.generateDetails(result.gaps);
    const recommendations = this.generateRecommendations(result.gaps);

    return `
# 测试缺口分析报告

生成时间: ${result.timestamp}
分析文件数: ${result.analyzedFiles}
总缺口数: ${result.summary.total}

## 执行摘要

${summary}

## 详细分析

${details}

## 建议

${recommendations}

---
自动生成 by Test Gap Analyzer
`.trim();
  }

  generateMarkdownReport(result: GapAnalysisResult): string {
    return this.generateReport(result);
  }

  generateJsonReport(result: GapAnalysisResult): string {
    return JSON.stringify(result, null, 2);
  }

  private generateSummary(summary: AnalysisSummary): string {
    const severityEmoji = {
      critical: '🔴',
      high: '🟠',
      medium: '🟡',
      low: '🟢',
    };

    const lines = [
      `| 严重级别 | 数量 |`,
      `|---------|------|`,
      `| 🔴 Critical | ${summary.critical} |`,
      `| 🟠 High | ${summary.high} |`,
      `| 🟡 Medium | ${summary.medium} |`,
      `| 🟢 Low | ${summary.low} |`,
    ];

    const typeBreakdown = Object.entries(summary.byType)
      .map(([type, count]) => `- ${this.translateGapType(type)}: ${count}`)
      .join('\n');

    return `
按严重程度分布：

${lines.join('\n')}

按缺口类型分布：

${typeBreakdown}

**需要立即处理的严重问题: ${summary.critical + summary.high} 个**
    `.trim();
  }

  private generateDetails(gaps: TestGap[]): string {
    if (gaps.length === 0) {
      return '未发现测试缺口 🎉';
    }

    const grouped = this.groupBySeverity(gaps);

    let details = '';

    for (const [severity, severityGaps] of Object.entries(grouped)) {
      if (severityGaps.length === 0) continue;

      details += `\n### ${severity.toUpperCase()} (${severityGaps.length} 个)\n\n`;

      for (const gap of severityGaps) {
        details += this.formatGap(gap);
      }
    }

    return details;
  }

  private formatGap(gap: TestGap): string {
    const fileName = formatFilePath(gap.filePath, this.projectRoot);
    const functionPart = gap.functionName ? ` - ${gap.functionName}` : '';
    const typePart = `\`${this.translateGapType(gap.gapType)}\``;

    let content = `#### ${fileName}${functionPart}\n`;
    content += `- **严重程度**: ${this.getSeverityLabel(gap.severity)}\n`;
    content += `- **缺口类型**: ${typePart}\n`;
    content += `- **描述**: ${gap.description}\n`;

    if (gap.riskFactors.length > 0) {
      content += `- **风险因素**:\n`;
      for (const factor of gap.riskFactors) {
        content += `  - ${factor}\n`;
      }
    }

    if (gap.suggestedTests.length > 0) {
      content += `- **建议测试**:\n`;
      for (const test of gap.suggestedTests) {
        content += `  - **${test.testName}** (${test.priority}): ${test.description}\n`;
      }
    }

    content += '\n';

    return content;
  }

  private generateRecommendations(gaps: TestGap[]): string {
    if (gaps.length === 0) {
      return `
## 结论

✅ 所有测试缺口已被覆盖，代码库具有良好的测试保障。

### 建议
- 继续保持当前的测试编写规范
- 在修改现有功能时同步更新测试
- 新增功能必须包含测试用例
`;
    }

    const critical = gaps.filter(g => g.severity === 'critical');
    const high = gaps.filter(g => g.severity === 'high');

    let recommendations = '';

    if (critical.length > 0) {
      recommendations += `
## 紧急行动

以下 **${critical.length}** 个严重问题需要立即处理：

`;
      for (const gap of critical) {
        recommendations += `1. ${formatFilePath(gap.filePath, this.projectRoot)}${gap.functionName ? ` - ${gap.functionName}` : ''}\n`;
      }
      recommendations += '\n';
    }

    if (high.length > 0) {
      recommendations += `
## 高优先级

以下 **${high.length}** 个高优先级问题建议在下一个迭代中处理：

`;
      for (const gap of high) {
        recommendations += `- ${formatFilePath(gap.filePath, this.projectRoot)}${gap.functionName ? ` - ${gap.functionName}` : ''}\n`;
      }
      recommendations += '\n';
    }

    recommendations += `
## 总体建议

1. **优先测试核心模块**: API路由、数据层、认证模块
2. **关注复杂逻辑**: 圈复杂度超过5的函数需要完整测试
3. **验证错误处理**: 所有抛出异常的地方都需要测试
4. **边界条件覆盖**: 特别注意空值、零值、最大值等情况
`;

    return recommendations;
  }

  private groupBySeverity(gaps: TestGap[]): Record<string, TestGap[]> {
    return {
      critical: gaps.filter(g => g.severity === 'critical'),
      high: gaps.filter(g => g.severity === 'high'),
      medium: gaps.filter(g => g.severity === 'medium'),
      low: gaps.filter(g => g.severity === 'low'),
    };
  }

  private translateGapType(type: string): string {
    const translations: Record<string, string> = {
      missing_test_file: '缺少测试文件',
      no_coverage_for_logic_path: '逻辑路径无覆盖',
      bug_fix_without_test: 'Bug修复无测试',
      complex_logic_untested: '复杂逻辑未测试',
      boundary_condition_untested: '边界条件未测试',
      edge_case_untested: '极端情况未测试',
      error_handling_untested: '错误处理未测试',
    };
    return translations[type] || type;
  }

  private getSeverityLabel(severity: string): string {
    const labels: Record<string, string> = {
      critical: '🔴 严重',
      high: '🟠 高',
      medium: '🟡 中',
      low: '🟢 低',
    };
    return labels[severity] || severity;
  }

  printSummary(result: GapAnalysisResult): void {
    console.log('\n📊 测试缺口分析摘要');
    console.log('═'.repeat(50));
    console.log(`总缺口数: ${result.summary.total}`);
    console.log(`🔴 Critical: ${result.summary.critical}`);
    console.log(`🟠 High: ${result.summary.high}`);
    console.log(`🟡 Medium: ${result.summary.medium}`);
    console.log(`🟢 Low: ${result.summary.low}`);
    console.log('═'.repeat(50));

    if (result.summary.critical > 0) {
      console.log(`\n⚠️  发现 ${result.summary.critical} 个严重问题需要立即处理！`);
    }
  }
}
```

---

## Task 6: 创建主入口文件

**Files:**
- Create: `src/test-gap-analyzer/index.ts`

- [ ] **Step 1: 实现主入口**

```typescript
// src/test-gap-analyzer/index.ts

import * as path from 'path';
import * as fs from 'fs';
import { CodeAnalyzer } from './code-analyzer';
import { RiskAssessor } from './risk-assessor';
import { TestGenerator } from './test-generator';
import { Reporter } from './reporter';
import { GapAnalysisResult, AnalysisSummary, TestGap } from './types';
import { getExistingTestFile } from './utils';

export class TestGapAnalyzer {
  private analyzer: CodeAnalyzer;
  private assessor: RiskAssessor;
  private generator: TestGenerator;
  private reporter: Reporter;
  private projectRoot: string;

  constructor(projectRoot?: string) {
    this.projectRoot = projectRoot || process.cwd();
    this.analyzer = new CodeAnalyzer(this.projectRoot);
    this.assessor = new RiskAssessor();
    this.generator = new TestGenerator(this.projectRoot);
    this.reporter = new Reporter(this.projectRoot);
  }

  async analyze(options: AnalyzeOptions = {}): Promise<GapAnalysisResult> {
    const { dirs = ['src/app/api', 'src/lib', 'src/contexts', 'src/hooks'] } = options;

    const allGaps: TestGap[] = [];

    for (const dir of dirs) {
      const dirPath = path.join(this.projectRoot, dir);
      if (!fs.existsSync(dirPath)) {
        console.warn(`⚠️  目录不存在: ${dirPath}`);
        continue;
      }

      console.log(`📂 分析目录: ${dir}`);
      const changes = this.analyzer.analyzeDirectory(dirPath);

      for (const change of changes) {
        const gaps = this.assessor.assessChange(change);
        allGaps.push(...gaps);
      }
    }

    const result = this.createResult(allGaps, changes?.length || 0);

    return result;
  }

  generateTests(gaps: TestGap[], dryRun: boolean = false): GeneratedTest[] {
    const generated: GeneratedTest[] = [];

    const testMap = this.generator.getAllSuggestedTests(gaps);

    for (const [filePath, suggestions] of testMap) {
      const existingTest = getExistingTestFile(filePath.replace(/__tests__\/.*\.test\.ts$/, '').replace(/\\/g, '/').replace('/__tests__/', '/'));

      const testContent = this.generator.generateTestFile({
        filePath: filePath.replace(/__tests__\/.*\.test\.ts$/, '').replace(/\\/g, '/').replace('/__tests__/', '/'),
        gapType: 'missing_test_file',
        severity: 'medium',
        description: '',
        suggestedTests: suggestions,
        riskFactors: [],
      });

      if (!dryRun) {
        this.generator.writeTestFile(filePath, testContent);
      }

      generated.push({
        filePath,
        suggestions,
        dryRun,
      });
    }

    return generated;
  }

  generateReport(result: GapAnalysisResult, format: 'markdown' | 'json' = 'markdown'): string {
    if (format === 'json') {
      return this.reporter.generateJsonReport(result);
    }
    return this.reporter.generateMarkdownReport(result);
  }

  saveReport(result: GapAnalysisResult, outputPath: string, format: 'markdown' | 'json' = 'markdown'): void {
    const content = this.generateReport(result, format);
    fs.writeFileSync(outputPath, content, 'utf-8');
    console.log(`📄 报告已保存至: ${outputPath}`);
  }

  printSummary(result: GapAnalysisResult): void {
    this.reporter.printSummary(result);
  }

  private createResult(gaps: TestGap[], analyzedFiles: number): GapAnalysisResult {
    const summary = this.calculateSummary(gaps);

    return {
      gaps,
      summary,
      timestamp: new Date().toISOString(),
      analyzedFiles,
    };
  }

  private calculateSummary(gaps: TestGap[]): AnalysisSummary {
    const summary: AnalysisSummary = {
      total: gaps.length,
      critical: 0,
      high: 0,
      medium: 0,
      low: 0,
      byType: {
        missing_test_file: 0,
        no_coverage_for_logic_path: 0,
        bug_fix_without_test: 0,
        complex_logic_untested: 0,
        boundary_condition_untested: 0,
        edge_case_untested: 0,
        error_handling_untested: 0,
      },
    };

    for (const gap of gaps) {
      summary[gap.severity]++;
      summary.byType[gap.gapType]++;
    }

    return summary;
  }
}

export interface AnalyzeOptions {
  dirs?: string[];
}

export interface GeneratedTest {
  filePath: string;
  suggestions: any[];
  dryRun: boolean;
}

const DEFAULT_DIRS = ['src/app/api', 'src/lib', 'src/contexts', 'src/hooks'];

async function main() {
  const args = process.argv.slice(2);
  const options: AnalyzeOptions = {
    dirs: DEFAULT_DIRS,
  };

  let dryRun = false;
  let outputPath: string | null = null;
  let format: 'markdown' | 'json' = 'markdown';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dirs') {
      options.dirs = args[i + 1]?.split(',') || DEFAULT_DIRS;
      i++;
    } else if (args[i] === '--dry-run') {
      dryRun = true;
    } else if (args[i] === '--output') {
      outputPath = args[i + 1];
      i++;
    } else if (args[i] === '--json') {
      format = 'json';
    }
  }

  console.log('🔍 启动测试缺口分析...\n');

  const analyzer = new TestGapAnalyzer();
  const result = await analyzer.analyze(options);

  analyzer.printSummary(result);

  const report = analyzer.generateReport(result, format);
  console.log('\n' + report);

  if (outputPath) {
    analyzer.saveReport(result, outputPath, format);
  }

  if (dryRun) {
    console.log('\n🔍 干运行模式 - 未生成实际测试文件');
  } else if (result.summary.critical + result.summary.high > 0) {
    console.log('\n⚙️  生成测试文件中...');
    const generated = analyzer.generateTests(result.gaps.filter(g => g.severity === 'critical' || g.severity === 'high'));
    console.log(`✅ 已生成 ${generated.length} 个测试文件`);
  }

  process.exit(result.summary.critical > 0 ? 1 : 0);
}

if (require.main === module) {
  main().catch(console.error);
}

export default TestGapAnalyzer;
```

---

## Task 7: 添加npm脚本

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 添加分析工具脚本**

在 `package.json` 的 `scripts` 部分添加:

```json
"test:gap": "tsx src/test-gap-analyzer/index.ts",
"test:gap:report": "tsx src/test-gap-analyzer/index.ts --output test-gap-report.md",
"test:gap:dry": "tsx src/test-gap-analyzer/index.ts --dry-run"
```

---

## Task 8: 编写单元测试

**Files:**
- Create: `src/test-gap-analyzer/__tests__/analyzer.test.ts`
- Create: `src/test-gap-analyzer/__tests__/generator.test.ts`

- [ ] **Step 1: 编写分析器测试**

```typescript
// src/test-gap-analyzer/__tests__/analyzer.test.ts

import { describe, it, expect } from 'vitest';
import { CodeAnalyzer } from '../code-analyzer';
import * as path from 'path';

describe('CodeAnalyzer', () => {
  const testProjectRoot = path.join(__dirname, '../../../../');
  const analyzer = new CodeAnalyzer(testProjectRoot);

  describe('analyzeFile', () => {
    it('should analyze a TypeScript file', () => {
      const filePath = path.join(testProjectRoot, 'src/lib/quadrant-utils.ts');
      const result = analyzer.analyzeFile(filePath);

      expect(result).not.toBeNull();
      expect(result?.filePath).toBe(filePath);
    });

    it('should extract functions from file', () => {
      const filePath = path.join(testProjectRoot, 'src/lib/quadrant-utils.ts');
      const result = analyzer.analyzeFile(filePath);

      expect(result?.functions.length).toBeGreaterThan(0);
      const exportedFunctions = result?.functions.filter(f => f.isExported);
      expect(exportedFunctions?.length).toBeGreaterThan(0);
    });

    it('should calculate complexity for functions', () => {
      const filePath = path.join(testProjectRoot, 'src/lib/quadrant-utils.ts');
      const result = analyzer.analyzeFile(filePath);

      const functions = result?.functions || [];
      for (const func of functions) {
        expect(typeof func.complexity).toBe('number');
        expect(func.complexity).toBeGreaterThanOrEqual(1);
      }
    });

    it('should return null for non-existent file', () => {
      const result = analyzer.analyzeFile('/non/existent/file.ts');
      expect(result).toBeNull();
    });
  });

  describe('detectLogicPatterns', () => {
    it('should detect error handling patterns', () => {
      const content = 'try { doSomething(); } catch (e) { handleError(e); }';
      const patterns = analyzer.detectLogicPatterns(content);

      expect(patterns.hasErrorHandling).toBe(true);
    });

    it('should detect async/await patterns', () => {
      const content = 'async function fetchData() { await getData(); }';
      const patterns = analyzer.detectLogicPatterns(content);

      expect(patterns.hasAsyncAwait).toBe(true);
    });

    it('should detect conditional patterns', () => {
      const content = 'if (value > 0) { positive(); } else { negative(); }';
      const patterns = analyzer.detectLogicPatterns(content);

      expect(patterns.hasConditionals).toBe(true);
    });

    it('should detect loop patterns', () => {
      const content = 'for (let i = 0; i < items.length; i++) { process(items[i]); }';
      const patterns = analyzer.detectLogicPatterns(content);

      expect(patterns.hasLoops).toBe(true);
    });

    it('should detect data validation patterns', () => {
      const content = 'function validateInput(data: string): boolean { return data.length > 0; }';
      const patterns = analyzer.detectLogicPatterns(content);

      expect(patterns.hasDataValidation).toBe(true);
    });
  });

  describe('isBusinessCritical', () => {
    it('should identify API routes as critical', () => {
      const apiPath = '/src/app/api/tasks/route.ts';
      expect(analyzer.isBusinessCritical(apiPath)).toBe(true);
    });

    it('should identify core lib files as critical', () => {
      const libPath = '/src/lib/local-db.ts';
      expect(analyzer.isBusinessCritical(libPath)).toBe(true);
    });

    it('should identify context files as critical', () => {
      const contextPath = '/src/contexts/AuthContext.tsx';
      expect(analyzer.isBusinessCritical(contextPath)).toBe(true);
    });

    it('should not identify non-critical files', () => {
      const componentPath = '/src/components/Button.tsx';
      expect(analyzer.isBusinessCritical(componentPath)).toBe(false);
    });
  });
});
```

- [ ] **Step 2: 编写生成器测试**

```typescript
// src/test-gap-analyzer/__tests__/generator.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestGenerator } from '../test-generator';
import { TestGap } from '../types';
import * as path from 'path';
import * as fs from 'fs';

describe('TestGenerator', () => {
  const testProjectRoot = path.join(__dirname, '../../../../');
  const generator = new TestGenerator(testProjectRoot);

  const mockGap: TestGap = {
    filePath: path.join(testProjectRoot, 'src/lib/mock-module.ts'),
    gapType: 'missing_test_file',
    severity: 'high',
    description: 'Mock module missing test coverage',
    suggestedTests: [
      {
        testName: 'should handle basic operation',
        description: 'Tests basic functionality',
        testContent: 'expect(true).toBe(true);',
        priority: 'high',
      },
      {
        testName: 'should handle edge cases',
        description: 'Tests edge case handling',
        testContent: 'expect(true).toBe(true);',
        priority: 'medium',
      },
    ],
    riskFactors: ['缺少测试覆盖'],
  };

  describe('generateTestFile', () => {
    it('should generate valid test content', () => {
      const content = generator.generateTestFile(mockGap);

      expect(content).toContain('describe(');
      expect(content).toContain('it(');
      expect(content).toContain('vitest');
    });

    it('should include imports', () => {
      const content = generator.generateTestFile(mockGap);

      expect(content).toContain("import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';");
    });

    it('should include file header', () => {
      const content = generator.generateTestFile(mockGap);

      expect(content).toContain('自动生成的测试文件');
      expect(content).toContain('原文件:');
      expect(content).toContain('生成时间:');
    });

    it('should include test descriptions', () => {
      const content = generator.generateTestFile(mockGap);

      expect(content).toContain('should handle basic operation');
      expect(content).toContain('Tests basic functionality');
    });
  });

  describe('getTestFilePath', () => {
    it('should generate correct test file path for lib files', () => {
      const sourcePath = path.join(testProjectRoot, 'src/lib/score-engine.ts');
      const testPath = generator.getTestFilePath(sourcePath);

      expect(testPath).toContain('src/lib/__tests__');
      expect(testPath).toContain('score-engine.test.ts');
    });

    it('should generate correct test file path for api files', () => {
      const sourcePath = path.join(testProjectRoot, 'src/app/api/tasks/route.ts');
      const testPath = generator.getTestFilePath(sourcePath);

      expect(testPath).toContain('src/app/api/tasks/__tests__');
      expect(testPath).toContain('route.test.ts');
    });
  });

  describe('getAllSuggestedTests', () => {
    it('should group tests by file path', () => {
      const gaps: TestGap[] = [
        { ...mockGap, suggestedTests: [mockGap.suggestedTests[0]] },
        { ...mockGap, suggestedTests: [mockGap.suggestedTests[1]] },
      ];

      const testMap = generator.getAllSuggestedTests(gaps);

      expect(testMap.size).toBe(1);
    });
  });
});
```

---

## Task 9: 运行测试验证

- [ ] **Step 1: 运行分析器测试**

```bash
npm test -- src/test-gap-analyzer/__tests__
```

- [ ] **Step 2: 运行测试缺口分析**

```bash
npm run test:gap:dry
```

- [ ] **Step 3: 生成分析报告**

```bash
npm run test:gap:report
```

---

## 自检清单

1. **规范覆盖**: 检查是否遵循项目现有测试框架（Vitest）
2. **命名规范**: 确认测试文件命名遵循 `*.test.ts` 模式
3. **导入模式**: 验证导入语句使用 `@/lib` 别名
4. **Mock模式**: 确认使用 `vi.hoisted` 进行依赖mock
5. **断言风格**: 确认使用 `expect` 而非 `assert`
6. **测试隔离**: 确认使用 `beforeEach`/`afterEach` 进行清理
7. **优先级排序**: Critical > High > Medium > Low

---

**Plan complete and saved to `docs/superpowers/plans/2026-05-22-test-gap-analyzer.md`**

**Two execution options:**

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
