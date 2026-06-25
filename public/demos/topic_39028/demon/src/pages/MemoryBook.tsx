import { useParams, useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useRef, useEffect } from 'react';
import { ChevronDown, MapPin, Camera, Footprints, Navigation as NavIcon, Heart, Mountain, Wind, Sun, Sparkles } from 'lucide-react';
import { travelDetails } from '../data/mockData';

const U = (id: string, w = 800) =>
  `https://images.unsplash.com/${id}?w=${w}&auto=format&fit=crop&q=80`;

function FadeInSection({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function ParallaxImage({ src, alt, speed = 0.3 }: { src: string; alt: string; speed?: number }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-10%', '10%']);
  return (
    <div ref={ref} className="overflow-hidden relative">
      <motion.img src={src} alt={alt} style={{ y }} className="w-full h-full object-cover scale-110" />
    </div>
  );
}

export default function MemoryBook() {
  const { id = 'bali' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const travel = travelDetails[id];
  const { scrollYProgress } = useScroll();
  const progressBarWidth = useTransform(scrollYProgress, [0, 1], ['0%', '100%']);

  useEffect(() => {
    document.body.style.overflowX = 'hidden';
    return () => { document.body.style.overflowX = ''; };
  }, []);

  if (!travel || id !== 'bali') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="text-center">
          <p className="text-lg mb-4">回忆册暂仅支持巴厘岛旅行</p>
          <button onClick={() => navigate(-1)} className="px-6 py-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
            返回
          </button>
        </div>
      </div>
    );
  }

  const ai = travel.aiData;
  const happy = ai?.happinessMoment;

  const chapters = [
    {
      num: '01',
      title: '抵达',
      subtitle: 'Chapter 1',
      date: '2024年7月15日',
      image: U('photo-1530789253388-582c481c54b0'),
      paragraphs: [
        '当飞机降落在巴厘岛时，当地气温 29\u00B0C。',
        '这是本次旅行拍摄的第一张照片。',
        'AI 检测到：抵达后的 6 小时内，你拍摄了 31 张照片，远高于平时水平。',
        '这意味着：你对这次旅行充满期待。',
      ],
      note: '第一张照片拍摄于 15:23，距降落仅 2 小时',
    },
    {
      num: '02',
      title: '海风',
      subtitle: 'Chapter 2',
      date: '2024年7月16日 - 17日',
      image: U('photo-1559128010-7c1ad6e1b6a5'),
      paragraphs: [
        '你去了乌布皇宫、猴林公园、德格拉朗梯田，然后是蓝梦岛。',
        '在蓝梦岛，你拍了 31 张海底照片。',
        'AI 识别出 18 种不同的珊瑚和鱼类。',
        '"恶魔的眼泪" 让你驻足了 47 分钟。',
      ],
      note: '你在海边停留的时间远超平均水平',
    },
    {
      num: '03',
      title: '日落',
      subtitle: 'Chapter 3',
      date: '2024年7月18日',
      image: U('photo-1507525428034-b723cf961d3e'),
      paragraphs: [
        '今天你只拍了一个地方：Melasti Beach。',
        '连续 42 张照片，停留 2 小时 14 分钟。',
        'AI 推断这是本次旅行你最幸福的一刻。',
        '日落场景出现频率最高，金色光线反复出现。',
      ],
      note: '拍摄最多的是黄昏时刻',
    },
    {
      num: '04',
      title: '归途',
      subtitle: 'Chapter 4',
      date: '2024年7月19日 - 21日',
      image: U('photo-1501785888041-af3ef285b470'),
      paragraphs: [
        '凌晨 4 点你出发去爬巴杜尔火山。',
        '当太阳从火山口升起时，你拍了 18 张延时素材。',
        '库塔海滩的浪很大，你尝试了人生第一次冲浪。',
        '回程的航班在 17:30 起飞，AI 在相册里找到了 9 张窗外的云海。',
      ],
      note: '视频回放次数最多的是火山温泉那一段',
    },
  ];

  return (
    <div className="bg-black text-white selection:bg-orange-500/30">
      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 z-[60] origin-left"
        style={{ width: progressBarWidth }}
      />

      {/* ─── SECTION 1: COVER ─── */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <ParallaxImage
            src={travel.coverImage}
            alt={travel.title}
            speed={0.2}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80" />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="relative z-10 text-center px-6"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-sm tracking-[0.4em] uppercase text-orange-400 mb-6"
          >
            Travel Memory Book
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-7xl md:text-[120px] font-black tracking-tighter leading-none mb-4"
          >
            BALI
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="text-lg md:text-xl text-white/70 font-light tracking-wide mb-8"
          >
            Summer 2024
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="flex items-center justify-center gap-8 text-white/60 text-sm"
          >
            <span>July 15 - July 21</span>
            <span className="w-1 h-1 rounded-full bg-orange-400" />
            <span>7 Days</span>
            <span className="w-1 h-1 rounded-full bg-orange-400" />
            <span>{ai?.photos ?? 126} Photos</span>
            <span className="w-1 h-1 rounded-full bg-orange-400" />
            <span>{ai?.videos ?? 18} Videos</span>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/50 text-xs"
        >
          <span className="tracking-widest uppercase">向下滚动探索这段旅程</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ChevronDown size={20} />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── SECTION 2: AI SUMMARY ─── */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <ParallaxImage src={U('photo-1537996194471-e657df975ab4', 1200)} alt="summary bg" speed={0.15} />
          <div className="absolute inset-0 bg-black/75" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto px-6 py-24 md:py-32">
          <FadeInSection>
            <p className="text-sm tracking-[0.3em] uppercase text-orange-400 mb-8">AI Travel Summary</p>
          </FadeInSection>

          <FadeInSection delay={0.15}>
            <h2 className="text-3xl md:text-5xl font-bold leading-tight mb-10">
              这是一段关于<span className="text-orange-400">海风</span>、<span className="text-amber-400">日落</span>和<span className="text-rose-400">自由</span>的旅程。
            </h2>
          </FadeInSection>

          <FadeInSection delay={0.3}>
            <div className="space-y-4 text-lg md:text-xl text-white/80 leading-relaxed mb-12">
              <p>{ai?.days ?? 7} 天时间里，</p>
              <p>你记录了 <span className="text-white font-bold">{ai?.photos ?? 126}</span> 张照片，</p>
              <p>拍摄 <span className="text-white font-bold">{ai?.videos ?? 18}</span> 段视频，</p>
              <p>探索 <span className="text-white font-bold">{ai?.locations ?? 8}</span> 个地点。</p>
            </div>
          </FadeInSection>

          <FadeInSection delay={0.45}>
            <div className="p-6 rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="flex items-center gap-2 text-orange-400 mb-4">
                <Sparkles size={16} />
                <span className="text-sm font-medium tracking-wide">AI 发现</span>
              </div>
              <div className="space-y-3 text-white/75 text-sm md:text-base leading-relaxed">
                <p>你在海边停留的时间远超平均水平，</p>
                <p>拍摄最多的是黄昏时刻，</p>
                <p>最常出现的关键词是：<span className="text-orange-400 font-medium">海风</span>、<span className="text-amber-400 font-medium">日落</span>、<span className="text-rose-400 font-medium">自由</span>。</p>
                <p className="text-white font-medium pt-2">AI 认为：这是你近两年最放松的一次旅行。</p>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ─── SECTION 3: JOURNEY STORY ─── */}
      <section className="relative">
        {chapters.map((chapter, idx) => (
          <div key={chapter.num} className="relative">
            {/* Chapter Divider */}
            <div className="h-screen flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0">
                <ParallaxImage src={chapter.image} alt={chapter.title} speed={0.2} />
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60" />
              </div>

              <FadeInSection className="relative z-10 text-center px-6">
                <p className="text-sm tracking-[0.4em] uppercase text-orange-400 mb-4">{chapter.subtitle}</p>
                <h3 className="text-6xl md:text-9xl font-black tracking-tighter text-white/90 mb-4">
                  {chapter.title}
                </h3>
                <p className="text-white/50 text-sm tracking-wide">{chapter.date}</p>
              </FadeInSection>
            </div>

            {/* Chapter Content */}
            <div className={`relative py-20 md:py-32 ${idx % 2 === 0 ? 'bg-neutral-950' : 'bg-black'}`}>
              <div className="max-w-5xl mx-auto px-6">
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center ${idx % 2 === 1 ? 'md:direction-rtl' : ''}`}>
                  <FadeInSection className={idx % 2 === 1 ? 'md:order-2' : ''}>
                    <div className="relative aspect-[4/5] rounded-3xl overflow-hidden">
                      <img src={chapter.image} alt={chapter.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                    </div>
                  </FadeInSection>

                  <div className={idx % 2 === 1 ? 'md:order-1' : ''}>
                    <FadeInSection delay={0.15}>
                      <p className="text-orange-400 text-sm font-medium tracking-wide mb-2">{chapter.num}</p>
                      <h4 className="text-3xl md:text-4xl font-bold mb-6">{chapter.title}</h4>
                    </FadeInSection>

                    <FadeInSection delay={0.3}>
                      <div className="space-y-4 text-white/70 text-base md:text-lg leading-relaxed">
                        {chapter.paragraphs.map((p, pIdx) => (
                          <p key={pIdx}>{p}</p>
                        ))}
                      </div>
                    </FadeInSection>

                    {chapter.note && (
                      <FadeInSection delay={0.45}>
                        <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10">
                          <div className="flex items-center gap-2 text-orange-400 text-xs font-medium mb-1.5">
                            <Sparkles size={12} />
                            <span>AI 检测</span>
                          </div>
                          <p className="text-white/60 text-sm">{chapter.note}</p>
                        </div>
                      </FadeInSection>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ─── SECTION 4: HIGHLIGHT MOMENT ─── */}
      {happy && (
        <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0">
            <ParallaxImage src={happy.image} alt={happy.location} speed={0.15} />
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
          </div>

          <div className="relative z-10 max-w-3xl mx-auto px-6 py-24 text-center">
            <FadeInSection>
              <p className="text-sm tracking-[0.4em] uppercase text-orange-400 mb-4">Highlight</p>
            </FadeInSection>

            <FadeInSection delay={0.15}>
              <h2 className="text-4xl md:text-6xl font-bold mb-6">
                本次旅行<br />
                <span className="text-orange-400">最幸福的瞬间</span>
              </h2>
            </FadeInSection>

            <FadeInSection delay={0.3}>
              <div className="mb-10">
                <p className="text-6xl md:text-8xl font-black text-white/90 mb-2">{happy.time}</p>
                <p className="text-xl md:text-2xl text-white/60">{happy.date}</p>
                <div className="flex items-center justify-center gap-2 text-white/80 mt-3">
                  <MapPin size={18} className="text-orange-400" />
                  <span className="text-lg">{happy.location}</span>
                </div>
              </div>
            </FadeInSection>

            <FadeInSection delay={0.45}>
              <div className="p-6 rounded-3xl bg-black/40 backdrop-blur-md border border-white/10 text-left">
                <div className="flex items-center gap-2 text-orange-400 mb-4">
                  <Heart size={16} className="fill-orange-400" />
                  <span className="text-sm font-medium tracking-wide">AI 分析依据</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { icon: Camera, text: `连续拍摄 ${happy.photosTaken} 张照片` },
                    { icon: Footprints, text: '停留时间最长' },
                    { icon: Sun, text: '日落出现频率最高' },
                    { icon: Wind, text: '金色光线反复出现' },
                  ].map((item, i) => {
                    const Icon = item.icon;
                    return (
                      <div key={i} className="flex items-center gap-3 text-white/75 text-sm">
                        <Icon size={16} className="text-orange-400/80" />
                        <span>{item.text}</span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-4 pt-4 border-t border-white/10 text-white/60 text-sm">
                  停留了 <span className="text-white font-medium">{happy.stayDuration}</span>，AI 判断这是本次旅行最快乐的时刻。
                </p>
              </div>
            </FadeInSection>
          </div>
        </section>
      )}

      {/* ─── SECTION 5: FOOTPRINT MAP ─── */}
      <section className="relative py-24 md:py-32 bg-neutral-950">
        <div className="max-w-5xl mx-auto px-6">
          <FadeInSection className="text-center mb-16">
            <p className="text-sm tracking-[0.4em] uppercase text-orange-400 mb-4">Footprint</p>
            <h2 className="text-4xl md:text-5xl font-bold mb-3">你在巴厘岛留下的足迹</h2>
          </FadeInSection>

          <FadeInSection delay={0.15}>
            <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-neutral-900 to-neutral-800 p-8 md:p-12 mb-12">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {travel.mapTrack.points.map((point, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-white text-sm font-medium">{point.name}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-center">
                <svg className="w-full max-w-md h-12" viewBox="0 0 400 48" fill="none">
                  <path d="M 20 24 Q 100 4 200 24 T 380 24" stroke="url(#fpGrad)" strokeWidth="2" strokeDasharray="6 4" fill="none" />
                  <defs>
                    <linearGradient id="fpGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#FF6B35" />
                      <stop offset="100%" stopColor="#4ECDC4" />
                    </linearGradient>
                  </defs>
                  {[20, 133, 266, 380].map((x, i) => (
                    <g key={i}>
                      <circle cx={x} cy="24" r="6" fill="white" stroke="#FF6B35" strokeWidth="2" />
                      <circle cx={x} cy="24" r="2.5" fill="#FF6B35" />
                    </g>
                  ))}
                </svg>
              </div>
            </div>
          </FadeInSection>

          <FadeInSection delay={0.3}>
            <div className="text-center">
              <div className="inline-flex items-center gap-4 px-8 py-5 rounded-3xl bg-white/5 border border-white/10">
                <NavIcon size={24} className="text-orange-400" />
                <div className="text-left">
                  <p className="text-4xl font-black text-white">{ai?.distance ?? 42} <span className="text-lg font-normal text-white/60">KM</span></p>
                  <p className="text-sm text-white/50">总移动距离</p>
                </div>
              </div>
              <p className="mt-4 text-white/40 text-sm">
                相当于从上海外滩步行到上海迪士尼
              </p>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ─── SECTION 6: TRAVEL PERSONALITY ─── */}
      <section className="relative py-24 md:py-32 bg-black overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <ParallaxImage src={U('photo-1506905925346-21bda4d32df4', 1200)} alt="personality bg" speed={0.1} />
        </div>
        <div className="absolute inset-0 bg-black/80" />

        <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
          <FadeInSection>
            <p className="text-sm tracking-[0.4em] uppercase text-orange-400 mb-6">Travel Personality</p>
          </FadeInSection>

          <FadeInSection delay={0.15}>
            <h2 className="text-4xl md:text-5xl font-bold mb-4">你的旅行人格</h2>
          </FadeInSection>

          <FadeInSection delay={0.3}>
            <div className="my-10">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-orange-400 via-amber-400 to-rose-400 flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-orange-500/20">
                <Sun size={48} className="text-white" />
              </div>
              <h3 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-orange-400 via-amber-400 to-rose-400 bg-clip-text text-transparent mb-6">
                日落收藏家
              </h3>
            </div>
          </FadeInSection>

          <FadeInSection delay={0.45}>
            <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
              {['慢旅行者', '风景猎人', '海岛爱好者', '黄昏追逐者'].map((tag) => (
                <span key={tag} className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-sm">
                  {tag}
                </span>
              ))}
            </div>
          </FadeInSection>

          <FadeInSection delay={0.6}>
            <div className="p-6 rounded-3xl bg-white/5 border border-white/10 text-left">
              <div className="flex items-center gap-2 text-orange-400 mb-4">
                <Sparkles size={16} />
                <span className="text-sm font-medium tracking-wide">AI 分析依据</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
                {[
                  { value: '38%', label: '照片拍摄于黄昏', icon: Sun },
                  { value: '87%', label: '风景照片占比', icon: Mountain },
                  { value: '2h+', label: '海边平均停留', icon: Wind },
                ].map((item, i) => {
                  const Icon = item.icon;
                  return (
                    <div key={i} className="text-center p-4 rounded-2xl bg-white/5">
                      <Icon size={20} className="text-orange-400 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-white mb-1">{item.value}</p>
                      <p className="text-xs text-white/50">{item.label}</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-white/60 text-sm leading-relaxed">
                比起打卡景点，你更喜欢慢下来感受环境。你会在一个喜欢的地方反复拍照、长久停留，而不是赶往下一个目的地。
              </p>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ─── SECTION 7: FUTURE SELF ─── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <ParallaxImage src={U('photo-1544551763-46a013bb70d5', 1200)} alt="future" speed={0.1} />
          <div className="absolute inset-0 bg-black/70" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto px-6 py-24 text-center">
          <FadeInSection>
            <p className="text-sm tracking-[0.4em] uppercase text-orange-400 mb-8">For Your Future Self</p>
          </FadeInSection>

          <FadeInSection delay={0.15}>
            <h2 className="text-4xl md:text-5xl font-bold mb-10 leading-tight">
              写给未来的自己
            </h2>
          </FadeInSection>

          <FadeInSection delay={0.3}>
            <div className="space-y-5 text-lg md:text-xl text-white/70 leading-relaxed mb-12">
              <p>2024 年夏天，</p>
              <p>你去了巴厘岛。</p>
              <p>拍摄了 <span className="text-white font-bold">{ai?.photos ?? 126}</span> 张照片。</p>
              <p>记录了 <span className="text-white font-bold">{ai?.videos ?? 18}</span> 段视频。</p>
              <p>看过 <span className="text-white font-bold">5</span> 次日落。</p>
              <p className="pt-4 text-white/50">AI 已经替你保存了这段记忆。</p>
            </div>
          </FadeInSection>

          <FadeInSection delay={0.45}>
            <p className="text-2xl md:text-3xl font-bold text-white/90 mb-16 leading-relaxed">
              希望多年以后，<br />
              你依然记得那天海边的风。
            </p>
          </FadeInSection>

          <FadeInSection delay={0.6}>
            <div className="pt-10 border-t border-white/10">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">M</span>
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
                  Moment
                </span>
              </div>
              <p className="text-white/30 text-xs tracking-widest uppercase">
                Record Every Journey.
              </p>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        onClick={() => navigate(`/travel/${id}`)}
        className="fixed bottom-8 right-8 z-50 px-5 py-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-all"
      >
        返回详情
      </motion.button>
    </div>
  );
}
