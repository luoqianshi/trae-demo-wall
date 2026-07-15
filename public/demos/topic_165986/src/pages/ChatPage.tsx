import { useState, useRef, useEffect, useCallback } from "react";
import { Mic, X, Send, Volume2, VolumeX, Sparkles, Loader2 } from "lucide-react";
import { sendChatMessage } from "@/services/api";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: string;
  aiPowered?: boolean;
}

const exampleMessages: Message[] = [
  {
    id: "1",
    role: "ai",
    content: "你好，我是你的写作伙伴。按住麦克风说话，或者切换到文字输入。",
    timestamp: "10:30",
  },
];

type RecordingState = "idle" | "recording" | "processing";

export function ChatPage() {
  const [messages, setMessages] = useState<Message[]>(exampleMessages);
  const [input, setInput] = useState("");
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = "zh-CN";

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          setInput(finalTranscript);
          setTranscript("");
        } else {
          setTranscript(interimTranscript);
        }
      };

      recognitionRef.current.onerror = () => {
        setRecordingState("idle");
        setTranscript("");
      };

      recognitionRef.current.onend = () => {
        if (recordingState === "recording") {
          setRecordingState("idle");
          if (input.trim()) {
            handleSendMessage(input);
          }
          setTranscript("");
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      window.speechSynthesis.cancel();
    };
  }, [recordingState, input]);

  const speakText = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.5;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, []);

  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setWaiting(true);

    try {
      const allMessages = [...messages, userMessage].map(m => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      }));

      const res = await sendChatMessage({ messages: allMessages });

      const reply: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: res.reply,
        timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
        aiPowered: res.aiPowered,
      };

      setMessages(prev => [...prev, reply]);
      speakText(reply.content);
    } catch {
      const reply: Message = {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: "我暂时无法回应，请稍后再试。",
        timestamp: new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages(prev => [...prev, reply]);
    } finally {
      setWaiting(false);
    }
  }, [messages, speakText]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    handleSendMessage(input);
  }, [input, handleSendMessage]);

  const handleRecordingStart = useCallback(() => {
    if (!recognitionRef.current) {
      setRecordingState("processing");
      setTimeout(() => {
        setRecordingState("idle");
        setInput("您的浏览器不支持语音识别功能，请使用文字输入。");
      }, 1500);
      return;
    }

    setRecordingState("recording");
    setTranscript("");
    recognitionRef.current.start();
  }, []);

  const handleRecordingEnd = useCallback(() => {
    if (recordingState === "recording" && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (recordingState === "recording") {
      setRecordingState("processing");
    }
  }, [recordingState]);

  const handleRecordingCancel = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setRecordingState("idle");
    setTranscript("");
  }, []);

  const toggleSpeech = useCallback(() => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  }, [isSpeaking]);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900">
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-medium text-gray-900 dark:text-gray-100">跟 AI 聊聊</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            安静的 AI 陪伴室，按住说话，低打扰回复。
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 p-6">
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
          <div className="relative">
            <div className={`absolute inset-0 rounded-full transition-all duration-500 ${
              recordingState === "recording" 
                ? "bg-red-500/20 animate-ping" 
                : "bg-indigo-500/10"
            }`} 
              style={{ 
                width: "280px", 
                height: "280px", 
                left: "50%", 
                top: "50%", 
                transform: "translate(-50%, -50%)",
              }}
            />
            
            <button
              onMouseDown={handleRecordingStart}
              onMouseUp={handleRecordingEnd}
              onMouseLeave={handleRecordingEnd}
              onTouchStart={handleRecordingStart}
              onTouchEnd={handleRecordingEnd}
              disabled={recordingState !== "idle" || waiting}
              className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                recordingState === "recording"
                  ? "bg-red-500 text-white scale-105 shadow-red-500/30"
                  : recordingState === "processing"
                  ? "bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-wait"
                  : waiting
                  ? "bg-indigo-400 dark:bg-indigo-500 text-white cursor-wait"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-105 shadow-indigo-600/20"
              }`}
            >
              {recordingState === "processing" || waiting ? (
                <Loader2 size={40} className="animate-spin" strokeWidth={1.5} />
              ) : (
                <Mic size={40} strokeWidth={1.5} />
              )}
            </button>

            {recordingState === "recording" && (
              <button
                onClick={handleRecordingCancel}
                className="absolute -right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 shadow-md flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>

          <div className="mt-8 text-center">
            <p className={`text-sm font-medium ${
              recordingState === "recording" 
                ? "text-red-600 dark:text-red-400" 
                : "text-gray-600 dark:text-gray-300"
            }`}>
              {recordingState === "recording"
                ? "正在听..."
                : recordingState === "processing"
                ? "整理中..."
                : waiting
                ? "AI 思考中..."
                : "按住说话"
              }
            </p>
            <p className="text-xs text-gray-400 mt-1">像打电话一样，说完松手</p>
          </div>

          {transcript && (
            <div className="mt-6 px-6 py-4 bg-gray-50 dark:bg-gray-800 rounded-2xl max-w-md text-sm text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
              {transcript}
            </div>
          )}

          <button
            onClick={() => setShowTextInput(!showTextInput)}
            className="mt-8 text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-2"
          >
            <Sparkles size={14} />
            {showTextInput ? "收起文字输入" : "切换到文字输入"}
          </button>

          {showTextInput && (
            <div className="mt-4 w-full max-w-md">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="输入你想聊的内容..."
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  className={`p-3 rounded-xl transition-all duration-150 ${
                    input.trim()
                      ? "bg-indigo-600 text-white hover:bg-indigo-700"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="w-full lg:w-96 flex flex-col bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-200">对话记录</h2>
            <button
              onClick={toggleSpeech}
              className={`p-2 rounded-lg transition-colors ${
                isSpeaking
                  ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                  : "bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600"
              }`}
              title={isSpeaking ? "停止播放" : "语音播放"}
            >
              {isSpeaking ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(message => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                  message.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                }`}>
                  {message.role === "user" ? "U" : "AI"}
                </div>
                <div className={`max-w-[85%] ${message.role === "user" ? "text-right" : ""}`}>
                  <div className={`rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    message.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-bl-sm border border-gray-200 dark:border-gray-600"
                  }`}>
                    {message.content}
                  </div>
                  <div className={`text-[10px] text-gray-400 mt-1 ${message.role === "user" ? "text-right" : ""}`}>
                    {message.timestamp}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-400">AI 回复会以轻柔语音播放</p>
          </div>
        </div>
      </div>
    </div>
  );
}
