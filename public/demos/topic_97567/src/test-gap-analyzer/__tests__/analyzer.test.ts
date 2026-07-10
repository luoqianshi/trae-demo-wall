import { describe, it, expect } from 'vitest';
import { CodeAnalyzer } from '../code-analyzer';
import * as path from 'path';
import * as fs from 'fs';

describe('CodeAnalyzer', () => {
  const testProjectRoot = path.resolve(__dirname, '../../../');
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
      const content = 'const isValid = validate(data); if (isValid) { parseData(); }';
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
