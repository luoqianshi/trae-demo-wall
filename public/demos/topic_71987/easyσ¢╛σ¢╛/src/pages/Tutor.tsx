import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  MessageSquare,
  Send,
  Trash2,
  Sparkles,
  User as UserIcon,
  Bot,
  CheckSquare,
  Square,
  PencilRuler,
  Loader2,
  Copy,
  Check,
  Terminal,
  Lightbulb,
  Eye,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useStore } from "@/store/useStore";
import { QUICK_QUESTIONS } from "@/lib/mockData";
import { formatDate } from "@/lib/storage";
import type { StepGuide } from "@/types";

export default function Tutor() {
  const messages = useStore((s) => s.messages);
  const loadMessages = useStore((s) => s.loadMessages);
  const ask = useStore((s) => s.ask);
  const clearMessages = useStore((s) => s.clearMessages);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    setInput("");
    setLoading(true);
    try {
      await ask(content);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="px-4 lg:px-8 py-4 border-b border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2.5">
              <MessageSquare className="w-5 h-5 text-apple-500" />
              交互答疑工作台
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              对话式答疑 · 分步引导制图 · 上下文记忆
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={clearMessages}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-apple-500 hover:bg-apple-50 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              清空对话
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 lg:px-8 py-6">
            {messages.length === 0 ? (
              <Welcome onPick={handleSend} />
            ) : (
              <div className="max-w-4xl mx-auto space-y-6">
                {messages.map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    role={msg.role}
                    content={msg.content}
                    steps={msg.steps}
                    time={msg.createdAt}
                  />
                ))}
                {loading && (
                  <div className="flex gap-3 max-w-4xl mx-auto">
                    <div className="w-8 h-8 rounded-full bg-apple-500 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 flex items-center gap-2">
                      <Loader2 className="w-4 h-4 text-apple-500 animate-spin" />
                      <span className="text-sm text-gray-500">正在思考...</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {messages.length > 0 && (
            <div className="px-4 lg:px-8 py-2 border-t border-gray-50 bg-gray-50/50">
              <div className="max-w-4xl mx-auto flex flex-wrap gap-2">
                {QUICK_QUESTIONS.slice(0, 4).map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    disabled={loading}
                    className="text-xs px-3.5 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-apple-300 hover:text-apple-500 transition-all disabled:opacity-50"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="px-4 lg:px-8 py-4 border-t border-gray-100 bg-white">
            <div className="max-w-4xl mx-auto flex gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入你的制图问题，例如：如何绘制螺纹？"
                  rows={1}
                  className="input-field resize-none pr-12 max-h-32"
                  style={{ minHeight: "48px" }}
                />
              </div>
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="btn-primary self-end"
              >
                <Send className="w-4 h-4" />
                发送
              </button>
            </div>
            <div className="text-xs text-gray-400 mt-1.5 text-center">
              按 Enter 发送 · Shift + Enter 换行
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Welcome({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="max-w-3xl mx-auto text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-apple-50 border border-apple-100 mb-6">
        <Sparkles className="w-8 h-8 text-apple-500" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">
        有什么制图问题，尽管问我
      </h2>
      <p className="text-gray-500 mb-10">
        我可以解答机械制图与 AutoCAD 相关的疑惑，并提供分步骤绘图引导
      </p>

      <div className="grid sm:grid-cols-2 gap-3 text-left">
        {QUICK_QUESTIONS.map((q) => (
          <button
            key={q}
            onClick={() => onPick(q)}
            className="card card-hover p-4 group text-left"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm text-gray-700 group-hover:text-apple-500 transition-colors">{q}</span>
              <Sparkles className="w-4 h-4 text-gray-300 group-hover:text-apple-500 transition-colors" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({
  role,
  content,
  steps,
  time,
}: {
  role: "user" | "assistant";
  content: string;
  steps?: StepGuide[];
  time: string;
}) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 max-w-4xl mx-auto ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser ? "bg-gray-100 border border-gray-200" : "bg-apple-500"
        }`}
      >
        {isUser ? (
          <UserIcon className="w-4 h-4 text-gray-600" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      <div className={`flex-1 min-w-0 ${isUser ? "text-right" : ""}`}>
        <div
          className={`inline-block max-w-full text-left ${
            isUser
              ? "bg-apple-500 text-white rounded-2xl rounded-tr-sm px-4 py-3"
              : "bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3"
          }`}
        >
          {isUser ? (
            <div className="text-sm whitespace-pre-wrap">{content}</div>
          ) : (
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  h2: ({ children }) => (
                    <h2 className="text-lg font-semibold text-gray-900 mt-3 mb-2">{children}</h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-semibold text-gray-900 mt-2 mb-1">{children}</h3>
                  ),
                  p: ({ children }) => <p className="text-sm text-gray-700 leading-relaxed mb-2">{children}</p>,
                  ul: ({ children }) => (
                    <ul className="text-sm text-gray-700 space-y-1 list-disc list-inside mb-2">{children}</ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside mb-2">{children}</ol>
                  ),
                  strong: ({ children }) => <strong className="text-apple-500 font-semibold">{children}</strong>,
                  code: ({ children }) => (
                    <code className="font-mono text-xs bg-white px-1.5 py-0.5 rounded text-gray-700 border border-gray-200">
                      {children}
                    </code>
                  ),
                  table: ({ children }) => (
                    <table className="my-2 w-full text-xs border-collapse">{children}</table>
                  ),
                  th: ({ children }) => (
                    <th className="border border-gray-200 px-2 py-1 bg-gray-100 text-gray-900 font-medium">
                      {children}
                    </th>
                  ),
                  td: ({ children }) => (
                    <td className="border border-gray-200 px-2 py-1 text-gray-600">{children}</td>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-2 border-apple-400 pl-3 my-2 text-gray-600 italic">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {content}
              </ReactMarkdown>
            </div>
          )}

          {steps && steps.length > 0 && <StepPanel steps={steps} />}
        </div>
        <div className={`text-xs text-gray-400 mt-1 ${isUser ? "text-right" : ""}`}>
          {formatDate(time)}
        </div>
      </div>
    </div>
  );
}

function StepPanel({ steps }: { steps: StepGuide[] }) {
  const [items, setItems] = useState(steps);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setItems((arr) => arr.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)));
  };

  const copyCommand = async (id: string, cmd?: string) => {
    if (!cmd) return;
    try {
      await navigator.clipboard.writeText(cmd);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // ignore
    }
  };

  const completed = items.filter((s) => s.completed).length;

  return (
    <div className="mt-4 p-4 bg-white rounded-2xl border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
          <PencilRuler className="w-4 h-4 text-apple-500" />
          分步引导 · 每一步都给出可执行命令
        </div>
        <div className="text-xs text-gray-500">
          {completed} / {items.length}
        </div>
      </div>

      <div className="space-y-2">
        {items.map((step, i) => (
          <div
            key={step.id}
            className={`text-left p-3 rounded-xl transition-all border ${
              step.completed
                ? "bg-apple-50 border-apple-100"
                : "border-transparent hover:bg-gray-50"
            }`}
          >
            <button
              onClick={() => toggle(step.id)}
              className="w-full flex items-start gap-2.5 text-left"
            >
              {step.completed ? (
                <CheckSquare className="w-5 h-5 text-apple-500 flex-shrink-0 mt-0.5" />
              ) : (
                <Square className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div
                  className={`text-sm font-medium ${
                    step.completed ? "text-apple-600 line-through" : "text-gray-900"
                  }`}
                >
                  步骤 {i + 1}：{step.title}
                </div>
                <div className="text-xs text-gray-600 mt-1 leading-relaxed">
                  {step.description}
                </div>
              </div>
            </button>

            {/* 完整命令行 */}
            {step.fullCommand && (
              <div className="mt-2.5 ml-7">
                <div className="flex items-center gap-1.5 mb-1">
                  <Terminal className="w-3 h-3 text-gray-400" />
                  <span className="text-[11px] text-gray-500 font-medium">CAD 命令行输入</span>
                </div>
                <div className="group relative bg-gray-900 rounded-lg p-2.5 pr-10 overflow-x-auto">
                  <code className="font-mono text-xs text-green-400 whitespace-pre-wrap break-all">
                    {step.fullCommand}
                  </code>
                  <button
                    onClick={() => copyCommand(step.id, step.fullCommand)}
                    className="absolute top-1.5 right-1.5 p-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                    title="复制命令"
                  >
                    {copiedId === step.id ? (
                      <Check className="w-3 h-3 text-green-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
                {copiedId === step.id && (
                  <div className="text-[10px] text-apple-500 mt-1">✓ 已复制到剪贴板</div>
                )}
              </div>
            )}

            {/* 操作提示 */}
            {step.tip && (
              <div className="mt-2 ml-7 flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2">
                <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-500" />
                <span className="leading-relaxed">{step.tip}</span>
              </div>
            )}

            {/* 预期效果 */}
            {step.expected && (
              <div className="mt-1.5 ml-7 flex items-start gap-1.5 text-xs text-gray-600">
                <Eye className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-gray-400" />
                <span className="leading-relaxed">
                  <span className="text-gray-500">预期效果：</span>
                  {step.expected}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {completed === items.length && (
        <div className="mt-4 text-center">
          <Link to="/cad" className="btn-primary text-sm">
            <PencilRuler className="w-4 h-4" />
            去 CAD 画板动手练习
          </Link>
        </div>
      )}
    </div>
  );
}
