import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Send, 
  MessageSquare, 
  FileText, 
  PenTool, 
  Eye,
  Sparkles,
  Brain,
  Workflow,
  Calendar,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useProjectStore } from '../store/projectStore';
import { getStatusLabel, getStatusColor } from '../utils/mockData';
import { ChatMessage } from '../types';
import { FlowchartView } from '../components/FlowchartView';
import { generateFlowchart, generateNutritionFlowchart } from '../utils/flowchartGenerator';

export const HistoryPage = () => {
  const navigate = useNavigate();
  const { projects, setChatMessages } = useProjectStore();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const selectedProject = projects.find(p => p.id === selectedProjectId);

  const sortedProjects = [...projects].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedProject?.chatMessages, selectedProjectId]);

  const handleNewProject = () => {
    navigate('/new');
  };

  const handleContinue = async () => {
    if (!inputMessage.trim() || !selectedProject) return;
    
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputMessage,
      type: 'text',
      timestamp: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    };

    const updatedMessages = [...(selectedProject.chatMessages || []), userMessage];
    setChatMessages(selectedProject.id, updatedMessages);
    setInputMessage('');
    setIsGenerating(true);

    setTimeout(() => {
      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: `收到您的消息："${inputMessage}"。我已记录下来，可以继续在需求分析或原型设计页面进行修改。`,
        type: 'text',
        timestamp: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      };
      
      const finalMessages = [...updatedMessages, assistantMessage];
      setChatMessages(selectedProject.id, finalMessages);
      setIsGenerating(false);
    }, 1500);
  };

  const renderMessageContent = (message: ChatMessage) => {
    switch (message.type) {
      case 'analysis':
        return (
          <div className="flex items-start gap-2">
            <Brain className="w-4 h-4 text-primary-600 mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm text-primary-700 font-medium mb-1">📊 需求分析完成</p>
              <p className="text-sm text-gray-700">{message.content}</p>
            </div>
          </div>
        );
      case 'prototype':
        return (
          <div className="flex items-start gap-2">
            <PenTool className="w-4 h-4 text-green-600 mt-1 flex-shrink-0" />
            <div>
              <p className="text-sm text-green-700 font-medium mb-1">🎨 原型设计完成</p>
              <p className="text-sm text-gray-700">{message.content}</p>
            </div>
          </div>
        );
      case 'flowchart':
        return (
          <div>
            <div className="flex items-start gap-2 mb-3">
              <Workflow className="w-4 h-4 text-amber-600 mt-1 flex-shrink-0" />
              <div>
                <p className="text-sm text-amber-700 font-medium mb-1">📈 流程图生成完成</p>
                <p className="text-sm text-gray-700">{message.content}</p>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-amber-100">
              {selectedProject?.id === '5' ? (
                <FlowchartView flowchart={generateNutritionFlowchart()} />
              ) : (
                selectedProject?.analysis ? (
                  <FlowchartView flowchart={generateFlowchart(selectedProject.analysis)} />
                ) : null
              )}
            </div>
          </div>
        );
      default:
        return <p className="text-sm text-gray-700 whitespace-pre-wrap">{message.content}</p>;
    }
  };

  return (
    <div className="h-screen flex bg-gray-50">
      {showSidebar && (
        <div className="w-72 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-100">
            <button
              onClick={handleNewProject}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              新建对话
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <p className="px-2 py-1 text-xs text-gray-400 font-medium uppercase tracking-wider">
              历史项目
            </p>
            {sortedProjects.map((project) => (
              <button
                key={project.id}
                onClick={() => setSelectedProjectId(project.id)}
                className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                  selectedProjectId === project.id
                    ? 'bg-primary-50 border border-primary-200'
                    : 'hover:bg-gray-50 border border-transparent'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    selectedProjectId === project.id 
                      ? 'bg-primary-100' 
                      : 'bg-gray-100'
                  }`}>
                    <MessageSquare className={`w-4 h-4 ${
                      selectedProjectId === project.id ? 'text-primary-600' : 'text-gray-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium truncate ${
                        selectedProjectId === project.id ? 'text-primary-900' : 'text-gray-900'
                      }`}>
                        {project.name}
                      </p>
                      <span className={`badge ${getStatusColor(project.status)} text-[10px]`}>
                        {getStatusLabel(project.status)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {project.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {project.createdAt}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={() => setShowSidebar(!showSidebar)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-white border border-r-0 border-gray-200 rounded-r-lg p-1 hover:bg-gray-50 transition-all"
        style={{ left: showSidebar ? '288px' : '0' }}
      >
        {showSidebar ? (
          <ChevronLeft className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronRight className="w-4 h-4 text-gray-500" />
        )}
      </button>

      <div className="flex-1 flex flex-col min-w-0">
        {selectedProject ? (
          <>
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {selectedProject.name}
                    </h2>
                    <span className={`badge ${getStatusColor(selectedProject.status)}`}>
                      {getStatusLabel(selectedProject.status)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedProject.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => navigate(`/project/${selectedProject.id}`)}
                    className="btn-secondary text-sm flex items-center gap-1"
                  >
                    <FileText className="w-4 h-4" />
                    项目详情
                  </button>
                  {selectedProject.analysis && (
                    <button 
                      onClick={() => navigate(`/project/${selectedProject.id}/analysis`)}
                      className="btn-secondary text-sm flex items-center gap-1"
                    >
                      <Brain className="w-4 h-4" />
                      需求分析
                    </button>
                  )}
                  {selectedProject.prototype && (
                    <>
                      <button 
                        onClick={() => navigate(`/project/${selectedProject.id}/prototype`)}
                        className="btn-secondary text-sm flex items-center gap-1"
                      >
                        <PenTool className="w-4 h-4" />
                        原型设计
                      </button>
                      <button 
                        onClick={() => navigate(`/project/${selectedProject.id}/preview`)}
                        className="btn-primary text-sm flex items-center gap-1"
                      >
                        <Eye className="w-4 h-4" />
                        预览
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-3xl mx-auto space-y-6">
                {(selectedProject.chatMessages || []).length > 0 ? (
                  (selectedProject.chatMessages || []).map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex gap-3 max-w-[80%] ${
                        message.role === 'user' ? 'flex-row-reverse' : ''
                      }`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          message.role === 'user' 
                            ? 'bg-primary-500' 
                            : 'bg-gradient-to-br from-primary-400 to-secondary-400'
                        }`}>
                          {message.role === 'user' ? (
                            <span className="text-white text-xs font-medium">我</span>
                          ) : (
                            <Sparkles className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className={`rounded-2xl px-4 py-3 ${
                          message.role === 'user'
                            ? 'bg-primary-500 text-white rounded-tr-sm'
                            : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm'
                        }`}>
                          {renderMessageContent(message)}
                          <p className={`text-xs mt-2 ${
                            message.role === 'user' ? 'text-primary-200' : 'text-gray-400'
                          }`}>
                            {message.timestamp}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <MessageSquare className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无对话记录</h3>
                    <p className="text-gray-500">可以在下方输入框开始对话</p>
                  </div>
                )}
                
                {isGenerating && (
                  <div className="flex justify-start">
                    <div className="flex gap-3 max-w-[80%]">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center flex-shrink-0">
                        <Sparkles className="w-4 h-4 text-white" />
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
                      placeholder="继续沟通需求，或者直接告诉我要修改什么..."
                      rows={2}
                      className="input-field resize-none pr-12"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleContinue();
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={handleContinue}
                    disabled={!inputMessage.trim() || isGenerating}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed self-end"
                  >
                    <Send className="w-4 h-4" />
                    发送
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2 text-center">
                  按 Enter 发送，Shift + Enter 换行
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-primary-100 to-secondary-100 flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-primary-500" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">历史沟通记录</h2>
              <p className="text-gray-500 mb-6 max-w-md">
                选择左侧项目查看沟通记录，或创建新项目开始新的对话
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={handleNewProject}
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  新建项目
                </button>
                {sortedProjects.length > 0 && (
                  <button
                    onClick={() => setSelectedProjectId(sortedProjects[0].id)}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    查看最近项目
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
