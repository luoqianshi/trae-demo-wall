<template>
  <div class="admin-orders">
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="订单号">
          <el-input v-model="filters.order_no" placeholder="输入订单号" clearable @clear="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable @change="handleSearch">
            <el-option label="待支付" :value="0" />
            <el-option label="已支付" :value="1" />
            <el-option label="已发货" :value="2" />
            <el-option label="已完成" :value="3" />
            <el-option label="已取消" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="mt-20">
      <el-table :data="orders" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="order_no" label="订单号" min-width="180" />
        <el-table-column prop="username" label="买家" width="120" />
        <el-table-column prop="actual_price" label="实付金额" width="120">
          <template #default="scope">¥{{ scope.row.actual_price }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="下单时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button type="info" link @click="viewDetail(scope.row)">详情</el-button>
            <el-button type="danger" link @click="handleDeleteOrder(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const orders = ref([])
const loading = ref(false)
const filters = reactive({
  order_no: '',
  status: ''
})

const getStatusText = (status) => {
  const texts = {
    0: '待支付',
    1: '已支付',
    2: '已发货',
    3: '已完成',
    4: '已取消'
  }
  return texts[status] || '未知'
}

const getStatusTag = (status) => {
  const tags = {
    0: 'warning',
    1: 'primary',
    2: 'success',
    3: 'success',
    4: 'info'
  }
  return tags[status] || 'info'
}

const fetchOrders = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/management/orders/', {
      params: filters,
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.data.code === 200) {
      orders.value = response.data.data
    }
  } catch (error) {
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  fetchOrders()
}

const viewDetail = (row) => {
  ElMessageBox.alert(`订单号: ${row.order_no}<br>状态: ${getStatusText(row.status)}<br>下单时间: ${row.create_time}`, '订单详情', {
    dangerouslyUseHTMLString: true
  })
}

// 删除订单
const handleDeleteOrder = (orderId) => {
  ElMessageBox.confirm('确定要删除该订单记录吗？删除后无法恢复', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.delete(`/api/management/orders/${orderId}/`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.data.code === 200) {
        ElMessage.success('订单删除成功')
        fetchOrders()
      } else {
        ElMessage.error(response.data.message || '删除失败')
      }
    } catch (error) {
      console.error('删除订单失败:', error)
      ElMessage.error(error.response?.data?.message || '删除订单失败')
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped>
.mt-20 { margin-top: 20px; }
</style>
