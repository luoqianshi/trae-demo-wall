import { useState, useRef, useEffect } from "react";
import { Send, Sparkles } from "lucide-react";

interface Message {
  id: number;
  role: "user" | "ai";
  content: string;
  sources?: string[];
}

const suggestedQuestions = [
  "布洛芬能和酒一起吃吗？",
  "阿司匹林饭前还是饭后吃？",
  "降压药漏服了怎么办？",
  "阿托伐他汀有什么副作用？",
];

const aiResponses: Record<string, { content: string; sources: string[] }> = {
  "布洛芬能和酒一起吃吗？": {
    content:
      "不可以。布洛芬与酒精同服会显著增加胃肠道出血和溃疡的风险，两者都会刺激胃黏膜，合用可能造成严重胃出血。\n\n建议：服药期间及停药后 48 小时内避免饮酒。如已饮酒，请至少间隔 12 小时再服药。",
    sources: ["药品说明书·禁忌项", "DrugBank 药物相互作用数据库"],
  },
  "阿司匹林饭前还是饭后吃？": {
    content:
      "阿司匹林肠溶片应在饭前空腹服用。\n\n原因：\n1. 肠溶片设计在肠道溶解，空腹时胃排空快，药物能快速进入肠道\n2. 饭后服用会延迟药物进入肠道，增加胃部刺激\n3. 建议在餐前至少 30 分钟服用，用温水送服",
    sources: ["拜阿司匹灵肠溶片说明书", "中华心血管病杂志用药指南"],
  },
  "降压药漏服了怎么办？": {
    content:
      "降压药漏服的处理取决于发现时间：\n\n1. 如果发现时距下次服药还有 12 小时以上，可以补服\n2. 如果距下次服药不足 12 小时，不建议补服，按原计划服用下一次\n3. 切勿一次服用双倍剂量\n\n建议：设置每日定时提醒，避免漏服。如频繁漏服，可咨询医师是否调整为长效降压药（每日一次）。",
    sources: ["中国高血压防治指南", "苯磺酸氨氯地平片说明书"],
  },
  "阿托伐他汀有什么副作用？": {
    content:
      "阿托伐他汀常见副作用包括：\n\n1. 肌肉相关：肌肉酸痛、乏力（发生率约 5-10%）\n2. 肝功能异常：转氨酶升高（需定期监测）\n3. 消化系统：便秘、腹胀、恶心\n4. 罕见但严重：横纹肌溶解（如出现严重肌痛+酱油色尿，立即就医）\n\n建议：服药期间定期复查肝功能和肌酸激酶，如出现不明原因肌肉疼痛应及时就诊。",
    sources: ["立普妥阿托伐他汀钙片说明书", "中国成人血脂异常防治指南"],
  },
};

export default function QA() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 0,
      role: "ai",
      content:
        "您好！我是 AI 用药安全助手，可以为您解答用药相关问题。请问有什么可以帮您？",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = (text?: string) => {
    const question = text || input.trim();
    if (!question) return;

    const userMsg: Message = { id: Date.now(), role: "user", content: question };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    // 模拟 AI 回复
    setTimeout(() => {
      const response = aiResponses[question] || {
        content:
          "感谢您的提问。我目前可以解答常见药品的用法用量、药物相互作用、用药禁忌等问题。\n\n建议您尝试以下问题，或咨询专业医师获取个性化建议。",
        sources: ["AI 用药知识库"],
      };
      const aiMsg: Message = {
        id: Date.now() + 1,
        role: "ai",
        content: response.content,
        sources: response.sources,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen pb-24 flex flex-col">
      {/* 顶部 */}
      <div className="gradient-teal px-5 pt-12 pb-6 rounded-b-3xl flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles size={20} className="text-white" />
          <h1 className="text-white text-xl font-bold font-serif">用药问答</h1>
        </div>
        <p className="text-white/70 text-sm mt-1">AI 智能解答用药安全问题</p>
      </div>

      {/* 消息列表 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
          >
            {/* 头像 */}
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === "ai" ? "bg-teal text-white" : "bg-cream text-ink"
              }`}
            >
              {msg.role === "ai" ? "🤖" : "👤"}
            </div>

            {/* 消息气泡 */}
            <div
              className={`max-w-[75%] rounded-2xl p-3.5 ${
                msg.role === "ai"
                  ? "bg-white card-shadow text-ink"
                  : "gradient-mint text-white"
              }`}
            >
              <p className="text-sm whitespace-pre-line leading-relaxed">{msg.content}</p>
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                  <p className="text-[10px] text-ink-light mb-1">参考来源：</p>
                  {msg.sources.map((s, i) => (
                    <p key={i} className="text-[10px] text-teal">
                      📋 {s}
                    </p>
                  ))}
                </div>
              )}
              {msg.role === "ai" && (
                <p className="text-[10px] text-ink-light mt-2 pt-2 border-t border-gray-100">
                  ⚠️ 仅供参考，不能替代医师处方
                </p>
              )}
            </div>
          </div>
        ))}

        {/* 加载中 */}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-9 h-9 rounded-full bg-teal flex items-center justify-center flex-shrink-0">
              🤖
            </div>
            <div className="bg-white rounded-2xl p-4 card-shadow flex items-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-teal animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 推荐问题 */}
      {messages.length <= 1 && (
        <div className="px-5 pb-2 flex-shrink-0">
          <p className="text-xs text-ink-light mb-2">💡 你可以问我：</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => handleSend(q)}
                className="bg-white rounded-full px-3 py-1.5 text-xs text-teal card-shadow hover:bg-teal-pale transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 输入栏 */}
      <div className="flex-shrink-0 px-5 py-3 bg-white border-t border-gray-100">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="输入用药问题..."
            className="flex-1 bg-cream rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal/20"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-full gradient-mint text-white flex items-center justify-center disabled:opacity-40 transition-opacity"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
