import { CodeChange, TestGap, Severity, FunctionInfo } from './types';
import { getExistingTestFile } from './utils';
import * as fs from 'fs';

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
    const content = fs.readFileSync(filePath, 'utf-8');
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
