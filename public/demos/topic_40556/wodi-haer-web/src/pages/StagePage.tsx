import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { getStageByKey, stages } from '../data/stages';
import { getArticlesByStage } from '../data/knowledge';

function StagePage() {
  const { stageKey } = useParams<{ stageKey: string }>();
  const stage = getStageByKey(stageKey || '');
  const [activeTab, setActiveTab] = useState<'modules' | 'timeline' | 'tips' | 'knowledge'>('modules');

  if (!stage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-2xl text-text-secondary mb-4">阶段不存在</p>
          <Link to="/" className="btn btn-primary">返回首页</Link>
        </div>
      </div>
    );
  }

  const stageArticles = getArticlesByStage(stage.key);

  const tabs = [
    { key: 'modules' as const, label: '功能模块', icon: '📦' },
    { key: 'timeline' as const, label: '时间线', icon: '📅' },
    { key: 'tips' as const, label: '实用贴士', icon: '💡' },
    { key: 'knowledge' as const, label: '相关知识', icon: '📚' },
  ];

  return (
    <div className="min-h-screen">
      {/* 阶段头部 */}
      <div className={`bg-gradient-to-br ${stage.gradient} px-6 py-10 text-center`}>
        <Link to="/" className="inline-block text-sm text-text-secondary hover:text-text-primary mb-4">
          ‹ 返回首页
        </Link>
        <div className="text-6xl mb-3">{stage.icon}</div>
        <h1 className="text-3xl font-bold text-text-primary mb-2">{stage.name}</h1>
        <p className="text-base text-text-secondary mb-2">{stage.slogan}</p>
        <span className="inline-block px-4 py-1 bg-white/60 rounded-full text-sm text-text-secondary">
          {stage.duration}
        </span>
        <p className="text-sm text-text-secondary mt-4 max-w-md mx-auto">{stage.description}</p>
      </div>

      {/* 阶段切换 */}
      <div className="flex gap-2 px-6 py-4 overflow-x-auto bg-white/50">
        {stages.map((s) => (
          <Link
            key={s.key}
            to={`/stage/${s.key}`}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
              s.key === stage.key
                ? 'bg-gradient-to-r from-soft-blue to-light-blue text-text-primary font-medium shadow-md'
                : 'bg-white text-text-secondary hover:bg-cream'
            }`}
          >
            {s.icon} {s.name}
          </Link>
        ))}
      </div>

      <div className="px-6 py-6">
        {/* Tab切换 */}
        <div className="flex gap-2 mb-6 bg-white rounded-2xl p-2 shadow-lg">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-gradient-to-r from-soft-blue to-light-blue text-text-primary shadow-md'
                  : 'text-text-secondary hover:bg-cream'
              }`}
            >
              <span className="mr-1">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* 功能模块 */}
        {activeTab === 'modules' && (
          <div className="space-y-4">
            {stage.modules.map((module, index) => (
              <div key={index} className="card hover:scale-[1.01] active:scale-[0.99] cursor-pointer animate-fadeInUp" style={{ animationDelay: `${index * 80}ms` }}>
                <div className="flex items-start mb-3">
                  <span className="text-4xl mr-4">{module.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-text-primary">{module.title}</h3>
                    <p className="text-sm text-text-secondary">{module.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {module.features.map((feature, idx) => (
                    <div key={idx} className={`flex items-center px-3 py-2 bg-${module.color} rounded-xl hover:bg-opacity-80 transition-colors`}>
                      <span className="text-xs text-text-secondary">✓ {feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 时间线 */}
        {activeTab === 'timeline' && (
          <div className="card">
            <h2 className="text-xl font-semibold text-text-primary mb-6">📅 {stage.name}时间线</h2>
            <div className="relative">
              {stage.timeline.map((item, index) => (
                <div key={index} className="flex gap-4 pb-8 last:pb-0 relative animate-fadeInUp" style={{ animationDelay: `${index * 100}ms` }}>
                  {/* 竖线 */}
                  {index < stage.timeline.length - 1 && (
                    <div className="absolute left-5 top-12 bottom-0 w-0.5 bg-soft-blue"></div>
                  )}
                  {/* 圆点 */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-soft-blue to-light-blue flex items-center justify-center text-white text-xs font-bold flex-shrink-0 z-10 hover:scale-110 transition-transform">
                    {index + 1}
                  </div>
                  {/* 内容 */}
                  <div className="flex-1 bg-cream rounded-2xl p-4 hover:bg-soft-blue/20 transition-colors">
                    <div className="flex items-center mb-2">
                      <span className="text-xs px-2 py-1 bg-soft-pink rounded-full text-text-secondary mr-2">
                        {item.week}
                      </span>
                      <h3 className="text-base font-semibold text-text-primary">{item.title}</h3>
                    </div>
                    <p className="text-sm text-text-secondary">{item.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 实用贴士 */}
        {activeTab === 'tips' && (
          <div className="space-y-4">
            <div className="card bg-gradient-to-r from-soft-blue to-light-blue animate-fadeInUp">
              <h2 className="text-xl font-semibold text-text-primary mb-4">💡 {stage.name}实用贴士</h2>
            </div>
            {stage.tips.map((tip, index) => (
              <div key={index} className="card flex items-start animate-fadeInUp" style={{ animationDelay: `${index * 80}ms` }}>
                <div className="w-10 h-10 rounded-full bg-soft-pink flex items-center justify-center text-text-primary font-bold mr-4 flex-shrink-0 hover:scale-110 transition-transform">
                  {index + 1}
                </div>
                <p className="text-text-primary flex-1 pt-2 leading-relaxed">{tip}</p>
              </div>
            ))}
          </div>
        )}

        {/* 相关知识 */}
        {activeTab === 'knowledge' && (
          <div className="space-y-4">
            {stageArticles.length > 0 ? (
              stageArticles.map((article) => (
                <Link
                  key={article.id}
                  to={`/knowledge/${article.id}`}
                  className="card block"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-text-primary">{article.title}</h3>
                    <span className="text-xs text-text-light whitespace-nowrap ml-2">{article.readTime}</span>
                  </div>
                  <p className="text-sm text-text-secondary mb-3">{article.summary}</p>
                  <div className="flex gap-2 flex-wrap">
                    {article.tags.map((tag) => (
                      <span key={tag} className="text-xs px-2 py-1 bg-soft-blue rounded-full text-text-secondary">
                        {tag}
                      </span>
                    ))}
                    {article.ageRange && (
                      <span className="text-xs px-2 py-1 bg-mint rounded-full text-text-secondary">
                        {article.ageRange}
                      </span>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <div className="card text-center">
                <p className="text-text-secondary">暂无相关知识文章</p>
                <Link to="/knowledge" className="btn btn-primary mt-4 inline-block">
                  浏览全部知识库
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default StagePage;
