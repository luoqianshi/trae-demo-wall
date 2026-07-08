import { useState, useMemo, useCallback } from 'react';
import { FileUploader } from './FileUploader';
import { smartExtract, shouldSmartExtract, type ExtractResult } from '../utils/smartExtract';
import { autoRecorderPrompt, simpleRecorderPrompt } from '../data/autoRecorderPrompt';

interface TranscriptInputProps {
  value: string;
  onChange: (value: string) => void;
  onLoadSample: () => void;
}

type PromptMode = 'auto' | 'simple';

export function TranscriptInput({ value, onChange, onLoadSample }: TranscriptInputProps) {
  const [extractResult, setExtractResult] = useState<ExtractResult | null>(null);
  const [showExtracted, setShowExtracted] = useState(false);
  const [originalText, setOriginalText] = useState('');
  const [copied, setCopied] = useState<'auto' | 'simple' | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const lineCount = useMemo(() => value.split('\n').length, [value]);
  const needsExtract = useMemo(() => shouldSmartExtract(value, 150) && !showExtracted, [value, showExtracted]);

  const handleFileContent = useCallback((content: string, filename: string) => {
    setOriginalText('');
    onChange(content);
    setExtractResult(null);
    setShowExtracted(false);
  }, [onChange]);

  const handleSmartExtract = useCallback(() => {
    setOriginalText(value);
    const result = smartExtract(value);
    setExtractResult(result);
    onChange(result.extracted);
    setShowExtracted(true);
  }, [value, onChange]);

  const handleUndoExtract = useCallback(() => {
    if (originalText) {
      onChange(originalText);
    }
    setExtractResult(null);
    setShowExtracted(false);
    setOriginalText('');
  }, [originalText, onChange]);

  const handleTextChange = useCallback((newValue: string) => {
    onChange(newValue);
    if (showExtracted) {
      setShowExtracted(false);
      setExtractResult(null);
      setOriginalText('');
    }
  }, [showExtracted, onChange]);

  const handleCopyPrompt = useCallback(async (mode: PromptMode) => {
    const prompt = mode === 'auto' ? autoRecorderPrompt : simpleRecorderPrompt;
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(mode);
      setTimeout(() => setCopied(null), 2000);
    } catch (e) {
      const textarea = document.createElement('textarea');
      textarea.value = prompt;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(mode);
      setTimeout(() => setCopied(null), 2000);
    }
  }, []);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">📝 AI 工作记录</h3>
        <div className="card-header-actions">
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowHelp(!showHelp)}
          >
            ❓ 如何获取日志？
          </button>
          <button className="btn btn-secondary btn-sm" onClick={onLoadSample}>
            📋 载入示例
          </button>
        </div>
      </div>

      {/* 帮助面板 */}
      {showHelp && (
        <div className="help-panel">
          <h4>💡 如何从 Codex / Claude Code 获取日志？</h4>
          <div className="help-methods">
            <div className="help-method recommended">
              <span className="method-badge">⭐ 最推荐</span>
              <p><strong>AI自动写文件（零复制）：</strong>点击下方"🚀 复制自动记录Skill"发给AI，它会边工作边把过程追加写入 <code>agenttrace.log</code> 文件，工作结束直接拖拽这个文件上传即可，完全不用手动复制！</p>
            </div>
            <div className="help-method">
              <span className="method-badge">简单</span>
              <p><strong>终端输出模式：</strong>点击"📋 复制简单提示词"发给AI，它会按结构化格式输出到终端，结束后复制输出内容粘贴即可。</p>
            </div>
            <div className="help-method">
              <span className="method-badge">兜底</span>
              <p><strong>智能提取过滤：</strong>不管日志多长，直接粘贴全部内容（或拖拽上传终端录制文件），系统会自动过滤npm输出、spinner、进度条等冗余，只保留关键行。</p>
            </div>
            <div className="help-method">
              <span className="method-badge">极客</span>
              <p><strong>启动脚本：</strong>项目 <code>scripts/</code> 目录提供了 <code>start-with-recording.sh</code>(Mac/Linux) 和 <code>start-with-recording.ps1</code>(Windows)，一键启动AI工具+自动复制提示词+双份日志备份。</p>
            </div>
          </div>
        </div>
      )}

      {/* 快速提示词选择栏 */}
      <div className="prompt-selector">
        <div className="prompt-option recommended">
          <div className="option-header">
            <span className="option-badge">⭐ 推荐</span>
            <span className="option-title">自动写文件模式</span>
            <span className="option-desc">AI边工作边写入 agenttrace.log，结束直接上传文件，零复制</span>
          </div>
          <button
            className={`btn btn-sm ${copied === 'auto' ? 'btn-success' : 'btn-primary'}`}
            onClick={() => handleCopyPrompt('auto')}
          >
            {copied === 'auto' ? '✅ 已复制' : '🚀 复制Skill提示词'}
          </button>
        </div>
        <div className="prompt-option">
          <div className="option-header">
            <span className="option-badge simple">简单</span>
            <span className="option-title">终端输出模式</span>
            <span className="option-desc">AI按格式输出到终端，结束后复制粘贴</span>
          </div>
          <button
            className={`btn btn-sm ${copied === 'simple' ? 'btn-success' : 'btn-secondary'}`}
            onClick={() => handleCopyPrompt('simple')}
          >
            {copied === 'simple' ? '✅ 已复制' : '📋 复制提示词'}
          </button>
        </div>
      </div>

      {/* 文件上传区域 */}
      <FileUploader onFileContent={handleFileContent} />

      {/* 长文本提示与智能提取 */}
      {needsExtract && (
        <div className="extract-tip">
          <span>💡 检测到 {lineCount} 行内容，建议先提取关键信息</span>
          <button className="btn btn-primary btn-sm" onClick={handleSmartExtract}>
            ⚡ 智能提取关键行
          </button>
        </div>
      )}

      {/* 提取结果统计 */}
      {extractResult && showExtracted && (
        <div className="extract-stats">
          <div className="stats-row">
            <span className="stats-item">
              <strong>{extractResult.totalLines}</strong> 行 → <strong>{extractResult.keptLines}</strong> 行
              <span className="stats-badge">压缩至 {extractResult.compressionRatio}%</span>
            </span>
            <span className="stats-detail">
              发现 {extractResult.stats.errors} 错误 · {extractResult.stats.commands} 命令 · {extractResult.stats.files} 文件
            </span>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={handleUndoExtract}>
            ↩️ 恢复原始文本
          </button>
        </div>
      )}

      <textarea
        className="transcript-textarea"
        value={value}
        onChange={e => handleTextChange(e.target.value)}
        placeholder={`在此粘贴或拖拽上传 AI Agent 的工作记录：

推荐方式：点上方"🚀 复制Skill提示词"发给 Codex/Claude Code，
它会自动边工作边写 agenttrace.log 文件，任务结束直接上传那个.log文件！

也可以：
- 拖拽上传终端录制的 .log / .txt 文件
- 手动粘贴AI输出内容（超长会自动提示智能提取）

系统会自动识别：
- 错误关键词、文件路径、命令行、操作动作
- 自动过滤 npm install 输出、spinner、进度条等冗余内容`}
        rows={14}
      />

      <div className="textarea-footer">
        <span className="line-count">{lineCount} 行</span>
      </div>
    </div>
  );
}
