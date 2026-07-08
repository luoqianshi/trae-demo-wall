import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { mockSharedRoutes, mockBadges } from '@/data/mockData';
import type { SharedRoute } from '@shared/types';
import {
  Heart,
  MessageCircle,
  Bookmark,
  Plus,
  Award,
  TrendingUp,
  Filter,
  Send,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';

export default function Community() {
  const navigate = useNavigate();
  const { isLoggedIn, user, addPoints } = useAuthStore();
  const [sharedRoutes, setSharedRoutes] = useState<SharedRoute[]>(mockSharedRoutes);
  const [showPublish, setShowPublish] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [sortBy, setSortBy] = useState<'hot' | 'new'>('hot');
  const [publishTitle, setPublishTitle] = useState('');
  const [publishContent, setPublishContent] = useState('');
  const [publishTags, setPublishTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleLike = (id: string) => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    setSharedRoutes((routes) =>
      routes.map((r) =>
        r.id === id
          ? {
              ...r,
              likes: r.isLiked ? r.likes - 1 : r.likes + 1,
              isLiked: !r.isLiked,
            }
          : r
      )
    );
  };

  const handlePublish = () => {
    if (!isLoggedIn) {
      navigate('/login');
      return;
    }
    if (!publishTitle || !publishContent) return;

    const newRoute: SharedRoute = {
      id: `shared-${Date.now()}`,
      userId: user?.id || '',
      username: user?.username || '',
      avatar: user?.avatar || '',
      routeId: '',
      title: publishTitle,
      content: publishContent,
      tags: publishTags,
      likes: 0,
      comments: [],
      saves: 0,
      createdAt: new Date().toLocaleDateString('zh-CN'),
      isLiked: false,
    };

    setSharedRoutes([newRoute, ...sharedRoutes]);
    addPoints(100);
    setShowPublish(false);
    setPublishTitle('');
    setPublishContent('');
    setPublishTags([]);
  };

  const addTag = () => {
    if (tagInput && publishTags.length < 5 && !publishTags.includes(tagInput)) {
      setPublishTags([...publishTags, tagInput]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setPublishTags(publishTags.filter((t) => t !== tag));
  };

  const sortedRoutes = [...sharedRoutes].sort((a, b) => {
    if (sortBy === 'hot') return b.likes - a.likes;
    return 0;
  });

  const unlockedCount = mockBadges.filter((b) => b.unlocked).length;

  return (
    <div className="min-h-screen bg-cream pt-20 pb-24">
      <div className="bg-gradient-hero pt-6 pb-16">
        <div className="container mx-auto px-4">
          <div className={`${isVisible ? 'animate-fade-in-up' : 'opacity-0'}`}>
            <h1 className="font-display text-3xl font-bold text-white mb-2">社区广场</h1>
            <p className="text-white/70">发现真实用户的中转体验分享</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-10">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl shadow-card p-4 flex items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setSortBy('hot')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    sortBy === 'hot'
                      ? 'bg-accent-500 text-white'
                      : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <TrendingUp size={14} />
                    最热
                  </span>
                </button>
                <button
                  onClick={() => setSortBy('new')}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    sortBy === 'new'
                      ? 'bg-accent-500 text-white'
                      : 'bg-primary-50 text-primary-600 hover:bg-primary-100'
                  }`}
                >
                  最新
                </button>
              </div>
              <button
                onClick={() => {
                  if (!isLoggedIn) {
                    navigate('/login');
                    return;
                  }
                  setShowPublish(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-accent-500 to-accent-400 text-white text-sm font-medium rounded-full hover:shadow-glow transition-all"
              >
                <Plus size={16} />
                发布分享
              </button>
            </div>

            {sortedRoutes.map((shared, index) => (
              <div
                key={shared.id}
                className={`bg-white rounded-2xl shadow-card overflow-hidden ${
                  isVisible ? 'animate-fade-in-up' : 'opacity-0'
                }`}
                style={{ animationDelay: `${100 + index * 100}ms` }}
              >
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <img
                      src={shared.avatar}
                      alt={shared.username}
                      className="w-11 h-11 rounded-xl"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary-800">
                          {shared.username}
                        </span>
                        {shared.routePrice && (
                          <span className="text-xs px-2 py-0.5 bg-accent-100 text-accent-600 rounded-full">
                            ¥{shared.routePrice}起
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-primary-700/40">{shared.createdAt}</div>
                    </div>
                    {shared.routeFrom && shared.routeTo && (
                      <div className="text-sm text-primary-600 font-medium">
                        {shared.routeFrom} → {shared.routeTo}
                      </div>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-primary-800 mb-2">
                    {shared.title}
                  </h3>
                  <p className="text-sm text-primary-700/70 leading-relaxed mb-4">
                    {expandedId === shared.id
                      ? shared.content
                      : shared.content.slice(0, 100) + (shared.content.length > 100 ? '...' : '')}
                  </p>

                  {shared.content.length > 100 && (
                    <button
                      onClick={() => setExpandedId(expandedId === shared.id ? null : shared.id)}
                      className="text-sm text-accent-500 font-medium flex items-center gap-1 mb-4"
                    >
                      {expandedId === shared.id ? (
                        <>
                          收起 <ChevronUp size={14} />
                        </>
                      ) : (
                        <>
                          展开全文 <ChevronDown size={14} />
                        </>
                      )}
                    </button>
                  )}

                  <div className="flex flex-wrap gap-2 mb-4">
                    {shared.tags.map((tag, i) => (
                      <span
                        key={i}
                        className="text-xs px-3 py-1 bg-primary-50 text-primary-600 rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-around border-t border-gray-50 py-1">
                  <button
                    onClick={() => handleLike(shared.id)}
                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-all ${
                      shared.isLiked
                        ? 'text-accent-500'
                        : 'text-primary-700/50 hover:text-accent-500 hover:bg-accent-50/50'
                    }`}
                  >
                    <Heart
                      size={18}
                      fill={shared.isLiked ? 'currentColor' : 'none'}
                      className={shared.isLiked ? 'animate-pulse-heart' : ''}
                    />
                    <span className="text-sm font-medium">{shared.likes}</span>
                  </button>
                  <button
                    onClick={() => setExpandedId(expandedId === shared.id ? null : shared.id)}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-primary-700/50 hover:text-primary-600 hover:bg-primary-50/50 rounded-xl transition-all"
                  >
                    <MessageCircle size={18} />
                    <span className="text-sm font-medium">{shared.comments.length}</span>
                  </button>
                  <button className="flex items-center gap-1.5 px-4 py-2.5 text-primary-700/50 hover:text-tealish-500 hover:bg-tealish-400/10 rounded-xl transition-all">
                    <Bookmark size={18} />
                    <span className="text-sm font-medium">{shared.saves}</span>
                  </button>
                </div>

                {expandedId === shared.id && shared.comments.length > 0 && (
                  <div className="px-5 pb-4 border-t border-gray-50 pt-4 animate-fade-in">
                    <h4 className="text-sm font-semibold text-primary-800 mb-3">
                      评论 ({shared.comments.length})
                    </h4>
                    <div className="space-y-3">
                      {shared.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3">
                          <img
                            src={comment.avatar}
                            alt={comment.username}
                            className="w-8 h-8 rounded-lg"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-primary-800">
                                {comment.username}
                              </span>
                              <span className="text-xs text-primary-700/40">
                                {comment.createdAt}
                              </span>
                            </div>
                            <p className="text-sm text-primary-700/70">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <input
                        type="text"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        placeholder="说点什么..."
                        className="flex-1 px-4 py-2 bg-primary-50/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent-400/30"
                      />
                      <button className="px-4 py-2 bg-accent-500 text-white rounded-xl hover:shadow-glow transition-all">
                        <Send size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Award size={20} className="text-gold-500" />
                <h3 className="font-bold text-primary-800">成就徽章</h3>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {mockBadges.slice(0, 8).map((badge) => (
                  <div
                    key={badge.id}
                    className={`aspect-square rounded-xl flex items-center justify-center text-2xl ${
                      badge.unlocked
                        ? 'bg-gradient-to-br from-gold-300/20 to-amber-100'
                        : 'bg-gray-50 grayscale opacity-50'
                    }`}
                    title={badge.name}
                  >
                    {badge.icon}
                  </div>
                ))}
              </div>
              <div className="text-center text-sm">
                <span className="text-primary-700/50">已解锁 </span>
                <span className="text-gold-500 font-bold">{unlockedCount}</span>
                <span className="text-primary-700/50"> / {mockBadges.length}</span>
              </div>
            </div>

            <div className="bg-gradient-to-br from-primary-700 to-primary-800 rounded-2xl p-5 text-white">
              <h3 className="font-bold mb-2">分享你的中转体验</h3>
              <p className="text-sm text-white/70 mb-4">
                发布实测路线，获得里程积分和专属徽章
              </p>
              <button
                onClick={() => {
                  if (!isLoggedIn) {
                    navigate('/login');
                    return;
                  }
                  setShowPublish(true);
                }}
                className="w-full py-2.5 bg-white text-primary-700 text-sm font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                立即发布
              </button>
            </div>

            <div className="bg-white rounded-2xl shadow-card p-5">
              <h3 className="font-bold text-primary-800 mb-4">热门标签</h3>
              <div className="flex flex-wrap gap-2">
                {['省钱神线', '美食攻略', '机场免费休息', '高铁中转', '市区游玩', '茶颜悦色', '同站换乘'].map((tag) => (
                  <button
                    key={tag}
                    className="px-3 py-1.5 text-sm bg-primary-50 text-primary-600 rounded-full hover:bg-accent-100 hover:text-accent-600 transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showPublish && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-slide-up">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-primary-800">发布实测路线</h2>
              <button
                onClick={() => setShowPublish(false)}
                className="p-1.5 hover:bg-primary-50 rounded-full transition-colors"
              >
                <X size={20} className="text-primary-500" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-sm text-primary-700/70 mb-1.5 block">标题</label>
                <input
                  type="text"
                  value={publishTitle}
                  onChange={(e) => setPublishTitle(e.target.value)}
                  placeholder="分享你的中转体验标题"
                  className="w-full px-4 py-3 bg-primary-50/50 border border-transparent rounded-xl focus:border-accent-400 focus:bg-white outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-sm text-primary-700/70 mb-1.5 block">内容</label>
                <textarea
                  value={publishContent}
                  onChange={(e) => setPublishContent(e.target.value)}
                  placeholder="详细描述你的中转体验，包括小贴士、美食推荐等..."
                  rows={5}
                  className="w-full px-4 py-3 bg-primary-50/50 border border-transparent rounded-xl focus:border-accent-400 focus:bg-white outline-none transition-all resize-none"
                />
              </div>
              <div>
                <label className="text-sm text-primary-700/70 mb-1.5 block">
                  添加标签（最多5个）
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {publishTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-accent-100 text-accent-600 text-sm rounded-full"
                    >
                      #{tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-accent-700">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
                {publishTags.length < 5 && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                      placeholder="输入标签后按回车"
                      className="flex-1 px-4 py-2 bg-primary-50/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent-400/30"
                    />
                    <button
                      onClick={addTag}
                      className="px-4 py-2 bg-primary-100 text-primary-600 rounded-xl text-sm hover:bg-primary-200 transition-colors"
                    >
                      添加
                    </button>
                  </div>
                )}
              </div>
              <div className="bg-amber-50 rounded-xl p-4">
                <p className="text-xs text-amber-700">
                  💡 发布成功后可获得 <span className="font-bold">100里程积分</span>，
                  被收藏还能获得更多奖励哦~
                </p>
              </div>
              <button
                onClick={handlePublish}
                disabled={!publishTitle || !publishContent}
                className="w-full py-3.5 bg-gradient-to-r from-accent-500 to-accent-400 text-white font-semibold rounded-xl hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                发布分享
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
