<template>
  <div class="async-consult-page">
    <div class="page-card">
      <div class="page-header">
        <h2 class="page-title">异步问诊</h2>
        <el-button type="primary" @click="goDoctorList">发起问诊</el-button>
      </div>

      <!-- 我的问诊列表 -->
      <div class="list-section">
        <h3 class="section-title">我的问诊</h3>

        <el-table v-loading="loading" :data="records" stripe>
          <el-table-column label="医生" min-width="120">
            <template #default="{ row }">
              {{ row.doctorName }}（{{ row.doctorTitle }}）
            </template>
          </el-table-column>
          <el-table-column label="科室" prop="doctorDepartment" min-width="100" />
          <el-table-column label="类型" min-width="90">
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
          <el-table-column label="主诉" prop="chiefComplaint" min-width="180" show-overflow-tooltip />
          <el-table-column label="创建时间" min-width="150">
            <template #default="{ row }">
              {{ formatTime(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="140" fixed="right">
            <template #default="{ row }">
              <el-button
                v-if="row.type === 'REALTIME' && row.status !== 'CLOSED'"
                link
                type="primary"
                size="small"
                @click="goChat(row.id)"
              >
                进入聊天
              </el-button>
              <el-button
                link
                type="primary"
                size="small"
                @click="openMessages(row)"
              >
                查看消息
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
    </div>

    <!-- 消息查看弹窗 -->
    <el-dialog v-model="messagesVisible" title="问诊消息" width="600px">
      <div ref="messagesRef" class="message-list">
        <div
          v-for="message in messageList"
          :key="message.id"
          class="message"
          :class="message.senderType === 'USER' ? 'message-user' : 'message-doctor'"
        >
          <div class="message-sender">{{ message.senderName }}</div>
          <div class="message-content">{{ message.content }}</div>
          <div class="message-time">{{ formatTime(message.sentAt) }}</div>
        </div>
        <div v-if="messageList.length === 0" class="empty-message">暂无消息</div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  getMyConsultations,
  getMessages,
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

// 消息查看弹窗
const messagesVisible = ref(false)
const messageList = ref<MessageVO[]>([])
const messagesRef = ref<HTMLDivElement>()

// 状态文案
const statusText = (status: ConsultationStatus): string => {
  const textMap: Record<ConsultationStatus, string> = {
    WAITING: '等待中',
    IN_PROGRESS: '进行中',
    CLOSED: '已关闭'
  }
  return textMap[status]
}

// 状态对应的标签类型
const statusTagType = (status: ConsultationStatus): 'info' | 'warning' | 'success' | 'danger' => {
  const typeMap: Record<ConsultationStatus, 'info' | 'warning' | 'success' | 'danger'> = {
    WAITING: 'warning',
    IN_PROGRESS: 'success',
    CLOSED: 'info'
  }
  return typeMap[status]
}

// 格式化时间
const formatTime = (iso: string): string => {
  if (!iso) {
    return '-'
  }
  return iso.replace('T', ' ').substring(0, 16)
}

// 加载问诊列表
const loadList = async (): Promise<void> => {
  loading.value = true
  try {
    const result = await getMyConsultations(page.value, size.value)
    records.value = result.records
    total.value = Number(result.total)
  } catch (e) {
    logger.error('加载问诊列表失败', e)
  } finally {
    loading.value = false
  }
}

// 跳转医生列表发起问诊
const goDoctorList = (): void => {
  router.push('/consultation/doctors')
}

// 进入实时聊天
const goChat = (consultationId: number): void => {
  router.push(`/consultation/chat/${consultationId}`)
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

onMounted(() => {
  loadList()
})
</script>

<style scoped lang="scss">
.async-consult-page {
  max-width: 1100px;
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.section-title {
  margin-bottom: 12px;
  font-size: 16px;
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

.message-user {
  margin-left: auto;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #ffffff;
}

.message-doctor {
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
