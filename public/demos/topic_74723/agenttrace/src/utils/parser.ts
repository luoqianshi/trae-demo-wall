import type { ParsedResult, ParsedIssue, Severity } from '../types';

const errorKeywords = [
  'error',
  'failed',
  'exception',
  'timeout',
  '404',
  '400',
  'permission',
  'not found',
  'module not found',
  'EPERM',
  'symlink',
  '报错',
  '失败',
  '无法',
  '找不到',
  '权限',
  '中断',
];

const actionKeywords = [
  'created',
  'updated',
  'modified',
  'fixed',
  'implemented',
  'added',
  'removed',
  'refactored',
  '创建',
  '修改',
  '修复',
  '实现',
  '新增',
  '删除',
  '重构',
];

const filePathPattern = /[\w\-./\\]+\.(tsx|ts|jsx|js|css|html|json|md|py|java|yml|yaml)/gi;
const commandPattern = /(npm|pnpm|yarn|git|python|pip|node|npx|uv|docker)\s+[^\n]+/gi;

export function parseTranscript(transcript: string): ParsedResult {
  const lines = transcript.split('\n').map(line => line.trim()).filter(Boolean);
  
  const errors: { line: string; keyword: string }[] = [];
  const actions: string[] = [];
  const filesSet = new Set<string>();
  const commands: string[] = [];
  const completedItems: string[] = [];

  lines.forEach(line => {
    // Detect errors
    const lowerLine = line.toLowerCase();
    for (const keyword of errorKeywords) {
      if (lowerLine.includes(keyword.toLowerCase())) {
        errors.push({ line, keyword });
        break;
      }
    }

    // Detect actions
    for (const keyword of actionKeywords) {
      if (lowerLine.includes(keyword.toLowerCase())) {
        actions.push(line);
        break;
      }
    }

    // Detect file paths
    const fileMatches = line.match(filePathPattern);
    if (fileMatches) {
      fileMatches.forEach(f => filesSet.add(f));
    }

    // Detect commands
    const cmdMatches = line.match(commandPattern);
    if (cmdMatches) {
      cmdMatches.forEach(cmd => commands.push(cmd));
    }

    // Detect completed items (lines that indicate success)
    if (
      lowerLine.includes('success') ||
      lowerLine.includes('完成') ||
      lowerLine.includes('build success') ||
      lowerLine.includes('页面可以正常打开')
    ) {
      completedItems.push(line);
    }
  });

  return {
    errors,
    actions: [...new Set(actions)],
    files: Array.from(filesSet),
    commands: [...new Set(commands)],
    completedItems: [...new Set(completedItems)],
  };
}

function determineSeverity(keyword: string): Severity {
  const highSeverity = ['error', 'exception', 'EPERM', 'permission', 'failed', '失败', '报错', '中断'];
  const mediumSeverity = ['timeout', '404', '400', 'not found', 'module not found', '无法', '找不到', '权限'];
  
  const lower = keyword.toLowerCase();
  if (highSeverity.some(k => lower.includes(k.toLowerCase()))) return 'high';
  if (mediumSeverity.some(k => lower.includes(k.toLowerCase()))) return 'medium';
  return 'low';
}

function generateIssueSolution(errorLine: string, keyword: string): { solution: string; prevention: string; possibleCause: string } {
  const lower = errorLine.toLowerCase();
  
  if (lower.includes('module not found') || lower.includes('can\'t resolve')) {
    return {
      possibleCause: '导入路径错误或文件名大小写不一致',
      solution: '检查导入路径，确保文件名大小写完全匹配，确认文件确实存在',
      prevention: '使用 IDE 自动补全导入路径，避免手动输入路径',
    };
  }
  
  if (lower.includes('permission') || lower.includes('eperm')) {
    return {
      possibleCause: '权限不足或浏览器安全限制',
      solution: '检查文件权限，对于浏览器环境使用 input file 由用户主动选择文件',
      prevention: '了解目标环境的安全限制，浏览器端避免直接访问本地绝对路径',
    };
  }
  
  if (lower.includes('timeout')) {
    return {
      possibleCause: '网络超时或操作执行时间过长',
      solution: '增加超时时间，检查网络连接，或拆分大任务',
      prevention: '为长时间操作设置合理的超时和重试机制',
    };
  }
  
  if (lower.includes('404')) {
    return {
      possibleCause: '资源不存在或 URL 错误',
      solution: '检查 URL 路径是否正确，确认资源已部署',
      prevention: '使用环境变量管理 API 地址，添加请求前的 URL 校验',
    };
  }

  if (lower.includes('symlink')) {
    return {
      possibleCause: '符号链接创建失败或权限问题',
      solution: '检查目录权限，清理 node_modules 后重新安装依赖',
      prevention: '使用管理员权限运行命令，或清理缓存后重试',
    };
  }

  return {
    possibleCause: `检测到关键词 "${keyword}"，需要进一步排查`,
    solution: '查看完整错误日志，定位具体问题，参考官方文档或社区解决方案',
    prevention: '仔细阅读错误信息，添加日志输出便于调试',
  };
}

export function extractIssues(parsed: ParsedResult): ParsedIssue[] {
  const issues: ParsedIssue[] = [];
  const seen = new Set<string>();

  parsed.errors.forEach(({ line, keyword }) => {
    // Simple dedup by keyword
    if (seen.has(keyword) && issues.length > 0) return;
    seen.add(keyword);

    const severity = determineSeverity(keyword);
    const { possibleCause, solution, prevention } = generateIssueSolution(line, keyword);

    issues.push({
      title: keyword.charAt(0).toUpperCase() + keyword.slice(1) + ' 相关问题',
      severity,
      evidence: line,
      possibleCause,
      solution,
      prevention,
    });
  });

  return issues;
}
