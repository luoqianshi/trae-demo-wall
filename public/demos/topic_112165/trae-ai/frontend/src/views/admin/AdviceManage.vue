<template>
  <div class="advice-manage">
    <div class="page-header">
      <h2>📝 健康建议知识库</h2>
      <el-button type="primary" @click="openDialog()">新增建议</el-button>
    </div>
    <el-card>
      <el-table :data="adviceList" v-loading="loading" stripe>
        <el-table-column prop="title" label="标题" width="200" />
        <el-table-column prop="metricId" label="关联指标ID" width="120" />
        <el-table-column prop="level" label="告警等级" width="100">
          <template #default="{ row }">
            <el-tag :type="row.level === 'DANGER' ? 'danger' : 'warning'">{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="内容预览" show-overflow-tooltip>
          <template #default="{ row }">{{ stripHtml(row.content).substring(0, 60) }}...</template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.enabled === 1 ? 'success' : 'info'">{{ row.enabled === 1 ? '启用' : '停用' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-model:current-page="page" :page-size="size" :total="total" layout="total, prev, pager, next" @current-change="loadAdvice" style="margin-top: 15px; justify-content: flex-end;" />
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editing.id ? '编辑建议' : '新增建议'" width="700px">
      <el-form :model="editing" label-width="100px">
        <el-form-item label="标题"><el-input v-model="editing.title" /></el-form-item>
        <el-form-item label="关联指标ID"><el-input-number v-model="editing.metricId" :min="0" :controls="false" style="width: 200px" placeholder="留空为通用建议" /></el-form-item>
        <el-form-item label="告警等级">
          <el-select v-model="editing.level">
            <el-option label="预警" value="WARNING" />
            <el-option label="危险" value="DANGER" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容（HTML）">
          <el-input v-model="editing.content" type="textarea" :rows="10" placeholder="支持HTML格式" />
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
import { getAdviceList, saveAdvice, deleteAdvice, type AdviceTemplateDTO } from '@/api/admin'
import logger from '@/utils/logger'

const loading = ref(false)
const adviceList = ref<AdviceTemplateDTO[]>([])
const page = ref(1)
const size = ref(10)
const total = ref(0)
const dialogVisible = ref(false)
const editing = ref<AdviceTemplateDTO>(createEmpty())

function createEmpty(): AdviceTemplateDTO {
  return { metricId: null, level: 'WARNING', title: '', content: '', enabled: 1 }
}

const stripHtml = (html: string) => {
  return html.replace(/<[^>]+>/g, '')
}

const loadAdvice = async () => {
  loading.value = true
  try {
    const data = await getAdviceList(page.value, size.value)
    adviceList.value = data.records
    total.value = data.total
  } catch (e) {
    logger.error('加载建议列表失败', e)
  } finally {
    loading.value = false
  }
}

const openDialog = (row?: AdviceTemplateDTO) => {
  editing.value = row ? { ...row } : createEmpty()
  dialogVisible.value = true
}

const handleSave = async () => {
  try {
    await saveAdvice(editing.value)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    await loadAdvice()
  } catch (e) {
    logger.error('保存建议失败', e)
  }
}

const handleDelete = async (row: AdviceTemplateDTO) => {
  try {
    await ElMessageBox.confirm(`确认删除建议「${row.title}」？`, '提示', { type: 'warning' })
    await deleteAdvice(row.id!)
    ElMessage.success('删除成功')
    await loadAdvice()
  } catch (e) {
    if (e !== 'cancel') { logger.error('删除失败', e) }
  }
}

onMounted(loadAdvice)
</script>

<style scoped>
.advice-manage { padding: 20px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
</style>
