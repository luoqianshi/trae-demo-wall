import { Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { knowledgeService } from '../services/knowledgeService';
import { stages } from '../data/stages';
import { knowledgeArticles } from '../data/knowledge';

// 静态分类数据
const defaultCategories = [
  { key: 'nutrition', name: '营养喂养', icon: '🍼', description: '科学喂养指南', color: 'soft-pink' },
  { key: 'health', name: '健康护理', icon: '🏥', description: '日常护理知识', color: 'light-blue' },
  { key: 'growth', name: '发育成长', icon: '📏', description: '生长发育监测', color: 'mint' },
  { key: 'education', name: '早教启蒙', icon: '🧩', description: '早期教育方法', color: 'light-yellow' },
  { key: 'psychology', name: '心理行为', icon: '🧠', description: '心理健康引导', color: 'soft-purple' },
  { key: 'safety', name: '安全防护', icon: '🛡️', description: '安全防护要点', color: 'soft-pink' },
];

function KnowledgePage() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeStage, setActiveStage] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // 数据状态（默认使用静态数据，确保页面立即可见）
  const [categories, setCategories] = useState(defaultCategories);
  const [articles, setArticles] = useState(knowledgeArticles);

  // 获取分类列表（后台静默）
  useEffect(() => {
    knowledgeService.getCategories().then((res: any) => {
      if (res?.data && Array.isArray(res.data)) setCategories(res.data);
    }).catch(() => {});
  }, []);

  // 获取文章列表（后台静默）
  useEffect(() => {
    const params: any = { page: 1, pageSize: 50 };
    if (activeCategory !== 'all') params.category = activeCategory;
    if (activeStage !== 'all') params.stage = activeStage;

    knowledgeService.getArticles(params).then((res: any) => {
      if (res?.data?.list) setArticles(res.data.list);
    }).catch(() => {});
  }, [activeCategory, activeStage]);

  // 搜索 + 分类 + 阶段 三重筛选
  const filteredArticles = useMemo(() => {
    let result = articles;

    // 分类筛选
    if (activeCategory !== 'all') {
      result = result.filter(a => a.category === activeCategory);
    }

    // 阶段筛选
    if (activeStage !== 'all') {
      result = result.filter(a => a.stage.includes(activeStage));
    }

    // 搜索关键词
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(a =>
        a.title.toLowerCase().includes(query) ||
        a.summary.toLowerCase().includes(query) ||
        a.tags.some(t => t.toLowerCase().includes(query))
      );
    }

    return result;
  }, [articles, activeCategory, activeStage, searchQuery]);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl px-6 py-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-text-primary mb-2">📚 个性化养育知识库</h1>
        <p className="text-sm text-text-secondary">科学育儿，从备孕到养育全覆盖</p>
      </div>

      <div className="px-6 py-6 space-y-6">
        {/* 搜索框 */}
        <div className="card !p-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-text-light text-lg">🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索文章标题、标签..."
              className="w-full pl-11 pr-4 py-3 bg-cream rounded-xl border border-soft-blue focus:border-ice-blue focus:ring-2 focus:ring-soft-blue/20 outline-none transition-all text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light hover:text-text-secondary"
              >
                ✕
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-text-light mt-2">找到 {filteredArticles.length} 篇相关文章</p>
          )}
        </div>

        {/* 阶段筛选 */}
        <div className="card">
          <h2 className="text-sm font-medium text-text-secondary mb-3">按阶段筛选</h2>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setActiveStage('all')}
              className={`px-4 py-2 rounded-full text-sm transition-all ${
                activeStage === 'all'
                  ? 'bg-gradient-to-r from-soft-blue to-light-blue text-text-primary font-medium shadow-md'
                  : 'bg-cream text-text-secondary hover:bg-soft-blue/30'
              }`}
            >
              全部
            </button>
            {stages.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveStage(s.key)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  activeStage === s.key
                    ? 'bg-gradient-to-r from-soft-blue to-light-blue text-text-primary font-medium shadow-md'
                    : 'bg-cream text-text-secondary hover:bg-soft-blue/30'
                }`}
              >
                {s.icon} {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* 分类导航 */}
        <div>
          <h2 className="text-sm font-medium text-text-secondary mb-3 px-2">按分类浏览</h2>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setActiveCategory('all')}
              className={`card flex flex-col items-center justify-center p-4 ${
                activeCategory === 'all' ? 'bg-gradient-to-br from-soft-blue to-light-blue' : 'bg-white'
              }`}
            >
              <span className="text-3xl mb-1">📖</span>
              <span className="text-xs text-text-primary font-medium">全部</span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                className={`card flex flex-col items-center justify-center p-4 ${
                  activeCategory === cat.key ? `bg-${cat.color}` : 'bg-white'
                }`}
              >
                <span className="text-3xl mb-1">{cat.icon}</span>
                <span className="text-xs text-text-primary font-medium">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 文章列表 */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-text-primary">
              {activeCategory === 'all'
                ? searchQuery ? '搜索结果' : '全部文章'
                : categories.find((c) => c.key === activeCategory)?.name}
              <span className="text-sm text-text-light ml-2">({filteredArticles.length}篇)</span>
            </h2>
          </div>

          {filteredArticles.length > 0 ? (
            <div className="space-y-4">
              {filteredArticles.map((article) => {
                const cat = categories.find((c) => c.key === article.category);
                return (
                  <Link
                    key={article.id}
                    to={`/knowledge/${article.id}`}
                    className="card block hover:scale-[1.01] transition-transform active:scale-[0.99]"
                  >
                    <div className="flex items-start mb-3">
                      <div className={`w-12 h-12 rounded-2xl bg-${cat?.color || 'cream'} flex items-center justify-center text-2xl mr-4 flex-shrink-0`}>
                        {cat?.icon || '📄'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-lg font-semibold text-text-primary truncate pr-2">{article.title}</h3>
                          <span className="text-xs text-text-light whitespace-nowrap flex-shrink-0">{article.readTime}</span>
                        </div>
                        <p className="text-sm text-text-secondary line-clamp-2">{article.summary}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-wrap items-center">
                      {article.ageRange && (
                        <span className="text-xs px-2 py-1 bg-mint rounded-full text-text-secondary">
                          📅 {article.ageRange}
                        </span>
                      )}
                      {article.tags.map((tag) => (
                        <span key={tag} className="text-xs px-2 py-1 bg-soft-blue rounded-full text-text-secondary">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-4xl mb-4">{searchQuery ? '🔎' : '📚'}</p>
              <p className="text-text-secondary">
                {searchQuery ? `没有找到与"${searchQuery}"相关的文章` : '暂无相关文章'}
              </p>
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="mt-4 text-sm text-ice-blue hover:underline">
                  清除搜索
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default KnowledgePage;
