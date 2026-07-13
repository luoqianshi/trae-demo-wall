<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { mockArchive, mockMembers, mockPhotos, mockOralHistories, photoIcons } from '@/mock/data'
import { useUiStore } from '@/store/uiStore'

// 分享页：根据 code 展示公开档案（Mock 直接返回陈家档案）
const route = useRoute()
const router = useRouter()
const uiStore = useUiStore()

const code = ref(route.params.code)
const archive = ref(null)
const members = ref([])
const photos = ref([])
const oralHistories = ref([])

// 照片占位 Lucide 图标
const photoIcon = (idx) => photoIcons[idx % photoIcons.length]

onMounted(async () => {
  // 真实接口：根据 code 拉取档案
  await new Promise((r) => setTimeout(r, 300))
  archive.value = mockArchive
  members.value = mockMembers
  photos.value = mockPhotos
  oralHistories.value = mockOralHistories
})

// 复制链接
const copyLink = () => {
  const url = window.location.href
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      uiStore.showToast('链接已复制，可分享给亲友')
    })
  } else {
    uiStore.showToast('链接：' + url)
  }
}

const goHome = () => router.push('/')
</script>

<template>
  <div class="page share-page" v-if="archive">
    <div class="share-banner">
      <div class="banner-seal">乡<br />书</div>
      <div class="banner-info">
        <small>家族档案 · 公开分享</small>
        <h1>{{ archive.familyName }}家族</h1>
        <div class="village">
          <AppIcon icon="lucide:map-pin" :size="14" />
          {{ archive.village }}
        </div>
      </div>
    </div>

    <div class="share-intro card">
      <div class="section-eyebrow">家族简介</div>
      <p>{{ archive.description }}</p>
      <div class="share-stats">
        <div><b>{{ members.length }}</b><span>成员</span></div>
        <div><b>{{ photos.length }}</b><span>照片</span></div>
        <div><b>{{ oralHistories.length }}</b><span>口述</span></div>
      </div>
    </div>

    <div class="card">
      <div class="section-eyebrow">家族成员</div>
      <h3 class="card-title">{{ archive.familyName }}家的人</h3>
      <div class="member-grid">
        <div v-for="m in members" :key="m.id" class="mini-member">
          <div class="avatar" :class="m.gender === 1 ? 'male' : 'female'">{{ m.name.charAt(0) }}</div>
          <div>
            <div class="m-name">{{ m.name }}</div>
            <div class="m-year">{{ m.birthYear }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="section-eyebrow">老照片</div>
      <h3 class="card-title">影像记忆</h3>
      <div class="photo-grid">
        <div v-for="(p, i) in photos" :key="p.id" class="mini-photo">
          <div class="thumb" :class="{ colored: p.isColored }">
            <AppIcon :icon="photoIcon(i)" :size="32" />
          </div>
          <div class="info">
            <b>{{ p.fileName }}</b>
            <small>{{ p.photoYear }}年</small>
          </div>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="section-eyebrow">口述节选</div>
      <h3 class="card-title">老人讲的故事</h3>
      <blockquote v-for="o in oralHistories" :key="o.id">
        <p>"{{ o.transcript }}"</p>
        <cite>— {{ o.tellerName }} · {{ o.title }}</cite>
      </blockquote>
    </div>

    <div class="actions">
      <button class="btn btn-primary" @click="copyLink">
        <AppIcon icon="lucide:link" :size="16" />
        复制分享链接
      </button>
      <button class="btn btn-ghost" @click="goHome">
        <AppIcon icon="lucide:compass" :size="16" />
        逛逛乡书
      </button>
    </div>

    <p class="share-code">分享码：{{ code }}</p>
  </div>
</template>

<style scoped>
.share-page {
  max-width: 820px;
}

.share-banner {
  background: linear-gradient(160deg, var(--moss-deep), var(--moss));
  border-radius: var(--radius-lg);
  padding: 40px;
  color: var(--bg-warm);
  display: flex;
  gap: 24px;
  align-items: center;
  margin-bottom: 30px;
  box-shadow: var(--shadow-lift);
  position: relative;
  overflow: hidden;
}

.share-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.1;
  background-image: repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(250, 246, 239, 0.3) 20px, rgba(250, 246, 239, 0.3) 21px);
}

.banner-seal {
  width: 64px;
  height: 64px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--seal), var(--seal-deep));
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 16px;
  line-height: 1.1;
  text-align: center;
  transform: rotate(-4deg);
  box-shadow: inset 0 0 0 2px rgba(243, 234, 217, 0.5);
  flex-shrink: 0;
  position: relative;
}

.banner-info {
  position: relative;
}

.banner-info small {
  font-family: var(--font-sub);
  letter-spacing: 4px;
  font-size: 12px;
  opacity: 0.8;
}

.banner-info h1 {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 400;
  margin: 6px 0 4px;
}

.village {
  font-size: 14px;
  opacity: 0.85;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.card {
  background: var(--bg-warm);
  border-radius: var(--radius-lg);
  padding: 30px;
  margin-bottom: 24px;
  box-shadow: var(--shadow-soft);
  border: 1px solid rgba(139, 107, 80, 0.1);
}

.card p {
  font-size: 15px;
  color: var(--text);
  line-height: 1.9;
  text-indent: 2em;
}

.card-title {
  font-family: var(--font-display);
  font-size: 22px;
  color: var(--primary-deep);
  font-weight: 400;
  margin-bottom: 20px;
}

.share-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px dashed rgba(139, 107, 80, 0.25);
}

.share-stats div {
  text-align: center;
}

.share-stats b {
  display: block;
  font-family: var(--font-display);
  font-size: 28px;
  color: var(--primary-deep);
}

.share-stats span {
  font-size: 12px;
  color: var(--text-light);
  letter-spacing: 2px;
}

.member-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.mini-member {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg);
  border-radius: 10px;
}

.avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--bg-warm);
  font-family: var(--font-display);
  font-size: 18px;
  flex-shrink: 0;
}

.avatar.male {
  background: linear-gradient(135deg, var(--moss), var(--moss-deep));
}

.avatar.female {
  background: linear-gradient(135deg, var(--seal), var(--seal-deep));
}

.m-name {
  font-family: var(--font-display);
  font-size: 16px;
  color: var(--primary-deep);
}

.m-year {
  font-size: 12px;
  color: var(--text-light);
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
}

.mini-photo {
  background: var(--bg);
  border-radius: 8px;
  overflow: hidden;
}

.thumb {
  height: 100px;
  background: linear-gradient(135deg, var(--earth-soft), var(--primary));
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(250, 246, 239, 0.85);
}

.thumb.colored {
  background: linear-gradient(135deg, #9bb5a3, var(--primary-light));
}

.mini-photo .info {
  padding: 10px;
}

.mini-photo b {
  display: block;
  font-size: 13px;
  color: var(--primary-deep);
  font-family: var(--font-display);
}

.mini-photo small {
  color: var(--seal);
  font-size: 11px;
}

blockquote {
  padding: 16px 20px;
  background: rgba(212, 165, 116, 0.1);
  border-left: 3px solid var(--seal);
  border-radius: 0 8px 8px 0;
  margin-bottom: 12px;
}

blockquote p {
  font-size: 14px;
  color: var(--text);
  line-height: 1.8;
  margin-bottom: 8px;
  text-indent: 0;
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
  margin-top: 20px;
}

.share-code {
  text-align: center;
  margin-top: 20px;
  font-size: 12px;
  color: var(--text-soft);
  letter-spacing: 2px;
}

@media (max-width: 600px) {
  .member-grid {
    grid-template-columns: 1fr;
  }
  .photo-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .share-banner {
    flex-direction: column;
    text-align: center;
  }
}
</style>
