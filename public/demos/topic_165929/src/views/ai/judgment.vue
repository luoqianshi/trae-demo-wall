<template>
  <div class="ai-judgment-container">
    <el-card class="page-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <el-icon :size="22" class="header-icon"><MagicStick /></el-icon>
            <span class="header-title">大模型智能研判</span>
            <el-tag type="primary" effect="dark" class="beta-tag">AI 驱动</el-tag>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" type="card" class="judgment-tabs">
        <el-tab-pane name="student">
          <template #label>
            <el-icon><User /></el-icon>
            <span>学生问题精准研判</span>
          </template>
          <div class="student-judgment-layout">
            <div class="left-panel">
              <div class="panel-header">
                <h3>选择学生</h3>
              </div>
              <div class="student-selector">
                <el-select
                  v-model="selectedClassId"
                  placeholder="选择班级"
                  style="width: 100%;"
                  class="class-select"
                >
                  <el-option label="计算机2301班" :value="1" />
                  <el-option label="计算机2302班" :value="2" />
                  <el-option label="软工2301班" :value="3" />
                </el-select>
                <el-input
                  v-model="studentSearch"
                  placeholder="搜索学生姓名/学号"
                  :prefix-icon="Search"
                  class="student-search"
                />
                <div class="student-list">
                  <div
                    v-for="stu in filteredStudents"
                    :key="stu.id"
                    :class="['student-item', { active: selectedStudent?.id === stu.id }]"
                    @click="handleSelectStudent(stu)"
                  >
                    <el-avatar :size="40" class="student-avatar">
                      {{ stu.name.charAt(0) }}
                    </el-avatar>
                    <div class="student-info">
                      <div class="student-name">{{ stu.name }}</div>
                      <div class="student-no">{{ stu.studentNo }}</div>
                    </div>
                    <el-tag v-if="stu.warningLevel" :type="getWarningType(stu.warningLevel)" size="small" effect="dark">
                      {{ stu.warningLevel }}
                    </el-tag>
                  </div>
                  <el-empty v-if="filteredStudents.length === 0" description="暂无学生" :image-size="80" />
                </div>
              </div>

              <el-card v-if="selectedStudent" class="student-snapshot" shadow="never">
                <template #header>
                  <span class="snapshot-title">学生档案快照</span>
                </template>
                <div class="snapshot-content">
                  <div class="snapshot-header">
                    <el-avatar :size="56" class="snapshot-avatar">
                      {{ selectedStudent.name.charAt(0) }}
                    </el-avatar>
                    <div class="snapshot-info">
                      <h4>{{ selectedStudent.name }}</h4>
                      <p>{{ selectedStudent.studentNo }} · {{ selectedStudent.className }}</p>
                    </div>
                  </div>
                  <el-divider />
                  <div class="snapshot-stats">
                    <div class="stat-item">
                      <div class="stat-value">{{ selectedStudent.score || 85 }}</div>
                      <div class="stat-label">操行分</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-value">{{ selectedStudent.rank || 12 }}</div>
                      <div class="stat-label">班级排名</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-value">{{ selectedStudent.leaveCount || 3 }}</div>
                      <div class="stat-label">请假次数</div>
                    </div>
                  </div>
                </div>
              </el-card>
            </div>

            <div class="middle-panel">
              <div class="panel-header">
                <h3>问题描述</h3>
                <span class="char-count">{{ problemDescription.length }}/500</span>
              </div>
              <div class="problem-input-section">
                <el-input
                  v-model="problemDescription"
                  type="textarea"
                  :rows="6"
                  :maxlength="500"
                  placeholder="请详细描述学生的问题情况，包括：&#10;• 具体行为表现&#10;• 持续时间和频率&#10;• 已采取的措施&#10;• 需要重点关注的方面"
                  class="problem-textarea"
                />

                <div class="upload-section">
                  <div class="upload-label">
                    <el-icon><Picture /></el-icon>
                    <span>佐证材料（最多3张）</span>
                  </div>
                  <el-upload
                    :file-list="uploadedFiles"
                    :limit="3"
                    list-type="picture-card"
                    :auto-upload="false"
                    :on-preview="handlePicturePreview"
                    :on-remove="handleRemoveFile"
                    :on-change="handleFileChange"
                    accept="image/*"
                    class="uploader"
                  >
                    <el-icon class="upload-icon"><Plus /></el-icon>
                  </el-upload>
                </div>

                <div class="history-quick">
                  <el-button text :icon="Clock" @click="activeTab = 'history'">
                    查看历史研判记录
                  </el-button>
                </div>

                <el-button
                  type="primary"
                  size="large"
                  :icon="MagicStick"
                  :loading="generating"
                  :disabled="!selectedStudent || !problemDescription.trim()"
                  class="generate-btn"
                  @click="handleGeneratePlan"
                >
                  {{ generating ? 'AI 分析中...' : '一键生成个性化方案' }}
                </el-button>
              </div>
            </div>

            <div class="right-panel">
              <div class="panel-header">
                <h3>研判方案</h3>
                <div v-if="generatedPlan" class="panel-actions">
                  <el-tooltip content="收藏">
                    <el-button :type="isFavorited ? 'warning' : 'default'" :icon="Star" circle @click="handleFavorite" />
                  </el-tooltip>
                  <el-tooltip content="导出Word">
                    <el-button :icon="Document" circle @click="handleExport('word')" />
                  </el-tooltip>
                  <el-tooltip content="导出PDF">
                    <el-button :icon="Printer" circle @click="handleExport('pdf')" />
                  </el-tooltip>
                </div>
              </div>

              <div v-if="!generatedPlan && !generating" class="empty-state">
                <div class="empty-icon-wrapper">
                  <el-icon :size="64" class="empty-icon"><MagicStick /></el-icon>
                </div>
                <h3>智能研判方案</h3>
                <p>选择学生并描述问题，AI 将为您生成个性化的干预方案</p>
                <div class="feature-list">
                  <div class="feature-item">
                    <el-icon><Aim /></el-icon>
                    <span>问题根源分析</span>
                  </div>
                  <div class="feature-item">
                    <el-icon><Lightning /></el-icon>
                    <span>即时应对策略</span>
                  </div>
                  <div class="feature-item">
                    <el-icon><TrendCharts /></el-icon>
                    <span>长期引导方案</span>
                  </div>
                  <div class="feature-item">
                    <el-icon><HomeFilled /></el-icon>
                    <span>家校沟通建议</span>
                  </div>
                </div>
              </div>

              <div v-else-if="generating" class="generating-state">
                <div class="generating-animation">
                  <div class="circle-loading">
                    <el-icon class="is-loading" :size="48"><Loading /></el-icon>
                  </div>
                  <h3>AI 正在深度分析...</h3>
                  <p class="generating-tip">{{ currentGeneratingStep }}</p>
                </div>
              </div>

              <div v-else class="plan-content">
                <div class="plan-title">
                  <h2>{{ selectedStudent?.name }}同学问题个性化干预方案</h2>
                  <p class="plan-subtitle">
                    生成时间：{{ planGenerateTime }} · 基于 {{ selectedStudent?.name }} 的综合数据分析
                  </p>
                </div>

                <div class="dimension-cards">
                  <div v-for="(dim, index) in planDimensions" :key="dim.key" class="dimension-card" :style="{ animationDelay: `${index * 0.1}s` }">
                    <div class="dim-header">
                      <div class="dim-icon" :class="dim.iconClass">
                        <el-icon :size="24"><component :is="dim.icon" /></el-icon>
                      </div>
                      <div class="dim-title">
                        <h4>{{ dim.title }}</h4>
                      </div>
                    </div>
                    <div class="dim-content">
                      <div v-html="dim.content"></div>
                    </div>
                  </div>
                </div>

                <div class="feedback-section">
                  <el-divider content-position="left">方案评价</el-divider>
                  <div class="feedback-content">
                    <span class="feedback-label">这个方案对您有帮助吗？</span>
                    <el-radio-group v-model="feedbackRating" class="feedback-rating">
                      <el-radio-button value="useful">
                        <el-icon><Star /></el-icon>
                        有用
                      </el-radio-button>
                      <el-radio-button value="normal">
                        <el-icon><Star /></el-icon>
                        一般
                      </el-radio-button>
                      <el-radio-button value="useless">
                        <el-icon><Star /></el-icon>
                        无用
                      </el-radio-button>
                    </el-radio-group>
                    <el-input
                      v-model="feedbackComment"
                      type="textarea"
                      :rows="2"
                      placeholder="请填写您的评价和建议（选填）"
                      class="feedback-input"
                    />
                    <el-button type="primary" :loading="submittingFeedback" @click="handleSubmitFeedback">
                      提交反馈
                    </el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane name="general">
          <template #label>
            <el-icon><ChatDotRound /></el-icon>
            <span>通用场景咨询</span>
          </template>
          <div class="general-chat-layout">
            <div class="chat-sidebar">
              <div class="sidebar-header">
                <el-button type="primary" :icon="Plus" class="new-chat-btn" @click="handleNewGeneralChat">
                  新对话
                </el-button>
              </div>
              <el-scrollbar class="chat-history-list">
                <div
                  v-for="item in generalConversations"
                  :key="item.id"
                  :class="['history-item', { active: currentGeneralConvId === item.id }]"
                  @click="handleSwitchGeneralConv(item)"
                >
                  <el-icon><ChatDotRound /></el-icon>
                  <span class="history-title">{{ item.title }}</span>
                </div>
              </el-scrollbar>
            </div>
            <div class="chat-main">
              <div class="chat-header">
                <span>通用教育场景咨询</span>
              </div>
              <el-scrollbar ref="generalChatScrollRef" class="chat-messages">
                <div v-if="generalMessages.length === 0" class="general-empty">
                  <el-icon :size="48"><ChatDotRound /></el-icon>
                  <p>您好，我是教育场景智能顾问，可以为您解答班级管理、教育方法等问题</p>
                </div>
                <div v-for="(msg, index) in generalMessages" :key="index" :class="['msg-item', msg.role]">
                  <div class="msg-avatar">
                    <el-avatar :size="36" v-if="msg.role === 'assistant'">
                      <el-icon><MagicStick /></el-icon>
                    </el-avatar>
                    <el-avatar :size="36" v-else>{{ '我' }}</el-avatar>
                  </div>
                  <div class="msg-bubble">
                    <div v-html="msg.content"></div>
                  </div>
                </div>
                <div v-if="generalLoading" class="msg-item assistant">
                  <div class="msg-avatar">
                    <el-avatar :size="36"><el-icon><MagicStick /></el-icon></el-avatar>
                  </div>
                  <div class="msg-bubble">
                    <div class="typing-dots">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              </el-scrollbar>
              <div class="chat-input-area">
                <el-input
                  v-model="generalInput"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入您的问题..."
                  @keydown.enter.prevent="handleGeneralSend"
                />
                <div class="input-actions">
                  <span class="tip">Enter 发送</span>
                  <el-button type="primary" :loading="generalLoading" @click="handleGeneralSend">发送</el-button>
                </div>
              </div>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane name="class">
          <template #label>
            <el-icon><OfficeBuilding /></el-icon>
            <span>班级共性问题分析</span>
          </template>
          <div class="class-analysis-layout">
            <div class="analysis-controls">
              <el-form :inline="true">
                <el-form-item label="选择班级">
                  <el-select v-model="analysisClassId" placeholder="请选择班级" style="width: 200px;">
                    <el-option label="计算机2301班" :value="1" />
                    <el-option label="计算机2302班" :value="2" />
                    <el-option label="软工2301班" :value="3" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button
                    type="primary"
                    :icon="MagicStick"
                    :loading="analyzingClass"
                    :disabled="!analysisClassId"
                    @click="handleGenerateClassAnalysis"
                  >
                    {{ analyzingClass ? '分析中...' : '生成分析报告' }}
                  </el-button>
                </el-form-item>
              </el-form>
            </div>

            <div v-if="!classReport && !analyzingClass" class="empty-class-analysis">
              <el-icon :size="64" class="empty-icon"><OfficeBuilding /></el-icon>
              <h3>班级共性问题分析</h3>
              <p>选择班级后，AI 将分析班级整体情况，识别共性问题并提供改进建议</p>
            </div>

            <div v-else-if="analyzingClass" class="analyzing-state">
              <el-icon class="is-loading" :size="48"><Loading /></el-icon>
              <h3>正在分析班级数据...</h3>
              <p>{{ currentAnalyzingStep }}</p>
            </div>

            <div v-else class="class-report">
              <div class="report-header">
                <h2>{{ className }}班级分析报告</h2>
                <p>生成时间：{{ reportGenerateTime }}</p>
                <el-button type="primary" :icon="Download" @click="handleExportClassReport">
                  导出报告
                </el-button>
              </div>

              <el-row :gutter="20" class="overview-section">
                <el-col :span="6">
                  <div class="overview-card">
                    <div class="overview-icon blue"><el-icon><User /></el-icon></div>
                    <div class="overview-info">
                      <div class="overview-value">{{ classReport.overview.totalStudents }}</div>
                      <div class="overview-label">班级人数</div>
                    </div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="overview-card">
                    <div class="overview-icon green"><el-icon><Medal /></el-icon></div>
                    <div class="overview-info">
                      <div class="overview-value">{{ classReport.overview.avgScore }}</div>
                      <div class="overview-label">平均操行分</div>
                    </div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="overview-card">
                    <div class="overview-icon orange"><el-icon><Warning /></el-icon></div>
                    <div class="overview-info">
                      <div class="overview-value">{{ classReport.overview.warningCount }}</div>
                      <div class="overview-label">预警人数</div>
                    </div>
                  </div>
                </el-col>
                <el-col :span="6">
                  <div class="overview-card">
                    <div class="overview-icon purple"><el-icon><TrendCharts /></el-icon></div>
                    <div class="overview-info">
                      <div class="overview-value">{{ classReport.overview.attendanceRate }}%</div>
                      <div class="overview-label">出勤率</div>
                    </div>
                  </div>
                </el-col>
              </el-row>

              <el-card class="report-section" shadow="never">
                <template #header>
                  <span class="section-title">
                    <el-icon><Warning /></el-icon>
                    共性问题识别
                  </span>
                </template>
                <div class="problem-tags">
                  <el-tag
                    v-for="(problem, index) in classReport.commonProblems"
                    :key="index"
                    :type="problem.level === 'high' ? 'danger' : problem.level === 'medium' ? 'warning' : 'info'"
                    size="large"
                    effect="dark"
                    class="problem-tag"
                  >
                    <el-icon><component :is="problem.icon" /></el-icon>
                    {{ problem.name }}
                    <span class="problem-count">{{ problem.count }}人</span>
                  </el-tag>
                </div>
                <div class="problem-details">
                  <div v-for="(problem, index) in classReport.commonProblems" :key="index" class="problem-detail-item">
                    <h4>{{ problem.name }}</h4>
                    <p>{{ problem.description }}</p>
                  </div>
                </div>
              </el-card>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-card class="report-section" shadow="never">
                    <template #header>
                      <span class="section-title">
                        <el-icon><TrendCharts /></el-icon>
                        班风建设建议
                      </span>
                    </template>
                    <div class="suggestion-list">
                      <div v-for="(item, index) in classReport.suggestions.classAtmosphere" :key="index" class="suggestion-item">
                        <div class="suggestion-num">{{ index + 1 }}</div>
                        <p>{{ item }}</p>
                      </div>
                    </div>
                  </el-card>
                </el-col>
                <el-col :span="12">
                  <el-card class="report-section" shadow="never">
                    <template #header>
                      <span class="section-title">
                        <el-icon><Trophy /></el-icon>
                        集体活动建议
                      </span>
                    </template>
                    <div class="suggestion-list">
                      <div v-for="(item, index) in classReport.suggestions.groupActivities" :key="index" class="suggestion-item">
                        <div class="suggestion-num">{{ index + 1 }}</div>
                        <p>{{ item }}</p>
                      </div>
                    </div>
                  </el-card>
                </el-col>
              </el-row>

              <el-card class="report-section" shadow="never">
                <template #header>
                  <span class="section-title">
                    <el-icon><Setting /></el-icon>
                    制度优化建议
                  </span>
                </template>
                <div class="suggestion-list">
                  <div v-for="(item, index) in classReport.suggestions.systemOptimization" :key="index" class="suggestion-item">
                    <div class="suggestion-num">{{ index + 1 }}</div>
                    <p>{{ item }}</p>
                  </div>
                </div>
              </el-card>
            </div>
          </div>
        </el-tab-pane>

        <el-tab-pane name="history">
          <template #label>
            <el-icon><Clock /></el-icon>
            <span>研判历史</span>
          </template>
          <div class="history-section">
            <div class="history-filters">
              <el-form :inline="true">
                <el-form-item label="学生">
                  <el-select v-model="historyFilter.studentId" placeholder="全部学生" clearable style="width: 160px;">
                    <el-option v-for="stu in allStudents" :key="stu.id" :label="stu.name" :value="stu.id" />
                  </el-select>
                </el-form-item>
                <el-form-item label="时间范围">
                  <el-date-picker
                    v-model="historyFilter.dateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    style="width: 240px;"
                  />
                </el-form-item>
                <el-form-item label="问题类型">
                  <el-select v-model="historyFilter.type" placeholder="全部类型" clearable style="width: 140px;">
                    <el-option label="学习问题" value="学习问题" />
                    <el-option label="纪律问题" value="纪律问题" />
                    <el-option label="心理问题" value="心理问题" />
                    <el-option label="综合研判" value="综合研判" />
                  </el-select>
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" :icon="Search" @click="handleHistorySearch">搜索</el-button>
                </el-form-item>
              </el-form>
            </div>

            <el-table :data="historyList" v-loading="historyLoading" stripe>
              <el-table-column type="index" label="序号" width="60" align="center" />
              <el-table-column prop="studentName" label="学生" width="100">
                <template #default="{ row }">
                  <div class="hist-student">
                    <el-avatar :size="28">{{ row.studentName.charAt(0) }}</el-avatar>
                    <span>{{ row.studentName }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column prop="className" label="班级" min-width="140" />
              <el-table-column prop="type" label="类型" width="100">
                <template #default="{ row }">
                  <el-tag size="small">{{ row.type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="problemSummary" label="问题摘要" min-width="200" show-overflow-tooltip />
              <el-table-column prop="level" label="风险等级" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="getWarningType(row.level)" effect="dark" size="small">{{ row.level }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createTime" label="生成时间" width="180" />
              <el-table-column label="操作" width="150" fixed="right" align="center">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="handleViewHistory(row)">查看详情</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="pagination-wrapper">
              <el-pagination
                v-model:current-page="historyPageNum"
                v-model:page-size="historyPageSize"
                :total="historyTotal"
                :page-sizes="[10, 20, 50]"
                layout="total, sizes, prev, pager, next, jumper"
                background
              />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="previewVisible" title="图片预览" width="auto" align-center>
      <img :src="previewImage" style="max-width: 100%; max-height: 70vh;" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  MagicStick, User, Search, Plus, Picture, Clock, Star, Document, Printer,
  Aim, Lightning, TrendCharts, HomeFilled, ChatDotRound, OfficeBuilding,
  Warning, Medal, Download, Setting, Trophy, Loading
} from '@element-plus/icons-vue'

const activeTab = ref('student')

const selectedClassId = ref(null)
const studentSearch = ref('')
const selectedStudent = ref(null)
const problemDescription = ref('')
const uploadedFiles = ref([])
const generating = ref(false)
const generatedPlan = ref(false)
const isFavorited = ref(false)
const feedbackRating = ref('')
const feedbackComment = ref('')
const submittingFeedback = ref(false)
const planGenerateTime = ref('')
const previewVisible = ref(false)
const previewImage = ref('')
const currentGeneratingStep = ref('')

const allStudents = ref([
  { id: 1, name: '张三', studentNo: '20230001', className: '计算机2301班', score: 88, rank: 8, leaveCount: 2, warningLevel: '' },
  { id: 2, name: '李四', studentNo: '20230002', className: '计算机2301班', score: 72, rank: 35, leaveCount: 8, warningLevel: '重度' },
  { id: 3, name: '王五', studentNo: '20230003', className: '计算机2301班', score: 85, rank: 12, leaveCount: 3, warningLevel: '' },
  { id: 4, name: '赵六', studentNo: '20230004', className: '计算机2301班', score: 92, rank: 3, leaveCount: 1, warningLevel: '' },
  { id: 5, name: '钱七', studentNo: '20230005', className: '软工2301班', score: 78, rank: 25, leaveCount: 5, warningLevel: '中度' },
  { id: 6, name: '孙八', studentNo: '20230006', className: '软工2301班', score: 83, rank: 15, leaveCount: 2, warningLevel: '轻度' }
])

const filteredStudents = computed(() => {
  let list = allStudents.value
  if (selectedClassId.value) {
    const classId = selectedClassId.value
    const className = classId === 1 ? '计算机2301班' : classId === 2 ? '计算机2302班' : '软工2301班'
    list = list.filter(s => s.className === className)
  }
  if (studentSearch.value) {
    const keyword = studentSearch.value.toLowerCase()
    list = list.filter(s => s.name.includes(keyword) || s.studentNo.includes(keyword))
  }
  return list
})

const planDimensions = ref([
  {
    key: 'rootCause',
    title: '问题根源分析',
    icon: Aim,
    iconClass: 'dim-icon-red',
    content: ''
  },
  {
    key: 'immediate',
    title: '即时应对策略',
    icon: Lightning,
    iconClass: 'dim-icon-orange',
    content: ''
  },
  {
    key: 'longTerm',
    title: '长期引导方案',
    icon: TrendCharts,
    iconClass: 'dim-icon-blue',
    content: ''
  },
  {
    key: 'parent',
    title: '家校沟通建议',
    icon: HomeFilled,
    iconClass: 'dim-icon-green',
    content: ''
  },
  {
    key: 'risk',
    title: '风险预警',
    icon: Warning,
    iconClass: 'dim-icon-purple',
    content: ''
  },
  {
    key: 'observation',
    title: '观察指标',
    icon: Medal,
    iconClass: 'dim-icon-cyan',
    content: ''
  }
])

function getWarningType(level) {
  const map = { '重度': 'danger', '中度': 'warning', '轻度': 'success' }
  return map[level] || 'info'
}

function handleSelectStudent(student) {
  selectedStudent.value = student
  generatedPlan.value = false
}

function handlePicturePreview(file) {
  previewImage.value = file.url
  previewVisible.value = true
}

function handleRemoveFile(file, fileList) {
  uploadedFiles.value = fileList
}

function handleFileChange(file, fileList) {
  uploadedFiles.value = fileList
}

async function handleGeneratePlan() {
  if (!selectedStudent.value || !problemDescription.value.trim()) return

  generating.value = true
  generatedPlan.value = false

  const steps = [
    '正在分析学生档案数据...',
    '正在梳理问题行为模式...',
    '正在匹配教育心理学理论...',
    '正在生成个性化干预方案...',
    '正在优化方案内容...'
  ]

  for (let i = 0; i < steps.length; i++) {
    currentGeneratingStep.value = steps[i]
    await new Promise(resolve => setTimeout(resolve, 600))
  }

  planDimensions.value = [
    {
      key: 'rootCause',
      title: '问题根源分析',
      icon: Aim,
      iconClass: 'dim-icon-red',
      content: `<p>通过对<strong>${selectedStudent.value.name}</strong>同学近期数据的综合分析，问题产生的主要原因包括：</p>
<ul>
<li><strong>学习适应困难</strong>：近期课程难度加大，学生在某些科目上出现理解困难，导致学习信心下降</li>
<li><strong>情绪调节能力不足</strong>：面对压力时缺乏有效的应对策略，容易产生消极情绪</li>
<li><strong>同伴关系影响</strong>：与同学的人际互动存在一些问题，影响了班级归属感</li>
<li><strong>家庭因素</strong>：家庭环境的变化可能对学生产生了一定的影响</li>
</ul>`
    },
    {
      key: 'immediate',
      title: '即时应对策略',
      icon: Lightning,
      iconClass: 'dim-icon-orange',
      content: `<p>针对当前情况，建议立即采取以下措施：</p>
<ol>
<li><strong>个别谈话</strong>：在24小时内与学生进行一对一的谈心，了解真实想法和感受</li>
<li><strong>情绪安抚</strong>：给予学生情感支持，让其感受到被理解和关心</li>
<li><strong>学业辅导</strong>：安排学习委员或老师对薄弱科目进行针对性辅导</li>
<li><strong>家长沟通</strong>：及时与家长取得联系，通报学生在校情况，争取家庭配合</li>
</ol>`
    },
    {
      key: 'longTerm',
      title: '长期引导方案',
      icon: TrendCharts,
      iconClass: 'dim-icon-blue',
      content: `<p>为帮助学生长期健康发展，建议实施以下方案：</p>
<ul>
<li><strong>建立信任关系</strong>：定期与学生交流，建立稳定的信任关系</li>
<li><strong>目标设定</strong>：协助学生设定合理的短期和长期学习目标</li>
<li><strong>习惯培养</strong>：引导学生养成良好的学习和生活习惯</li>
<li><strong>兴趣发掘</strong>：发现并培养学生的兴趣特长，增强自信心</li>
<li><strong>社交技能</strong>：通过集体活动提升学生的人际交往能力</li>
</ul>
<p><em>建议周期：8-12周，每周进行一次跟进评估</em></p>`
    },
    {
      key: 'parent',
      title: '家校沟通建议',
      icon: HomeFilled,
      iconClass: 'dim-icon-green',
      content: `<p>与家长沟通时请注意以下要点：</p>
<ol>
<li><strong>选择合适时机</strong>：避免在家长工作繁忙时联系，建议预约时间</li>
<li><strong>客观描述事实</strong>：用具体事例说明问题，避免主观评判</li>
<li><strong>表达关心</strong>：让家长感受到学校对学生的关心，而非单纯问责</li>
<li><strong>倾听家长</strong>：了解家庭情况，听取家长的想法和建议</li>
<li><strong>共同制定方案</strong>：家校协同，形成教育合力</li>
<li><strong>保持定期沟通</strong>：建议每2周进行一次情况交流</li>
</ol>`
    },
    {
      key: 'risk',
      title: '风险预警',
      icon: Warning,
      iconClass: 'dim-icon-purple',
      content: `<p>在干预过程中需重点关注以下风险信号：</p>
<div class="risk-list">
<div class="risk-item high"><span class="risk-tag">高风险</span> 情绪持续低落，出现自我否定言论</div>
<div class="risk-item medium"><span class="risk-tag">中风险</span> 学习成绩持续下滑，对学习失去兴趣</div>
<div class="risk-item medium"><span class="risk-tag">中风险</span> 社交隔离，不愿参与集体活动</div>
<div class="risk-item low"><span class="risk-tag">低风险</span> 偶尔出现迟到、早退现象</div>
</div>
<p><strong>应对机制</strong>：如出现高风险信号，应立即启动危机干预预案，联系心理老师和家长。</p>`
    },
    {
      key: 'observation',
      title: '观察指标',
      icon: Medal,
      iconClass: 'dim-icon-cyan',
      content: `<p>建议重点观察以下指标的变化情况：</p>
<table class="obs-table">
<thead><tr><th>观察维度</th><th>具体指标</th><th>观察频率</th></tr></thead>
<tbody>
<tr><td>学习表现</td><td>课堂参与度、作业完成质量、考试成绩</td><td>每周</td></tr>
<tr><td>情绪状态</td><td>情绪稳定性、积极情绪比例</td><td>每天</td></tr>
<tr><td>人际交往</td><td>与同学互动次数、集体活动参与度</td><td>每周</td></tr>
<tr><td>行为习惯</td><td>出勤情况、纪律表现</td><td>每天</td></tr>
<tr><td>身体状态</td><td>精神状态、食欲睡眠</td><td>每周</td></tr>
</tbody>
</table>
<p><em>建议每周进行一次小结，每月进行一次全面评估</em></p>`
    }
  ]

  generating.value = false
  generatedPlan.value = true
  planGenerateTime.value = new Date().toLocaleString('zh-CN')
}

function handleFavorite() {
  isFavorited.value = !isFavorited.value
  ElMessage.success(isFavorited.value ? '已收藏' : '已取消收藏')
}

function handleExport(type) {
  ElMessage.success(`正在导出${type.toUpperCase()}文件...`)
}

async function handleSubmitFeedback() {
  if (!feedbackRating.value) {
    ElMessage.warning('请选择评价')
    return
  }
  submittingFeedback.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 800))
    ElMessage.success('感谢您的反馈！')
  } finally {
    submittingFeedback.value = false
  }
}

const generalConversations = ref([
  { id: 1, title: '班级管理方法' },
  { id: 2, title: '如何提高学生积极性' }
])
const currentGeneralConvId = ref(null)
const generalMessages = ref([])
const generalInput = ref('')
const generalLoading = ref(false)
const generalChatScrollRef = ref(null)

function handleNewGeneralChat() {
  currentGeneralConvId.value = null
  generalMessages.value = []
}

function handleSwitchGeneralConv(item) {
  currentGeneralConvId.value = item.id
  generalMessages.value = [
    { role: 'user', content: '如何管理好一个班级？' },
    { role: 'assistant', content: '<p>班级管理是一门艺术，以下是一些建议：</p><ol><li><strong>建立明确的规则</strong>：让学生知道什么是可以做的，什么是不可以做的</li><li><strong>以身作则</strong>：老师要成为学生的榜样</li><li><strong>培养班干部</strong>：让学生参与管理</li><li><strong>关注每个学生</strong>：了解学生的个性和需求</li><li><strong>及时反馈</strong>：对学生的表现给予及时的肯定和纠正</li></ol>' }
  ]
}

async function handleGeneralSend() {
  if (!generalInput.value.trim() || generalLoading.value) return

  if (!currentGeneralConvId.value) {
    const newConv = { id: Date.now(), title: generalInput.value.substring(0, 20) }
    generalConversations.value.unshift(newConv)
    currentGeneralConvId.value = newConv.id
  }

  generalMessages.value.push({ role: 'user', content: generalInput.value })
  const question = generalInput.value
  generalInput.value = ''
  generalLoading.value = true

  setTimeout(() => {
    generalMessages.value.push({
      role: 'assistant',
      content: `<p>关于"<strong>${question}</strong>"这个问题，我来给您一些建议：</p>
<p>教育是一项需要耐心和智慧的工作。在处理这类问题时，建议您：</p>
<ul>
<li>先了解清楚事情的来龙去脉，不要急于下结论</li>
<li>站在学生的角度思考问题，理解他们的想法</li>
<li>采用积极引导的方式，而不是单纯的批评教育</li>
<li>与家长保持沟通，形成家校共育的合力</li>
<li>不断学习和提升自己的教育教学能力</li>
</ul>
<p>希望这些建议对您有帮助！如果您有更具体的问题，欢迎继续提问。</p>`
    })
    generalLoading.value = false
  }, 1000)
}

const analysisClassId = ref(null)
const analyzingClass = ref(false)
const classReport = ref(null)
const className = ref('')
const reportGenerateTime = ref('')
const currentAnalyzingStep = ref('')

async function handleGenerateClassAnalysis() {
  if (!analysisClassId.value) return

  analyzingClass.value = true
  classReport.value = null

  const classMap = { 1: '计算机2301班', 2: '计算机2302班', 3: '软工2301班' }
  className.value = classMap[analysisClassId.value] || '所选班级'

  const steps = ['正在收集班级数据...', '正在分析学生表现...', '正在识别共性问题...', '正在生成改进建议...']
  for (const step of steps) {
    currentAnalyzingStep.value = step
    await new Promise(resolve => setTimeout(resolve, 600))
  }

  classReport.value = {
    overview: {
      totalStudents: 45,
      avgScore: 85.6,
      warningCount: 5,
      attendanceRate: 96.8
    },
    commonProblems: [
      { name: '学习动力不足', level: 'high', count: 12, icon: 'Medal', description: '部分学生学习目标不明确，缺乏主动学习的动力，需要老师和家长的持续督促。' },
      { name: '课堂纪律问题', level: 'medium', count: 8, icon: 'Warning', description: '少数学生上课注意力不集中，存在讲话、打瞌睡等现象，影响课堂秩序。' },
      { name: '手机依赖', level: 'medium', count: 10, icon: 'Iphone', description: '部分学生对手机依赖程度较高，影响学习和休息，需要加强引导和管理。' },
      { name: '人际交往困扰', level: 'low', count: 5, icon: 'User', description: '个别学生在与同学相处中存在一些问题，需要引导其提升社交技能。' }
    ],
    suggestions: {
      classAtmosphere: [
        '建立积极向上的班级文化，营造良好的学习氛围',
        '开展主题班会，增强班级凝聚力和集体荣誉感',
        '设立班级图书角，培养学生阅读习惯',
        '建立学习互助小组，促进同学间的交流合作'
      ],
      groupActivities: [
        '组织户外拓展活动，增强团队协作能力',
        '开展学科竞赛，激发学习兴趣',
        '举办文艺活动，丰富学生课余生活',
        '组织志愿服务，培养社会责任感'
      ],
      systemOptimization: [
        '完善班级规章制度，明确奖惩机制',
        '建立班干部轮换制度，培养学生自治能力',
        '优化考勤制度，加强出勤管理',
        '建立学生成长档案，跟踪学生发展轨迹'
      ]
    }
  }

  analyzingClass.value = false
  reportGenerateTime.value = new Date().toLocaleString('zh-CN')
}

function handleExportClassReport() {
  ElMessage.success('正在导出班级分析报告...')
}

const historyFilter = reactive({
  studentId: '',
  dateRange: [],
  type: ''
})
const historyList = ref([])
const historyLoading = ref(false)
const historyTotal = ref(0)
const historyPageNum = ref(1)
const historyPageSize = ref(10)

async function loadHistory() {
  historyLoading.value = true
  try {
    await new Promise(resolve => setTimeout(resolve, 500))
    historyList.value = [
      { id: 1, studentName: '李四', className: '计算机2301班', type: '心理问题', problemSummary: '近期情绪低落，学习成绩下滑明显', level: '重度', createTime: '2024-01-15 10:00:00' },
      { id: 2, studentName: '钱七', className: '软工2301班', type: '学习问题', problemSummary: '数学成绩持续下降，作业完成质量不高', level: '中度', createTime: '2024-01-14 14:00:00' },
      { id: 3, studentName: '孙八', className: '软工2301班', type: '纪律问题', problemSummary: '多次违反课堂纪律，与同学发生冲突', level: '轻度', createTime: '2024-01-13 09:00:00' },
      { id: 4, studentName: '张三', className: '计算机2301班', type: '综合研判', problemSummary: '新学期适应情况综合评估', level: '轻度', createTime: '2024-01-10 11:00:00' }
    ]
    historyTotal.value = 28
  } finally {
    historyLoading.value = false
  }
}

function handleHistorySearch() {
  historyPageNum.value = 1
  loadHistory()
}

function handleViewHistory(row) {
  const student = allStudents.value.find(s => s.name === row.studentName)
  if (student) {
    selectedStudent.value = student
    problemDescription.value = row.problemSummary
    activeTab.value = 'student'
    handleGeneratePlan()
  }
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped lang="scss">
.ai-judgment-container {
  .page-card {
    border: none;
    border-radius: 8px;
  }

  .card-header {
    .header-left {
      display: flex;
      align-items: center;
      gap: 10px;

      .header-icon {
        color: #409EFF;
      }

      .header-title {
        font-size: 18px;
        font-weight: 600;
        color: #303133;
      }

      .beta-tag {
        margin-left: 8px;
      }
    }
  }

  .judgment-tabs {
    margin-top: 10px;

    :deep(.el-tabs__header) {
      margin-bottom: 20px;
    }
  }
}

.student-judgment-layout {
  display: grid;
  grid-template-columns: 280px 1fr 1fr;
  gap: 20px;
  min-height: 600px;
}

.left-panel, .middle-panel, .right-panel {
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }

  .char-count {
    font-size: 12px;
    color: #909399;
  }

  .panel-actions {
    display: flex;
    gap: 8px;
  }
}

.student-selector {
  .class-select {
    margin-bottom: 12px;
  }

  .student-search {
    margin-bottom: 12px;
  }

  .student-list {
    max-height: 300px;
    overflow-y: auto;
    border: 1px solid #ebeef5;
    border-radius: 8px;
    padding: 8px;
  }
}

.student-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f5f7fa;
  }

  &.active {
    background-color: #ecf5ff;
  }
}

.student-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.student-info {
  flex: 1;
  min-width: 0;

  .student-name {
    font-weight: 500;
    color: #303133;
  }

  .student-no {
    font-size: 12px;
    color: #909399;
  }
}

.student-snapshot {
  margin-top: 16px;
  background-color: #fafafa;
  border: none;

  .snapshot-title {
    font-weight: 600;
  }

  .snapshot-header {
    display: flex;
    align-items: center;
    gap: 12px;

    .snapshot-avatar {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
    }

    h4 {
      margin: 0 0 4px 0;
      font-size: 16px;
    }

    p {
      margin: 0;
      font-size: 12px;
      color: #909399;
    }
  }

  .snapshot-stats {
    display: flex;
    justify-content: space-around;

    .stat-item {
      text-align: center;

      .stat-value {
        font-size: 24px;
        font-weight: 700;
        color: #409EFF;
      }

      .stat-label {
        font-size: 12px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }
}

.problem-input-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.problem-textarea {
  :deep(.el-textarea__inner) {
    resize: none;
  }
}

.upload-section {
  margin-top: 16px;

  .upload-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    color: #606266;
    margin-bottom: 10px;
  }
}

.uploader {
  :deep(.el-upload--picture-card) {
    width: 80px;
    height: 80px;
    line-height: 80px;
  }
}

.upload-icon {
  font-size: 24px;
  color: #8c939d;
}

.history-quick {
  margin-top: 12px;
  text-align: right;
}

.generate-btn {
  margin-top: auto;
  padding: 14px 32px;
  font-size: 16px;
  font-weight: 600;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;

  &:hover {
    background: linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%);
  }
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 20px;
  color: #909399;

  .empty-icon-wrapper {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(135deg, #ecf5ff 0%, #f0f0ff 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
  }

  .empty-icon {
    color: #409EFF;
  }

  h3 {
    margin: 0 0 10px 0;
    font-size: 18px;
    color: #606266;
  }

  p {
    margin: 0 0 20px 0;
  }
}

.feature-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
  max-width: 300px;

  .feature-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    background-color: #f5f7fa;
    border-radius: 8px;
    font-size: 13px;
    color: #606266;

    el-icon {
      color: #409EFF;
    }
  }
}

.generating-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;

  .generating-animation {
    text-align: center;

    h3 {
      margin: 20px 0 10px 0;
      color: #303133;
    }

    .generating-tip {
      color: #909399;
      font-size: 14px;
    }
  }

  .circle-loading {
    color: #409EFF;
  }
}

.plan-content {
  flex: 1;
  overflow-y: auto;
  padding-right: 8px;
}

.plan-title {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;

  h2 {
    margin: 0 0 8px 0;
    font-size: 20px;
    color: #303133;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .plan-subtitle {
    margin: 0;
    font-size: 12px;
    color: #909399;
  }
}

.dimension-cards {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dimension-card {
  background: #fff;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 16px;
  transition: all 0.3s;
  animation: fadeInUp 0.5s ease forwards;
  opacity: 0;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dim-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.dim-icon {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;

  &.dim-icon-red { background: linear-gradient(135deg, #ff6b6b 0%, #f5576c 100%); }
  &.dim-icon-orange { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
  &.dim-icon-blue { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
  &.dim-icon-green { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
  &.dim-icon-purple { background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); }
  &.dim-icon-cyan { background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%); }
}

.dim-title {
  h4 {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;
  }
}

.dim-content {
  color: #606266;
  line-height: 1.8;
  font-size: 14px;

  ul, ol {
    padding-left: 20px;
    margin: 8px 0;
  }

  li {
    margin-bottom: 6px;
  }

  strong {
    color: #303133;
  }

  em {
    color: #909399;
    font-size: 13px;
  }
}

.risk-list {
  margin: 10px 0;

  .risk-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    margin-bottom: 6px;
    border-radius: 6px;
    font-size: 13px;

    &.high {
      background-color: #fef0f0;
      color: #F56C6C;
    }

    &.medium {
      background-color: #fdf6ec;
      color: #E6A23C;
    }

    &.low {
      background-color: #ecf5ff;
      color: #409EFF;
    }
  }

  .risk-tag {
    font-size: 11px;
    padding: 2px 8px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.1);
    font-weight: 600;
  }
}

.obs-table {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0;
  font-size: 13px;

  th, td {
    border: 1px solid #ebeef5;
    padding: 8px 12px;
    text-align: left;
  }

  th {
    background-color: #f5f7fa;
    font-weight: 600;
  }
}

.feedback-section {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;

  .feedback-content {
    display: flex;
    flex-direction: column;
    gap: 12px;

    .feedback-label {
      font-size: 14px;
      color: #606266;
    }
  }
}

.general-chat-layout {
  display: flex;
  gap: 16px;
  height: 600px;
}

.chat-sidebar {
  width: 240px;
  background-color: #fafafa;
  border-radius: 8px;
  display: flex;
  flex-direction: column;

  .sidebar-header {
    padding: 12px;
    border-bottom: 1px solid #ebeef5;
  }

  .new-chat-btn {
    width: 100%;
  }
}

.chat-history-list {
  flex: 1;
  padding: 8px;

  .history-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    color: #606266;

    &:hover {
      background-color: #ebeef5;
    }

    &.active {
      background-color: #ecf5ff;
      color: #409EFF;
    }

    .history-title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }
}

.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
  border: 1px solid #ebeef5;
  border-radius: 8px;

  .chat-header {
    padding: 12px 16px;
    border-bottom: 1px solid #ebeef5;
    font-weight: 600;
    color: #303133;
  }

  .chat-messages {
    flex: 1;
    padding: 16px;
  }
}

.general-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
  text-align: center;

  el-icon {
    font-size: 48px;
    margin-bottom: 12px;
    color: #c0c4cc;
  }

  p {
    margin: 0;
  }
}

.msg-item {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;

  &.user {
    flex-direction: row-reverse;

    .msg-bubble {
      background-color: #409EFF;
      color: #fff;
      border-radius: 12px 4px 12px 12px;
    }
  }

  &.assistant {
    .msg-bubble {
      background-color: #f5f7fa;
      color: #303133;
      border-radius: 4px 12px 12px 12px;
    }
  }
}

.msg-bubble {
  max-width: 70%;
  padding: 12px 16px;
  line-height: 1.6;

  ul, ol {
    padding-left: 20px;
    margin: 8px 0;
  }

  p {
    margin: 0 0 8px 0;

    &:last-child {
      margin-bottom: 0;
    }
  }
}

.typing-dots {
  display: flex;
  gap: 4px;
  padding: 4px 0;

  span {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: #c0c4cc;
    animation: bounce 1.4s infinite;

    &:nth-child(2) { animation-delay: 0.2s; }
    &:nth-child(3) { animation-delay: 0.4s; }
  }
}

@keyframes bounce {
  0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
  30% { transform: translateY(-6px); opacity: 1; }
}

.chat-input-area {
  padding: 12px 16px;
  border-top: 1px solid #ebeef5;

  .input-actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;

    .tip {
      font-size: 12px;
      color: #909399;
    }
  }
}

.class-analysis-layout {
  min-height: 600px;
}

.analysis-controls {
  margin-bottom: 20px;
  padding: 16px;
  background-color: #fafafa;
  border-radius: 8px;
}

.empty-class-analysis, .analyzing-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  text-align: center;
  color: #909399;

  .empty-icon {
    font-size: 64px;
    margin-bottom: 16px;
    color: #c0c4cc;
  }

  h3 {
    margin: 0 0 10px 0;
    color: #606266;
  }

  p {
    margin: 0;
  }
}

.analyzing-state {
  color: #409EFF;
}

.class-report {
  .report-header {
    text-align: center;
    margin-bottom: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid #ebeef5;

    h2 {
      margin: 0 0 8px 0;
      font-size: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    p {
      margin: 0 0 12px 0;
      color: #909399;
    }
  }

  .overview-section {
    margin-bottom: 20px;
  }

  .overview-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 20px;
    background-color: #fff;
    border: 1px solid #ebeef5;
    border-radius: 12px;
  }

  .overview-icon {
    width: 50px;
    height: 50px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;

    &.blue { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
    &.green { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
    &.orange { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
    &.purple { background: linear-gradient(135deg, #a855f7 0%, #7c3aed 100%); }
  }

  .overview-info {
    .overview-value {
      font-size: 28px;
      font-weight: 700;
      color: #303133;
      line-height: 1.2;
    }

    .overview-label {
      font-size: 13px;
      color: #909399;
      margin-top: 4px;
    }
  }
}

.report-section {
  margin-bottom: 20px;
  border: none;
  background-color: #fafafa;

  .section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 15px;
    color: #303133;
  }
}

.problem-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;

  .problem-tag {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    font-size: 14px;

    .problem-count {
      margin-left: 6px;
      padding-left: 10px;
      border-left: 1px solid rgba(255, 255, 255, 0.3);
      opacity: 0.9;
    }
  }
}

.problem-details {
  .problem-detail-item {
    padding: 12px 16px;
    background-color: #fff;
    border-radius: 8px;
    margin-bottom: 10px;

    h4 {
      margin: 0 0 6px 0;
      font-size: 14px;
      color: #303133;
    }

    p {
      margin: 0;
      font-size: 13px;
      color: #606266;
      line-height: 1.6;
    }
  }
}

.suggestion-list {
  .suggestion-item {
    display: flex;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid #ebeef5;

    &:last-child {
      border-bottom: none;
    }

    .suggestion-num {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
    }

    p {
      margin: 0;
      line-height: 1.6;
      color: #606266;
      font-size: 14px;
    }
  }
}

.history-section {
  .history-filters {
    margin-bottom: 16px;
    padding: 16px;
    background-color: #fafafa;
    border-radius: 8px;
  }

  .hist-student {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
}
</style>
