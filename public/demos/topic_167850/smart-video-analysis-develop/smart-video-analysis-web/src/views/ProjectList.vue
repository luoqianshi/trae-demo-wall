<template>
  <div class="project-list-page">
    <div class="page-header">
      <div class="header-title">
        <h2>项目管理</h2>
        <p>管理您的视频分析和创作项目</p>
      </div>
      <el-button type="primary" @click="showCreateModal = true">
        <el-icon><Plus /></el-icon>
        <span>创建新项目</span>
      </el-button>
    </div>

    <div class="project-stats">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon :size="24" color="#3b82f6"><Folder /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ projectList.length }}</div>
          <div class="stat-label">总项目数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon :size="24" color="#10b981"><VideoCamera /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ totalVideos }}</div>
          <div class="stat-label">视频总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon :size="24" color="#f59e0b"><Lightbulb /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ completedAnalysis }}</div>
          <div class="stat-label">已解析</div>
        </div>
      </div>
    </div>

    <el-card shadow="never" class="project-list-card">
      <div class="card-toolbar">
        <div class="search-box">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索项目名称..."
            clearable
            prefix-icon="Search"
            style="width: 280px"
          />
        </div>
        <el-select v-model="filterStatus" placeholder="筛选状态" clearable style="width: 120px">
          <el-option label="进行中" :value="1" />
          <el-option label="已完成" :value="2" />
        </el-select>
      </div>

      <div v-if="filteredProjects.length === 0" class="empty-state">
        <el-empty description="暂无项目" :image-size="100">
          <el-button type="primary" @click="showCreateModal = true">创建第一个项目</el-button>
        </el-empty>
      </div>

      <div v-else class="project-grid">
        <div
          v-for="project in filteredProjects"
          :key="project.id"
          class="project-card"
          @click="goToProject(project)"
        >
          <div class="project-header">
            <div class="project-icon">
              <el-icon :size="32" color="#60a5fa"><Folder /></el-icon>
            </div>
            <div class="project-status">
              <el-tag :type="getStatusType(project.status)" size="small">
                {{ getStatusText(project.status) }}
              </el-tag>
            </div>
          </div>
          <div class="project-info">
            <h3 class="project-name">{{ project.name }}</h3>
            <p class="project-desc" v-if="project.description">{{ project.description }}</p>
            <p class="project-desc empty-desc" v-else>暂无描述</p>
          </div>
          <div class="project-meta">
            <div class="meta-item">
              <el-icon :size="14"><VideoCamera /></el-icon>
              <span>{{ getVideoCount(project.id) }} 个视频</span>
            </div>
            <div class="meta-item">
              <el-icon :size="14"><Calendar /></el-icon>
              <span>{{ formatDate(project.updateTime) }}</span>
            </div>
          </div>
          <div class="project-actions">
            <el-button text size="small" @click.stop="editProject(project)">编辑</el-button>
            <el-button text size="small" type="danger" @click.stop="deleteProject(project)">删除</el-button>
          </div>
        </div>
      </div>
    </el-card>

    <el-dialog v-model="showCreateModal" :title="editingProject ? '编辑项目' : '创建新项目'" width="450px">
      <el-form :model="projectForm" label-position="top">
        <el-form-item label="项目名称" required>
          <el-input v-model="projectForm.name" placeholder="请输入项目名称" />
        </el-form-item>
        <el-form-item label="项目描述">
          <el-input v-model="projectForm.description" type="textarea" :rows="3" placeholder="请输入项目描述（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cancelEdit">取消</el-button>
        <el-button type="primary" @click="saveProject" :loading="saving">确认{{ editingProject ? '修改' : '创建' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Folder, VideoCamera, Calendar, Lightbulb } from '@element-plus/icons-vue'
import { createProject, updateProject, getProjectList, deleteProject as deleteProjectApi } from '@/api/project'
import { useVideoStore } from '@/stores/video'

const router = useRouter()
const videoStore = useVideoStore()

const projectList = ref<any[]>([])
const searchKeyword = ref('')
const filterStatus = ref<number | undefined>(undefined)
const showCreateModal = ref(false)
const editingProject = ref<any>(null)
const saving = ref(false)

const projectForm = ref({
  name: '',
  description: ''
})

const filteredProjects = computed(() => {
  let list = projectList.value
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(keyword) ||
      (p.description && p.description.toLowerCase().includes(keyword)))
  }
  if (filterStatus.value !== undefined) {
    list = list.filter(p => p.status === filterStatus.value)
  }
  return list
})

const totalVideos = computed(() => videoStore.videoList.length)

const completedAnalysis = computed(() => {
  return videoStore.videoList.filter((v: any) => v.status === 2).length
})

const getVideoCount = (projectId: string) => {
  return videoStore.videoList.filter((v: any) => String(v.projectId) === String(projectId)).length
}

const getStatusType = (status: number): 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
  const map: Record<number, 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
    1: 'primary',
    2: 'success'
  }
  return map[status] || 'info'
}

const getStatusText = (status: number) => {
  const map: Record<number, string> = {
    1: '进行中',
    2: '已完成'
  }
  return map[status] || '未知'
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN') + ' ' + date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

const loadProjects = async () => {
  try {
    const data: any = await getProjectList()
    projectList.value = data || []
  } catch {
    projectList.value = []
  }
}

const goToProject = (project: any) => {
  router.push({ path: '/video-upload', query: { projectId: project.id } })
}

const editProject = (project: any) => {
  editingProject.value = project
  projectForm.value = {
    name: project.name,
    description: project.description || ''
  }
  showCreateModal.value = true
}

const cancelEdit = () => {
  showCreateModal.value = false
  editingProject.value = null
  projectForm.value = { name: '', description: '' }
}

const saveProject = async () => {
  if (!projectForm.value.name.trim()) {
    ElMessage.warning('请输入项目名称')
    return
  }

  saving.value = true
  try {
    if (editingProject.value) {
      await updateProject(editingProject.value.id, projectForm.value)
      ElMessage.success('项目修改成功')
    } else {
      await createProject(projectForm.value)
      ElMessage.success('项目创建成功')
    }
    cancelEdit()
    await loadProjects()
  } catch (e: any) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    saving.value = false
  }
}

const deleteProject = async (project: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除项目「${project.name}」吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteProjectApi(project.id)
    ElMessage.success('删除成功')
    await loadProjects()
  } catch {
    // cancelled
  }
}

onMounted(async () => {
  await loadProjects()
  await videoStore.fetchVideoList()
})
</script>

<style scoped>
.project-list-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
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

.project-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 56px;
  height: 56px;
  background: #f0f9ff;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
}

.project-list-card {
  padding: 0;
}

.card-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
}

.empty-state {
  padding: 60px 0;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
  padding: 20px;
}

.project-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.project-card:hover {
  border-color: #60a5fa;
  box-shadow: 0 4px 12px rgba(96, 165, 250, 0.15);
}

.project-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.project-icon {
  width: 48px;
  height: 48px;
  background: #eff6ff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.project-info h3 {
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.project-desc {
  margin: 0;
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.empty-desc {
  color: #94a3b8;
}

.project-meta {
  display: flex;
  gap: 16px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #94a3b8;
}

.project-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.project-actions .el-button {
  padding: 4px 8px;
}
</style>