<template>
  <div class="data-input">
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">
          <i class="fas fa-chart-bar"></i>
        </div>
        <div class="header-title">
          <h1>数据录入</h1>
          <p>记录每日经营数据，追踪业务增长</p>
        </div>
      </div>
      <span class="date-label">{{ currentDate }}</span>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon blue">
          <i class="fas fa-yen-sign"></i>
        </div>
        <div class="stat-info">
          <p class="stat-value">¥{{ totalRevenue }}</p>
          <p class="stat-label">总营业额</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">
          <i class="fas fa-shopping-cart"></i>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ totalOrders }}</p>
          <p class="stat-label">总订单数</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">
          <i class="fas fa-users"></i>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ totalCustomers }}</p>
          <p class="stat-label">总客流量</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">
          <i class="fas fa-percentage"></i>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ avgConversionRate }}%</p>
          <p class="stat-label">平均转化率</p>
        </div>
      </div>
    </div>

    <div class="input-section">
      <div class="panel-card">
        <div class="card-header">
          <h3><i class="fas fa-plus-circle"></i> 录入今日数据</h3>
        </div>
        <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
          <div class="form-row">
            <el-form-item label="营业额(元)" prop="revenue">
              <el-input v-model.number="form.revenue" placeholder="请输入今日营业额" />
            </el-form-item>
            <el-form-item label="订单数" prop="orders">
              <el-input v-model.number="form.orders" placeholder="请输入订单数量" />
            </el-form-item>
            <el-form-item label="客流量" prop="customers">
              <el-input v-model.number="form.customers" placeholder="请输入客流量" />
            </el-form-item>
            <el-form-item label="新增会员" prop="new_members">
              <el-input v-model.number="form.new_members" placeholder="请输入新增会员数" />
            </el-form-item>
          </div>
          <div class="form-row">
            <el-form-item label="客单价" prop="avg_order_value">
              <el-input v-model.number="form.avg_order_value" placeholder="系统自动计算" />
            </el-form-item>
            <el-form-item label="转化率(%)" prop="conversion_rate">
              <el-input v-model.number="form.conversion_rate" placeholder="系统自动计算" />
            </el-form-item>
            <el-form-item label="营业时长" prop="business_hours">
              <el-input v-model.number="form.business_hours" placeholder="请输入营业时长(小时)" />
            </el-form-item>
            <el-form-item label="招牌菜品" prop="top_dish">
              <el-input v-model="form.top_dish" placeholder="请输入招牌菜品名称" />
            </el-form-item>
          </div>
          <div class="form-row">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注信息" />
            </el-form-item>
          </div>
          <div class="form-actions">
            <el-button type="primary" @click="submitData" :loading="submitting" class="btn-primary">
              <i class="fas fa-save"></i> 提交数据
            </el-button>
            <el-button @click="resetForm" class="btn-secondary">
              <i class="fas fa-redo"></i> 重置
            </el-button>
          </div>
        </el-form>
      </div>
    </div>

    <div class="history-section">
      <div class="panel-card">
        <div class="card-header">
          <h3><i class="fas fa-history"></i> 历史记录</h3>
          <div class="header-actions">
            <el-input v-model="searchKeyword" placeholder="搜索日期" clearable style="width: 200px;">
              <template #prefix>
                <i class="fas fa-search"></i>
              </template>
            </el-input>
          </div>
        </div>
        <div class="history-table">
          <el-table :data="filteredHistory" border stripe style="width: 100%">
            <el-table-column prop="date" label="日期" />
            <el-table-column prop="revenue" label="营业额(元)">
              <template #default="scope">¥{{ scope.row.revenue }}</template>
            </el-table-column>
            <el-table-column prop="orders" label="订单数" />
            <el-table-column prop="customers" label="客流量" />
            <el-table-column prop="avg_order_value" label="客单价">
              <template #default="scope">¥{{ scope.row.avg_order_value }}</template>
            </el-table-column>
            <el-table-column prop="conversion_rate" label="转化率(%)" />
            <el-table-column label="操作" width="150" fixed="right">
              <template #default="scope">
                <el-button link type="primary" @click="editData(scope.row)">编辑</el-button>
                <el-button link type="danger" @click="deleteData(scope.row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div v-if="filteredHistory.length === 0" class="empty-state">
            <div class="empty-icon">
              <i class="fas fa-database"></i>
            </div>
            <p>暂无历史数据</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { dataInputApi } from '../api'

const formRef = ref(null)
const submitting = ref(false)
const searchKeyword = ref('')
const currentDate = new Date().toLocaleDateString('zh-CN')

const form = reactive({
  revenue: 0,
  orders: 0,
  customers: 0,
  new_members: 0,
  avg_order_value: 0,
  conversion_rate: 0,
  business_hours: 0,
  top_dish: '',
  remark: ''
})

const rules = {
  revenue: [
    { required: true, message: '请输入营业额', trigger: 'blur' },
    { type: 'number', min: 0, message: '营业额必须大于等于0', trigger: 'blur' }
  ],
  orders: [
    { required: true, message: '请输入订单数量', trigger: 'blur' },
    { type: 'number', min: 0, message: '订单数量必须大于等于0', trigger: 'blur' }
  ],
  customers: [
    { type: 'number', min: 0, message: '客流量必须大于等于0', trigger: 'blur' }
  ]
}

const historyData = ref([
  { date: '2026-06-22', revenue: 8500, orders: 180, customers: 250, avg_order_value: 47, conversion_rate: 72 },
  { date: '2026-06-21', revenue: 7200, orders: 150, customers: 220, avg_order_value: 48, conversion_rate: 68 },
  { date: '2026-06-20', revenue: 8200, orders: 175, customers: 240, avg_order_value: 47, conversion_rate: 73 },
  { date: '2026-06-19', revenue: 9800, orders: 210, customers: 280, avg_order_value: 47, conversion_rate: 75 },
  { date: '2026-06-18', revenue: 6500, orders: 135, customers: 190, avg_order_value: 48, conversion_rate: 71 }
])

const totalRevenue = computed(() => {
  return historyData.value.reduce((sum, item) => sum + item.revenue, 0)
})

const totalOrders = computed(() => {
  return historyData.value.reduce((sum, item) => sum + item.orders, 0)
})

const totalCustomers = computed(() => {
  return historyData.value.reduce((sum, item) => sum + item.customers, 0)
})

const avgConversionRate = computed(() => {
  if (historyData.value.length === 0) return 0
  const avg = historyData.value.reduce((sum, item) => sum + item.conversion_rate, 0) / historyData.value.length
  return avg.toFixed(1)
})

const filteredHistory = computed(() => {
  if (!searchKeyword.value) return historyData.value
  return historyData.value.filter(item => item.date.includes(searchKeyword.value))
})

async function submitData() {
  if (!formRef.value) return

  submitting.value = true
  try {
    await formRef.value.validate((valid) => {
      if (valid) {
        if (!form.avg_order_value && form.revenue > 0 && form.orders > 0) {
          form.avg_order_value = Math.round(form.revenue / form.orders * 100) / 100
        }
        if (!form.conversion_rate && form.orders > 0 && form.customers > 0) {
          form.conversion_rate = Math.round(form.orders / form.customers * 100)
        }

        const newData = {
          date: currentDate,
          ...form
        }

        historyData.value.unshift(newData)
        ElMessage.success('数据提交成功')
        resetForm()
      }
    })
  } catch (error) {
    console.error('提交失败:', error)
    ElMessage.error('提交失败，请重试')
  } finally {
    submitting.value = false
  }
}

function resetForm() {
  form.revenue = 0
  form.orders = 0
  form.customers = 0
  form.new_members = 0
  form.avg_order_value = 0
  form.conversion_rate = 0
  form.business_hours = 0
  form.top_dish = ''
  form.remark = ''
  formRef.value?.resetFields()
}

function editData(row) {
  Object.assign(form, row)
  ElMessage.info('请修改数据后点击提交')
}

async function deleteData(row) {
  try {
    await ElMessageBox.confirm(`确定删除 ${row.date} 的数据？`, '提示', {
      type: 'warning'
    })
    const index = historyData.value.findIndex(item => item.date === row.date)
    if (index > -1) {
      historyData.value.splice(index, 1)
      ElMessage.success('删除成功')
    }
  } catch {
    ElMessage.info('已取消删除')
  }
}

async function loadHistory() {
  try {
    const response = await dataInputApi.getDailyHistory()
    if (response.data && response.data.data) {
      historyData.value = response.data.data
    }
  } catch (error) {
    console.error('加载历史数据失败:', error)
  }
}

onMounted(() => {
  loadHistory()
})
</script>

<style scoped>
.data-input {
  padding: 18px;
  background: var(--ds-bg);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  padding: 18px 20px;
  background: var(--ds-surface);
  border: 1px solid var(--ds-border);
  border-radius: 16px;
  box-shadow: var(--ds-shadow-card);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--ds-primary), #2f6f5e);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 22px;
}

.header-title h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.header-title p {
  font-size: 14px;
  color: #64748b;
  margin: 4px 0 0 0;
}

.date-label {
  font-size: 16px;
  color: #64748b;
  background: var(--ds-surface-muted);
  padding: 10px 20px;
  border-radius: 10px;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 18px;
}

.stat-card {
  background: var(--ds-surface);
  border: 1px solid var(--ds-border);
  border-radius: 14px;
  padding: 18px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--ds-shadow-card);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, rgba(180, 83, 9, 0.45), rgba(47, 111, 94, 0.1));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.blue {
  background: linear-gradient(135deg, var(--ds-primary), var(--ds-primary-700));
}

.stat-icon.green {
  background: linear-gradient(135deg, #10b981, #059669);
}

.stat-icon.orange {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.stat-icon.purple {
  background: linear-gradient(135deg, #2f6f5e, #0f4c5c);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin: 4px 0 0 0;
}

.input-section,
.history-section {
  margin-bottom: 24px;
}

.panel-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.form-row :deep(.el-form-item) {
  flex: 1;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-primary {
  background: linear-gradient(135deg, var(--ds-primary) 0%, var(--ds-food) 100%) !important;
  border: none !important;
  border-radius: 10px !important;
  padding: 12px 24px !important;
  font-weight: 500 !important;
  box-shadow: 0 4px 12px rgba(180, 83, 9, 0.22) !important;
  transition: all 0.3s ease !important;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(180, 83, 9, 0.28) !important;
}

.btn-secondary {
  border-radius: 10px !important;
  padding: 12px 24px !important;
  color: #64748b !important;
  border-color: #e2e8f0 !important;
  background: white !important;
}

.history-table {
  overflow-x: auto;
}

.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #94a3b8;
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
  color: #cbd5e1;
  font-size: 28px;
}

.empty-state p {
  font-size: 14px;
  margin: 0;
}
</style>
