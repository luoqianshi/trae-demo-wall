<template>
  <div class="admin-dashboard">
    <div class="page-header"><h2>📊 平台数据概览</h2></div>
    <el-row :gutter="20" v-loading="loading">
      <el-col :span="6">
        <el-card class="stat-card"><div class="stat-value">{{ overview.userCount }}</div><div class="stat-label">总用户数</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card"><div class="stat-value">{{ overview.consultationCount }}</div><div class="stat-label">问诊总数</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card"><div class="stat-value">{{ overview.alertCount }}</div><div class="stat-label">告警总数</div></el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stat-card"><div class="stat-value">{{ overview.activeToday }}</div><div class="stat-label">今日活跃</div></el-card>
      </el-col>
    </el-row>
    <el-card style="margin-top: 20px">
      <template #header><span>指标异常分布</span></template>
      <el-table :data="alertDistribution" stripe>
        <el-table-column prop="metricName" label="指标名称" />
        <el-table-column prop="warningCount" label="预警次数" width="120" />
        <el-table-column prop="dangerCount" label="危险次数" width="120" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getStatsOverview, getAlertDistribution, type StatsOverview, type AlertDistribution } from '@/api/admin'
import logger from '@/utils/logger'

const loading = ref(false)
const overview = ref<StatsOverview>({ userCount: 0, consultationCount: 0, alertCount: 0, activeToday: 0 })
const alertDistribution = ref<AlertDistribution[]>([])

onMounted(async () => {
  loading.value = true
  try {
    const [ov, dist] = await Promise.all([getStatsOverview(), getAlertDistribution()])
    overview.value = ov
    alertDistribution.value = dist
  } catch (e) {
    logger.error('加载统计数据失败', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.admin-dashboard { padding: 20px; }
.page-header { margin-bottom: 20px; }
.stat-card { text-align: center; padding: 20px 0; }
.stat-value { font-size: 2.5em; font-weight: bold; color: #667eea; }
.stat-label { color: #666; margin-top: 8px; }
</style>
