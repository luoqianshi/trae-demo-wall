<template>
  <div class="advanced-module">
    <section class="hero ds-card">
      <div>
        <span class="hero-icon"><i :class="config.icon"></i></span>
        <h2>{{ config.title }}</h2>
        <p>{{ config.description }}</p>
      </div>
      <div class="hero-actions">
        <el-select v-model="selectedStoreId" class="store-select" clearable placeholder="全部门店" @change="loadData">
          <el-option v-for="store in stores" :key="store.id" :label="store.name" :value="store.id" />
        </el-select>
        <el-date-picker
          v-if="config.dateFilter"
          v-model="selectedDate"
          value-format="YYYY-MM-DD"
          type="date"
          :clearable="false"
          @change="loadData"
        />
        <el-button type="primary" :loading="loading" @click="loadData">
          <i class="fas fa-rotate"></i>
          刷新
        </el-button>
      </div>
    </section>

    <section v-if="errorMessage" class="error-card ds-card" role="alert">
      <i class="fas fa-circle-exclamation"></i>
      <div>
        <strong>{{ config.title }}数据加载失败</strong>
        <p>{{ errorMessage }}</p>
      </div>
      <el-button type="primary" plain @click="loadData">重新加载</el-button>
    </section>

    <section class="metric-grid">
      <article v-if="loading" v-for="index in 3" :key="`metric-loading-${index}`" class="metric-card ds-card">
        <el-skeleton animated>
          <template #template>
            <div class="metric-skeleton">
              <el-skeleton-item variant="circle" style="width: 44px; height: 44px" />
              <div>
                <el-skeleton-item variant="text" style="width: 70px" />
                <el-skeleton-item variant="text" style="width: 96px" />
                <el-skeleton-item variant="text" style="width: 78px" />
              </div>
            </div>
          </template>
        </el-skeleton>
      </article>
      <article v-else v-for="metric in metrics" :key="metric.label" class="metric-card ds-card">
        <span class="metric-icon"><i :class="metric.icon"></i></span>
        <div>
          <p>{{ metric.label }}</p>
          <strong>{{ metric.money ? formatFen(metric.value) : metric.value }}</strong>
          <small>{{ metric.hint }}</small>
        </div>
      </article>
    </section>

    <section v-if="!loading && stores.length === 0" class="empty-guide ds-card">
      <i class="fas fa-store-slash"></i>
      <h3>暂无门店数据</h3>
      <p>高级经营模块需要先归属到门店。请先在「门店管理」创建门店，再回来维护{{ config.title }}。</p>
    </section>

    <section v-else class="section-grid">
      <article v-for="section in displaySections" :key="section.key" class="section-card ds-card">
        <div class="section-title">
          <div>
            <h3>{{ section.title }}</h3>
            <p>{{ section.description }}</p>
          </div>
          <el-tag effect="plain">{{ section.items.length }} 条</el-tag>
        </div>

        <DataStateBlock v-if="loading" loading :rows="5" />
        <DataStateBlock
          v-else-if="section.items.length === 0"
          :icon="config.icon"
          :title="`${section.title}暂无数据`"
          :description="section.emptyText"
          min-height="220px"
        >
          <template v-if="props.moduleKey === 'kitchen'" #actions>
            <el-button type="primary" plain @click="$router.push('/pos-cashier')">去 POS 出单</el-button>
          </template>
        </DataStateBlock>
        <el-table v-else :data="section.items" class="ds-table" border>
          <el-table-column
            v-for="column in section.columns"
            :key="column.key"
            :label="column.label"
            :min-width="column.minWidth || 120"
            :width="column.width"
          >
            <template #default="{ row }">
              <el-tag v-if="column.type === 'status'" :type="statusType(getCellValue(row, column))" effect="plain">
                {{ statusLabel(getCellValue(row, column)) }}
              </el-tag>
              <strong v-else-if="column.type === 'money'">{{ formatFen(getCellValue(row, column)) }}</strong>
              <span v-else-if="column.type === 'datetime'">{{ formatDateTime(getCellValue(row, column)) }}</span>
              <span v-else-if="column.type === 'date'">{{ getCellValue(row, column) || '-' }}</span>
              <span v-else>{{ getCellValue(row, column) || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="section.actions?.length" label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <div class="row-actions">
                <el-button
                  v-for="action in visibleActions(section.actions, row)"
                  :key="action.label"
                  size="small"
                  :type="action.type || 'primary'"
                  plain
                  :loading="operatingKey === `${section.key}-${row.id}-${action.label}`"
                  @click="runAction(section, row, action)"
                >
                  {{ action.label }}
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </article>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { advancedApi, merchantApi } from '@/api'
import DataStateBlock from '@/components/DataStateBlock.vue'

const props = defineProps({
  moduleKey: {
    type: String,
    required: true
  }
})

const stores = ref([])
const selectedStoreId = ref('')
const selectedDate = ref(formatDate(new Date()))
const loading = ref(false)
const errorMessage = ref('')
const sectionStates = ref([])
const operatingKey = ref('')
const summary = ref({})

const moduleConfigs = {
  kitchen: {
    title: '厨房/KDS',
    icon: 'fas fa-fire-burner',
    description: '跟踪后厨待制、制作中、已出餐和退菜任务，及时催菜和控制履约节奏。',
    sections: [
      {
        key: 'tasks',
        title: '厨房任务',
        description: '展示当前门店的出餐任务和催菜次数。',
        emptyText: '暂无厨房任务，可从 POS 出单后生成或手动创建任务。',
        loader: params => advancedApi.getKitchenTasks(params, { silentError: true }),
        columns: [
          { key: 'dish_name', label: '菜品', minWidth: 150 },
          { key: 'quantity', label: '数量', width: 80 },
          { key: 'station', label: '档口', width: 110 },
          { key: 'status', label: '状态', type: 'status', width: 110 },
          { key: 'urge_count', label: '催菜', width: 80 },
          { key: 'created_at', label: '创建时间', type: 'datetime', minWidth: 170 }
        ],
        actions: [
          { label: '开始制作', nextStatus: 'cooking', when: row => row.status === 'pending' },
          { label: '出餐', nextStatus: 'served', type: 'success', when: row => ['pending', 'cooking'].includes(row.status) },
          { label: '退菜', nextStatus: 'returned', type: 'danger', when: row => row.status !== 'returned' },
          { label: '催菜', custom: row => advancedApi.urgeKitchenTask(row.id), type: 'warning', when: row => row.status !== 'served' }
        ]
      }
    ]
  },
  purchase: {
    title: '采购/供应商',
    icon: 'fas fa-truck-field',
    description: '管理供应商、采购单和入库记录，把采购成本沉淀到经营日报。',
    sections: [
      {
        key: 'suppliers',
        title: '供应商',
        description: '当前门店可用供应商基础资料。',
        emptyText: '暂无供应商，请先创建供应商后再录入采购单。',
        loader: params => advancedApi.getSuppliers(params, { silentError: true }),
        columns: [
          { key: 'name', label: '供应商', minWidth: 160 },
          { key: 'contact_name', label: '联系人', width: 110 },
          { key: 'phone', label: '电话', width: 130 },
          { key: 'category', label: '品类', width: 110 },
          { key: 'status', label: '状态', type: 'status', width: 110 }
        ]
      },
      {
        key: 'purchases',
        title: '采购单',
        description: '采购单金额和收货状态。',
        emptyText: '暂无采购单，可先从供应商发起采购。',
        loader: params => advancedApi.getPurchases(params, { silentError: true }),
        columns: [
          { key: 'order_no', label: '采购单号', minWidth: 180 },
          { key: 'supplier_id', label: '供应商ID', minWidth: 170 },
          { key: 'total_amount', label: '金额', type: 'money', width: 120 },
          { key: 'status', label: '状态', type: 'status', width: 110 },
          { key: 'expected_date', label: '预计到货', type: 'date', width: 120 }
        ],
        actions: [
          { label: '确认入库', custom: row => advancedApi.receivePurchase(row.id), type: 'success', when: row => row.status !== 'received' }
        ]
      },
      {
        key: 'stock',
        title: '入库记录',
        description: '采购单收货或手工入库形成的成本记录。',
        emptyText: '暂无入库记录，完成采购单入库后会自动生成。',
        loader: params => advancedApi.getStockIn(params, { silentError: true }),
        columns: [
          { key: 'item_name', label: '物料', minWidth: 150 },
          { key: 'quantity', label: '数量', width: 90 },
          { key: 'unit', label: '单位', width: 80 },
          { key: 'cost_amount', label: '成本', type: 'money', width: 120 },
          { key: 'stocked_at', label: '入库时间', type: 'datetime', minWidth: 170 }
        ]
      },
      {
        key: 'returns',
        title: '退货记录',
        description: '采购退货金额和原因，辅助复盘供应商质量。',
        emptyText: '暂无采购退货记录，出现退货时可通过接口沉淀原因。',
        loader: params => advancedApi.getPurchaseReturns(params, { silentError: true }),
        columns: [
          { key: 'item_name', label: '物料', minWidth: 150 },
          { key: 'quantity', label: '数量', width: 90 },
          { key: 'amount', label: '退货金额', type: 'money', width: 120 },
          { key: 'reason', label: '原因', minWidth: 180 },
          { key: 'returned_at', label: '退货时间', type: 'datetime', minWidth: 170 }
        ]
      }
    ]
  },
  finance: {
    title: '财务报表',
    icon: 'fas fa-chart-column',
    description: '按日汇总收款、退款、采购成本、毛利和客单价，给经营复盘提供统一口径。',
    dateFilter: true,
    sections: [
      {
        key: 'daily',
        title: '经营日报',
        description: '基于 POS 支付流水、退款和采购入库成本自动汇总。',
        emptyText: '暂无日报数据，请先完成收银或采购入库。',
        loader: params => advancedApi.getFinancialDaily({ ...params, report_date: selectedDate.value }, { silentError: true }),
        columns: [
          { key: 'report_date', label: '日期', type: 'date', width: 120 },
          { key: 'revenue_amount', label: '收款', type: 'money', width: 120 },
          { key: 'refund_amount', label: '退款', type: 'money', width: 120 },
          { key: 'purchase_cost', label: '采购成本', type: 'money', width: 130 },
          { key: 'gross_profit', label: '毛利估算', type: 'money', width: 130 },
          { key: 'order_count', label: '订单数', width: 100 },
          { key: 'avg_order_amount', label: '客单价', type: 'money', width: 120 }
        ]
      }
    ]
  },
  coupon: {
    title: '优惠券核销',
    icon: 'fas fa-ticket',
    description: '维护券模板、发券试算和核销记录，先建立权益闭环，再逐步接入会员和订单。',
    sections: [
      {
        key: 'templates',
        title: '券模板',
        description: '当前门店可发放的优惠券模板。',
        emptyText: '暂无券模板，请先创建满减或折扣券。',
        loader: params => advancedApi.getCouponTemplates(params, { silentError: true }),
        columns: [
          { key: 'name', label: '券名称', minWidth: 160 },
          { key: 'coupon_type', label: '类型', width: 100 },
          { key: 'threshold_amount', label: '门槛', type: 'money', width: 120 },
          { key: 'discount_amount', label: '优惠', type: 'money', width: 120 },
          { key: 'discount_rate', label: '折扣率', width: 100 },
          { key: 'status', label: '状态', type: 'status', width: 110 }
        ]
      }
    ]
  },
  delivery: {
    title: '外卖平台',
    icon: 'fas fa-motorcycle',
    description: '记录第三方平台门店、平台订单和团购券码，为后续自动同步预留接口。',
    sections: [
      {
        key: 'stores',
        title: '平台店铺',
        description: '门店绑定的外卖或团购平台店铺。',
        emptyText: '暂无平台店铺，可先绑定美团、饿了么或抖音团购门店。',
        loader: params => advancedApi.getDeliveryStores(params, { silentError: true }),
        columns: [
          { key: 'platform', label: '平台', width: 120 },
          { key: 'name', label: '平台店名', minWidth: 160 },
          { key: 'platform_store_id', label: '平台店铺ID', minWidth: 170 },
          { key: 'status', label: '状态', type: 'status', width: 110 }
        ]
      },
      {
        key: 'orders',
        title: '平台订单',
        description: '平台订单金额、券码和履约状态。',
        emptyText: '暂无平台订单，请先录入或等待平台同步。',
        loader: params => advancedApi.getDeliveryOrders(params, { silentError: true }),
        columns: [
          { key: 'platform', label: '平台', width: 110 },
          { key: 'platform_order_no', label: '平台单号', minWidth: 180 },
          { key: 'amount', label: '金额', type: 'money', width: 120 },
          { key: 'voucher_code', label: '券码', minWidth: 130 },
          { key: 'status', label: '状态', type: 'status', width: 110 },
          { key: 'created_at', label: '创建时间', type: 'datetime', minWidth: 170 }
        ]
      },
      {
        key: 'vouchers',
        title: '券码核销',
        description: '外卖、团购平台券码的核销留痕。',
        emptyText: '暂无券码核销记录，核销平台券后会沉淀在这里。',
        loader: params => advancedApi.getDeliveryVoucherRedemptions(params, { silentError: true }),
        columns: [
          { key: 'voucher_code', label: '券码', minWidth: 150 },
          { key: 'platform_order_id', label: '平台订单ID', minWidth: 170 },
          { key: 'amount', label: '核销金额', type: 'money', width: 120 },
          { key: 'redeemed_at', label: '核销时间', type: 'datetime', minWidth: 170 },
          { key: 'remark', label: '备注', minWidth: 160 }
        ]
      }
    ]
  },
  audit: {
    title: '审计风控',
    icon: 'fas fa-shield-halved',
    description: '集中查看敏感操作、退款改价和风险提醒，为门店经营留痕和复核。',
    sections: [
      {
        key: 'audits',
        title: '审计日志',
        description: '敏感操作和关键业务变更记录。',
        emptyText: '暂无审计日志，后续敏感操作会自动沉淀到这里。',
        loader: params => advancedApi.getAudits(params, { silentError: true }),
        columns: [
          { key: 'action', label: '动作', width: 120 },
          { key: 'target_type', label: '对象', width: 120 },
          { key: 'reason', label: '原因', minWidth: 180 },
          { key: 'risk_level', label: '风险', type: 'status', width: 110 },
          { key: 'created_at', label: '时间', type: 'datetime', minWidth: 170 }
        ]
      },
      {
        key: 'risks',
        title: '风险记录',
        description: '待处理经营风险和证据。',
        emptyText: '暂无风险记录，当前未发现需要复核的问题。',
        loader: params => advancedApi.getRisks(params, { silentError: true }),
        columns: [
          { key: 'title', label: '风险标题', minWidth: 180 },
          { key: 'alert_type', label: '类型', width: 120 },
          { key: 'risk_level', label: '等级', type: 'status', width: 110 },
          { key: 'status', label: '状态', type: 'status', width: 110 },
          { key: 'created_at', label: '时间', type: 'datetime', minWidth: 170 }
        ]
      }
    ]
  }
}

const config = computed(() => moduleConfigs[props.moduleKey] || moduleConfigs.kitchen)
const displaySections = computed(() => {
  if (sectionStates.value.length) return sectionStates.value
  return config.value.sections.map(section => ({ ...section, items: [] }))
})
const allItems = computed(() => sectionStates.value.flatMap(section => section.items))
const metrics = computed(() => {
  if (props.moduleKey === 'kitchen') {
    return [
      metric('待制作', allItems.value.filter(item => item.status === 'pending').length, '需要尽快确认的任务', 'fas fa-hourglass-half'),
      metric('制作中', allItems.value.filter(item => item.status === 'cooking').length, '后厨正在履约', 'fas fa-fire'),
      metric('已催菜', allItems.value.reduce((sum, item) => sum + Number(item.urge_count || 0), 0), '服务员催菜次数', 'fas fa-bell')
    ]
  }
  if (props.moduleKey === 'finance') {
    const row = allItems.value[0] || {}
    return [
      metric('净收款', row.net_amount || 0, '收款扣减退款', 'fas fa-sack-dollar', true),
      metric('采购成本', row.purchase_cost || 0, '当日入库成本', 'fas fa-boxes-stacked', true),
      metric('毛利估算', row.gross_profit || 0, '净收款减采购成本', 'fas fa-chart-line', true)
    ]
  }
  return [
    metric('待出餐', summary.value.kitchen_pending || 0, '厨房待处理任务', 'fas fa-fire-burner'),
    metric('今日采购成本', summary.value.purchase_cost_today || 0, '按入库成本汇总', 'fas fa-truck-field', true),
    metric('开放风险', summary.value.open_risks || 0, '待处理风控记录', 'fas fa-shield-halved')
  ]
})

onMounted(loadData)

async function loadData() {
  loading.value = true
  errorMessage.value = ''
  try {
    stores.value = await merchantApi.getStores({ silentError: true })
    if (!selectedStoreId.value && stores.value.length > 0) {
      selectedStoreId.value = stores.value[0].id
    }
    const params = compactParams({ store_id: selectedStoreId.value })
    const [summaryResult, ...sectionResults] = await Promise.all([
      advancedApi.getSummary({ silentError: true }),
      ...config.value.sections.map(section => section.loader(params))
    ])
    summary.value = summaryResult || {}
    sectionStates.value = config.value.sections.map((section, index) => ({
      ...section,
      items: normalizeItems(sectionResults[index])
    }))
  } catch (error) {
    console.error(`Failed to load advanced module ${props.moduleKey}:`, error)
    errorMessage.value = getErrorText(error, '请检查网络或后端高级模块接口是否正常')
  } finally {
    loading.value = false
  }
}

async function runAction(section, row, action) {
  operatingKey.value = `${section.key}-${row.id}-${action.label}`
  try {
    if (action.nextStatus) {
      await advancedApi.updateKitchenTaskStatus(row.id, { status: action.nextStatus })
    } else if (action.custom) {
      await action.custom(row)
    }
    ElMessage.success(`${action.label}成功`)
    await loadData()
  } catch (error) {
    console.error('Failed to run advanced action:', error)
    ElMessage.error(getErrorText(error, `${action.label}失败，请稍后重试`))
  } finally {
    operatingKey.value = ''
  }
}

function visibleActions(actions, row) {
  return actions.filter(action => !action.when || action.when(row))
}

function normalizeItems(result) {
  if (Array.isArray(result)) return result
  return result?.items || []
}

function getCellValue(row, column) {
  return typeof column.formatter === 'function' ? column.formatter(row) : row[column.key]
}

function metric(label, value, hint, icon, money = false) {
  return { label, value, hint, icon, money }
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
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

function statusLabel(status) {
  const labels = {
    pending: '待处理',
    cooking: '制作中',
    served: '已出餐',
    returned: '已退菜',
    draft: '草稿',
    ordered: '已下单',
    received: '已入库',
    active: '启用',
    inactive: '停用',
    issued: '已发放',
    used: '已核销',
    open: '待处理',
    resolved: '已处理',
    low: '低',
    medium: '中',
    high: '高',
    critical: '严重'
  }
  return labels[status] || status || '未知'
}

function statusType(status) {
  if (['served', 'received', 'active', 'used', 'resolved', 'low'].includes(status)) return 'success'
  if (['returned', 'high', 'critical'].includes(status)) return 'danger'
  if (['pending', 'cooking', 'ordered', 'open', 'medium'].includes(status)) return 'warning'
  return 'info'
}

function getErrorText(error, fallback) {
  const detail = error?.response?.data?.detail
  if (Array.isArray(detail)) return detail.map(item => item.msg || item.message).filter(Boolean).join('；') || fallback
  return detail || error?.response?.data?.message || error?.message || fallback
}
</script>

<style scoped>
.advanced-module {
  display: grid;
  gap: 18px;
}

.hero,
.hero-actions,
.error-card,
.section-title,
.metric-card,
.row-actions {
  display: flex;
  align-items: center;
}

.hero {
  justify-content: space-between;
  gap: 18px;
  padding: 24px;
  background:
    radial-gradient(circle at top right, rgba(249, 115, 22, 0.1), transparent 32%),
    linear-gradient(135deg, rgba(255, 253, 250, 0.98), rgba(248, 234, 215, 0.32));
}

.hero-icon {
  width: 48px;
  height: 48px;
  border-radius: 18px;
  color: #c2410c;
  background: var(--ds-food-soft);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  font-size: 20px;
}

.hero h2,
.section-title h3,
.empty-guide h3 {
  margin: 0;
  color: var(--ds-text);
  font-weight: 850;
}

.hero p,
.section-title p,
.metric-card p,
.metric-card small,
.empty-guide p,
.error-card p {
  margin: 4px 0 0;
  color: var(--ds-muted);
}

.hero-actions {
  gap: 10px;
  flex-wrap: wrap;
}

.store-select {
  width: 220px;
}

.error-card {
  justify-content: space-between;
  gap: 14px;
  color: #991b1b;
  background: #fff7ed;
  border-color: #fed7aa;
}

.error-card > i {
  color: #f97316;
  font-size: 24px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.metric-card {
  gap: 12px;
  min-height: 86px;
  padding: 18px;
}

.metric-skeleton {
  display: flex;
  align-items: center;
  gap: 12px;
}

.metric-icon {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  color: var(--ds-primary);
  background: var(--ds-primary-soft);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.metric-card strong {
  display: block;
  color: var(--ds-text);
  font-size: 24px;
  line-height: 1.2;
}

.section-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 18px;
}

.section-card {
  overflow: hidden;
  padding: 18px;
}

.section-title {
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 14px;
}

.row-actions {
  gap: 8px;
  flex-wrap: wrap;
}

.empty-guide {
  text-align: center;
  padding: 48px 24px;
}

.empty-guide i {
  color: var(--ds-primary);
  font-size: 42px;
  margin-bottom: 12px;
}

@media (max-width: 900px) {
  .hero,
  .error-card,
  .section-title {
    align-items: stretch;
    flex-direction: column;
  }

  .metric-grid {
    grid-template-columns: 1fr;
  }

  .store-select,
  :deep(.el-date-editor) {
    width: 100%;
  }
}
</style>
