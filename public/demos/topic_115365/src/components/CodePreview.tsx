import Prism from "prismjs";
import "prismjs/components/prism-markup-templating";
import "prismjs/components/prism-java";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-typescript";
import "prismjs/themes/prism-tomorrow.css";
import { useEffect, useMemo, useRef, useState } from "react";
import { saveAs } from "file-saver";
import JSZip from "jszip";
import { X, Copy, Check, Download, FileCode2, Server, Monitor, Smartphone, FileText } from "lucide-react";
import { useBuilderStore } from "@/store/useBuilderStore";
import { generateAll } from "@/utils/generator";
import type { GeneratedFile } from "@/types";

const LANG_PRISM: Record<string, string> = {
  vue: "markup",
  java: "java",
  xml: "markup",
  sql: "sql",
  yaml: "yaml",
  typescript: "typescript",
};

export default function CodePreview() {
  const { generatedOpen, setGeneratedOpen, config, controls } = useBuilderStore();
  const [activePath, setActivePath] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [sideFilter, setSideFilter] = useState<"all" | "frontend" | "backend">("all");
  const codeRef = useRef<HTMLElement>(null);

  const files = useMemo(() => generateAll(config, controls), [config, controls]);

  useEffect(() => {
    if (generatedOpen && files.length > 0 && !files.find((f) => f.path === activePath)) {
      setActivePath(files[0].path);
    }
  }, [generatedOpen, files, activePath]);

  const activeFile = files.find((f) => f.path === activePath) ?? files[0];

  useEffect(() => {
    if (activeFile && codeRef.current) {
      const lang = LANG_PRISM[activeFile.lang] ?? "markup";
      const grammar = Prism.languages[lang] ?? Prism.languages.markup;
      codeRef.current.innerHTML = Prism.highlight(activeFile.content, grammar, lang);
    }
  }, [activeFile]);

  if (!generatedOpen) return null;

  const filteredFiles = files.filter((f) => sideFilter === "all" || f.side === sideFilter);

  const handleCopy = () => {
    if (activeFile) {
      navigator.clipboard.writeText(activeFile.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const handleDownloadZip = () => {
    const zip = new JSZip();
    const fe = zip.folder("frontend")!;
    const be = zip.folder("backend")!;
    files.forEach((f) => {
      if (f.side === "frontend") fe.file(f.path, f.content);
      else be.file(f.path, f.content);
    });
    zip.generateAsync({ type: "blob" }).then((blob) => {
      saveAs(blob, `${config.projectName || "codebricks"}-generated.zip`);
    });
  };

  const handleDownloadFile = () => {
    if (activeFile) {
      const blob = new Blob([activeFile.content], { type: "text/plain;charset=utf-8" });
      saveAs(blob, activeFile.path.split("/").pop() || "file.txt");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink-950/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full h-full max-w-7xl bg-ink-900 rounded-2xl border border-ink-700/60 shadow-panel flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="h-14 shrink-0 flex items-center justify-between px-5 border-b border-ink-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-cyan-glow/20 flex items-center justify-center">
              <FileCode2 className="w-4 h-4 text-cyan-glow" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">生成代码预览</div>
              <div className="text-[10px] text-ink-500 font-mono">
                {config.frontendType === "pc" ? "Vue3 + Element Plus" : "Vue3 + Vant"} · SpringBoot + MyBatis-Plus
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              className="flex items-center gap-1.5 px-3 h-9 rounded-lg bg-cyan-glow text-ink-950 font-bold text-sm hover:shadow-glow transition-shadow"
            >
              <Download className="w-4 h-4" /> 下载 ZIP
            </button>
            <button onClick={() => setGeneratedOpen(false)} className="w-9 h-9 rounded-lg border border-ink-600 text-ink-500 hover:text-white flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 flex min-h-0">
          {/* 文件树 */}
          <div className="w-64 shrink-0 border-r border-ink-700/60 flex flex-col">
            <div className="flex gap-1 p-2 border-b border-ink-700/60">
              <FilterBtn active={sideFilter === "all"} onClick={() => setSideFilter("all")}>全部</FilterBtn>
              <FilterBtn active={sideFilter === "frontend"} onClick={() => setSideFilter("frontend")} icon={config.frontendType === "pc" ? <Monitor className="w-3 h-3" /> : <Smartphone className="w-3 h-3" />}>前端</FilterBtn>
              <FilterBtn active={sideFilter === "backend"} onClick={() => setSideFilter("backend")} icon={<Server className="w-3 h-3" />}>后端</FilterBtn>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              {filteredFiles.map((f) => (
                <button
                  key={f.path}
                  onClick={() => setActivePath(f.path)}
                  className={`w-full text-left px-3 py-1.5 flex items-center gap-2 text-[12px] font-mono transition-colors ${
                    activePath === f.path ? "bg-cyan-glow/10 text-cyan-glow border-l-2 border-cyan-glow" : "text-ink-500 hover:bg-ink-800/60 border-l-2 border-transparent"
                  }`}
                >
                  <FileIcon lang={f.lang} />
                  <span className="truncate">{f.path}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 代码区 */}
          <div className="flex-1 flex flex-col min-w-0">
            {activeFile && (
              <>
                <div className="h-10 shrink-0 flex items-center justify-between px-4 border-b border-ink-700/60 bg-ink-850/50">
                  <span className="text-[12px] font-mono text-ink-500">{activeFile.path}</span>
                  <div className="flex gap-1.5">
                    <button onClick={handleDownloadFile} className="flex items-center gap-1 px-2 h-7 rounded text-[11px] text-ink-500 hover:text-cyan-glow border border-ink-700">
                      <Download className="w-3 h-3" /> 文件
                    </button>
                    <button onClick={handleCopy} className="flex items-center gap-1 px-2 h-7 rounded text-[11px] text-ink-500 hover:text-cyan-glow border border-ink-700">
                      {copied ? <Check className="w-3 h-3 text-emerald-code" /> : <Copy className="w-3 h-3" />}
                      {copied ? "已复制" : "复制"}
                    </button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto bg-[#1e1e2e]">
                  <pre className="p-4 m-0 min-h-full">
                    <code ref={codeRef} className={`language-${LANG_PRISM[activeFile.lang] ?? "markup"}`} />
                  </pre>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-[11px] font-medium transition-all ${
        active ? "bg-ink-700/60 text-cyan-glow" : "text-ink-500 hover:text-white"
      }`}
    >
      {icon}
      {children}
    </button>
  );
}

function FileIcon({ lang }: { lang: string }) {
  const colorMap: Record<string, string> = {
    vue: "text-emerald-400",
    java: "text-orange-400",
    xml: "text-amber-400",
    sql: "text-pink-400",
    yaml: "text-purple-400",
    typescript: "text-blue-400",
  };
  return <FileText className={`w-3.5 h-3.5 shrink-0 ${colorMap[lang] ?? "text-ink-600"}`} />;
}
