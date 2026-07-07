import { useState, useCallback, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Camera,
  Upload,
  Tags,
  Check,
  X,
  Plus,
  Save,
  RotateCcw,
  Image as ImageIcon,
  FileText,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useQuestionStore } from "@/store/useQuestionStore";
import { mockRecognize, mockRecognizeSample, type MockRecognizeResult } from "@/data/mockData";
import { SUBJECTS, SUBJECT_COLORS, DIFFICULTY_LABELS, type Subject } from "@/types/question";
import SubjectTag from "@/components/SubjectTag";
import { cn } from "@/lib/utils";
import samplePaperUrl from "@/assets/sample-paper.svg?url";

type Stage = "idle" | "processing" | "result" | "error";

interface RecognizedData {
  subject: Subject;
  questionText: string;
  note: string;
  knowledgePoints: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  source: string;
  confidence: number;
}

const PROCESS_STEPS = [
  { label: "图像预处理", desc: "裁剪、校正、增强对比度" },
  { label: "题干 OCR 识别", desc: "提取文字与公式符号" },
  { label: "学科分类", desc: "判断所属学科与题型" },
  { label: "知识点匹配", desc: "关联章节与考点" },
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/** 将 blob URL 转为 base64 Data URL,便于持久化存储 */
function blobUrlToDataURL(blobUrl: string): Promise<string> {
  return fetch(blobUrl)
    .then((res) => res.blob())
    .then(
      (blob) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        })
    );
}

export default function Organize() {
  const [stage, setStage] = useState<Stage>("idle");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [recognized, setRecognized] = useState<RecognizedData | null>(null);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);
  const blobUrlRef = useRef<string | null>(null);

  const addQuestion = useQuestionStore((s) => s.addQuestion);

  const startRecognition = useCallback((url: string, recognizer: () => Promise<MockRecognizeResult>) => {
    // 释放上一个 blob URL
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    // 递增请求 ID,使旧请求失效
    const currentId = ++requestIdRef.current;
    setPreviewUrl(url);
    setStage("processing");
    setSaved(false);
    setErrorMsg("");
    recognizer()
      .then((res) => {
        // 只处理最新请求,丢弃过期结果
        if (currentId !== requestIdRef.current) return;
        setRecognized({
          subject: res.subject,
          questionText: res.questionText,
          note: res.note ?? "",
          knowledgePoints: res.knowledgePoints,
          difficulty: res.difficulty,
          source: res.source ?? "",
          confidence: res.confidence,
        });
        setStage("result");
      })
      .catch((err) => {
        if (currentId !== requestIdRef.current) return;
        console.error("识别失败:", err);
        setErrorMsg("AI 识别失败,请重新上传或稍后重试。");
        setStage("error");
      });
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      // 验证文件类型
      if (!file.type.startsWith("image/")) {
        setErrorMsg("请上传图片格式文件(JPG / PNG / WEBP)。");
        setStage("error");
        return;
      }
      // 验证文件大小
      if (file.size > MAX_FILE_SIZE) {
        setErrorMsg("图片大小不能超过 10MB,请压缩后重试。");
        setStage("error");
        return;
      }
      const url = URL.createObjectURL(file);
      blobUrlRef.current = url;
      startRecognition(url, mockRecognize);
    },
    [startRecognition]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (file && file.type.startsWith("image/")) handleFile(file);
    },
    [handleFile]
  );

  const handleSample = useCallback(() => {
    startRecognition(samplePaperUrl, mockRecognizeSample);
  }, [startRecognition]);

  const handleSave = async () => {
    if (!recognized) return;
    // blob URL 无法持久化,转为 base64 Data URL 再存储
    let finalImageUrl = previewUrl;
    if (previewUrl.startsWith("blob:")) {
      try {
        finalImageUrl = await blobUrlToDataURL(previewUrl);
      } catch {
        finalImageUrl = "";
      }
    }
    addQuestion({
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...recognized,
      imageUrl: finalImageUrl,
      createdAt: new Date().toISOString(),
    });
    setSaved(true);
  };

  const handleReset = () => {
    // 使正在进行的请求失效
    requestIdRef.current++;
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
    setStage("idle");
    setPreviewUrl("");
    setRecognized(null);
    setSaved(false);
    setErrorMsg("");
  };

  // 组件卸载时释放 blob URL
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
        blobUrlRef.current = null;
      }
    };
  }, []);

  return (
    <div className="bg-paper-grain min-h-[calc(100vh-4rem)]">
      <div className="container py-10">
        {/* 页头 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-medium text-ink-400">
            <Link to="/" className="hover:text-ink-700">
              首页
            </Link>
            <span>/</span>
            <span className="text-ink-700">拍照整理</span>
          </div>
          <h1 className="mt-2 font-display text-4xl font-semibold text-ink-800">拍照整理错题</h1>
          <p className="mt-2 text-ink-500">上传试卷照片,AI 自动识别题干并归类知识点。</p>
        </div>

        {/* 主体 */}
        {stage === "idle" && (
          <UploadZone
            onFile={handleFile}
            onSample={handleSample}
            onDrop={handleDrop}
            fileInputRef={fileInputRef}
          />
        )}

        {stage === "processing" && <ProcessingView previewUrl={previewUrl} />}

        {stage === "result" && recognized && (
          <ResultEditor
            data={recognized}
            previewUrl={previewUrl}
            saved={saved}
            onChange={setRecognized}
            onSave={handleSave}
            onReset={handleReset}
          />
        )}

        {stage === "error" && (
          <div className="card-paper mx-auto max-w-md p-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-coral-soft/30">
              <X className="h-7 w-7 text-coral-deep" />
            </div>
            <h3 className="mb-2 font-display text-xl font-semibold text-ink-800">无法继续</h3>
            <p className="mb-6 text-sm text-ink-500">{errorMsg}</p>
            <button onClick={handleReset} className="btn-ink">
              <RotateCcw className="h-4 w-4" />
              重新上传
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============ 上传区 ============ */
function UploadZone({
  onFile,
  onSample,
  onDrop,
  fileInputRef,
}: {
  onFile: (f: File) => void;
  onSample: () => void;
  onDrop: (e: React.DragEvent) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  const [dragging, setDragging] = useState(false);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      {/* 拖拽上传区 */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          setDragging(false);
          onDrop(e);
        }}
        className={cn(
          "card-paper relative flex min-h-[420px] flex-col items-center justify-center overflow-hidden p-10 text-center transition-all",
          dragging && "border-highlight-deep bg-highlight-soft/20 ring-4 ring-highlight/30"
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-ruled opacity-40" />

        <div className="relative">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-ink-700 shadow-lift">
            <Camera className="h-9 w-9 text-highlight" strokeWidth={1.6} />
          </div>
          <h3 className="mb-2 font-display text-2xl font-semibold text-ink-800">
            拍摄或拖入试卷照片
          </h3>
          <p className="mb-6 max-w-sm text-sm text-ink-500">
            支持 JPG / PNG / WEBP 格式,单张最大 10MB。
            <br />
            拍摄时请保持题目清晰、光线充足。
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-ink group"
            >
              <Upload className="h-4 w-4" />
              选择图片上传
            </button>
            <button onClick={onSample} className="btn-ghost">
              <Sparkles className="h-4 w-4 text-highlight-deep" />
              用示例照片演示
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
              e.target.value = "";
            }}
          />
        </div>

        {/* 装饰图标 */}
        <ImageIcon className="pointer-events-none absolute -bottom-4 -right-4 h-32 w-32 text-paper-300/50" />
      </div>

      {/* 侧边提示 */}
      <div className="space-y-4">
        <div className="card-paper p-5">
          <h4 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-ink-800">
            <FileText className="h-4 w-4 text-coral-deep" />
            拍摄小贴士
          </h4>
          <ul className="space-y-2 text-sm text-ink-500">
            {[
              "保持试卷平整,避免褶皱反光",
              "题目居中,四周留出少量边距",
              "光线均匀,文字与背景对比清晰",
              "一次拍摄一道题,识别更精准",
            ].map((t) => (
              <li key={t} className="flex items-start gap-2">
                <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-mint-deep" />
                {t}
              </li>
            ))}
          </ul>
        </div>

        <div className="card-ink p-5">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-highlight" />
            <span className="text-sm font-semibold text-paper-100">AI 识别能力</span>
          </div>
          <p className="text-xs leading-relaxed text-paper-300">
            支持手写体、印刷体、公式符号与图文混排题目的智能识别,
            自动匹配学科知识点并标注难度,识别置信度实时可见。
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============ AI 处理中 ============ */
function ProcessingView({ previewUrl }: { previewUrl: string }) {
  const [activeStep, setActiveStep] = useState(0);

  // 推进步骤
  useEffect(() => {
    const timers = PROCESS_STEPS.map((_, i) =>
      setTimeout(() => setActiveStep(i), i * 500)
    );
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      {/* 左:图片预览 + 扫描动画 */}
      <div className="card-paper relative overflow-hidden p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-ink-400">
            正在识别
          </span>
          <span className="flex items-center gap-1.5 text-xs font-medium text-coral-deep">
            <Loader2 className="h-3 w-3 animate-spin" />
            处理中
          </span>
        </div>

        <div className="bg-ruled relative min-h-[340px] overflow-hidden rounded-lg">
          {previewUrl ? (
            <img src={previewUrl} alt="试卷" className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-[340px] items-center justify-center">
              <ImageIcon className="h-16 w-16 text-paper-300" />
            </div>
          )}

          {/* 扫描线 */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-full overflow-hidden">
            <div className="absolute inset-x-0 h-20 animate-scan bg-gradient-to-b from-transparent via-highlight/50 to-transparent">
              <div className="absolute bottom-0 inset-x-0 h-0.5 bg-highlight-deep shadow-glow" />
            </div>
          </div>
        </div>
      </div>

      {/* 右:识别步骤 */}
      <div className="card-paper p-6">
        <h3 className="mb-5 font-display text-xl font-semibold text-ink-800">AI 识别进度</h3>
        <div className="space-y-4">
          {PROCESS_STEPS.map((step, i) => {
            const done = i < activeStep;
            const active = i === activeStep;
            return (
              <div
                key={step.label}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 transition-all",
                  done && "border-mint-deep/30 bg-mint-soft/15",
                  active && "border-highlight-deep/40 bg-highlight-soft/15",
                  !done && !active && "border-paper-300 bg-paper-50"
                )}
              >
                <div
                  className={cn(
                    "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full transition-all",
                    done && "bg-mint-deep text-paper-100",
                    active && "bg-highlight-deep text-ink-800",
                    !done && !active && "bg-paper-200 text-ink-400"
                  )}
                >
                  {done ? (
                    <Check className="h-4 w-4" />
                  ) : active ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span className="text-xs font-semibold">{i + 1}</span>
                  )}
                </div>
                <div className="flex-1">
                  <div
                    className={cn(
                      "text-sm font-semibold",
                      done && "text-mint-deep",
                      active && "text-ink-800",
                      !done && !active && "text-ink-400"
                    )}
                  >
                    {step.label}
                  </div>
                  <div className="text-xs text-ink-400">{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 rounded-lg bg-ink-700/5 p-3 text-center text-xs text-ink-500">
          预计还需 <span className="font-semibold text-ink-700">2 秒</span>
        </div>
      </div>
    </div>
  );
}

/* ============ 结果编辑 ============ */
function ResultEditor({
  data,
  previewUrl,
  saved,
  onChange,
  onSave,
  onReset,
}: {
  data: RecognizedData;
  previewUrl: string;
  saved: boolean;
  onChange: (d: RecognizedData) => void;
  onSave: () => void;
  onReset: () => void;
}) {
  const [newKp, setNewKp] = useState("");

  const addKp = () => {
    const v = newKp.trim();
    if (v && !data.knowledgePoints.includes(v)) {
      onChange({ ...data, knowledgePoints: [...data.knowledgePoints, v] });
      setNewKp("");
    }
  };
  const removeKp = (kp: string) =>
    onChange({ ...data, knowledgePoints: data.knowledgePoints.filter((k) => k !== kp) });

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      {/* 左:原图预览 */}
      <div className="card-paper overflow-hidden p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-medium uppercase tracking-wider text-ink-400">
            原始照片
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-mint-soft/30 px-2.5 py-0.5 text-xs font-medium text-mint-deep">
            <Check className="h-3 w-3" />
            识别完成
          </span>
        </div>
        <div className="bg-ruled min-h-[300px] overflow-hidden rounded-lg">
          {previewUrl ? (
            <img src={previewUrl} alt="试卷" className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-[300px] items-center justify-center text-ink-300">
              <ImageIcon className="h-12 w-12" />
            </div>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2 rounded-lg bg-highlight-soft/30 px-4 py-3">
          <Sparkles className="h-4 w-4 flex-shrink-0 text-highlight-deep" />
          <div className="flex-1">
            <p className="text-xs text-ink-600">
              {saved ? "已保存到错题集,如需修改请重新上传。" : "AI 已识别完成,请核对下方内容。可手动修正学科、知识点与难度。"}
            </p>
            {/* 置信度展示 */}
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-[10px] font-medium text-ink-400">识别置信度</span>
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-paper-200">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    data.confidence >= 0.95
                      ? "bg-mint-deep"
                      : data.confidence >= 0.9
                        ? "bg-highlight-deep"
                        : "bg-coral"
                  )}
                  style={{ width: `${data.confidence * 100}%` }}
                />
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold",
                  data.confidence >= 0.95
                    ? "text-mint-deep"
                    : data.confidence >= 0.9
                      ? "text-highlight-deep"
                      : "text-coral-deep"
                )}
              >
                {(data.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 右:编辑表单 */}
      <div className="card-paper p-6">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="font-display text-xl font-semibold text-ink-800">核对与编辑</h3>
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs font-medium text-ink-400 transition-colors hover:text-ink-700"
          >
            <RotateCcw className="h-3 w-3" />
            重新上传
          </button>
        </div>

        {/* 学科选择 */}
        <fieldset disabled={saved} className="mb-5">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-400">
            学科
          </label>
          <div className="flex flex-wrap gap-2">
            {SUBJECTS.map((s) => (
              <button
                key={s}
                onClick={() => onChange({ ...data, subject: s })}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                  data.subject === s
                    ? `${SUBJECT_COLORS[s].bg} ${SUBJECT_COLORS[s].text} shadow-ink`
                    : "bg-paper-200/60 text-ink-500 hover:bg-paper-300/60"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </fieldset>

        {/* 题干 */}
        <fieldset disabled={saved} className="mb-5">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-400">
            题干内容
          </label>
          <textarea
            value={data.questionText}
            onChange={(e) => onChange({ ...data, questionText: e.target.value })}
            rows={4}
            className="input-paper resize-none leading-relaxed"
          />
        </fieldset>

        {/* 错因笔记 */}
        <fieldset disabled={saved} className="mb-5">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-400">
            错因笔记(可选)
          </label>
          <textarea
            value={data.note}
            onChange={(e) => onChange({ ...data, note: e.target.value })}
            rows={2}
            placeholder="记录这道题为什么做错..."
            className="input-paper resize-none"
          />
        </fieldset>

        {/* 知识点 */}
        <fieldset disabled={saved} className="mb-5">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-400">
            知识点标签
          </label>
          <div className="mb-2 flex flex-wrap gap-2">
            {data.knowledgePoints.map((kp) => (
              <span
                key={kp}
                className="inline-flex items-center gap-1 rounded-md bg-ink-100 px-2.5 py-1 text-xs font-medium text-ink-700"
              >
                <Tags className="h-3 w-3 text-ink-400" />
                {kp}
                <button
                  onClick={() => removeKp(kp)}
                  className="ml-0.5 text-ink-300 hover:text-coral-deep"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newKp}
              onChange={(e) => setNewKp(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addKp())}
              placeholder="添加知识点后回车"
              className="input-paper flex-1 py-2 text-sm"
            />
            <button onClick={addKp} className="btn-ghost px-4 py-2">
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </fieldset>

        {/* 难度 */}
        <fieldset disabled={saved} className="mb-5">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-400">
            难度等级
          </label>
          <div className="flex gap-2">
            {([1, 2, 3, 4, 5] as const).map((d) => (
              <button
                key={d}
                onClick={() => onChange({ ...data, difficulty: d })}
                className={cn(
                  "flex-1 rounded-lg border py-2 text-xs font-medium transition-all",
                  data.difficulty === d
                    ? "border-coral-deep bg-coral-soft/30 text-coral-deep"
                    : "border-paper-300 bg-paper-50 text-ink-400 hover:border-ink-300"
                )}
              >
                {DIFFICULTY_LABELS[d]}
              </button>
            ))}
          </div>
        </fieldset>

        {/* 来源 */}
        <fieldset disabled={saved} className="mb-6">
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-400">
            来源(可选)
          </label>
          <input
            value={data.source}
            onChange={(e) => onChange({ ...data, source: e.target.value })}
            placeholder="如:期中试卷 · 第 15 题"
            className="input-paper"
          />
        </fieldset>

        {/* 操作按钮 */}
        <div className="flex flex-wrap items-center gap-3 border-t border-paper-200/70 pt-5">
          {saved ? (
            <>
              <span className="flex items-center gap-2 rounded-full bg-mint-soft/30 px-4 py-2.5 text-sm font-semibold text-mint-deep">
                <Check className="h-4 w-4" />
                已保存到错题集
              </span>
              <Link to="/collection" className="btn-ink group">
                前往错题集
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <button onClick={onReset} className="btn-ghost">
                <Camera className="h-4 w-4" />
                继续整理
              </button>
            </>
          ) : (
            <>
              <button onClick={onSave} className="btn-highlight">
                <Save className="h-4 w-4" />
                保存到错题集
              </button>
              <button onClick={onReset} className="btn-ghost">
                重新上传
              </button>
            </>
          )}
        </div>

        {/* 预览标签 */}
        {saved && (
          <div className="mt-4 flex items-center gap-2 text-xs text-ink-400">
            <SubjectTag subject={data.subject} />
            <span>·</span>
            <span>{data.knowledgePoints.length} 个知识点</span>
            <span>·</span>
            <span>难度 {DIFFICULTY_LABELS[data.difficulty]}</span>
          </div>
        )}
      </div>
    </div>
  );
}
