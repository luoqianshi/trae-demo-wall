<template>
  <div class="family-page">
    <div class="page-card">
      <div class="page-header">
        <h2 class="page-title">家庭组管理</h2>
        <el-button type="primary" @click="openCreateDialog">创建家庭组</el-button>
      </div>

      <div class="content-row">
        <!-- 家庭组列表 -->
        <div class="group-list">
          <h3 class="section-title">我的家庭组</h3>
          <div v-loading="loading" class="group-cards">
            <div
              v-for="group in groups"
              :key="group.id"
              class="group-card"
              :class="{ active: group.id === selectedGroupId }"
              @click="selectGroup(group.id)"
            >
              <div class="group-name">{{ group.name }}</div>
              <div class="group-id">ID: {{ group.id }}</div>
            </div>
            <div v-if="!loading && groups.length === 0" class="empty-tip">
              暂无家庭组，请先创建
            </div>
          </div>
        </div>

        <!-- 成员列表 -->
        <div class="member-list">
          <div class="member-header">
            <h3 class="section-title">家庭成员</h3>
            <el-button
              v-if="selectedGroupId"
              size="small"
              type="primary"
              @click="openInviteDialog"
            >
              邀请成员
            </el-button>
          </div>

          <el-table v-loading="memberLoading" :data="members" stripe>
            <el-table-column label="姓名" prop="name" min-width="100" />
            <el-table-column label="角色" min-width="90">
              <template #default="{ row }">
                {{ row.role === 'OWNER' ? '创建者' : '成员' }}
              </template>
            </el-table-column>
            <el-table-column label="查看授权" min-width="100">
              <template #default="{ row }">
                <el-tag :type="row.authorizedView === 1 ? 'success' : 'info'" size="small">
                  {{ row.authorizedView === 1 ? '已授权' : '未授权' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="加入时间" min-width="150">
              <template #default="{ row }">
                {{ formatTime(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button
                  v-if="row.role !== 'OWNER'"
                  link
                  type="primary"
                  size="small"
                  @click="toggleAuthorize(row)"
                >
                  {{ row.authorizedView === 1 ? '取消授权' : '授权查看' }}
                </el-button>
                <el-button
                  v-if="row.authorizedView === 1"
                  link
                  type="success"
                  size="small"
                  @click="viewHealth(row)"
                >
                  查看健康
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div v-if="!memberLoading && selectedGroupId && members.length === 0" class="empty-tip">
            暂无成员
          </div>
        </div>
      </div>
    </div>

    <!-- 创建家庭组弹窗 -->
    <el-dialog v-model="createVisible" title="创建家庭组" width="420px">
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="家庭组名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入家庭组名称" maxlength="30" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="handleCreate">确认创建</el-button>
      </template>
    </el-dialog>

    <!-- 邀请成员弹窗 -->
    <el-dialog v-model="inviteVisible" title="邀请家庭成员" width="420px">
      <el-form label-position="top">
        <el-form-item label="被邀请人手机号">
          <el-input v-model="invitePhone" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="inviteVisible = false">取消</el-button>
        <el-button type="primary" :loading="inviting" @click="handleInvite">确认邀请</el-button>
      </template>
    </el-dialog>

    <!-- 成员健康指标弹窗 -->
    <el-dialog v-model="healthVisible" title="成员健康指标" width="640px">
      <el-table :data="memberMetrics" stripe>
        <el-table-column label="指标名称" prop="name" min-width="120" />
        <el-table-column label="当前值" min-width="120">
          <template #default="{ row }">
            {{ row.value }} {{ row.unit }}
          </template>
        </el-table-column>
        <el-table-column label="正常范围" prop="normalRange" min-width="120" />
        <el-table-column label="状态" min-width="100">
          <template #default="{ row }">
            <el-tag :type="alertTagType(row.alertLevel)" size="small">
              {{ alertText(row.alertLevel) }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import {
  createGroup,
  getGroupMembers,
  inviteMember,
  authorizeView,
  getMemberHealth,
  type FamilyMemberVO
} from '@/api/family'
import { type MetricVO, type AlertLevel } from '@/api/health'
import logger from '@/utils/logger'

// 本地家庭组结构（后端 createGroup 仅返回 ID，前端需维护名称展示）
interface LocalGroup {
  id: number
  name: string
}

const loading = ref(false)
const memberLoading = ref(false)
const creating = ref(false)
const inviting = ref(false)

const groups = ref<LocalGroup[]>([])
const selectedGroupId = ref<number | null>(null)
const members = ref<FamilyMemberVO[]>([])

const formRef = ref<FormInstance>()
const createVisible = ref(false)
const inviteVisible = ref(false)
const invitePhone = ref('')

const healthVisible = ref(false)
const memberMetrics = ref<MetricVO[]>([])

const form = reactive({
  name: ''
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入家庭组名称', trigger: 'blur' }]
}

// 告警等级标签类型
const alertTagType = (level: AlertLevel): 'success' | 'warning' | 'danger' => {
  const typeMap: Record<AlertLevel, 'success' | 'warning' | 'danger'> = {
    NORMAL: 'success',
    WARNING: 'warning',
    DANGER: 'danger'
  }
  return typeMap[level]
}

// 告警等级文案
const alertText = (level: AlertLevel): string => {
  const textMap: Record<AlertLevel, string> = {
    NORMAL: '正常',
    WARNING: '预警',
    DANGER: '危险'
  }
  return textMap[level]
}

// 格式化时间
const formatTime = (iso: string): string => {
  if (!iso) {
    return '-'
  }
  return iso.replace('T', ' ').substring(0, 16)
}

// 选择家庭组，加载成员
const selectGroup = async (groupId: number): Promise<void> => {
  selectedGroupId.value = groupId
  await loadMembers()
}

// 加载成员列表
const loadMembers = async (): Promise<void> => {
  if (!selectedGroupId.value) {
    return
  }
  memberLoading.value = true
  try {
    members.value = await getGroupMembers(selectedGroupId.value)
  } catch (e) {
    logger.error('加载家庭成员失败', e)
  } finally {
    memberLoading.value = false
  }
}

// 打开创建弹窗
const openCreateDialog = (): void => {
  form.name = ''
  createVisible.value = true
}

// 确认创建
const handleCreate = async (): Promise<void> => {
  if (!formRef.value) {
    return
  }
  try {
    await formRef.value.validate()
  } catch {
    return
  }

  creating.value = true
  try {
    const groupId = await createGroup({ name: form.name })
    // 后端仅返回 ID，前端追加到本地列表展示
    groups.value.push({ id: groupId, name: form.name })
    ElMessage.success('家庭组创建成功')
    createVisible.value = false
    // 自动选中新创建的家庭组
    await selectGroup(groupId)
  } catch (e) {
    logger.error('创建家庭组失败', e)
  } finally {
    creating.value = false
  }
}

// 打开邀请弹窗
const openInviteDialog = (): void => {
  invitePhone.value = ''
  inviteVisible.value = true
}

// 确认邀请
const handleInvite = async (): Promise<void> => {
  if (!selectedGroupId.value) {
    return
  }
  if (!/^1\d{10}$/.test(invitePhone.value)) {
    ElMessage.error('请输入正确的手机号')
    return
  }

  inviting.value = true
  try {
    await inviteMember(selectedGroupId.value, invitePhone.value)
    ElMessage.success('邀请成功')
    inviteVisible.value = false
    await loadMembers()
  } catch (e) {
    logger.error('邀请成员失败', e)
  } finally {
    inviting.value = false
  }
}

// 切换授权
const toggleAuthorize = async (member: FamilyMemberVO): Promise<void> => {
  if (!selectedGroupId.value) {
    return
  }
  const newStatus = member.authorizedView === 1 ? 0 : 1
  try {
    await authorizeView(selectedGroupId.value, member.id, newStatus)
    ElMessage.success(newStatus === 1 ? '已授权查看' : '已取消授权')
    await loadMembers()
  } catch (e) {
    logger.error('切换授权失败', e)
  }
}

// 查看成员健康指标
const viewHealth = async (member: FamilyMemberVO): Promise<void> => {
  if (!selectedGroupId.value) {
    return
  }
  try {
    memberMetrics.value = await getMemberHealth(selectedGroupId.value, member.id)
    healthVisible.value = true
  } catch (e) {
    logger.error('查看成员健康失败', e)
  }
}

onMounted(() => {
  // 初始无家庭组列表接口，由用户创建后维护；这里可扩展为后端提供我的家庭组列表
  loading.value = false
})
</script>

<style scoped lang="scss">
.family-page {
  max-width: 1200px;
  padding: 24px 32px 48px;
  margin: 0 auto;
}

.page-card {
  padding: 24px 28px;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.content-row {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 20px;
}

.group-list {
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
}

.section-title {
  margin-bottom: 12px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.group-cards {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 120px;
}

.group-card {
  padding: 12px;
  background: #ffffff;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 2px solid transparent;
}

.group-card:hover {
  border-color: #667eea;
}

.group-card.active {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.08);
}

.group-name {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.group-id {
  margin-top: 4px;
  font-size: 12px;
  color: #909399;
}

.member-list {
  min-width: 0;
}

.member-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.empty-tip {
  padding: 24px 0;
  font-size: 14px;
  color: #909399;
  text-align: center;
}
</style>
