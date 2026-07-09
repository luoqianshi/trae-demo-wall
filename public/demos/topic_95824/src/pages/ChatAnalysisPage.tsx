import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  Send, 
  Sparkles, 
  Bookmark, 
  Lightbulb, 
  Quote,
  Highlighter,
  Trash2,
  Plus,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { Header } from '../components/Layout/Header';
import { ChatMessage, Bookmark as BookmarkType, ExtractedContent } from '../types';
import { analyzeRequirement } from '../utils/analyzer';

export const ChatAnalysisPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'sys1',
      role: 'assistant',
      content: '您好！我是您的需求分析助手。请描述您的项目需求，我会帮您分析功能点、用户故事和业务规则。',
      type: 'text',
      timestamp: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [extractedContents, setExtractedContents] = useState<ExtractedContent[]>([]);
  const [showBookmarkMenu, setShowBookmarkMenu] = useState(false);
  const [bookmarkTarget, setBookmarkTarget] = useState<{ messageId: string; text: string } | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputMessage.trim() || isGenerating) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputMessage,
      type: 'text',
      timestamp: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsGenerating(true);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const analysis = analyzeRequirement(inputMessage);
    const analysisContent = `
根据您的需求，我分析出以下内容：

📋 **功能点**：
${analysis.features.map(f => `- ${f.name}: ${f.description} (优先级: ${f.priority === 'high' ? '高' : f.priority === 'medium' ? '中' : '低'})`).join('\n')}

👥 **用户故事**：
${analysis.userStories.map(us => `- ${us.role}想要${us.want}，以便${us.reason}`).join('\n')}

📜 **业务规则**：
${analysis.businessRules.map(r => `- ${r}`).join('\n')}

💾 **数据实体**：
${analysis.entities.map(e => `- ${e.name}: ${e.attributes.map(a => a.name).join(', ')}`).join('\n')}

您可以对上面的内容进行标记，或者告诉我需要修改什么。
    `.trim();

    const analysisMessage: ChatMessage = {
      id: `msg_${Date.now() + 1}`,
      role: 'assistant',
      content: analysisContent,
      type: 'analysis',
      timestamp: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    };

    setMessages(prev => [...prev, analysisMessage]);

    const newContents: ExtractedContent[] = [
      ...analysis.features.map(f => ({
        id: `ec_${Date.now()}_${f.id}`,
        title: f.name,
        content: f.description,
        type: 'feature' as const,
        sourceMessageId: analysisMessage.id,
        createdAt: new Date().toISOString(),
      })),
      ...analysis.businessRules.map((rule, idx) => ({
        id: `ec_${Date.now()}_rule_${idx}`,
        title: `业务规则 ${idx + 1}`,
        content: rule,
        type: 'business_rule' as const,
        sourceMessageId: analysisMessage.id,
        createdAt: new Date().toISOString(),
      })),
    ];

    setExtractedContents(prev => [...prev, ...newContents]);
    setIsGenerating(false);
  };

  const handleBookmark = (type: 'highlight' | 'knowledge' | 'quote', messageId: string, text: string) => {
    const bookmark: BookmarkType = {
      id: `bm_${Date.now()}`,
      type,
      label: type === 'highlight' ? '重点标记' : type === 'knowledge' ? '知识点' : '摘抄',
      content: text,
      timestamp: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    };

    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, bookmarks: [...(msg.bookmarks || []), bookmark] }
        : msg
    ));

    if (type === 'knowledge' || type === 'quote') {
      const extracted: ExtractedContent = {
        id: `ec_${Date.now()}`,
        title: bookmark.label,
        content: text,
        type: type === 'knowledge' ? 'knowledge' : 'user_story',
        sourceMessageId: messageId,
        createdAt: new Date().toISOString(),
      };
      setExtractedContents(prev => [...prev, extracted]);
    }

    setShowBookmarkMenu(false);
    setBookmarkTarget(null);
  };

  const removeExtractedContent = (id: string) => {
    setExtractedContents(prev => prev.filter(ec => ec.id !== id));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feature':
        return <Sparkles className="w-3 h-3 text-primary-500" />;
      case 'business_rule':
        return <Bookmark className="w-3 h-3 text-amber-500" />;
      case 'knowledge':
        return <Lightbulb className="w-3 h-3 text-blue-500" />;
      case 'user_story':
        return <Quote className="w-3 h-3 text-green-500" />;
      default:
        return <Sparkles className="w-3 h-3 text-gray-500" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'feature':
        return 'bg-primary-50 border-primary-200 text-primary-700';
      case 'business_rule':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'knowledge':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'user_story':
        return 'bg-green-50 border-green-200 text-green-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const handleStartPrototype = () => {
    navigate('/chat-prototype');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="需求分析" subtitle="通过对话进行需求分析，标记关键知识点" />
      
      <main className="flex h-[calc(100vh-80px)]">
        <div className="flex-1 flex flex-col border-r border-gray-200">
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.role === 'user'
                        ? 'bg-primary-500'
                        : 'bg-gradient-to-br from-primary-400 to-secondary-400'
                    }`}>
                      {message.role === 'user' ? (
                        <span className="text-white text-xs font-medium">我</span>
                      ) : (
                        <Brain className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className={`rounded-2xl px-4 py-3 relative ${
                      message.role === 'user'
                        ? 'bg-primary-500 text-white rounded-tr-sm'
                        : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm'
                    }`}>
                      {(message.type === 'analysis' || message.type === 'prototype') && (
                        <button
                          onClick={() => {
                            setBookmarkTarget({ messageId: message.id, text: message.content });
                            setShowBookmarkMenu(true);
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Bookmark className={`w-4 h-4 ${message.role === 'user' ? 'text-white/70' : 'text-gray-400'}`} />
                        </button>
                      )}
                      <div className="whitespace-pre-wrap text-sm">
                        {message.content}
                      </div>
                      <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-primary-200' : 'text-gray-400'}`}>
                        {message.timestamp}
                      </p>
                      {message.bookmarks && message.bookmarks.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <div className="flex flex-wrap gap-1">
                            {message.bookmarks.slice(0, 3).map((bm) => (
                              <span
                                key={bm.id}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                                  bm.type === 'highlight' ? 'bg-yellow-100 text-yellow-700' :
                                  bm.type === 'knowledge' ? 'bg-blue-100 text-blue-700' :
                                  'bg-green-100 text-green-700'
                                }`}
                              >
                                {bm.type === 'highlight' ? <Highlighter className="w-3 h-3" /> :
                                 bm.type === 'knowledge' ? <Lightbulb className="w-3 h-3" /> :
                                 <Quote className="w-3 h-3" />}
                                {bm.label}
                              </span>
                            ))}
                            {message.bookmarks.length > 3 && (
                              <span className="text-xs text-gray-400">+{message.bookmarks.length - 3}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center flex-shrink-0">
                      <Brain className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white border border-gray-200 text-gray-900 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>
          </div>

          <div className="bg-white border-t border-gray-200 p-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="请描述您的项目需求，例如：我需要一个在线商城系统..."
                    rows={2}
                    className="input-field resize-none pr-12"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!inputMessage.trim() || isGenerating}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed self-end"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {isGenerating ? '分析中...' : '发送'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                按 Enter 发送，Shift + Enter 换行
              </p>
            </div>
          </div>
        </div>

        <div className="w-80 bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-primary-500" />
              标记与摘抄
            </h3>
            <p className="text-xs text-gray-500 mt-1">共 {extractedContents.length} 条记录</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {extractedContents.length > 0 ? (
              extractedContents.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border ${getTypeColor(item.type)} group`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(item.type)}
                      <span className="text-xs font-medium">{item.title}</span>
                    </div>
                    <button
                      onClick={() => removeExtractedContent(item.id)}
                      className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-white/50 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-xs line-clamp-3">{item.content}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gray-100 flex items-center justify-center">
                  <Bookmark className="w-6 h-6 text-gray-300" />
                </div>
                <p className="text-sm text-gray-500">暂无标记内容</p>
                <p className="text-xs text-gray-400 mt-1">点击消息右上角的书签图标进行标记</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleStartPrototype}
              disabled={extractedContents.length === 0}
              className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
              生成原型
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {showBookmarkMenu && bookmarkTarget && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowBookmarkMenu(false)}>
            <div className="bg-white rounded-xl p-4 w-72 shadow-xl" onClick={e => e.stopPropagation()}>
              <h4 className="font-semibold text-gray-900 mb-3">选择标记类型</h4>
              <div className="space-y-2">
                <button
                  onClick={() => handleBookmark('highlight', bookmarkTarget.messageId, bookmarkTarget.text.substring(0, 100) + '...')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-yellow-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                    <Highlighter className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">重点标记</p>
                    <p className="text-xs text-gray-500">标记重要内容</p>
                  </div>
                </button>
                <button
                  onClick={() => handleBookmark('knowledge', bookmarkTarget.messageId, bookmarkTarget.text.substring(0, 100) + '...')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Lightbulb className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">知识点</p>
                    <p className="text-xs text-gray-500">记录业务知识点</p>
                  </div>
                </button>
                <button
                  onClick={() => handleBookmark('quote', bookmarkTarget.messageId, bookmarkTarget.text.substring(0, 100) + '...')}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-green-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <Quote className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">摘抄</p>
                    <p className="text-xs text-gray-500">摘抄关键内容</p>
                  </div>
                </button>
              </div>
              <button
                onClick={() => setShowBookmarkMenu(false)}
                className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
