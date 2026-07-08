import type { ProjectMeta, CostMeta, ReviewReport, ParsedIssue } from '../types';

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getStatusText(status: string): string {
  const map: Record<string, string> = {
    success: '成功',
    partial: '部分成功',
    failed: '失败',
    blocked: '阻塞',
  };
  return map[status] || status;
}

function getSeverityText(severity: string): string {
  const map: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
  };
  return map[severity] || severity;
}

export function exportProjectLog(
  project: ProjectMeta,
  cost: CostMeta,
  report: ReviewReport
): void {
  const currencySymbol = cost.currency === 'USD' ? '$' : '¥';
  const content = `# 项目复盘：${project.projectName}

## 本次目标

${project.taskGoal}

## 使用工具与模型

- 工具：${project.tool}
- 模型：${project.modelName}
- 状态：${getStatusText(project.status)}
- 开始时间：${project.startTime}
- 结束时间：${project.endTime}
- 耗时：${project.durationMinutes} 分钟

## 阶段总结

${report.summary}

## 完成内容

${report.completedItems.map(item => `- ${item}`).join('\n')}

## 关键操作

${report.keyActions.map(action => `- ${action}`).join('\n')}

## 修改文件

${report.modifiedFiles.length > 0 
  ? report.modifiedFiles.map(f => `- ${f}`).join('\n') 
  : '- 未识别到文件变更'}

## 遇到的问题

${report.issues.length > 0
  ? report.issues.map((issue, i) => `### 问题 ${i + 1}：${issue.title}
- 严重程度：${getSeverityText(issue.severity)}
- 证据：${issue.evidence}
- 可能原因：${issue.possibleCause}
- 解决方式：${issue.solution}
- 下次避免：${issue.prevention}`).join('\n\n')
  : '- 未识别到明显问题'}

## 成本与效率

${report.costAnalysis}

## 模型表现评价

${report.modelEvaluation}

## 下次提示词建议

${report.nextPromptSuggestions.map(s => `- ${s}`).join('\n')}

---
生成时间：${new Date().toLocaleString('zh-CN')}
由 AgentTrace 生成
`;

  downloadFile(content, 'project-log.md', 'text/markdown;charset=utf-8');
}

export function exportCommonIssues(issues: ParsedIssue[]): void {
  const content = `# 常见问题沉淀

${issues.length > 0
  ? issues.map((issue, i) => `## 问题 ${i + 1}：${issue.title}

- 严重程度：${getSeverityText(issue.severity)}
- 证据：${issue.evidence}
- 可能原因：${issue.possibleCause}
- 解决方式：${issue.solution}
- 下次避免：${issue.prevention}`).join('\n\n')
  : '本次未识别到问题。'}

---
生成时间：${new Date().toLocaleString('zh-CN')}
由 AgentTrace 生成
`;

  downloadFile(content, 'common-issues.md', 'text/markdown;charset=utf-8');
}

export function exportSessionSummary(
  project: ProjectMeta,
  cost: CostMeta,
  transcript: string,
  report: ReviewReport | null
): void {
  const data = {
    projectMeta: project,
    costMeta: cost,
    transcript,
    report,
    exportedAt: new Date().toISOString(),
    version: '1.0',
  };

  const content = JSON.stringify(data, null, 2);
  downloadFile(content, 'session-summary.json', 'application/json;charset=utf-8');
}
