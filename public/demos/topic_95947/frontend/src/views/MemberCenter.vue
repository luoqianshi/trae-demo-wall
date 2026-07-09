<template>
  <div class="member-center">
    <ModuleAIPanel module="会员中心" title="AI 会员运营诊断" />
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon blue">
          <i class="fas fa-users"></i>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ stats.total_members || 0 }}</p>
          <p class="stat-label">总会员数</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">
          <i class="fas fa-gem"></i>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ stats.vip_members || 0 }}</p>
          <p class="stat-label">VIP会员</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">
          <i class="fas fa-wallet"></i>
        </div>
        <div class="stat-info">
          <p class="stat-value">¥{{ (stats.total_balance || 0).toLocaleString() }}</p>
          <p class="stat-label">会员总消费</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon purple">
          <i class="fas fa-percent"></i>
        </div>
        <div class="stat-info">
          <p class="stat-value">{{ stats.avg_consumption || 68 }}%</p>
          <p class="stat-label">平均消费频次</p>
        </div>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <h3><i class="fas fa-chart-pie"></i> 会员等级分布</h3>
        </div>
        <div class="chart-content">
          <div class="pie-chart">
            <svg viewBox="0 0 120 120">
              <circle cx="60" cy="60" r="45" fill="none" stroke="#e5e7eb" stroke-width="12" />
              <circle cx="60" cy="60" r="45" fill="none" stroke="#9ca3af" stroke-width="12"
                :stroke-dasharray="levelDistribution.normal * 2.83" stroke-dashoffset="0" transform="rotate(-90 60 60)" />
              <circle cx="60" cy="60" r="45" fill="none" stroke="#b45309" stroke-width="12"
                :stroke-dasharray="levelDistribution.silver * 2.83" :stroke-dashoffset="-levelDistribution.normal * 2.83"
                transform="rotate(-90 60 60)" />
              <circle cx="60" cy="60" r="45" fill="none" stroke="#f59e0b" stroke-width="12"
                :stroke-dasharray="levelDistribution.gold * 2.83" :stroke-dashoffset="-(levelDistribution.normal + levelDistribution.silver) * 2.83"
                transform="rotate(-90 60 60)" />
              <circle cx="60" cy="60" r="45" fill="none" stroke="#ec4899" stroke-width="12"
                :stroke-dasharray="levelDistribution.diamond * 2.83"
                :stroke-dashoffset="-(levelDistribution.normal + levelDistribution.silver + levelDistribution.gold) * 2.83"
                transform="rotate(-90 60 60)" />
            </svg>
            <div class="pie-center">
              <p class="pie-total">{{ stats.total_members || 0 }}</p>
              <p class="pie-label">总会员</p>
            </div>
          </div>
          <div class="legend">
            <div class="legend-item"><span class="legend-color" style="background: #9ca3af;"></span><span>普通 {{ levelDistribution.normal }}%</span></div>
            <div class="legend-item"><span class="legend-color" style="background: #b45309;"></span><span>银卡 {{ levelDistribution.silver }}%</span></div>
            <div class="legend-item"><span class="legend-color" style="background: #f59e0b;"></span><span>金卡 {{ levelDistribution.gold }}%</span></div>
            <div class="legend-item"><span class="legend-color" style="background: #ec4899;"></span><span>钻石 {{ levelDistribution.diamond }}%</span></div>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="card-header">
          <h3><i class="fas fa-trending-up"></i> 本月新增会员</h3>
        </div>
        <div class="chart-content">
          <div class="trend-chart">
            <div v-for="(item, index) in monthlyTrend" :key="index" class="trend-bar-item">
              <div class="bar-wrapper">
                <div class="bar" :style="{ height: (animatedHeights[index] + '%') }"></div>
              </div>
              <span class="bar-label">{{ item.day }}</span>
              <span class="bar-value">{{ item.count }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="chart-card">
        <div class="card-header">
          <h3><i class="fas fa-star"></i> 活跃会员榜</h3>
        </div>
        <div class="chart-content">
          <div class="ranking-list">
            <div v-for="(member, index) in topMembers" :key="member.id" :class="['ranking-item', { top: index < 3 }]">
              <span class="rank">{{ index + 1 }}</span>
              <div class="member-avatar-sm" :style="{ background: getLevelColor(member.level) }">
                <i class="fas fa-user"></i>
              </div>
              <div class="member-detail">
                <p class="member-name">{{ member.name }}</p>
                <p class="member-consumption">¥{{ member.total_spent }}</p>
              </div>
              <span class="member-total">¥{{ member.total_spent.toFixed(0) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="search-section">
      <div class="panel-card">
        <div class="card-header">
          <h3><i class="fas fa-search"></i> 会员搜索</h3>
        </div>
        <div class="search-form">
          <el-input v-model="searchKeyword" placeholder="搜索会员姓名/手机号" @keyup.enter="searchMembers" clearable>
            <template #prefix><i class="fas fa-search"></i></template>
          </el-input>
          <el-select v-model="searchLevel" placeholder="会员等级" clearable style="width: 140px;">
            <el-option label="普通会员" :value="1" />
            <el-option label="银卡会员" :value="2" />
            <el-option label="金卡会员" :value="3" />
            <el-option label="钻石会员" :value="4" />
          </el-select>
          <el-button type="primary" @click="searchMembers">搜索</el-button>
        </div>
      </div>
    </div>

    <div class="member-section">
      <div class="panel-card">
        <div class="card-header">
          <h3><i class="fas fa-users"></i> 会员列表</h3>
          <button @click="showAddModal = true" class="add-btn">
            <i class="fas fa-plus"></i> 添加会员
          </button>
        </div>
        <div class="member-table">
          <table>
            <thead>
              <tr>
                <th>会员信息</th>
                <th>等级</th>
                <th>余额</th>
                <th>积分</th>
                <th>累计消费</th>
                <th>最近访问</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="member in members" :key="member.id" class="member-row">
                <td>
                  <div class="member-info">
                    <div class="member-avatar" :style="{ background: getLevelColor(member.level) }">
                      <i class="fas fa-user"></i>
                    </div>
                    <div>
                      <p class="member-name">{{ member.name }}</p>
                      <p class="member-phone">{{ member.phone }}</p>
                    </div>
                  </div>
                </td>
                <td>
                  <span :class="['level-tag', getLevelClass(member.level)]">{{ getLevelName(member.level) }}</span>
                </td>
                <td>¥{{ member.total_spent.toFixed(2) }}</td>
                <td>{{ member.points }}</td>
                <td>{{ member.total_spent }}</td>
                <td>{{ formatDate(member.last_visit) }}</td>
                <td class="action-cell">
                  <button @click="viewMember(member)" class="action-btn view" title="查看详情"><i
                      class="fas fa-eye"></i></button>
                  <button @click="editMember(member)" class="action-btn edit" title="编辑"><i
                      class="fas fa-edit"></i></button>
                  <button @click="deleteMember(member)" class="action-btn delete" title="删除"><i
                      class="fas fa-trash"></i></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="total"
            :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next, jumper" @size-change="loadMembers"
            @current-change="loadMembers" />
        </div>
      </div>
    </div>

    <el-dialog v-model="showAddModal" title="添加会员" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="姓名">
          <el-input v-model="form.name" placeholder="请输入会员姓名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="会员等级">
          <el-select v-model="form.level" placeholder="请选择等级">
            <el-option label="普通会员" :value="1" />
            <el-option label="银卡会员" :value="2" />
            <el-option label="金卡会员" :value="3" />
            <el-option label="钻石会员" :value="4" />
          </el-select>
        </el-form-item>
        <el-form-item label="积分">
          <el-input v-model.number="form.points" placeholder="请输入积分" type="number" />
        </el-form-item>
        <el-form-item label="累计消费">
          <el-input v-model.number="form.total_spent" placeholder="请输入累计消费" type="number" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddModal = false">取消</el-button>
        <el-button type="primary" @click="submitMember">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showDetailModal" title="会员详情" width="600px">
      <div v-if="selectedMember" class="member-detail-content">
        <div class="detail-header">
          <div class="detail-avatar" :style="{ background: getLevelColor(selectedMember.level) }">
            <i class="fas fa-user"></i>
          </div>
          <div class="detail-info">
            <h4>{{ selectedMember.name }}</h4>
            <span :class="['level-tag', getLevelClass(selectedMember.level)]">{{ getLevelName(selectedMember.level) }}</span>
            <p>{{ selectedMember.phone }}</p>
          </div>
        </div>
        <div class="detail-stats">
          <div class="detail-stat">
            <p class="detail-value">¥{{ selectedMember.total_spent.toFixed(2) }}</p>
            <p class="detail-label">累计消费</p>
          </div>
          <div class="detail-stat">
            <p class="detail-value">{{ selectedMember.points }}</p>
            <p class="detail-label">积分</p>
          </div>
          <div class="detail-stat">
            <p class="detail-value">{{ getLevelName(selectedMember.level) }}</p>
            <p class="detail-label">会员等级</p>
          </div>
          <div class="detail-stat">
            <p class="detail-value">{{ formatDate(selectedMember.created_at) }}</p>
            <p class="detail-label">注册日期</p>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetailModal = false">关闭</el-button>
        <el-button type="primary" @click="editMember(selectedMember)">编辑</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { memberApi } from '@/api'
import ModuleAIPanel from '@/components/ModuleAIPanel.vue'

const members = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)
const searchKeyword = ref('')
const searchLevel = ref('')
const showAddModal = ref(false)
const showDetailModal = ref(false)
const selectedMember = ref(null)
const stats = ref({})
const levelDistribution = ref({ normal: 45, silver: 30, gold: 18, diamond: 7 })
const topMembers = ref([])

const animatedHeights = ref([0, 0, 0, 0, 0, 0, 0])

const monthlyTrend = ref([
  { day: '1日', count: 5 },
  { day: '5日', count: 12 },
  { day: '10日', count: 8 },
  { day: '15日', count: 18 },
  { day: '20日', count: 15 },
  { day: '25日', count: 22 },
  { day: '30日', count: 10 }
])

const maxTrend = computed(() => Math.max(...monthlyTrend.value.map(item => item.count)))

const form = reactive({
  name: '',
  phone: '',
  level: 1,
  points: 0,
  total_spent: 0
})

function getLevelName(level) {
  const names = {
    1: '普通会员',
    2: '银卡会员',
    3: '金卡会员',
    4: '钻石会员'
  }
  return names[level] || '普通会员'
}

function getLevelClass(level) {
  const classes = {
    1: 'normal',
    2: 'silver',
    3: 'gold',
    4: 'diamond'
  }
  return classes[level] || 'normal'
}

function getLevelColor(level) {
  const colors = {
    1: '#9ca3af',
    2: '#b45309',
    3: '#f59e0b',
    4: '#ec4899'
  }
  return colors[level] || '#9ca3af'
}

function formatDate(date) {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN')
}

function animateBars() {
  monthlyTrend.value.forEach((item, index) => {
    const targetHeight = (item.count / maxTrend.value) * 100
    let currentHeight = 0
    const interval = setInterval(() => {
      currentHeight += targetHeight / 20
      if (currentHeight >= targetHeight) {
        animatedHeights.value[index] = targetHeight
        clearInterval(interval)
      } else {
        animatedHeights.value[index] = currentHeight
      }
    }, 30)
  })
}

async function loadMembers() {
  try {
    const params = {}
    if (searchKeyword.value) params.keyword = searchKeyword.value
    if (searchLevel.value) params.level = searchLevel.value
    
    const response = await memberApi.getMembers(params)
    members.value = response.data || response
    total.value = members.value.length
  } catch (error) {
    console.error('加载会员失败:', error)
    ElMessage.error('加载会员失败')
  }
}

async function searchMembers() {
  currentPage.value = 1
  await loadMembers()
}

async function loadStats() {
  try {
    const [statsRes, distributionRes, topRes] = await Promise.all([
      memberApi.getMemberStats(),
      memberApi.getLevelDistribution(),
      memberApi.getTopActive({ limit: 5 })
    ])
    
    stats.value = statsRes.data || statsRes
    levelDistribution.value = distributionRes.data || distributionRes
    topMembers.value = topRes.data || topRes
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

function viewMember(member) {
  selectedMember.value = member
  showDetailModal.value = true
}

function editMember(member) {
  form.name = member.name
  form.phone = member.phone
  form.level = member.level
  form.points = member.points
  form.total_spent = member.total_spent
  selectedMember.value = member
  showAddModal.value = true
}

async function deleteMember(member) {
  await ElMessageBox.confirm(`确定要删除会员 ${member.name} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      await memberApi.deleteMember(member.id)
      members.value = members.value.filter(m => m.id !== member.id)
      total.value -= 1
      ElMessage.success(`已删除会员 ${member.name}`)
      await loadStats()
    } catch (error) {
      ElMessage.error('删除失败')
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

async function submitMember() {
  if (!form.name || !form.phone) {
    ElMessage.error('请填写完整信息')
    return
  }
  
  try {
    if (selectedMember.value) {
      await memberApi.updateMember(selectedMember.value.id, form)
      ElMessage.success('会员信息更新成功')
    } else {
      await memberApi.createMember(form)
      ElMessage.success('会员添加成功')
    }
    
    showAddModal.value = false
    form.name = ''
    form.phone = ''
    form.level = 1
    form.points = 0
    form.total_spent = 0
    selectedMember.value = null
    
    await loadMembers()
    await loadStats()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

onMounted(() => {
  loadMembers()
  loadStats()
  setTimeout(() => {
    animateBars()
  }, 300)
})
</script>

<style scoped>
.member-center {
  padding: 0;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.blue {
  background: linear-gradient(135deg, var(--ds-primary), var(--ds-food));
}

.stat-icon.green {
  background: linear-gradient(135deg, #10b981, #059669);
}

.stat-icon.orange {
  background: linear-gradient(135deg, #f59e0b, #d97706);
}

.stat-icon.purple {
  background: linear-gradient(135deg, #7c2d12, var(--ds-primary));
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
}

.stat-label {
  font-size: 14px;
  color: #6b7280;
  margin: 4px 0 0 0;
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.chart-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  height: 400px;
  overflow: hidden;
}

.chart-card .card-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
  margin: 0;
}

.chart-card .card-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 6px;
}

.chart-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.pie-chart {
  position: relative;
  width: 140px;
  height: 140px;
  margin: 0 auto 12px;
}

.pie-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

.pie-total {
  font-size: 22px;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
}

.pie-label {
  font-size: 11px;
  color: #6b7280;
  margin: 2px 0 0 0;
}

.legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #64748b;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 4px;
}

.trend-chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 200px;
}

.trend-bar-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.bar-wrapper {
  width: 22px;
  height: 120px;
  background: #f1f5f9;
  border-radius: 11px;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}

.bar {
  width: 100%;
  background: linear-gradient(180deg, var(--ds-primary), var(--ds-food));
  border-radius: 11px;
  transition: height 0.5s ease;
}

.bar-label {
  font-size: 11px;
  color: #9ca3af;
}

.bar-value {
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border-radius: 10px;
  background: #f8fafc;
  transition: all 0.3s ease;
}

.ranking-item:hover {
  background: #f1f5f9;
  transform: translateX(4px);
}

.ranking-item.top {
  background: linear-gradient(135deg, #fef3c7, #fffbeb);
}

.rank {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: bold;
  color: #6b7280;
}

.ranking-item.top .rank {
  background: #f59e0b;
  color: white;
}

.member-avatar-sm {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.member-avatar-sm i {
  font-size: 15px;
}

.member-detail {
  flex: 1;
  min-width: 0;
}

.member-detail .member-name {
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-consumption {
  font-size: 12px;
  color: #9ca3af;
  margin: 2px 0 0 0;
}

.member-total {
  font-weight: 600;
  color: var(--ds-primary);
  font-size: 14px;
}

.search-section {
  width: 100%;
  margin-bottom: 20px;
}

.member-section {
  width: 100%;
}

.panel-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.card-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.add-btn {
  padding: 8px 16px;
  background-color: var(--ds-primary);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.3s ease;
}

.add-btn:hover {
  background-color: var(--ds-primary-700);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(180, 83, 9, 0.22);
}

.search-form {
  display: flex;
  gap: 12px;
  align-items: center;
  width: 100%;
}

.search-form :deep(.el-input) {
  flex: 1;
}

.search-form :deep(.el-button) {
  flex-shrink: 0;
}

.member-table {
  overflow-x: auto;
}

.member-table table {
  width: 100%;
  border-collapse: collapse;
}

.member-table th {
  text-align: left;
  padding: 12px 16px;
  background-color: #f8fafc;
  font-weight: 600;
  font-size: 14px;
  color: #64748b;
  border-bottom: 2px solid #e2e8f0;
}

.member-table td {
  padding: 16px;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
  color: #374151;
}

.member-row {
  transition: all 0.3s ease;
}

.member-row:hover {
  background-color: #f8fafc;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.member-avatar i {
  font-size: 20px;
}

.member-info .member-name {
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.member-info .member-phone {
  font-size: 12px;
  color: #9ca3af;
  margin: 4px 0 0 0;
}

.level-tag {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.level-tag.normal {
  background: #f3f4f6;
  color: #6b7280;
}

.level-tag.silver {
  background: var(--ds-primary-soft);
  color: var(--ds-primary-700);
}

.level-tag.gold {
  background: #fef3c7;
  color: #b45309;
}

.level-tag.diamond {
  background: #fce7f3;
  color: #be185d;
}

.action-cell {
  display: flex;
  justify-content: center;
  align-items: center;
}

.action-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 6px;
  transition: all 0.3s ease;
  opacity: 0.7;
}

.member-row:hover .action-btn {
  opacity: 1;
}

.action-btn.view {
  background: var(--ds-primary-soft);
  color: var(--ds-primary);
}

.action-btn.view:hover {
  background: #fff7ed;
  transform: scale(1.1);
}

.action-btn.edit {
  background: #fef3c7;
  color: #f59e0b;
}

.action-btn.edit:hover {
  background: #fde68a;
  transform: scale(1.1);
}

.action-btn.delete {
  background: #fee2e2;
  color: #ef4444;
}

.action-btn.delete:hover {
  background: #fecaca;
  transform: scale(1.1);
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.member-detail-content {
  padding: 8px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 20px;
}

.detail-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.detail-avatar i {
  font-size: 36px;
}

.detail-info {
  flex: 1;
}

.detail-info h4 {
  font-size: 20px;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
}

.detail-info p {
  font-size: 14px;
  color: #6b7280;
  margin: 8px 0 0 0;
}

.detail-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.detail-stat {
  text-align: center;
  padding: 16px;
  background: #f8fafc;
  border-radius: 12px;
}

.detail-value {
  font-size: 20px;
  font-weight: bold;
  color: #1f2937;
  margin: 0;
}

.detail-label {
  font-size: 12px;
  color: #6b7280;
  margin: 4px 0 0 0;
}
</style>
