import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStories } from '@/hooks/useStories';

export default function Records() {
  const navigate = useNavigate();
  const { stories, getStats } = useStories();
  const stats = getStats();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    } catch {
      return d;
    }
  };

  return (
    <div className="page overflow-hidden">
      <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-[#FFEAD6] opacity-50 pointer-events-none" />

      {/* 导航栏 */}
      <div className="flex items-center justify-between mb-6 relative">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-3 py-2 bg-white rounded-2xl shadow-sm hover:shadow-md active:scale-95 transition-all duration-200"
        >
          <span className="text-gray-500">←</span>
          <span className="text-sm font-medium text-gray-600">返回首页</span>
        </button>
        <button
          onClick={() => navigate('/record')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-medium transition-all duration-200 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #FFC078, #FFA94D)', color: 'white', boxShadow: '0 2px 8px rgba(255,169,77,0.3)' }}
        >
          <span>✨</span> 分享经历
        </button>
      </div>

      {/* 标题 */}
      <div className="text-center mb-6 relative">
        <div className="flex justify-center mb-3">
        <img
          src="/images/warm-cat.jpg"
          alt="温馨猫咪"
          className="w-32 h-32 rounded-3xl object-cover"
          style={{ boxShadow: '0 4px 16px rgba(255,169,77,0.2)' }}
        />
      </div>
        <h1 className="text-2xl font-extrabold text-gray-800 mb-1">找猫故事集</h1>
        <p className="text-sm text-gray-400">每一次找回，都是爱的奇迹</p>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-3 gap-2.5 mb-6">
        <div className="rounded-2xl p-3.5 text-center"
          style={{ background: 'linear-gradient(135deg, #FFF0F0, #FFE8E8)' }}>
          <div className="text-lg mb-0.5">😺</div>
          <div className="text-xl font-extrabold" style={{ color: '#E85A4F' }}>{stats.total}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">成功找回</div>
        </div>
        <div className="rounded-2xl p-3.5 text-center"
          style={{ background: 'linear-gradient(135deg, #FFF5EB, #FFEAD6)' }}>
          <div className="text-lg mb-0.5">🕐</div>
          <div className="text-xl font-extrabold" style={{ color: '#E89B4F' }}>{stats.avgDuration}h</div>
          <div className="text-[10px] text-gray-500 mt-0.5">平均时长</div>
        </div>
        <div className="rounded-2xl p-3.5 text-center"
          style={{ background: 'linear-gradient(135deg, #E8F8F0, #D0F5E4)' }}>
          <div className="text-lg mb-0.5">📍</div>
          <div className="text-xl font-extrabold" style={{ color: '#3DD598' }}>{stats.avgDistance}m</div>
          <div className="text-[10px] text-gray-500 mt-0.5">平均距离</div>
        </div>
      </div>

      {/* 故事列表 */}
      {stories.length === 0 ? (
        <div className="card text-center py-10">
          <div className="text-5xl mb-3">🐱</div>
          <p className="text-gray-500">还没有故事，快来分享第一个吧！</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {stories.map((story, idx) => (
            <div key={story.id} className="card animate-fade-in"
              style={{ animationDelay: `${idx * 80}ms` }}>
              {/* 头部 */}
              <div className="flex items-center gap-2 mb-4">
                <span className="text-3xl">{['🐱', '😺', '😸', '😻'][idx % 4]}</span>
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-800">{story.catName}</h3>
                  {story.catFeatures && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium mt-0.5"
                      style={{ background: '#FFF5EB', color: '#E89B4F' }}>
                      {story.catFeatures}
                    </span>
                  )}
                </div>
              </div>

              {/* 位置信息 */}
              <div className="space-y-2 mb-4">
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-gray-400 mt-0.5">📍</span>
                  <div className="flex-1">
                    <span className="text-gray-500">走失地点：</span>
                    <span className="text-gray-700">{story.lostLocation}</span>
                    <span className="text-gray-400 ml-2">{formatDate(story.lostTime)}</span>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-gray-400 mt-0.5">🎉</span>
                  <div className="flex-1">
                    <span className="text-gray-500">找回地点：</span>
                    <span className="text-gray-700">{story.foundLocation}</span>
                    <span className="text-gray-400 ml-2">{formatDate(story.foundTime)}</span>
                  </div>
                </div>
              </div>

              {/* 展开按钮 */}
              <button
                onClick={() => toggleExpand(story.id)}
                className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-xl transition-all duration-200"
                style={{ background: '#F5F5F5', color: '#666' }}
              >
                {expanded[story.id] ? '收起留言' : '查看留言'}
                <span className={`transition-transform duration-200 ${expanded[story.id] ? 'rotate-180' : ''}`}>
                  ▼
                </span>
              </button>

              {/* 展开内容 */}
              <div className={`overflow-hidden transition-all duration-300 ${expanded[story.id] ? 'max-h-96 mt-3' : 'max-h-0'}`}>
                {story.story && (
                  <div className="flex items-start gap-2 p-4 rounded-2xl mb-2" style={{ background: '#FFF5F0' }}>
                    <span className="text-gray-400 mt-0.5">💬</span>
                    <p className="text-sm text-gray-700 leading-relaxed">{story.story}</p>
                  </div>
                )}
                {story.distance && (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-2xl" style={{ background: '#FFF5EB' }}>
                    <span>📏</span>
                    <span className="text-sm text-gray-600">距离 <strong style={{ color: '#E89B4F' }}>{story.distance}米</strong></span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-center text-sm text-gray-400 mt-6">
        💡 每一个故事都在点亮希望，感谢分享！
      </p>

      <div className="h-8" />
    </div>
  );
}