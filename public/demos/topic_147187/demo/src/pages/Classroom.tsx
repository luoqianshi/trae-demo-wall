import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { VideoGrid } from '../components/video/VideoGrid';
import { VideoControls } from '../components/video/VideoControls';
import { Whiteboard } from '../components/whiteboard/Whiteboard';
import { ToolPanel } from '../components/tools/ToolPanel';
import { AIAssistant } from '../components/ai/AIAssistant';
import { useClassroomStore } from '../stores/classroomStore';
import { Video, PenTool, Bot, ChevronLeft, Users, Clock, MoreVertical, X } from 'lucide-react';

type ViewMode = 'video' | 'whiteboard' | 'ai';

export const Classroom = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { classrooms } = useClassroomStore();
  const [viewMode, setViewMode] = useState<ViewMode>('video');
  const [showTools, setShowTools] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const classroom = classrooms.find((c) => c.id === id);

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === 'ai') setShowAI(true);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 relative">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-200" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-gray-800 dark:text-white truncate">{classroom?.name || '课堂'}</h2>
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {classroom?.participantCount}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {classroom?.startTime?.split(' ')[1]}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <MoreVertical className="w-5 h-5 text-gray-700 dark:text-gray-200" />
        </button>
      </header>

      {showMoreMenu && (
        <div className="absolute right-4 top-14 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 py-2 z-30 min-w-[140px]">
          <button
            onClick={() => { setShowTools(true); setShowMoreMenu(false); }}
            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            学习工具
          </button>
          <button
            onClick={() => { setShowAI(true); setShowMoreMenu(false); setViewMode('ai'); }}
            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            AI助手
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            离开课堂
          </button>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto p-3 lg:p-4 pb-20">
          {viewMode === 'video' && (
            <div className="lg:flex lg:gap-4 lg:h-full">
              <div className="lg:flex-1">
                <VideoGrid classroomId={id || ''} />
              </div>
              <div className="hidden lg:block w-80">
                <ToolPanel />
              </div>
            </div>
          )}
          {viewMode === 'whiteboard' && (
            <div className="h-full bg-gray-800 rounded-xl overflow-hidden">
              <Whiteboard />
            </div>
          )}
          {viewMode === 'ai' && (
            <div className="h-full">
              <AIAssistant onClose={() => setViewMode('video')} />
            </div>
          )}
        </div>
      </div>

      {viewMode === 'video' && <VideoControls onLeave={() => navigate('/')} />}

      <nav className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-50">
        <div className="grid grid-cols-4 h-16">
          {[
            { id: 'video' as ViewMode, icon: Video, label: '视频' },
            { id: 'whiteboard' as ViewMode, icon: PenTool, label: '白板' },
            { id: 'ai' as ViewMode, icon: Bot, label: 'AI' },
            { id: 'tools' as const, icon: MoreVertical, label: '工具' },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = item.id === 'tools' ? showTools : viewMode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'tools') {
                    setShowTools(true);
                  } else {
                    setShowTools(false);
                    handleViewChange(item.id);
                  }
                }}
                className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                  isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <div className={`p-1.5 rounded-xl transition-all ${
                  isActive ? 'bg-indigo-100 dark:bg-indigo-900/50' : ''
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {showTools && (
        <div className="absolute inset-0 bg-black/50 z-40" onClick={() => setShowTools(false)}>
          <div
            className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-gray-800 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-800 dark:text-white">学习工具</h3>
              <button
                onClick={() => setShowTools(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="h-[calc(100%-60px)]">
              <ToolPanel />
            </div>
          </div>
        </div>
      )}

      {showAI && viewMode !== 'ai' && (
        <div className="absolute inset-0 bg-black/50 z-40 flex items-end" onClick={() => setShowAI(false)}>
          <div
            className="w-full h-[85vh] bg-white dark:bg-gray-800 rounded-t-2xl shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mt-2"></div>
            <div className="flex-1 overflow-hidden">
              <AIAssistant onClose={() => setShowAI(false)} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};