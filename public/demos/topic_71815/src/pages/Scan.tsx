import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, RefreshCw, ArrowRight, Loader2, ImageOff, Edit3 } from 'lucide-react';
import Layout from '@/components/Layout';
import InkButton from '@/components/InkButton';
import { runOcr, type OcrProgress } from '@/lib/ocr';
import { SAMPLE_SCAN_TEXT } from '@/lib/sampleData';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

type Mode = 'idle' | 'camera' | 'preview' | 'recognizing' | 'result';

export default function Scan() {
  const nav = useNavigate();
  const setPendingScanText = useAppStore((s) => s.setPendingScanText);

  const [mode, setMode] = useState<Mode>('idle');
  const [imageData, setImageData] = useState<string | null>(null);
  const [text, setText] = useState('');
  const [progress, setProgress] = useState<OcrProgress>({ status: '', progress: 0 });
  const [camError, setCamError] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => stopCamera();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    setCamError(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      setMode('camera');
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
    } catch {
      setCamError(true);
      setMode('idle');
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video || !canvasRef.current) return;
    const w = video.videoWidth || 1024;
    const h = video.videoHeight || 768;
    canvasRef.current.width = w;
    canvasRef.current.height = h;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, w, h);
    const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.92);
    setImageData(dataUrl);
    stopCamera();
    setMode('preview');
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImageData(reader.result as string);
      setMode('preview');
    };
    reader.readAsDataURL(file);
  };

  const recognize = async () => {
    if (!imageData) return;
    setMode('recognizing');
    setProgress({ status: '初始化引擎', progress: 0 });
    try {
      const result = await runOcr(imageData, (p) => setProgress(p));
      setText(result || '');
    } catch {
      setText('');
    }
    setMode('result');
  };

  const loadSample = () => {
    setText(SAMPLE_SCAN_TEXT);
    setImageData(null);
    setMode('result');
  };

  const handleConfirm = () => {
    setPendingScanText(text);
    nav('/tasks');
  };

  const reset = () => {
    setImageData(null);
    setText('');
    setMode('idle');
    setProgress({ status: '', progress: 0 });
  };

  const progressPct = Math.round(progress.progress * 100);

  return (
    <Layout title="扫描识别" subtitle="SCAN">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左：取景 / 上传 / 预览 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg text-ink">取景台</h2>
            <span className="font-en text-[10px] text-ink-mute tracking-widest">VIEWFINDER</span>
          </div>

          <div className="relative bg-ink-soft/8 border border-ink/10 rounded-sm aspect-[4/3] overflow-hidden flex items-center justify-center">
            {/* 四角书签 */}
            <CornerMarks />

            {mode === 'idle' && (
              <div className="text-center px-6">
                <ImageOff size={32} className="mx-auto text-ink-mute/40 mb-3" strokeWidth={1.2} />
                <p className="text-sm text-ink-mute mb-5">对准课本或试卷，或上传图片开始识别</p>
                <div className="flex gap-2 justify-center flex-wrap">
                  <InkButton variant="primary" size="sm" onClick={startCamera}>
                    <Camera size={14} /> 启用摄像头
                  </InkButton>
                  <InkButton variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                    <Upload size={14} /> 上传图片
                  </InkButton>
                  <InkButton variant="ghost" size="sm" onClick={loadSample}>
                    载入样本文本
                  </InkButton>
                </div>
                {camError && (
                  <p className="text-[11px] text-cinnabar mt-3">
                    摄像头不可用，可改用上传图片或样本文本体验
                  </p>
                )}
              </div>
            )}

            {mode === 'camera' && (
              <>
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
                  <InkButton variant="dark" size="sm" onClick={capture}>
                    <Camera size={14} /> 拍照
                  </InkButton>
                  <InkButton variant="ghost" size="sm" onClick={() => { stopCamera(); setMode('idle'); }}>
                    取消
                  </InkButton>
                </div>
              </>
            )}

            {(mode === 'preview' || mode === 'recognizing' || mode === 'result') && imageData && (
              <>
                <img src={imageData} alt="扫描图" className="absolute inset-0 w-full h-full object-contain" />
                {mode === 'recognizing' && (
                  <div className="absolute inset-0 bg-ink/60 flex flex-col items-center justify-center text-paper">
                    <Loader2 size={28} className="animate-spin mb-3" />
                    <div className="text-sm mb-1">{progress.status || '识别中'}</div>
                    <div className="font-mono text-xs text-paper/70 tabular">{progressPct}%</div>
                    <div className="mt-3 w-48 h-1 bg-paper/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-cinnabar transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>
                )}
                {(mode === 'preview' || mode === 'result') && (
                  <button
                    onClick={reset}
                    className="absolute top-2 right-2 w-8 h-8 bg-paper/90 rounded-sm flex items-center justify-center text-ink-mute hover:text-cinnabar"
                    title="重新拍摄"
                  >
                    <RefreshCw size={14} />
                  </button>
                )}
              </>
            )}
          </div>

          <canvas ref={canvasRef} className="hidden" />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg"
            className="hidden"
            onChange={onFileChange}
          />

          {mode === 'preview' && (
            <div className="mt-4 flex gap-2">
              <InkButton variant="primary" size="md" onClick={recognize}>
                <Edit3 size={14} /> 开始识别
              </InkButton>
              <InkButton variant="outline" size="md" onClick={reset}>
                重新选择
              </InkButton>
            </div>
          )}
          {mode === 'recognizing' && (
            <p className="mt-3 text-xs text-ink-mute">首次识别需下载中英语料（约 5-10MB），之后可离线使用</p>
          )}
        </section>

        {/* 右：识别结果 / 校对框 */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg text-ink">校对稿</h2>
            <span className="font-en text-[10px] text-ink-mute tracking-widest">PROOFREAD</span>
          </div>
          <div className={cn('relative rounded-sm border border-ink/10 min-h-[320px]')}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={mode === 'result' ? '识别结果为空，可在此手动输入或粘贴文本' : '识别后将在此显示，可手动修正…'}
              className={cn(
                'w-full h-80 p-5 bg-transparent font-serif text-base leading-loose text-ink resize-none rounded-sm',
                'gaozhi-bg focus:outline-none'
              )}
              style={{ lineHeight: '36px' }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-ink-mute">
            <span>共 {text.replace(/\s/g, '').length} 字</span>
            {mode === 'result' && (
              <span className="flex items-center gap-1 text-celadon">
                <span className="w-1.5 h-1.5 rounded-full bg-celadon" /> 已识别，请校对后生成任务
              </span>
            )}
          </div>
          <div className="mt-4 flex gap-2">
            <InkButton
              variant="primary"
              size="md"
              onClick={handleConfirm}
              disabled={!text.trim()}
            >
              确认生成任务 <ArrowRight size={14} />
            </InkButton>
            <InkButton variant="outline" size="md" onClick={loadSample}>
              载入样本
            </InkButton>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function CornerMarks() {
  const base = 'absolute w-5 h-5 border-cinnabar/60';
  return (
    <>
      <span className={`${base} top-3 left-3 border-l-2 border-t-2`} />
      <span className={`${base} top-3 right-3 border-r-2 border-t-2`} />
      <span className={`${base} bottom-3 left-3 border-l-2 border-b-2`} />
      <span className={`${base} bottom-3 right-3 border-r-2 border-b-2`} />
    </>
  );
}
