<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useArchiveStore } from '@/store/archiveStore'
import { useUiStore } from '@/store/uiStore'

// 档案概览页：家庭信息 + 统计 + 四个功能入口
const router = useRouter()
const archiveStore = useArchiveStore()
const uiStore = useUiStore()

onMounted(async () => {
  try {
    await Promise.all([
      archiveStore.fetchArchive(),
      archiveStore.fetchMembers(),
      archiveStore.fetchPhotos(),
      archiveStore.fetchOralHistories(),
      archiveStore.fetchDocuments()
    ])
  } catch (e) {
    uiStore.showToast('数据加载失败', 'err')
  }
})

// 功能入口配置：Lucide 图标统一质感
const funcs = [
  { key: 'tree', icon: 'lucide:git-fork', title: '家族树', path: '/archive/tree', desc: () => `${archiveStore.members.length}位成员` },
  { key: 'photos', icon: 'lucide:image', title: '老照片墙', path: '/archive/photos', desc: () => `${archiveStore.photos.length}张照片` },
  { key: 'oral', icon: 'lucide:mic', title: '口述历史', path: '/archive/oral', desc: () => `${archiveStore.oralHistories.length}条录音` },
  { key: 'docs', icon: 'lucide:file-text', title: '文档柜', path: '/archive/documents', desc: () => `${archiveStore.documents.length}份文档` }
]

// 跳转纪念册
const makeBook = () => {
  uiStore.showToast('正在生成家族纪念册…')
  setTimeout(() => {
    uiStore.showToast('《' + archiveStore.archive?.familyName + '氏家族纪念册》已生成！')
    router.push('/book')
  }, 1500)
}
</script>

<template>
  <div class="page" v-if="archiveStore.archive">
    <!-- 档案概览 -->
    <div class="archive-header">
      <div class="info">
        <span class="tag">我的家庭档案</span>
        <h2>{{ archiveStore.archive.familyName }}</h2>
        <div class="village-line">
          <AppIcon icon="lucide:map-pin" :size="15" />
          {{ archiveStore.archive.village }}
        </div>
        <p class="intro">{{ archiveStore.archive.description }}</p>
      </div>
      <div class="archive-stats">
        <div class="astat">
          <div class="num">{{ archiveStore.archive.memberCount }}</div>
          <div class="lbl">成员</div>
        </div>
        <div class="astat">
          <div class="num">{{ archiveStore.archive.photoCount }}</div>
          <div class="lbl">照片</div>
        </div>
        <div class="astat">
          <div class="num">{{ archiveStore.archive.oralCount }}</div>
          <div class="lbl">口述</div>
        </div>
        <div class="astat">
          <div class="num">{{ archiveStore.archive.documentCount }}</div>
          <div class="lbl">文档</div>
        </div>
      </div>
    </div>

    <!-- 功能入口 -->
    <div class="func-tabs">
      <div
        v-for="f in funcs"
        :key="f.key"
        class="func-tab"
        @click="router.push(f.path)"
      >
        <div class="func-icon"><AppIcon :icon="f.icon" :size="30" /></div>
        <h5>{{ f.title }}</h5>
        <small>{{ f.desc() }}</small>
      </div>
    </div>

    <button class="btn btn-seal make-book" @click="makeBook">
      <AppIcon icon="lucide:book" :size="16" />
      生成家族纪念册
    </button>
  </div>
</template>

<style scoped>
.archive-header {
  background: linear-gradient(160deg, var(--bg-warm), var(--bg-deep));
  border-radius: var(--radius-lg);
  padding: 40px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 30px;
  align-items: center;
  box-shadow: var(--shadow-soft);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(139, 107, 80, 0.12);
}

.archive-header::before {
  content: '档';
  position: absolute;
  font-family: var(--font-display);
  font-size: 200px;
  color: rgba(139, 107, 80, 0.06);
  right: -20px;
  bottom: -50px;
  line-height: 1;
}

.info {
  position: relative;
}

.tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 20px;
  background: rgba(168, 50, 50, 0.1);
  color: var(--seal);
  font-size: 12px;
  letter-spacing: 2px;
  margin-bottom: 12px;
}

.archive-header h2 {
  font-family: var(--font-display);
  font-size: 36px;
  color: var(--primary-deep);
  font-weight: 400;
  margin-bottom: 8px;
}

.village-line {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--moss-deep);
  font-size: 15px;
  margin-bottom: 14px;
}

.intro {
  color: var(--text-light);
  font-size: 14px;
  max-width: 480px;
}

.archive-stats {
  display: flex;
  gap: 24px;
  position: relative;
}

.astat {
  text-align: center;
  min-width: 70px;
}

.astat .num {
  font-family: var(--font-display);
  font-size: 30px;
  color: var(--primary-deep);
  line-height: 1;
}

.astat .lbl {
  font-size: 12px;
  color: var(--text-light);
  letter-spacing: 2px;
  margin-top: 6px;
}

.func-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin: 34px 0;
}

.func-tab {
  background: var(--bg-warm);
  border: 1.5px solid transparent;
  border-radius: var(--radius);
  padding: 24px 18px;
  text-align: center;
  cursor: pointer;
  transition: all var(--transition);
  box-shadow: 0 2px 8px rgba(94, 70, 50, 0.06);
  position: relative;
  overflow: hidden;
}

.func-tab:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-soft);
  border-color: var(--primary);
}

.func-icon {
  font-size: 34px;
  margin-bottom: 10px;
}

.func-tab h5 {
  font-family: var(--font-display);
  font-size: 18px;
  color: var(--primary-deep);
  font-weight: 400;
  margin-bottom: 4px;
}

.func-tab small {
  font-size: 12px;
  color: var(--text-light);
}

.make-book {
  display: block;
  margin-left: auto;
}

@media (max-width: 768px) {
  .archive-header {
    grid-template-columns: 1fr;
  }
  .archive-stats {
    flex-wrap: wrap;
    justify-content: center;
  }
  .func-tabs {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
