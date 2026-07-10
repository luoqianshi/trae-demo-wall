import * as path from 'path';
import * as fs from 'fs';
import { CodeAnalyzer } from './code-analyzer';
import { RiskAssessor } from './risk-assessor';
import { TestGenerator } from './test-generator';
import { Reporter } from './reporter';
import { GapAnalysisResult, AnalysisSummary, TestGap, TestSuggestion } from './types';

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
    let totalAnalyzedFiles = 0;

    for (const dir of dirs) {
      const dirPath = path.join(this.projectRoot, dir);
      if (!fs.existsSync(dirPath)) {
        console.warn(`⚠️  目录不存在: ${dirPath}`);
        continue;
      }

      console.log(`📂 分析目录: ${dir}`);
      const changes = this.analyzer.analyzeDirectory(dirPath);
      totalAnalyzedFiles += changes.length;

      for (const change of changes) {
        const gaps = this.assessor.assessChange(change);
        allGaps.push(...gaps);
      }
    }

    const result = this.createResult(allGaps, totalAnalyzedFiles);

    return result;
  }

  generateTests(gaps: TestGap[], dryRun: boolean = false): GeneratedTest[] {
    const generated: GeneratedTest[] = [];

    const testMap = this.generator.getAllSuggestedTests(gaps);

    for (const [filePath, suggestions] of testMap) {
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
  suggestions: TestSuggestion[];
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
