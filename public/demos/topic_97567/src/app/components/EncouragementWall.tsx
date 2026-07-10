'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// 类型定义
// ============================================================

interface EncouragementPost {
  id: string;
  content: string;
  likes_count: number;
  created_at: string;
  is_liked_by_me?: boolean;
}

interface EncouragementWallProps {
  token: string;
}

// ============================================================
// 工具函数
// ============================================================

function getRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;

  if (diffMs < 0) return '刚刚';

  const seconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 30) return `${days}天前`;

  return new Date(dateString).toLocaleDateString('zh-CN');
}

// ============================================================
// 动画配置
// ============================================================

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: 'easeOut' as const },
  },
};

// ============================================================
// 组件
// ============================================================

const EncouragementWall: React.FC<EncouragementWallProps> = ({ token }) => {
  const [posts, setPosts] = useState<EncouragementPost[]>([]);
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set());

  // 获取鼓励帖列表
  const fetchPosts = useCallback(async () => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/encouragement?limit=50&offset=0', { headers });
      const data = await res.json();

      if (data.success && data.posts) {
        setPosts(data.posts);
      }
    } catch (err) {
      console.error('Failed to fetch encouragement posts:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // 发布鼓励帖
  const handlePost = async () => {
    const trimmed = content.trim();
    if (!trimmed || trimmed.length > 200 || isPosting) return;

    setIsPosting(true);
    try {
      const res = await fetch('/api/encouragement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: trimmed }),
      });

      const data = await res.json();

      if (data.success && data.post) {
        setContent('');
        // 将新帖插入到列表顶部
        setPosts(prev => [data.post, ...prev]);
      }
    } catch (err) {
      console.error('Failed to post encouragement:', err);
    } finally {
      setIsPosting(false);
    }
  };

  // 点赞/取消点赞
  const handleLike = async (post: EncouragementPost) => {
    if (likingPosts.has(post.id)) return;

    const action = post.is_liked_by_me ? 'unlike' : 'like';

    // 乐观更新
    setPosts(prev =>
      prev.map(p =>
        p.id === post.id
          ? {
              ...p,
              is_liked_by_me: action === 'like',
              likes_count: action === 'like' ? p.likes_count + 1 : Math.max(p.likes_count - 1, 0),
            }
          : p
      )
    );

    setLikingPosts(prev => new Set(prev).add(post.id));

    try {
      const res = await fetch('/api/encouragement', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ post_id: post.id, action }),
      });

      const data = await res.json();

      if (!data.success) {
        // 回滚乐观更新
        setPosts(prev =>
          prev.map(p =>
            p.id === post.id
              ? {
                  ...p,
                  is_liked_by_me: action !== 'like',
                  likes_count: action !== 'like' ? p.likes_count + 1 : Math.max(p.likes_count - 1, 0),
                }
              : p
          )
        );
      }
    } catch (err) {
      // 回滚乐观更新
      setPosts(prev =>
        prev.map(p =>
          p.id === post.id
            ? {
                ...p,
                is_liked_by_me: action !== 'like',
                likes_count: action !== 'like' ? p.likes_count + 1 : Math.max(p.likes_count - 1, 0),
              }
            : p
        )
      );
      console.error('Failed to toggle like:', err);
    } finally {
      setLikingPosts(prev => {
        const next = new Set(prev);
        next.delete(post.id);
        return next;
      });
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 发布区域 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={content}
            onChange={(e) => {
              if (e.target.value.length <= 200) {
                setContent(e.target.value);
              }
            }}
            placeholder="说一句温暖的话..."
            maxLength={200}
            className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-transparent transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handlePost();
              }
            }}
          />
          <motion.button
            onClick={handlePost}
            disabled={!content.trim() || isPosting}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-blue-400 to-cyan-400 shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-shadow whitespace-nowrap"
            whileHover={{ scale: content.trim() ? 1.03 : 1 }}
            whileTap={{ scale: content.trim() ? 0.97 : 1 }}
          >
            {isPosting ? '发布中...' : '发布鼓励'}
          </motion.button>
        </div>
        {content.length > 0 && (
          <div className="mt-2 text-right">
            <span className={`text-xs ${content.length > 180 ? 'text-red-400' : 'text-gray-400'}`}>
              {content.length}/200
            </span>
          </div>
        )}
      </div>

      {/* 帖子列表 */}
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
              <div className="flex justify-between items-center">
                <div className="h-3 bg-gray-100 rounded w-16" />
                <div className="h-3 bg-gray-100 rounded w-10" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🌨️</div>
          <p className="text-gray-400 text-sm">还没有鼓励，成为第一个温暖他人的人吧</p>
        </div>
      ) : (
        <motion.div
          className="flex flex-col gap-3"
          variants={listVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {posts.map((post) => (
              <motion.div
                key={post.id}
                variants={itemVariants}
                layout
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
                {/* 内容 */}
                <p className="text-sm text-gray-700 leading-relaxed mb-3">
                  {post.content}
                </p>

                {/* 底部信息 */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {getRelativeTime(post.created_at)}
                  </span>

                  {/* 点赞按钮 */}
                  <motion.button
                    onClick={() => handleLike(post)}
                    disabled={likingPosts.has(post.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      post.is_liked_by_me
                        ? 'bg-blue-50 text-blue-500'
                        : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.92 }}
                  >
                    <span className="text-base">
                      {post.is_liked_by_me ? '❄️' : '🫧'}
                    </span>
                    <span>{post.likes_count}</span>
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default EncouragementWall;
