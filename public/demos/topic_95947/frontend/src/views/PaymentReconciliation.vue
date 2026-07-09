<template>
  <div class="payment-reconciliation">
    <section class="hero ds-card">
      <div>
        <p class="ds-eyebrow">收款核对</p>
        <h2 class="ds-page-title">支付对账</h2>
        <p class="ds-page-desc">聚合 POS 支付流水，按日期、门店和渠道核对收款、退款、净收款与异常差异。</p>
      </div>
      <div class="hero-actions">
        <el-button :loading="loading" @click="loadPageData">
          <i class="fas fa-rotate-right"></i>
          刷新数据
        </el-button>
        <el-button type="primary" :loading="generating" :disabled="!selectedDate" @click="generateDaily">
          <i class="fas fa-calculator"></i>
          生成日对账
        </el-button>
      </div>
    </section>

    <section v-if="errorMessage" class="error-card ds-card" role="alert">
      <i class="fas fa-circle-exclamation"></i>
      <div>
        <strong>支付对账数据加载失败</strong>
        <p>{{ errorMessage }}</p>
      </div>
      <el-button type="primary" plain @click="loadPageData">重新加载</el-button>
    </section>

    <section class="filter-card ds-card">
      <el-date-picker v-model="selectedDate" value-format="YYYY-MM-DD" type="date" placeholder="选择对账日期"
        :clearable="false" @change="loadReconciliationData" />
      <el-select v-model="selectedStoreId" class="filter-select" clearable placeholder="全部门店"
        @change="loadReconciliationData">
        <el-option v-for="store in stores" :key="store.id" :label="store.name" :value="store.id" />
      </el-select>
      <el-select v-model="selectedChannel" class="filter-select" clearable placeholder="全部渠道"
        @change="loadReconciliationData">
        <el-option v-for="channel in paymentChannels" :key="channel.value" :label="channel.label"
          :value="channel.value" />
      </el-select>
      <span class="filter-hint">{{ selectedDate }} · {{ selectedStoreName }} · {{ selectedChannelLabel }}</span>
    </section>

    <section v-if="!loading && stores.length === 0" class="empty-guide ds-card">
      <i class="fas fa-store-slash"></i>
      <h3>暂无门店数据</h3>
      <p>支付流水必须归属门店。请先在「门店管理」创建门店，再进行 POS 收银和支付对账。</p>
    </section>

    <template v-else>
      <section class="summary-grid">
        <article v-if="loading" v-for="index in 4" :key="`metric-loading-${index}`" class="metric-card ds-card">
          <el-skeleton animated>
            <template #template>
              <div class="metric-skeleton">
                <el-skeleton-item variant="circle" style="width: 44px; height: 44px" />
                <div>
                  <el-skeleton-item variant="text" style="width: 72px" />
                  <el-skeleton-item variant="text" style="width: 96px" />
                  <el-skeleton-item variant="text" style="width: 64px" />
                </div>
              </div>
            </template>
          </el-skeleton>
        </article>
        <article v-else v-for="card in summaryCards" :key="card.label" class="metric-card ds-card">
          <span class="metric-icon"><i :class="card.icon"></i></span>
          <div>
            <p>{{ card.label }}</p>
            <strong>{{ card.money ? formatFen(card.value) : card.value }}</strong>
            <small>{{ card.hint }}</small>
          </div>
        </article>
      </section>

      <section class="reconciliation-grid">
        <article class="ds-card daily-card">
          <div class="section-title">
            <div>
              <h3>日汇总</h3>
              <p>展示当前筛选条件下的收款、退款、净收款与对账状态。</p>
            </div>
            <el-tag effect="plain">{{ dailyItems.length }} 条</el-tag>
          </div>
          <DataStateBlock v-if="loading" loading :rows="4" />
          <DataStateBlock v-else-if="dailyItems.length === 0" icon="fas fa-calendar-day" title="暂无日汇总"
            description="完成 POS 收款后可点击“生成日对账”，系统会按日期、门店和渠道汇总收退款。">
            <template #actions>
              <el-button type="primary" plain :loading="generating" @click="generateDaily">生成日对账</el-button>
            </template>
          </DataStateBlock>
          <el-table v-else :data="dailyItems" class="ds-table" border>
            <el-table-column label="门店" min-width="140">
              <template #default="{ row }">{{ storeName(row.store_id) }}</template>
            </el-table-column>
            <el-table-column label="渠道" width="110">
              <template #default="{ row }">{{ channelLabel(row.channel) }}</template>
            </el-table-column>
            <el-table-column label="收款" min-width="110">
              <template #default="{ row }">{{ formatFen(row.payment_amount) }}</template>
            </el-table-column>
            <el-table-column label="退款" min-width="110">
              <template #default="{ row }">{{ formatFen(row.refund_amount) }}</template>
            </el-table-column>
            <el-table-column label="净收款" min-width="110">
              <template #default="{ row }"><strong>{{ formatFen(row.net_amount) }}</strong></template>
            </el-table-column>
            <el-table-column label="状态" width="110">
              <template #default="{ row }">
                <el-tag :type="reconciliationStatusType(row)" effect="plain">{{ reconciliationStatusLabel(row.status)
                  }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </article>

        <article class="ds-card channel-card">
          <div class="section-title">
            <div>
              <h3>渠道汇总</h3>
              <p>按支付方式汇总流水笔数和净收款。</p>
            </div>
            <el-tag type="success" effect="plain">{{ channelRows.length }} 个渠道</el-tag>
          </div>
          <DataStateBlock v-if="loading" loading :rows="4" />
          <DataStateBlock v-else-if="channelRows.length === 0" icon="fas fa-wallet" title="暂无渠道汇总"
            description="当前日期和筛选条件下没有支付流水，换一天或完成 POS 结账后再查看。" />
          <div v-else class="channel-list">
            <div v-for="row in channelRows" :key="row.channel" class="channel-row">
              <span class="channel-icon"><i :class="channelIcon(row.channel)"></i></span>
              <div>
                <strong>{{ channelLabel(row.channel) }}</strong>
                <small>{{ row.payment_count }} 笔收款 · {{ row.refund_count }} 笔退款</small>
              </div>
              <b>{{ formatFen(row.net_amount) }}</b>
            </div>
          </div>
        </article>

        <article class="ds-card payments-card">
          <div class="section-title">
            <div>
              <h3>流水明细</h3>
              <p>展示所选日期的支付流水，可用于核对订单与渠道金额。</p>
            </div>
            <el-tag effect="plain">{{ filteredPayments.length }} 笔</el-tag>
          </div>
          <DataStateBlock v-if="loading" loading :rows="5" />
          <DataStateBlock v-else-if="filteredPayments.length === 0" icon="fas fa-receipt" title="暂无流水明细"
            description="POS 收银完成结账后，支付流水会自动进入这里用于核对。">
            <template #actions>
              <el-button type="primary" plain @click="$router.push('/pos-cashier')">去 POS 收银</el-button>
            </template>
          </DataStateBlock>
          <el-table v-else :data="filteredPayments" class="ds-table" border>
            <el-table-column prop="payment_no" label="流水号" min-width="180" />
            <el-table-column label="门店" min-width="130">
              <template #default="{ row }">{{ storeName(row.store_id) }}</template>
            </el-table-column>
            <el-table-column label="渠道" width="100">
              <template #default="{ row }">{{ channelLabel(row.channel) }}</template>
            </el-table-column>
            <el-table-column label="金额" width="120">
              <template #default="{ row }"><strong>{{ formatFen(row.amount) }}</strong></template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'success' ? 'success' : 'info'" effect="plain">{{
                  paymentStatusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="支付时间" min-width="170">
              <template #default="{ row }">{{ formatDateTime(row.paid_at) }}</template>
            </el-table-column>
          </el-table>
        </article>

        <article class="ds-card variance-card">
          <div class="section-title">
            <div>
              <h3>差异提示</h3>
              <p>自动提示对账差异，优先关注未处理或金额不一致的渠道。</p>
            </div>
            <el-tag :type="varianceRows.length ? 'danger' : 'success'" effect="plain">
              {{ varianceRows.length ? `${varianceRows.length} 个提示` : '无差异' }}
            </el-tag>
          </div>
          <DataStateBlock v-if="loading" loading :rows="4" compact />
          <DataStateBlock v-else-if="varianceRows.length === 0" icon="fas fa-shield-check" title="暂无对账差异"
            description="当前筛选条件下没有发现未处理差异。" tone="success" compact />
          <div v-else class="variance-list">
            <div v-for="item in varianceRows" :key="item.key" class="variance-item">
              <i class="fas fa-triangle-exclamation"></i>
              <div>
                <strong>{{ item.title }}</strong>
                <p>{{ item.description }}</p>
              </div>
              <b>{{ formatFen(item.amount) }}</b>
            </div>
          </div>
        </article>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { merchantApi, paymentApi, reconciliationApi } from '@/api'
import DataStateBlock from '@/components/DataStateBlock.vue'

const stores = ref([])
const dailyItems = ref([])
const payments = ref([])
const variances = ref([])
const selectedDate = ref(formatDate(new Date()))
const selectedStoreId = ref('')
const selectedChannel = ref('')
const loading = ref(false)
const generating = ref(false)
const errorMessage = ref('')

const paymentChannels = [
  { label: '现金', value: 'cash', icon: 'fas fa-money-bill-wave' },
  { label: '微信', value: 'wechat', icon: 'fab fa-weixin' },
  { label: '支付宝', value: 'alipay', icon: 'fas fa-mobile-screen-button' },
  { label: '储值', value: 'stored_value', icon: 'fas fa-wallet' },
  { label: '银行卡', value: 'bank_card', icon: 'fas fa-credit-card' },
  { label: '其他', value: 'other', icon: 'fas fa-ellipsis' }
]

const selectedStoreName = computed(() => selectedStoreId.value ? storeName(selectedStoreId.value) : '全部门店')
const selectedChannelLabel = computed(() => selectedChannel.value ? channelLabel(selectedChannel.value) : '全部渠道')
const filteredPayments = computed(() => payments.value.filter(item => {
  const paidDate = formatDate(new Date(item.paid_at))
  return paidDate === selectedDate.value
}))
const totals = computed(() => dailyItems.value.reduce((acc, item) => {
  acc.paymentAmount += Number(item.payment_amount || 0)
  acc.paymentCount += Number(item.payment_count || 0)
  acc.refundAmount += Number(item.refund_amount || 0)
  acc.refundCount += Number(item.refund_count || 0)
  acc.netAmount += Number(item.net_amount || 0)
  acc.varianceAmount += Math.abs(Number(item.variance_amount || 0))
  return acc
}, { paymentAmount: 0, paymentCount: 0, refundAmount: 0, refundCount: 0, netAmount: 0, varianceAmount: 0 }))
const summaryCards = computed(() => [
  { label: '收款金额', value: totals.value.paymentAmount, hint: `${totals.value.paymentCount} 笔收款`, icon: 'fas fa-arrow-trend-up', money: true },
  { label: '退款金额', value: totals.value.refundAmount, hint: `${totals.value.refundCount} 笔退款`, icon: 'fas fa-rotate-left', money: true },
  { label: '净收款', value: totals.value.netAmount, hint: '收款扣减退款后金额', icon: 'fas fa-sack-dollar', money: true },
  { label: '差异金额', value: totals.value.varianceAmount, hint: varianceRows.value.length ? '存在待复核提示' : '暂无异常差异', icon: 'fas fa-shield-halved', money: true }
])
const channelRows = computed(() => {
  const map = new Map()
  dailyItems.value.forEach(item => {
    const current = map.get(item.channel) || { channel: item.channel, payment_amount: 0, payment_count: 0, refund_amount: 0, refund_count: 0, net_amount: 0 }
    current.payment_amount += Number(item.payment_amount || 0)
    current.payment_count += Number(item.payment_count || 0)
    current.refund_amount += Number(item.refund_amount || 0)
    current.refund_count += Number(item.refund_count || 0)
    current.net_amount += Number(item.net_amount || 0)
    map.set(item.channel, current)
  })
  return Array.from(map.values()).sort((a, b) => b.net_amount - a.net_amount)
})
const varianceRows = computed(() => {
  const dailyWarnings = dailyItems.value
    .filter(item => Number(item.variance_amount || 0) !== 0)
    .map(item => ({
      key: `daily-${item.store_id}-${item.channel}`,
      title: `${storeName(item.store_id)} · ${channelLabel(item.channel)}日汇总差异`,
      description: `${selectedDate.value} 账面净收款 ${formatFen(item.net_amount)}，差异状态为「${reconciliationStatusLabel(item.status)}」。`,
      amount: Math.abs(Number(item.variance_amount || 0))
    }))
  const dailyIds = new Set(dailyItems.value.map(item => item.id).filter(Boolean))
  const varianceWarnings = variances.value
    .filter(item => !dailyIds.size || dailyIds.has(item.reconciliation_id))
    .map(item => ({
      key: `variance-${item.id}`,
      title: `${storeName(item.store_id)} · ${channelLabel(item.channel)}账实差异`,
      description: `应收 ${formatFen(item.expected_amount)}，实收 ${formatFen(item.actual_amount)}，状态「${varianceStatusLabel(item.status)}」。${item.reason || ''}`,
      amount: Math.abs(Number(item.variance_amount || 0))
    }))
  return [...dailyWarnings, ...varianceWarnings]
})

onMounted(loadPageData)

async function loadPageData() {
  loading.value = true
  errorMessage.value = ''
  try {
    stores.value = await merchantApi.getStores({ silentError: true })
    await loadReconciliationData()
  } catch (error) {
    console.error('Failed to load payment reconciliation:', error)
    errorMessage.value = getErrorText(error, '请检查网络或后端支付对账接口是否正常')
  } finally {
    loading.value = false
  }
}

async function loadReconciliationData() {
  if (!selectedDate.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    const params = compactParams({
      reconciliation_date: selectedDate.value,
      store_id: selectedStoreId.value,
      channel: selectedChannel.value
    })
    const paymentParams = compactParams({
      store_id: selectedStoreId.value,
      channel: selectedChannel.value
    })
    const varianceParams = compactParams({
      store_id: selectedStoreId.value,
      status: 'open'
    })
    const [dailyResult, paymentResult, varianceResult] = await Promise.all([
      reconciliationApi.getDailySummary(params, { silentError: true }),
      paymentApi.getPayments(paymentParams, { silentError: true }),
      reconciliationApi.getVariances(varianceParams, { silentError: true })
    ])
    dailyItems.value = dailyResult.items || []
    payments.value = paymentResult.items || []
    variances.value = Array.isArray(varianceResult) ? varianceResult : []
  } catch (error) {
    console.error('Failed to refresh reconciliation data:', error)
    errorMessage.value = getErrorText(error, '支付对账数据刷新失败')
  } finally {
    loading.value = false
  }
}

async function generateDaily() {
  generating.value = true
  try {
    await reconciliationApi.generateDaily(compactParams({
      reconciliation_date: selectedDate.value,
      store_id: selectedStoreId.value,
      channel: selectedChannel.value
    }))
    ElMessage.success('日对账已生成，数据已刷新')
    await loadReconciliationData()
  } catch (error) {
    ElMessage.error(getErrorText(error, '生成日对账失败，请稍后重试'))
  } finally {
    generating.value = false
  }
}

function compactParams(params) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== undefined && value !== null))
}

function formatFen(value) {
  return `¥${(Number(value || 0) / 100).toFixed(2)}`
}

function formatDate(date) {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDateTime(value) {
  if (!value) return '未记录'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

function storeName(id) {
  return stores.value.find(store => store.id === id)?.name || '未知门店'
}

function channelLabel(value) {
  return paymentChannels.find(channel => channel.value === value)?.label || value || '未知渠道'
}

function channelIcon(value) {
  return paymentChannels.find(channel => channel.value === value)?.icon || 'fas fa-circle-dot'
}

function paymentStatusLabel(status) {
  const labels = { success: '成功', pending: '处理中', failed: '失败', refunded: '已退款' }
  return labels[status] || status || '未知'
}

function reconciliationStatusLabel(status) {
  const labels = { generated: '已生成', confirmed: '已确认', exception: '有差异', pending: '待确认' }
  return labels[status] || status || '待确认'
}

function reconciliationStatusType(row) {
  if (Number(row.variance_amount || 0) !== 0 || row.status === 'exception') return 'danger'
  if (row.status === 'confirmed') return 'success'
  return 'warning'
}

function varianceStatusLabel(status) {
  const labels = { open: '待处理', resolved: '已处理', ignored: '已忽略' }
  return labels[status] || status || '待处理'
}

function getErrorText(error, fallback) {
  const detail = error?.response?.data?.detail
  if (Array.isArray(detail)) return detail.map(item => item.msg || item.message).filter(Boolean).join('，') || fallback
  return detail || error?.message || fallback
}
</script>

<style scoped>
.payment-reconciliation {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 24px 32px;
  min-height: calc(100vh - 88px);
  background:
    radial-gradient(circle at 12% 0%, rgba(249, 115, 22, 0.08), transparent 28%),
    linear-gradient(180deg, rgba(255, 247, 237, 0.42), rgba(246, 244, 239, 0));
}

.hero,
.filter-card,
.error-card,
.section-title,
.hero-actions,
.channel-row,
.variance-item {
  display: flex;
  align-items: center;
}

.hero,
.error-card {
  justify-content: space-between;
  gap: 16px;
}

.hero,
.filter-card,
.summary-grid>.metric-card,
.reconciliation-grid>.ds-card,
.error-card {
  padding: 18px 20px;
}

.hero {
  align-items: flex-start;
  border: 1px solid rgba(180, 83, 9, 0.14);
  background: linear-gradient(135deg, rgba(255, 253, 250, 0.98), rgba(255, 247, 237, 0.82));
}

.hero-actions {
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
.metric-card p,
.metric-card small,
.channel-row small,
.variance-item p,
.filter-hint {
  margin: 4px 0 0;
  color: var(--ds-muted);
  font-size: 12px;
}

.filter-card {
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  border: 1px solid rgba(180, 83, 9, 0.12);
  background: rgba(255, 253, 250, 0.94);
}

.filter-select {
  width: 180px;
}

.empty-guide {
  text-align: center;
  padding: 48px 24px;
}

.empty-guide i {
  font-size: 42px;
  color: var(--ds-primary);
}

.empty-guide h3 {
  margin: 14px 0 8px;
  color: var(--ds-text);
}

.empty-guide p {
  margin: 0;
  color: var(--ds-muted);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 14px;
  min-height: 96px;
  border: 1px solid rgba(180, 83, 9, 0.12);
}

.metric-skeleton {
  display: flex;
  align-items: center;
  gap: 14px;
}

.metric-icon,
.channel-icon {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  color: #c2410c;
  background: var(--ds-food-soft);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.metric-card strong {
  display: block;
  margin-top: 4px;
  color: var(--ds-text);
  font-size: 22px;
}

.reconciliation-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(340px, 0.9fr);
  grid-template-areas:
    "daily channel"
    "payments variance";
  gap: 16px;
  align-items: stretch;
}

.reconciliation-grid>.ds-card {
  border: 1px solid rgba(180, 83, 9, 0.14);
  background: rgba(255, 253, 250, 0.98);
  display: flex;
  flex-direction: column;
}

.daily-card {
  grid-area: daily;
}

.channel-card {
  grid-area: channel;
}

.payments-card {
  grid-area: payments;
}

.variance-card {
  grid-area: variance;
}

.section-title {
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(180, 83, 9, 0.1);
}

.section-title h3 {
  margin: 0;
  color: var(--ds-text);
  font-size: 17px;
}

.channel-list,
.variance-list {
  display: grid;
  gap: 10px;
  align-content: start;
}

.channel-row,
.variance-item {
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid var(--ds-border);
  border-radius: 16px;
  background: #fff;
}

.channel-row>div,
.variance-item>div {
  flex: 1;
  min-width: 0;
}

.channel-row b {
  color: #dc2626;
  font-size: 18px;
}

.variance-card {
  position: static;
}

.variance-item {
  align-items: flex-start;
  background: #fff7ed;
  border-color: #fed7aa;
}

.variance-item>i {
  color: #f97316;
  margin-top: 4px;
}

.variance-item b {
  color: #dc2626;
  white-space: nowrap;
}

:deep(.ds-table) {
  margin-top: 4px;
}

:deep(.el-table) {
  border-radius: 14px;
  overflow: hidden;
}

:deep(.el-table th.el-table__cell) {
  background: #fff7ed;
  color: var(--ds-text);
  font-weight: 700;
}

:deep(.el-table .cell) {
  padding-left: 12px;
  padding-right: 12px;
}

:deep(.data-state) {
  min-height: 188px;
  padding: 28px 24px;
}

.variance-card :deep(.data-state) {
  min-height: 168px;
}

@media (max-width: 1180px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .reconciliation-grid {
    grid-template-columns: 1fr;
    grid-template-areas:
      "daily"
      "channel"
      "payments"
      "variance";
  }
}

@media (max-width: 760px) {
  .payment-reconciliation {
    padding: 14px;
  }

  .hero,
  .error-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .filter-select,
  :deep(.el-date-editor) {
    width: 100%;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
