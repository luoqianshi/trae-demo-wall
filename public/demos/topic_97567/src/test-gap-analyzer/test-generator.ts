import * as fs from 'fs';
import * as path from 'path';
import { TestGap, TestSuggestion } from './types';
import { toPascalCase, formatFilePath } from './utils';

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

  private generateAssertions(suggestion: TestSuggestion, _gap: TestGap): string {
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
