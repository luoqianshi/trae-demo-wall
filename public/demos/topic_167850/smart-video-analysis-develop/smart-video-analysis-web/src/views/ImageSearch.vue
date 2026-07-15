<template>
  <div class="image-search-page">
    <div class="page-header">
      <h1 class="page-title">以图搜视频检索</h1>
      <p class="page-subtitle">上传场景照片或人脸图片，AI 将在海量视频中检索匹配片段</p>
    </div>

    <div class="content-container">
      <div class="left-column">
        <div class="upload-card">
          <el-tabs v-model="activeTab" class="upload-tabs">
            <el-tab-pane label="场景照片" name="scene">
              <div
                class="drop-zone"
                :class="{ 'drag-over': isDragOver }"
                @dragover.prevent="isDragOver = true"
                @dragleave.prevent="isDragOver = false"
                @drop.prevent="handleDrop"
                @click="triggerFileInput"
              >
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  style="display: none"
                  @change="handleFileSelect"
                />
                <div v-if="!previewImage" class="upload-placeholder">
                  <div class="upload-icon">
                    <el-icon :size="48"><Search /></el-icon>
                  </div>
                  <p class="upload-text">拖拽图片到此处，或点击上传</p>
                  <p class="upload-hint">支持 JPG、PNG、WEBP 格式</p>
                  <el-button type="primary" plain>
                    选择图片
                  </el-button>
                </div>
                <div v-else class="preview-wrapper">
                  <img :src="previewImage" alt="预览" class="preview-image" />
                  <div class="preview-overlay">
                    <el-button type="primary" plain size="small" @click.stop="clearImage">
                      重新选择
                    </el-button>
                  </div>
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="人脸图片" name="face">
              <div
                class="drop-zone"
                :class="{ 'drag-over': isDragOver }"
                @dragover.prevent="isDragOver = true"
                @dragleave.prevent="isDragOver = false"
                @drop.prevent="handleDrop"
                @click="triggerFileInput"
              >
                <div v-if="!previewImage" class="upload-placeholder">
                  <div class="upload-icon">
                    <el-icon :size="48"><User /></el-icon>
                  </div>
                  <p class="upload-text">拖拽人脸图片到此处，或点击上传</p>
                  <p class="upload-hint">支持 JPG、PNG、WEBP 格式</p>
                  <el-button type="primary" plain>
                    选择图片
                  </el-button>
                </div>
                <div v-else class="preview-wrapper">
                  <img :src="previewImage" alt="预览" class="preview-image" />
                  <div class="preview-overlay">
                    <el-button type="primary" plain size="small" @click.stop="clearImage">
                      重新选择
                    </el-button>
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>

        <div class="search-mode-card">
          <h3 class="mode-title">检索模式</h3>
          <el-radio-group v-model="searchMode" class="mode-group">
            <el-radio value="exact" border>
              <div class="mode-option">
                <span class="mode-name">精确匹配</span>
                <span class="mode-desc">寻找高度相似的画面</span>
              </div>
            </el-radio>
            <el-radio value="similar" border>
              <div class="mode-option">
                <span class="mode-name">相似度搜索</span>
                <span class="mode-desc">返回更多相关结果</span>
              </div>
            </el-radio>
          </el-radio-group>
        </div>

        <el-button
          type="primary"
          size="large"
          class="search-btn"
          :loading="isSearching"
          :disabled="!selectedFile"
          @click="handleSearch"
        >
          {{ isSearching ? '检索中...' : '开始检索' }}
        </el-button>
      </div>

      <div class="right-column">
        <div class="results-header">
          <div class="results-title-section">
            <h2 class="results-title">检索结果</h2>
            <span v-if="searchResults.length > 0" class="results-count">
              共找到 {{ searchResults.length }} 个匹配结果
            </span>
          </div>
          <el-select v-model="sortBy" size="small" class="sort-select">
            <el-option label="按相似度排序" value="similarity" />
            <el-option label="按时间排序" value="time" />
          </el-select>
        </div>

        <div class="results-list">
          <div
            v-for="(result, index) in sortedResults"
            :key="index"
            class="result-card"
            @click="goToResult(result)"
          >
            <div class="result-thumbnail">
              <div class="thumbnail-placeholder">
                <el-icon :size="24"><VideoCamera /></el-icon>
              </div>
            </div>
            <div class="result-info">
              <div class="result-header">
                <el-tag
                  :type="getSimilarityType(result.similarity)"
                  :effect="'dark'"
                  size="small"
                  class="similarity-tag"
                >
                  {{ (result.similarity * 100).toFixed(0) }}%
                </el-tag>
                <span class="result-filename">{{ result.videoFilename }}</span>
              </div>
              <div class="result-meta">
                <span class="meta-item">
                  <el-icon><Timer /></el-icon>
                  匹配时间点 {{ result.matchStartTime }} - {{ result.matchEndTime }}
                </span>
                <span class="meta-item" v-if="result.videoDuration">
                  {{ formatDuration(result.videoDuration) }}
                </span>
              </div>
              <p class="result-desc">{{ result.sceneDescription }}</p>
              <div class="result-footer">
                <el-button type="primary" plain size="small">
                  预览片段
                </el-button>
              </div>
            </div>
          </div>

          <el-empty
            v-if="!isSearching && searchResults.length === 0 && hasSearched"
            description="未找到匹配的视频"
            :image-size="100"
          />

          <div v-if="!hasSearched" class="empty-state">
            <el-empty description="上传图片后开始检索" :image-size="100" />
          </div>

          <div v-if="isSearching" class="loading-state">
            <el-icon class="loading-icon" :size="32"><Loading /></el-icon>
            <p class="loading-text">正在检索中，请稍候...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Search,
  User,
  VideoCamera,
  Timer,
  Loading
} from '@element-plus/icons-vue'
import { searchByImage, type ImageSearchResult } from '@/api/search'

const router = useRouter()

const fileInput = ref<HTMLInputElement | null>(null)
const activeTab = ref('scene')
const isDragOver = ref(false)
const selectedFile = ref<File | null>(null)
const previewImage = ref('')
const searchMode = ref('exact')
const sortBy = ref('similarity')
const isSearching = ref(false)
const hasSearched = ref(false)
const searchResults = ref<ImageSearchResult[]>([])

const sortedResults = computed(() => {
  const results = [...searchResults.value]
  if (sortBy.value === 'similarity') {
    results.sort((a, b) => b.similarity - a.similarity)
  }
  return results
})

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    handleFile(files[0])
  }
}

const handleDrop = (e: DragEvent) => {
  isDragOver.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    const file = files[0]
    if (file.type.startsWith('image/')) {
      handleFile(file)
    } else {
      ElMessage.warning('请上传图片文件')
    }
  }
}

const handleFile = (file: File) => {
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请上传图片文件')
    return
  }

  if (file.size > 10 * 1024 * 1024) {
    ElMessage.warning('图片大小不能超过 10MB')
    return
  }

  selectedFile.value = file

  const reader = new FileReader()
  reader.onload = (e) => {
    previewImage.value = e.target?.result as string
  }
  reader.readAsDataURL(file)
}

const clearImage = () => {
  selectedFile.value = null
  previewImage.value = ''
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const handleSearch = async () => {
  if (!selectedFile.value) {
    ElMessage.warning('请先上传图片')
    return
  }

  isSearching.value = true
  hasSearched.value = false
  searchResults.value = []

  try {
    const data = await searchByImage(selectedFile.value, searchMode.value)
    searchResults.value = (data as unknown as ImageSearchResult[]) || []
    hasSearched.value = true
    if (searchResults.value.length === 0) {
      ElMessage.info('未找到匹配的视频')
    } else {
      ElMessage.success(`找到 ${searchResults.value.length} 个匹配结果`)
    }
  } catch (error: any) {
    ElMessage.error(error?.message || '检索失败，请重试')
  } finally {
    isSearching.value = false
  }
}

const getSimilarityType = (similarity: number) => {
  if (similarity >= 0.9) return 'success'
  if (similarity >= 0.8) return 'primary'
  if (similarity >= 0.7) return 'info'
  return 'info'
}

const formatDuration = (seconds: number) => {
  if (!seconds) return '--:--'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

const goToResult = (result: ImageSearchResult) => {
  router.push({
    name: 'AnalysisResult',
    params: { id: result.videoId },
    query: { t: result.matchStartTimeMs }
  })
}
</script>

<style scoped>
.image-search-page {
  width: 100%;
  padding: 24px;
  box-sizing: border-box;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: #0f172a;
  margin: 0;
}

.page-subtitle {
  font-size: 14px;
  color: #475569;
  margin: 8px 0 0 0;
}

.content-container {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.left-column {
  width: 40%;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-column {
  flex: 1;
  min-width: 0;
}

.upload-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
}

.upload-tabs :deep(.el-tabs__header) {
  margin: 0;
  border-bottom: 1px solid #e2e8f0;
}

.upload-tabs :deep(.el-tabs__nav) {
  width: 100%;
}

.upload-tabs :deep(.el-tabs__item) {
  flex: 1;
  text-align: center;
  height: 44px;
  line-height: 44px;
  font-size: 14px;
  font-weight: 500;
}

.drop-zone {
  min-height: 240px;
  border: 2px dashed #e2e8f0;
  border-top: none;
  border-radius: 0 0 12px 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.drop-zone:hover,
.drop-zone.drag-over {
  border-color: #2563eb;
  background: #eff6ff;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 32px;
}

.upload-icon {
  color: #2563eb;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 14px;
  font-weight: 500;
  color: #0f172a;
  margin: 0;
}

.upload-hint {
  font-size: 12px;
  color: #94a3b8;
  margin: 0 0 8px 0;
}

.preview-wrapper {
  position: relative;
  width: 100%;
  height: 240px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.preview-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.preview-wrapper:hover .preview-overlay {
  opacity: 1;
}

.search-mode-card {
  background: #f1f5f9;
  border-radius: 12px;
  padding: 16px;
}

.mode-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  margin: 0 0 12px 0;
}

.mode-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mode-group :deep(.el-radio) {
  margin: 0;
}

.mode-group :deep(.el-radio__label) {
  padding: 0;
  width: 100%;
}

.mode-option {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 4px 0;
}

.mode-name {
  font-size: 14px;
  font-weight: 500;
  color: #0f172a;
}

.mode-desc {
  font-size: 12px;
  color: #94a3b8;
}

.search-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 500;
}

.results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.results-title-section {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.results-title {
  font-size: 16px;
  font-weight: 600;
  color: #0f172a;
  margin: 0;
}

.results-count {
  font-size: 12px;
  color: #94a3b8;
  flex-shrink: 0;
}

.sort-select {
  width: 140px;
}

.results-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.result-card {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.result-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.03), 0 2px 4px rgba(0, 0, 0, 0.02);
  border-color: #cbd5e1;
}

.result-thumbnail {
  flex-shrink: 0;
  width: 160px;
  height: 90px;
  border-radius: 8px;
  overflow: hidden;
  background: #1e293b;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #475569;
}

.result-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.similarity-tag {
  flex-shrink: 0;
}

.result-filename {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #94a3b8;
}

.meta-item :deep(.el-icon) {
  font-size: 12px;
}

.result-desc {
  font-size: 13px;
  color: #475569;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.result-footer {
  margin-top: auto;
  padding-top: 4px;
}

.empty-state,
.loading-state {
  padding: 48px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.loading-icon {
  color: #2563eb;
  animation: spin 1s linear infinite;
}

.loading-text {
  font-size: 14px;
  color: #64748b;
  margin: 0;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 1024px) {
  .content-container {
    flex-direction: column;
  }

  .left-column {
    width: 100%;
  }

  .right-column {
    width: 100%;
  }
}
</style>
