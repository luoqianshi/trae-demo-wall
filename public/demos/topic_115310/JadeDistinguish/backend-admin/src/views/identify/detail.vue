<template>
  <div class="identify-detail" v-loading="loading">
    <el-page-header @back="goBack" title="返回列表" />
    
    <el-card v-if="record" class="detail-card">
      <el-row :gutter="20">
        <el-col :span="12">
          <h3>图像</h3>
          <el-image
            :src="record.image_url"
            style="width: 100%; max-height: 500px"
            fit="contain"
            :preview-src-list="[record.image_url]"
          />
        </el-col>
        <el-col :span="12">
          <h3>鉴别信息</h3>
          <el-descriptions :column="1" border>
            <el-descriptions-item label="记录 ID">{{ record.id }}</el-descriptions-item>
            <el-descriptions-item label="玉石品类">{{ record.jade_type }}</el-descriptions-item>
            <el-descriptions-item label="打光方式">
              {{ record.light_mode === 'side_45' ? '45度侧光' : '背面透光' }}
            </el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="getStatusType(record.status)">
                {{ getStatusText(record.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="鉴别结果" v-if="record.status === 'completed'">
              <el-tag :type="record.is_authentic ? 'success' : 'danger'" size="large">
                {{ record.is_authentic ? '真品' : '仿品' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="置信度" v-if="record.confidence">
              {{ (record.confidence * 100).toFixed(1) }}%
            </el-descriptions-item>
            <el-descriptions-item label="创建时间">
              {{ formatDate(record.created_at) }}
            </el-descriptions-item>
          </el-descriptions>
          
          <div v-if="record.features" class="section">
            <h4>特征分析</h4>
            <div class="content">{{ record.features }}</div>
          </div>
          
          <div v-if="record.suggestion" class="section">
            <h4>建议</h4>
            <div class="content">{{ record.suggestion }}</div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getIdentifyDetail, type IdentifyRecord } from '@/api/identify'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const record = ref<IdentifyRecord | null>(null)
const loading = ref(false)

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const getStatusType = (status: string) => {
  const map: Record<string, string> = {
    pending: 'info',
    processing: 'warning',
    completed: 'success',
    failed: 'danger'
  }
  return map[status] || 'info'
}

const getStatusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    failed: '失败'
  }
  return map[status] || status
}

const goBack = () => {
  router.push('/identify')
}

onMounted(async () => {
  const id = Number(route.params.id)
  if (!id) return
  
  loading.value = true
  try {
    record.value = await getIdentifyDetail(id)
  } catch (error) {
    console.error('获取详情失败', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.identify-detail {
  padding: 0;
}

.detail-card {
  margin-top: 20px;
}

h3 {
  margin-bottom: 15px;
  color: #333;
}

.section {
  margin-top: 20px;
}

.section h4 {
  margin-bottom: 10px;
  color: #666;
  font-size: 14px;
}

.content {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
  line-height: 1.6;
  white-space: pre-wrap;
  color: #606266;
}
</style>
