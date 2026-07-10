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
