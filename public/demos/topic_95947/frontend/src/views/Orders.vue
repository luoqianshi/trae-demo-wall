<template>
  <div class="orders-page">
    <ModuleAIPanel module="订单管理" title="AI 订单诊断" />
    <div class="page-header">
      <div class="header-left">
        <h2>订单管理</h2>
        <p>管理订单列表和订单详情</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="createOrder">
          <i class="fas fa-plus"></i> 创建订单
        </el-button>
        <el-button type="success" @click="showImportDialog = true">
          <i class="fas fa-upload"></i> Excel导入
        </el-button>
        <el-button @click="refreshData">
          <i class="fas fa-sync-alt"></i> 刷新
        </el-button>
        <el-button @click="exportOrders">
          <i class="fas fa-download"></i> 导出订单
        </el-button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon bg-blue">
          <i class="fas fa-shopping-bag"></i>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ stats.totalOrders }}</p>
          <p class="stat-label">今日订单</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-green">
          <i class="fas fa-check-circle"></i>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ stats.completedOrders }}</p>
          <p class="stat-label">已完成</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-yellow">
          <i class="fas fa-clock"></i>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ stats.pendingOrders }}</p>
          <p class="stat-label">待处理</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon bg-red">
          <i class="fas fa-yen-sign"></i>
        </div>
        <div class="stat-info">
          <p class="stat-value">¥{{ stats.totalAmount.toFixed(2) }}</p>
          <p class="stat-label">今日营收</p>
        </div>
      </div>
    </div>

    <div class="filter-section">
      <el-form :inline="true" :model="filterForm">
        <el-form-item label="订单号">
          <el-input v-model="filterForm.orderNo" placeholder="请输入订单号" clearable></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="全部" clearable>
            <el-option label="待接单" value="pending"></el-option>
            <el-option label="制作中" value="cooking"></el-option>
            <el-option label="已完成" value="completed"></el-option>
            <el-option label="已取消" value="cancelled"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker v-model="filterForm.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期"
            end-placeholder="结束日期"></el-date-picker>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleFilter">搜索</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="orders-section">
      <div class="orders-list">
        <div v-for="order in filteredOrders" :key="order.id" class="order-card" @click="showOrderDetail(order)">
          <div class="order-header">
            <div class="order-left">
              <span class="order-no">#{{ order.order_no }}</span>
              <span :class="['order-status', order.status]">{{ getStatusText(order.status) }}</span>
            </div>
            <div class="order-right">
              <span class="order-time">{{ formatTime(order.created_at) }}</span>
            </div>
          </div>
          <div class="order-items">
            <div v-for="item in order.items" :key="item.id" class="order-item">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-quantity">x{{ item.quantity }}</span>
              <span class="item-price">¥{{ item.price.toFixed(2) }}</span>
            </div>
          </div>
          <div class="order-footer">
            <div class="order-total">
              <span class="total-label">合计：</span>
              <span class="total-amount">¥{{ order.total_amount.toFixed(2) }}</span>
            </div>
            <div class="order-actions">
              <el-button v-if="order.status === 'pending'" size="small" type="primary"
                @click.stop="updateStatus(order, 'cooking')">接单</el-button>
              <el-button v-if="order.status === 'cooking'" size="small" type="success"
                @click.stop="updateStatus(order, 'completed')">完成</el-button>
              <el-button v-if="order.status !== 'completed' && order.status !== 'cancelled'" size="small" type="danger"
                @click.stop="updateStatus(order, 'cancelled')">取消</el-button>
              <el-button size="small" @click.stop="showOrderDetail(order)">详情</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog title="订单详情" v-model="showDetailDialog" width="600px" :before-close="closeDetail">
      <div v-if="selectedOrder" class="order-detail">
        <div class="detail-header">
          <div class="detail-left">
            <h3>订单 #{{ selectedOrder.order_no }}</h3>
            <p class="detail-time">下单时间：{{ formatTime(selectedOrder.created_at) }}</p>
          </div>
          <span :class="['detail-status', selectedOrder.status]">{{ getStatusText(selectedOrder.status) }}</span>
        </div>
        <div class="detail-section">
          <h4>订单菜品</h4>
          <table class="items-table">
            <thead>
              <tr>
                <th>菜品名称</th>
                <th>单价</th>
                <th>数量</th>
                <th>小计</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in selectedOrder.items" :key="item.id">
                <td>{{ item.name }}</td>
                <td>¥{{ item.price.toFixed(2) }}</td>
                <td>{{ item.quantity }}</td>
                <td>¥{{ (item.price * item.quantity).toFixed(2) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="detail-footer">
          <div class="detail-total">
            <span>订单总额：</span>
            <span class="total-amount">¥{{ selectedOrder.total_amount.toFixed(2) }}</span>
          </div>
          <div class="detail-actions">
            <el-button v-if="selectedOrder.status === 'pending'" type="primary"
              @click="updateStatus(selectedOrder, 'cooking')">接单</el-button>
            <el-button v-if="selectedOrder.status === 'cooking'" type="success"
              @click="updateStatus(selectedOrder, 'completed')">完成</el-button>
            <el-button v-if="selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled'" type="danger"
              @click="updateStatus(selectedOrder, 'cancelled')">取消订单</el-button>
            <el-button @click="closeDetail">关闭</el-button>
          </div>
        </div>
      </div>
    </el-dialog>

    <el-dialog title="创建订单" v-model="showCreateDialog" width="600px">
      <div class="create-order">
        <div class="create-section">
          <h4>选择菜品</h4>
          <div class="dish-select-list">
            <div v-for="dish in availableDishes" :key="dish.id" class="dish-select-item">
              <img :src="dish.image || defaultImage" :alt="dish.name" class="dish-thumb">
              <div class="dish-info">
                <span class="dish-name">{{ dish.name }}</span>
                <span class="dish-price">¥{{ dish.price.toFixed(2) }}</span>
              </div>
              <div class="quantity-control">
                <el-button size="small" @click="decreaseQuantity(dish.id)">-</el-button>
                <span>{{ getQuantity(dish.id) }}</span>
                <el-button size="small" @click="increaseQuantity(dish.id)">+</el-button>
              </div>
            </div>
          </div>
        </div>
        <div class="create-summary">
          <h4>订单摘要</h4>
          <div class="summary-items">
            <div v-for="item in orderItems" :key="item.id" class="summary-item">
              <span>{{ item.name }} x{{ item.quantity }}</span>
              <span>¥{{ (item.price * item.quantity).toFixed(2) }}</span>
            </div>
          </div>
          <div class="summary-total">
            <span>合计：</span>
            <span class="total-amount">¥{{ orderTotal.toFixed(2) }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitOrder" :disabled="orderItems.length === 0">提交订单</el-button>
      </template>
    </el-dialog>

    <el-dialog title="Excel批量导入订单" v-model="showImportDialog" width="600px">
      <div class="import-dialog">
        <div class="import-info">
          <h4>导入说明</h4>
          <ul>
            <li>支持 .xlsx 和 .xls 格式文件</li>
            <li>Excel表头需要包含：订单号、菜品名称、数量、单价、金额、时间、状态</li>
            <li>状态值：待接单、制作中、已完成、已取消</li>
          </ul>
        </div>
        <div class="import-upload">
          <input type="file" ref="fileInput" accept=".xlsx,.xls" @change="handleFileUpload" class="import-file-input">
          <div class="upload-area" @click="triggerFileInput">
            <i class="fas fa-file-excel"></i>
            <p>点击或拖拽文件到此处上传</p>
            <p class="upload-hint">支持 .xlsx / .xls 格式</p>
          </div>
        </div>
        <div v-if="importPreview.length > 0" class="import-preview">
          <h4>预览数据（前5条）</h4>
          <table class="preview-table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>菜品</th>
                <th>数量</th>
                <th>金额</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in importPreview" :key="index">
                <td>{{ row.order_no }}</td>
                <td>{{row.items?.map(i => i.name).join(', ') || row.dish_name}}</td>
                <td>{{ row.total_quantity || row.quantity }}</td>
                <td>¥{{ parseFloat(row.amount || row.total_amount).toFixed(2) }}</td>
                <td>{{ row.status }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmImport" :disabled="importPreview.length === 0">确认导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ModuleAIPanel from '@/components/ModuleAIPanel.vue'
import * as XLSX from 'xlsx'

const defaultImage = 'https://via.placeholder.com/100x100?text=No+Image'

const orders = ref([
  { id: 1, order_no: '20240115001', status: 'completed', total_amount: 48.00, created_at: '2024-01-15 14:32:00', items: [{ id: 1, name: '招牌红烧肉', price: 48.00, quantity: 1 }] },
  { id: 2, order_no: '20240115002', status: 'cooking', total_amount: 62.00, created_at: '2024-01-15 14:30:00', items: [{ id: 1, name: '酸辣土豆丝', price: 9.00, quantity: 1 }, { id: 2, name: '宫保鸡丁', price: 28.00, quantity: 1 }, { id: 3, name: '米饭', price: 3.00, quantity: 2 }] },
  { id: 3, order_no: '20240115003', status: 'pending', total_amount: 88.00, created_at: '2024-01-15 14:28:00', items: [{ id: 1, name: '清蒸鲈鱼', price: 48.00, quantity: 1 }, { id: 2, name: '番茄蛋汤', price: 18.00, quantity: 1 }, { id: 3, name: '米饭', price: 3.00, quantity: 2 }] },
  { id: 4, order_no: '20240115004', status: 'completed', total_amount: 35.00, created_at: '2024-01-15 14:25:00', items: [{ id: 1, name: '麻婆豆腐', price: 12.00, quantity: 1 }, { id: 2, name: '米饭', price: 3.00, quantity: 2 }] },
  { id: 5, order_no: '20240115005', status: 'pending', total_amount: 116.00, created_at: '2024-01-15 14:20:00', items: [{ id: 1, name: '水煮鱼', price: 68.00, quantity: 1 }, { id: 2, name: '酸辣土豆丝', price: 9.00, quantity: 1 }, { id: 3, name: '米饭', price: 3.00, quantity: 3 }] },
  { id: 6, order_no: '20240115006', status: 'cooking', total_amount: 56.00, created_at: '2024-01-15 14:15:00', items: [{ id: 1, name: '糖醋排骨', price: 48.00, quantity: 1 }, { id: 2, name: '米饭', price: 3.00, quantity: 2 }] }
])

const availableDishes = ref([
  { id: 1, name: '招牌红烧肉', price: 48.00, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=braised%20pork%20belly%20chinese%20food&image_size=square' },
  { id: 2, name: '酸辣土豆丝', price: 9.00, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=shredded%20potato%20chinese%20food&image_size=square' },
  { id: 3, name: '清蒸鲈鱼', price: 48.00, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=steamed%20fish%20chinese%20food&image_size=square' },
  { id: 4, name: '麻婆豆腐', price: 12.00, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mapo%20tofu%20chinese%20food&image_size=square' },
  { id: 5, name: '宫保鸡丁', price: 28.00, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=kung%20pao%20chicken%20chinese%20food&image_size=square' },
  { id: 6, name: '水煮鱼', price: 68.00, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sichuan%20boiled%20fish%20chinese%20food&image_size=square' },
  { id: 7, name: '糖醋排骨', price: 48.00, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sweet%20sour%20pork%20ribs%20chinese%20food&image_size=square' },
  { id: 8, name: '番茄蛋汤', price: 18.00, image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tomato%20egg%20soup%20chinese%20food&image_size=square' },
  { id: 9, name: '米饭', price: 3.00, image: '' }
])

const filterForm = ref({
  orderNo: '',
  status: '',
  dateRange: []
})

const showDetailDialog = ref(false)
const showCreateDialog = ref(false)
const showImportDialog = ref(false)
const selectedOrder = ref(null)
const orderQuantities = ref({})
const fileInput = ref(null)
const importPreview = ref([])
const importData = ref([])

const stats = computed(() => {
  const today = new Date().toDateString()
  const todayOrders = orders.value.filter(o => new Date(o.created_at).toDateString() === today)
  return {
    totalOrders: todayOrders.length,
    completedOrders: todayOrders.filter(o => o.status === 'completed').length,
    pendingOrders: todayOrders.filter(o => o.status === 'pending' || o.status === 'cooking').length,
    totalAmount: todayOrders.reduce((sum, o) => sum + o.total_amount, 0)
  }
})

const filteredOrders = computed(() => {
  let result = orders.value
  if (filterForm.value.orderNo) {
    result = result.filter(o => o.order_no.includes(filterForm.value.orderNo))
  }
  if (filterForm.value.status) {
    result = result.filter(o => o.status === filterForm.value.status)
  }
  return result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
})

const orderItems = computed(() => {
  return availableDishes.value
    .map(dish => ({
      ...dish,
      quantity: orderQuantities.value[dish.id] || 0
    }))
    .filter(item => item.quantity > 0)
})

const orderTotal = computed(() => {
  return orderItems.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
})

function getStatusText(status) {
  const texts = {
    pending: '待接单',
    cooking: '制作中',
    completed: '已完成',
    cancelled: '已取消'
  }
  return texts[status] || status
}

function formatTime(time) {
  return time.split(' ')[1].slice(0, 5)
}

function handleFilter() { }

function resetFilter() {
  filterForm.value = { orderNo: '', status: '', dateRange: [] }
}

function refreshData() { }

function exportOrders() { }

function showOrderDetail(order) {
  selectedOrder.value = order
  showDetailDialog.value = true
}

function closeDetail() {
  showDetailDialog.value = false
  selectedOrder.value = null
}

function updateStatus(order, status) {
  order.status = status
  if (showDetailDialog.value) {
    selectedOrder.value = { ...order }
  }
}

function createOrder() {
  orderQuantities.value = {}
  showCreateDialog.value = true
}

function getQuantity(dishId) {
  return orderQuantities.value[dishId] || 0
}

function increaseQuantity(dishId) {
  orderQuantities.value[dishId] = (orderQuantities.value[dishId] || 0) + 1
}

function decreaseQuantity(dishId) {
  if (orderQuantities.value[dishId] && orderQuantities.value[dishId] > 0) {
    orderQuantities.value[dishId]--
  }
}

function submitOrder() {
  const newOrder = {
    id: Date.now(),
    order_no: `20240115${String(orders.value.length + 1).padStart(3, '0')}`,
    status: 'pending',
    total_amount: orderTotal.value,
    created_at: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
    items: orderItems.value.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      quantity: item.quantity
    }))
  }
  orders.value.unshift(newOrder)
  showCreateDialog.value = false
}

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileUpload(event) {
  const file = event.target.files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const data = new Uint8Array(e.target.result)
    const workbook = XLSX.read(data, { type: 'array' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet)

    const parsedOrders = parseExcelData(jsonData)
    importData.value = parsedOrders
    importPreview.value = parsedOrders.slice(0, 5)
  }
  reader.readAsArrayBuffer(file)
}

function parseExcelData(data) {
  const statusMap = {
    '待接单': 'pending',
    '制作中': 'cooking',
    '已完成': 'completed',
    '已取消': 'cancelled'
  }

  const orderMap = {}

  data.forEach(row => {
    const orderNo = row['订单号'] || row['order_no'] || row['订单编号']
    if (!orderNo) return

    if (!orderMap[orderNo]) {
      orderMap[orderNo] = {
        order_no: String(orderNo),
        status: statusMap[row['状态'] || row['status']] || 'pending',
        total_amount: parseFloat(row['金额'] || row['amount'] || row['total_amount']) || 0,
        created_at: row['时间'] || row['created_at'] || new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
        items: []
      }
    }

    orderMap[orderNo].items.push({
      id: Date.now() + Math.random(),
      name: row['菜品名称'] || row['dish_name'] || row['菜品'],
      price: parseFloat(row['单价'] || row['price']) || 0,
      quantity: parseInt(row['数量'] || row['quantity']) || 1
    })
  })

  return Object.values(orderMap).map((order, index) => ({
    id: Date.now() + index,
    ...order
  }))
}

function confirmImport() {
  importData.value.forEach(order => {
    const exists = orders.value.find(o => o.order_no === order.order_no)
    if (!exists) {
      orders.value.unshift(order)
    }
  })
  alert(`成功导入 ${importData.value.length} 条订单！`)
  showImportDialog.value = false
  importData.value = []
  importPreview.value = []
}

onMounted(() => { })
</script>

<style scoped>
.orders-page {
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-left h2 {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a2e;
  margin: 0;
}

.header-left p {
  color: #666;
  margin: 4px 0 0 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

.filter-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.stat-icon.bg-blue {
  background: linear-gradient(135deg, var(--ds-primary), var(--ds-food));
}

.stat-icon.bg-green {
  background: linear-gradient(135deg, #10b981, #059669);
}

.stat-icon.bg-yellow {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.stat-icon.bg-red {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1a1a2e;
  margin: 0;
}

.stat-label {
  font-size: 13px;
  color: #888;
  margin: 4px 0 0 0;
}

.orders-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.order-card {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.order-card:hover {
  border-color: var(--ds-primary);
  box-shadow: 0 4px 12px rgba(180, 83, 9, 0.14);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.order-no {
  font-weight: 600;
  color: #1a1a2e;
}

.order-status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  margin-left: 12px;
}

.order-status.pending {
  background: #fef3c7;
  color: #d97706;
}

.order-status.cooking {
  background: var(--ds-primary-soft);
  color: var(--ds-primary);
}

.order-status.completed {
  background: #dcfce7;
  color: #16a34a;
}

.order-status.cancelled {
  background: #fee2e2;
  color: #dc2626;
}

.order-time {
  font-size: 13px;
  color: #888;
}

.order-items {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.order-item {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  padding: 8px 12px;
  border-radius: 6px;
}

.item-name {
  font-size: 14px;
  color: #1a1a2e;
}

.item-quantity {
  font-size: 13px;
  color: #666;
}

.item-price {
  font-size: 14px;
  font-weight: 600;
  color: #ef4444;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-total {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.total-label {
  font-size: 14px;
  color: #666;
}

.total-amount {
  font-size: 20px;
  font-weight: 700;
  color: #ef4444;
}

.order-actions {
  display: flex;
  gap: 8px;
}

.order-detail {
  padding: 16px 0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.detail-left h3 {
  margin: 0;
  color: #1a1a2e;
}

.detail-time {
  font-size: 13px;
  color: #888;
  margin: 4px 0 0 0;
}

.detail-status {
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
}

.detail-status.pending {
  background: #fef3c7;
  color: #d97706;
}

.detail-status.cooking {
  background: var(--ds-primary-soft);
  color: var(--ds-primary);
}

.detail-status.completed {
  background: #dcfce7;
  color: #16a34a;
}

.detail-status.cancelled {
  background: #fee2e2;
  color: #dc2626;
}

.detail-section {
  margin-bottom: 24px;
}

.detail-section h4 {
  font-size: 16px;
  color: #1a1a2e;
  margin: 0 0 16px 0;
}

.items-table {
  width: 100%;
  border-collapse: collapse;
}

.items-table th,
.items-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.items-table th {
  font-weight: 600;
  color: #666;
  background: #f8fafc;
}

.detail-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.detail-total {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.create-order {
  max-height: 500px;
  overflow-y: auto;
}

.create-section {
  margin-bottom: 24px;
}

.create-section h4 {
  font-size: 16px;
  color: #1a1a2e;
  margin: 0 0 16px 0;
}

.dish-select-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.dish-select-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.dish-thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
}

.dish-info {
  flex: 1;
}

.dish-info .dish-name {
  font-weight: 600;
  color: #1a1a2e;
  display: block;
}

.dish-info .dish-price {
  font-size: 13px;
  color: #ef4444;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quantity-control span {
  min-width: 32px;
  text-align: center;
  font-weight: 600;
}

.create-summary {
  background: #f8fafc;
  padding: 16px;
  border-radius: 8px;
}

.create-summary h4 {
  font-size: 16px;
  color: #1a1a2e;
  margin: 0 0 12px 0;
}

.summary-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.summary-total {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.import-dialog {
  padding: 16px 0;
}

.import-info {
  background: #f0fdf4;
  border: 1px solid #dcfce7;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.import-info h4 {
  font-size: 16px;
  color: #166534;
  margin: 0 0 12px 0;
}

.import-info ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.import-info li {
  font-size: 14px;
  color: #15803d;
  margin-bottom: 8px;
  padding-left: 20px;
  position: relative;
}

.import-info li::before {
  content: '✓';
  position: absolute;
  left: 0;
  color: #22c55e;
}

.import-upload {
  margin-bottom: 20px;
}

.import-file-input {
  display: none;
}

.upload-area {
  border: 2px dashed #ddd;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-area:hover {
  border-color: var(--ds-primary);
  background: #f8fafc;
}

.upload-area i {
  font-size: 48px;
  color: var(--ds-primary);
  margin-bottom: 16px;
  display: block;
}

.upload-area p {
  margin: 0;
  font-size: 16px;
  color: #666;
}

.upload-hint {
  font-size: 13px !important;
  color: #999 !important;
  margin-top: 8px !important;
}

.import-preview {
  background: #f8fafc;
  border-radius: 8px;
  padding: 16px;
}

.import-preview h4 {
  font-size: 16px;
  color: #1a1a2e;
  margin: 0 0 16px 0;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
}

.preview-table th,
.preview-table td {
  padding: 10px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
  font-size: 13px;
}

.preview-table th {
  background: #f1f5f9;
  font-weight: 600;
  color: #666;
}
</style>
