import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  UploadCloud,
  Image as ImageIcon,
  ScanLine,
  X,
  Sparkles,
  CheckCircle2,
  Loader2,
  Trash2,
  Save,
  Pencil,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Tag } from "@/components/ui/Tag";
import { SubjectBadge } from "@/components/ui/SubjectBadge";
import { DifficultyBadge } from "@/components/ui/DifficultyBadge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useQuestionStore } from "@/store/useQuestionStore";
import { mockRecognize } from "@/lib/mockRecognize";
import { SUBJECTS } from "@/data/subjects";
import {
  QUESTION_TYPE_META,
  DIFFICULTY_META,
  type Question,
  type Subject,
  type QuestionType,
  type Difficulty,
} from "@/types";
import { cn } from "@/lib/utils";

type Phase = "idle" | "uploading" | "recognizing" | "done";

interface UploadFile {
  id: string;
  file: File;
  preview: string;
}

interface EditState {
  subject: Subject;
  knowledgePoint: string;
  chapter: string;
  questionType: QuestionType;
  difficulty: Difficulty;
  content: string;
  answer: string;
  analysis: string;
  errorReason: string;
}

const SAMPLE_IMAGES = [
  { label: "数学试卷", emoji: "📐" },
  { label: "物理作业", emoji: "⚛️" },
  { label: "英语默写", emoji: "📝" },
  { label: "化学方程式", emoji: "🧪" },
];

export default function Upload() {
  const navigate = useNavigate();
  const addQuestions = useQuestionStore((s) => s.addQuestions);
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [phase, setPhase] = useState<Phase>("idle");
  const [progress, setProgress] = useState(0);
  const [recognized, setRecognized] = useState<Question[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const handleFiles = useCallback((list: FileList | null) => {
    if (!list) return;
    const items: UploadFile[] = [];
    Array.from(list).forEach((file) => {
      if (!file.type.startsWith("image/")) return;
      items.push({
        id: `${file.name}_${file.size}_${Math.random().toString(36).slice(2, 6)}`,
        file,
        preview: URL.createObjectURL(file),
      });
    });
    setFiles((prev) => [...prev, ...items]);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.preview);
      return prev.filter((f) => f.id !== id);
    });
  };

  const startRecognize = async () => {
    if (files.length === 0) return;
    setPhase("uploading");
    setProgress(0);
    // 模拟上传进度
    const upTimer = setInterval(() => {
      setProgress((p) => {
        const next = p + 8 + Math.random() * 12;
        return next >= 100 ? 100 : next;
      });
    }, 120);

    setTimeout(() => {
      clearInterval(upTimer);
      setProgress(100);
      setPhase("recognizing");
      mockRecognize(files.map((f) => f.file)).then((qs) => {
        setRecognized(qs);
        setPhase("done");
      });
    }, 1300);
  };

  const startSample = () => {
    // 模拟使用样图：直接进入识别流程
    const sampleFiles: UploadFile[] = SAMPLE_IMAGES.map((s, i) => ({
      id: `sample_${i}_${Math.random().toString(36).slice(2, 6)}`,
      file: new File([], `${s.label}.png`, { type: "image/png" }),
      preview: "",
    }));
    setFiles(sampleFiles);
    setTimeout(() => {
      setPhase("uploading");
      setProgress(0);
      const upTimer = setInterval(() => {
        setProgress((p) => {
          const next = p + 8 + Math.random() * 12;
          return next >= 100 ? 100 : next;
        });
      }, 120);
      setTimeout(() => {
        clearInterval(upTimer);
        setProgress(100);
        setPhase("recognizing");
        mockRecognize(sampleFiles.map((f) => f.file)).then((qs) => {
          setRecognized(qs);
          setPhase("done");
        });
      }, 1300);
    }, 100);
  };

  const saveAll = () => {
    if (recognized.length === 0) return;
    addQuestions(recognized);
    showToast(`已成功归档 ${recognized.length} 道题`);
    // 重置
    files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
    setFiles([]);
    setRecognized([]);
    setPhase("idle");
    setProgress(0);
    setTimeout(() => navigate("/library"), 800);
  };

  const removeRecognized = (id: string) => {
    setRecognized((prev) => prev.filter((q) => q.id !== id));
  };

  const openEdit = (q: Question) => {
    setEditingId(q.id);
    setEditState({
      subject: q.subject,
      knowledgePoint: q.knowledgePoint,
      chapter: q.chapter,
      questionType: q.questionType,
      difficulty: q.difficulty,
      content: q.content,
      answer: q.answer,
      analysis: q.analysis ?? "",
      errorReason: q.errorReason ?? "",
    });
  };

  const saveEdit = () => {
    if (!editingId || !editState) return;
    setRecognized((prev) =>
      prev.map((q) => (q.id === editingId ? { ...q, ...editState } : q)),
    );
    setEditingId(null);
    setEditState(null);
    showToast("已更新");
  };

  const reset = () => {
    files.forEach((f) => f.preview && URL.revokeObjectURL(f.preview));
    setFiles([]);
    setRecognized([]);
    setPhase("idle");
    setProgress(0);
  };

  return (
    <div className="space-y-5">
      {/* 顶部提示条 */}
      {phase === "done" && recognized.length > 0 && (
        <Card className="p-4 flex items-center justify-between bg-gradient-to-r from-mint-50/80 to-brand-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-mint-400 text-white grid place-items-center">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div className="font-bold text-ink-900 text-sm">AI 识别完成</div>
              <div className="text-xs text-ink-500">
                共识别出 <b className="text-mint-600">{recognized.length}</b> 道题，
                请确认后归档入库
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={reset}>重新上传</Button>
            <Button variant="primary" size="sm" onClick={saveAll}>
              <Save size={14} /> 全部归档
            </Button>
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-5">
        {/* 主区：上传区 / 识别进度 / 结果列表 */}
        <div className="space-y-5">
          {/* 上传区 */}
          {phase !== "done" && (
            <Card
              className={cn(
                "relative overflow-hidden border-2 border-dashed transition-all",
                dragOver ? "border-brand-400 bg-brand-50/40" : "border-ink-200",
              )}
            >
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                className="px-8 py-12 text-center"
              >
                {phase === "idle" && (
                  <>
                    <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-brand-500 to-mint-400 grid place-items-center text-white shadow-glow-brand mb-5 animate-float">
                      <UploadCloud size={36} />
                    </div>
                    <h3 className="title-display text-2xl font-bold text-ink-900 mb-2">
                      拖拽作业照片到此处，或点击上传
                    </h3>
                    <p className="text-sm text-ink-500 max-w-md mx-auto mb-5">
                      支持 JPG / PNG / WebP 格式，可一次上传多张试卷照片，
                      AI 将自动识别每道题并归档。
                    </p>
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                      <Button size="lg" onClick={() => inputRef.current?.click()}>
                        <ImageIcon size={16} /> 选择图片
                      </Button>
                      <Button variant="mint" size="lg" onClick={startSample}>
                        <ScanLine size={16} /> 试用样图体验
                      </Button>
                    </div>
                    <input
                      ref={inputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => handleFiles(e.target.files)}
                    />

                    {/* 样图提示 */}
                    <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
                      {SAMPLE_IMAGES.map((s) => (
                        <Tag key={s.label} tone="ink" size="sm">
                          {s.emoji} {s.label}
                        </Tag>
                      ))}
                    </div>
                  </>
                )}

                {(phase === "uploading" || phase === "recognizing") && (
                  <div className="py-6">
                    <div className="relative mx-auto w-24 h-24 mb-5">
                      <div className="absolute inset-0 rounded-full border-4 border-brand-100" />
                      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-brand-500 animate-spin" />
                      {phase === "recognizing" && (
                        <div className="absolute inset-2 rounded-full bg-brand-50 grid place-items-center">
                          <Sparkles size={26} className="text-brand-500 animate-pulse" />
                        </div>
                      )}
                      {phase === "uploading" && (
                        <div className="absolute inset-2 rounded-full bg-brand-50 grid place-items-center">
                          <span className="num-display text-lg font-bold text-brand-600">
                            {Math.round(progress)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="title-display text-xl font-bold text-ink-900 mb-1">
                      {phase === "uploading" ? "正在上传图片…" : "AI 正在识别题目…"}
                    </h3>
                    <p className="text-sm text-ink-500">
                      {phase === "uploading"
                        ? "上传中，请稍候"
                        : "正在识别题目内容、学科、知识点与题型"}
                    </p>
                    {/* 状态指示 */}
                    <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 border border-ink-100">
                      <StepDot active={phase === "uploading"} done={phase !== "uploading"} label="上传" />
                      <span className="w-6 h-px bg-ink-200" />
                      <StepDot active={phase === "recognizing"} done={false} label="AI 识别" />
                      <span className="w-6 h-px bg-ink-200" />
                      <StepDot active={false} done={false} label="完成" />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* 已选文件预览 */}
          {files.length > 0 && phase === "idle" && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="title-display text-base font-bold text-ink-900">
                  已选图片 ({files.length})
                </h3>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={reset}>清空</Button>
                  <Button variant="primary" size="sm" onClick={startRecognize}>
                    <Sparkles size={14} /> 开始 AI 识别
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {files.map((f) => (
                  <div
                    key={f.id}
                    className="relative aspect-[3/4] rounded-2xl overflow-hidden glass-strong group"
                  >
                    {f.preview ? (
                      <img
                        src={f.preview}
                        alt={f.file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full grid place-items-center bg-gradient-to-br from-brand-50 to-mint-50 text-4xl">
                        📝
                      </div>
                    )}
                    <button
                      onClick={() => removeFile(f.id)}
                      className="absolute top-2 right-2 w-7 h-7 grid place-items-center rounded-full bg-ink-900/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-500"
                    >
                      <X size={14} />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gradient-to-t from-ink-900/70 to-transparent">
                      <span className="text-[10px] text-white truncate block">
                        {f.file.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* 识别结果 */}
          {phase === "done" && (
            <div className="space-y-3">
              {recognized.length === 0 ? (
                <Card>
                  <EmptyState
                    icon={<ScanLine size={28} />}
                    title="未识别到题目"
                    description="请尝试上传更清晰的图片，或使用样图体验"
                    action={<Button onClick={reset}>重新上传</Button>}
                  />
                </Card>
              ) : (
                recognized.map((q, idx) => {
                  const typeMeta = QUESTION_TYPE_META[q.questionType];
                  return (
                    <Card key={q.id} className="p-5 relative">
                      <div className="flex items-start gap-3">
                        <span className="num-display w-8 h-8 rounded-xl bg-brand-50 text-brand-600 grid place-items-center font-bold text-sm shrink-0">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <SubjectBadge subject={q.subject} size="sm" />
                            <Tag tone="brand" size="xs">{q.knowledgePoint}</Tag>
                            <Tag tone="ink" size="xs">{typeMeta.name}</Tag>
                            <DifficultyBadge level={q.difficulty} />
                            {q.errorReason && (
                              <Tag tone="rose" size="xs">错因：{q.errorReason}</Tag>
                            )}
                          </div>
                          <p className="text-sm text-ink-800 leading-relaxed mb-2 whitespace-pre-wrap">
                            {q.content}
                          </p>
                          {q.options && (
                            <div className="space-y-1 mb-2">
                              {q.options.map((opt, i) => (
                                <div key={i} className="text-xs text-ink-600 pl-3">{opt}</div>
                              ))}
                            </div>
                          )}
                          <div className="mt-3 pt-3 border-t border-ink-100/60">
                            <div className="text-[11px] text-ink-400 mb-0.5">参考答案</div>
                            <div className="text-sm text-mint-700 font-medium">{q.answer}</div>
                            {q.analysis && (
                              <div className="mt-2 text-xs text-ink-500 leading-relaxed">
                                <span className="font-bold text-ink-600">解析：</span>{q.analysis}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            onClick={() => openEdit(q)}
                            className="w-8 h-8 grid place-items-center rounded-full text-ink-400 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => removeRecognized(q.id)}
                            className="w-8 h-8 grid place-items-center rounded-full text-ink-400 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* 右侧：使用提示 */}
        <aside className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={16} className="text-brand-500" />
              <h3 className="title-display text-base font-bold text-ink-900">AI 识别能力</h3>
            </div>
            <ul className="space-y-2 text-sm text-ink-600">
              {[
                "自动识别学科与题型",
                "提取知识点与章节",
                "判断难度等级 1-5",
                "智能推断错因标签",
                "支持选择题/填空/简答等多种题型",
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-mint-500 mt-0.5 shrink-0" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-amber-50/60 to-white">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-7 h-7 rounded-xl bg-amber-300 text-white grid place-items-center text-sm">💡</span>
              <h3 className="title-display text-base font-bold text-ink-900">拍摄建议</h3>
            </div>
            <ul className="space-y-2 text-xs text-ink-600 leading-relaxed">
              <li>• 光线充足，避免阴影</li>
              <li>• 镜头正对题面，避免倾斜</li>
              <li>• 单张图含 1-5 道题效果最佳</li>
              <li>• 文字清晰，避免反光</li>
            </ul>
          </Card>
        </aside>
      </div>

      {/* 编辑弹窗 */}
      <Modal
        open={!!editingId}
        onClose={() => {
          setEditingId(null);
          setEditState(null);
        }}
        title="编辑题目"
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={() => {
              setEditingId(null);
              setEditState(null);
            }}>取消</Button>
            <Button onClick={saveEdit}><Save size={14} /> 保存</Button>
          </>
        }
      >
        {editState && (
          <div className="space-y-4">
            <Field label="学科">
              <select
                className="input"
                value={editState.subject}
                onChange={(e) => setEditState({ ...editState, subject: e.target.value as Subject })}
              >
                {SUBJECTS.map((s) => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="知识点">
                <input
                  className="input"
                  value={editState.knowledgePoint}
                  onChange={(e) => setEditState({ ...editState, knowledgePoint: e.target.value })}
                />
              </Field>
              <Field label="章节">
                <input
                  className="input"
                  value={editState.chapter}
                  onChange={(e) => setEditState({ ...editState, chapter: e.target.value })}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="题型">
                <select
                  className="input"
                  value={editState.questionType}
                  onChange={(e) => setEditState({ ...editState, questionType: e.target.value as QuestionType })}
                >
                  {Object.values(QUESTION_TYPE_META).map((t) => (
                    <option key={t.code} value={t.code}>{t.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="难度">
                <select
                  className="input"
                  value={editState.difficulty}
                  onChange={(e) => setEditState({ ...editState, difficulty: Number(e.target.value) as Difficulty })}
                >
                  {Object.entries(DIFFICULTY_META).map(([k, v]) => (
                    <option key={k} value={k}>{v.name}</option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="题干">
              <textarea
                className="input min-h-[80px] resize-y"
                value={editState.content}
                onChange={(e) => setEditState({ ...editState, content: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="参考答案">
                <input
                  className="input"
                  value={editState.answer}
                  onChange={(e) => setEditState({ ...editState, answer: e.target.value })}
                />
              </Field>
              <Field label="错因">
                <input
                  className="input"
                  value={editState.errorReason}
                  onChange={(e) => setEditState({ ...editState, errorReason: e.target.value })}
                />
              </Field>
            </div>
            <Field label="解析">
              <textarea
                className="input min-h-[60px] resize-y"
                value={editState.analysis}
                onChange={(e) => setEditState({ ...editState, analysis: e.target.value })}
              />
            </Field>
          </div>
        )}
      </Modal>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-full bg-ink-900 text-white text-sm shadow-glow animate-[fadeUp_0.3s_ease-out]">
          <span className="inline-flex items-center gap-2">
            <CheckCircle2 size={14} className="text-mint-400" />
            {toast}
          </span>
        </div>
      )}

      <style>{`
        .input {
          width: 100%;
          padding: 10px 14px;
          border-radius: 14px;
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(22,32,51,0.1);
          font-size: 14px;
          color: #162033;
          outline: none;
          transition: all 0.2s;
        }
        .input:focus {
          border-color: #3c63ff;
          background: #fff;
          box-shadow: 0 0 0 3px rgba(60,99,255,0.15);
        }
      `}</style>
    </div>
  );
}

function StepDot({
  active,
  done,
  label,
}: {
  active: boolean;
  done: boolean;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn(
          "w-5 h-5 rounded-full grid place-items-center text-[10px] font-bold transition-all",
          done
            ? "bg-mint-500 text-white"
            : active
            ? "bg-brand-500 text-white animate-pulse"
            : "bg-ink-200 text-ink-400",
        )}
      >
        {done ? <CheckCircle2 size={11} /> : label[0]}
      </span>
      <span className={cn("text-xs font-medium", active || done ? "text-ink-800" : "text-ink-400")}>
        {label}
      </span>
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-ink-600 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
