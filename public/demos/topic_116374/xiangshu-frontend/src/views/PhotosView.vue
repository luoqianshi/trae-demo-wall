<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useArchiveStore } from '@/store/archiveStore'
import { useUiStore } from '@/store/uiStore'
import PhotoCard from '@/components/PhotoCard.vue'
import UploadModal from '@/components/UploadModal.vue'

// 老照片墙：网格 + 上传 + AI 修复/上色
const router = useRouter()
const archiveStore = useArchiveStore()
const uiStore = useUiStore()

const showUpload = ref(false)

onMounted(async () => {
  if (!archiveStore.photos.length) {
    await archiveStore.fetchPhotos()
  }
})

// AI 修复完成
const onRestored = (id) => {
  archiveStore.updatePhoto(id, { isRestored: true })
  const p = archiveStore.photos.find((x) => x.id === id)
  uiStore.showToast('照片"' + p.fileName + '"修复完成')
}

// AI 上色完成
const onColored = (id) => {
  archiveStore.updatePhoto(id, { isColored: true })
  const p = archiveStore.photos.find((x) => x.id === id)
  uiStore.showToast('照片"' + p.fileName + '"上色完成')
}

// 查看照片（占位）
const onView = (p) => {
  uiStore.showToast('查看：' + p.fileName)
}

// 提交上传
const onUpload = async (payload) => {
  try {
    await archiveStore.uploadPhoto({
      fileName: payload.fileName,
      photoYear: payload.photoYear,
      peopleNames: payload.peopleNames,
      description: payload.description
    })
    showUpload.value = false
    uiStore.showToast('照片上传成功')
  } catch (e) {
    uiStore.showToast('上传失败', 'err')
  }
}

const back = () => router.push('/archive')
</script>

<template>
  <div class="page">
    <div class="page-head">
      <button class="back-btn" @click="back">
        <AppIcon icon="lucide:arrow-left" :size="16" />
        返回档案
      </button>
      <div class="toolbar">
        <div>
          <div class="section-eyebrow" style="margin-bottom: 4px">老照片墙</div>
          <h3 class="sub-title">
            {{ archiveStore.photos.length }} 张老照片 ·
            已修复 {{ archiveStore.photos.filter((p) => p.isRestored).length }} 张
          </h3>
        </div>
        <button class="btn btn-primary" @click="showUpload = true">
          <AppIcon icon="lucide:upload" :size="16" />
          上传照片
        </button>
      </div>
    </div>

    <div class="photo-grid">
      <PhotoCard
        v-for="(p, i) in archiveStore.photos"
        :key="p.id"
        :photo="p"
        :index="i"
        @restore="onRestored"
        @color="onColored"
        @view="onView"
      />
    </div>

    <UploadModal
      :visible="showUpload"
      title="上传老照片"
      @close="showUpload = false"
      @submit="onUpload"
    />
  </div>
</template>

<style scoped>
.page-head {
  margin-bottom: 22px;
}

.back-btn {
  border: none;
  background: transparent;
  color: var(--text-light);
  cursor: pointer;
  font-family: var(--font-serif);
  font-size: 14px;
  margin-bottom: 14px;
  padding: 0;
  transition: color var(--transition);
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.back-btn:hover {
  color: var(--seal);
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
}

.sub-title {
  font-family: var(--font-display);
  font-size: 22px;
  color: var(--primary-deep);
  font-weight: 400;
}

.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

@media (max-width: 900px) {
  .photo-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .photo-grid {
    grid-template-columns: 1fr;
  }
}
</style>
