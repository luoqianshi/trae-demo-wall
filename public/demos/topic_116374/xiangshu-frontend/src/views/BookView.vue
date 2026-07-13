<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useArchiveStore } from '@/store/archiveStore'
import { useUiStore } from '@/store/uiStore'

// 家族纪念册：把档案汇总成可分享的"电子书"
const router = useRouter()
const archiveStore = useArchiveStore()
const uiStore = useUiStore()

onMounted(async () => {
  if (!archiveStore.archive) {
    await archiveStore.fetchArchive()
  }
  if (!archiveStore.members.length) await archiveStore.fetchMembers()
  if (!archiveStore.photos.length) await archiveStore.fetchPhotos()
  if (!archiveStore.oralHistories.length) await archiveStore.fetchOralHistories()
  if (!archiveStore.documents.length) await archiveStore.fetchDocuments()
})

// 生成分享链接（模拟）
const shareCode = computed(() => 'XS' + (archiveStore.archive?.id || '0001'))

const share = () => {
  const url = `${window.location.origin}/share/${shareCode.value}`
  // 模拟复制到剪贴板
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      uiStore.showToast('分享链接已复制')
    }).catch(() => {
      uiStore.showToast('链接：' + url)
    })
  } else {
    uiStore.showToast('链接：' + url)
  }
}

const back = () => router.push('/archive')
const goShare = () => router.push(`/share/${shareCode.value}`)
</script>

<template>
  <div class="page" v-if="archiveStore.archive">
    <button class="back-btn" @click="back">
      <AppIcon icon="lucide:arrow-left" :size="16" />
      返回档案
    </button>

    <!-- 纪念册封面 -->
    <div class="book-cover">
      <div class="cover-seal">乡<br />书</div>
      <div class="cover-title">
        <small>家族纪念册</small>
        <h1>{{ archiveStore.archive.familyName }}</h1>
        <div class="village">{{ archiveStore.archive.village }}</div>
        <div class="date">装订于 {{ new Date().getFullYear() }} 年</div>
      </div>
      <div class="cover-deco"></div>
    </div>

    <!-- 纪念册内页 -->
    <div class="book-page">
      <h2 class="page-title">序 · 家族简介</h2>
      <p class="page-text">{{ archiveStore.archive.description }}</p>
      <div class="stats-row">
        <div><b>{{ archiveStore.archive.memberCount }}</b><span>成员</span></div>
        <div><b>{{ archiveStore.archive.photoCount }}</b><span>照片</span></div>
        <div><b>{{ archiveStore.archive.oralCount }}</b><span>口述</span></div>
        <div><b>{{ archiveStore.archive.documentCount }}</b><span>文档</span></div>
      </div>
    </div>

    <div class="book-page">
      <h2 class="page-title">第一章 · 家族成员</h2>
      <div class="member-list">
        <div class="member-row" v-for="m in archiveStore.members" :key="m.id">
          <span class="m-name">{{ m.name }}</span>
          <span class="m-year">{{ m.birthYear }}{{ m.deathYear ? ' - ' + m.deathYear : '' }}</span>
          <span class="m-desc">{{ m.description }}</span>
        </div>
      </div>
    </div>

    <div class="book-page">
      <h2 class="page-title">第二章 · 老照片</h2>
      <div class="photo-list">
        <div class="photo-item" v-for="p in archiveStore.photos" :key="p.id">
          <div class="photo-thumb"></div>
          <div>
            <h5>{{ p.fileName }}</h5>
            <small>{{ p.photoYear }}年 · {{ p.peopleNames }}</small>
            <p>{{ p.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="book-page">
      <h2 class="page-title">第三章 · 口述选录</h2>
      <div class="oral-list">
        <blockquote v-for="o in archiveStore.oralHistories" :key="o.id">
          <p>"{{ o.transcript }}"</p>
          <cite>— {{ o.tellerName }} · {{ o.title }}</cite>
        </blockquote>
      </div>
    </div>

    <!-- 操作 -->
    <div class="actions">
      <button class="btn btn-primary" @click="share">
        <AppIcon icon="lucide:share-2" :size="16" />
        分享纪念册
      </button>
      <button class="btn btn-ghost" @click="goShare">
        <AppIcon icon="lucide:external-link" :size="16" />
        查看分享页
      </button>
    </div>
  </div>
</template>

<style scoped>
.page {
  max-width: 820px;
}

.back-btn {
  border: none;
  background: transparent;
  color: var(--text-light);
  cursor: pointer;
  font-family: var(--font-serif);
  font-size: 14px;
  margin-bottom: 20px;
  padding: 0;
  transition: color var(--transition);
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.back-btn:hover {
  color: var(--seal);
}

/* 封面 */
.book-cover {
  background: linear-gradient(160deg, var(--primary-deep), var(--primary));
  border-radius: var(--radius-lg);
  padding: 60px 40px;
  color: var(--bg-warm);
  position: relative;
  overflow: hidden;
  margin-bottom: 30px;
  text-align: center;
  box-shadow: var(--shadow-lift);
}

.book-cover::before {
  content: '';
  position: absolute;
  inset: 12px;
  border: 1px solid rgba(243, 234, 217, 0.3);
  border-radius: calc(var(--radius-lg) - 8px);
  pointer-events: none;
}

.cover-seal {
  position: absolute;
  top: 30px;
  right: 30px;
  width: 50px;
  height: 50px;
  border-radius: 6px;
  background: var(--seal);
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 13px;
  line-height: 1.1;
  text-align: center;
  transform: rotate(8deg);
  box-shadow: inset 0 0 0 2px rgba(243, 234, 217, 0.5);
}

.cover-title small {
  font-family: var(--font-sub);
  letter-spacing: 6px;
  font-size: 13px;
  opacity: 0.8;
}

.cover-title h1 {
  font-family: var(--font-display);
  font-size: 56px;
  margin: 14px 0 8px;
  font-weight: 400;
  letter-spacing: 4px;
}

.village {
  font-size: 15px;
  opacity: 0.85;
  margin-bottom: 14px;
}

.date {
  font-size: 12px;
  opacity: 0.7;
  letter-spacing: 2px;
}

.cover-deco {
  width: 80px;
  height: 1px;
  background: var(--earth-soft);
  margin: 24px auto 0;
  opacity: 0.5;
}

/* 内页 */
.book-page {
  background: var(--bg-warm);
  border-radius: var(--radius-lg);
  padding: 40px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-soft);
  border: 1px solid rgba(139, 107, 80, 0.1);
  position: relative;
}

.book-page::before {
  content: '';
  position: absolute;
  left: 30px;
  right: 30px;
  top: 20px;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--primary-light), transparent);
  opacity: 0.5;
}

.page-title {
  font-family: var(--font-display);
  font-size: 26px;
  color: var(--primary-deep);
  font-weight: 400;
  margin-bottom: 18px;
  text-align: center;
  letter-spacing: 2px;
}

.page-text {
  font-size: 15px;
  color: var(--text);
  line-height: 1.9;
  text-indent: 2em;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-top: 28px;
  padding-top: 24px;
  border-top: 1px dashed rgba(139, 107, 80, 0.25);
}

.stats-row div {
  text-align: center;
}

.stats-row b {
  display: block;
  font-family: var(--font-display);
  font-size: 30px;
  color: var(--primary-deep);
}

.stats-row span {
  font-size: 12px;
  color: var(--text-light);
  letter-spacing: 2px;
}

/* 成员列表 */
.member-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.member-row {
  display: grid;
  grid-template-columns: 100px 130px 1fr;
  gap: 14px;
  padding: 10px 0;
  border-bottom: 1px dashed rgba(139, 107, 80, 0.15);
  font-size: 14px;
}

.m-name {
  font-family: var(--font-display);
  color: var(--primary-deep);
  font-size: 16px;
}

.m-year {
  color: var(--text-light);
  font-family: var(--font-sub);
}

.m-desc {
  color: var(--text);
}

/* 照片列表 */
.photo-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.photo-item {
  display: flex;
  gap: 16px;
}

.photo-thumb {
  width: 100px;
  height: 100px;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--earth-soft), var(--primary));
  border-radius: 6px;
  border: 3px solid var(--bg);
  box-shadow: var(--shadow-soft);
}

.photo-item h5 {
  font-family: var(--font-display);
  font-size: 17px;
  color: var(--primary-deep);
  font-weight: 400;
  margin-bottom: 2px;
}

.photo-item small {
  color: var(--seal);
  font-size: 12px;
}

.photo-item p {
  margin-top: 6px;
  font-size: 13px;
  color: var(--text-light);
}

/* 口述选录 */
.oral-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

blockquote {
  padding: 16px 20px;
  background: rgba(212, 165, 116, 0.1);
  border-left: 3px solid var(--seal);
  border-radius: 0 8px 8px 0;
}

blockquote p {
  font-size: 14px;
  color: var(--text);
  line-height: 1.8;
  margin-bottom: 8px;
}

blockquote cite {
  font-style: normal;
  font-size: 12px;
  color: var(--seal);
  letter-spacing: 1px;
}

.actions {
  display: flex;
  gap: 14px;
  justify-content: center;
  margin-top: 30px;
}

@media (max-width: 600px) {
  .member-row {
    grid-template-columns: 1fr;
    gap: 4px;
  }
  .photo-item {
    flex-direction: column;
  }
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
