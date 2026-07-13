<template>
  <div class="identify-list">
    <h2 class="page-title">鉴别记录</h2>
    
    <el-card>
      <el-table :data="records" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="图片" width="100">
          <template #default="{ row }">
            <el-image
              :src="row.image_url"
              style="width: 60px; height: 60px"
              fit="cover"
              :preview-src-list="[row.image_url]"
            />
          </template>
        </el-table-column>
        <el-table-column prop="jade_type" label="品类" width="120" />
        <el-table-column prop="light_mode" label="打光方式" width="120">
          <template #default="{ row }">
            {{ row.light_mode === 'side_45' ? '45度侧光' : '背面透光' }}
          </template>
        </el-table-column>
        <el-table-column label="结果" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.status === 'completed'" :type="row.is_authentic ? 'success' : 'danger'">
              {{ row.is_authentic ? '真品' : '仿品' }}
            </el-tag>
            <el-tag v-else-if="row.status === 'processing'" type="warning">处理中</el-tag>
            <el-tag v-else-if="row.status === 'failed'" type="info">失败</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="confidence" label="置信度" width="100">
          <template #default="{ row }">
            {{ row.confidence ? (row.confidence * 100).toFixed(1) + '%' : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="100">
          <template #default="{ row }">
            <el-button type="primary" link @click="goDetail(row.id)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getIdentifyRecords, type IdentifyRecord } from '@/api/identify'
import dayjs from 'dayjs'

const router = useRouter()
const records = ref<IdentifyRecord[]>([])
const loading = ref(false)

const formatDate = (date: string) => {
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss')
}

const goDetail = (id: number) => {
  router.push(`/identify/${id}`)
}

onMounted(async () => {
  loading.value = true
  try {
    records.value = await getIdentifyRecords({ limit: 50 })
  } catch (error) {
    console.error('获取记录失败', error)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.identify-list {
  padding: 0;
}

.page-title {
  margin-bottom: 20px;
  font-size: 20px;
  color: #333;
}
</style>
