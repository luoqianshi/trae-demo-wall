<template>
  <div class="table-management">
    <section class="hero ds-card">
      <div>
        <p class="ds-eyebrow">堂食管理</p>
        <h2 class="ds-page-title">桌台管理</h2>
        <p class="ds-page-desc">统一管理堂食区域、桌台看板、开台、清台和换台，让前厅状态与后续 POS 流程保持一致。</p>
      </div>
      <div class="hero-actions">
        <el-button :loading="loading" @click="loadPageData">
          <i class="fas fa-rotate-right"></i>
          刷新
        </el-button>
        <el-button plain :disabled="!selectedStoreId" @click="openAreaDialog()">
          <i class="fas fa-layer-group"></i>
          新增区域
        </el-button>
        <el-button type="primary" :disabled="!selectedStoreId" @click="openTableDialog()">
          <i class="fas fa-chair"></i>
          新增桌台
        </el-button>
      </div>
    </section>

    <section v-if="errorMessage" class="error-card ds-card" role="alert">
      <i class="fas fa-circle-exclamation"></i>
      <div>
        <strong>桌台数据加载失败</strong>
        <p>{{ errorMessage }}</p>
      </div>
      <el-button type="primary" plain @click="loadPageData">重新加载</el-button>
    </section>

    <section class="filter-card ds-card">
      <el-select v-model="selectedStoreId" class="filter-select" placeholder="请选择门店" @change="handleStoreChange">
        <el-option v-for="store in stores" :key="store.id" :label="store.name" :value="store.id" />
      </el-select>
      <el-select v-model="selectedAreaId" class="filter-select" clearable placeholder="全部区域" @change="loadTables">
        <el-option v-for="area in enabledAreas" :key="area.id" :label="area.name" :value="area.id" />
      </el-select>
      <el-select v-model="selectedStatus" class="filter-select" clearable placeholder="全部状态" @change="loadTables">
        <el-option v-for="item in tableStatusOptions" :key="item.value" :label="item.label" :value="item.value" />
      </el-select>
      <span class="filter-hint">当前门店 {{ currentStoreName }}，共 {{ tableTotal }} 张桌台</span>
    </section>

    <section class="metrics-grid">
      <article v-for="item in statusMetrics" :key="item.value" class="metric-card ds-card">
        <span :class="['metric-icon', item.className]"><i :class="item.icon"></i></span>
        <div>
          <p>{{ item.label }}</p>
          <strong>{{ item.count }}</strong>
        </div>
      </article>
    </section>

    <section v-if="!loading && stores.length === 0" class="empty-guide ds-card">
      <i class="fas fa-store-slash"></i>
      <h3>请先创建门店</h3>
      <p>桌台必须归属于门店。请先到「门店管理」维护门店资料，再回来创建堂食区域和桌台。</p>
    </section>

    <section v-else class="content-grid">
      <aside class="area-panel ds-card">
        <div class="section-title">
          <div>
            <h3>堂食区域</h3>
            <p>按区域筛选桌台，停用区域不会影响历史桌台数据。</p>
          </div>
        </div>

        <DataStateBlock v-if="loading" loading :rows="4" compact min-height="190px" />
        <DataStateBlock v-else-if="areas.length === 0" icon="fas fa-layer-group" title="暂无堂食区域"
          description="先创建大厅、包间或外摆区域，桌台看板会按区域组织前厅状态。" compact min-height="190px">
          <template #actions>
            <el-button type="primary" @click="openAreaDialog()">新增第一个区域</el-button>
          </template>
        </DataStateBlock>
        <div v-else class="area-list">
          <button type="button" :class="['area-item', { active: selectedAreaId === '' }]" @click="selectArea('')">
            <span>
              <strong>全部区域</strong>
              <small>查看当前门店所有桌台</small>
            </span>
            <el-tag size="small" effect="plain">{{ tables.length }}</el-tag>
          </button>
          <button v-for="area in areas" :key="area.id" type="button"
            :class="['area-item', { active: selectedAreaId === area.id, disabled: area.status !== 1 }]"
            @click="selectArea(area.id)">
            <span>
              <strong>{{ area.name }}</strong>
              <small>{{ area.code }} · {{ area.description || '暂无说明' }}</small>
            </span>
            <span class="area-actions">
              <el-tag size="small" :type="area.status === 1 ? 'success' : 'info'">
                {{ area.status === 1 ? '启用' : '停用' }}
              </el-tag>
              <el-button link type="primary" @click.stop="openAreaDialog(area)">编辑</el-button>
            </span>
          </button>
        </div>
      </aside>

      <article class="board-panel ds-card">
        <div class="section-title board-title">
          <div>
            <h3>桌台状态看板</h3>
            <p>空闲桌台可开台，使用中桌台可清台或换台，停用桌台不能进行堂食操作。</p>
          </div>
          <el-switch v-model="showDisabled" active-text="显示停用" inactive-text="仅启用" @change="loadTables" />
        </div>

        <DataStateBlock v-if="loading" loading :rows="8" min-height="280px" />
        <DataStateBlock v-else-if="visibleTables.length === 0" icon="fas fa-chair" title="暂无桌台数据"
          description="请先创建桌台并关联堂食区域，前厅才能进行开台、清台和换台。" min-height="280px">
          <template #actions>
            <el-button type="primary" @click="openTableDialog()">新增第一张桌台</el-button>
          </template>
        </DataStateBlock>
        <div v-else class="table-board">
          <article v-for="table in visibleTables" :key="table.id"
            :class="['table-card', statusMeta(table).className, { disabled: table.enabled !== 1 }]">
            <div class="table-card-header">
              <span class="table-no">{{ table.table_no }}</span>
              <el-tag :type="statusMeta(table).tagType" effect="plain">{{ statusMeta(table).label }}</el-tag>
            </div>
            <h4>{{ table.name }}</h4>
            <p>
              <i class="fas fa-location-dot"></i>
              {{ table.area_name || '未分区' }}
            </p>
            <p>
              <i class="fas fa-user-group"></i>
              {{ table.seats }} 人桌
              <template v-if="table.active_session"> · 已开台 {{ table.active_session.party_size }} 人</template>
            </p>
            <p v-if="table.remark" class="remark">{{ table.remark }}</p>
            <div class="table-actions">
              <el-button size="small" link type="primary" @click="openTableDialog(table)">编辑</el-button>
              <el-button v-if="canOpen(table)" size="small" type="success" plain @click="openSessionDialog(table)">
                开台
              </el-button>
              <el-button v-if="canClear(table)" size="small" type="warning" plain @click="confirmClearTable(table)">
                清台
              </el-button>
              <el-button v-if="canTransfer(table)" size="small" type="primary" plain @click="openTransferDialog(table)">
                换台
              </el-button>
            </div>
          </article>
        </div>
      </article>
    </section>

    <section class="log-card ds-card">
      <div class="section-title">
        <div>
          <h3>最近操作日志</h3>
          <p>记录桌台开台、清台、换台和启停变更，便于前厅交接。</p>
        </div>
      </div>
      <DataStateBlock v-if="!loading && logs.length === 0" icon="fas fa-clock-rotate-left" title="暂无桌台操作日志"
        description="开台、清台、换台和启停变更会沉淀到这里，方便前厅交接复盘。" compact min-height="170px" />
      <el-table v-else :data="logs" class="log-table">
        <el-table-column prop="action" label="操作" width="120">
          <template #default="{ row }">{{ actionLabel(row.action) }}</template>
        </el-table-column>
        <el-table-column prop="before_status" label="变更前" width="110">
          <template #default="{ row }">{{ statusLabel(row.before_status) || '-' }}</template>
        </el-table-column>
        <el-table-column prop="after_status" label="变更后" width="110">
          <template #default="{ row }">{{ statusLabel(row.after_status) || '-' }}</template>
        </el-table-column>
        <el-table-column prop="detail" label="说明" min-width="220" show-overflow-tooltip />
        <el-table-column prop="created_at" label="时间" width="180">
          <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
        </el-table-column>
      </el-table>
    </section>

    <el-dialog v-model="areaDialogVisible" :title="editingAreaId ? '编辑区域' : '新增区域'" width="520px" destroy-on-close>
      <el-form ref="areaFormRef" :model="areaForm" :rules="areaRules" label-width="90px">
        <el-form-item label="区域名称" prop="name">
          <el-input v-model="areaForm.name" placeholder="如：大厅、包间、露台" />
        </el-form-item>
        <el-form-item label="区域编码" prop="code">
          <el-input v-model="areaForm.code" placeholder="如：hall、vip、terrace" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="areaForm.sort_order" :min="0" :step="1" />
        </el-form-item>
        <el-form-item label="区域状态" v-if="editingAreaId">
          <el-switch v-model="areaForm.enabled" active-text="启用" inactive-text="停用" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="areaForm.description" type="textarea" :rows="3" placeholder="可填写服务范围或区域备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="areaDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingArea" @click="saveArea">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="tableDialogVisible" :title="editingTableId ? '编辑桌台' : '新增桌台'" width="560px" destroy-on-close>
      <el-form ref="tableFormRef" :model="tableForm" :rules="tableRules" label-width="90px">
        <el-form-item label="所属区域">
          <el-select v-model="tableForm.area_id" clearable placeholder="可选择区域">
            <el-option v-for="area in enabledAreas" :key="area.id" :label="area.name" :value="area.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="桌台编号" prop="table_no">
          <el-input v-model="tableForm.table_no" placeholder="如：A01、B06" />
        </el-form-item>
        <el-form-item label="桌台名称" prop="name">
          <el-input v-model="tableForm.name" placeholder="如：大厅 1 号桌" />
        </el-form-item>
        <el-form-item label="座位数" prop="seats">
          <el-input-number v-model="tableForm.seats" :min="1" :step="1" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="tableForm.sort_order" :min="0" :step="1" />
        </el-form-item>
        <el-form-item label="桌台状态" v-if="editingTableId">
          <el-switch v-model="tableForm.enabled" active-text="启用" inactive-text="停用" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="tableForm.remark" type="textarea" :rows="3" placeholder="可填写靠窗、儿童椅等服务备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="tableDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingTable" @click="saveTable">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="openDialogVisible" title="开台" width="460px" destroy-on-close>
      <el-form ref="openFormRef" :model="openForm" :rules="openRules" label-width="88px">
        <el-form-item label="桌台">
          <strong>{{ operatingTable?.name }}（{{ operatingTable?.table_no }}）</strong>
        </el-form-item>
        <el-form-item label="用餐人数" prop="party_size">
          <el-input-number v-model="openForm.party_size" :min="1" :step="1" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="openForm.note" type="textarea" :rows="3" placeholder="可填写客人偏好或交接备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="openDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="operating" @click="submitOpenTable">确认开台</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="transferDialogVisible" title="换台" width="480px" destroy-on-close>
      <el-form ref="transferFormRef" :model="transferForm" :rules="transferRules" label-width="88px">
        <el-form-item label="当前桌台">
          <strong>{{ operatingTable?.name }}（{{ operatingTable?.table_no }}）</strong>
        </el-form-item>
        <el-form-item label="目标桌台" prop="target_table_id">
          <el-select v-model="transferForm.target_table_id" filterable placeholder="请选择空闲目标桌台">
            <el-option v-for="table in transferTargetTables" :key="table.id"
              :label="`${table.area_name || '未分区'} · ${table.name}（${table.table_no}）`" :value="table.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="transferForm.note" type="textarea" :rows="3" placeholder="可填写换台原因" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="transferDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="operating" @click="submitTransferTable">确认换台</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { merchantApi, tableApi } from '@/api'
import DataStateBlock from '@/components/DataStateBlock.vue'

const stores = ref([])
const areas = ref([])
const tables = ref([])
const logs = ref([])
const loading = ref(false)
const errorMessage = ref('')
const selectedStoreId = ref('')
const selectedAreaId = ref('')
const selectedStatus = ref('')
const showDisabled = ref(false)

const areaDialogVisible = ref(false)
const tableDialogVisible = ref(false)
const openDialogVisible = ref(false)
const transferDialogVisible = ref(false)
const savingArea = ref(false)
const savingTable = ref(false)
const operating = ref(false)
const editingAreaId = ref('')
const editingTableId = ref('')
const operatingTable = ref(null)
const areaFormRef = ref(null)
const tableFormRef = ref(null)
const openFormRef = ref(null)
const transferFormRef = ref(null)

const areaForm = reactive({
  name: '',
  code: '',
  sort_order: 0,
  description: '',
  enabled: true,
  originalStatus: 1
})

const tableForm = reactive({
  area_id: '',
  table_no: '',
  name: '',
  seats: 2,
  sort_order: 0,
  remark: '',
  enabled: true,
  originalEnabled: 1
})

const openForm = reactive({
  party_size: 2,
  note: ''
})

const transferForm = reactive({
  target_table_id: '',
  note: ''
})

const tableStatusOptions = [
  { value: 'available', label: '空闲', icon: 'fas fa-circle-check', className: 'success', tagType: 'success' },
  { value: 'occupied', label: '使用中', icon: 'fas fa-utensils', className: 'food', tagType: 'warning' },
  { value: 'reserved', label: '已预订', icon: 'fas fa-calendar-check', className: 'primary', tagType: 'primary' },
  { value: 'cleaning', label: '清洁中', icon: 'fas fa-broom', className: 'warning', tagType: 'warning' },
  { value: 'disabled', label: '已停用', icon: 'fas fa-ban', className: 'info', tagType: 'info' }
]

const areaRules = {
  name: [{ required: true, message: '请输入区域名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入区域编码', trigger: 'blur' }]
}

const tableRules = {
  table_no: [{ required: true, message: '请输入桌台编号', trigger: 'blur' }],
  name: [{ required: true, message: '请输入桌台名称', trigger: 'blur' }],
  seats: [{ required: true, message: '请输入座位数', trigger: 'blur' }]
}

const openRules = {
  party_size: [{ required: true, message: '请输入用餐人数', trigger: 'blur' }]
}

const transferRules = {
  target_table_id: [{ required: true, message: '请选择目标桌台', trigger: 'change' }]
}

const enabledAreas = computed(() => areas.value.filter(area => area.status === 1))
const tableTotal = computed(() => tables.value.length)
const currentStoreName = computed(() => stores.value.find(store => store.id === selectedStoreId.value)?.name || '未选择门店')
const visibleTables = computed(() => showDisabled.value ? tables.value : tables.value.filter(table => table.enabled === 1))
const transferTargetTables = computed(() => tables.value.filter(table => table.enabled === 1 && table.status === 'available' && table.id !== operatingTable.value?.id))
const statusMetrics = computed(() => tableStatusOptions.map(item => ({
  ...item,
  count: tables.value.filter(table => statusValue(table) === item.value).length
})))

async function loadPageData() {
  loading.value = true
  errorMessage.value = ''
  try {
    stores.value = await merchantApi.getStores({ silentError: true })
    if (!selectedStoreId.value && stores.value.length > 0) {
      selectedStoreId.value = stores.value[0].id
    }
    if (selectedStoreId.value) {
      await Promise.all([loadAreas(), loadTables(), loadLogs()])
    } else {
      areas.value = []
      tables.value = []
      logs.value = []
    }
  } catch (error) {
    console.error('Failed to load table management data:', error)
    errorMessage.value = getErrorText(error, '请检查网络或后端桌台接口是否正常')
  } finally {
    loading.value = false
  }
}

async function loadAreas() {
  if (!selectedStoreId.value) return
  areas.value = await tableApi.getTableAreas({ store_id: selectedStoreId.value }, { silentError: true })
}

async function loadTables() {
  if (!selectedStoreId.value) return
  const result = await tableApi.getTables({
    store_id: selectedStoreId.value,
    area_id: selectedAreaId.value || undefined,
    status: selectedStatus.value || undefined,
    enabled: showDisabled.value ? undefined : 1
  }, { silentError: true })
  tables.value = result.items || []
}

async function loadLogs() {
  if (!selectedStoreId.value) return
  logs.value = (await tableApi.getTableOperationLogs({ store_id: selectedStoreId.value }, { silentError: true })).slice(0, 8)
}

async function refreshBoard() {
  await Promise.all([loadAreas(), loadTables(), loadLogs()])
}

async function handleStoreChange() {
  selectedAreaId.value = ''
  selectedStatus.value = ''
  await refreshBoard()
}

function selectArea(areaId) {
  selectedAreaId.value = areaId
  loadTables()
}

function statusValue(table) {
  if (table.enabled !== 1) return 'disabled'
  return table.status || 'available'
}

function statusMeta(table) {
  const value = typeof table === 'string' ? table : statusValue(table)
  return tableStatusOptions.find(item => item.value === value) || tableStatusOptions[0]
}

function statusLabel(status) {
  if (!status) return ''
  return statusMeta(status).label
}

function actionLabel(action) {
  const labels = {
    open: '开台',
    clear: '清台',
    transfer_out: '换出',
    transfer_in: '换入',
    status: '启停'
  }
  return labels[action] || action || '-'
}

function canOpen(table) {
  return table.enabled === 1 && table.status === 'available'
}

function canClear(table) {
  return table.enabled === 1 && table.status === 'occupied'
}

function canTransfer(table) {
  return table.enabled === 1 && table.status === 'occupied' && transferTargetTables.value.length > 0
}

function openAreaDialog(row) {
  editingAreaId.value = ''
  Object.assign(areaForm, {
    name: '',
    code: '',
    sort_order: areas.value.length + 1,
    description: '',
    enabled: true,
    originalStatus: 1
  })
  if (row) {
    editingAreaId.value = row.id
    Object.assign(areaForm, {
      name: row.name || '',
      code: row.code || '',
      sort_order: row.sort_order || 0,
      description: row.description || '',
      enabled: row.status === 1,
      originalStatus: row.status
    })
  }
  areaDialogVisible.value = true
}

async function saveArea() {
  if (!areaFormRef.value || !selectedStoreId.value) return
  const valid = await areaFormRef.value.validate().catch(() => false)
  if (!valid) return

  savingArea.value = true
  try {
    const payload = {
      store_id: selectedStoreId.value,
      name: areaForm.name,
      code: areaForm.code,
      sort_order: areaForm.sort_order || 0,
      description: areaForm.description || null
    }
    if (editingAreaId.value) {
      await tableApi.updateTableArea(editingAreaId.value, payload)
      const nextStatus = areaForm.enabled ? 1 : 0
      if (nextStatus !== areaForm.originalStatus) {
        await tableApi.updateTableAreaStatus(editingAreaId.value, nextStatus)
      }
      ElMessage.success('区域已更新')
    } else {
      await tableApi.createTableArea(payload)
      ElMessage.success('区域已创建')
    }
    areaDialogVisible.value = false
    await refreshBoard()
  } catch (error) {
    console.error('Failed to save table area:', error)
    ElMessage.error(getErrorText(error, '区域保存失败，请检查编码是否重复'))
  } finally {
    savingArea.value = false
  }
}

function openTableDialog(row) {
  editingTableId.value = ''
  Object.assign(tableForm, {
    area_id: selectedAreaId.value || '',
    table_no: '',
    name: '',
    seats: 2,
    sort_order: tables.value.length + 1,
    remark: '',
    enabled: true,
    originalEnabled: 1
  })
  if (row) {
    editingTableId.value = row.id
    Object.assign(tableForm, {
      area_id: row.area_id || '',
      table_no: row.table_no || '',
      name: row.name || '',
      seats: row.seats || 1,
      sort_order: row.sort_order || 0,
      remark: row.remark || '',
      enabled: row.enabled === 1,
      originalEnabled: row.enabled
    })
  }
  tableDialogVisible.value = true
}

async function saveTable() {
  if (!tableFormRef.value || !selectedStoreId.value) return
  const valid = await tableFormRef.value.validate().catch(() => false)
  if (!valid) return

  savingTable.value = true
  try {
    const payload = {
      store_id: selectedStoreId.value,
      area_id: tableForm.area_id || null,
      table_no: tableForm.table_no,
      name: tableForm.name,
      seats: tableForm.seats,
      sort_order: tableForm.sort_order || 0,
      remark: tableForm.remark || null
    }
    if (editingTableId.value) {
      await tableApi.updateTable(editingTableId.value, payload)
      const nextEnabled = tableForm.enabled ? 1 : 0
      if (nextEnabled !== tableForm.originalEnabled) {
        await tableApi.updateTableStatus(editingTableId.value, nextEnabled)
      }
      ElMessage.success('桌台已更新')
    } else {
      await tableApi.createTable(payload)
      ElMessage.success('桌台已创建')
    }
    tableDialogVisible.value = false
    await refreshBoard()
  } catch (error) {
    console.error('Failed to save table:', error)
    ElMessage.error(getErrorText(error, '桌台保存失败，请检查编号是否重复'))
  } finally {
    savingTable.value = false
  }
}

function openSessionDialog(table) {
  operatingTable.value = table
  Object.assign(openForm, { party_size: Math.min(table.seats || 1, 2), note: '' })
  openDialogVisible.value = true
}

async function submitOpenTable() {
  if (!openFormRef.value || !operatingTable.value) return
  const valid = await openFormRef.value.validate().catch(() => false)
  if (!valid) return

  operating.value = true
  try {
    await tableApi.openTable(operatingTable.value.id, {
      party_size: openForm.party_size,
      note: openForm.note || null
    })
    ElMessage.success('开台成功')
    openDialogVisible.value = false
    await refreshBoard()
  } catch (error) {
    console.error('Failed to open table:', error)
    ElMessage.error(getErrorText(error, '开台失败，只有空闲且启用的桌台可以开台'))
  } finally {
    operating.value = false
  }
}

async function confirmClearTable(table) {
  try {
    await ElMessageBox.confirm(`确认清台「${table.name}」吗？清台后桌台将恢复为空闲。`, '清台确认', {
      type: 'warning',
      confirmButtonText: '确认清台',
      cancelButtonText: '取消'
    })
    operating.value = true
    await tableApi.clearTable(table.id, { note: '前端手动清台' })
    ElMessage.success('清台成功')
    await refreshBoard()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    console.error('Failed to clear table:', error)
    ElMessage.error(getErrorText(error, '清台失败，请确认桌台没有未结 POS 订单'))
  } finally {
    operating.value = false
  }
}

function openTransferDialog(table) {
  operatingTable.value = table
  Object.assign(transferForm, { target_table_id: '', note: '' })
  transferDialogVisible.value = true
}

async function submitTransferTable() {
  if (!transferFormRef.value || !operatingTable.value) return
  const valid = await transferFormRef.value.validate().catch(() => false)
  if (!valid) return

  operating.value = true
  try {
    await tableApi.transferTable(operatingTable.value.id, {
      target_table_id: transferForm.target_table_id,
      note: transferForm.note || null
    })
    ElMessage.success('换台成功')
    transferDialogVisible.value = false
    await refreshBoard()
  } catch (error) {
    console.error('Failed to transfer table:', error)
    ElMessage.error(getErrorText(error, '换台失败，请确认目标桌台为空闲且同属当前门店'))
  } finally {
    operating.value = false
  }
}

function getErrorText(error, fallback) {
  const detail = error?.response?.data?.detail
  if (Array.isArray(detail)) {
    return detail.map(item => item.msg || item.message).filter(Boolean).join('；') || fallback
  }
  return detail || error?.response?.data?.message || fallback
}

function formatTime(value) {
  if (!value) return '-'
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

onMounted(loadPageData)
</script>

<style scoped>
.table-management {
  display: grid;
  gap: 16px;
  padding: 20px 24px 32px;
}

.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 24px;
  background:
    radial-gradient(circle at top right, rgba(249, 115, 22, 0.14), transparent 34%),
    linear-gradient(135deg, var(--ds-surface) 0%, rgba(248, 234, 215, 0.42) 100%);
}

.hero-actions,
.filter-card,
.metric-card,
.error-card,
.section-title,
.table-card-header,
.table-actions,
.area-actions {
  display: flex;
  align-items: center;
}

.hero-actions {
  gap: 10px;
  flex-wrap: wrap;
}

.error-card {
  gap: 14px;
  padding: 16px 18px;
  color: #991b1b;
  background: #fff7f7;
  border-color: #fecaca;
}

.error-card i {
  font-size: 22px;
}

.error-card p {
  margin: 2px 0 0;
  color: #7f1d1d;
}

.filter-card {
  gap: 12px;
  padding: 16px;
  flex-wrap: wrap;
}

.filter-select {
  width: 220px;
}

.filter-hint {
  color: var(--ds-muted);
  font-size: 13px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.metric-card {
  gap: 12px;
  padding: 16px;
}

.metric-icon {
  width: 44px;
  height: 44px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 19px;
}

.metric-icon.primary {
  color: var(--ds-primary);
  background: var(--ds-primary-soft);
}

.metric-icon.success {
  color: var(--ds-success);
  background: var(--ds-success-soft);
}

.metric-icon.warning {
  color: var(--ds-warning);
  background: var(--ds-warning-soft);
}

.metric-icon.food {
  color: var(--ds-food);
  background: var(--ds-food-soft);
}

.metric-icon.info {
  color: var(--ds-info);
  background: #f1f5f9;
}

.metric-card p {
  margin: 0;
  color: var(--ds-muted);
}

.metric-card strong {
  color: var(--ds-text);
  font-size: 26px;
  line-height: 1.2;
}

.content-grid {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 16px;
  align-items: stretch;
}

.area-panel,
.board-panel,
.log-card,
.empty-guide {
  padding: 22px;
}

.area-panel,
.board-panel {
  min-height: 360px;
  display: flex;
  flex-direction: column;
}

.area-list,
.table-board {
  flex: 1;
}

.section-title {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.section-title h3,
.empty-guide h3 {
  margin: 0;
  color: var(--ds-text);
  font-size: 20px;
  font-weight: 850;
}

.section-title p,
.empty-guide p {
  margin: 4px 0 0;
  color: var(--ds-muted);
}

.empty-guide {
  text-align: center;
}

.empty-guide i {
  color: var(--ds-primary);
  font-size: 44px;
  margin-bottom: 12px;
}

.area-list {
  display: grid;
  gap: 10px;
  align-content: start;
}

.area-item {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--ds-border);
  border-radius: 16px;
  background: #fff;
  cursor: pointer;
  text-align: left;
}

.area-item.active {
  border-color: rgba(37, 99, 235, 0.45);
  background: linear-gradient(135deg, #fff7ed, #fffdfa);
  box-shadow: 0 12px 22px rgba(37, 99, 235, 0.08);
}

.area-item.disabled {
  opacity: 0.72;
}

.area-item span:first-child {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.area-item strong {
  color: var(--ds-text);
}

.area-item small {
  color: var(--ds-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.area-actions {
  gap: 8px;
  flex-shrink: 0;
}

.board-title {
  align-items: flex-start;
}

.table-board {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(235px, 1fr));
  gap: 14px;
  align-content: start;
}

.table-card {
  min-height: 198px;
  padding: 16px;
  border: 1px solid var(--ds-border);
  border-radius: 18px;
  background: #fff;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.table-card.success {
  border-color: rgba(22, 163, 74, 0.32);
  background: linear-gradient(135deg, #fff 0%, #f0fdf4 100%);
}

.table-card.food {
  border-color: rgba(249, 115, 22, 0.34);
  background: linear-gradient(135deg, #fff 0%, #fff7ed 100%);
}

.table-card.warning {
  border-color: rgba(245, 158, 11, 0.34);
  background: linear-gradient(135deg, #fff 0%, #fffbeb 100%);
}

.table-card.primary {
  border-color: rgba(37, 99, 235, 0.32);
  background: linear-gradient(135deg, #fffdfa 0%, #fff7ed 100%);
}

.table-card.info,
.table-card.disabled {
  border-color: #cbd5e1;
  background: #f8fafc;
}

.table-card-header {
  justify-content: space-between;
  gap: 10px;
}

.table-no {
  color: var(--ds-primary);
  font-weight: 850;
}

.table-card h4 {
  margin: 0;
  color: var(--ds-text);
  font-size: 18px;
  font-weight: 850;
}

.table-card p {
  margin: 0;
  color: var(--ds-muted);
  font-size: 13px;
}

.table-card p i {
  width: 16px;
}

.remark {
  min-height: 20px;
  color: #475569 !important;
}

.table-actions {
  gap: 8px;
  flex-wrap: wrap;
  margin-top: auto;
  padding-top: 8px;
}

.log-card {
  overflow: hidden;
  padding-top: 20px;
}

.log-table :deep(.el-table__header th) {
  background: #f8fafc;
  color: #334155;
}

@media (max-width: 1180px) {
  .metrics-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {

  .hero,
  .section-title {
    align-items: stretch;
    flex-direction: column;
  }

  .metrics-grid,
  .table-board {
    grid-template-columns: 1fr;
  }

  .filter-select {
    width: 100%;
  }
}
</style>
