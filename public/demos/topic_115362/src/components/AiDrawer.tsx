import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Bot, User } from "lucide-react";
import { useBuilderStore } from "@/store/useBuilderStore";

const EXAMPLES = [
  "做一个用户管理，包含用户名、手机号、邮箱、年龄、状态、注册时间、头像附件",
  "商品管理：商品名称、价格、库存、分类、是否上架、详情描述、主图",
  "订单表：订单编号、金额、下单时间、支付状态、收货地址",
];

export default function AiDrawer() {
  const { aiOpen, setAiOpen, chatMessages, sendAiMessage } = useBuilderStore();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (aiOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages, aiOpen]);

  if (!aiOpen) return null;

  const handleSend = () => {
    if (!input.trim()) return;
    sendAiMessage(input.trim());
    setInput("");
  };

  return (
    <>
      {/* 遮罩 */}
      <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setAiOpen(false)} />

      {/* 抽屉 */}
      <div className="fixed top-0 right-0 bottom-0 w-[420px] bg-ink-850 border-l border-ink-700/60 z-50 flex flex-col animate-slide-in shadow-panel">
        {/* 头部 */}
        <div className="h-14 shrink-0 flex items-center justify-between px-4 border-b border-ink-700/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-accent to-orange-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-ink-950" />
            </div>
            <div>
              <div className="text-sm font-semibold text-white">AI 对话生成</div>
              <div className="text-[10px] text-ink-500 font-mono">用自然语言描述需求</div>
            </div>
          </div>
          <button onClick={() => setAiOpen(false)} className="text-ink-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 消息区 */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.map((msg, i) => (
            <Message key={i} role={msg.role} content={msg.content} />
          ))}
        </div>

        {/* 示例 */}
        <div className="px-4 pb-2">
          <div className="text-[10px] text-ink-600 mb-1.5">快捷示例</div>
          <div className="flex flex-wrap gap-1.5">
            {EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => setInput(ex)}
                className="text-[10px] px-2 py-1 rounded-full border border-ink-700 text-ink-500 hover:border-amber-accent/50 hover:text-amber-accent transition-colors"
              >
                {ex.slice(0, 14)}…
              </button>
            ))}
          </div>
        </div>

        {/* 输入区 */}
        <div className="p-4 border-t border-ink-700/60">
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={2}
              placeholder="描述你想生成的页面，如：用户名、手机号、年龄…"
              className="flex-1 resize-none bg-ink-950/60 border border-ink-700 rounded-lg px-3 py-2 text-[13px] text-white outline-none focus:border-amber-accent/50 focus:shadow-[0_0_0_2px_rgba(245,158,11,0.12)] transition-all placeholder:text-ink-600"
            />
            <button
              onClick={handleSend}
              className="shrink-0 w-10 rounded-lg bg-amber-accent text-ink-950 flex items-center justify-center hover:brightness-110 transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function Message({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${
          isUser ? "bg-cyan-glow/20" : "bg-amber-accent/20"
        }`}
      >
        {isUser ? <User className="w-4 h-4 text-cyan-glow" /> : <Bot className="w-4 h-4 text-amber-accent" />}
      </div>
      <div
        className={`max-w-[80%] px-3 py-2 rounded-2xl text-[13px] leading-relaxed ${
          isUser
            ? "bg-cyan-glow/15 text-white rounded-tr-sm"
            : "bg-ink-800 text-ink-500 rounded-tl-sm border border-ink-700/40"
        }`}
      >
        {content}
      </div>
    </div>
  );
}
