import { useState, useRef, useEffect, useCallback } from 'react';
import { useRecognition } from '../context/RecognitionContext';
import ResultCard from '../components/ResultCard';
import './UploadPage.css';

type TabType = 'image' | 'document';

function UploadPage() {
  const [activeTab, setActiveTab] = useState<TabType>('image');
  const {
    imageTasks,
    addImageTask,
    clearImageTasks,
    docTask,
    startDocTask,
    clearDocTask,
    rerenderDocResult,
    saving,
    saved,
    saveToLibrary,
  } = useRecognition();

  // 图片上传
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 文档上传
  const [docDragOver, setDocDragOver] = useState(false);
  const docInputRef = useRef<HTMLInputElement>(null);

  // 本地错误（文件类型/大小校验）
  const [localError, setLocalError] = useState<string | null>(null);

  // 快捷键复制
  const copyLatestResult = useCallback(async () => {
    const imageResults = imageTasks
      .filter((t) => t.status === 'done' && t.result)
      .map((t) => t.result!);
    const docResults = (docTask?.results || [])
      .map((item) => item.result);

    const latestResults = activeTab === 'image' ? imageResults : docResults;
    if (latestResults.length === 0) return;

    const latest = latestResults[0];
    try {
      await navigator.clipboard.writeText(latest.latex);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = latest.latex;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
  }, [activeTab, imageTasks, docTask]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) return;
        const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;

        const imageResults = imageTasks.filter((t) => t.status === 'done');
        const hasResults = activeTab === 'image'
          ? imageResults.length > 0
          : (docTask?.results?.length ?? 0) > 0;

        if (hasResults) {
          e.preventDefault();
          copyLatestResult();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTab, imageTasks, docTask, copyLatestResult]);

  // 图片处理 - 使用 context 的 addImageTask（不阻塞页面切换）
  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setLocalError('请上传图片文件 (PNG, JPG, WEBP)');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setLocalError('图片大小不能超过 20MB');
      return;
    }
    setLocalError(null);
    addImageTask(file); // 后台执行，切换页面不中断
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(handleFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(handleFile);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 文档处理 - 使用 context 的 startDocTask（不阻塞页面切换）
  const handleDocFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx' && ext !== 'doc') {
      setLocalError('请上传 Word (.docx/.doc) 或 PDF 文件');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setLocalError('文件大小不能超过 50MB');
      return;
    }
    setLocalError(null);
    startDocTask(file); // 后台执行，切换页面不中断
  };

  const handleDocDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDocDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleDocFile(files[0]);
  };

  const handleDocDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDocDragOver(true);
  };

  const handleDocInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) handleDocFile(files[0]);
    if (docInputRef.current) docInputRef.current.value = '';
  };

  const handleSave = async (latex: string) => {
    console.log('保存公式:', latex);
  };

  // 重新识别文档结果
  const handleRerenderDoc = useCallback(async (index: number, imageBase64: string) => {
    await rerenderDocResult(index, imageBase64);
  }, [rerenderDocResult]);

  // 重新识别图片结果
  const handleRerenderImage = useCallback(async (imageBase64: string) => {
    // 图片重新识别：暂不实现（可后续扩展）
    console.log('重新识别图片:', imageBase64.substring(0, 50) + '...');
  }, []);

  // 获取已完成的结果
  const imageResults = imageTasks
    .filter((t) => t.status === 'done' && t.result)
    .map((t) => t.result!);
  const hasProcessingImage = imageTasks.some((t) => t.status === 'processing');
  const imageErrors = imageTasks.filter((t) => t.status === 'error');

  const docResults = docTask?.results || [];
  const isDocProcessing = docTask?.status === 'processing';
  const docError = docTask?.status === 'error' ? docTask.error : null;

  return (
    <div className="upload-page">
      <div className="container">
        <h1 className="page-title">上传识别</h1>

        {/* 选项卡 */}
        <div className="tab-bar">
          <button
            className={`tab-btn ${activeTab === 'image' ? 'active' : ''}`}
            onClick={() => setActiveTab('image')}
          >
            🖼 图片识别
          </button>
          <button
            className={`tab-btn ${activeTab === 'document' ? 'active' : ''}`}
            onClick={() => setActiveTab('document')}
          >
            📄 文档识别
          </button>
        </div>

        {/* 图片识别 */}
        {activeTab === 'image' && (
          <>
            <div
              className={`upload-zone ${dragOver ? 'drag-over' : ''} ${hasProcessingImage ? 'loading' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleInputChange}
                style={{ display: 'none' }}
              />
              <div className="upload-zone-content">
                <div className="upload-icon">📤</div>
                <h3>拖拽图片到此处，或点击选择</h3>
                <p>支持 PNG、JPG、WEBP 格式，单张不超过 20MB</p>
              </div>
            </div>

            {localError && <div className="error-banner">{localError}</div>}
            {imageErrors.length > 0 && (
              <div className="error-banner">
                {imageErrors[imageErrors.length - 1].error}
              </div>
            )}

            {hasProcessingImage && (
              <div className="loading-indicator">
                <div className="spinner" />
                <p>正在识别中，请稍候...（切换页面不会中断）</p>
              </div>
            )}

            {imageTasks.length > 0 && (
              <div className="results-section">
                <div className="results-header">
                  <h2 className="results-title">
                    识别结果 ({imageResults.length}{hasProcessingImage ? '+ 进行中' : ''})
                  </h2>
                  <div className="results-header-actions">
                    <span className="shortcut-hint">Ctrl+C 复制最新结果</span>
                    {imageResults.length > 0 && (
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={clearImageTasks}
                      >
                        清空
                      </button>
                    )}
                  </div>
                </div>
                {imageTasks.filter((t) => t.status === 'done' && t.result).map((task, i) => (
                  <ResultCard
                    key={task.id || i}
                    latex={task.result!.latex}
                    confidence={task.result!.confidence}
                    processingTimeMs={task.result!.processing_time_ms}
                    validation={task.result!.validation}
                    imageBase64={task.imageBase64}
                    onRerender={() => handleRerenderImage(task.imageBase64)}
                    onSave={handleSave}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* 文档识别 */}
        {activeTab === 'document' && (
          <>
            <div
              className={`upload-zone ${docDragOver ? 'drag-over' : ''} ${isDocProcessing ? 'loading' : ''}`}
              onDrop={handleDocDrop}
              onDragOver={handleDocDragOver}
              onDragLeave={() => setDocDragOver(false)}
              onClick={() => docInputRef.current?.click()}
            >
              <input
                ref={docInputRef}
                type="file"
                accept=".pdf,.docx,.doc"
                onChange={handleDocInputChange}
                style={{ display: 'none' }}
              />
              <div className="upload-zone-content">
                <div className="upload-icon">📄</div>
                <h3>拖拽 Word/PDF 文档到此处，或点击选择</h3>
                <p>支持 .docx、.doc、.pdf 格式，文件不超过 50MB</p>
              </div>
            </div>

            {docError && <div className="error-banner">{docError}</div>}

            {isDocProcessing && (
              <div className="loading-indicator">
                <div className="spinner" />
                <p>
                  {docTask?.progress || '正在识别中，请稍候...'}
                  <br />
                  <small>切换页面不会中断识别</small>
                </p>
              </div>
            )}

            {docTask && docTask.results.length > 0 && (
              <div className="results-section">
                <div className="results-header">
                  <h2 className="results-title">
                    {docTask.documentName} — 识别结果 ({docTask.results.length})
                  </h2>
                  <div className="results-header-actions">
                    <span className="shortcut-hint">Ctrl+C 复制最新结果</span>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={clearDocTask}
                    >
                      清空
                    </button>
                  </div>
                </div>

                <div className="doc-actions">
                  <button
                    className="btn btn-primary"
                    onClick={saveToLibrary}
                    disabled={saving || saved}
                  >
                    {saved
                      ? '✓ 已保存到公式库'
                      : saving
                      ? '保存中...'
                      : `保存全部 ${docTask.results.length} 个公式到公式库`}
                  </button>
                </div>

                {docResults.map((item, i) => (
                  <ResultCard
                    key={item.result.task_id || i}
                    latex={item.result.latex}
                    confidence={item.result.confidence}
                    processingTimeMs={item.result.processing_time_ms}
                    validation={item.result.validation}
                    imageBase64={item.imageBase64}
                    onRerender={(imgB64) => handleRerenderDoc(i, imgB64)}
                    onSave={handleSave}
                  />
                ))}
              </div>
            )}

            {docTask && docTask.results.length === 0 && docTask.status === 'done' && (
              <div className="empty-state">
                <p>未在文档中检测到公式。</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default UploadPage;
