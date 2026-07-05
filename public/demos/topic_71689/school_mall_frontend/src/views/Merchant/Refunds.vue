<template>
  <div class="refund-audit-page">
    <div class="page-header">
      <h2>退款审核</h2>
      <el-radio-group v-model="statusFilter" @change="handleFilterChange">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button label="0">待审核</el-radio-button>
        <el-radio-button label="1">已通过</el-radio-button>
        <el-radio-button label="2">已拒绝</el-radio-button>
      </el-radio-group>
    </div>

    <el-card v-loading="loading" shadow="never">
      <el-empty v-if="refundList.length === 0" description="暂无退款申请" />
      
      <div v-for="item in refundList" :key="item.id" class="refund-item">
        <div class="refund-header">
          <div class="header-left">
            <span class="order-no">订单号: {{ item.order_no }}</span>
            <span class="apply-time">申请时间: {{ item.create_time }}</span>
          </div>
          <div class="header-right">
            <el-tag :type="getStatusType(item.status)">{{ item.status_display }}</el-tag>
          </div>
        </div>

        <div class="refund-body">
          <div class="user-info">
            <p><strong>申请人:</strong> {{ item.username }}</p>
            <p><strong>退款金额:</strong> <span class="refund-amount">¥{{ item.refund_amount.toFixed(2) }}</span></p>
            <p v-if="item.reason"><strong>退款原因:</strong> {{ item.reason }}</p>
          </div>

          <div class="product-list">
            <h4>订单商品:</h4>
            <div v-for="(product, idx) in item.product_info" :key="idx" class="product-item">
              <el-image 
                :src="product.product_image || 'https://via.placeholder.com/60'" 
                class="product-img"
                fit="cover"
              />
              <div class="product-detail">
                <p class="product-name">{{ product.product_name }}</p>
                <p class="product-price">¥{{ parseFloat(product.price).toFixed(2) }} x {{ product.quantity }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-if="item.status === 0" class="refund-actions">
          <el-button type="success" @click="handleApprove(item)">通过退款</el-button>
          <el-button type="danger" @click="handleReject(item)">拒绝退款</el-button>
        </div>

        <div v-else class="audit-result">
          <p><strong>审核时间:</strong> {{ item.audit_time || '-' }}</p>
          <p v-if="item.audit_remark"><strong>审核备注:</strong> {{ item.audit_remark }}</p>
        </div>
      </div>
    </el-card>

    <!-- 审核弹窗 -->
    <el-dialog
      v-model="auditDialogVisible"
      :title="auditAction === 'approve' ? '通过退款申请' : '拒绝退款申请'"
      width="500px"
    >
      <div class="audit-info">
        <p><strong>订单号:</strong> {{ selectedRefund?.order_no }}</p>
        <p><strong>申请人:</strong> {{ selectedRefund?.username }}</p>
        <p><strong>退款金额:</strong> <span class="refund-amount">¥{{ selectedRefund?.refund_amount?.toFixed(2) }}</span></p>
        <p v-if="selectedRefund?.reason"><strong>退款原因:</strong> {{ selectedRefund.reason }}</p>
      </div>
      <el-form :model="auditForm" label-width="100px" class="mt-20">
        <el-form-item label="审核备注">
          <el-input 
            v-model="auditForm.audit_remark" 
            type="textarea" 
            :rows="3" 
            placeholder="请输入审核备注（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialogVisible = false">取消</el-button>
        <el-button 
          :type="auditAction === 'approve' ? 'success' : 'danger'" 
          @click="submitAudit" 
          :loading="auditLoading"
        >
          {{ auditAction === 'approve' ? '确认通过' : '确认拒绝' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const loading = ref(false)
const auditLoading = ref(false)
const refundList = ref([])
const statusFilter = ref('')
const auditDialogVisible = ref(false)
const selectedRefund = ref(null)
const auditAction = ref('') // 'approve' 或 'reject'

const auditForm = ref({
  audit_remark: ''
})

const getStatusType = (status) => {
  const types = {
    0: 'warning',
    1: 'success',
    2: 'danger'
  }
  return types[status] || 'info'
}

const fetchRefundList = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const params = {}
    if (statusFilter.value !== '') {
      params.status = statusFilter.value
    }
    
    const res = await axios.get('/api/merchant/refund-audit/', {
      params,
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (res.data.code === 200) {
      refundList.value = res.data.data
    } else {
      ElMessage.error(res.data.message || '获取退款申请失败')
    }
  } catch (error) {
    console.error('获取退款申请失败:', error)
    ElMessage.error(error.response?.data?.message || '获取退款申请失败')
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  fetchRefundList()
}

const handleApprove = (item) => {
  selectedRefund.value = item
  auditAction.value = 'approve'
  auditForm.value.audit_remark = ''
  auditDialogVisible.value = true
}

const handleReject = (item) => {
  selectedRefund.value = item
  auditAction.value = 'reject'
  auditForm.value.audit_remark = ''
  auditDialogVisible.value = true
}

const submitAudit = async () => {
  if (!selectedRefund.value) return
  
  auditLoading.value = true
  try {
    const token = localStorage.getItem('token')
    const res = await axios.post('/api/merchant/refund-audit/', {
      refund_id: selectedRefund.value.id,
      action: auditAction.value,
      audit_remark: auditForm.value.audit_remark
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (res.data.code === 200) {
      ElMessage.success(res.data.message)
      auditDialogVisible.value = false
      fetchRefundList()
    } else {
      ElMessage.error(res.data.message)
    }
  } catch (error) {
    console.error('审核失败:', error)
    ElMessage.error(error.response?.data?.message || '审核失败')
  } finally {
    auditLoading.value = false
  }
}

onMounted(() => {
  fetchRefundList()
})
</script>

<style scoped>
.refund-audit-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.refund-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 20px;
  overflow: hidden;
}

.refund-item:last-child {
  margin-bottom: 0;
}

.refund-header {
  background: #f5f7fa;
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  gap: 20px;
  font-size: 14px;
  color: #606266;
}

.order-no {
  font-weight: bold;
  color: #303133;
}

.refund-body {
  padding: 20px;
  display: flex;
  gap: 30px;
}

.user-info {
  flex: 1;
}

.user-info p {
  margin: 8px 0;
  font-size: 14px;
  color: #606266;
}

.refund-amount {
  color: #f56c6c;
  font-size: 18px;
  font-weight: bold;
}

.product-list {
  flex: 2;
}

.product-list h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #303133;
}

.product-item {
  display: flex;
  gap: 12px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 4px;
  margin-bottom: 8px;
}

.product-item:last-child {
  margin-bottom: 0;
}

.product-img {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  flex-shrink: 0;
}

.product-detail {
  flex: 1;
}

.product-name {
  margin: 0 0 6px 0;
  font-size: 13px;
  color: #303133;
  line-height: 1.4;
}

.product-price {
  margin: 0;
  font-size: 12px;
  color: #909399;
}

.refund-actions {
  padding: 15px 20px;
  border-top: 1px solid #ebeef5;
  text-align: right;
}

.audit-result {
  padding: 15px 20px;
  border-top: 1px solid #ebeef5;
  background: #f5f7fa;
}

.audit-result p {
  margin: 6px 0;
  font-size: 13px;
  color: #606266;
}

.audit-info {
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.audit-info p {
  margin: 10px 0;
  font-size: 14px;
}

.mt-20 {
  margin-top: 20px;
}
</style>
