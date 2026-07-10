<template>
  <div class="report-page">
    <div class="page-card">
      <div class="page-header">
        <h2 class="page-title">健康报告</h2>
        <el-button type="primary" @click="openGenerateDialog">生成报告</el-button>
      </div>

      <el-table v-loading="loading" :data="reports" stripe>
        <el-table-column label="报告类型" min-width="100">
          <template #default="{ row }">
            {{ reportTypeText(row.reportType) }}
          </template>
        </el-table-column>
        <el-table-column label="周期开始" prop="periodStart" min-width="120" />
        <el-table-column label="周期结束" prop="periodEnd" min-width="120" />
        <el-table-column label="生成时间" min-width="160">
          <template #default="{ row }">
            {{ formatTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleDownload(row)">
              下载PDF
            </el-button>
            <el-button link type="success" size="small" @click="openShareDialog(row)">
              分享
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="!loading && reports.length === 0" class="empty-tip">暂无健康报告</div>
    </div>

    <!-- 生成报告弹窗 -->
    <el-dialog v-model="generateVisible" title="生成健康报告" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="报告类型" prop="reportType">
          <el-select v-model="form.reportType" placeholder="请选择报告类型" class="full-width">
            <el-option label="周报" value="WEEKLY" />
            <el-option label="月报" value="MONTHLY" />
            <el-option label="自定义" value="CUSTOM" />
          </el-select>
        </el-form-item>
        <el-form-item label="周期开始日期" prop="periodStart">
          <el-date-picker
            v-model="form.periodStart"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择开始日期"
            class="full-width"
          />
        </el-form-item>
        <el-form-item label="周期结束日期" prop="periodEnd">
          <el-date-picker
            v-model="form.periodEnd"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择结束日期"
            class="full-width"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="generateVisible = false">取消</el-button>
        <el-button type="primary" :loading="generating" @click="handleGenerate">确认生成</el-button>
      </template>
    </el-dialog>

    <!-- 分享弹窗 -->
    <el-dialog v-model="shareVisible" title="分享报告" width="420px">
      <el-form label-position="top">
        <el-form-item label="目标家庭成员ID">
          <el-input v-model="shareTargetUserId" placeholder="请输入家庭成员的用户ID" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shareVisible = false">取消</el-button>
        <el-button type="primary" :loading="sharing" @click="handleShare">确认分享</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  getMyReports,
  generateReport,
  downloadReport,
  shareReport,
  type ReportVO,
  type ReportType
} from '@/api/report'
import logger from '@/utils/logger'

const loading = ref(false)
const generating = ref(false)
const sharing = ref(false)
const reports = ref<ReportVO[]>([])

const formRef = ref<FormInstance>()
const generateVisible = ref(false)
const shareVisible = ref(false)
const shareTargetUserId = ref('')

// 当前操作的报告，null 表示未选择
const currentReport = ref<ReportVO | null>(null)

const form = reactive({
  reportType: 'WEEKLY' as ReportType,
  periodStart: '',
  periodEnd: ''
})

const rules: FormRules = {
  reportType: [{ required: true, message: '请选择报告类型', trigger: 'change' }],
  periodStart: [{ required: true, message: '请选择开始日期', trigger: 'change' }],
  periodEnd: [{ required: true, message: '请选择结束日期', trigger: 'change' }]
}

// 报告类型文案
const reportTypeText = (type: ReportType): string => {
  const textMap: Record<ReportType, string> = {
    WEEKLY: '周报',
    MONTHLY: '月报',
    CUSTOM: '自定义'
  }
  return textMap[type] ?? type
}

// 格式化时间
const formatTime = (iso: string): string => {
  if (!iso) {
    return '-'
  }
  return iso.replace('T', ' ').substring(0, 16)
}

// 加载报告列表
const loadReports = async (): Promise<void> => {
  loading.value = true
  try {
    reports.value = await getMyReports()
  } catch (e) {
    logger.error('加载报告列表失败', e)
  } finally {
    loading.value = false
  }
}

// 打开生成报告弹窗
const openGenerateDialog = (): void => {
  form.reportType = 'WEEKLY'
  form.periodStart = ''
  form.periodEnd = ''
  generateVisible.value = true
}

// 确认生成
const handleGenerate = async (): Promise<void> => {
  if (!formRef.value) {
    return
  }
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  // 前后日期校验
  if (form.periodEnd < form.periodStart) {
    ElMessage.error('结束日期不能早于开始日期')
    return
  }

  generating.value = true
  try {
    await generateReport({
      reportType: form.reportType,
      periodStart: form.periodStart,
      periodEnd: form.periodEnd
    })
    ElMessage.success('报告生成成功')
    generateVisible.value = false
    await loadReports()
  } catch (e) {
    logger.error('生成报告失败', e)
  } finally {
    generating.value = false
  }
}

// 下载报告
const handleDownload = async (report: ReportVO): Promise<void> => {
  try {
    const blob = await downloadReport(report.id)
    // 触发浏览器下载
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `健康报告_${report.periodStart}_${report.periodEnd}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (e) {
    logger.error('下载报告失败', e)
    ElMessage.error('下载失败，请稍后重试')
  }
}

// 打开分享弹窗
const openShareDialog = (report: ReportVO): void => {
  currentReport.value = report
  shareTargetUserId.value = ''
  shareVisible.value = true
}

// 确认分享
const handleShare = async (): Promise<void> => {
  const targetId = Number(shareTargetUserId.value)
  if (!targetId) {
    ElMessage.error('请输入有效的家庭成员ID')
    return
  }
  if (!currentReport.value) {
    return
  }

  sharing.value = true
  try {
    await shareReport(currentReport.value.id, targetId)
    ElMessage.success('报告已分享')
    shareVisible.value = false
  } catch (e) {
    logger.error('分享报告失败', e)
  } finally {
    sharing.value = false
  }
}

onMounted(() => {
  loadReports()
})
</script>

<style scoped lang="scss">
.report-page {
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

.full-width {
  width: 100%;
}

.empty-tip {
  padding: 32px 0;
  font-size: 14px;
  color: #909399;
  text-align: center;
}
</style>
