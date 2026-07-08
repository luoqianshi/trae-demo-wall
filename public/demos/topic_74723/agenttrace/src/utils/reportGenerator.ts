import type { ProjectMeta, CostMeta, ReviewReport, TaskStatus } from '../types';
import { parseTranscript, extractIssues } from './parser';
import { calculateCostMetrics, calculateModelScore, formatCostAnalysis, formatModelEvaluation, getScoreLevel } from './cost';

function getStatusSummary(status: TaskStatus): string {
  switch (status) {
    case 'success':
      return '核心目标已完成，任务执行顺利。';
    case 'partial':
      return '主要流程已跑通，但仍存在优化项或未完成功能。';
    case 'failed':
      return '任务未完成，需要重新拆解或人工介入。';
    case 'blocked':
      return '任务被环境、权限或模型能力阻塞。';
    default:
      return '';
  }
}

function generateNextSuggestions(
  project: ProjectMeta,
  issuesCount: number,
  score: number
): string[] {
  const suggestions: string[] = [];

  if (issuesCount > 0) {
    suggestions.push('先参考"常见问题"部分解决本次遇到的问题，再继续后续开发');
  }

  if (score < 70) {
    suggestions.push('将任务拆分为更小的子任务，逐步验证每一步的结果');
    suggestions.push('在提示词中提供更明确的约束条件和期望输出格式');
  }

  if (project.status === 'partial') {
    suggestions.push('明确列出剩余未完成项，下次优先处理');
  }

  suggestions.push('下次开始时先回顾本次复盘，避免重复踩坑');
  suggestions.push('记录使用的命令和关键决策，便于团队共享经验');

  return suggestions;
}

export function generateReport(
  project: ProjectMeta,
  cost: CostMeta,
  transcript: string
): ReviewReport {
  const parsed = parseTranscript(transcript);
  const issues = extractIssues(parsed);
  const costMetrics = calculateCostMetrics(cost, project.durationMinutes);
  const modelScore = calculateModelScore(cost, project.status);
  const scoreInfo = getScoreLevel(modelScore);

  const summary = `${getStatusSummary(project.status)}
本次任务目标：${project.taskGoal}
共识别到 ${issues.length} 个问题，${parsed.files.length} 个文件变更，执行了 ${parsed.commands.length} 条命令。`;

  const completedItems = parsed.completedItems.length > 0
    ? parsed.completedItems
    : parsed.actions.slice(0, 5);

  const keyActions = parsed.actions.length > 0
    ? parsed.actions
    : parsed.commands;

  const modelEvaluation = formatModelEvaluation(project.modelName, modelScore, scoreInfo);
  const costAnalysis = formatCostAnalysis(cost, costMetrics, project.durationMinutes);
  const nextPromptSuggestions = generateNextSuggestions(project, issues.length, modelScore);

  return {
    summary,
    completedItems,
    keyActions,
    modifiedFiles: parsed.files,
    issues,
    costAnalysis,
    modelEvaluation,
    modelScore,
    nextPromptSuggestions,
    costMetrics,
  };
}
