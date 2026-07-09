import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PenTool, 
  Send, 
  Sparkles, 
  Eye,
  Palette,
  Layout,
  Plus,
  Loader2,
  ArrowLeft,
  RefreshCw,
  Download
} from 'lucide-react';
import { Header } from '../components/Layout/Header';
import { ChatMessage, Prototype, Component } from '../types';
import { componentLibrary } from '../utils/mockData';

const generateDefaultPrototype = (): Prototype => ({
  id: `proto_${Date.now()}`,
  pages: [
    {
      id: 'page1',
      name: '首页',
      components: [
        { id: 'c1', type: 'navigation', props: { title: '项目首页' }, style: { width: '100%', height: '60px' }, position: { x: 0, y: 0 } },
        { id: 'c2', type: 'card', props: { title: '功能模块', items: ['功能A', '功能B', '功能C'] }, style: { width: '300px', height: '180px' }, position: { x: 50, y: 100 } },
        { id: 'c3', type: 'card', props: { title: '统计数据', items: ['数据1', '数据2', '数据3'] }, style: { width: '300px', height: '180px' }, position: { x: 400, y: 100 } },
        { id: 'c4', type: 'button', props: { title: '立即开始', variant: 'primary' }, style: { width: '150px', height: '40px' }, position: { x: 50, y: 320 } },
      ],
    },
  ],
  theme: { primaryColor: '#6366f1', secondaryColor: '#f97316', fontFamily: 'Inter', borderRadius: '8px' },
});

export const ChatPrototypePage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'sys1',
      role: 'assistant',
      content: '您好！我是您的原型设计助手。右侧是当前原型预览，您可以通过对话告诉我需要调整什么，比如：\n\n• 修改主题颜色为绿色\n• 添加一个按钮\n• 将卡片移到右边\n• 修改标题文字',
      type: 'text',
      timestamp: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [prototype, setPrototype] = useState<Prototype>(generateDefaultPrototype());
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
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

    let response = '已收到您的修改请求，我来帮您调整原型。';
    let newPrototype = { ...prototype };

    const request = inputMessage.toLowerCase();

    if (request.includes('绿色') || request.includes('green')) {
      newPrototype = {
        ...newPrototype,
        theme: { ...newPrototype.theme, primaryColor: '#10b981', secondaryColor: '#f59e0b' },
      };
      response = '已将主题颜色修改为绿色系！';
    } else if (request.includes('蓝色') || request.includes('blue')) {
      newPrototype = {
        ...newPrototype,
        theme: { ...newPrototype.theme, primaryColor: '#6366f1', secondaryColor: '#f97316' },
      };
      response = '已将主题颜色修改为蓝色系！';
    } else if (request.includes('红色') || request.includes('red')) {
      newPrototype = {
        ...newPrototype,
        theme: { ...newPrototype.theme, primaryColor: '#ef4444', secondaryColor: '#f97316' },
      };
      response = '已将主题颜色修改为红色系！';
    } else if (request.includes('添加按钮') || request.includes('增加按钮')) {
      const newButton: Component = {
        id: `btn_${Date.now()}`,
        type: 'button',
        props: { title: '新按钮', variant: 'primary' },
        style: { width: '120px', height: '40px' },
        position: { x: 50, y: prototype.pages[0].components.length * 80 + 100 },
      };
      newPrototype = {
        ...newPrototype,
        pages: [{
          ...newPrototype.pages[0],
          components: [...newPrototype.pages[0].components, newButton],
        }],
      };
      response = '已添加一个新按钮！';
    } else if (request.includes('添加卡片') || request.includes('增加卡片')) {
      const newCard: Component = {
        id: `card_${Date.now()}`,
        type: 'card',
        props: { title: '新卡片', items: ['项目1', '项目2', '项目3'] },
        style: { width: '250px', height: '150px' },
        position: { x: 400 + (prototype.pages[0].components.filter(c => c.type === 'card').length * 50), y: 100 },
      };
      newPrototype = {
        ...newPrototype,
        pages: [{
          ...newPrototype.pages[0],
          components: [...newPrototype.pages[0].components, newCard],
        }],
      };
      response = '已添加一个新卡片！';
    } else if (request.includes('修改标题') || request.includes('更改标题')) {
      newPrototype = {
        ...newPrototype,
        pages: [{
          ...newPrototype.pages[0],
          components: newPrototype.pages[0].components.map(c =>
            c.type === 'navigation' ? { ...c, props: { ...c.props, title: '更新后的标题' } } : c
          ),
        }],
      };
      response = '已更新页面标题！';
    } else if (request.includes('添加表格') || request.includes('增加表格')) {
      const newTable: Component = {
        id: `table_${Date.now()}`,
        type: 'table',
        props: { 
          title: '数据表格', 
          columns: ['姓名', '部门', '状态'],
          data: [['张三', '技术部', '在职'], ['李四', '产品部', '在职']]
        },
        style: { width: '600px', height: '200px' },
        position: { x: 50, y: 380 },
      };
      newPrototype = {
        ...newPrototype,
        pages: [{
          ...newPrototype.pages[0],
          components: [...newPrototype.pages[0].components, newTable],
        }],
      };
      response = '已添加一个数据表格！';
    } else if (request.includes('圆角') || request.includes('border')) {
      newPrototype = {
        ...newPrototype,
        theme: { ...newPrototype.theme, borderRadius: '16px' },
      };
      response = '已增大圆角大小！';
    } else if (request.includes('恢复') || request.includes('reset')) {
      newPrototype = generateDefaultPrototype();
      response = '已恢复原型到初始状态！';
    } else {
      response = `理解您的需求："${inputMessage}"。我会根据您的描述进行相应调整。\n\n当前原型包含：\n• ${prototype.pages[0].components.length} 个组件\n• 主题颜色：${prototype.theme.primaryColor}\n• 圆角大小：${prototype.theme.borderRadius}`;
    }

    setPrototype(newPrototype);

    const assistantMessage: ChatMessage = {
      id: `msg_${Date.now() + 1}`,
      role: 'assistant',
      content: response,
      type: 'prototype',
      timestamp: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    };

    setMessages(prev => [...prev, assistantMessage]);
    setIsGenerating(false);
  };

  const renderComponent = (component: Component) => {
    const isSelected = selectedComponentId === component.id;
    const theme = prototype.theme;

    switch (component.type) {
      case 'navigation':
        return (
          <div
            key={component.id}
            onClick={() => setSelectedComponentId(component.id)}
            className={`absolute w-full bg-white border-b border-gray-200 flex items-center px-6 ${isSelected ? 'ring-2 ring-primary-500' : ''}`}
            style={{ ...component.style, top: component.position.y }}
          >
            <span className="font-semibold text-gray-900">{String(component.props.title || '导航')}</span>
          </div>
        );
      case 'card':
        return (
          <div
            key={component.id}
            onClick={() => setSelectedComponentId(component.id)}
            className={`absolute bg-white rounded-lg border border-gray-200 shadow-sm p-4 ${isSelected ? 'ring-2 ring-primary-500' : ''}`}
            style={{ 
              ...component.style, 
              left: component.position.x, 
              top: component.position.y,
              borderRadius: theme.borderRadius 
            }}
          >
            <h4 className="font-semibold text-gray-900 mb-3">{String(component.props.title || '')}</h4>
            <ul className="space-y-2">
              {(component.props.items as string[] | undefined)?.map((item, idx) => (
                <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.primaryColor }}></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        );
      case 'button':
        return (
          <button
            key={component.id}
            onClick={() => setSelectedComponentId(component.id)}
            className={`absolute rounded-lg font-medium flex items-center justify-center ${
              component.props.variant === 'primary'
                ? 'text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            } ${isSelected ? 'ring-2 ring-primary-500' : ''}`}
            style={{ 
              ...component.style, 
              left: component.position.x, 
              top: component.position.y,
              backgroundColor: component.props.variant === 'primary' ? theme.primaryColor : undefined,
              borderRadius: theme.borderRadius 
            }}
          >
            {String(component.props.title || '按钮')}
          </button>
        );
      case 'table':
        return (
          <div
            key={component.id}
            onClick={() => setSelectedComponentId(component.id)}
            className={`absolute bg-white rounded-lg border border-gray-200 shadow-sm p-4 ${isSelected ? 'ring-2 ring-primary-500' : ''}`}
            style={{ 
              ...component.style, 
              left: component.position.x, 
              top: component.position.y,
              borderRadius: theme.borderRadius 
            }}
          >
            <h4 className="font-semibold text-gray-900 mb-3">{String(component.props.title || '表格')}</h4>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  {(component.props.columns as string[] | undefined)?.map((col, idx) => (
                    <th key={idx} className="text-left py-2 px-2 text-gray-500">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(component.props.data as string[][] | undefined)?.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    {row.map((cell, cidx) => (
                      <td key={cidx} className="py-2 px-2 text-gray-700">{cell}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      default:
        return (
          <div
            key={component.id}
            onClick={() => setSelectedComponentId(component.id)}
            className={`absolute bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex items-center justify-center ${isSelected ? 'ring-2 ring-primary-500' : ''}`}
            style={{ 
              ...component.style, 
              left: component.position.x, 
              top: component.position.y,
              borderRadius: theme.borderRadius 
            }}
          >
            <span className="text-sm text-gray-500">{component.type}</span>
          </div>
        );
    }
  };

  const handleBack = () => {
    navigate('/chat-analysis');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        title="原型设计" 
        subtitle="通过对话调整原型，实时预览效果"
        leftButton={
          <button onClick={handleBack} className="btn-secondary flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            返回需求分析
          </button>
        }
      />
      
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
                        <PenTool className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className={`rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary-500 text-white rounded-tr-sm'
                        : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm'
                    }`}>
                      <div className="whitespace-pre-wrap text-sm">
                        {message.content}
                      </div>
                      <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-primary-200' : 'text-gray-400'}`}>
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="flex gap-3 max-w-[85%]">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center flex-shrink-0">
                      <PenTool className="w-4 h-4 text-white" />
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
                    placeholder="告诉您想如何调整原型，例如：修改主题颜色为绿色、添加一个按钮..."
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
                  {isGenerating ? '调整中...' : '发送'}
                </button>
              </div>
              <div className="flex items-center justify-center gap-4 mt-2">
                <span className="text-xs text-gray-400">试试说：</span>
                <button onClick={() => setInputMessage('修改主题颜色为绿色')} className="text-xs text-primary-500 hover:text-primary-700">修改绿色主题</button>
                <span className="text-xs text-gray-400">|</span>
                <button onClick={() => setInputMessage('添加一个按钮')} className="text-xs text-primary-500 hover:text-primary-700">添加按钮</button>
                <span className="text-xs text-gray-400">|</span>
                <button onClick={() => setInputMessage('添加一个卡片')} className="text-xs text-primary-500 hover:text-primary-700">添加卡片</button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-[500px] bg-white flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary-500" />
                原型预览
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPrototype(generateDefaultPrototype())}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="重置"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="下载">
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <div 
              className="relative bg-gray-50 rounded-xl overflow-hidden"
              style={{ 
                width: '100%', 
                minHeight: '600px',
                backgroundColor: '#f9fafb'
              }}
            >
              {prototype.pages[0].components.map(renderComponent)}
            </div>
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center gap-4 mb-3">
              <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
                <Palette className="w-4 h-4" />
                主题颜色
              </button>
              <div className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: prototype.theme.primaryColor }}
                ></div>
                <span className="text-xs text-gray-500">{prototype.theme.primaryColor}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-800">
                <Layout className="w-4 h-4" />
                组件数量
              </button>
              <span className="text-sm font-medium text-gray-900">{prototype.pages[0].components.length} 个</span>
              <span className="text-xs text-gray-400 ml-auto">点击组件选中</span>
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <p className="text-xs text-gray-500 mb-2">可用命令示例：</p>
            <div className="flex flex-wrap gap-2">
              {['修改绿色主题', '添加按钮', '添加卡片', '添加表格', '修改标题', '增大圆角', '恢复默认'].map(cmd => (
                <button
                  key={cmd}
                  onClick={() => setInputMessage(cmd)}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs text-gray-600 hover:text-gray-800 hover:border-gray-300 transition-colors"
                >
                  {cmd}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
