import { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, MessageCircle, ChevronRight, Settings, Bot } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getAIResponse } from '../ai/knowledgeQA';
import { getAITaskRecommendations, getDailyTheme } from '../ai/recommendation';
import { getMotivationalMessage, getUserPersona } from '../ai/insights';
import { sendToAI, getCurrentConfig, hasConfiguredAPI, ChatMessage } from '../ai/apiService';
import { SettingsModal } from './SettingsModal';

export function AIAssistantPage() {
  const { stats, checkIns } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const persona = getUserPersona(stats);
  const theme = getDailyTheme();
  const recs = getAITaskRecommendations(stats, checkIns, 3);
  const lastHours = checkIns.length === 0 ? 999 : Math.floor((Date.now() - checkIns[checkIns.length - 1].timestamp) / 3600000);
  const moti = getMotivationalMessage(stats, lastHours);

  // 初始化：获取配置，并根据配置生成不同的欢迎语
  useEffect(() => {
    const config = getCurrentConfig();
    const hasAccess = hasConfiguredAPI();
    const pName = config.provider.name;
    const modelName = config.model;

    setMessages([
      {
        role: 'ai',
        content: `你好呀 👋 我是你的 AI 公益小助手${hasAccess ? ` 🤖（已接入 ${pName} · ${modelName}）` : ''}。\n\n我刚刚分析了你的公益数据 — 累计 ${stats.totalCheckIns} 次打卡，${stats.totalMinutes} 分钟公益时间，当前你是「${persona.persona}」类型 🌟\n\n${hasAccess ? '你现在可以自由对话了！试着问我任何关于公益的问题吧。' : '💡 提示：点击右上角设置按钮，配置 API Key 即可启用真实 AI 对话（有免费选项）'}\n\n你可以：\n1️⃣ 问我任何关于公益的问题\n2️⃣ 让我推荐今天适合的任务\n3️⃣ 告诉我你的心情，我来帮你匹配合适的行动\n\n今天想从哪里开始呢？`,
        timestamp: Date.now(),
      },
    ]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content) return;

    setMessages((m) => [...m, { role: 'user', content, timestamp: Date.now() }]);
    setInput('');
    setIsTyping(true);

    const config = getCurrentConfig();

    try {
      let responseContent: string;

      if (config.apiKey && config.apiKey.trim() !== '') {
        const chatMessages: ChatMessage[] = messages
          .map((m) => ({
            role: (m.role === 'ai' ? 'assistant' : 'user') as 'user' | 'assistant',
            content: m.content,
          }))
          .slice(-6);
        chatMessages.push({ role: 'user', content });

        const response = await sendToAI(chatMessages);
        responseContent = response.content;
      } else {
        await new Promise((resolve) => setTimeout(resolve, 400));
        const response = getAIResponse(content);
        responseContent = response.answer;
      }

      setMessages((m) => [...m, { role: 'ai', content: responseContent, timestamp: Date.now() }]);
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        {
          role: 'ai',
          content: `⚠️ ${err.message || 'AI 暂时无法回答，请稍后再试。'}\n\n如果配置有问题，可以点击右上角设置按钮重新配置。`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleTaskCheckIn = (taskId: string) => {
    const task = recs.find((r) => r.task.id === taskId)?.task;
    if (task) {
      setMessages((m) => [
        ...m,
        {
          role: 'ai',
          content: `太棒了！✨ 你刚刚完成了「${task.name}」\n\n继续保持这种节奏，你的公益画像会越来越丰富 🌟`,
          timestamp: Date.now(),
        },
      ]);
    }
  };

  const quickQuestions = [
    '我是新手，怎么开始做公益？',
    '做的这些小事真的有用吗？',
    '日常生活中怎么践行环保？',
    '怎么培养孩子的公益意识？',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50/30 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-5 pt-12 pb-10 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-16 -translate-x-16 blur-3xl" />

        <div className="relative flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-xl">
              🤖
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">AI 小助手</h1>
                <span className="flex items-center gap-1 text-xs bg-white/20 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" />
                  {hasConfiguredAPI() ? `${getCurrentConfig().provider.name}` : '规则模式'}
                </span>
              </div>
              <p className="text-xs text-white/80">你的专属公益顾问</p>
            </div>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center hover:bg-white/30 transition-all"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Daily motivation */}
        <div className="relative bg-white/15 backdrop-blur rounded-2xl p-4 border border-white/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span className="text-xs font-medium text-white/90">今日箴言</span>
          </div>
          <p className="text-sm text-white leading-relaxed">{moti.message}</p>
        </div>
      </div>

      {/* Daily Theme Card */}
      <div className="px-5 -mt-5 mb-4 relative z-10">
        <div className={`bg-gradient-to-r ${theme.color} rounded-2xl p-4 text-white shadow-lg shadow-purple-500/20`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/80 mb-0.5">今日公益主题</p>
              <h2 className="text-lg font-bold mb-1">
                {theme.emoji} {theme.title}
              </h2>
              <p className="text-xs text-white/90">{theme.subtitle}</p>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="px-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium text-slate-500">✨ 基于你的偏好智能推荐</span>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {recs.map((rec) => (
            <div
              key={rec.task.id}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all overflow-hidden border border-slate-100"
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xl flex-shrink-0">
                    {rec.task.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 text-sm mb-1">{rec.task.name}</h3>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {rec.tags.slice(0, 2).map((tag, i) => (
                        <span key={i} className="text-xs px-1.5 py-0.5 bg-slate-50 text-slate-500 rounded-full border border-slate-100">
                          {tag}
                        </span>
                      ))}
                      <span className="text-xs px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded-full border border-amber-100">
                        +{rec.task.reward}分
                      </span>
                    </div>
                    <button
                      onClick={() => handleTaskCheckIn(rec.task.id)}
                      className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl text-xs font-medium hover:opacity-95 transition-all"
                    >
                      立即打卡 · {rec.task.duration}分钟
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat messages */}
      <div
        ref={scrollRef}
        className="px-5 space-y-3 mb-6 overflow-y-auto"
        style={{ maxHeight: '45vh' }}
      >
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm whitespace-pre-line ${
                msg.role === 'user'
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-br-md'
                  : 'bg-white text-slate-700 border border-slate-100 rounded-bl-md'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl rounded-bl-md px-4 py-3 shadow-sm border border-slate-100">
              <div className="flex items-center gap-1.5">
                <Bot className="w-4 h-4 text-indigo-400" />
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick questions */}
      {messages.length <= 2 && (
        <div className="px-5 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-400">试试这些问题</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => sendMessage(q)}
                className="text-xs px-3 py-2 bg-white text-slate-600 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/50 transition-all shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="fixed bottom-20 left-0 right-0 px-4 z-30">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-2 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={hasConfiguredAPI() ? `问问 ${getCurrentConfig().provider.name}...` : '配置 API Key 后启用 AI 对话'}
              className="flex-1 px-3 py-2 text-sm bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-indigo-200 transition-all placeholder:text-slate-400"
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim()}
              className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-xl flex items-center justify-center hover:opacity-95 disabled:opacity-40 transition-all active:scale-95 shadow-md shadow-indigo-500/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          {!hasConfiguredAPI() && (
            <button
              onClick={() => setShowSettings(true)}
              className="mt-2 w-full text-xs text-center text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              点击配置 API Key 启用真实 AI →
            </button>
          )}
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          onClose={() => {
            setShowSettings(false);
          }}
        />
      )}
    </div>
  );
}

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
}
