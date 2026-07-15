import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trash2, Bold, Underline, Settings, X, Plus, Check, Trash } from "lucide-react";
import { useAppStore } from "@/store/appStore";
import { createEntry, deleteEntry, getState } from "@/services/api";
import { useAudio } from "@/hooks/useAudio";
import type { PaperType, FontType, AudioType, BackgroundMusic } from "@/types";

export function WritePage() {
  const navigate = useNavigate();
  const params = useParams<{ id?: string }>();
  
  const {
    entries,
    currentKind,
    paper,
    font,
    fontSize,
    audio,
    bgMusic,
    setCurrentKind,
    setPaper,
    setFont,
    setFontSize,
    setAudio,
    setBgMusic,
    addCustomKind,
    updateCustomKind,
    deleteCustomKind,
    getAllKinds,
    setEntries,
    setState,
  } = useAppStore();

  const [title, setTitle] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [contentText, setContentText] = useState("");
  const [wordCount, setWordCount] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showCustomKindModal, setShowCustomKindModal] = useState(false);
  const [editingKindId, setEditingKindId] = useState<string | null>(null);
  const [newKind, setNewKind] = useState({ label: "", defaultTitle: "", content: "" });
  const [hasChanges, setHasChanges] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);
  const prevContentRef = useRef<string>(contentHtml);
  
  const { playKeySound } = useAudio(audio, bgMusic);

  useEffect(() => {
    getState().then(res => {
      if (res.success) {
        setEntries(res.data.entries);
        setState(res.data);
      }
    });
  }, []);

  useEffect(() => {
    if (params.id) {
      const entry = entries.find(e => e.id === params.id);
      if (entry) {
        setTitle(entry.title);
        setContentHtml(entry.contentHtml);
        setContentText(entry.content);
        setCurrentKind(entry.kind);
        setHasChanges(false);
      }
    } else {
      setTitle("");
      setContentHtml("");
      setContentText("");
      setHasChanges(false);
    }
  }, [params.id, entries]);

  useEffect(() => {
    if (editorRef.current && contentHtml !== prevContentRef.current) {
      editorRef.current.innerHTML = contentHtml || "";
      prevContentRef.current = contentHtml;
    }
  }, [contentHtml]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  const handleContentChange = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    const text = editorRef.current.innerText || "";
    prevContentRef.current = html;
    setContentHtml(html);
    setContentText(text);
    setHasChanges(true);
    playKeySound();
    setWordCount(text.replace(/\s/g, "").length);
  }, [playKeySound]);

  const handleKindChange = useCallback((kindKey: string) => {
    setCurrentKind(kindKey as any);
    const allKinds = getAllKinds();
    const kind = allKinds.find(k => k.key === kindKey);
    if (kind && (!contentText.trim())) {
      setTitle(kind.defaultTitle);
      const lines = kind.content.split("\n");
      const html = lines.map(line => `<p>${line}</p>`).join("");
      setContentHtml(html);
      setContentText(kind.content);
    }
  }, [contentText, getAllKinds, setCurrentKind]);

  const handleSave = useCallback(async () => {
    if (!contentText.trim()) return;
    
    const response = await createEntry({
      mode: "write",
      kind: currentKind,
      title,
      content: contentText,
      contentHtml,
    });
    
    if (response.success) {
      setEntries(response.state.entries);
      setState(response.state);
      setTitle("");
      setContentHtml("");
      setContentText("");
      setHasChanges(false);
      setWordCount(0);
      navigate("/memory");
    }
  }, [currentKind, title, contentText, contentHtml, setEntries, setState, navigate]);

  const handleDelete = useCallback(async () => {
    if (!params.id) return;
    
    const response = await deleteEntry(params.id);
    if (response.success) {
      setEntries(response.state.entries);
      setState(response.state);
      navigate("/memory");
    }
  }, [params.id, setEntries, setState, navigate]);

  const handleContinueWriting = useCallback(() => {
    if (params.id) {
      const entry = entries.find(e => e.id === params.id);
      if (entry && entry.nextPrompt) {
        const newText = contentText ? `${contentText}\n\n${entry.nextPrompt}` : entry.nextPrompt;
        const newHtml = contentHtml ? `${contentHtml}<p><br></p><p>${entry.nextPrompt}</p>` : `<p>${entry.nextPrompt}</p>`;
        setContentText(newText);
        setContentHtml(newHtml);
        setHasChanges(true);
      }
    }
  }, [params.id, entries, contentText, contentHtml]);

  const handleAddCustomKind = useCallback(() => {
    if (!newKind.label.trim()) return;
    addCustomKind({
      key: newKind.label.toLowerCase().replace(/\s+/g, "-"),
      ...newKind,
    });
    setNewKind({ label: "", defaultTitle: "", content: "" });
    setShowCustomKindModal(false);
    setEditingKindId(null);
  }, [newKind, addCustomKind]);

  const handleSaveCustomKind = useCallback(() => {
    if (!editingKindId || !newKind.label.trim()) return;
    updateCustomKind(editingKindId, {
      key: newKind.label.toLowerCase().replace(/\s+/g, "-"),
      ...newKind,
    });
    setNewKind({ label: "", defaultTitle: "", content: "" });
    setShowCustomKindModal(false);
    setEditingKindId(null);
  }, [editingKindId, newKind, updateCustomKind]);

  const handleDeleteCustomKind = useCallback((id: string) => {
    deleteCustomKind(id);
  }, [deleteCustomKind]);

  const applyBold = useCallback(() => {
    document.execCommand("bold", false);
    handleContentChange();
  }, [handleContentChange]);

  const applyUnderline = useCallback(() => {
    document.execCommand("underline", false);
    handleContentChange();
  }, [handleContentChange]);

  const paperClasses: Record<PaperType, string> = {
    white: "paper-white",
    soft: "paper-soft",
    grid: "paper-grid",
    dark: "paper-dark",
  };

  const fontClasses: Record<FontType, string> = {
    system: "font-sans",
    serif: "font-serif",
    mono: "font-mono",
  };

  const selectedEntry = params.id ? entries.find(e => e.id === params.id) : null;

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100">写作</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">保存后会自动整理心情、主题和回顾</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
            >
              <Settings size={18} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-medium">
                {getAllKinds().find(k => k.key === currentKind)?.label || currentKind}
              </span>
              <input
                type="text"
                value={title}
                onChange={e => { setTitle(e.target.value); setHasChanges(true); }}
                placeholder="标题（可选）"
                className="flex-1 bg-transparent border-none outline-none text-2xl font-medium text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-600"
              />
              {params.id && (
                <button
                  onClick={handleDelete}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>

          <div className="p-6">
            <div className="relative">
              <div
                ref={editorRef}
                className={`editor-content ${paperClasses[paper]} ${fontClasses[font]} p-6 rounded-xl transition-colors`}
                contentEditable
                suppressContentEditableWarning
                onInput={handleContentChange}
                data-placeholder="写日记、想法、困扰、长期问题，或一个想探索的主题。"
                style={{ fontSize: `${fontSize}px` }}
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-2">
                <button
                  onClick={applyBold}
                  className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm"
                >
                  <Bold size={16} strokeWidth={2} />
                </button>
                <button
                  onClick={applyUnderline}
                  className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm"
                >
                  <Underline size={16} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-400">{wordCount} 字</span>
              {selectedEntry && selectedEntry.nextPrompt && (
                <button
                  onClick={handleContinueWriting}
                  className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors"
                >
                  继续写一点
                </button>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={!contentText.trim()}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 text-white rounded-lg transition-all duration-200 font-medium text-sm shadow-sm"
            >
              保存并整理
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="mt-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">写作设置</h3>
              <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">写作性质</label>
                <div className="space-y-2">
                  {getAllKinds().map(kind => (
                    <button
                      key={kind.key}
                      onClick={() => handleKindChange(kind.key)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                        currentKind === kind.key
                          ? "bg-indigo-500 text-white"
                          : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      {kind.label}
                    </button>
                  ))}
                  <button
                    onClick={() => { setEditingKindId(null); setShowCustomKindModal(true); }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
                  >
                    <Plus size={14} />
                    新增类型
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">文字</label>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {[{ value: "system" as FontType, label: "系统" }, { value: "serif" as FontType, label: "宋体感" }, { value: "mono" as FontType, label: "等宽" }].map(f => (
                      <button
                        key={f.value}
                        onClick={() => setFont(f.value)}
                        className={`px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                          font === f.value
                            ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium"
                            : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {[18, 19, 21, 24].map(size => (
                      <button
                        key={size}
                        onClick={() => setFontSize(size)}
                        className={`px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                          fontSize === size
                            ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium"
                            : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">纸张</label>
                <div className="grid grid-cols-4 gap-2">
                  {[{ value: "white" as PaperType, label: "白纸" }, { value: "soft" as PaperType, label: "柔和" }, { value: "grid" as PaperType, label: "网格" }, { value: "dark" as PaperType, label: "夜写" }].map(p => (
                    <button
                      key={p.value}
                      onClick={() => setPaper(p.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-lg transition-all duration-150 ${
                        paper === p.value
                          ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                          : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <span className={`w-6 h-6 rounded border ${paper === p.value ? "border-indigo-400" : "border-gray-300 dark:border-gray-600"} ${
                        p.value === "dark" ? "bg-gray-800" : "bg-white dark:bg-gray-700"
                      } ${p.value === "grid" ? "bg-[linear-gradient(to_right,#e5e7eb_1px,transparent_1px),linear-gradient(to_bottom,#e5e7eb_1px,transparent_1px)] bg-[size:10px_10px] bg-gray-100 dark:bg-gray-800" : ""}`} />
                      <span className="text-xs">{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-3">氛围</label>
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-2">
                    {[{ value: "off" as AudioType, label: "关闭" }, { value: "tap" as AudioType, label: "轻敲" }, { value: "paper" as AudioType, label: "纸页" }, { value: "mechanical" as AudioType, label: "机械键" }].map(a => (
                      <button
                        key={a.value}
                        onClick={() => setAudio(a.value)}
                        className={`px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                          audio === a.value
                            ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium"
                            : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ value: "none" as BackgroundMusic, label: "停止" }, { value: "rain" as BackgroundMusic, label: "雨声" }, { value: "low" as BackgroundMusic, label: "低频" }].map(m => (
                      <button
                        key={m.value}
                        onClick={() => setBgMusic(m.value)}
                        className={`px-3 py-2 rounded-lg text-sm transition-all duration-150 ${
                          bgMusic === m.value
                            ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium"
                            : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {showCustomKindModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                  {editingKindId ? "编辑写作类型" : "新增写作类型"}
                </h3>
                <button onClick={() => { setShowCustomKindModal(false); setEditingKindId(null); setNewKind({ label: "", defaultTitle: "", content: "" }); }} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">名称</label>
                  <input
                    type="text"
                    value={newKind.label}
                    onChange={e => setNewKind({ ...newKind, label: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none focus:border-indigo-500"
                    placeholder="例如：读书笔记"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">默认标题</label>
                  <input
                    type="text"
                    value={newKind.defaultTitle}
                    onChange={e => setNewKind({ ...newKind, defaultTitle: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">模板内容</label>
                  <textarea
                    value={newKind.content}
                    onChange={e => setNewKind({ ...newKind, content: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none focus:border-indigo-500 resize-none"
                    placeholder="每行一条，用换行分隔"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={editingKindId ? handleSaveCustomKind : handleAddCustomKind}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Check size={14} />
                    {editingKindId ? "保存" : "添加"}
                  </button>
                  {editingKindId && (
                    <button
                      onClick={() => { handleDeleteCustomKind(editingKindId); setShowCustomKindModal(false); setEditingKindId(null); }}
                      className="px-4 py-2 bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 rounded-lg text-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors flex items-center gap-2"
                    >
                      <Trash size={14} />
                      删除
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedEntry && (
          <div className="mt-6 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">整理结果</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">{selectedEntry.summary}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                {selectedEntry.mood.key}
              </span>
              {selectedEntry.topics.map(t => (
                <span key={t} className="px-2 py-1 rounded-full text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                  {t}
                </span>
              ))}
            </div>
            {selectedEntry.reply && (
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-3 italic border-l-2 border-indigo-200 dark:border-indigo-800 pl-3">
                {selectedEntry.reply}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
