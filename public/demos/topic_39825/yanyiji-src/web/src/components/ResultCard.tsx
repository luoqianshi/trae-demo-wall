import { useState } from 'react';
import './ResultCard.css';

interface ResultCardProps {
  latex: string;
  confidence: number;
  processingTimeMs: number;
  validation: {
    is_valid: boolean;
    errors: string[];
    formatted?: string;
  };
  imageBase64?: string;        // 原始图片 base64（用于重新识别）
  onRerender?: (imageBase64: string) => void;  // 重新识别回调
  onSave?: (latex: string) => void;
}

function ResultCard({ latex, confidence, processingTimeMs, validation, imageBase64, onRerender, onSave }: ResultCardProps) {
  const [copied, setCopied] = useState(false);
  const [rerendering, setRerendering] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(latex);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = latex;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRerender = async () => {
    if (!imageBase64 || !onRerender || rerendering) return;
    setRerendering(true);
    try {
      await onRerender(imageBase64);
    } finally {
      setRerendering(false);
    }
  };

  return (
    <div className="result-card">
      <div className="result-header">
        <h3>识别结果</h3>
        <span className="processing-time">{processingTimeMs} ms</span>
      </div>

      <div className="latex-display">
        <pre><code>{latex}</code></pre>
      </div>

      {!validation.is_valid && validation.errors.length > 0 && (
        <div className="validation-errors">
          <strong>验证提示：</strong>
          <ul>
            {validation.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="result-actions">
        <button className="btn btn-primary" onClick={copyToClipboard}>
          {copied ? '已复制' : '复制 LaTeX'}
        </button>
        {imageBase64 && onRerender && (
          <button
            className="btn btn-secondary btn-rerender"
            onClick={handleRerender}
            disabled={rerendering}
          >
            {rerendering ? '识别中...' : '重新识别'}
          </button>
        )}
        {onSave && (
          <button className="btn btn-secondary" onClick={() => onSave(latex)}>
            保存到公式库
          </button>
        )}
      </div>
    </div>
  );
}

export default ResultCard;
