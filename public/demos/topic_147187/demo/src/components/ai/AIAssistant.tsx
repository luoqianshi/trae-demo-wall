import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, ChevronDown, Check } from 'lucide-react';
import { aiService } from '../../api/services';
import type { AIProviderInfo, AIProvider } from '../../api/types';

const DEFAULT_PROVIDER: AIProvider = 'deepseek';

export const AIAssistant = ({ onClose }: { onClose: () => void }) => {
  const [messages, setMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: string; provider?: AIProvider }>>([
    {
      id: '1',
      role: 'assistant',
      content: '你好！我是远程辅导软件AI助手，我可以帮你解答各学科问题。请问有什么可以帮你的吗？',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [providers, setProviders] = useState<AIProviderInfo[]>([]);
  const [currentProvider, setCurrentProvider] = useState<AIProvider>(DEFAULT_PROVIDER);
  const [showProviderMenu, setShowProviderMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const providerMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (providerMenuRef.current && !providerMenuRef.current.contains(e.target as Node)) {
        setShowProviderMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    aiService.getProviders().then((res) => {
      if (res.code === 0) {
        setProviders(res.data);
      }
    }).catch((e) => console.warn('Failed to fetch providers', e));
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user' as const,
      content: input.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const text = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      const res = await aiService.chat({
        messages: [
          ...messages.map((m) => ({ id: m.id, role: m.role, content: m.content })),
          { id: userMessage.id, role: 'user', content: text },
        ],
        provider: currentProvider,
      });

      if (res.code === 0) {
        const aiMessage = {
          id: res.data.message.id,
          role: 'assistant' as const,
          content: res.data.message.content,
          timestamp: new Date().toLocaleTimeString(),
          provider: currentProvider,
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error(res.message || '请求失败');
      }
    } catch (e: any) {
      const errMessage = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'assistant' as const,
        content: `⚠️ ${e.message || '请求失败，请稍后再试'}`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const currentProviderInfo = providers.find((p) => p.id === currentProvider);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white">AI学习助手</h3>
            <p className="text-xs text-green-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
              在线
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={providerMenuRef}>
            <button
              onClick={() => setShowProviderMenu(!showProviderMenu)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <span className="font-medium">{currentProviderInfo?.name || 'DeepSeek'}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {showProviderMenu && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 p-1 z-50 max-h-72 overflow-auto">
                {providers.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => { setCurrentProvider(p.id); setShowProviderMenu(false); }}
                    className={`w-full flex items-start gap-2 px-3 py-2 text-xs rounded-lg text-left transition-colors ${
                      currentProvider === p.id
                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium flex items-center gap-1">
                        {p.name}
                        {currentProvider === p.id && <Check className="w-3 h-3" />}
                      </div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{p.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto bg-gray-50 dark:bg-gray-900">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                  message.role === 'user'
                    ? 'bg-indigo-600'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500'
                }`}
              >
                {message.role === 'user' ? (
                  <span className="text-white text-xs font-bold">U</span>
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>

              <div
                className={`max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-xl rounded-tr-sm'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-xl rounded-tl-sm shadow-sm border border-gray-100 dark:border-gray-700'
                }`}
              >
                <div className="p-3 whitespace-pre-wrap text-sm leading-relaxed">
                  {message.content}
                </div>
                <div
                  className={`px-3 pb-2 text-[10px] flex items-center gap-2 ${
                    message.role === 'user' ? 'text-indigo-200' : 'text-gray-400'
                  }`}
                >
                  <span>{message.timestamp}</span>
                  {message.provider && message.role === 'assistant' && (
                    <span className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 rounded">
                      {providers.find((p) => p.id === message.provider)?.name}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex-shrink-0 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl rounded-tl-sm shadow-sm px-4 py-3 border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-spin" />
                  <span className="text-gray-500 dark:text-gray-400 text-sm">
                    {providers.find((p) => p.id === currentProvider)?.name}思考中...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入问题，AI助手为你解答..."
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-800 dark:text-white disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-medium hover:from-indigo-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-xs text-gray-400">快捷问题：</span>
          {['什么是分数', '英语怎么学', '数学应用题思路'].map((question) => (
            <button
              key={question}
              onClick={() => {
                setInput(question);
                handleSend();
              }}
              disabled={isLoading}
              className="px-2.5 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
