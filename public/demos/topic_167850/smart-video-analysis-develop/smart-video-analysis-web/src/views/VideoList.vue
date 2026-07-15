<template>
  <div class="video-list-page">
    <div class="page-header">
      <div class="header-title">
        <h2>视频管理</h2>
        <p>管理您上传和解析的视频文件</p>
      </div>
      <div class="header-actions">
        <el-button @click="goToUpload">
          <el-icon><Upload /></el-icon>
          <span>上传视频</span>
        </el-button>
      </div>
    </div>

    <div class="filter-bar">
      <div class="search-box">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索视频名称..."
          clearable
          prefix-icon="Search"
          style="width: 280px"
        />
      </div>
      <el-select v-model="filterStatus" placeholder="筛选状态" clearable style="width: 120px">
        <el-option label="待解析" :value="1" />
        <el-option label="已解析" :value="2" />
        <el-option label="解析失败" :value="3" />
      </el-select>
      <el-select v-model="filterProjectId" placeholder="筛选项目" clearable style="width: 150px">
        <el-option
          v-for="p in projectList"
          :key="p.id"
          :label="p.name"
          :value="p.id"
        />
      </el-select>
    </div>

    <el-card shadow="never" class="video-list-card">
      <div v-if="filteredVideos.length === 0" class="empty-state">
        <el-empty description="暂无视频" :image-size="100">
          <el-button type="primary" @click="goToUpload">上传第一个视频</el-button>
        </el-empty>
      </div>

      <div v-else class="video-grid">
        <div
          v-for="video in filteredVideos"
          :key="video.id"
          class="video-card"
          @click="goToDetail(video.id)"
        >
          <div class="video-thumbnail">
            <div class="thumb-placeholder">
              <el-icon :size="48" color="#94a3b8"><VideoCamera /></el-icon>
            </div>
            <div class="video-duration">{{ formatDuration(video.duration) }}</div>
            <div class="video-status">
              <el-tag :type="getStatusType(video.status)" size="small">
                {{ getStatusText(video.status) }}
              </el-tag>
            </div>
          </div>
          <div class="video-info">
            <h3 class="video-name">{{ video.filename }}</h3>
            <div class="video-meta">
              <span class="meta-item">
                <el-icon :size="12"><Calendar /></el-icon>
                {{ formatDate(video.createTime) }}
              </span>
              <span class="meta-item">
                <el-icon :size="12"><HardDrive /></el-icon>
                {{ formatSize(video.size) }}
              </span>
            </div>
            <div v-if="video.projectId && getProjectName(video.projectId)" class="video-project">
              <el-tag size="small" type="info">
                {{ getProjectName(video.projectId) }}
              </el-tag>
            </div>
          </div>
          <div class="video-actions">
            <el-button text size="small" @click.stop="goToDetail(video.id)">查看详情</el-button>
            <el-button text size="small" type="danger" @click.stop="deleteVideo(video)">删除</el-button>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, VideoCamera, Calendar, HardDrive } from '@element-plus/icons-vue'
import { useVideoStore } from '@/stores/video'
import { deleteVideo as deleteVideoApi } from '@/api/video'
import { getProjectList } from '@/api/project'

const router = useRouter()
const videoStore = useVideoStore()

const searchKeyword = ref('')
const filterStatus = ref<number | undefined>(undefined)
const filterProjectId = ref<string | undefined>(undefined)
const projectList = ref<any[]>([])

const filteredVideos = computed(() => {
  let list = videoStore.videoList || []
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter((v: any) => v.filename.toLowerCase().includes(keyword))
  }
  if (filterStatus.value !== undefined) {
    list = list.filter((v: any) => v.status === filterStatus.value)
  }
  if (filterProjectId.value) {
    list = list.filter((v: any) => String(v.projectId) === String(filterProjectId.value))
  }
  return list
})

const getStatusType = (status: number): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<number, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    1: 'primary',
    2: 'success',
    3: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    1: '待解析',
    2: '已解析',
    3: '解析失败'
  }
  return map[status] || '未知'
}

const getProjectName = (projectId: string) => {
  const p = projectList.value.find(item => String(item.id) === String(projectId))
  return p?.name || ''
}

const formatDuration = (seconds?: number) => {
  if (!seconds || seconds <= 0) return '--'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }
  return `${m}:${s.toString().padStart(2, '0')}`
}

const formatSize = (bytes?: number) => {
  if (!bytes || bytes <= 0) return '--'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB'
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '--'
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

const goToUpload = () => router.push('/video-upload')

const goToDetail = (videoId: string) => {
  router.push(`/analysis-result/${videoId}`)
}

const deleteVideo = async (video: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除视频「${video.filename}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteVideoApi(video.id)
    ElMessage.success('删除成功')
    await videoStore.fetchVideoList()
  } catch {
    // cancelled
  }
}

const loadProjects = async () => {
  try {
    const data: any = await getProjectList()
    projectList.value = data || []
  } catch {
    projectList.value = []
  }
}

onMounted(async () => {
  await videoStore.fetchVideoList()
  await loadProjects()
})
</script>

<style scoped>
.video-list-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.header-title h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #1e293b;
}

.header-title p {
  margin: 4px 0 0;
  font-size: 14px;
  color: #64748b;
}

.filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.video-list-card {
  padding: 0;
}

.empty-state {
  padding: 60px 0;
}

.video-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding: 20px;
}

.video-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
}

.video-card:hover {
  border-color: #60a5fa;
  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.15);
}

.video-thumbnail {
  position: relative;
  width: 100%;
  height: 160px;
  background: #f1f5f9;
}

.thumb-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.video-status {
  position: absolute;
  top: 8px;
  left: 8px;
}

.video-info {
  padding: 14px;
}

.video-name {
  margin: 0 0 8px;
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.video-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #94a3b8;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.video-project {
  margin-top: 8px;
}

.video-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 0 14px 14px;
}

.video-actions .el-button {
  padding: 4px 8px;
}
</style>