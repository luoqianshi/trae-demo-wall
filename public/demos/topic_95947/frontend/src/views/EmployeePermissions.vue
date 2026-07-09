<template>
  <div class="employee-permissions">
    <section class="hero ds-card">
      <div>
        <p class="ds-eyebrow">权限管理</p>
        <h2 class="ds-page-title">员工权限</h2>
        <p class="ds-page-desc">统一管理员工账号、门店授权和角色权限，确保门店经营数据按岗位安全流转。</p>
      </div>
      <div class="hero-actions">
        <el-button :loading="loading" @click="loadPageData">
          <i class="fas fa-rotate-right"></i>
          刷新
        </el-button>
        <el-button type="primary" @click="openEmployeeDialog()">
          <i class="fas fa-user-plus"></i>
          新增员工
        </el-button>
      </div>
    </section>

    <section v-if="errorMessage" class="error-card ds-card" role="alert">
      <i class="fas fa-circle-exclamation"></i>
      <div>
        <strong>员工权限数据加载失败</strong>
        <p>{{ errorMessage }}</p>
      </div>
      <el-button type="primary" plain @click="loadPageData">重新加载</el-button>
    </section>

    <section class="metrics-grid">
      <article class="metric-card ds-card">
        <span class="metric-icon primary"><i class="fas fa-users"></i></span>
        <div>
          <p>员工总数</p>
          <strong>{{ employees.length }}</strong>
        </div>
      </article>
      <article class="metric-card ds-card">
        <span class="metric-icon success"><i class="fas fa-user-check"></i></span>
        <div>
          <p>启用员工</p>
          <strong>{{ activeEmployeeCount }}</strong>
        </div>
      </article>
      <article class="metric-card ds-card">
        <span class="metric-icon warning"><i class="fas fa-id-badge"></i></span>
        <div>
          <p>角色数量</p>
          <strong>{{ roles.length }}</strong>
        </div>
      </article>
      <article class="metric-card ds-card">
        <span class="metric-icon food"><i class="fas fa-key"></i></span>
        <div>
          <p>权限点</p>
          <strong>{{ permissions.length }}</strong>
        </div>
      </article>
    </section>

    <section class="content-grid">
      <article class="employee-card ds-card">
        <div class="section-title">
          <div>
            <h3>员工列表</h3>
            <p>创建、编辑员工信息，并对员工进行启停管理。</p>
          </div>
          <el-input v-model="employeeKeyword" class="keyword-input" clearable placeholder="搜索姓名、手机号、岗位">
            <template #prefix>
              <i class="fas fa-search"></i>
            </template>
          </el-input>
        </div>

        <DataStateBlock v-if="loading" loading :rows="6" min-height="260px" />
        <DataStateBlock v-else-if="filteredEmployees.length === 0" icon="fas fa-user-plus" title="暂无员工数据"
          description="请先新增员工，并为员工分配角色与门店，避免经营数据权限混乱。" min-height="260px">
          <template #actions>
            <el-button type="primary" @click="openEmployeeDialog()">新增第一位员工</el-button>
          </template>
        </DataStateBlock>
        <el-table v-else :data="filteredEmployees" class="employee-table">
          <el-table-column prop="name" label="员工" min-width="160">
            <template #default="{ row }">
              <div class="employee-name">
                <span>{{ row.name }}</span>
                <small>{{ row.position || '暂未设置岗位' }}</small>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="phone" label="手机号" min-width="130" />
          <el-table-column prop="role_name" label="角色" min-width="130">
            <template #default="{ row }">
              <el-tag type="primary" effect="plain">{{ row.role_name || '未分配角色' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="授权门店" min-width="190">
            <template #default="{ row }">
              <div class="store-tags">
                <el-tag v-for="store in row.store_access" :key="store.store_id" type="success" effect="plain">
                  {{ store.store_name || '未命名门店' }}
                </el-tag>
                <span v-if="!row.store_access?.length" class="muted">未授权门店</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="110">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'">
                {{ row.status === 1 ? '已启用' : '已停用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" fixed="right" width="170">
            <template #default="{ row }">
              <el-button link type="primary" @click="openEmployeeDialog(row)">编辑</el-button>
              <el-button link :type="row.status === 1 ? 'warning' : 'success'" @click="toggleEmployeeStatus(row)">
                {{ row.status === 1 ? '停用' : '启用' }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </article>

      <aside class="role-card ds-card">
        <div class="section-title compact">
          <div>
            <h3>角色权限</h3>
            <p>查看角色拥有的权限点，支持基础授权展示。</p>
          </div>
          <el-button plain @click="openRoleDialog">
            <i class="fas fa-plus"></i>
            新建角色
          </el-button>
        </div>

        <DataStateBlock v-if="!loading && roles.length === 0" icon="fas fa-id-badge" title="暂无角色"
          description="先创建店长、收银员、服务员等角色，再把权限点授权给对应岗位。" compact min-height="190px">
          <template #actions>
            <el-button type="primary" @click="openRoleDialog">创建角色</el-button>
          </template>
        </DataStateBlock>
        <div v-else class="role-list">
          <button v-for="role in roles" :key="role.id" type="button"
            :class="['role-item', { active: selectedRoleId === role.id }]" @click="selectedRoleId = role.id">
            <span>
              <strong>{{ role.name }}</strong>
              <small>{{ role.description || role.code }}</small>
            </span>
            <el-tag size="small" :type="role.status === 1 ? 'success' : 'info'">
              {{ role.is_system ? '系统角色' : '自定义' }}
            </el-tag>
          </button>
        </div>

        <div v-if="selectedRole" class="permission-panel">
          <div class="permission-header">
            <div>
              <h4>{{ selectedRole.name }}权限</h4>
              <p>已授权 {{ selectedPermissionIds.length }} / {{ permissions.length }} 个权限点</p>
            </div>
            <el-button type="primary" plain :loading="savingPermissions" @click="saveRolePermissions">
              保存授权
            </el-button>
          </div>
          <el-checkbox-group v-model="selectedPermissionIds" class="permission-groups">
            <div v-for="group in permissionGroups" :key="group.module" class="permission-group">
              <div class="permission-group-title">{{ group.module }}</div>
              <el-checkbox v-for="permission in group.items" :key="permission.id" :label="permission.id">
                <span>{{ permission.name }}</span>
                <small>{{ permission.description || permission.code }}</small>
              </el-checkbox>
            </div>
          </el-checkbox-group>
          <DataStateBlock v-if="permissions.length === 0" icon="fas fa-key" title="暂无权限点"
            description="后端初始化权限后将自动展示，可再为角色勾选对应操作范围。" compact min-height="170px" />
        </div>
      </aside>
    </section>

    <el-dialog v-model="employeeDialogVisible" :title="editingEmployeeId ? '编辑员工' : '新增员工'" width="620px"
      destroy-on-close>
      <el-form ref="employeeFormRef" :model="employeeForm" :rules="employeeRules" label-width="96px">
        <el-form-item label="姓名" prop="name">
          <el-input v-model="employeeForm.name" placeholder="请输入员工姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="employeeForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="岗位">
          <el-input v-model="employeeForm.position" placeholder="如：店长、收银员、服务员" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="employeeForm.email" placeholder="可选，用于接收系统通知" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="employeeForm.role_id" clearable placeholder="请选择角色">
            <el-option v-for="role in roles" :key="role.id" :label="role.name" :value="role.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="主门店">
          <el-select v-model="employeeForm.store_id" clearable placeholder="请选择主门店">
            <el-option v-for="store in stores" :key="store.id" :label="store.name" :value="store.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="授权门店">
          <el-select v-model="employeeForm.store_ids" multiple collapse-tags placeholder="请选择可访问门店">
            <el-option v-for="store in stores" :key="store.id" :label="store.name" :value="store.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="employeeForm.remark" type="textarea" :rows="3" placeholder="可填写交接说明或账号备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="employeeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingEmployee" @click="saveEmployee">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="roleDialogVisible" title="新建角色" width="520px" destroy-on-close>
      <el-form ref="roleFormRef" :model="roleForm" :rules="roleRules" label-width="90px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="roleForm.name" placeholder="如：店长、收银员" />
        </el-form-item>
        <el-form-item label="角色编码" prop="code">
          <el-input v-model="roleForm.code" placeholder="如：store_manager" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="roleForm.description" type="textarea" :rows="3" placeholder="说明角色职责范围" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="savingRole" @click="saveRole">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { employeeApi, merchantApi } from '@/api'
import DataStateBlock from '@/components/DataStateBlock.vue'

const employees = ref([])
const roles = ref([])
const permissions = ref([])
const stores = ref([])
const loading = ref(false)
const errorMessage = ref('')
const employeeKeyword = ref('')
const selectedRoleId = ref('')
const selectedPermissionIds = ref([])

const employeeDialogVisible = ref(false)
const roleDialogVisible = ref(false)
const savingEmployee = ref(false)
const savingRole = ref(false)
const savingPermissions = ref(false)
const editingEmployeeId = ref('')
const employeeFormRef = ref(null)
const roleFormRef = ref(null)

const employeeForm = reactive({
  name: '',
  phone: '',
  position: '',
  email: '',
  role_id: '',
  store_id: '',
  store_ids: [],
  remark: ''
})

const roleForm = reactive({
  name: '',
  code: '',
  description: ''
})

const employeeRules = {
  name: [{ required: true, message: '请输入员工姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { min: 3, max: 20, message: '手机号长度需在 3-20 位之间', trigger: 'blur' }
  ]
}

const roleRules = {
  name: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  code: [{ required: true, message: '请输入角色编码', trigger: 'blur' }]
}

const activeEmployeeCount = computed(() => employees.value.filter(item => item.status === 1).length)
const filteredEmployees = computed(() => {
  const keyword = employeeKeyword.value.trim().toLowerCase()
  if (!keyword) return employees.value
  return employees.value.filter(item => [item.name, item.phone, item.position, item.role_name]
    .filter(Boolean)
    .some(value => String(value).toLowerCase().includes(keyword)))
})
const selectedRole = computed(() => roles.value.find(role => role.id === selectedRoleId.value))
const permissionGroups = computed(() => {
  const groups = new Map()
  permissions.value.forEach(permission => {
    const moduleName = permission.module || '基础权限'
    if (!groups.has(moduleName)) groups.set(moduleName, [])
    groups.get(moduleName).push(permission)
  })
  return Array.from(groups.entries()).map(([module, items]) => ({ module, items }))
})

watch(selectedRole, (role) => {
  selectedPermissionIds.value = role?.permissions?.map(permission => permission.id) || []
})

async function loadPageData() {
  loading.value = true
  errorMessage.value = ''
  try {
    const [employeeResult, roleResult, permissionResult, storeResult] = await Promise.all([
      employeeApi.getEmployees(),
      employeeApi.getRoles(),
      employeeApi.getPermissions(),
      merchantApi.getStores({ silentError: true })
    ])
    employees.value = employeeResult.items || []
    roles.value = roleResult || []
    permissions.value = permissionResult || []
    stores.value = storeResult || []
    if (!selectedRoleId.value && roles.value.length > 0) {
      selectedRoleId.value = roles.value[0].id
    }
  } catch (error) {
    console.error('Failed to load employee permission data:', error)
    errorMessage.value = getErrorText(error, '请检查网络或后端员工权限接口是否正常')
  } finally {
    loading.value = false
  }
}

function getErrorText(error, fallback) {
  const detail = error?.response?.data?.detail
  if (Array.isArray(detail)) {
    return detail.map(item => item.msg || item.message).filter(Boolean).join('，') || fallback
  }
  return detail || error?.response?.data?.message || fallback
}

function resetEmployeeForm() {
  editingEmployeeId.value = ''
  Object.assign(employeeForm, {
    name: '',
    phone: '',
    position: '',
    email: '',
    role_id: '',
    store_id: '',
    store_ids: [],
    remark: ''
  })
}

function openEmployeeDialog(row) {
  resetEmployeeForm()
  if (row) {
    editingEmployeeId.value = row.id
    Object.assign(employeeForm, {
      name: row.name || '',
      phone: row.phone || '',
      position: row.position || '',
      email: row.email || '',
      role_id: row.role_id || '',
      store_id: row.store_id || '',
      store_ids: row.store_access?.map(item => item.store_id) || [],
      remark: row.remark || ''
    })
  }
  employeeDialogVisible.value = true
}

async function saveEmployee() {
  if (!employeeFormRef.value) return
  const valid = await employeeFormRef.value.validate().catch(() => false)
  if (!valid) return

  savingEmployee.value = true
  try {
    const payload = {
      name: employeeForm.name,
      phone: employeeForm.phone,
      position: employeeForm.position || null,
      email: employeeForm.email || null,
      role_id: employeeForm.role_id || null,
      store_id: employeeForm.store_id || null,
      remark: employeeForm.remark || null
    }
    if (editingEmployeeId.value) {
      await employeeApi.updateEmployee(editingEmployeeId.value, payload)
      if (employeeForm.store_ids.length > 0) {
        await employeeApi.assignEmployeeStores(editingEmployeeId.value, employeeForm.store_ids)
      }
      ElMessage.success('员工信息已更新')
    } else {
      await employeeApi.createEmployee({ ...payload, store_ids: employeeForm.store_ids })
      ElMessage.success('员工已创建')
    }
    employeeDialogVisible.value = false
    await loadPageData()
  } catch (error) {
    console.error('Failed to save employee:', error)
    ElMessage.error(getErrorText(error, '员工保存失败，请稍后重试'))
  } finally {
    savingEmployee.value = false
  }
}

async function toggleEmployeeStatus(row) {
  const nextStatus = row.status === 1 ? 0 : 1
  const actionText = nextStatus === 1 ? '启用' : '停用'
  try {
    await ElMessageBox.confirm(`确定${actionText}员工「${row.name}」吗？`, `${actionText}确认`, {
      type: nextStatus === 1 ? 'success' : 'warning'
    })
    await employeeApi.updateEmployeeStatus(row.id, nextStatus)
    ElMessage.success(`员工已${actionText}`)
    await loadPageData()
  } catch (error) {
    if (error === 'cancel' || error === 'close') return
    console.error('Failed to toggle employee status:', error)
    ElMessage.error(getErrorText(error, `${actionText}失败，请稍后重试`))
  }
}

function openRoleDialog() {
  Object.assign(roleForm, { name: '', code: '', description: '' })
  roleDialogVisible.value = true
}

async function saveRole() {
  if (!roleFormRef.value) return
  const valid = await roleFormRef.value.validate().catch(() => false)
  if (!valid) return

  savingRole.value = true
  try {
    const role = await employeeApi.createRole({
      name: roleForm.name,
      code: roleForm.code,
      description: roleForm.description || null
    })
    ElMessage.success('角色已创建')
    roleDialogVisible.value = false
    await loadPageData()
    selectedRoleId.value = role.id
  } catch (error) {
    console.error('Failed to save role:', error)
    ElMessage.error(getErrorText(error, '角色创建失败，请检查编码是否重复'))
  } finally {
    savingRole.value = false
  }
}

async function saveRolePermissions() {
  if (!selectedRole.value) {
    ElMessage.warning('请先选择角色')
    return
  }

  savingPermissions.value = true
  try {
    const role = await employeeApi.updateRolePermissions(selectedRole.value.id, selectedPermissionIds.value)
    const index = roles.value.findIndex(item => item.id === role.id)
    if (index >= 0) roles.value.splice(index, 1, role)
    ElMessage.success('角色授权已保存')
  } catch (error) {
    console.error('Failed to save role permissions:', error)
    ElMessage.error(getErrorText(error, '角色授权保存失败，请稍后重试'))
  } finally {
    savingPermissions.value = false
  }
}

onMounted(loadPageData)
</script>

<style scoped>
.employee-permissions {
  display: grid;
  gap: 20px;
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
.section-title,
.metric-card,
.error-card,
.permission-header {
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

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.metric-card {
  gap: 14px;
  padding: 18px;
}

.metric-icon {
  width: 46px;
  height: 46px;
  border-radius: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
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
  grid-template-columns: minmax(0, 1.45fr) minmax(360px, 0.9fr);
  gap: 20px;
  align-items: start;
}

.employee-card,
.role-card {
  padding: 22px;
}

.section-title {
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.section-title.compact {
  align-items: flex-start;
}

.section-title h3 {
  margin: 0;
  color: var(--ds-text);
  font-size: 20px;
  font-weight: 850;
}

.section-title p,
.permission-header p {
  margin: 4px 0 0;
  color: var(--ds-muted);
}

.keyword-input {
  width: 260px;
}

.employee-name {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.employee-name span {
  font-weight: 800;
  color: var(--ds-text);
}

.employee-name small,
.muted,
.role-item small,
.permission-group small {
  color: var(--ds-muted);
}

.store-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.employee-table :deep(.el-table__header th) {
  background: #f8fafc;
  color: #334155;
}

.role-list {
  display: grid;
  gap: 10px;
  margin-bottom: 18px;
}

.role-item {
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

.role-item.active {
  border-color: rgba(37, 99, 235, 0.45);
  background: linear-gradient(135deg, #fff7ed, #fffdfa);
  box-shadow: 0 12px 22px rgba(37, 99, 235, 0.08);
}

.role-item span {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.permission-panel {
  border-top: 1px solid var(--ds-border);
  padding-top: 18px;
}

.permission-header {
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.permission-header h4 {
  margin: 0;
  color: var(--ds-text);
  font-size: 17px;
}

.permission-groups {
  display: grid;
  gap: 14px;
}

.permission-group {
  padding: 14px;
  border-radius: 16px;
  background: #f8fafc;
}

.permission-group-title {
  margin-bottom: 8px;
  color: var(--ds-primary);
  font-weight: 850;
}

.permission-group :deep(.el-checkbox) {
  height: auto;
  margin: 0 12px 10px 0;
  white-space: normal;
}

.permission-group :deep(.el-checkbox__label) {
  display: inline-flex;
  flex-direction: column;
  gap: 2px;
  vertical-align: top;
}

@media (max-width: 1180px) {

  .content-grid,
  .metrics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 760px) {

  .hero,
  .section-title,
  .permission-header {
    align-items: stretch;
    flex-direction: column;
  }

  .metrics-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }

  .keyword-input {
    width: 100%;
  }
}
</style>
