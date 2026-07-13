<template>
  <div class="metric-config">
    <div class="page-header">
      <h2>⚙️ 指标体系配置</h2>
      <el-button type="primary" @click="openMetricDialog()">新增指标项</el-button>
    </div>

    <el-card>
      <el-table :data="metrics" v-loading="loading" stripe>
        <el-table-column prop="name" label="指标名称" width="120" />
        <el-table-column prop="unit" label="单位" width="80" />
        <el-table-column label="正常范围" width="120">
          <template #default="{ row }">{{ row.normalMin }} ~ {{ row.normalMax }}</template>
        </el-table-column>
        <el-table-column label="预警阈值" width="120">
          <template #default="{ row }">{{ row.warningMin }} ~ {{ row.warningMax }}</template>
        </el-table-column>
        <el-table-column label="危险阈值" width="120">
          <template #default="{ row }">{{ row.dangerMin }} ~ {{ row.dangerMax }}</template>
        </el-table-column>
        <el-table-column prop="applicableGender" label="适用性别" width="90" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.enabled === 1 ? 'success' : 'info'">{{ row.enabled === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="openMetricDialog(row)">编辑</el-button>
            <el-button size="small" :type="row.enabled === 1 ? 'warning' : 'success'" @click="handleToggle(row)">{{ row.enabled === 1 ? '停用' : '启用' }}</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="page"
        :page-size="size"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadMetrics"
        style="margin-top: 15px; justify-content: flex-end;"
      />
    </el-card>

    <!-- 指标编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingMetric.id ? '编辑指标' : '新增指标'" width="600px">
      <el-form :model="editingMetric" label-width="100px">
        <el-form-item label="指标名称"><el-input v-model="editingMetric.name" /></el-form-item>
        <el-form-item label="单位"><el-input v-model="editingMetric.unit" /></el-form-item>
        <el-form-item label="大类">
          <el-select v-model="editingMetric.categoryId" placeholder="选择大类">
            <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="正常范围">
          <el-input-number v-model="editingMetric.normalMin" :controls="false" style="width: 120px" /> ~
          <el-input-number v-model="editingMetric.normalMax" :controls="false" style="width: 120px" />
        </el-form-item>
        <el-form-item label="预警阈值">
          <el-input-number v-model="editingMetric.warningMin" :controls="false" style="width: 120px" /> ~
          <el-input-number v-model="editingMetric.warningMax" :controls="false" style="width: 120px" />
        </el-form-item>
        <el-form-item label="危险阈值">
          <el-input-number v-model="editingMetric.dangerMin" :controls="false" style="width: 120px" /> ~
          <el-input-number v-model="editingMetric.dangerMax" :controls="false" style="width: 120px" />
        </el-form-item>
        <el-form-item label="适用性别">
          <el-select v-model="editingMetric.applicableGender">
            <el-option label="全部" value="ALL" />
            <el-option label="男" value="MALE" />
            <el-option label="女" value="FEMALE" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getCategories, getMetrics, saveMetric, toggleMetric, deleteMetric, type HealthMetricDTO, type HealthCategoryDTO } from '@/api/admin'
import logger from '@/utils/logger'

const loading = ref(false)
const metrics = ref<HealthMetricDTO[]>([])
const categories = ref<HealthCategoryDTO[]>([])
const page = ref(1)
const size = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const editingMetric = ref<HealthMetricDTO>(createEmptyMetric())

function createEmptyMetric(): HealthMetricDTO {
  return { categoryId: 0, name: '', unit: '', normalMin: null, normalMax: null, warningMin: null, warningMax: null, dangerMin: null, dangerMax: null, applicableGender: 'ALL', enabled: 1 }
}

const loadMetrics = async () => {
  loading.value = true
  try {
    const data = await getMetrics(page.value, size.value)
    metrics.value = data.records
    total.value = data.total
  } catch (e) {
    logger.error('加载指标列表失败', e)
  } finally {
    loading.value = false
  }
}

const openMetricDialog = (row?: HealthMetricDTO) => {
  editingMetric.value = row ? { ...row } : createEmptyMetric()
  dialogVisible.value = true
}

const handleSave = async () => {
  try {
    await saveMetric(editingMetric.value)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    await loadMetrics()
  } catch (e) {
    logger.error('保存指标失败', e)
  }
}

const handleToggle = async (row: HealthMetricDTO) => {
  try {
    await toggleMetric(row.id!)
    await loadMetrics()
  } catch (e) {
    logger.error('切换状态失败', e)
  }
}

const handleDelete = async (row: HealthMetricDTO) => {
  try {
    await ElMessageBox.confirm(`确认删除指标「${row.name}」？`, '提示', { type: 'warning' })
    await deleteMetric(row.id!)
    ElMessage.success('删除成功')
    await loadMetrics()
  } catch (e) {
    if (e !== 'cancel') { logger.error('删除失败', e) }
  }
}

onMounted(async () => {
  categories.value = await getCategories()
  await loadMetrics()
})
</script>

<style scoped>
.metric-config { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
</style>
