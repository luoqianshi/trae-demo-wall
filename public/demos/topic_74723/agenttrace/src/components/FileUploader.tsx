import { useState, useCallback } from 'react';

interface FileUploaderProps {
  onFileContent: (content: string, filename: string) => void;
}

export function FileUploader({ onFileContent }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFile = useCallback((file: File) => {
    // 支持的文件类型
    const validExtensions = ['.txt', '.md', '.log', '.json', '.jsonl', '.csv'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    
    if (!validExtensions.includes(ext) && !file.type.startsWith('text/')) {
      alert('请上传文本文件（.txt, .md, .log, .json, .csv）');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileName(file.name);
      onFileContent(content, file.name);
    };
    reader.onerror = () => {
      alert('文件读取失败，请重试');
    };
    reader.readAsText(file, 'UTF-8');
  }, [onFileContent]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  }, [handleFile]);

  return (
    <div className="file-uploader-section">
      <div className="upload-actions">
        <label
          className={`file-drop-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept=".txt,.md,.log,.json,.jsonl,.csv,text/plain,text/markdown"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
          <div className="upload-icon">📁</div>
          <div className="upload-text">
            {fileName ? (
              <>
                <span className="filename">{fileName}</span>
                <span className="upload-hint">点击或拖拽更换文件</span>
              </>
            ) : (
              <>
                <span>拖拽文件到这里，或点击上传</span>
                <span className="upload-hint">支持 .txt / .md / .log / .json 日志文件</span>
              </>
            )}
          </div>
        </label>
      </div>
    </div>
  );
}
