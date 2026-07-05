import { useEffect, useMemo, useState } from "react";
import {
  Bookmark,
  Search,
  Star,
  Trash2,
  Plus,
  X,
  Filter,
  Clock,
  Edit3,
} from "lucide-react";
import BlueprintThumbnail from "@/components/BlueprintThumbnail";
import { useStore } from "@/store/useStore";
import { formatDate } from "@/lib/storage";
import type { Template, TemplateCategory } from "@/types";
import ReactMarkdown from "react-markdown";

const CATEGORIES: (TemplateCategory | "全部")[] = [
  "全部",
  "螺纹",
  "齿轮",
  "轴",
  "孔",
  "装配",
  "其他",
];

const THUMB_TYPES = ["thread", "gear", "shaft", "hole", "assembly", "default"];

export default function Templates() {
  const templates = useStore((s) => s.templates);
  const loadTemplates = useStore((s) => s.loadTemplates);
  const toggleFavorite = useStore((s) => s.toggleFavorite);
  const deleteTemplate = useStore((s) => s.deleteTemplate);
  const touchTemplate = useStore((s) => s.touchTemplate);
  const addTemplate = useStore((s) => s.addTemplate);

  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState<TemplateCategory | "全部">("全部");
  const [onlyFav, setOnlyFav] = useState(false);
  const [sortBy, setSortBy] = useState<"time" | "name">("time");
  const [selected, setSelected] = useState<Template | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const filtered = useMemo(() => {
    let list = templates.slice();
    if (keyword.trim()) {
      const kw = keyword.trim().toLowerCase();
      list = list.filter(
        (t) => t.name.toLowerCase().includes(kw) || t.content.toLowerCase().includes(kw)
      );
    }
    if (category !== "全部") {
      list = list.filter((t) => t.category === category);
    }
    if (onlyFav) {
      list = list.filter((t) => t.favorite);
    }
    list.sort((a, b) => {
      if (sortBy === "time") {
        return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
      }
      return a.name.localeCompare(b.name, "zh-CN");
    });
    return list;
  }, [templates, keyword, category, onlyFav, sortBy]);

  const handleOpen = (tpl: Template) => {
    setSelected(tpl);
    touchTemplate(tpl.id);
  };

  return (
    <div className="min-h-full bg-white px-4 lg:px-8 py-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <Bookmark className="w-7 h-7 text-apple-500" />
              记忆模板库
            </h1>
            <p className="mt-2 text-gray-500">
              保存常用制图模板，记忆你的学习路径 · 共 {templates.length} 个模板
            </p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            新建模板
          </button>
        </div>

        <div className="card p-5 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索模板名称或内容..."
                className="input-field pl-10"
              />
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              <Filter className="w-4 h-4 text-gray-400" />
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                    category === c
                      ? "bg-apple-500 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <button
              onClick={() => setOnlyFav((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full transition-all ${
                onlyFav
                  ? "bg-apple-50 text-apple-600"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Star className={`w-4 h-4 ${onlyFav ? "fill-apple-500 text-apple-500" : ""}`} />
              收藏
            </button>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "time" | "name")}
              className="input-field text-sm py-2 px-3"
            >
              <option value="time">最近使用</option>
              <option value="name">名称排序</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="card p-16 text-center">
            <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">暂无模板</p>
            <button onClick={() => setShowCreate(true)} className="btn-secondary mt-3">
              <Plus className="w-4 h-4" />
              创建第一个模板
            </button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((tpl) => (
              <div
                key={tpl.id}
                className="card card-hover overflow-hidden group cursor-pointer"
                onClick={() => handleOpen(tpl)}
              >
                <div className="aspect-[4/3] relative">
                  <BlueprintThumbnail type={tpl.thumbnail} className="w-full h-full" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(tpl.id);
                    }}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur border border-gray-200 flex items-center justify-center hover:bg-white transition-all shadow-soft"
                  >
                    <Star
                      className={`w-4 h-4 ${
                        tpl.favorite
                          ? "text-amber-500 fill-amber-500"
                          : "text-gray-400"
                      }`}
                    />
                  </button>
                  <div className="absolute top-3 left-3">
                    <span className="tag-primary">{tpl.category}</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-gray-900 group-hover:text-apple-500 transition-colors truncate">
                    {tpl.name}
                  </h3>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDate(tpl.lastUsedAt)}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTemplate(tpl.id);
                      }}
                      className="text-gray-400 hover:text-apple-500 transition-colors p-1 -m-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selected && (
          <TemplateDetail
            template={selected}
            onClose={() => setSelected(null)}
            onToggleFav={() => toggleFavorite(selected.id)}
          />
        )}

        {showCreate && (
          <CreateTemplateModal
            onClose={() => setShowCreate(false)}
            onCreate={(data) => {
              addTemplate(data);
              setShowCreate(false);
            }}
          />
        )}
      </div>
    </div>
  );
}

function TemplateDetail({
  template,
  onClose,
  onToggleFav,
}: {
  template: Template;
  onClose: () => void;
  onToggleFav: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="card max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-soft-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">模板详情</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 -mr-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid sm:grid-cols-[180px_1fr] gap-5 mb-5">
            <BlueprintThumbnail type={template.thumbnail} className="aspect-[4/3]" />
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="tag-primary">{template.category}</span>
                {template.favorite && (
                  <span className="text-amber-500 text-xs flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 fill-amber-500" />
                    已收藏
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">{template.name}</h2>
              <div className="text-xs text-gray-400 space-y-1 mt-3">
                <div>创建：{formatDate(template.createdAt)}</div>
                <div>最近使用：{formatDate(template.lastUsedAt)}</div>
              </div>
            </div>
          </div>

          <div className="mt-5">
            <div className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wider">
              内容
            </div>
            <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  h2: ({ children }) => (
                    <h2 className="text-base font-semibold text-gray-900 mt-4 mb-2">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-sm font-semibold text-gray-900 mt-3 mb-1.5">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="text-sm text-gray-700 leading-relaxed mb-2">
                      {children}
                    </p>
                  ),
                  ol: ({ children }) => (
                    <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside mb-2">
                      {children}
                    </ol>
                  ),
                  ul: ({ children }) => (
                    <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside mb-2">
                      {children}
                    </ul>
                  ),
                  strong: ({ children }) => (
                    <strong className="text-apple-500 font-semibold">{children}</strong>
                  ),
                  code: ({ children }) => (
                    <code className="font-mono text-xs bg-white px-1.5 py-0.5 rounded text-gray-700 border border-gray-200">
                      {children}
                    </code>
                  ),
                }}
              >
                {template.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-between">
          <button onClick={onToggleFav} className="btn-secondary">
            <Star
              className={`w-4 h-4 ${
                template.favorite ? "fill-amber-500 text-amber-500" : ""
              }`}
            />
            {template.favorite ? "取消收藏" : "收藏"}
          </button>
          <button onClick={onClose} className="btn-primary">
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}

function CreateTemplateModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: Omit<Template, "id" | "userId" | "createdAt" | "lastUsedAt">) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<TemplateCategory>("螺纹");
  const [thumbnail, setThumbnail] = useState("thread");
  const [content, setContent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    onCreate({
      name: name.trim(),
      category,
      thumbnail,
      content: content.trim(),
      favorite: false,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="card max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col shadow-soft-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-apple-500" />
            新建模板
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 -mr-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              模板名称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="模板名称"
              className="input-field"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                分类
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as TemplateCategory)}
                className="input-field"
              >
                {CATEGORIES.filter((c) => c !== "全部").map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                缩略图
              </label>
              <select
                value={thumbnail}
                onChange={(e) => setThumbnail(e.target.value)}
                className="input-field"
              >
                {THUMB_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              内容 (Markdown)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="使用 Markdown 语法编写模板内容..."
              rows={8}
              className="input-field resize-none font-mono text-sm"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button type="button" onClick={onClose} className="btn-secondary">
              取消
            </button>
            <button type="submit" className="btn-primary">
              <Plus className="w-4 h-4" />
              创建
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
