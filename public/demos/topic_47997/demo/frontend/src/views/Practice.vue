<template>
  <div class="practice-container">
    <div class="practice-header">
      <div class="header-content">
        <div class="title-section">
          <el-icon class="title-icon"><Trophy /></el-icon>
          <h1 class="page-title">日常练习</h1>
          <el-tag v-if="practiceStarted" type="success" class="status-tag">
            练习中
          </el-tag>
          <el-tag v-else type="info" class="status-tag">
            未开始
          </el-tag>
        </div>
        <div class="action-buttons">
          <el-button
            v-if="!practiceStarted"
            type="primary"
            @click="startPractice"
            :loading="starting"
          >
            <el-icon><VideoPlay /></el-icon>
            开始练习
          </el-button>
          <template v-else>
            <el-button
              type="warning"
              plain
              @click="restartPractice"
              :loading="restarting"
            >
              <el-icon><Refresh /></el-icon>
              重新开始
            </el-button>
            <el-button
              type="danger"
              @click="endPractice"
              :loading="ending"
            >
              <el-icon><CircleClose /></el-icon>
              结束练习
            </el-button>
          </template>
        </div>
      </div>
    </div>

    <div v-if="!practiceStarted" class="welcome-section">
      <div class="welcome-card">
        <el-icon class="welcome-icon"><Trophy /></el-icon>
        <h2 class="welcome-title">医疗问诊技能练习</h2>
        <p class="welcome-description">
          通过与虚拟患者的对话练习，提升您的问诊技能。系统将实时评估您的表现，
          包括问候礼仪、症状询问、病史采集、诊断准确性和治疗方案等多个维度。
        </p>
        <div class="practice-features">
          <div class="feature-item">
            <el-icon><User /></el-icon>
            <span>真实患者模拟</span>
          </div>
          <div class="feature-item">
            <el-icon><DataAnalysis /></el-icon>
            <span>实时评分反馈</span>
          </div>
          <div class="feature-item">
            <el-icon><TrendCharts /></el-icon>
            <span>详细分析报告</span>
          </div>
          <div class="feature-item">
            <el-icon><Medal /></el-icon>
            <span>技能提升建议</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="practice-content">
      <!-- 左侧：患者信息和评分 -->
      <div class="left-panel">
        <!-- 患者信息卡片 -->
        <el-card class="patient-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><User /></el-icon>
              <span>患者信息</span>
              <el-button
                text
                type="primary"
                @click="showPatientDetails = !showPatientDetails"
              >
                {{ showPatientDetails ? '收起' : '详情' }}
              </el-button>
            </div>
          </template>
          <div class="patient-info">
            <div class="basic-info">
              <div class="info-item">
                <span class="label">姓名：</span>
                <span class="value">{{ patientProfile?.basic_info?.姓名 }}</span>
              </div>
              <div class="info-item">
                <span class="label">年龄：</span>
                <span class="value">{{ patientProfile?.basic_info?.年龄 }}岁</span>
              </div>
              <div class="info-item">
                <span class="label">性别：</span>
                <span class="value">{{ patientProfile?.basic_info?.性别 }}</span>
              </div>
              <div class="info-item">
                <span class="label">人格：</span>
                <span class="value">{{ patientPersonality?.description }}</span>
              </div>
            </div>
            
            <el-collapse-transition>
              <div v-show="showPatientDetails" class="detailed-info">
                <el-divider />
                <div class="info-section">
                  <h4>主要症状</h4>
                  <ul>
                    <li v-for="symptom in patientProfile?.symptoms?.主要症状" :key="symptom">
                      {{ symptom }}
                    </li>
                  </ul>
                </div>
                <div class="info-section">
                  <h4>病程</h4>
                  <p>{{ patientProfile?.course }}</p>
                </div>
                <div class="info-section" v-if="patientProfile?.history?.length">
                  <h4>既往史</h4>
                  <ul>
                    <li v-for="history in patientProfile?.history" :key="history">
                      {{ history }}
                    </li>
                  </ul>
                </div>
              </div>
            </el-collapse-transition>
          </div>
        </el-card>

        <!-- 实时评分卡片 -->
        <el-card class="score-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon><TrendCharts /></el-icon>
              <span>实时评分</span>
            </div>
          </template>
          <div class="score-content">
            <div class="current-score">
              <div class="score-number">{{ displayScore.toFixed(1) }}</div>
              <div class="score-label">当前得分</div>
            </div>
            <div class="score-progress-bar">
              <div
                class="score-progress-fill"
                :style="{ width: displayScore + '%', background: getScoreColor(displayScore) }"
              ></div>
            </div>
            <div class="score-levels">
              <div class="level-item">
                <span class="level-dot excellent"></span>
                <span>优秀 (90+)</span>
              </div>
              <div class="level-item">
                <span class="level-dot good"></span>
                <span>良好 (70-89)</span>
              </div>
              <div class="level-item">
                <span class="level-dot pass"></span>
                <span>及格 (60-69)</span>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 右侧：聊天区域 -->
      <div class="chat-panel">
        <div class="chat-container">
          <div class="chat-messages" ref="messagesContainer">
            <div v-if="chatMessages.length === 0" class="empty-state">
              <el-icon class="empty-icon"><ChatDotRound /></el-icon>
              <p class="empty-text">开始与患者对话</p>
              <p class="empty-subtitle">请先向患者问好，建立良好的医患关系</p>
            </div>
            
            <div
              v-for="(message, index) in chatMessages"
              :key="index"
              class="message-item"
              :class="message.role"
            >
              <div class="message-avatar">
                <el-avatar :size="40">
                  <el-icon v-if="message.role === 'user'">
                    <Monitor />
                  </el-icon>
                  <el-icon v-else>
                    <User />
                  </el-icon>
                </el-avatar>
              </div>
              <div class="message-content">
                <div class="message-header">
                  <span class="message-sender">
                    {{ message.role === 'user' ? '医生' : '患者' }}
                  </span>
                  <span class="message-time">{{ formatTime(message.timestamp) }}</span>
                </div>
                <div class="message-text">{{ message.content }}</div>
                <div v-if="message.feedback" class="message-feedback">
                  <el-tag size="small" type="success">
                    <el-icon><Trophy /></el-icon>
                    {{ message.feedback }}
                  </el-tag>
                </div>
              </div>
            </div>
            
            <!-- 加载状态 -->
            <div v-if="chatLoading" class="message-item assistant">
              <div class="message-avatar">
                <el-avatar :size="40">
                  <el-icon><User /></el-icon>
                </el-avatar>
              </div>
              <div class="message-content">
                <div class="message-header">
                  <span class="message-sender">患者</span>
                </div>
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>

          <!-- 输入区域 -->
          <div class="chat-input">
            <div class="input-container">
              <el-input
                v-model="currentInput"
                type="textarea"
                :rows="3"
                placeholder="请输入您的问诊内容..."
                class="message-input"
                @keydown.ctrl.enter="sendMessage"
                :disabled="chatLoading"
              />
              <div class="input-actions">
                <div class="input-options">
                  <el-checkbox v-model="isGreeting" :disabled="chatMessages.length > 0">
                    这是问候语
                  </el-checkbox>
                </div>
                <el-button
                  type="primary"
                  @click="sendMessage"
                  :loading="chatLoading"
                  :disabled="!currentInput.trim()"
                  class="send-button"
                >
                  <el-icon><Promotion /></el-icon>
                  发送
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表对话框 -->
    <el-dialog
      v-model="showCharts"
      title="练习分析"
      width="80%"
      :before-close="handleCloseCharts"
    >
      <div class="charts-container">
        <div class="chart-item">
          <h3>得分趋势</h3>
          <div id="scoreChart" style="height: 300px;"></div>
        </div>
        <div class="chart-item">
          <h3>能力分布</h3>
          <div id="distributionChart" style="height: 300px;"></div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick, watch, computed } from 'vue'
import axios from 'axios'
import { ElMessage, ElMessageBox } from 'element-plus'
import Plotly from 'plotly.js-dist'
import {
  Trophy,
  VideoPlay,
  Refresh,
  CircleClose,
  User,
  DataAnalysis,
  TrendCharts,
  Medal,
  ChatDotRound,
  Monitor,
  Promotion
} from '@element-plus/icons-vue'

const practiceStarted = ref(false)
const starting = ref(false)
const restarting = ref(false)
const ending = ref(false)
const chatLoading = ref(false)

const patientProfile = ref(null)
const patientPersonality = ref(null)
const emotionState = ref(null)
const currentScore = ref(0)
const lastFeedback = ref('')

// 计算属性确保实时评分同步更新
const displayScore = computed(() => currentScore.value)

const showPatientDetails = ref(false)
const showCharts = ref(false)
const isGreeting = ref(false)

const chatMessages = ref([])
const currentInput = ref('')
const messagesContainer = ref()

// 开始练习
const startPractice = async () => {
  starting.value = true
  
  try {
    const response = await axios.post('/api/practice/start', {}, {
      withCredentials: true
    })
    
    if (response.data.success) {
      practiceStarted.value = true
      patientProfile.value = response.data.patient_profile
      patientPersonality.value = response.data.patient_personality
      emotionState.value = response.data.emotion_state
      currentScore.value = response.data.current_score
      
      chatMessages.value = []
      isGreeting.value = true
      
      ElMessage.success('练习已开始，请开始与患者对话')
    } else {
      ElMessage.error(response.data.message || '开始练习失败')
    }
  } catch (error) {
    ElMessage.error('网络错误，请稍后重试')
    console.error('开始练习失败:', error)
  } finally {
    starting.value = false
  }
}

// 重新开始练习
const restartPractice = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重新开始练习吗？当前进度将会丢失。',
      '确认重新开始',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    restarting.value = true
    await startPractice()
  } catch {
    // 用户取消
  } finally {
    restarting.value = false
  }
}

// 结束练习
const endPractice = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要结束练习吗？',
      '确认结束',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    ending.value = true
    
    const response = await axios.post('/api/practice/end', {}, {
      withCredentials: true
    })
    
    if (response.data.success) {
      // 显示最终结果
      await showFinalResults(response.data)
      
      // 重置状态
      practiceStarted.value = false
      patientProfile.value = null
      patientPersonality.value = null
      emotionState.value = null
      currentScore.value = 0
      chatMessages.value = []
      lastFeedback.value = ''
      
      ElMessage.success('练习已结束')
    } else {
      ElMessage.error(response.data.message || '结束练习失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('结束练习失败')
      console.error('结束练习失败:', error)
    }
  } finally {
    ending.value = false
  }
}

// 发送消息
const sendMessage = async () => {
  if (!currentInput.value.trim() || chatLoading.value) return
  
  const userMessage = {
    role: 'user',
    content: currentInput.value.trim(),
    timestamp: new Date().toISOString()
  }
  
  chatMessages.value.push(userMessage)
  const input = currentInput.value.trim()
  const greeting = isGreeting.value
  currentInput.value = ''
  isGreeting.value = false
  
  await nextTick()
  scrollToBottom()
  
  chatLoading.value = true
  
  try {
    const response = await axios.post('/api/practice/chat', {
      input,
      is_greeting: greeting
    }, {
      withCredentials: true
    })
    
    if (response.data.success) {
      const patientMessage = {
        role: 'assistant',
        content: response.data.patient_response,
        timestamp: new Date().toISOString()
      }
      
      // 添加反馈到医生消息
      if (response.data.feedback && response.data.feedback !== '无新得分项') {
        userMessage.feedback = response.data.feedback
        lastFeedback.value = response.data.feedback
      }
      
      chatMessages.value.push(patientMessage)
      
      // 更新状态
      const receivedScore = response.data.current_score
      console.log(`[SCORE-DEBUG] 收到后端得分: ${receivedScore}, 前端当前得分: ${currentScore.value}`)
      currentScore.value = receivedScore
      console.log(`[SCORE-DEBUG] 更新后前端得分: ${currentScore.value}, displayScore: ${displayScore.value}`)
      emotionState.value = response.data.emotion_state
      
      await nextTick()
      scrollToBottom()
    } else {
      ElMessage.error(response.data.message || '发送失败')
    }
  } catch (error) {
    ElMessage.error('网络错误，请稍后重试')
    console.error('发送消息失败:', error)
  } finally {
    chatLoading.value = false
  }
}

// 显示最终结果
const showFinalResults = async (data) => {
  const finalScore = data.final_score
  const level = getScoreLevel(finalScore)
  
  await ElMessageBox.alert(
    `本次练习得分：${finalScore.toFixed(1)}分\n评级：${level}\n\n感谢您的练习！`,
    '练习结果',
    {
      confirmButtonText: '查看详细分析',
      type: 'success'
    }
  )
  
  // 使用 end 接口返回的图表数据直接渲染
  await renderCharts(data)
  showCharts.value = true
}

// 渲染图表（接收图表数据）
const renderCharts = async (chartData) => {
  try {
    await nextTick()
    
    const scoreChartElement = document.getElementById('scoreChart')
    const distributionChartElement = document.getElementById('distributionChart')
    
    if (!scoreChartElement || !distributionChartElement) {
      console.error('图表容器元素未找到')
      return
    }
    
    if (chartData.score_chart) {
      try {
        const scoreData = JSON.parse(chartData.score_chart)
        await Plotly.newPlot('scoreChart', scoreData.data, scoreData.layout, {responsive: true})
      } catch (e) {
        console.error('渲染得分趋势图失败:', e)
      }
    }
    
    if (chartData.distribution_chart) {
      try {
        const distributionData = JSON.parse(chartData.distribution_chart)
        await Plotly.newPlot('distributionChart', distributionData.data, distributionData.layout, {responsive: true})
      } catch (e) {
        console.error('渲染能力分布图失败:', e)
      }
    }
  } catch (error) {
    console.error('渲染图表失败:', error)
    ElMessage.error('加载图表失败，请稍后重试')
  }
}

// 关闭图表对话框
const handleCloseCharts = () => {
  showCharts.value = false
  // 清理 Plotly 图表
  const scoreChartEl = document.getElementById('scoreChart')
  const distributionChartEl = document.getElementById('distributionChart')
  if (scoreChartEl) Plotly.purge(scoreChartEl)
  if (distributionChartEl) Plotly.purge(distributionChartEl)
}

// 滚动到底部
const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// 格式化时间
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 获取分数颜色
const getScoreColor = (score) => {
  if (score >= 90) return '#67c23a'
  if (score >= 70) return '#e6a23c'
  if (score >= 60) return '#f56c6c'
  return '#909399'
}

// 获取分数等级
const getScoreLevel = (score) => {
  if (score >= 90) return '优秀'
  if (score >= 70) return '良好'
  if (score >= 60) return '及格'
  return '不及格'
}
</script>

<style scoped>
.practice-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.practice-header {
  background: linear-gradient(135deg, #2c5aa0 0%, #1e3d72 100%);
  color: white;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(44, 90, 160, 0.15);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-icon {
  font-size: 28px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  margin: 0;
}

.status-tag {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.welcome-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
}

.welcome-card {
  text-align: center;
  max-width: 600px;
}

.welcome-icon {
  font-size: 80px;
  color: #f093fb;
  margin-bottom: 24px;
}

.welcome-title {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
}

.welcome-description {
  font-size: 16px;
  color: #606266;
  line-height: 1.6;
  margin: 0 0 40px 0;
}

.practice-features {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 12px;
  color: #606266;
  font-weight: 500;
}

.feature-item .el-icon {
  font-size: 24px;
  color: #f093fb;
}

.practice-content {
  flex: 1;
  display: flex;
  min-height: 0;
  gap: 24px;
  padding: 24px;
}

.left-panel {
  width: 350px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.patient-card,
.score-card {
  flex-shrink: 0;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
  color: #303133;
}

.card-header .el-icon {
  margin-right: 8px;
}

.patient-info .basic-info {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-item .label {
  font-size: 12px;
  color: #909399;
}

.info-item .value {
  font-weight: 500;
  color: #303133;
}

.detailed-info {
  margin-top: 16px;
}

.info-section {
  margin-bottom: 16px;
}

.info-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 8px 0;
}

.info-section ul {
  margin: 0;
  padding-left: 16px;
  color: #606266;
}

.info-section li {
  margin-bottom: 4px;
}

.score-content {
  text-align: center;
}

.current-score {
  margin-bottom: 20px;
}

.score-number {
  font-size: 36px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.score-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.score-progress-bar {
  height: 8px;
  background: #ebeef5;
  border-radius: 4px;
  margin-bottom: 16px;
  overflow: hidden;
}

.score-progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease, background 0.3s ease;
}

.score-levels {
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}

.level-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #606266;
}

.level-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.level-dot.excellent {
  background: #67c23a;
}

.level-dot.good {
  background: #e6a23c;
}

.level-dot.pass {
  background: #f56c6c;
}

.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #909399;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  color: #c0c4cc;
}

.empty-text {
  font-size: 18px;
  font-weight: 500;
  margin: 0 0 8px 0;
}

.empty-subtitle {
  font-size: 14px;
  margin: 0;
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  animation: fadeIn 0.3s ease-out;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-item.user .message-content {
  background: linear-gradient(135deg, #2c5aa0 0%, #1e3d72 100%);
  color: white;
}

.message-item.user .message-header .message-sender {
  color: white;
}

.message-item.user .message-header .message-time {
  color: rgba(255, 255, 255, 0.8);
}

.message-item.user .message-text {
  color: white;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-avatar {
  flex-shrink: 0;
}

.message-content {
  max-width: 70%;
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.message-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.message-sender {
  font-weight: 600;
  font-size: 13px;
  color: #303133;
}

.message-time {
  font-size: 11px;
  color: #909399;
}

.message-text {
  line-height: 1.5;
  color: #606266;
  font-size: 14px;
}

.message-feedback {
  margin-top: 8px;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
  padding: 8px 0;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #c0c4cc;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-8px);
  }
}

.chat-input {
  border-top: 1px solid #ebeef5;
  background: white;
  padding: 16px 20px;
}

.input-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.message-input {
  resize: none;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.send-button {
  background: linear-gradient(135deg, #2c5aa0 0%, #1e3d72 100%);
  border: none;
}

.charts-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.chart-item h3 {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
  text-align: center;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .left-panel {
    width: 300px;
  }
}

@media (max-width: 768px) {
  .practice-content {
    flex-direction: column;
  }
  
  .left-panel {
    width: 100%;
  }
  
  .practice-features {
    grid-template-columns: 1fr;
  }
  
  .charts-container {
    grid-template-columns: 1fr;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
}
</style>