<template>
  <div class="ai-knowledge-container">
    <el-card class="page-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>知识库管理</span>
        </div>
      </template>

      <el-tabs v-model="activeTab" type="border-card" class="knowledge-tabs">
        <el-tab-pane label="知识条目管理" name="list">
          <div class="knowledge-list-layout">
            <div class="left-panel">
              <div class="panel-header">
                <span class="panel-title">知识分类</span>
              </div>
              <el-input
                v-model="treeSearchKeyword"
                placeholder="搜索分类"
                :prefix-icon="Search"
                class="tree-search"
                clearable
              />
              <el-tree
                ref="treeRef"
                :data="categoryTree"
                :props="treeProps"
                node-key="id"
                default-expand-all
                highlight-current
                @node-click="handleNodeClick"
                class="category-tree"
              >
                <template #default="{ node, data }">
                  <span class="custom-tree-node">
                    <el-icon class="node-icon"><component :is="data.icon || Folder" /></el-icon>
                    <span class="node-label">{{ node.label }}</span>
                    <span class="node-count" v-if="data.count !== undefined">({{ data.count }})</span>
                  </span>
                </template>
              </el-tree>
            </div>

            <div class="right-panel">
              <div class="toolbar">
                <div class="toolbar-left">
                  <el-input
                    v-model="searchKeyword"
                    placeholder="搜索标题/内容"
                    :prefix-icon="Search"
                    style="width: 280px;"
                    clearable
                    @keyup.enter="handleSearch"
                  />
                  <el-select v-model="statusFilter" placeholder="状态" style="width: 120px; margin-left: 10px;" clearable>
                    <el-option label="全部" value="" />
                    <el-option label="已启用" value="enabled" />
                    <el-option label="已禁用" value="disabled" />
                    <el-option label="已删除" value="deleted" />
                  </el-select>
                  <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
                </div>
                <div class="toolbar-right">
                  <el-upload
                    :show-file-list="false"
                    :before-upload="handleBeforeUpload"
                    accept=".doc,.docx,.pdf"
                    style="margin-right: 10px;"
                  >
                    <el-button type="success" :icon="Upload">批量导入</el-button>
                  </el-upload>
                  <el-button type="primary" :icon="Plus" v-permission="'ai:knowledge:add'" @click="handleAdd">
                    新增知识
                  </el-button>
                </div>
              </div>

              <PageTable
                :columns="columns"
                :data="tableData"
                :total="total"
                :loading="loading"
                @pageChange="handlePageChange"
              >
                <template #category="{ row }">
                  <el-tag :type="getCategoryTagType(row.category)">{{ row.category }}</el-tag>
                </template>
                <template #tags="{ row }">
                  <el-tag v-for="tag in row.tags" :key="tag" type="info" size="small" style="margin-right: 5px;">
                    {{ tag }}
                  </el-tag>
                </template>
                <template #status="{ row }">
                  <el-tag :type="getStatusTagType(row.status)">{{ getStatusText(row.status) }}</el-tag>
                </template>
                <template #action="{ row }">
                  <el-button type="primary" link @click="handleView(row)">查看</el-button>
                  <el-button type="primary" link v-permission="'ai:knowledge:edit'" @click="handleEdit(row)">编辑</el-button>
                  <el-button type="danger" link v-if="row.status !== 'deleted'" v-permission="'ai:knowledge:delete'" @click="handleDelete(row)">删除</el-button>
                  <el-button type="success" link v-if="row.status === 'deleted'" v-permission="'ai:knowledge:restore'" @click="handleRestore(row)">恢复</el-button>
                </template>
              </PageTable>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane label="同步监控" name="sync">
          <div class="sync-monitor">
            <el-row :gutter="20" class="sync-cards">
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="sync-stat-card" shadow="hover">
                  <div class="sync-stat-content">
                    <div class="sync-stat-info">
                      <div class="sync-stat-number">{{ studentSyncStats.total }}</div>
                      <div class="sync-stat-label">学生档案总数</div>
                    </div>
                    <div class="sync-stat-icon blue">
                      <el-icon :size="28"><User /></el-icon>
                    </div>
                  </div>
                  <div class="sync-stat-footer">
                    <span>今日同步：<b>{{ studentSyncStats.todayCount }}</b> 条</span>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="sync-stat-card" shadow="hover">
                  <div class="sync-stat-content">
                    <div class="sync-stat-info">
                      <div class="sync-stat-number">{{ studentSyncStats.syncing }}</div>
                      <div class="sync-stat-label">同步中</div>
                    </div>
                    <div class="sync-stat-icon orange">
                      <el-icon :size="28"><Loading /></el-icon>
                    </div>
                  </div>
                  <div class="sync-stat-footer">
                    <span>预计剩余：<b>{{ studentSyncStats.remaining }} 分钟</b></span>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="sync-stat-card" shadow="hover">
                  <div class="sync-stat-content">
                    <div class="sync-stat-info">
                      <div class="sync-stat-number">{{ studentSyncStats.success }}</div>
                      <div class="sync-stat-label">同步成功</div>
                    </div>
                    <div class="sync-stat-icon green">
                      <el-icon :size="28"><CircleCheck /></el-icon>
                    </div>
                  </div>
                  <div class="sync-stat-footer">
                    <span>成功率：<b>{{ studentSyncStats.successRate }}%</b></span>
                  </div>
                </el-card>
              </el-col>
              <el-col :xs="12" :sm="12" :md="6">
                <el-card class="sync-stat-card" shadow="hover">
                  <div class="sync-stat-content">
                    <div class="sync-stat-info">
                      <div class="sync-stat-number">{{ studentSyncStats.failed }}</div>
                      <div class="sync-stat-label">同步异常</div>
                    </div>
                    <div class="sync-stat-icon red">
                      <el-icon :size="28"><Warning /></el-icon>
                    </div>
                  </div>
                  <div class="sync-stat-footer">
                    <span>待处理：<b>{{ studentSyncStats.failed }}</b> 条</span>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-row :gutter="20" style="margin-top: 20px;">
              <el-col :md="12">
                <el-card class="sync-detail-card" shadow="never">
                  <template #header>
                    <div class="card-header-inner">
                      <span>学生档案库同步</span>
                      <el-button type="primary" :icon="RefreshRight" :loading="syncing" @click="handleSyncStudent">
                        {{ syncing ? '同步中...' : '立即同步' }}
                      </el-button>
                    </div>
                  </template>
                  <div class="sync-detail">
                    <div class="sync-progress" v-if="syncing">
                      <el-progress :percentage="syncProgress" :status="syncProgress === 100 ? 'success' : ''" />
                      <div class="progress-info">
                        <span>正在同步：{{ currentSyncItem }}</span>
                        <span>{{ syncProgress }}%</span>
                      </div>
                    </div>
                    <div class="sync-info" v-else>
                      <el-descriptions :column="2" border size="small">
                        <el-descriptions-item label="上次同步">{{ studentSyncStats.lastSyncTime }}</el-descriptions-item>
                        <el-descriptions-item label="同步耗时">{{ studentSyncStats.lastSyncDuration }}</el-descriptions-item>
                        <el-descriptions-item label="同步记录数">{{ studentSyncStats.lastSyncCount }} 条</el-descriptions-item>
                        <el-descriptions-item label="失败数">{{ studentSyncStats.lastSyncFailed }} 条</el-descriptions-item>
                      </el-descriptions>
                    </div>
                  </div>
                </el-card>
              </el-col>
              <el-col :md="12">
                <el-card class="sync-detail-card" shadow="never">
                  <template #header>
                    <div class="card-header-inner">
                      <span>公共知识库同步</span>
                      <el-button type="primary" :icon="RefreshRight" :loading="publicSyncing" @click="handleSyncPublic">
                        {{ publicSyncing ? '同步中...' : '立即同步' }}
                      </el-button>
                    </div>
                  </template>
                  <div class="sync-detail">
                    <div class="sync-progress" v-if="publicSyncing">
                      <el-progress :percentage="publicSyncProgress" :status="publicSyncProgress === 100 ? 'success' : ''" />
                      <div class="progress-info">
                        <span>正在同步：{{ currentPublicSyncItem }}</span>
                        <span>{{ publicSyncProgress }}%</span>
                      </div>
                    </div>
                    <div class="sync-info" v-else>
                      <el-descriptions :column="2" border size="small">
                        <el-descriptions-item label="上次同步">{{ publicSyncStats.lastSyncTime }}</el-descriptions-item>
                        <el-descriptions-item label="同步耗时">{{ publicSyncStats.lastSyncDuration }}</el-descriptions-item>
                        <el-descriptions-item label="同步记录数">{{ publicSyncStats.lastSyncCount }} 条</el-descriptions-item>
                        <el-descriptions-item label="失败数">{{ publicSyncStats.lastSyncFailed }} 条</el-descriptions-item>
                      </el-descriptions>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>

            <el-card class="log-card" shadow="never" style="margin-top: 20px;">
              <template #header>
                <div class="card-header-inner">
                  <span>同步日志</span>
                  <div class="log-actions">
                    <el-select v-model="logTypeFilter" placeholder="类型" style="width: 120px; margin-right: 10px;" clearable>
                      <el-option label="全部" value="" />
                      <el-option label="学生档案" value="student" />
                      <el-option label="公共知识" value="public" />
                    </el-select>
                    <el-button :icon="Refresh" @click="loadSyncLogs">刷新</el-button>
                  </div>
                </div>
              </template>
              <el-table :data="syncLogs" v-loading="logLoading" stripe>
                <el-table-column prop="time" label="时间" width="180" />
                <el-table-column prop="type" label="类型" width="120">
                  <template #default="{ row }">
                    <el-tag :type="row.type === 'student' ? 'primary' : 'success'" size="small">
                      {{ row.type === 'student' ? '学生档案' : '公共知识' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="状态" width="100">
                  <template #default="{ row }">
                    <el-tag :type="row.status === 'success' ? 'success' : row.status === 'failed' ? 'danger' : 'warning'" size="small">
                      {{ row.status === 'success' ? '成功' : row.status === 'failed' ? '失败' : '进行中' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="count" label="记录数" width="100" align="center" />
                <el-table-column prop="duration" label="耗时" width="100" align="center" />
                <el-table-column prop="error" label="错误信息" show-overflow-tooltip />
              </el-table>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px" class="knowledge-dialog">
      <el-form :model="form" :rules="formRules" ref="formRef" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入知识标题" maxlength="100" show-word-limit />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :md="12">
            <el-form-item label="分类" prop="category">
              <el-select v-model="form.category" placeholder="请选择分类" style="width: 100%;">
                <el-option label="政策规范" value="政策规范" />
                <el-option label="工作方法" value="工作方法" />
                <el-option label="典型案例" value="典型案例" />
                <el-option label="心理干预" value="心理干预" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :md="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="form.status">
                <el-radio value="enabled">启用</el-radio>
                <el-radio value="disabled">禁用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="form.tags"
            multiple
            filterable
            allow-create
            default-first-option
            placeholder="请输入标签，回车添加"
            style="width: 100%;"
          >
            <el-option v-for="tag in tagOptions" :key="tag" :label="tag" :value="tag" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="12"
            placeholder="请输入知识内容，支持富文本格式..."
          />
        </el-form-item>
        <el-form-item label="来源" prop="source">
          <el-input v-model="form.source" placeholder="请输入来源（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="viewDrawerVisible" title="知识详情" size="50%">
      <div v-if="currentKnowledge" class="knowledge-detail">
        <h3 class="detail-title">{{ currentKnowledge.title }}</h3>
        <div class="detail-meta">
          <el-tag :type="getCategoryTagType(currentKnowledge.category)">{{ currentKnowledge.category }}</el-tag>
          <el-tag :type="getStatusTagType(currentKnowledge.status)" size="small">
            {{ getStatusText(currentKnowledge.status) }}
          </el-tag>
          <span class="update-time">更新时间：{{ currentKnowledge.updateTime }}</span>
        </div>
        <div class="detail-tags">
          <el-tag v-for="tag in currentKnowledge.tags" :key="tag" type="info" size="small">
            #{{ tag }}
          </el-tag>
        </div>
        <el-divider />
        <div class="detail-content" v-html="formatContent(currentKnowledge.content)"></div>
        <div v-if="currentKnowledge.source" class="detail-source">
          <el-icon><Document /></el-icon>
          来源：{{ currentKnowledge.source }}
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Plus, Search, Upload, Folder, RefreshRight, Refresh,
  User, Loading, CircleCheck, Warning, Document
} from '@element-plus/icons-vue'
import PageTable from '@/components/PageTable.vue'

const activeTab = ref('list')
const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const viewDrawerVisible = ref(false)
const isEdit = ref(false)
const dialogTitle = ref('')
const formRef = ref(null)
const treeRef = ref(null)
const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const currentKnowledge = ref(null)
const searchKeyword = ref('')
const statusFilter = ref('')
const treeSearchKeyword = ref('')
const currentCategory = ref('')

const tagOptions = ['学习', '心理', '纪律', '卫生', '班级管理', '家校沟通', '行为规范', '心理健康']

const categoryTree = ref([
  {
    id: 'all',
    label: '全部分类',
    icon: 'Folder',
    count: 128,
    children: [
      { id: '政策规范', label: '政策规范', icon: 'Document', count: 25 },
      { id: '工作方法', label: '工作方法', icon: 'Document', count: 38 },
      { id: '典型案例', label: '典型案例', icon: 'Document', count: 42 },
      { id: '心理干预', label: '心理干预', icon: 'Document', count: 23 }
    ]
  }
])

const treeProps = {
  children: 'children',
  label: 'label'
}

const columns = [
  { type: 'index', label: '序号', width: 60 },
  { prop: 'title', label: '标题', minWidth: 220 },
  { slot: 'category', label: '分类', width: 110 },
  { slot: 'tags', label: '标签', minWidth: 180 },
  { slot: 'status', label: '状态', width: 90 },
  { prop: 'updateTime', label: '更新时间', type: 'time', width: 170 },
  { slot: 'action', label: '操作', width: 200, fixed: 'right' }
]

const form = reactive({
  id: null,
  title: '',
  category: '',
  tags: [],
  content: '',
  source: '',
  status: 'enabled'
})

const formRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  content: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

const syncing = ref(false)
const publicSyncing = ref(false)
const syncProgress = ref(0)
const publicSyncProgress = ref(0)
const currentSyncItem = ref('')
const currentPublicSyncItem = ref('')
const logLoading = ref(false)

const studentSyncStats = ref({
  total: 328,
  todayCount: 45,
  syncing: 12,
  success: 310,
  failed: 6,
  successRate: 98.1,
  remaining: 5,
  lastSyncTime: '2024-01-15 10:30:00',
  lastSyncDuration: '3分25秒',
  lastSyncCount: 45,
  lastSyncFailed: 2
})

const publicSyncStats = ref({
  total: 128,
  lastSyncTime: '2024-01-15 09:00:00',
  lastSyncDuration: '1分12秒',
  lastSyncCount: 8,
  lastSyncFailed: 0
})

const syncLogs = ref([
  { id: 1, time: '2024-01-15 10:30:00', type: 'student', status: 'success', count: 45, duration: '3分25秒', error: '' },
  { id: 2, time: '2024-01-15 09:00:00', type: 'public', status: 'success', count: 8, duration: '1分12秒', error: '' },
  { id: 3, time: '2024-01-14 22:00:00', type: 'student', status: 'success', count: 32, duration: '2分45秒', error: '' },
  { id: 4, time: '2024-01-14 20:00:00', type: 'public', status: 'failed', count: 0, duration: '30秒', error: '网络连接超时，请稍后重试' },
  { id: 5, time: '2024-01-14 18:00:00', type: 'student', status: 'success', count: 28, duration: '2分10秒', error: '' },
  { id: 6, time: '2024-01-14 12:00:00', type: 'student', status: 'success', count: 56, duration: '4分20秒', error: '' },
  { id: 7, time: '2024-01-13 22:00:00', type: 'student', status: 'success', count: 41, duration: '3分05秒', error: '' },
  { id: 8, time: '2024-01-13 09:00:00', type: 'public', status: 'success', count: 15, duration: '1分45秒', error: '' }
])

const logTypeFilter = ref('')

function getCategoryTagType(category) {
  const types = {
    '政策规范': '',
    '工作方法': 'success',
    '典型案例': 'warning',
    '心理干预': 'danger'
  }
  return types[category] || 'info'
}

function getStatusTagType(status) {
  const types = {
    enabled: 'success',
    disabled: 'info',
    deleted: 'danger'
  }
  return types[status] || 'info'
}

function getStatusText(status) {
  const texts = {
    enabled: '已启用',
    disabled: '已禁用',
    deleted: '已删除'
  }
  return texts[status] || status
}

function formatContent(content) {
  return content.replace(/\n/g, '<br/>')
}

async function getList() {
  loading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 300))
    const allData = [
      { id: 1, title: '中小学班主任工作规定', category: '政策规范', tags: ['政策', '班主任'], status: 'enabled', updateTime: '2024-01-15 10:00:00', content: '为了进一步加强中小学班主任工作，充分发挥班主任在教育学生中的重要作用，制定本规定。\n\n一、班主任的职责与任务\n（一）全面了解班级内每一个学生，深入分析学生思想、心理、学习、生活状况。关心爱护全体学生，平等对待每一个学生，尊重学生人格。采取多种方式与学生沟通，有针对性地进行思想道德教育，促进学生德智体美全面发展。\n\n（二）认真做好班级的日常管理工作，维护班级良好秩序，培养学生的规则意识、责任意识和集体荣誉感，营造民主和谐、团结互助、健康向上的集体氛围。指导班委会和团队工作。', source: '教育部' },
      { id: 2, title: '如何有效管理班级纪律', category: '工作方法', tags: ['纪律', '班级管理'], status: 'enabled', updateTime: '2024-01-14 14:00:00', content: '班级纪律管理是班级管理的重要组成部分，良好的纪律是教学质量的保障。\n\n一、建立明确的班级规章制度\n1. 与学生共同制定班规，让学生参与规则制定过程\n2. 规则要具体明确，可操作性强\n3. 奖惩分明，执行一致\n\n二、培养学生的自律意识\n1. 引导学生认识纪律的重要性\n2. 树立榜样，正面引导\n3. 及时表扬遵守纪律的学生', source: '教育文摘' },
      { id: 3, title: '学生常见心理问题识别与干预', category: '心理干预', tags: ['心理', '健康'], status: 'enabled', updateTime: '2024-01-13 09:00:00', content: '学生常见的心理问题包括焦虑、抑郁、人际关系敏感等。班主任需要及时识别并进行适当干预。\n\n一、常见心理问题的表现\n1. 焦虑：过度担心、坐立不安、注意力不集中\n2. 抑郁：情绪低落、兴趣减退、睡眠障碍\n3. 人际关系敏感：孤僻、退缩、易激惹\n\n二、干预策略\n1. 建立信任关系，倾听学生心声\n2. 引导学生正确认识自己的情绪\n3. 必要时转介专业心理辅导', source: '心理健康教育中心' },
      { id: 4, title: '典型违纪案例分析与处理', category: '典型案例', tags: ['案例', '行为规范'], status: 'enabled', updateTime: '2024-01-12 16:00:00', content: '案例一：学生课堂玩手机问题\n\n【案例描述】\n某学生在课堂上多次使用手机，经老师提醒后仍不改正，影响课堂秩序。\n\n【原因分析】\n1. 学生自控能力不足\n2. 对手机依赖程度高\n3. 课堂内容缺乏吸引力\n\n【处理策略】\n1. 与学生一对一沟通，了解原因\n2. 制定个性化的改进计划\n3. 与家长沟通，形成家校合力', source: '班主任工作手册' },
      { id: 5, title: '高效学习方法指导', category: '工作方法', tags: ['学习', '方法'], status: 'enabled', updateTime: '2024-01-11 11:00:00', content: '好的学习方法可以事半功倍，帮助学生提高学习效率。\n\n一、时间管理\n1. 制定学习计划，合理安排时间\n2. 使用番茄工作法，集中注意力\n3. 避免拖延，今日事今日毕\n\n二、记忆技巧\n1. 艾宾浩斯遗忘曲线复习法\n2. 联想记忆法\n3. 思维导图法', source: '学习方法报' },
      { id: 6, title: '中学生日常行为规范', category: '政策规范', tags: ['行为', '规范'], status: 'disabled', updateTime: '2024-01-10 15:00:00', content: '一、自尊自爱，注重仪表\n1. 维护国家荣誉，尊敬国旗、国徽，会唱国歌，升降国旗、奏唱国歌时要肃立、脱帽、行注目礼，少先队员行队礼。\n2. 穿戴整洁、朴素大方，不烫发，不染发，不化妆，不佩戴首饰，男生不留长发，女生不穿高跟鞋。', source: '教育部' },
      { id: 7, title: '家校沟通的艺术', category: '工作方法', tags: ['家校沟通', '教育'], status: 'enabled', updateTime: '2024-01-09 10:30:00', content: '家校沟通是班主任工作的重要内容，有效的家校沟通能够形成教育合力。\n\n一、沟通原则\n1. 尊重家长，平等交流\n2. 实事求是，客观公正\n3. 及时沟通，防患未然\n\n二、沟通技巧\n1. 先肯定，后建议\n2. 多倾听，少说教\n3. 用事实说话，避免主观臆断', source: '班主任之友' },
      { id: 8, title: '校园欺凌的识别与应对', category: '典型案例', tags: ['校园欺凌', '安全'], status: 'enabled', updateTime: '2024-01-08 14:00:00', content: '校园欺凌是一个严重的问题，班主任需要提高警惕，及时发现和处理。\n\n一、欺凌的表现形式\n1. 身体欺凌：打骂、推搡等\n2. 言语欺凌：嘲笑、辱骂、起外号等\n3. 社交欺凌：孤立、排挤、散布谣言等\n4. 网络欺凌：在网络上发布侮辱性言论等\n\n二、应对措施\n1. 立即制止欺凌行为\n2. 安抚受害者情绪\n3. 调查事实真相\n4. 对欺凌者进行教育和惩戒', source: '校园安全指南' },
      { id: 9, title: '学生考试焦虑疏导', category: '心理干预', tags: ['心理', '考试'], status: 'enabled', updateTime: '2024-01-07 09:00:00', content: '考试焦虑是学生中常见的心理问题，适度的焦虑有助于提高学习效率，但过度焦虑会影响考试发挥。\n\n一、考试焦虑的表现\n1. 考前：紧张、失眠、食欲下降\n2. 考中：心跳加速、手心出汗、大脑空白\n3. 考后：过度担忧成绩、情绪低落\n\n二、疏导方法\n1. 认知重构：帮助学生正确看待考试\n2. 放松训练：深呼吸、渐进性肌肉放松\n3. 积极心理暗示', source: '心理咨询中心' },
      { id: 10, title: '班级活动组织与设计', category: '工作方法', tags: ['班级活动', '集体建设'], status: 'enabled', updateTime: '2024-01-06 16:30:00', content: '班级活动是增强班级凝聚力的重要途径。\n\n一、活动设计原则\n1. 教育性：活动要有明确的教育目标\n2. 趣味性：活动形式要生动有趣\n3. 参与性：让每个学生都能参与其中\n4. 安全性：确保活动安全有序\n\n二、常见活动类型\n1. 主题班会\n2. 文体活动\n3. 社会实践\n4. 节日庆典', source: '班级管理丛书' }
    ]

    let filtered = allData
    
    if (currentCategory.value && currentCategory.value !== 'all') {
      filtered = filtered.filter(item => item.category === currentCategory.value)
    }
    
    if (searchKeyword.value) {
      const keyword = searchKeyword.value.toLowerCase()
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(keyword) ||
        item.content.toLowerCase().includes(keyword)
      )
    }
    
    if (statusFilter.value) {
      filtered = filtered.filter(item => item.status === statusFilter.value)
    }
    
    total.value = filtered.length
    tableData.value = filtered.slice((pageNum.value - 1) * pageSize.value, pageNum.value * pageSize.value)
  } finally {
    loading.value = false
  }
}

function handleNodeClick(data) {
  currentCategory.value = data.id === 'all' ? '' : data.id
  pageNum.value = 1
  getList()
}

function handleSearch() {
  pageNum.value = 1
  getList()
}

function handlePageChange({ pageNum: pn, pageSize: ps }) {
  pageNum.value = pn
  pageSize.value = ps
  getList()
}

function handleAdd() {
  isEdit.value = false
  dialogTitle.value = '新增知识'
  Object.assign(form, { id: null, title: '', category: currentCategory.value || '', tags: [], content: '', source: '', status: 'enabled' })
  dialogVisible.value = true
}

function handleEdit(row) {
  isEdit.value = true
  dialogTitle.value = '编辑知识'
  Object.assign(form, { ...row })
  dialogVisible.value = true
}

function handleView(row) {
  currentKnowledge.value = row
  viewDrawerVisible.value = true
}

async function handleSubmit() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        await new Promise(resolve => setTimeout(resolve, 500))
        ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
        dialogVisible.value = false
        getList()
      } finally {
        submitLoading.value = false
      }
    }
  })
}

function handleDelete(row) {
  ElMessageBox.confirm(`确定要删除知识 "${row.title}" 吗？`, '提示', {
    type: 'warning'
  }).then(() => {
    ElMessage.success('删除成功')
    getList()
  })
}

function handleRestore(row) {
  ElMessageBox.confirm(`确定要恢复知识 "${row.title}" 吗？`, '提示', {
    type: 'info'
  }).then(() => {
    ElMessage.success('恢复成功')
    getList()
  })
}

function handleBeforeUpload(file) {
  const isSupported = file.name.endsWith('.doc') || file.name.endsWith('.docx') || file.name.endsWith('.pdf')
  if (!isSupported) {
    ElMessage.error('仅支持 Word 和 PDF 格式文件！')
    return false
  }
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB！')
    return false
  }
  
  ElMessage.success(`文件 "${file.name}" 上传成功，正在解析...`)
  return false
}

async function handleSyncStudent() {
  if (syncing.value) return
  
  ElMessageBox.confirm('确定要同步学生档案库吗？同步可能需要一些时间。', '提示', {
    type: 'info'
  }).then(async () => {
    syncing.value = true
    syncProgress.value = 0
    
    const items = ['学生基本信息', '操行分记录', '请假记录', '手机收取记录', '违纪记录', '考勤记录']
    
    for (let i = 0; i < items.length; i++) {
      currentSyncItem.value = items[i]
      await new Promise(resolve => setTimeout(resolve, 800))
      syncProgress.value = Math.round(((i + 1) / items.length) * 100)
    }
    
    setTimeout(() => {
      syncing.value = false
      studentSyncStats.value.lastSyncTime = new Date().toLocaleString()
      studentSyncStats.value.lastSyncCount = Math.floor(Math.random() * 30) + 20
      ElMessage.success('学生档案库同步成功')
      loadSyncLogs()
    }, 500)
  })
}

async function handleSyncPublic() {
  if (publicSyncing.value) return
  
  ElMessageBox.confirm('确定要同步公共知识库吗？', '提示', {
    type: 'info'
  }).then(async () => {
    publicSyncing.value = true
    publicSyncProgress.value = 0
    
    const items = ['政策法规库', '教育方法库', '案例库', '心理健康库']
    
    for (let i = 0; i < items.length; i++) {
      currentPublicSyncItem.value = items[i]
      await new Promise(resolve => setTimeout(resolve, 600))
      publicSyncProgress.value = Math.round(((i + 1) / items.length) * 100)
    }
    
    setTimeout(() => {
      publicSyncing.value = false
      publicSyncStats.value.lastSyncTime = new Date().toLocaleString()
      publicSyncStats.value.lastSyncCount = Math.floor(Math.random() * 10) + 3
      ElMessage.success('公共知识库同步成功')
      loadSyncLogs()
    }, 500)
  })
}

async function loadSyncLogs() {
  logLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 300))
  } finally {
    logLoading.value = false
  }
}

onMounted(() => {
  getList()
  loadSyncLogs()
})
</script>

<style scoped lang="scss">
.ai-knowledge-container {
  .page-card {
    border: none;
    border-radius: 8px;
  }

  .card-header {
    font-size: 16px;
    font-weight: 600;
  }

  .card-header-inner {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }

  .knowledge-tabs {
    :deep(.el-tabs__header) {
      margin-bottom: 20px;
    }
  }

  .knowledge-list-layout {
    display: flex;
    gap: 20px;
    min-height: 600px;
  }

  .left-panel {
    width: 240px;
    flex-shrink: 0;
    border-right: 1px solid #ebeef5;
    padding-right: 20px;

    .panel-header {
      margin-bottom: 15px;

      .panel-title {
        font-size: 14px;
        font-weight: 600;
        color: #303133;
      }
    }

    .tree-search {
      margin-bottom: 15px;
    }

    .category-tree {
      background: transparent;

      .custom-tree-node {
        display: flex;
        align-items: center;
        width: 100%;
        padding: 4px 0;

        .node-icon {
          margin-right: 8px;
          color: #409eff;
        }

        .node-label {
          flex: 1;
          font-size: 14px;
        }

        .node-count {
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }

  .right-panel {
    flex: 1;
    min-width: 0;

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;

      .toolbar-left {
        display: flex;
        align-items: center;
      }

      .toolbar-right {
        display: flex;
        align-items: center;
      }
    }
  }

  .knowledge-detail {
    .detail-title {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 15px;
      color: #303133;
    }

    .detail-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      flex-wrap: wrap;

      .update-time {
        font-size: 12px;
        color: #909399;
      }
    }

    .detail-tags {
      margin-bottom: 15px;

      .el-tag {
        margin-right: 8px;
        margin-bottom: 5px;
      }
    }

    .detail-content {
      line-height: 2;
      color: #303133;
      font-size: 14px;
    }

    .detail-source {
      margin-top: 20px;
      padding-top: 15px;
      border-top: 1px solid #ebeef5;
      font-size: 12px;
      color: #909399;
      display: flex;
      align-items: center;
      gap: 5px;
    }
  }

  .sync-monitor {
    .sync-cards {
      margin-bottom: 0;
    }

    .sync-stat-card {
      border: none;
      border-radius: 8px;

      .sync-stat-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 5px 0;
      }

      .sync-stat-info {
        .sync-stat-number {
          font-size: 28px;
          font-weight: 700;
          color: #303133;
          line-height: 1.2;
        }

        .sync-stat-label {
          font-size: 14px;
          color: #909399;
          margin-top: 5px;
        }
      }

      .sync-stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;

        &.blue { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        &.green { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
        &.orange { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        &.red { background: linear-gradient(135deg, #f5576c 0%, #f093fb 100%); }
      }

      .sync-stat-footer {
        margin-top: 12px;
        padding-top: 12px;
        border-top: 1px solid #f0f2f5;
        font-size: 12px;
        color: #606266;

        b {
          color: #409eff;
        }
      }
    }

    .sync-detail-card {
      border: none;
      border-radius: 8px;

      .sync-detail {
        .sync-progress {
          .progress-info {
            display: flex;
            justify-content: space-between;
            margin-top: 10px;
            font-size: 12px;
            color: #606266;
          }
        }

        .sync-info {
          :deep(.el-descriptions__label) {
            width: 90px;
          }
        }
      }
    }

    .log-card {
      border: none;
      border-radius: 8px;

      .log-actions {
        display: flex;
        align-items: center;
      }
    }
  }
}

@media (max-width: 768px) {
  .knowledge-list-layout {
    flex-direction: column;

    .left-panel {
      width: 100%;
      border-right: none;
      border-bottom: 1px solid #ebeef5;
      padding-right: 0;
      padding-bottom: 20px;
    }
  }
}
</style>
