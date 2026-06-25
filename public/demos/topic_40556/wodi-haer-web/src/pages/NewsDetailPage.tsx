import { useParams, Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getNewsById as getNewsFromStatic, newsCategories, type NewsItem } from '../data/news';
import { getNewsById as getSmartNewsById, type SmartNewsItem } from '../services/smartNews';

function NewsDetailPage() {
  const { newsId } = useParams<{ newsId: string }>();
  const location = useLocation();
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [news, setNews] = useState<(NewsItem & { aiAnalysis?: any }) | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 监听滚动，显示/隐藏返回顶部按钮
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 组件挂载时获取新闻详情（按需获取）
  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      try {
        // 1. 优先使用路由state传入的数据
        const passedNews = location.state?.newsItem as SmartNewsItem | undefined;
        if (passedNews) {
          setNews(passedNews);
          setIsLoading(false);
          return;
        }

        // 2. 尝试从smartNews服务获取（模拟API调用）
        if (newsId) {
          const smartNews = await getSmartNewsById(newsId);
          if (smartNews) {
            setNews(smartNews);
            setIsLoading(false);
            return;
          }
        }

        // 3. 最后回退到静态数据
        const staticNews = getNewsFromStatic(newsId || '');
        setNews(staticNews || null);
      } catch (error) {
        console.error('获取新闻详情失败:', error);
        // 失败时回退到静态数据
        const staticNews = getNewsFromStatic(newsId || '');
        setNews(staticNews || null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [newsId, location.state]);

  // 判断是否为官方数据
  const isOfficial = news && '_isOfficial' in news && (news as any)._isOfficial === true;
  const externalLink = news?.externalLink;
  const officialSource = isOfficial ? ((news as any)._officialSource as string) : null;

  if (!news) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-4xl mb-4">🔍</p>
          <p className="text-xl text-text-secondary mb-4">新闻不存在或已被删除</p>
          <Link to="/news" className="btn btn-primary">返回动态列表</Link>
        </div>
      </div>
    );
  }

  // 加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-soft-blue border-t-ice-blue rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary text-sm">正在加载新闻详情...</p>
        </div>
      </div>
    );
  }

  const category = newsCategories.find((c) => c.key === news.category);

  const urgencyConfig = {
    high: { label: '紧急通知', color: 'bg-soft-pink', icon: '🚨' },
    medium: { label: '重要提醒', color: 'bg-light-yellow', icon: '⚠️' },
    low: { label: '一般资讯', color: 'bg-mint', icon: '📢' },
  };
  const urgency = urgencyConfig[news.urgency];

  const renderContent = (content: string) => {
    const blocks = content.split('\n\n');
    return blocks.map((block, index) => {
      if (block.startsWith('**') && block.endsWith('**')) {
        const title = block.replace(/\*\*/g, '');
        return (
          <h3 key={index} className="text-lg font-semibold text-text-primary mt-6 mb-3">
            {title}
          </h3>
        );
      }
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
      <div className={`bg-gradient-to-br from-${category?.color || 'cream'} to-soft-blue px-6 py-8`}>
        <Link to="/news" className="inline-block text-sm text-text-secondary hover:text-text-primary mb-4">
          ‹ 返回动态列表
        </Link>
        <div className="flex items-center gap-3 mb-4">
          <span className={`text-xs px-3 py-1 bg-white/70 rounded-full font-medium text-text-primary`}>
            {urgency.icon} {urgency.label}
          </span>
          <span className="text-xs px-3 py-1 bg-white/70 rounded-full text-text-secondary">
            {category?.icon} {category?.name}
          </span>
          {isOfficial && (
            <span className="text-xs px-3 py-1 bg-white/70 rounded-full text-green-700 font-medium">
              🏛️ 官方来源
            </span>
          )}
          {!isOfficial && (
            <span className="text-xs px-3 py-1 bg-white/70 rounded-full text-amber-700 font-medium">
              📋 示例模板
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-text-primary mb-3">{news.title}</h1>
        <p className="text-text-secondary text-sm mb-4">{news.summary}</p>
        <div className="flex gap-4 text-xs text-text-secondary">
          <span>📍 {news.source}</span>
          <span>📅 {news.date}</span>
        </div>
      </div>

      {/* 内容 */}
      <div className="px-6 py-6 space-y-6">
        <div className="card">
          <div className="prose max-w-none">
            {renderContent(news.content)}
          </div>
        </div>

        {/* ★ 外部链接跳转 — 官方新闻有原文链接 */}
        {isOfficial && externalLink && (
          <div className="card bg-gradient-to-r from-ice-blue/20 to-light-blue/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-text-primary mb-1">🔗 查看官方原文</h3>
                <p className="text-xs text-text-secondary truncate max-w-md">{externalLink}</p>
                {officialSource && (
                  <p className="text-xs text-green-600 mt-1">来源部门: {officialSource}</p>
                )}
              </div>
              <a
                href={externalLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary text-sm whitespace-nowrap"
              >
                打开原文 ↗
              </a>
            </div>
            <p className="text-xs text-text-light mt-3">
              点击将在新窗口打开政府官方网站原文页面 · 域名: gov.cn / org.cn
            </p>
          </div>
        )}

        {/* ★ 示例数据免责声明 */}
        {!isOfficial && (
          <div className="card bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200">
            <h3 className="text-base font-semibold text-amber-800 mb-2">📋 数据性质声明</h3>
            <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
              <li>此条内容为<strong>示例模板数据</strong>，非来自政府官方渠道</li>
              <li>仅用于展示页面功能和UI效果</li>
              <li>标题、内容、来源名称均为虚构/模拟</li>
              <li>请勿将此信息作为真实参考依据</li>
            </ul>
            <p className="text-xs text-amber-600 mt-3 pt-2 border-t border-amber-200">
              官方信息请访问：市场监管总局(samr.gov.cn) / 卫健委(nhc.gov.cn) / 疾控中心(chinacdc.cn) / 药监局(nmpa.gov.cn)
            </p>
          </div>
        )}

        {/* 安全提示 */}
        {news.safetyTips && news.safetyTips.length > 0 && (
          <div className="card bg-gradient-to-r from-soft-blue to-light-blue">
            <h3 className="text-lg font-semibold text-text-primary mb-4">
              🛡️ 安全防护建议
            </h3>
            <div className="space-y-3">
              {news.safetyTips.map((tip, index) => (
                <div key={index} className="flex items-start bg-white/60 rounded-2xl p-3">
                  <span className="w-6 h-6 rounded-full bg-soft-pink flex items-center justify-center text-xs font-bold text-text-primary mr-3 flex-shrink-0">
                    {index + 1}
                  </span>
                  <p className="text-text-primary text-sm pt-0.5">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 标签 */}
        <div className="card">
          <h3 className="text-sm font-medium text-text-secondary mb-3">相关标签</h3>
          <div className="flex gap-2 flex-wrap">
            {news.tags.map((tag) => (
              <span key={tag} className="text-sm px-3 py-1 bg-soft-blue rounded-full text-text-secondary">
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* 底部导航 */}
        <div className="flex gap-4">
          <Link to="/news" className="btn btn-secondary flex-1 text-center">
            📰 更多动态
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

export default NewsDetailPage;
