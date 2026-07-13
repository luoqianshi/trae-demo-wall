<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUiStore } from '@/store/uiStore'
import { useUserStore } from '@/store/userStore'
import { mockHomeStats, mockExploreArchives } from '@/mock/data'

// 首页：英雄区 + 价值卡片 + 数据统计 + 推荐档案
const router = useRouter()
const uiStore = useUiStore()
const userStore = useUserStore()

const stats = ref(mockHomeStats)
const featured = ref(mockExploreArchives.slice(0, 3))

// 价值卡：图标 + 标签
const values = [
  {
    num: '01',
    icon: 'lucide:archive',
    cls: 'save',
    title: '保存',
    desc: '把散落在家里的老照片、地契、家谱、书信扫描入库，让脆弱的纸张获得数字生命，再不怕虫蛀水浸。'
  },
  {
    num: '02',
    icon: 'lucide:mic',
    cls: 'tell',
    title: '讲述',
    desc: '用录音留住老人的声音。方言里的故事、祖辈的叮嘱、村庄的旧事，都能变成可传承的文字。'
  },
  {
    num: '03',
    icon: 'lucide:git-fork',
    cls: 'connect',
    title: '连接',
    desc: '把家族成员串成一棵树。无论走多远，孩子都能知道自己的根在哪里，从哪里来。'
  }
]

// 推荐档案封面色
const coverClass = (i) => ['c1', 'c2', 'c3'][i % 3]
// 推荐档案封面 Lucide 图标
const coverIcons = ['lucide:wheat', 'lucide:mountain', 'lucide:leaf']

// 跳转档案
const goArchive = () => {
  if (!userStore.isLoggedIn) {
    uiStore.showToast('请先登录', 'err')
    router.push({ name: 'login', query: { redirect: '/archive' } })
  } else {
    router.push('/archive')
  }
}

// 跳转探索
const goExplore = () => router.push('/explore')
</script>

<template>
  <div class="page">
    <!-- 英雄区 -->
    <section class="hero">
      <div class="hero-grid">
        <div class="hero-left">
          <div class="hero-badge">
            <span class="dot"></span>
            正在为 {{ stats.archiveCount }} 个乡村家庭建档
          </div>
          <h1>让家族记忆，<br /><span class="accent">永不消失</span></h1>
          <p class="lead">
            用数字技术帮每个乡村家庭建立永久档案。老照片会褪色，老人会离开，
            但记忆可以被认真保存下来，一代代传下去。
          </p>
          <div class="hero-cta">
            <button class="btn btn-primary" @click="goArchive">
              <AppIcon icon="lucide:folder-plus" :size="16" />
              开始建档
            </button>
            <button class="btn btn-ghost" @click="goExplore">
              <AppIcon icon="lucide:eye" :size="16" />
              浏览他人档案
            </button>
          </div>
          <div class="hero-stats">
            <div class="hero-stat">
              <div class="num">{{ stats.archiveCount }}</div>
              <div class="label">已建档家庭</div>
            </div>
            <div class="hero-stat">
              <div class="num">{{ stats.photoCount }}</div>
              <div class="label">修复老照片</div>
            </div>
            <div class="hero-stat">
              <div class="num">{{ stats.oralCount }}</div>
              <div class="label">收录口述</div>
            </div>
          </div>
        </div>

        <!-- 旧相册堆叠：使用真实图片质感 -->
        <div class="album-stack">
          <div class="seal-mark">陈<br />氏<br />宗<br />谱</div>
          <div class="album-card c1">
            <div class="photo">
              <img src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&q=80" alt="稻田" loading="lazy" />
              <div class="photo-overlay"></div>
            </div>
            <div class="caption"><b>祖父与稻田</b><small>1967 · 田家村</small></div>
          </div>
          <div class="album-card c2">
            <div class="photo">
              <img src="https://images.unsplash.com/photo-1444464666168-49d633b86797?w=600&q=80" alt="全家福" loading="lazy" />
              <div class="photo-overlay"></div>
            </div>
            <div class="caption"><b>全家福</b><small>1984 · 春节</small></div>
          </div>
          <div class="album-card c3">
            <div class="photo">
              <img src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600&q=80" alt="老屋" loading="lazy" />
              <div class="photo-overlay"></div>
            </div>
            <div class="caption"><b>老屋门前</b><small>1972 · 夏</small></div>
          </div>
        </div>
      </div>
    </section>

    <!-- 价值卡片 -->
    <section class="values-section">
      <div class="section-eyebrow">我们做什么</div>
      <h2 class="section-title">三件事，留住一个家</h2>
      <div class="values">
        <div class="value-card" v-for="v in values" :key="v.num">
          <div class="value-num">{{ v.num }}</div>
          <div class="value-icon" :class="v.cls">
            <AppIcon :icon="v.icon" :size="28" />
          </div>
          <h3>{{ v.title }}</h3>
          <p>{{ v.desc }}</p>
        </div>
      </div>
    </section>

    <!-- 数据统计带 -->
    <section class="stats-band">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-icon"><AppIcon icon="lucide:home" :size="22" /></div>
          <div class="num">{{ stats.archiveCount }}<span class="plus">+</span></div>
          <div class="bar"></div>
          <div class="label">已建档家庭</div>
        </div>
        <div class="stat-item">
          <div class="stat-icon"><AppIcon icon="lucide:image" :size="22" /></div>
          <div class="num">{{ stats.photoCount }}</div>
          <div class="bar"></div>
          <div class="label">修复老照片</div>
        </div>
        <div class="stat-item">
          <div class="stat-icon"><AppIcon icon="lucide:mic" :size="22" /></div>
          <div class="num">{{ stats.oralCount }}</div>
          <div class="bar"></div>
          <div class="label">收录口述</div>
        </div>
      </div>
    </section>

    <!-- 推荐档案 -->
    <section class="featured-section">
      <div class="section-eyebrow">推荐档案</div>
      <h2 class="section-title">翻开他们的家族册</h2>
      <p class="section-sub">这些家庭已经把记忆整理成册。每一份档案背后，都是几代人的故事。</p>
      <div class="archive-grid">
        <div
          v-for="(a, i) in featured"
          :key="a.id"
          class="archive-card"
          @click="goExplore"
        >
          <div class="archive-cover" :class="coverClass(i)">
            <div class="cover-icon"><AppIcon :icon="coverIcons[i % coverIcons.length]" :size="44" /></div>
            <div class="cover-shine"></div>
          </div>
          <div class="archive-body">
            <div class="village">
              <AppIcon icon="lucide:map-pin" :size="12" />
              {{ a.village }}
            </div>
            <h4>{{ a.familyName }}家族档案</h4>
            <p>{{ a.description }}</p>
            <div class="archive-more">
              查看档案 <AppIcon icon="lucide:arrow-right" :size="14" />
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hero {
  padding: 60px 0 80px;
}

.hero-grid {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 60px;
  align-items: center;
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 7px 16px;
  border-radius: 30px;
  background: rgba(168, 50, 50, 0.08);
  border: 1px solid rgba(168, 50, 50, 0.2);
  font-size: 13px;
  color: var(--seal);
  margin-bottom: 26px;
  letter-spacing: 1px;
}

.hero-badge .dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--seal);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.hero h1 {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 74px;
  line-height: 1.08;
  color: var(--primary-deep);
  letter-spacing: 3px;
  margin-bottom: 24px;
}

.hero h1 .accent {
  color: var(--seal);
  position: relative;
  display: inline-block;
}

.hero h1 .accent::after {
  content: '';
  position: absolute;
  left: -4px;
  right: -4px;
  bottom: 6px;
  height: 14px;
  background: rgba(212, 165, 116, 0.45);
  z-index: -1;
  border-radius: 2px;
}

.hero p.lead {
  font-size: 18px;
  color: var(--text-light);
  max-width: 520px;
  margin-bottom: 36px;
  line-height: 1.8;
}

.hero-cta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.hero-stats {
  display: flex;
  gap: 38px;
  margin-top: 46px;
  flex-wrap: wrap;
}

.hero-stat .num {
  font-family: var(--font-display);
  font-size: 38px;
  color: var(--moss-deep);
  line-height: 1;
}

.hero-stat .label {
  font-size: 13px;
  color: var(--text-light);
  letter-spacing: 2px;
  margin-top: 6px;
}

/* 相册堆叠：真实图片质感 */
.album-stack {
  position: relative;
  height: 440px;
  perspective: 1200px;
}

.album-card {
  position: absolute;
  width: 280px;
  height: 340px;
  border-radius: 10px;
  background: var(--bg-warm);
  box-shadow:
    0 22px 50px rgba(94, 70, 50, 0.25),
    inset 0 0 0 1px rgba(139, 107, 80, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  padding: 14px;
  display: flex;
  flex-direction: column;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.album-card .photo {
  flex: 1;
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  background: var(--bg-deep);
}

.album-card .photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  filter: sepia(0.4) contrast(0.95) saturate(0.85);
  transition: filter 0.6s ease;
}

.album-card:hover .photo img {
  filter: sepia(0.2) contrast(1) saturate(0.95);
}

.album-card .photo-overlay {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 40% 30%, rgba(250, 246, 239, 0.2), transparent 60%),
    linear-gradient(180deg, transparent 60%, rgba(94, 70, 50, 0.2));
}

.album-card .caption {
  padding-top: 10px;
  text-align: center;
}

.album-card .caption b {
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--primary-deep);
}

.album-card .caption small {
  display: block;
  font-size: 11px;
  color: var(--text-light);
  letter-spacing: 1px;
  margin-top: 2px;
}

.album-card.c1 { top: 30px; left: 0; transform: rotate(-8deg); }
.album-card.c2 { top: 60px; left: 120px; transform: rotate(3deg); z-index: 2; }
.album-card.c3 { top: 90px; left: 50px; transform: rotate(6deg); }

.album-stack:hover .c1 { transform: rotate(-12deg) translateX(-12px); }
.album-stack:hover .c2 { transform: rotate(5deg) translateY(-10px); }
.album-stack:hover .c3 { transform: rotate(9deg) translateX(14px); }

.seal-mark {
  position: absolute;
  top: -10px;
  right: 30px;
  z-index: 5;
  width: 54px;
  height: 54px;
  border-radius: 6px;
  background: var(--gradient-seal);
  color: var(--bg-warm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 13px;
  line-height: 1.1;
  text-align: center;
  transform: rotate(8deg);
  box-shadow: inset 0 0 0 2px rgba(243, 234, 217, 0.6), 0 6px 16px rgba(168, 50, 50, 0.4);
}

/* 价值卡片 */
.values-section {
  margin-top: 50px;
}

.values {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px;
  margin-top: 50px;
}

.value-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.5), transparent 30%), var(--bg-warm);
  border-radius: var(--radius-lg);
  padding: 40px 32px;
  box-shadow: var(--shadow-soft);
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(139, 107, 80, 0.1);
}

.value-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-light), var(--primary), var(--moss));
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.5s ease;
}

.value-card:hover {
  transform: translateY(-8px);
  box-shadow: var(--shadow-lift);
}

.value-card:hover::before {
  transform: scaleX(1);
}

.value-icon {
  width: 60px;
  height: 60px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bg-warm);
  margin-bottom: 22px;
  box-shadow: 0 6px 16px rgba(94, 70, 50, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.value-icon.save { background: var(--gradient-primary); }
.value-icon.tell { background: var(--gradient-moss); }
.value-icon.connect { background: linear-gradient(135deg, var(--primary-light), var(--gold)); }

.value-card h3 {
  font-family: var(--font-display);
  font-size: 28px;
  color: var(--primary-deep);
  margin-bottom: 10px;
  font-weight: 400;
}

.value-card p {
  color: var(--text-light);
  font-size: 15px;
  line-height: 1.8;
}

.value-num {
  position: absolute;
  top: 24px;
  right: 28px;
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 60px;
  color: rgba(139, 107, 80, 0.12);
  font-weight: 600;
  font-style: italic;
}

/* 数据统计带 */
.stats-band {
  margin-top: 60px;
  background: var(--gradient-moss);
  border-radius: var(--radius-lg);
  padding: 50px 40px;
  color: var(--bg-warm);
  position: relative;
  overflow: hidden;
  box-shadow: 0 12px 36px rgba(63, 90, 77, 0.3);
}

.stats-band::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.12;
  background-image: repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(250, 246, 239, 0.3) 20px, rgba(250, 246, 239, 0.3) 21px);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  position: relative;
}

.stat-item {
  text-align: center;
}

.stat-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(250, 246, 239, 0.15);
  margin-bottom: 14px;
  border: 1px solid rgba(250, 246, 239, 0.2);
}

.stat-item .num {
  font-family: var(--font-display);
  font-size: 52px;
  color: var(--earth-soft);
  line-height: 1;
}

.stat-item .num .plus {
  font-size: 24px;
  vertical-align: super;
  opacity: 0.8;
}

.stat-item .label {
  margin-top: 10px;
  font-size: 14px;
  letter-spacing: 3px;
  opacity: 0.85;
}

.stat-item .bar {
  width: 40px;
  height: 2px;
  background: var(--primary-light);
  margin: 14px auto 0;
  opacity: 0.6;
}

/* 推荐档案 */
.featured-section {
  margin-top: 70px;
}

.archive-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 26px;
  margin-top: 40px;
}

.archive-card {
  background: var(--bg-warm);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-soft);
  cursor: pointer;
  transition: all 0.4s ease;
  border: 1px solid rgba(139, 107, 80, 0.1);
}

.archive-card:hover {
  transform: translateY(-6px);
  box-shadow: var(--shadow-lift);
}

.archive-cover {
  height: 180px;
  position: relative;
  overflow: hidden;
}

.archive-cover.c1 { background: linear-gradient(135deg, #9bb5a3, var(--moss)); }
.archive-cover.c2 { background: linear-gradient(135deg, var(--primary-light), var(--primary)); }
.archive-cover.c3 { background: linear-gradient(135deg, #c89b6b, var(--primary-deep)); }

.archive-cover::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 70% 20%, rgba(250, 246, 239, 0.25), transparent 60%);
}

.cover-shine {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(115deg, transparent 30%, rgba(255, 255, 255, 0.15) 50%, transparent 70%);
  transform: translateX(-100%);
  transition: transform 0.8s ease;
}

.archive-card:hover .cover-shine {
  transform: translateX(100%);
}

.cover-icon {
  position: absolute;
  bottom: 14px;
  left: 18px;
  color: rgba(250, 246, 239, 0.92);
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.25));
}

.archive-body {
  padding: 22px;
}

.archive-body .village {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--seal);
  letter-spacing: 2px;
  margin-bottom: 6px;
}

.archive-body h4 {
  font-family: var(--font-display);
  font-size: 22px;
  color: var(--primary-deep);
  font-weight: 400;
  margin-bottom: 8px;
}

.archive-body p {
  font-size: 13px;
  color: var(--text-light);
  line-height: 1.6;
  margin-bottom: 14px;
}

.archive-more {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--primary);
  font-weight: 600;
  transition: gap var(--transition);
}

.archive-card:hover .archive-more {
  gap: 8px;
  color: var(--seal);
}

@media (max-width: 900px) {
  .hero-grid {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  .hero h1 { font-size: 48px; }
  .album-stack { height: 380px; margin: 0 auto; }
  .values, .archive-grid { grid-template-columns: 1fr; }
  .stats-grid { grid-template-columns: 1fr; gap: 24px; }
}

@media (max-width: 520px) {
  .hero h1 { font-size: 36px; }
  .section-title { font-size: 28px; }
}
</style>
