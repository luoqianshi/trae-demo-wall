import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Upload,
  FileImage,
  FileText,
  FileType,
  Camera,
  Loader2,
  CheckCircle2,
  Trash2,
  History,
  ScanSearch,
  ArrowRight,
  Lightbulb,
  X,
} from "lucide-react";
import BlueprintThumbnail from "@/components/BlueprintThumbnail";
import { useStore } from "@/store/useStore";
import { formatDate } from "@/lib/storage";
import type { RecognitionRecord, FileType as FileKind } from "@/types";

const ACCEPT = ".jpg,.jpeg,.png,.pdf,.doc,.docx";
const MAX_SIZE = 10 * 1024 * 1024;

const FILE_ICONS: Record<FileKind, typeof FileImage> = {
  image: FileImage,
  pdf: FileText,
  doc: FileType,
};

export default function Recognition() {
  const user = useStore((s) => s.user);
  const recognitions = useStore((s) => s.recognitions);
  const loadRecognitions = useStore((s) => s.loadRecognitions);
  const recognize = useStore((s) => s.recognize);

  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState<RecognitionRecord | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    loadRecognitions();
  }, [loadRecognitions]);

  useEffect(() => {
    if (recognitions.length > 0 && !selected) {
      setSelected(recognitions[0]);
    }
  }, [recognitions, selected]);

  const handleFile = useCallback(
    async (file: File) => {
      setError("");
      if (file.size > MAX_SIZE) {
        setError("文件大小不能超过 10MB");
        return;
      }
      const ext = file.name.toLowerCase();
      if (!ext.match(/\.(jpg|jpeg|png|pdf|doc|docx)$/)) {
        setError("仅支持 JPG/PNG/PDF/DOC 格式");
        return;
      }
      setUploading(true);
      try {
        const record = await recognize(file);
        if (record) setSelected(record);
      } finally {
        setUploading(false);
      }
    },
    [recognize]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  return (
    <div className="min-h-full bg-white px-4 lg:px-8 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <ScanSearch className="w-7 h-7 text-apple-500" />
            作业识别中心
          </h1>
          <p className="mt-2 text-gray-500">
            上传图片、PDF 或 DOC 作业文件，AI 智能识别机械图样要素
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <div className="space-y-6">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              className={`relative border-2 border-dashed rounded-3xl p-10 lg:p-14 transition-all duration-300 ${
                dragging
                  ? "border-apple-400 bg-apple-50/50 scale-[1.01]"
                  : "border-gray-200 bg-gray-50 hover:border-gray-300"
              }`}
            >
              <input
                type="file"
                accept={ACCEPT}
                onChange={onFileChange}
                id="file-input"
                className="hidden"
              />

              <div className="flex flex-col items-center text-center">
                {uploading ? (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-apple-50 border border-apple-100 flex items-center justify-center mb-5">
                      <Loader2 className="w-8 h-8 text-apple-500 animate-spin" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">AI 识别中...</h3>
                    <p className="text-sm text-gray-500">正在分析图像要素，请稍候</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 rounded-2xl bg-white border border-gray-200 shadow-soft flex items-center justify-center mb-5">
                      <Upload className="w-8 h-8 text-apple-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      拖拽文件到此处，或
                      <label
                        htmlFor="file-input"
                        className="text-apple-500 hover:text-apple-600 cursor-pointer ml-1.5 underline underline-offset-2"
                      >
                        点击上传
                      </label>
                    </h3>
                    <p className="text-sm text-gray-500 mb-6">
                      支持 JPG / PNG / PDF / DOC 格式，单个文件最大 10MB
                    </p>

                    <div className="flex flex-wrap gap-3 justify-center">
                      <label htmlFor="file-input" className="btn-primary cursor-pointer">
                        <FileImage className="w-4 h-4" />
                        选择文件
                      </label>
                      <label htmlFor="file-input" className="btn-secondary cursor-pointer">
                        <Camera className="w-4 h-4" />
                        拍照上传
                      </label>
                    </div>

                    {error && (
                      <div className="mt-5 text-sm text-apple-600 bg-apple-50 border border-apple-100 rounded-xl px-4 py-2.5">
                        {error}
                      </div>
                    )}

                    <div className="mt-8 flex gap-6">
                      {[
                        { icon: FileImage, label: "JPG/PNG", color: "text-apple-500" },
                        { icon: FileText, label: "PDF", color: "text-gray-600" },
                        { icon: FileType, label: "DOC", color: "text-gray-500" },
                      ].map((f) => (
                        <div key={f.label} className="flex flex-col items-center gap-1.5">
                          <f.icon className={`w-5 h-5 ${f.color}`} />
                          <span className="text-xs text-gray-400">{f.label}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {selected && (
              <ResultPanel record={selected} onClose={() => setSelected(null)} />
            )}

            {!selected && recognitions.length === 0 && (
              <div className="card p-12 text-center">
                <Lightbulb className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">上传作业文件后，识别结果将在此显示</p>
              </div>
            )}
          </div>

          <aside className="card p-5 h-fit lg:sticky lg:top-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <History className="w-4 h-4 text-apple-500" />
                历史记录
              </h3>
              <span className="text-xs text-gray-400">{recognitions.length}</span>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {recognitions.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">
                  暂无识别记录
                </div>
              ) : (
                recognitions.map((rec) => {
                  const Icon = FILE_ICONS[rec.fileType];
                  const isActive = selected?.id === rec.id;
                  return (
                    <button
                      key={rec.id}
                      onClick={() => setSelected(rec)}
                      className={`w-full text-left p-3 rounded-xl border transition-all duration-200 ${
                        isActive
                          ? "bg-apple-50 border-apple-200"
                          : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Icon className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{rec.fileName}</div>
                          <div className="text-xs text-gray-400 mt-0.5">{formatDate(rec.createdAt)}</div>
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {rec.recognizedElements.slice(0, 2).map((el, i) => (
                              <span
                                key={i}
                                className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                              >
                                {el.type}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ResultPanel({ record, onClose }: { record: RecognitionRecord; onClose: () => void }) {
  const Icon = FILE_ICONS[record.fileType];

  return (
    <div className="card overflow-hidden animate-fade-in-up">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-apple-500" />
          <span className="text-base font-semibold text-gray-900">识别结果</span>
          <span className="tag-primary ml-2">{record.fileType.toUpperCase()}</span>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 -mr-1">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6 p-6">
        <div>
          <div className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">原始文件</div>
          <div className="aspect-square bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center overflow-hidden">
            {record.thumbnail.startsWith("data:") ? (
              <img src={record.thumbnail} alt={record.fileName} className="w-full h-full object-contain" />
            ) : (
              <div className="flex flex-col items-center">
                <Icon className="w-12 h-12 text-gray-300 mb-2" />
                <span className="text-xs text-gray-400">{record.fileName}</span>
              </div>
            )}
          </div>
          <div className="mt-2 text-xs text-gray-400 truncate">{record.fileName}</div>
        </div>

        <div>
          <div className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">识别要素</div>
          <div className="space-y-2">
            {record.recognizedElements.map((el, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"
              >
                <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                  <span className="text-apple-500 font-semibold text-xs">{el.type.slice(0, 2)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900">{el.description}</div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-apple-500 rounded-full"
                        style={{ width: `${el.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{(el.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-6 py-5 border-t border-gray-100 bg-gray-50/50">
        <div className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wider">解析说明</div>
        <p className="text-sm text-gray-700 leading-relaxed">{record.analysis}</p>

        <div className="mt-5">
          <div className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wider">推荐学习路径</div>
          <div className="flex flex-wrap gap-2">
            {record.recommendedPath.map((p, i) => (
              <Link
                key={i}
                to="/tutor"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-gray-200 text-gray-700 text-sm rounded-xl hover:border-apple-300 hover:text-apple-500 transition-all"
              >
                <span className="text-apple-500 font-medium">{i + 1}.</span>
                <span>{p}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <Link to="/tutor" className="btn-primary">
            <Lightbulb className="w-4 h-4" />
            去答疑
          </Link>
          <Link to="/cad" className="btn-secondary">
            去 CAD 练习
          </Link>
        </div>
      </div>
    </div>
  );
}
