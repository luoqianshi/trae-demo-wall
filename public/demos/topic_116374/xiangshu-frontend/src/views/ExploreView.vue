<script setup>
import { ref, computed, onMounted } from 'vue'
import { useArchiveStore } from '@/store/archiveStore'

// 探索页：搜索框 + 公开档案列表
const archiveStore = useArchiveStore()
const keyword = ref('')

onMounted(async () => {
  await archiveStore.fetchExploreArchives()
})

// 过滤结果
const filtered = computed(() => {
  const k = keyword.value.trim()
  if (!k) return archiveStore.exploreArchives
  return archiveStore.exploreArchives.filter(
    (a) => a.familyName.includes(k) || a.village.includes(k)
  )
})

const coverClass = (i) => ['c1', 'c2', 'c3'][i % 3]
// 探索卡片封面 Lucide 图标，按索引轮换
const coverIcons = ['lucide:wheat', 'lucide:mountain', 'lucide:leaf']
</script>

<template>
  <div class="page">
    <div class="page-head">
      <div class="section-eyebrow center">探索他乡</div>
      <h2 class="section-title">看看别家的故事</h2>
      <p class="section-sub center">
        搜索村庄或家庭，发现那些被认真保存的家族记忆
      </p>
    </div>

    <div class="search-box">
      <AppIcon icon="lucide:search" :size="18" class="search-icon" />
      <input
        v-model="keyword"
        placeholder="输入村庄或家庭名称，如：田家村 / 陈家"
        @keyup.enter="() => {}"
      />
      <button>
        <AppIcon icon="lucide:search" :size="15" />
        搜索
      </button>
    </div>

    <p class="result-tip" v-if="keyword">
      共找到 <b>{{ filtered.length }}</b> 个相关档案
    </p>

    <div class="explore-grid" v-if="filtered.length">
      <div
        v-for="(a, i) in filtered"
        :key="a.id"
        class="archive-card"
      >
        <div class="archive-cover" :class="coverClass(i)">
          <div class="cover-icon">
            <AppIcon :icon="coverIcons[i % coverIcons.length]" :size="48" />
          </div>
        </div>
        <div class="archive-body">
          <div class="village">
            <AppIcon icon="lucide:map-pin" :size="13" />
            {{ a.village }}
          </div>
          <h4>{{ a.familyName }}家族档案</h4>
          <p>{{ a.description }}</p>
        </div>
      </div>
    </div>

    <div v-else class="empty">
      <div class="empty-icon">
        <AppIcon icon="lucide:search-x" :size="56" />
      </div>
      <p>没有找到相关档案</p>
      <span>试试其他关键词，如"陈家"或"梯田村"</span>
    </div>
  </div>
</template>

<style scoped>
.page-head {
  text-align: center;
  margin-bottom: 30px;
}

.section-eyebrow.center {
  justify-content: center;
}

.section-sub.center {
  margin: 0 auto;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-warm);
  border-radius: 50px;
  padding: 6px 6px 6px 18px;
  box-shadow: var(--shadow-soft);
  max-width: 600px;
  margin: 0 auto 40px;
  border: 1px solid rgba(139, 107, 80, 0.15);
}

.search-box .search-icon {
  color: var(--text-light);
  flex-shrink: 0;
}

.search-box input {
  flex: 1;
  border: none;
  background: transparent;
  padding: 12px 6px;
  font-family: var(--font-serif);
  font-size: 15px;
  color: var(--text);
  outline: none;
}

.search-box button {
  background: linear-gradient(135deg, var(--primary), var(--primary-deep));
  color: var(--bg-warm);
  border: none;
  border-radius: 50px;
  padding: 0 24px;
  font-family: var(--font-serif);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.25s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 42px;
}

.search-box button:hover {
  transform: scale(1.03);
}

.result-tip {
  text-align: center;
  color: var(--text-light);
  margin-bottom: 24px;
}

.result-tip b {
  color: var(--seal);
}

.explore-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
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
  height: 160px;
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
  font-size: 12px;
  color: var(--seal);
  letter-spacing: 2px;
  margin-bottom: 6px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
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
}

.empty {
  text-align: center;
  padding: 60px 20px;
  color: var(--text-light);
}

.empty-icon {
  margin-bottom: 16px;
  color: var(--primary-light);
  opacity: 0.7;
  display: flex;
  justify-content: center;
}

.empty p {
  font-size: 18px;
  color: var(--primary-deep);
  font-family: var(--font-display);
  margin-bottom: 6px;
}

.empty span {
  font-size: 13px;
}

@media (max-width: 768px) {
  .explore-grid {
    grid-template-columns: 1fr;
  }
}
</style>
