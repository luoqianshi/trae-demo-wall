import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, MessageSquare, Zap, Bot, User } from "lucide-react";
import Navigation from "../components/Navigation";
import { chatWithMirror, getChatHistory, ChatMessage } from "../lib/api";

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadHistory = async () => {
    try {
      const history = await getChatHistory();
      if (history.length > 0) {
        setMessages(history);
      } else {
        setMessages([
          {
            role: "assistant",
            content: "你好呀，我是镜灵。✨ 很高兴见到你。今天的你，和昨天有什么不一样吗？",
            insight: "每一次对话，都是一次照镜子的机会。"
          }
        ]);
      }
    } catch (error) {
      console.error("Failed to load history:", error);
      setMessages([
        {
          role: "assistant",
          content: "你好呀，我是镜灵。✨ 很高兴见到你。今天的你，和昨天有什么不一样吗？",
          insight: "每一次对话，都是一次照镜子的机会。"
        }
      ]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    const newUserMsg: ChatMessage = { role: "user", content: userMessage };
    setMessages(prev => [...prev, newUserMsg]);

    try {
      const result = await chatWithMirror(userMessage, "default_user", messages);
      
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: result.response,
          insight: result.insight
        }
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: "抱歉，我现在有点思绪混乱。让我们等一会儿再聊，好吗？",
          insight: "有时候，沉默也是一种对话。"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    "我今天感觉压力很大",
    "我很迷茫，不知道方向",
    "我想成为更好的自己",
    "工作让我感到疲惫",
  ];

  return (
    <div className="min-h-screen pt-16 flex flex-col">
      <Navigation />

      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full px-4 sm:px-6 relative">
        {/* 顶部标题区 */}
        <div className="text-center py-6 sm:py-8 animate-fade-in">
          <div className="relative inline-block mb-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 via-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-mirror-accent/40 glow-soft animate-float">
              <Sparkles className="w-10 h-10 text-gray-900" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-mirror-dark flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full" />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold gradient-text mb-2">
            和镜灵聊聊
          </h1>
          <p className="text-gray-500 text-sm sm:text-base">
            你的AI心理成长伙伴，像镜子一样映照真实的你
          </p>
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto space-y-6 pb-48 pt-2">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 ${
                msg.role === "user"
                  ? "flex-row-reverse"
                  : ""
              }`}
              style={{ animation: `slideUp 0.4s ease-out forwards`, animationDelay: `${index * 0.05}s`, opacity: 0 }}
            >
              {/* 头像 */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 group ${
                msg.role === "assistant"
                  ? "bg-gradient-to-br from-primary-500 via-primary-500 to-primary-600 shadow-md shadow-mirror-accent/30"
                  : "bg-gray-100 border border-white/15"
              }`}>
                {msg.role === "assistant" ? (
                  <Sparkles className="w-5 h-5 text-gray-900 group-hover:scale-110 transition-transform" />
                ) : (
                  <User className="w-5 h-5 text-gray-700" />
                )}
              </div>

              {/* 气泡 + 洞察 */}
              <div className={`flex flex-col gap-2 max-w-[80%] sm:max-w-[75%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                <div className={`px-5 py-3 leading-relaxed whitespace-pre-wrap break-words transition-all duration-300 hover:scale-[1.01] ${
                  msg.role === "assistant"
                    ? "glass-card text-gray-900 rounded-2xl rounded-tl-sm card-float"
                    : "bg-gradient-to-br from-primary-500 to-primary-600 text-gray-900 rounded-2xl rounded-tr-sm shadow-md shadow-mirror-accent/30"
                }`}>
                  {msg.content}
                </div>
                {msg.insight && msg.role === "assistant" && (
                  <div className="relative px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-50 to-primary-50 border border-amber-200 max-w-full group hover:border-amber-300 transition-all duration-300 hover:scale-[1.01]">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-full blur-xl pointer-events-none group-hover:scale-150 transition-transform duration-500" />
                    <div className="flex items-start gap-2 relative">
                      <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-amber-500 text-xs leading-relaxed">
                        <span className="font-semibold">镜中洞察</span>
                        <span className="text-amber-500/60 mx-1">·</span>
                        {msg.insight}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* 打字指示器 */}
          {isLoading && (
            <div className="flex items-start gap-3 animate-slide-left">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 via-primary-500 to-primary-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-mirror-accent/30">
                <Sparkles className="w-5 h-5 text-gray-900" />
              </div>
              <div className="glass-card px-5 py-4 rounded-2xl rounded-tl-sm">
                <div className="flex items-center gap-1.5">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* 空状态提示 */}
        {messages.length <= 1 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md pointer-events-none px-4">
            <div className="text-center mb-6 opacity-60">
              <MessageSquare className="w-12 h-12 text-gray-700 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">开始一段对话，看见真实的自己</p>
            </div>
          </div>
        )}
      </div>

      {/* 底部输入区 */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white/80 to-transparent pt-20 pb-6 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          {/* 快捷提示 */}
          {messages.length <= 2 && (
            <div className="flex flex-wrap gap-2 mb-4 justify-center">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => setInput(prompt)}
                  className="px-4 py-2 rounded-full glass-card glass-card-hover text-gray-600 text-sm hover:text-gray-900 transition-all"
                >
                  <span className="text-primary-500/70 mr-1.5">✦</span>
                  {prompt}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={handleSend} className="flex gap-3 items-end">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="和镜灵说说你的心事..."
              className="flex-1 glass-input rounded-2xl px-5 py-4 text-gray-900 placeholder-gray-400"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="btn-primary w-14 h-14 rounded-2xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed group"
              aria-label="发送"
            >
              <Send className="w-5 h-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>
          </form>
          <p className="text-center text-gray-400 text-xs mt-3">
            镜灵的对话仅供心理参考，不能替代专业心理咨询
          </p>
        </div>
      </div>
    </div>
  );
}
