import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getArticleById, knowledgeCategories } from '../data/knowledge';
import { stages } from '../data/stages';

function ArticlePage() {
  const { articleId } = useParams<{ articleId: string }>();
  const article = getArticleById(articleId || '');
  const [showBackToTop, setShowBackToTop] = useState(false);

  // 监听滚动，显示/隐藏返回顶部按钮
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-xl text-text-secondary mb-4">文章不存在</p>
          <Link to="/knowledge" className="btn btn-primary">返回知识库</Link>
        </div>
      </div>
    );
  }

  const category = knowledgeCategories.find((c) => c.key === article.category);
  const articleStages = article.stage.map((s) => stages.find((st) => st.key === s)).filter(Boolean);

  // 简单的markdown渲染：分割段落和加粗文本
  const renderContent = (content: string) => {
    const blocks = content.split('\n\n');
    return blocks.map((block, index) => {
      if (block.startsWith('**') && block.endsWith('**')) {
        // 标题块
        const title = block.replace(/\*\*/g, '');
        return (
          <h3 key={index} className="text-lg font-semibold text-text-primary mt-6 mb-3">
            {title}
          </h3>
        );
      }
      // 普通段落，处理加粗
      const parts = block.split(/(\*\*[^*]+\*\*)/g);
      return (
        <p key={index} className="text-text-primary leading-relaxed mb-3">
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return (
                <strong key={i} className="font-semibold text-text-primary">
                  {part.replace(/\*\*/g, '')}
                </strong>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className={`bg-gradient-to-br from-${category?.color} to-soft-blue px-6 py-8`}>
        <Link to="/knowledge" className="inline-block text-sm text-text-secondary hover:text-text-primary mb-4">
          ‹ 返回知识库
        </Link>
        <div className="flex items-center mb-4">
          <div className={`w-14 h-14 rounded-2xl bg-white/60 flex items-center justify-center text-3xl mr-4`}>
            {category?.icon}
          </div>
          <div>
            <span className="text-xs px-3 py-1 bg-white/60 rounded-full text-text-secondary">
              {category?.name}
            </span>
          </div>
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-3">{article.title}</h1>
        <p className="text-text-secondary text-sm mb-4">{article.summary}</p>
        <div className="flex gap-2 flex-wrap items-center">
          {article.ageRange && (
            <span className="text-xs px-3 py-1 bg-white/60 rounded-full text-text-secondary">
              📅 {article.ageRange}
            </span>
          )}
          <span className="text-xs px-3 py-1 bg-white/60 rounded-full text-text-secondary">
            ⏱ {article.readTime}
          </span>
          {articleStages.map((s) => (
            <span key={s!.key} className="text-xs px-3 py-1 bg-white/60 rounded-full text-text-secondary">
              {s!.icon} {s!.name}
            </span>
          ))}
        </div>
      </div>

      {/* 文章内容 */}
      <div className="px-6 py-6">
        <div className="card">
          <div className="prose max-w-none">
            {renderContent(article.content)}
          </div>
        </div>

        {/* 标签 */}
        <div className="card">
          <h3 className="text-sm font-medium text-text-secondary mb-3">标签</h3>
          <div className="flex gap-2 flex-wrap">
            {article.tags.map((tag) => (
              <span key={tag} className="text-sm px-3 py-1 bg-soft-blue rounded-full text-text-secondary">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* 相关阶段 */}
        <div className="card">
          <h3 className="text-sm font-medium text-text-secondary mb-3">相关阶段</h3>
          <div className="flex gap-3">
            {articleStages.map((s) => (
              <Link
                key={s!.key}
                to={`/stage/${s!.key}`}
                className={`flex-1 flex flex-col items-center p-4 bg-gradient-to-br ${s!.gradient} rounded-2xl hover:scale-105 transition-all`}
              >
                <span className="text-3xl mb-1">{s!.icon}</span>
                <span className="text-sm font-medium text-text-primary">{s!.name}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* 底部导航 */}
        <div className="flex gap-4">
          <Link to="/knowledge" className="btn btn-secondary flex-1 text-center">
            📚 返回知识库
          </Link>
          <Link to="/" className="btn btn-primary flex-1 text-center">
            🏠 回到首页
          </Link>
        </div>
      </div>

      {/* 返回顶部按钮 */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="back-to-top"
          aria-label="返回顶部"
        >
          ↑
        </button>
      )}
    </div>
  );
}

export default ArticlePage;
