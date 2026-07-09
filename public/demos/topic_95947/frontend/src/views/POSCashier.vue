<template>
  <div class="pos-cashier">
    <section class="hero ds-card">
      <div>
        <p class="ds-eyebrow">前厅收银</p>
        <h2 class="ds-page-title">堂食 POS 收银台</h2>
        <p class="ds-page-desc">围绕门店、桌台、菜品和结账组织操作，支持直接点单、挂单继续编辑和支付流水沉淀。</p>
      </div>
      <div class="hero-actions">
        <el-button :loading="loading" @click="loadPageData">
          <i class="fas fa-rotate-right"></i>
          刷新
        </el-button>
        <el-button plain :disabled="!activeOrder" @click="resetOrder">
          <i class="fas fa-plus"></i>
          新开订单
        </el-button>
      </div>
    </section>

    <section v-if="errorMessage" class="error-card ds-card" role="alert">
      <i class="fas fa-circle-exclamation"></i>
      <div>
        <strong>POS 数据加载失败</strong>
        <p>{{ errorMessage }}</p>
      </div>
      <el-button type="primary" plain @click="loadPageData">重新加载</el-button>
    </section>

    <section v-if="!loading && stores.length === 0" class="empty-guide ds-card">
      <div class="empty-visual">
        <i class="fas fa-store-slash"></i>
      </div>
      <p class="ds-eyebrow">POS 前置配置</p>
      <h3>还没有可收银的门店</h3>
      <p class="empty-copy">创建门店后，系统才能绑定桌台、菜单和 POS 订单，让堂食点单与结账进入完整闭环。</p>
      <div class="setup-steps" aria-label="POS 收银启用步骤">
        <div class="setup-step">
          <span>1</span>
          <strong>创建门店</strong>
          <small>确定订单归属</small>
        </div>
        <div class="setup-step">
          <span>2</span>
          <strong>配置桌台</strong>
          <small>支持开台点单</small>
        </div>
        <div class="setup-step">
          <span>3</span>
          <strong>维护菜品</strong>
          <small>同步菜单价格</small>
        </div>
        <div class="setup-step">
          <span>4</span>
          <strong>开始收银</strong>
          <small>挂单与结账</small>
        </div>
      </div>
      <div class="empty-actions">
        <el-button type="primary" size="large" @click="$router.push('/stores')">创建门店</el-button>
        <el-button size="large" plain @click="$router.push('/table-management')">查看桌台配置</el-button>
      </div>
    </section>

    <section v-else class="filter-card ds-card">
      <el-select v-model="selectedStoreId" class="filter-select" placeholder="请选择门店" @change="handleStoreChange">
        <el-option v-for="store in stores" :key="store.id" :label="store.name" :value="store.id" />
      </el-select>
      <el-select v-model="selectedTableId" class="filter-select" clearable placeholder="选择桌台 / 可留空"
        @change="handleTableChange">
        <el-option v-for="table in enabledTables" :key="table.id" :label="`${table.table_no} · ${table.name}`"
          :value="table.id" />
      </el-select>
      <el-input v-model="dishKeyword" class="search-input" clearable placeholder="搜索菜品名称">
        <template #prefix><i class="fas fa-search"></i></template>
      </el-input>
      <span class="filter-hint">当前门店 {{ currentStoreName }} · {{ currentTableLabel }}</span>
    </section>

    <section v-if="loading || stores.length > 0" class="pos-grid">
      <aside class="tables-panel ds-card">
        <div class="section-title">
          <div>
            <h3>桌台选择</h3>
            <p>选择已启用桌台，使用中桌台会自动尝试载入当前 POS 订单。</p>
          </div>
        </div>
        <DataStateBlock v-if="loading" loading :rows="5" compact min-height="210px" />
        <DataStateBlock v-else-if="enabledTables.length === 0" icon="fas fa-chair" title="当前门店还没有可用桌台"
          description="可以先创建桌台，也可以不选桌台直接从菜品区开始点单。" min-height="210px">
          <template #actions>
            <el-button type="primary" plain @click="$router.push('/table-management')">配置桌台</el-button>
          </template>
        </DataStateBlock>
        <div v-else class="table-list">
          <button v-for="table in enabledTables" :key="table.id" type="button"
            :class="['table-option', { active: selectedTableId === table.id }]" @click="selectTable(table)">
            <span>
              <strong>{{ table.table_no }} · {{ table.name }}</strong>
              <small>{{ table.area_name || '未分区' }} · {{ table.seats }} 人桌</small>
            </span>
            <el-tag size="small" :type="tableTagType(table)" effect="plain">{{ tableStatusLabel(table.status)
              }}</el-tag>
          </button>
        </div>

        <div class="suspended-block">
          <div class="section-title compact">
            <div>
              <h3>待处理订单</h3>
              <p>支持挂单后继续编辑或发起结账。</p>
            </div>
          </div>
          <DataStateBlock v-if="pendingOrders.length === 0" icon="fas fa-receipt" title="暂无待处理订单"
            description="挂单、待收款和草稿订单会显示在这里。" compact min-height="150px" />
          <div v-else class="order-list">
            <button v-for="order in pendingOrders" :key="order.id" type="button"
              :class="['order-option', { active: activeOrder?.id === order.id }]" @click="continueOrder(order)">
              <span>
                <strong>{{ order.order_no }}</strong>
                <small>{{ order.table_name || order.table_no || '未关联桌台' }} · {{ orderStatusLabel(order.status)
                  }}</small>
              </span>
              <b>{{ formatFen(order.payable_amount) }}</b>
            </button>
          </div>
        </div>
      </aside>

      <article class="dishes-panel ds-card">
        <div class="section-title">
          <div>
            <h3>菜品选择</h3>
            <p>菜品来自现有菜单，最终金额由后端按菜品价格重新计算。</p>
          </div>
          <el-tag effect="plain">{{ filteredDishes.length }} 道可选</el-tag>
        </div>
        <div v-if="loading" class="dish-skeleton-grid">
          <el-skeleton v-for="index in 4" :key="index" class="dish-skeleton" animated>
            <template #template>
              <el-skeleton-item variant="circle" style="width: 42px; height: 42px" />
              <div class="skeleton-lines">
                <el-skeleton-item variant="text" style="width: 72%" />
                <el-skeleton-item variant="text" style="width: 52%" />
                <el-skeleton-item variant="text" style="width: 42%" />
              </div>
            </template>
          </el-skeleton>
        </div>
        <DataStateBlock v-else-if="dishes.length === 0" icon="fas fa-utensils" title="暂无可售菜品"
          description="维护菜品名称、价格和上架状态后，POS 收银台才能加入购物车。" min-height="210px">
          <template #actions>
            <el-button type="primary" @click="$router.push('/menu')">维护菜单</el-button>
          </template>
        </DataStateBlock>
        <DataStateBlock v-else-if="filteredDishes.length === 0" icon="fas fa-magnifying-glass" title="没有匹配菜品"
          description="请换一个菜品名称，或清空搜索条件后再试。" min-height="210px" />
        <div v-else class="dish-grid">
          <button v-for="dish in filteredDishes" :key="dish.id" type="button" class="dish-card" @click="addDish(dish)">
            <span class="dish-icon"><i class="fas fa-utensils"></i></span>
            <span class="dish-copy">
              <strong>{{ dish.name }}</strong>
              <small>{{ dish.description || '暂无描述' }}</small>
            </span>
            <b>{{ formatFen(dish.price) }}</b>
          </button>
        </div>
        <div v-if="!loading && filteredDishes.length > 0" class="pos-flow-panel">
          <div>
            <span class="flow-icon"><i class="fas fa-arrow-pointer"></i></span>
            <strong>点单流程</strong>
            <small>选桌台 / 可留空 → 点菜 → 挂单或发起结账，支付流水会自动进入对账。</small>
          </div>
          <div>
            <span class="flow-icon"><i class="fas fa-receipt"></i></span>
            <strong>当前草稿</strong>
            <small>{{ cartItems.length }} 个菜品 · 应收 {{ formatFen(summary.payable) }}</small>
          </div>
        </div>
      </article>

      <aside class="cart-panel ds-card">
        <div class="section-title">
          <div>
            <h3>购物车与结算</h3>
            <p>{{ activeOrder ? `订单号 ${activeOrder.order_no}` : '新订单尚未提交，挂单或结账时自动创建' }}</p>
          </div>
          <el-tag :type="activeOrder ? statusTagType(activeOrder.status) : 'info'" effect="plain">
            {{ activeOrder ? orderStatusLabel(activeOrder.status) : '草稿' }}
          </el-tag>
        </div>

        <DataStateBlock v-if="cartItems.length === 0" icon="fas fa-basket-shopping" title="购物车为空"
          description="选择桌台后从菜品区加入菜品，系统会在挂单或结账时自动创建 POS 订单。" min-height="180px" />
        <div v-else class="cart-list">
          <div v-for="item in cartItems" :key="item.id || item.dish_id" class="cart-item">
            <div>
              <strong>{{ item.dish_name || item.name }}</strong>
              <small>{{ formatFen(item.unit_price ?? item.price) }} / 份</small>
            </div>
            <div class="quantity-box">
              <el-button size="small" circle :disabled="operating" @click="changeQuantity(item, item.quantity - 1)">
                <i class="fas fa-minus"></i>
              </el-button>
              <span>{{ item.quantity }}</span>
              <el-button size="small" circle :disabled="operating" @click="changeQuantity(item, item.quantity + 1)">
                <i class="fas fa-plus"></i>
              </el-button>
            </div>
            <b>{{ formatFen(item.total_amount ?? item.price * item.quantity) }}</b>
          </div>
        </div>

        <div class="summary-box">
          <div><span>菜品小计</span><strong>{{ formatFen(summary.subtotal) }}</strong></div>
          <div><span>优惠金额</span><strong>-{{ formatFen(summary.discount) }}</strong></div>
          <div><span>抹零</span><strong>-{{ formatFen(summary.rounding) }}</strong></div>
          <div class="payable"><span>应收金额</span><strong>{{ formatFen(summary.payable) }}</strong></div>
        </div>

        <div class="cart-actions">
          <el-button :disabled="cartItems.length === 0 || operating" @click="suspendCurrentOrder">挂单</el-button>
          <el-button :disabled="cartItems.length === 0 || operating" type="warning" plain
            @click="cancelCurrentOrder">取消订单</el-button>
          <el-button :disabled="cartItems.length === 0 || operating" type="primary"
            @click="openCheckoutDialog">发起结账</el-button>
        </div>
      </aside>
    </section>

    <el-dialog v-model="checkoutDialogVisible" title="发起结账" width="480px" destroy-on-close>
      <div class="checkout-preview">
        <p>请选择本次收款渠道，确认后会调用 POS 结账接口并同步创建支付流水，用于支付对账汇总。</p>
        <el-form label-width="90px">
          <el-form-item label="支付方式">
            <el-select v-model="paymentMethod" placeholder="请选择支付方式">
              <el-option v-for="method in paymentMethods" :key="method.value" :label="method.label"
                :value="method.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="应收金额">
            <strong class="checkout-amount">{{ formatFen(summary.payable) }}</strong>
          </el-form-item>
          <el-form-item label="流水说明">
            <span class="checkout-note">{{ paymentMethodLabel(paymentMethod) }}收款 · POS 自动记账</span>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="checkoutDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="operating" @click="checkoutCurrentOrder">确认结账</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { dishApi, merchantApi, posApi, tableApi } from '@/api'
import DataStateBlock from '@/components/DataStateBlock.vue'

const stores = ref([])
const tables = ref([])
const dishes = ref([])
const orders = ref([])
const activeOrder = ref(null)
const localCart = ref([])
const loading = ref(false)
const operating = ref(false)
const errorMessage = ref('')
const selectedStoreId = ref('')
const selectedTableId = ref('')
const dishKeyword = ref('')
const checkoutDialogVisible = ref(false)
const paymentMethod = ref('cash')

const paymentMethods = [
  { label: '现金', value: 'cash' },
  { label: '微信', value: 'wechat' },
  { label: '支付宝', value: 'alipay' },
  { label: '储值', value: 'stored_value' },
  { label: '银行卡', value: 'bank_card' },
  { label: '其他', value: 'other' }
]
const editableStatuses = ['draft', 'pending_payment', 'suspended']
const pendingStatuses = ['draft', 'pending_payment', 'suspended']

const currentStoreName = computed(() => stores.value.find(store => store.id === selectedStoreId.value)?.name || '未选择门店')
const selectedTable = computed(() => tables.value.find(table => table.id === selectedTableId.value) || null)
const currentTableLabel = computed(() => selectedTable.value ? `${selectedTable.value.table_no} · ${selectedTable.value.name}` : '未选择桌台')
const enabledTables = computed(() => tables.value.filter(table => table.enabled === 1))
const filteredDishes = computed(() => {
  const keyword = dishKeyword.value.trim().toLowerCase()
  return dishes.value.filter(dish => {
    const enabled = dish.status === undefined || dish.status === 1
    const inStore = !selectedStoreId.value || dish.store_id === selectedStoreId.value
    const matched = !keyword || `${dish.name || ''}${dish.description || ''}`.toLowerCase().includes(keyword)
    return enabled && inStore && matched
  })
})
const pendingOrders = computed(() => orders.value.filter(order => pendingStatuses.includes(order.status)))
const cartItems = computed(() => activeOrder.value?.items || localCart.value)
const summary = computed(() => {
  if (activeOrder.value) {
    return {
      subtotal: activeOrder.value.subtotal_amount || 0,
      discount: activeOrder.value.discount_amount || 0,
      rounding: activeOrder.value.rounding_amount || 0,
      payable: activeOrder.value.payable_amount || 0
    }
  }
  const subtotal = localCart.value.reduce((sum, item) => sum + item.price * item.quantity, 0)
  return { subtotal, discount: 0, rounding: 0, payable: subtotal }
})

onMounted(loadPageData)

async function loadPageData() {
  loading.value = true
  errorMessage.value = ''
  try {
    stores.value = await merchantApi.getStores({ silentError: true })
    if (!selectedStoreId.value && stores.value.length > 0) selectedStoreId.value = stores.value[0].id
    if (selectedStoreId.value) {
      await Promise.all([loadTables(), loadDishes(), loadOrders()])
    } else {
      tables.value = []
      dishes.value = []
      orders.value = []
    }
  } catch (error) {
    console.error('Failed to load POS cashier data:', error)
    errorMessage.value = getErrorText(error, '请检查网络或后端 POS 接口是否正常')
  } finally {
    loading.value = false
  }
}

async function loadTables() {
  const result = await tableApi.getTables({ store_id: selectedStoreId.value, enabled: 1 }, { silentError: true })
  tables.value = result.items || []
}

async function loadDishes() {
  const result = await dishApi.getDishes({ store_id: selectedStoreId.value })
  dishes.value = result.data || result || []
}

async function loadOrders() {
  const responses = await Promise.all(pendingStatuses.map(status => posApi.getOrders({ store_id: selectedStoreId.value, status }, { silentError: true })))
  const merged = responses.flatMap(result => result.items || [])
  orders.value = Array.from(new Map(merged.map(order => [order.id, order])).values())
}

async function handleStoreChange() {
  resetOrder()
  selectedTableId.value = ''
  await Promise.all([loadTables(), loadDishes(), loadOrders()])
}

async function handleTableChange() {
  const table = selectedTable.value
  if (table?.current_pos_order_id) {
    await loadActiveOrder(table.current_pos_order_id)
  }
}

async function selectTable(table) {
  selectedTableId.value = table.id
  await handleTableChange()
}

async function continueOrder(order) {
  selectedStoreId.value = order.store_id
  selectedTableId.value = order.table_id || ''
  await loadActiveOrder(order.id)
  ElMessage.success('已载入挂单，可继续编辑')
}

async function loadActiveOrder(orderId) {
  try {
    activeOrder.value = await posApi.getOrder(orderId, { silentError: true })
    localCart.value = []
  } catch (error) {
    ElMessage.error(getErrorText(error, '订单载入失败'))
  }
}

async function addDish(dish) {
  if (!selectedStoreId.value) {
    ElMessage.warning('请先选择门店')
    return
  }
  if (activeOrder.value && !editableStatuses.includes(activeOrder.value.status)) {
    ElMessage.warning('当前订单状态不允许继续加菜')
    return
  }
  if (activeOrder.value) {
    await runOperation(async () => {
      activeOrder.value = await posApi.addOrderItem(activeOrder.value.id, { dish_id: dish.id, quantity: 1 })
      await loadOrders()
    }, '加菜成功')
    return
  }
  const existing = localCart.value.find(item => item.dish_id === dish.id)
  if (existing) {
    existing.quantity += 1
  } else {
    localCart.value.push({
      id: `local-${dish.id}`,
      dish_id: dish.id,
      name: dish.name,
      dish_name: dish.name,
      price: Number(dish.price || 0),
      unit_price: Number(dish.price || 0),
      quantity: 1
    })
  }
}

async function changeQuantity(item, quantity) {
  if (quantity < 0) return
  if (activeOrder.value) {
    await runOperation(async () => {
      activeOrder.value = await posApi.updateOrderItemQuantity(activeOrder.value.id, item.id, quantity)
      await loadOrders()
    })
    return
  }
  if (quantity === 0) {
    localCart.value = localCart.value.filter(cartItem => cartItem.dish_id !== item.dish_id)
  } else {
    item.quantity = quantity
  }
}

async function createOrderIfNeeded() {
  if (activeOrder.value) return activeOrder.value
  if (localCart.value.length === 0) throw new Error('请先选择菜品')
  const table = selectedTable.value
  activeOrder.value = await posApi.createOrder({
    store_id: selectedStoreId.value,
    table_id: selectedTableId.value || undefined,
    table_session_id: table?.active_session?.id || table?.current_session_id || undefined,
    party_size: table?.active_session?.party_size || 1,
    note: 'POS 收银台创建',
    items: localCart.value.map(item => ({
      dish_id: item.dish_id,
      quantity: item.quantity
    }))
  })
  localCart.value = []
  return activeOrder.value
}

async function suspendCurrentOrder() {
  if (cartItems.value.length === 0) {
    ElMessage.warning('请先加入菜品再挂单')
    return
  }
  await runOperation(async () => {
    const order = await createOrderIfNeeded()
    activeOrder.value = await posApi.suspendOrder(order.id, { note: '前台暂不收款，挂单保留' })
    await Promise.all([loadTables(), loadOrders()])
  }, '挂单成功')
}

async function cancelCurrentOrder() {
  if (!activeOrder.value) {
    localCart.value = []
    ElMessage.success('已清空本地购物车')
    return
  }
  try {
    await ElMessageBox.confirm('确定取消当前 POS 订单？取消后不可继续编辑。', '取消订单', { type: 'warning' })
  } catch {
    return
  }
  await runOperation(async () => {
    activeOrder.value = await posApi.cancelOrder(activeOrder.value.id, { reason: '前台取消订单' })
    resetOrder()
    await Promise.all([loadTables(), loadOrders()])
  }, '订单已取消')
}

function openCheckoutDialog() {
  if (cartItems.value.length === 0) {
    ElMessage.warning('请先加入菜品再结账')
    return
  }
  paymentMethod.value = paymentMethod.value || 'cash'
  checkoutDialogVisible.value = true
}

async function checkoutCurrentOrder() {
  if (!paymentMethod.value) {
    ElMessage.warning('请选择支付方式')
    return
  }
  await runOperation(async () => {
    const order = await createOrderIfNeeded()
    activeOrder.value = await posApi.checkoutOrder(order.id, {
      payment_method: paymentMethod.value,
      payment_amount_fen: order.payable_amount,
      note: `POS收银台${paymentMethodLabel(paymentMethod.value)}收款`
    })
    checkoutDialogVisible.value = false
    resetOrder()
    await Promise.all([loadTables(), loadOrders()])
  }, '结账成功，支付流水已创建')
}

function resetOrder() {
  activeOrder.value = null
  localCart.value = []
}

async function runOperation(task, successMessage = '') {
  operating.value = true
  try {
    await task()
    if (successMessage) ElMessage.success(successMessage)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error(getErrorText(error, '操作失败，请稍后重试'))
    }
  } finally {
    operating.value = false
  }
}

function formatFen(value) {
  return `¥${(Number(value || 0) / 100).toFixed(2)}`
}

function tableStatusLabel(status) {
  const labels = { available: '空闲', occupied: '使用中', reserved: '已预订', cleaning: '清洁中', disabled: '已停用' }
  return labels[status] || status || '未知'
}

function tableTagType(table) {
  const types = { available: 'success', occupied: 'warning', reserved: 'primary', cleaning: 'warning', disabled: 'info' }
  return types[table.status] || 'info'
}

function orderStatusLabel(status) {
  const labels = {
    draft: '草稿',
    pending_payment: '待收款',
    suspended: '已挂单',
    paid: '已支付',
    cancelled: '已取消',
    refunded: '已退款',
    partially_refunded: '部分退款'
  }
  return labels[status] || status || '未知'
}

function statusTagType(status) {
  const types = { paid: 'success', cancelled: 'danger', suspended: 'warning', pending_payment: 'primary', draft: 'info' }
  return types[status] || 'info'
}

function paymentMethodLabel(value) {
  const labels = { cash: '现金', wechat: '微信', alipay: '支付宝', stored_value: '储值', bank_card: '银行卡', other: '其他' }
  return labels[value] || '其他'
}

function getErrorText(error, fallback) {
  const detail = error?.response?.data?.detail
  if (Array.isArray(detail)) return detail.map(item => item.msg || item.message).filter(Boolean).join('，') || fallback
  return detail || error?.message || fallback
}
</script>

<style scoped>
.pos-cashier {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.hero,
.filter-card,
.error-card,
.section-title,
.cart-item,
.summary-box div,
.hero-actions,
.cart-actions {
  display: flex;
  align-items: center;
}

.hero,
.error-card {
  justify-content: space-between;
  gap: 16px;
}

.hero {
  padding: 12px 16px;
}

.hero :deep(.ds-page-title),
.hero .ds-page-title {
  font-size: 24px;
}

.hero .ds-page-desc {
  margin-top: 4px;
  font-size: 13px;
  line-height: 1.5;
}

.hero .ds-eyebrow {
  margin-bottom: 5px;
  font-size: 12px;
}

.hero-actions,
.cart-actions {
  gap: 10px;
  flex-wrap: wrap;
}

.error-card {
  color: #991b1b;
  background: #fff7ed;
  border-color: #fed7aa;
}

.error-card>i {
  font-size: 24px;
  color: #f97316;
}

.error-card p,
.section-title p,
.dish-copy small,
.table-option small,
.order-option small,
.cart-item small {
  margin: 4px 0 0;
  color: var(--ds-muted);
  font-size: 12px;
}

.filter-card {
  gap: 10px;
  flex-wrap: wrap;
  padding: 8px 10px;
  position: sticky;
  top: 78px;
  z-index: 5;
  backdrop-filter: blur(12px);
  background: rgba(255, 253, 250, 0.92);
}

.filter-select {
  width: 210px;
}

.search-input {
  width: 260px;
}

.filter-hint {
  margin-left: auto;
  color: var(--ds-muted);
  font-size: 13px;
  white-space: nowrap;
}

.empty-guide {
  text-align: center;
  max-width: 920px;
  margin: 0 auto;
  padding: 32px 28px;
}

.empty-visual {
  width: 86px;
  height: 86px;
  margin: 0 auto 18px;
  border: 1px solid rgba(180, 83, 9, 0.16);
  border-radius: 28px;
  color: var(--ds-primary);
  background:
    radial-gradient(circle at 30% 20%, rgba(249, 115, 22, 0.2), transparent 42%),
    var(--ds-food-soft);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 14px 34px rgba(180, 83, 9, 0.1);
}

.empty-visual i {
  font-size: 38px;
  color: var(--ds-primary);
}

.empty-guide h3 {
  margin: 8px 0 10px;
  color: var(--ds-text);
  font-size: 24px;
}

.empty-copy {
  max-width: 620px;
  margin: 0 auto;
  color: var(--ds-muted);
  line-height: 1.75;
}

.setup-steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin: 20px 0;
  text-align: left;
}

.setup-step {
  min-height: 96px;
  padding: 14px;
  border: 1px solid var(--ds-border);
  border-radius: 18px;
  background: rgba(255, 253, 250, 0.72);
}

.setup-step span {
  width: 28px;
  height: 28px;
  margin-bottom: 12px;
  border-radius: 10px;
  color: #92400e;
  background: var(--ds-primary-soft);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 900;
}

.setup-step strong,
.setup-step small {
  display: block;
}

.setup-step strong {
  color: var(--ds-text);
  font-size: 15px;
}

.setup-step small {
  margin-top: 5px;
  color: var(--ds-muted);
  line-height: 1.5;
}

.empty-actions {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
}

.pos-grid {
  display: grid;
  grid-template-columns: minmax(250px, 300px) minmax(420px, 1fr) minmax(300px, 340px);
  gap: 12px;
  align-items: stretch;
}

.tables-panel,
.dishes-panel,
.cart-panel {
  min-width: 0;
  padding: 14px;
}

.tables-panel,
.dishes-panel {
  display: flex;
  flex-direction: column;
}

.section-title {
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.section-title h3 {
  margin: 0;
  color: var(--ds-text);
  font-size: 16px;
}

.section-title.compact {
  margin-top: 14px;
}

.table-list,
.order-list,
.cart-list {
  display: grid;
  gap: 10px;
}

.dish-skeleton-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(190px, 1fr));
  gap: 10px;
}

.dish-skeleton {
  min-height: 96px;
  padding: 12px;
  border: 1px solid var(--ds-border);
  border-radius: 18px;
  background: #fffefa;
}

.dish-skeleton :deep(.el-skeleton__template) {
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 12px;
  align-items: start;
}

.skeleton-lines {
  display: grid;
  gap: 10px;
}

.table-option,
.order-option,
.dish-card {
  width: 100%;
  border: 1px solid var(--ds-border);
  background: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: left;
}

.table-option,
.order-option {
  padding: 10px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.table-option:hover,
.table-option.active,
.order-option:hover,
.order-option.active,
.dish-card:hover {
  border-color: var(--ds-primary);
  background: var(--ds-primary-soft);
  transform: translateY(-1px);
}

.dish-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(176px, 1fr));
  gap: 10px;
}

.pos-flow-panel {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.pos-flow-panel>div {
  min-height: 82px;
  padding: 14px;
  border: 1px dashed rgba(180, 83, 9, 0.22);
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(255, 247, 237, 0.74), rgba(255, 253, 250, 0.96));
}

.flow-icon {
  width: 30px;
  height: 30px;
  margin-bottom: 8px;
  border-radius: 11px;
  color: var(--ds-primary);
  background: var(--ds-primary-soft);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.pos-flow-panel strong,
.pos-flow-panel small {
  display: block;
}

.pos-flow-panel small {
  margin-top: 4px;
  color: var(--ds-muted);
  line-height: 1.45;
}

.dish-card {
  min-height: 86px;
  padding: 10px;
  border-radius: 16px;
  display: grid;
  grid-template-columns: 42px 1fr;
  gap: 10px;
}

.dish-card b {
  grid-column: 2;
  color: #dc2626;
  font-size: 18px;
}

.dish-icon {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  color: #c2410c;
  background: var(--ds-food-soft);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.dish-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.cart-panel {
  position: sticky;
  top: 92px;
}

.cart-item {
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--ds-border);
  border-radius: 16px;
  background: #fff;
}

.cart-item>div:first-child {
  flex: 1;
  min-width: 0;
}

.cart-item b,
.order-option b {
  color: #dc2626;
}

.quantity-box {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.quantity-box span {
  min-width: 22px;
  text-align: center;
  font-weight: 800;
}

.summary-box {
  margin-top: 12px;
  padding: 12px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(255, 247, 237, 0.72), rgba(255, 253, 250, 0.96));
}

.summary-box div {
  justify-content: space-between;
  padding: 6px 0;
  color: var(--ds-muted);
}

.summary-box .payable {
  margin-top: 6px;
  padding-top: 12px;
  border-top: 1px dashed var(--ds-border);
  color: var(--ds-text);
  font-size: 18px;
}

.summary-box .payable strong,
.checkout-amount {
  color: #dc2626;
  font-size: 24px;
}

.cart-actions {
  margin-top: 12px;
  justify-content: flex-end;
}

.tables-panel :deep(.data-state),
.dishes-panel :deep(.data-state),
.cart-panel :deep(.data-state) {
  min-height: 148px;
  padding: 18px 14px;
}

.checkout-preview p {
  margin: 0 0 18px;
  color: var(--ds-muted);
  line-height: 1.7;
}

.checkout-note {
  color: var(--ds-muted);
  font-size: 13px;
}

@media (max-width: 1280px) {
  .pos-grid {
    grid-template-columns: 260px 1fr;
  }

  .cart-panel {
    grid-column: 1 / -1;
    position: static;
  }
}

@media (max-width: 900px) {

  .hero,
  .error-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .filter-select,
  .search-input {
    width: 100%;
  }

  .setup-steps {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .pos-grid {
    grid-template-columns: 1fr;
  }

  .pos-flow-panel {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .empty-guide {
    padding: 36px 20px;
  }

  .setup-steps {
    grid-template-columns: 1fr;
  }
}
</style>
