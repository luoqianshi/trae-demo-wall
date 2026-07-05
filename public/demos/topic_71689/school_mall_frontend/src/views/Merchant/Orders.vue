<template>
  <div class="orders-container">
    <div class="header-actions">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="订单号">
          <el-input v-model="searchForm.order_sn" placeholder="输入订单号" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="选择状态" clearable style="width: 120px">
            <el-option label="待付款" :value="0" />
            <el-option label="待发货" :value="1" />
            <el-option label="已发货" :value="2" />
            <el-option label="已取消" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchOrders">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table :data="orders" v-loading="loading" stripe style="width: 100%">
      <el-table-column type="expand">
        <template #default="props">
          <div class="order-detail">
            <h3>商品列表</h3>
            <el-table :data="props.row.product_info" border size="small">
              <el-table-column label="图片" width="80">
                <template #default="scope">
                  <el-image :src="scope.row.image" style="width: 40px; height: 40px" fit="cover" />
                </template>
              </el-table-column>
              <el-table-column prop="product_name" label="商品名称" />
              <el-table-column prop="price" label="单价" width="100">
                <template #default="scope">¥{{ scope.row.price }}</template>
              </el-table-column>
              <el-table-column prop="count" label="数量" width="80" />
              <el-table-column label="小计" width="100">
                <template #default="scope">¥{{ (scope.row.price * scope.row.count).toFixed(2) }}</template>
              </el-table-column>
            </el-table>
            <div class="order-info-grid">
              <div><strong>收货人：</strong>{{ props.row.receiver_name }}</div>
              <div><strong>联系电话：</strong>{{ props.row.receiver_phone }}</div>
              <div><strong>收货地址：</strong>{{ props.row.receiver_address }}</div>
              <div><strong>备注：</strong>{{ props.row.order_remark || '无' }}</div>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="order_sn" label="订单号" width="180" />
      <el-table-column prop="total_amount" label="订单金额" width="120">
        <template #default="scope">¥{{ scope.row.total_amount }}</template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="120">
        <template #default="scope">
          <el-tag :type="getOrderStatusType(scope.row.status)">
            {{ getOrderStatusText(scope.row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="create_time" label="下单时间" width="180" />
      <el-table-column label="操作" fixed="right" width="280">
        <template #default="scope">
          <el-button 
            v-if="scope.row.status === 1" 
            type="success" 
            size="small" 
            @click="handleShip(scope.row)"
          >
            去发货
          </el-button>
          <el-button 
            v-if="scope.row.status === 2" 
            type="primary" 
            size="small" 
            @click="handleUpdateLocation(scope.row)"
          >
            更新位置
          </el-button>
          <el-button type="info" link size="small" @click="viewLogistics(scope.row)">查看物流</el-button>
          <el-button 
            v-if="scope.row.status === 2 || scope.row.status === 3" 
            type="danger" 
            link 
            size="small" 
            @click="handleDeleteOrder(scope.row.id)"
          >
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 发货对话框 -->
    <el-dialog v-model="shipDialogVisible" title="订单发货" width="400px">
      <el-form :model="shipForm" label-width="100px">
        <el-form-item label="订单号">
          <span>{{ currentOrder?.order_sn }}</span>
        </el-form-item>
        <el-form-item label="发货方式">
          <el-select v-model="shipForm.method" placeholder="选择发货方式">
            <el-option label="商家自配送" value="self" />
            <el-option label="快递物流" value="express" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="shipForm.method === 'express'" label="物流单号">
          <el-input v-model="shipForm.sn" placeholder="请输入物流单号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="shipDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="shipLoading" @click="confirmShip">确定发货</el-button>
      </template>
    </el-dialog>

    <!-- 更新物流位置对话框 -->
    <el-dialog v-model="locationDialogVisible" title="更新物流位置" width="500px">
      <el-form :model="locationForm" label-width="100px">
        <el-form-item label="订单号">
          <span>{{ currentOrder?.order_sn }}</span>
        </el-form-item>
        <el-form-item label="当前位置" required>
          <el-input v-model="locationForm.location" placeholder="例如：校园快递站、学生宿舍A区..." />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="locationForm.remark" type="textarea" rows="3" placeholder="可选：添加备注信息..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="locationDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="locationLoading" @click="confirmUpdateLocation">确认更新</el-button>
      </template>
    </el-dialog>

    <!-- 查看物流对话框 -->
    <el-dialog v-model="logisticsDialogVisible" title="物流详情" width="600px">
      <div v-if="currentLogistics" class="logistics-detail">
        <div class="logistics-header">
          <p><strong>订单号：</strong>{{ currentOrder?.order_sn }}</p>
          <p v-if="currentLogistics.logistics_no"><strong>物流单号：</strong>{{ currentLogistics.logistics_no }}</p>
        </div>
        <el-timeline v-if="currentLogistics.logistics_status && currentLogistics.logistics_status.length > 0">
          <el-timeline-item
            v-for="(item, index) in currentLogistics.logistics_status"
            :key="index"
            :type="index === 0 ? 'primary' : ''"
            :color="index === 0 ? '#0bbd87' : ''"
            :timestamp="item.time"
          >
            <div class="logistics-item">
              <p class="status">{{ item.status }}</p>
              <p v-if="item.location" class="location"><el-icon><Location /></el-icon> {{ item.location }}</p>
              <p v-if="item.remark" class="remark">备注：{{ item.remark }}</p>
            </div>
          </el-timeline-item>
        </el-timeline>
        <el-empty v-else description="暂无物流信息" />
      </div>
      <div v-else class="logistics-detail">
        <el-empty description="暂无物流信息" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Location } from '@element-plus/icons-vue'
import axios from 'axios'

const loading = ref(false)
const orders = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const searchForm = reactive({
  order_sn: '',
  status: ''
})

const shipDialogVisible = ref(false)
const shipLoading = ref(false)
const currentOrder = ref(null)
const shipForm = reactive({
  method: 'self',
  sn: ''
})

// 物流位置更新相关
const locationDialogVisible = ref(false)
const locationLoading = ref(false)
const locationForm = reactive({
  location: '',
  remark: ''
})

// 查看物流相关
const logisticsDialogVisible = ref(false)
const currentLogistics = ref(null)

const fetchOrders = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/order/merchant/list/', {
      params: {
        page: currentPage.value,
        page_size: pageSize.value,
        order_sn: searchForm.order_sn,
        status: searchForm.status
      }
    })
    if (response.data.code === 200) {
      orders.value = response.data.data.results || response.data.data
      total.value = response.data.data.total || orders.value.length
    }
  } catch (error) {
    console.error('获取订单列表失败:', error)
    ElMessage.error('获取订单列表失败')
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.order_sn = ''
  searchForm.status = ''
  fetchOrders()
}

const getOrderStatusType = (status) => {
  const types = { 0: 'warning', 1: 'primary', 2: 'success', 3: 'info' }
  return types[status] || 'info'
}

const getOrderStatusText = (status) => {
  const texts = { 0: '待付款', 1: '待发货', 2: '已发货', 3: '已取消' }
  return texts[status] || '未知'
}

const handleShip = (order) => {
  currentOrder.value = order
  shipForm.method = 'self'
  shipForm.sn = ''
  shipDialogVisible.value = true
}

const confirmShip = async () => {
  shipLoading.value = true
  try {
    const response = await axios.post(`/api/order/merchant/ship/${currentOrder.value.id}/`, shipForm)
    if (response.data.code === 200) {
      ElMessage.success('发货成功')
      shipDialogVisible.value = false
      fetchOrders()
    }
  } catch (error) {
    console.error('发货失败:', error)
    ElMessage.error('发货失败')
  } finally {
    shipLoading.value = false
  }
}

const viewDetail = (order) => {
  // 可以根据需要跳转到详情页或展开
}

// 更新物流位置
const handleUpdateLocation = (order) => {
  currentOrder.value = order
  locationForm.location = ''
  locationForm.remark = ''
  locationDialogVisible.value = true
}

// 确认更新物流位置
const confirmUpdateLocation = async () => {
  if (!locationForm.location.trim()) {
    ElMessage.warning('请输入当前位置')
    return
  }

  locationLoading.value = true
  try {
    const response = await axios.post(`/api/order/merchant/logistics/${currentOrder.value.id}/`, {
      location: locationForm.location,
      remark: locationForm.remark
    })
    if (response.data.code === 200) {
      ElMessage.success('物流位置更新成功')
      locationDialogVisible.value = false
    }
  } catch (error) {
    console.error('更新物流位置失败:', error)
    ElMessage.error(error.response?.data?.message || '更新物流位置失败')
  } finally {
    locationLoading.value = false
  }
}

// 查看物流
const viewLogistics = async (order) => {
  currentOrder.value = order
  currentLogistics.value = null
  logisticsDialogVisible.value = true

  try {
    const response = await axios.get(`/api/order/merchant/logistics/${order.id}/`)
    if (response.data.code === 200) {
      currentLogistics.value = response.data.data
    }
  } catch (error) {
    console.error('获取物流信息失败:', error)
    if (error.response?.status !== 404) {
      ElMessage.error(error.response?.data?.message || '获取物流信息失败')
    }
  }
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchOrders()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchOrders()
}

// 删除订单
const handleDeleteOrder = (orderId) => {
  ElMessageBox.confirm('确定要删除该订单记录吗？删除后无法恢复', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await axios.delete(`/api/order/merchant/list/${orderId}/`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
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
.orders-container {
  padding: 10px;
}

.header-actions {
  margin-bottom: 20px;
}

.order-detail {
  padding: 20px;
  background-color: #f9f9f9;
}

.order-detail h3 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 16px;
}

.order-info-grid {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  font-size: 14px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.logistics-detail {
  padding: 10px;
}

.logistics-header {
  margin-bottom: 20px;
  padding: 15px;
  background: #f5f7fa;
  border-radius: 4px;
}

.logistics-header p {
  margin: 5px 0;
}

.logistics-item {
  padding: 5px 0;
}

.logistics-item .status {
  font-weight: bold;
  color: #303133;
  margin: 0 0 5px 0;
}

.logistics-item .location {
  color: #409eff;
  margin: 0 0 5px 0;
  font-size: 13px;
}

.logistics-item .remark {
  color: #909399;
  margin: 0;
  font-size: 12px;
}
</style>
