<template>
  <div class="workbench-page">
    <div class="page-card">
      <div class="page-header">
        <h2 class="page-title">👨‍⚕️ 医生工作台</h2>
      </div>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="待接诊" name="WAITING" />
        <el-tab-pane label="进行中" name="IN_PROGRESS" />
        <el-tab-pane label="历史会话" name="CLOSED" />
      </el-tabs>

      <el-table v-loading="loading" :data="filteredRecords" stripe>
        <el-table-column label="患者" prop="userName" min-width="100" />
        <el-table-column label="类型" min-width="80">
          <template #default="{ row }">
            {{ row.type === 'REALTIME' ? '实时' : '异步' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="主诉" prop="chiefComplaint" min-width="160" show-overflow-tooltip />
        <el-table-column label="症状描述" prop="symptomDesc" min-width="160" show-overflow-tooltip />
        <el-table-column label="创建时间" min-width="150">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openMessages(row)">
              查看消息
            </el-button>
            <el-button
              v-if="row.type === 'REALTIME' && row.status === 'IN_PROGRESS'"
              link
              type="success"
              size="small"
              @click="goChat(row.id)"
            >
              进入聊天
            </el-button>
            <el-button
              v-if="row.status !== 'CLOSED'"
              link
              type="warning"
              size="small"
              @click="openReply(row)"
            >
              回复
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="loadList"
          @size-change="loadList"
        />
      </div>
    </div>

    <!-- 消息查看弹窗 -->
    <el-dialog v-model="messagesVisible" title="问诊消息" width="640px">
      <div class="message-list">
        <div
          v-for="message in messageList"
          :key="message.id"
          class="message"
          :class="message.senderType === 'DOCTOR' ? 'message-self' : 'message-other'"
        >
          <div class="message-sender">{{ message.senderName }}（{{ senderText(message.senderType) }}）</div>
          <div class="message-content">{{ message.content }}</div>
          <div class="message-time">{{ formatTime(message.sentAt) }}</div>
        </div>
        <div v-if="messageList.length === 0" class="empty-message">暂无消息</div>
      </div>
    </el-dialog>

    <!-- 回复弹窗 -->
    <el-dialog v-model="replyVisible" title="回复患者" width="520px">
      <el-form label-position="top">
        <el-form-item label="回复内容">
          <el-input
            v-model="replyContent"
            type="textarea"
            :rows="4"
            placeholder="请输入回复内容"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="replyVisible = false">取消</el-button>
        <el-button type="primary" :loading="replying" @click="handleReply">发送回复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  getDoctorConsultations,
  getMessages,
  replyAsync,
  sendMessage,
  type ConsultationVO,
  type MessageVO,
  type ConsultationStatus
} from '@/api/consultation'
import logger from '@/utils/logger'

const router = useRouter()

const loading = ref(false)
const records = ref<ConsultationVO[]>([])
const page = ref(1)
const size = ref(10)
const total = ref(0)

const activeTab = ref<'WAITING' | 'IN_PROGRESS' | 'CLOSED'>('WAITING')

// 消息查看弹窗
const messagesVisible = ref(false)
const messageList = ref<MessageVO[]>([])

// 回复弹窗
const replyVisible = ref(false)
const replyContent = ref('')
// 当前操作的问诊，null 表示未选择
const currentConsultation = ref<ConsultationVO | null>(null)
const replying = ref(false)

// 按当前 Tab 状态过滤（后端返回全部，前端按状态分组展示）
const filteredRecords = computed(() => {
  return records.value.filter((item) => item.status === activeTab.value)
})

// 状态文案
const statusText = (status: ConsultationStatus): string => {
  const textMap: Record<ConsultationStatus, string> = {
    WAITING: '等待中',
    IN_PROGRESS: '进行中',
    CLOSED: '已关闭'
  }
  return textMap[status]
}

// 状态标签类型
const statusTagType = (status: ConsultationStatus): 'info' | 'warning' | 'success' => {
  const typeMap: Record<ConsultationStatus, 'info' | 'warning' | 'success'> = {
    WAITING: 'warning',
    IN_PROGRESS: 'success',
    CLOSED: 'info'
  }
  return typeMap[status]
}

// 发送者类型文案
const senderText = (senderType: string): string => {
  return senderType === 'DOCTOR' ? '医生' : '患者'
}

// 格式化时间
const formatTime = (iso: string): string => {
  if (!iso) {
    return '-'
  }
  return iso.replace('T', ' ').substring(0, 16)
}

// 加载接诊列表
const loadList = async (): Promise<void> => {
  loading.value = true
  try {
    const result = await getDoctorConsultations(page.value, size.value)
    records.value = result.records
    total.value = Number(result.total)
  } catch (e) {
    logger.error('加载接诊列表失败', e)
  } finally {
    loading.value = false
  }
}

// Tab 切换
const handleTabChange = (): void => {
  // 数据已在前端过滤，无需重新请求
}

// 查看消息
const openMessages = async (consultation: ConsultationVO): Promise<void> => {
  messagesVisible.value = true
  messageList.value = []
  try {
    messageList.value = await getMessages(consultation.id)
  } catch (e) {
    logger.error('加载问诊消息失败', e)
    ElMessage.error('消息加载失败')
  }
}

// 进入实时聊天
const goChat = (consultationId: number): void => {
  router.push(`/consultation/chat/${consultationId}`)
}

// 打开回复弹窗
const openReply = (consultation: ConsultationVO): void => {
  currentConsultation.value = consultation
  replyContent.value = ''
  replyVisible.value = true
}

// 发送回复
const handleReply = async (): Promise<void> => {
  const content = replyContent.value.trim()
  if (!content) {
    ElMessage.error('请输入回复内容')
    return
  }
  if (!currentConsultation.value) {
    return
  }

  replying.value = true
  try {
    const consultation = currentConsultation.value
    // 异步问诊使用 reply 接口；实时问诊使用 messages 接口
    if (consultation.type === 'ASYNC') {
      await replyAsync({ consultationId: consultation.id, content })
    } else {
      await sendMessage({
        consultationId: consultation.id,
        contentType: 'TEXT',
        content
      })
    }
    ElMessage.success('回复已发送')
    replyVisible.value = false
  } catch (e) {
    logger.error('回复失败', e)
  } finally {
    replying.value = false
  }
}

onMounted(() => {
  loadList()
})
</script>

<style scoped lang="scss">
.workbench-page {
  max-width: 1200px;
  padding: 24px 32px 48px;
  margin: 0 auto;
}

.page-card {
  padding: 24px 28px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
}

.page-header {
  margin-bottom: 16px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.message-list {
  max-height: 480px;
  overflow-y: auto;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 8px;
}

.message {
  max-width: 80%;
  margin-bottom: 12px;
  padding: 10px 14px;
  border-radius: 14px;
}

/* 医生自己发送的消息：右侧 */
.message-self {
  margin-left: auto;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

/* 患者发来的消息：左侧 */
.message-other {
  margin-right: auto;
  background: #ffffff;
  color: #303133;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.message-sender {
  margin-bottom: 4px;
  font-size: 12px;
  opacity: 0.8;
}

.message-content {
  font-size: 14px;
  line-height: 1.5;
}

.message-time {
  margin-top: 4px;
  font-size: 11px;
  opacity: 0.7;
}

.empty-message {
  padding: 24px 0;
  font-size: 14px;
  color: #909399;
  text-align: center;
}
</style>
