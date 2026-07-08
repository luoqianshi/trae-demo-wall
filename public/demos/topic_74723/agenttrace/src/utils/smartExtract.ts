/**
 * 智能关键信息提取器
 * 从超长 AI Agent 日志中自动提取关键信息，过滤冗余内容
 */

// 关键标记关键词 - 这些行一定保留
const CRITICAL_KEYWORDS = [
  // 错误相关
  'error', 'failed', 'failure', 'exception', 'traceback', 'fatal',
  'err:', 'error:', '✗', '✘',
  '报错', '失败', '异常', '错误', '无法', '找不到', '中断', '崩溃',
  // 警告相关
  'warning', 'warn', 'deprecated',
  '警告', '注意', '已废弃',
  // 成功/完成
  'success', 'completed', 'created', 'modified', 'fixed', 'implemented',
  'added', 'updated', 'removed', 'build success', 'build succeeded',
  '✓', '✔', 'done',
  '完成', '成功', '创建', '修改', '修复', '实现', '新增', '删除', '构建成功',
  // 命令
  'command:', '$ ', '> npm', '> pnpm', '> yarn', '> git', '> python', '> node',
  'running command', 'executing',
  // 文件操作
  'create file', 'write file', 'edit file', 'delete file', 'rename file',
  'created file', 'wrote file', 'edited file',
  // 阶段标记
  '阶段', 'step', 'phase', 'todo', 'goal', 'task',
  '[任务', '[阶段', '[step',
];

// 冗余模式 - 这些行直接过滤
const NOISE_PATTERNS = [
  /^npm (warn|notice|info) /i,                    // npm 警告/信息
  /^added \d+ packages?/i,                       // npm install 结果
  /^downloading/i,                               // 下载进度
  /^progress:?\s*\d+%/i,                         // 进度条
  /^\s*[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/,                  // spinner 字符
  /^reusing/i,                                   // 缓存复用
  /^cache (hit|miss)/i,                          // 缓存信息
  /^\s*\d+\.\d+(\.\d+)?\s*(kB|MB|GB|ms|s)\s*$/i, // 纯大小/时间数字
  /^>\s*[\w-]+@\d+\.\d+\.\d+/i,                  // 版本号行
  /^hash:|^version:|^time:|^built at:/i,         // 构建信息行
  /^node_modules\//,                             // node_modules 路径
  /^\s*at .+\(.+\:\d+\:\d+\)/,                   // 堆栈跟踪行（除了第一行）
];

// 命令行开头模式
const COMMAND_PATTERNS = [
  /^(?:npm|pnpm|yarn|git|python|python3|pip|node|npx|uv|docker|kubectl|curl|wget|mkdir|rm|mv|cp|cd|ls|cat|echo|npm run)\s+/i,
  /^\$\s+/,
  /^Command:\s*/i,
  /^>\s+/,
];

// 文件路径模式
const FILE_PATH_PATTERN = /[\w\-./\\]+\.(tsx|ts|jsx|js|css|scss|less|html|json|md|py|java|yml|yaml|go|rs|vue|svelte|kt|swift|c|cpp|h|hpp|sh|bat|ps1)/i;

// 阶段标题模式
const STAGE_PATTERN = /^(\[|【|#+\s*|阶段\s*\d+|Step\s*\d+|Phase\s*\d+|Part\s*\d+)/i;

interface ExtractOptions {
  contextLines?: number;  // 关键行前后保留的上下文行数
  maxLines?: number;      // 最大返回行数
}

const DEFAULT_OPTIONS: Required<ExtractOptions> = {
  contextLines: 2,
  maxLines: 300,
};

export interface ExtractResult {
  extracted: string;      // 提取后的文本
  totalLines: number;     // 原始总行数
  keptLines: number;      // 保留行数
  compressionRatio: number; // 压缩比
  stats: {
    errors: number;
    commands: number;
    files: number;
    stages: number;
    actions: number;
  };
}

/**
 * 判断一行是否是关键行
 */
function isImportantLine(line: string, lineIndex: number, allLines: string[]): { important: boolean; reason?: string } {
  const trimmed = line.trim();
  if (!trimmed) return { important: false };

  const lower = trimmed.toLowerCase();

  // 检查是否是冗余噪声
  for (const pattern of NOISE_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { important: false };
    }
  }

  // 检查是否是命令行
  for (const pattern of COMMAND_PATTERNS) {
    if (pattern.test(trimmed)) {
      return { important: true, reason: 'command' };
    }
  }

  // 检查是否是阶段标题
  if (STAGE_PATTERN.test(trimmed) && trimmed.length < 100) {
    return { important: true, reason: 'stage' };
  }

  // 检查是否包含文件路径且有动作词
  if (FILE_PATH_PATTERN.test(trimmed) && 
      /(create|write|edit|modify|fix|add|update|remove|delete|read|创建|修改|修复|新增|删除|写入|读取)/i.test(lower)) {
    return { important: true, reason: 'file' };
  }

  // 检查是否包含关键关键词
  for (const keyword of CRITICAL_KEYWORDS) {
    if (lower.includes(keyword.toLowerCase())) {
      // 避免误匹配：关键词需要有上下文（行不能太短）
      if (trimmed.length > 3) {
        return { important: true, reason: 'keyword' };
      }
    }
  }

  // 任务目标/说明行（开头的几行通常重要）
  if (lineIndex < 10 && trimmed.length > 10 && !trimmed.startsWith('//') && !trimmed.startsWith('#')) {
    return { important: true, reason: 'header' };
  }

  // 包含文件路径的行（即使没有动作词）
  if (FILE_PATH_PATTERN.test(trimmed) && trimmed.length < 200) {
    return { important: true, reason: 'filepath' };
  }

  return { important: false };
}

/**
 * 智能提取关键信息
 */
export function smartExtract(text: string, options: ExtractOptions = {}): ExtractResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lines = text.split('\n');
  const importantIndices = new Set<number>();
  const stats = { errors: 0, commands: 0, files: 0, stages: 0, actions: 0 };

  // 第一遍：标记所有关键行
  lines.forEach((line, idx) => {
    const result = isImportantLine(line, idx, lines);
    if (result.important) {
      importantIndices.add(idx);
      
      // 统计
      switch (result.reason) {
        case 'command': stats.commands++; break;
        case 'stage': stats.stages++; break;
        case 'file':
        case 'filepath': stats.files++; break;
        case 'keyword':
          if (/(error|failed|exception|错误|失败|异常)/i.test(line)) {
            stats.errors++;
          } else {
            stats.actions++;
          }
          break;
        case 'header': stats.actions++; break;
      }

      // 添加上下文行
      for (let i = 1; i <= opts.contextLines; i++) {
        if (idx - i >= 0) importantIndices.add(idx - i);
        if (idx + i < lines.length) importantIndices.add(idx + i);
      }
    }
  });

  // 第二遍：如果连续多行都是错误堆栈，确保都保留
  let inErrorBlock = false;
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (/(error|exception|traceback|报错|错误)/i.test(trimmed)) {
      inErrorBlock = true;
    }
    if (inErrorBlock && trimmed) {
      importantIndices.add(idx);
      // 遇到空行或新的阶段，退出错误块
      if (trimmed === '' || STAGE_PATTERN.test(trimmed)) {
        inErrorBlock = false;
      }
    }
  });

  // 排序并限制行数
  let sortedIndices = Array.from(importantIndices).sort((a, b) => a - b);
  
  // 如果行数太多，优先保留：错误 > 命令 > 阶段 > 文件 > 动作
  if (sortedIndices.length > opts.maxLines) {
    const priorityScore = (idx: number): number => {
      const line = lines[idx]?.toLowerCase() || '';
      if (/(error|failed|exception|错误|失败)/i.test(line)) return 0;
      if (COMMAND_PATTERNS.some(p => p.test(lines[idx]?.trim() || ''))) return 1;
      if (STAGE_PATTERN.test(lines[idx]?.trim() || '')) return 2;
      if (FILE_PATH_PATTERN.test(lines[idx] || '')) return 3;
      return 4;
    };
    sortedIndices = sortedIndices
      .sort((a, b) => priorityScore(a) - priorityScore(b))
      .slice(0, opts.maxLines)
      .sort((a, b) => a - b);
  }

  // 构建结果，在跳过的地方添加省略标记
  const resultLines: string[] = [];
  let lastIdx = -1;
  let omittedCount = 0;

  for (const idx of sortedIndices) {
    if (lastIdx !== -1 && idx > lastIdx + 1) {
      const gap = idx - lastIdx - 1;
      if (gap > 0) {
        omittedCount += gap;
        resultLines.push(`\n// ... 省略 ${gap} 行冗余内容 ...\n`);
      }
    }
    resultLines.push(lines[idx]);
    lastIdx = idx;
  }

  // 末尾省略
  if (lastIdx < lines.length - 1) {
    const gap = lines.length - 1 - lastIdx;
    if (gap > 0) {
      resultLines.push(`\n// ... 省略 ${gap} 行冗余内容 ...\n`);
    }
  }

  const extracted = resultLines.join('\n').replace(/\n{3,}/g, '\n\n');
  const keptLines = sortedIndices.length;

  return {
    extracted,
    totalLines: lines.length,
    keptLines,
    compressionRatio: lines.length > 0 ? Math.round((keptLines / lines.length) * 100) : 100,
    stats,
  };
}

/**
 * 快速检测文本是否过长（需要智能提取）
 */
export function shouldSmartExtract(text: string, threshold: number = 200): boolean {
  const lineCount = text.split('\n').length;
  return lineCount > threshold;
}
