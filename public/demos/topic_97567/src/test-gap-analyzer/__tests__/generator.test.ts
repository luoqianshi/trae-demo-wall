import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TestGenerator } from '../test-generator';
import { TestGap } from '../types';
import * as path from 'path';

describe('TestGenerator', () => {
  const testProjectRoot = path.resolve(__dirname, '../../../');
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

    it('should include severity level in header', () => {
      const content = generator.generateTestFile(mockGap);

      expect(content).toContain('风险等级:');
      expect(content).toContain('HIGH');
    });

    it('should include gap type in header', () => {
      const content = generator.generateTestFile(mockGap);

      expect(content).toContain('缺口类型:');
      expect(content).toContain('missing_test_file');
    });
  });

  describe('getTestFilePath', () => {
    it('should generate correct test file path pattern for lib files', () => {
      const sourcePath = 'src/lib/score-engine.ts';
      const expectedBasename = 'score-engine.test.ts';

      expect(sourcePath).toContain('score-engine');
      expect(expectedBasename).toBe('score-engine.test.ts');
    });

    it('should generate correct test file path pattern for api files', () => {
      const sourcePath = 'src/app/api/tasks/route.ts';
      const expectedBasename = 'route.test.ts';

      expect(sourcePath).toContain('route');
      expect(expectedBasename).toBe('route.test.ts');
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

    it('should collect all suggestions from all gaps', () => {
      const mockGap2: TestGap = {
        filePath: path.join(testProjectRoot, 'src/lib/mock-module2.ts'),
        gapType: 'missing_test_file',
        severity: 'high',
        description: 'Mock module 2 missing test coverage',
        suggestedTests: [
          {
            testName: 'should handle another operation',
            description: 'Tests another functionality',
            testContent: 'expect(true).toBe(true);',
            priority: 'high',
          },
        ],
        riskFactors: ['缺少测试覆盖'],
      };

      const gaps: TestGap[] = [
        mockGap,
        mockGap2,
      ];

      const testMap = generator.getAllSuggestedTests(gaps);

      expect(testMap.size).toBe(2);
    });
  });
});
