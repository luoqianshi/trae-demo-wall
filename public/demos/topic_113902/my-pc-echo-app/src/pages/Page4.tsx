import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import StarField from '../components/shared/StarField';
import { mockCharacters } from '../data/characters';

/* ---------- Types ---------- */
interface SocialComment {
  id: string;
  author: string;
  content: string;
  timestamp: string;
}

interface SocialPost {
  id: string;
  characterId: string;
  characterName: string;
  characterGame: string;
  avatarImage?: string;
  avatar: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: SocialComment[];
  liked: boolean;
  sharedFrom?: string; // e.g. "来自艾尔文的档案馆"
}

/* ---------- Mock social posts ---------- */
const initialPosts: SocialPost[] = [
  {
    id: 'post-1',
    characterId: mockCharacters[0].id,
    characterName: '艾尔文',
    characterGame: '原神',
    avatarImage: mockCharacters[0].avatarImage,
    avatar: mockCharacters[0].avatar,
    content: '今天又站在风起地的高处。风从四面八方涌来，把斗篷吹得很远。突然觉得，所谓的自由，不是去了哪里，而是此刻——风吹在脸上的感觉。',
    timestamp: '3分钟前',
    likes: 18,
    comments: [
      { id: 'c1-1', author: '温迪粉丝', content: '风起地永远的神，每次去都舍不得走', timestamp: '1分钟前' },
      { id: 'c1-2', author: '旅行者A', content: '自由的味道，我也懂那种感觉', timestamp: '2分钟前' },
    ],
    liked: false,
  },
  {
    id: 'post-2',
    characterId: mockCharacters[1].id,
    characterName: '绫人',
    characterGame: '原神',
    avatarImage: mockCharacters[1].avatarImage,
    avatar: mockCharacters[1].avatar,
    content: '今日茶室新到了一批上好的玉露。泡了一壶，坐在庭院里看樱花半开半落。忽然觉得，人生如棋，落子无悔，但喝茶这件事，慢一点也无妨。',
    timestamp: '1小时前',
    likes: 24,
    comments: [
      { id: 'c2-1', author: '社奉行', content: '典型的绫人作风，优雅又通透', timestamp: '45分钟前' },
    ],
    liked: false,
  },
  {
    id: 'post-3',
    characterId: mockCharacters[2].id,
    characterName: '星野',
    characterGame: '崩坏：星穹铁道',
    avatarImage: mockCharacters[2].avatarImage,
    avatar: mockCharacters[2].avatar,
    content: '列车穿过一片星云的时候，窗外的光不断变换颜色。我低头看了看手边的手绘星图，那颗写着"你在这里"的星星好像在发光。下次见面，我带你去那颗星看看。',
    timestamp: '2小时前',
    likes: 28,
    comments: [
      { id: 'c3-1', author: '银狼', content: '这台词我可以抄一千年', timestamp: '1小时前' },
      { id: 'c3-2', author: '星尘', content: '一千年的再见，才是真正的告别啊', timestamp: '1.5小时前' },
    ],
    liked: false,
  },
  {
    id: 'post-4',
    characterId: mockCharacters[3].id,
    characterName: '阿兰',
    characterGame: '幻塔',
    avatarImage: mockCharacters[3].avatarImage,
    avatar: mockCharacters[3].avatar,
    content: '今天在班吉海岸发现了一片特别清澈的海域，能看见海底的珊瑚。捡了一个海螺放在耳边听了一会儿，里面没有海浪声，但是没关系，大海就在脚下。',
    timestamp: '5小时前',
    likes: 12,
    comments: [
      { id: 'c4-1', author: '浪花', content: '班吉海岸的日落也很绝，推荐去看看', timestamp: '4小时前' },
      { id: 'c4-2', author: '海岸守望', content: '不是最强不是最聪明，但每次都在', timestamp: '3小时前' },
    ],
    liked: false,
  },
  {
    id: 'post-5',
    characterId: mockCharacters[4].id,
    characterName: '空月',
    characterGame: '明日方舟',
    avatarImage: mockCharacters[4].avatarImage,
    avatar: mockCharacters[4].avatar,
    content: '暴风雨又来了，信号塔的灯在风暴里忽明忽暗。修好了那把碎掉的刀，刀柄上多了一道刻痕。站在塔顶望向远方——光不会灭的，至少现在不会。',
    timestamp: '1天前',
    likes: 21,
    comments: [
      { id: 'c5-1', author: '罗德岛', content: '光不会灭的，你也不会', timestamp: '20小时前' },
    ],
    liked: false,
  },
  {
    id: 'post-6',
    characterId: mockCharacters[5].id,
    characterName: '黎安',
    characterGame: '鸣潮',
    avatarImage: mockCharacters[5].avatarImage,
    avatar: mockCharacters[5].avatar,
    content: '索拉里斯海岸退潮之后，沙滩上留下了好多贝壳。一颗一颗捡起来放进口袋。潮水又要涨上来了，趁着天色还早，再走一段发光的路吧。',
    timestamp: '2天前',
    likes: 15,
    comments: [
      { id: 'c6-1', author: '汐', content: '会回来的，一定会的', timestamp: '1天前' },
      { id: 'c6-2', author: '月之子', content: '发光的脚印，这个画面绝了', timestamp: '1.5天前' },
    ],
    liked: false,
  },
];

/* ---------- Shooting star ---------- */
function ShootingStar({ delay, duration, left, angle }: { delay: number; duration: number; left: string; angle: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 0, y: 0 }}
      animate={{ opacity: [0, 1, 1, 0], x: [0, 200, 400], y: [0, 100, 200] }}
      transition={{ delay, duration, repeat: Infinity, repeatDelay: Math.random() * 5 + 3 }}
      style={{
        position: 'absolute', top: -10, left, width: 60, height: 1,
        background: 'linear-gradient(to right, transparent, rgba(240,236,224,0.6))',
        transform: `rotate(${angle}deg)`,
        borderRadius: 1,
        pointerEvents: 'none', zIndex: 1,
      }}
    />
  );
}

/* ---------- Heart SVG Icon ---------- */
function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill={filled ? 'currentColor' : 'none'} strokeWidth={1.8}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

/* ---------- Comment Bubble SVG Icon ---------- */
function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" fill="none" strokeWidth={1.8}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}

/* ---------- Send SVG Icon ---------- */
function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" fill="none" strokeWidth={2}>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}

/* ---------- Main Page ---------- */
export default function Page4() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<SocialPost[]>(() => {
    try {
      const saved = localStorage.getItem('echo-square-posts');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return initialPosts;
  });
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [shareToast, setShareToast] = useState('');

  // Persist posts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('echo-square-posts', JSON.stringify(posts));
    } catch { /* quota exceeded, ignore */ }
  }, [posts]);

  // Auto dismiss toast
  useEffect(() => {
    if (!shareToast) return;
    const t = setTimeout(() => setShareToast(''), 2500);
    return () => clearTimeout(t);
  }, [shareToast]);

  // Read shared data from Page3
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('echo-share');
      if (!raw) return;
      const data = JSON.parse(raw);
      sessionStorage.removeItem('echo-share');
      if (!data.characterName) return;

      const newPost: SocialPost = {
        id: `post-shared-${Date.now()}`,
        characterId: data.characterId || '',
        characterName: data.characterName,
        characterGame: data.characterGame || '',
        avatarImage: data.avatarImage,
        avatar: data.avatar || '',
        content: data.entryContent || '',
        timestamp: '刚刚',
        likes: 0,
        comments: [],
        liked: false,
        sharedFrom: `来自${data.characterName}的档案馆`,
      };
      setPosts((prev) => [newPost, ...prev]);
      setShareToast(`收到来自${data.characterName}的分享`);
    } catch {
      sessionStorage.removeItem('echo-share');
    }
  }, []);

  /* Toggle like */
  const handleLike = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p,
      ),
    );
  };

  /* Toggle comment expansion */
  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) {
        next.delete(postId);
      } else {
        next.add(postId);
      }
      return next;
    });
  };

  /* Update comment input */
  const handleCommentInput = (postId: string, value: string) => {
    setCommentInputs((prev) => ({ ...prev, [postId]: value }));
  };

  /* Submit comment */
  const submitComment = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    const newComment: SocialComment = {
      id: `c-new-${Date.now()}`,
      author: '我',
      content: text,
      timestamp: '刚刚',
    };

    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comments: [newComment, ...p.comments] }
          : p,
      ),
    );

    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));

    // Auto-expand if not already
    if (!expandedComments.has(postId)) {
      setExpandedComments((prev) => new Set(prev).add(postId));
    }
  };

  return (
    <div
      className="w-full h-screen relative overflow-hidden"
      style={{ background: 'var(--bg-deep, #050505)' }}
    >
      {/* Star background */}
      <StarField density={80} />

      {/* Nebula layers */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: [
            'radial-gradient(ellipse 60% 50% at 20% 30%, rgba(90,70,140,0.06) 0%, transparent 70%)',
            'radial-gradient(ellipse 50% 60% at 75% 60%, rgba(60,100,140,0.05) 0%, transparent 70%)',
            'radial-gradient(ellipse 40% 40% at 50% 80%, rgba(80,60,120,0.04) 0%, transparent 60%)',
          ].join(', '),
        }}
      />

      {/* Shooting stars */}
      <ShootingStar delay={2} duration={3} left="10%" angle={35} />
      <ShootingStar delay={5} duration={2.5} left="55%" angle={25} />
      <ShootingStar delay={8} duration={3.5} left="30%" angle={40} />

      {/* Back button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        transition={{ delay: 0.3 }}
        onClick={() => navigate('/home')}
        style={{
          position: 'fixed',
          top: 20,
          left: 20,
          zIndex: 20,
          color: 'var(--text-muted)',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
          padding: '6px 14px',
          cursor: 'pointer',
          fontSize: '0.85rem',
          fontFamily: 'inherit',
        }}
      >
        &larr; 返回广场
      </motion.button>

      {/* Scrollable content */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          height: '100%',
          overflowY: 'auto',
          padding: '70px 16px 40px',
        }}
      >
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          {/* Page title */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{
              textAlign: 'center',
              marginBottom: 28,
            }}
          >
            <h2
              style={{
                fontSize: '1.3rem',
                color: 'var(--star-white)',
                letterSpacing: '0.1em',
                margin: 0,
                fontWeight: 400,
              }}
            >
              互动广场
            </h2>
            <div
              style={{
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                marginTop: 6,
                letterSpacing: '0.06em',
              }}
            >
              来自不同世界的声音
            </div>
          </motion.div>

          {/* Post cards */}
          {posts.map((post, index) => {
            const isExpanded = expandedComments.has(post.id);
            const visibleComments = isExpanded ? post.comments : post.comments.slice(0, 3);
            const hiddenCount = post.comments.length - 3;

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.08, duration: 0.45 }}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 8,
                  padding: 16,
                  marginBottom: 16,
                  backdropFilter: 'blur(4px)',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Avatar */}
                  {post.avatarImage ? (
                    <img
                      src={post.avatarImage}
                      alt={post.characterName}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        display: 'block',
                        border: '1.5px solid rgba(255,255,255,0.12)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                        flexShrink: 0,
                      }}
                      draggable={false}
                    />
                  ) : (
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: post.avatar,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1.5px solid rgba(255,255,255,0.12)',
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: 18, color: '#fff', fontWeight: 600 }}>
                        {post.characterName.charAt(0)}
                      </span>
                    </div>
                  )}
                  {/* Name + game */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.88rem',
                        color: 'var(--star-white)',
                        fontWeight: 500,
                        lineHeight: 1.3,
                      }}
                    >
                      {post.characterName}
                    </div>
                    <div
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        lineHeight: 1.3,
                      }}
                    >
                      {post.characterGame}
                    </div>
                    {post.sharedFrom && (
                      <div style={{
                        fontSize: '0.6rem',
                        color: 'var(--gold)',
                        background: 'rgba(200,168,96,0.08)',
                        border: '1px solid rgba(200,168,96,0.15)',
                        borderRadius: 3,
                        padding: '1px 6px',
                        marginTop: 2,
                        display: 'inline-block',
                        letterSpacing: '0.03em',
                      }}>
                        {post.sharedFrom}
                      </div>
                    )}
                  </div>
                  {/* Timestamp */}
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--text-muted)',
                      flexShrink: 0,
                    }}
                  >
                    {post.timestamp}
                  </div>
                </div>

                {/* Content */}
                <div
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-primary)',
                    lineHeight: 1.6,
                    marginTop: 10,
                  }}
                >
                  {post.content}
                </div>

                {/* Action bar */}
                <div
                  style={{
                    display: 'flex',
                    gap: 16,
                    marginTop: 10,
                    alignItems: 'center',
                  }}
                >
                  {/* Like button */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleLike(post.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: post.liked ? '#e74c3c' : 'var(--text-muted)',
                      fontSize: '0.78rem',
                      padding: 0,
                      fontFamily: 'inherit',
                    }}
                  >
                    <HeartIcon filled={post.liked} />
                    <span>{post.likes}</span>
                  </motion.button>

                  {/* Comment button */}
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleComments(post.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: 'var(--text-muted)',
                      fontSize: '0.78rem',
                      padding: 0,
                      fontFamily: 'inherit',
                    }}
                  >
                    <CommentIcon />
                    <span>{post.comments.length}</span>
                  </motion.button>
                </div>

                {/* Comments section */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div
                        style={{
                          marginTop: 12,
                          paddingTop: 10,
                          borderTop: '1px solid rgba(255,255,255,0.06)',
                        }}
                      >
                        {!isExpanded && hiddenCount > 0 && (
                          <div
                            onClick={() => toggleComments(post.id)}
                            style={{
                              fontSize: '0.72rem',
                              color: 'rgba(200,168,96,0.6)',
                              cursor: 'pointer',
                              marginBottom: 6,
                            }}
                          >
                            查看更多 {hiddenCount} 条评论
                          </div>
                        )}

                        {/* Comment list */}
                        {visibleComments.map((comment) => (
                          <div
                            key={comment.id}
                            style={{
                              fontSize: '0.78rem',
                              lineHeight: 1.5,
                              marginBottom: 8,
                            }}
                          >
                            <span
                              style={{
                                color: 'rgba(200,168,96,0.85)',
                                fontWeight: 500,
                                marginRight: 6,
                              }}
                            >
                              {comment.author}
                            </span>
                            <span style={{ color: 'var(--text-secondary)' }}>
                              {comment.content}
                            </span>
                            <span
                              style={{
                                color: 'var(--text-muted)',
                                fontSize: '0.65rem',
                                marginLeft: 8,
                              }}
                            >
                              {comment.timestamp}
                            </span>
                          </div>
                        ))}

                        {/* Comment input */}
                        <div
                          style={{
                            display: 'flex',
                            gap: 8,
                            marginTop: 10,
                            alignItems: 'center',
                          }}
                        >
                          <input
                            type="text"
                            placeholder="说点什么..."
                            value={commentInputs[post.id] ?? ''}
                            onChange={(e) => handleCommentInput(post.id, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                submitComment(post.id);
                              }
                            }}
                            style={{
                              flex: 1,
                              background: 'rgba(255,255,255,0.06)',
                              border: '1px solid rgba(255,255,255,0.08)',
                              borderRadius: 16,
                              padding: '6px 12px',
                              fontSize: '0.78rem',
                              color: 'var(--text-primary)',
                              outline: 'none',
                              fontFamily: 'inherit',
                            }}
                          />
                          <motion.button
                            whileTap={{ scale: 0.9 }}
                            onClick={() => submitComment(post.id)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 30,
                              height: 30,
                              borderRadius: '50%',
                              background: 'rgba(200,168,96,0.15)',
                              border: '1px solid rgba(200,168,96,0.2)',
                              cursor: 'pointer',
                              color: 'rgba(200,168,96,0.8)',
                              flexShrink: 0,
                            }}
                          >
                            <SendIcon />
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Share toast */}
      <AnimatePresence>
        {shareToast && (
          <motion.div
            key="share-toast"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            style={{
              position: 'fixed',
              bottom: 80,
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(200,168,96,0.9)',
              color: '#0a0a0a',
              padding: '8px 20px',
              borderRadius: 20,
              fontSize: '0.8rem',
              fontFamily: 'inherit',
              zIndex: 200,
              whiteSpace: 'nowrap',
            }}
          >
            {shareToast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
