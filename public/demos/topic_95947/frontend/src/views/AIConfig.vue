<template>
  <div class="ai-config">
    <div class="config-header">
      <div class="header-title">
        <i class="fas fa-robot"></i>
        <h1>AI配置</h1>
      </div>
    </div>

    <div class="config-content">
      <div class="config-section">
        <div class="section-header">
          <i class="fas fa-key"></i>
          <h2>基础设置</h2>
        </div>
        <div class="settings-card">
          <el-form :model="basicSettings" label-width="140px">
            <el-form-item label="API Key">
              <el-input v-model="basicSettings.apiKey" type="password" placeholder="输入DeepSeek API Key" show-password />
            </el-form-item>
            <el-form-item label="API Base URL">
              <el-input v-model="basicSettings.apiBaseUrl" placeholder="https://api.deepseek.com" />
            </el-form-item>
            <el-form-item label="模型名称">
              <el-select v-model="basicSettings.modelName">
                <el-option label="deepseek-chat" value="deepseek-chat" />
                <el-option label="deepseek-chat-v1.5" value="deepseek-chat-v1.5" />
                <el-option label="deepseek-coder" value="deepseek-coder" />
              </el-select>
            </el-form-item>
            <el-form-item label="温度参数">
              <el-slider v-model="basicSettings.temperature" :min="0" :max="1" :step="0.1" show-input />
              <span class="slider-hint">控制AI回答的随机性，0为最严谨，1为最随机</span>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveBasicSettings">
                <i class="fas fa-save"></i>
                <span>保存设置</span>
              </el-button>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <div class="config-section">
        <div class="section-header">
          <i class="fas fa-brain"></i>
          <h2>智能体管理</h2>
          <el-button type="primary" size="small" @click="showAddAgentDialog = true">
            <i class="fas fa-plus" style="color: #fff !important"></i>
            <span>添加智能体</span>
          </el-button>
        </div>
        <div class="agents-grid">
          <div v-for="agent in agents" :key="agent.id" :class="['agent-card', { active: selectedAgent === agent.id }]"
            @click="selectAgent(agent.id)">
            <div class="agent-icon" :style="{ background: agent.color }">
              <i :class="agent.icon"></i>
            </div>
            <div class="agent-info">
              <h3>{{ agent.name }}</h3>
              <p>{{ agent.description }}</p>
            </div>
            <div class="agent-actions">
              <button @click.stop="editAgent(agent)" class="action-btn edit">
                <i class="fas fa-edit"></i>
              </button>
              <button @click.stop="deleteAgent(agent.id)" class="action-btn delete">
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="config-section">
        <div class="section-header">
          <i class="fas fa-cogs"></i>
          <h2>技能配置</h2>
          <el-button type="primary" size="small" @click="showAddSkillDialog = true">
            <i class="fas fa-plus " style="color: #fff !important"></i>
            <span>添加技能</span>
          </el-button>
        </div>
        <div class="skills-list">
          <div v-for="skill in skills" :key="skill.id" class="skill-item">
            <div class="skill-header">
              <div class="skill-icon">
                <i :class="skill.icon"></i>
              </div>
              <div class="skill-info">
                <h3>{{ skill.name }}</h3>
                <p>{{ skill.description }}</p>
              </div>
              <div class="skill-status">
                <el-switch v-model="skill.enabled" @change="toggleSkill(skill)" />
              </div>
            </div>
            <div class="skill-config" v-if="skill.enabled">
              <div class="config-row">
                <span class="config-label">触发关键词:</span>
                <span class="config-value">{{ skill.triggers.join(', ') }}</span>
              </div>
              <div class="config-row">
                <span class="config-label">优先级:</span>
                <span class="config-value">{{ skill.priority }}</span>
              </div>
              <div class="config-row">
                <span class="config-label">关联智能体:</span>
                <span class="config-value">{{ getAgentName(skill.agentId) }}</span>
              </div>
            </div>
            <div class="skill-actions">
              <button @click="testSkill(skill)" class="action-btn test">
                <i class="fas fa-play"></i>
                <span>测试</span>
              </button>
              <button @click="editSkill(skill)" class="action-btn edit">
                <i class="fas fa-edit"></i>
                <span>编辑</span>
              </button>
              <button @click="deleteSkill(skill.id)" class="action-btn delete">
                <i class="fas fa-trash"></i>
                <span>删除</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="config-section">
        <div class="section-header">
          <i class="fas fa-users"></i>
          <h2>多AI协作</h2>
        </div>
        <div class="collab-card">
          <div class="collab-intro">
            <i class="fas fa-comments"></i>
            <p>启用多AI协作模式后，当您提出复杂问题时，系统会自动调度多个专业智能体进行讨论，最终给出综合答案。</p>
          </div>
          <div class="collab-settings">
            <div class="setting-row">
              <span>启用多AI协作</span>
              <el-switch v-model="collabSettings.enabled" />
            </div>
            <div class="setting-row">
              <span style="width: 300px;">参与讨论的智能体数量</span>
              <el-select v-model="collabSettings.agentCount" :disabled="!collabSettings.enabled">
                <el-option label="2个" :value="2" />
                <el-option label="3个" :value="3" />
                <el-option label="4个" :value="4" />
              </el-select>
            </div>
            <div class="setting-row">
              <span style="width: 300px;">讨论轮数</span>
              <el-select v-model="collabSettings.rounds" :disabled="!collabSettings.enabled">
                <el-option label="2轮" :value="2" />
                <el-option label="3轮" :value="3" />
                <el-option label="5轮" :value="5" />
              </el-select>
            </div>
          </div>
          <el-button type="primary" @click="saveCollabSettings">
            <i class="fas fa-save"></i>
            <span>保存协作设置</span>
          </el-button>
        </div>
      </div>
    </div>

    <el-dialog v-model="showAddAgentDialog" title="添加智能体" width="500px">
      <el-form :model="newAgent" label-width="100px">
        <el-form-item label="名称">
          <el-input v-model="newAgent.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="newAgent.description" type="textarea" rows="2" />
        </el-form-item>
        <el-form-item label="图标">
          <el-select v-model="newAgent.icon">
            <el-option label="🤖 机器人" value="fas fa-robot" />
            <el-option label="📊 图表" value="fas fa-chart-line" />
            <el-option label="📈 分析" value="fas fa-chart-bar" />
            <el-option label="💡 创意" value="fas fa-lightbulb" />
            <el-option label="🎯 目标" value="fas fa-target" />
            <el-option label="👔 专业" value="fas fa-briefcase" />
          </el-select>
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="newAgent.color" show-alpha />
        </el-form-item>
        <el-form-item label="系统提示词">
          <el-input v-model="newAgent.systemPrompt" type="textarea" rows="4" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddAgentDialog = false">取消</el-button>
        <el-button type="primary" @click="addAgent">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showAddSkillDialog" title="添加技能" width="500px">
      <el-form :model="newSkill" label-width="100px">
        <el-form-item label="名称">
          <el-input v-model="newSkill.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="newSkill.description" type="textarea" rows="2" />
        </el-form-item>
        <el-form-item label="图标">
          <el-select v-model="newSkill.icon">
            <el-option label="🔧 工具" value="fas fa-wrench" />
            <el-option label="🤝 服务" value="fas fa-handshake" />
            <el-option label="⚡ 快速" value="fas fa-bolt" />
            <el-option label="🔍 搜索" value="fas fa-search" />
            <el-option label="📝 记录" value="fas fa-file-alt" />
          </el-select>
        </el-form-item>
        <el-form-item label="触发关键词">
          <el-input v-model="skillTriggersInput" placeholder="多个关键词用逗号分隔" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-slider v-model="newSkill.priority" :min="1" :max="10" show-input />
        </el-form-item>
        <el-form-item label="关联智能体">
          <el-select v-model="newSkill.agentId">
            <el-option v-for="agent in agents" :key="agent.id" :label="agent.name" :value="agent.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddSkillDialog = false">取消</el-button>
        <el-button type="primary" @click="addSkill">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showTestSkillDialog" :title="`测试技能：${currentTestSkill?.name}`" width="600px">
      <div class="test-skill-content">
        <div class="test-input-section">
          <el-input v-model="testInput" type="textarea" :rows="3"
            :placeholder="`输入测试问题，例如：'${currentTestSkill?.triggers?.[0] || '测试'}'`" />
        </div>
        <div class="test-result-section" v-if="testResult">
          <div class="result-header">
            <span>测试结果</span>
            <span :class="['result-status', testSuccess ? 'success' : 'error']">
              {{ testSuccess ? '成功' : '失败' }}
            </span>
          </div>
          <div class="result-content" v-html="formatTestResult(testResult)" />
        </div>
      </div>
      <template #footer>
        <el-button @click="showTestSkillDialog = false">关闭</el-button>
        <el-button type="primary" @click="runSkillTest" :loading="testLoading">
          <i class="fas fa-play"></i>
          <span>开始测试</span>
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { authFetch } from '@/utils/request'
import { aiApi } from '@/api'

const basicSettings = reactive({
  apiKey: '',
  apiBaseUrl: 'https://api.deepseek.com',
  modelName: 'deepseek-chat',
  temperature: 0.7
})

const agents = ref([
  { id: 'operations', name: '运营助手', description: '专业运营顾问，随时为您解答', icon: 'fas fa-robot', color: '#b45309', systemPrompt: '你是一个专业的餐饮运营助手...' },
  { id: 'market', name: '市场分析AI', description: '洞察市场趋势，分析竞品动态', icon: 'fas fa-chart-line', color: '#10b981', systemPrompt: '你是一个专业的市场分析AI...' },
  { id: 'data', name: '数据分析AI', description: '深度数据分析，发现业务洞察', icon: 'fas fa-chart-bar', color: '#f59e0b', systemPrompt: '你是一个专业的数据分析AI...' }
])

const selectedAgent = ref('operations')

const skills = ref([
  { id: 1, name: '销售数据分析', description: '分析销售数据，发现业务趋势', icon: 'fas fa-chart-line', enabled: true, triggers: ['销售', '营业额', '销量', '数据分析'], priority: 5, agentId: 'data' },
  { id: 2, name: '菜单优化建议', description: '根据销售数据提供菜单优化建议', icon: 'fas fa-utensils', enabled: true, triggers: ['菜单', '菜品', '优化', '定价'], priority: 4, agentId: 'operations' },
  { id: 3, name: '竞品分析', description: '分析竞争对手，发现市场机会', icon: 'fas fa-search', enabled: true, triggers: ['竞品', '竞争', '对手', '市场分析'], priority: 3, agentId: 'market' },
  { id: 4, name: '营销活动策划', description: '策划营销活动，提升客户复购', icon: 'fas fa-bullhorn', enabled: true, triggers: ['营销', '活动', '促销', '复购'], priority: 4, agentId: 'operations' },
  { id: 5, name: '会员管理建议', description: '提供会员运营和管理建议', icon: 'fas fa-users', enabled: true, triggers: ['会员', '客户', '用户', '管理'], priority: 5, agentId: 'data' }
])

const collabSettings = reactive({
  enabled: false,
  agentCount: 3,
  rounds: 3
})

const showAddAgentDialog = ref(false)
const showAddSkillDialog = ref(false)
const editingAgentId = ref('')

const newAgent = reactive({
  name: '',
  description: '',
  icon: 'fas fa-robot',
  color: '#b45309',
  systemPrompt: ''
})

const newSkill = reactive({
  name: '',
  description: '',
  icon: 'fas fa-wrench',
  triggers: [],
  priority: 5,
  agentId: ''
})

const skillTriggersInput = ref('')

const showTestSkillDialog = ref(false)
const currentTestSkill = ref(null)
const testInput = ref('')
const testResult = ref('')
const testLoading = ref(false)
const testSuccess = ref(true)

function selectAgent(id) {
  selectedAgent.value = id
}

function getAgentName(agentId) {
  const agent = agents.value.find(a => a.id === agentId)
  return agent ? agent.name : '未知'
}

async function saveBasicSettings() {
  await new Promise(r => setTimeout(r, 500))
  ElMessage.success('基础设置保存成功')
}

function editAgent(agent) {
  if (agent.is_builtin) {
    ElMessage.info('内置智能体不可直接编辑，可新增自定义智能体覆盖业务场景')
    return
  }
  editingAgentId.value = agent.configId || agent.id
  Object.assign(newAgent, {
    name: agent.name,
    description: agent.description,
    icon: agent.icon,
    color: agent.color,
    systemPrompt: agent.systemPrompt || agent.system_prompt || ''
  })
  showAddAgentDialog.value = true
}

async function deleteAgent(id) {
  if (agents.value.length <= 1) {
    ElMessage.warning('至少保留一个智能体')
    return
  }
  const agent = agents.value.find(a => a.id === id)
  if (agent?.is_builtin) {
    ElMessage.warning('内置智能体不可删除')
    return
  }
  try {
    await aiApi.deleteAgent(agent?.configId || id)
    await loadAgents()
    ElMessage.success('智能体删除成功')
  } catch (error) {
    console.error('Delete agent failed:', error)
    ElMessage.error('智能体删除失败')
  }
}

async function addAgent() {
  if (!newAgent.name) {
    ElMessage.warning('请输入智能体名称')
    return
  }
  try {
    const payload = {
      name: newAgent.name,
      description: newAgent.description,
      icon: newAgent.icon,
      color: newAgent.color,
      system_prompt: newAgent.systemPrompt,
      enabled: true
    }
    if (editingAgentId.value) {
      await aiApi.updateAgent(editingAgentId.value, payload)
      ElMessage.success('智能体编辑成功')
    } else {
      await aiApi.createAgent(payload)
      ElMessage.success('智能体添加成功')
    }
    showAddAgentDialog.value = false
    editingAgentId.value = ''
    resetAgentForm()
    await loadAgents()
  } catch (error) {
    console.error('Save agent failed:', error)
    ElMessage.error('智能体保存失败')
  }
}

function resetAgentForm() {
  newAgent.name = ''
  newAgent.description = ''
  newAgent.icon = 'fas fa-robot'
  newAgent.color = '#b45309'
  newAgent.systemPrompt = ''
}

function editSkill(skill) {
  Object.assign(newSkill, skill)
  skillTriggersInput.value = skill.triggers.join(', ')
  showAddSkillDialog.value = true
}

function deleteSkill(id) {
  skills.value = skills.value.filter(s => s.id !== id)
  ElMessage.success('技能删除成功')
}

function toggleSkill(skill) {
  ElMessage.success(skill.enabled ? `技能「${skill.name}」已启用` : `技能「${skill.name}」已禁用`)
}

function addSkill() {
  if (!newSkill.name) {
    ElMessage.warning('请输入技能名称')
    return
  }
  newSkill.triggers = skillTriggersInput.value.split(',').map(t => t.trim()).filter(Boolean)
  const skill = {
    id: Date.now(),
    ...newSkill
  }
  skills.value.push(skill)
  showAddSkillDialog.value = false
  ElMessage.success('技能添加成功')
  newSkill.name = ''
  newSkill.description = ''
  newSkill.icon = 'fas fa-wrench'
  newSkill.triggers = []
  newSkill.priority = 5
  newSkill.agentId = ''
  skillTriggersInput.value = ''
}

function testSkill(skill) {
  currentTestSkill.value = skill
  testInput.value = ''
  testResult.value = ''
  showTestSkillDialog.value = true
}

async function runSkillTest() {
  if (!testInput.value.trim()) {
    ElMessage.warning('请输入测试问题')
    return
  }
  testLoading.value = true
  testResult.value = ''
  try {
    const response = await authFetch('/api/ai/chat/stream', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: testInput.value.trim(),
        agent_type: currentTestSkill.value.agentId
      })
    })
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let result = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value, { stream: true })
      const lines = text.split('\n\n')
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            break
          }
          try {
            const parsed = JSON.parse(data)
            if (parsed.error) {
              throw new Error(parsed.error)
            }
          } catch {
          }
          result += data
        }
      }
    }
    testResult.value = result
    testSuccess.value = true
  } catch (error) {
    testResult.value = error.message
    testSuccess.value = false
  } finally {
    testLoading.value = false
  }
}

function formatTestResult(content) {
  if (!content) return ''
  return content
    .replace(/```(\w+)?\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>')
}

async function saveCollabSettings() {
  await new Promise(r => setTimeout(r, 500))
  ElMessage.success('协作设置保存成功')
}

async function loadAgents() {
  try {
    const result = await aiApi.getAgents({ include_disabled: true })
    agents.value = result.map(item => ({
      id: item.agent_type,
      configId: item.id,
      name: item.name,
      description: item.description,
      icon: item.icon,
      color: item.color,
      systemPrompt: item.system_prompt,
      is_builtin: item.is_builtin,
      enabled: item.enabled
    }))
  } catch (error) {
    console.error('Load agents failed:', error)
    ElMessage.error('智能体配置加载失败')
  }
}

onMounted(loadAgents)
</script>

<style scoped>
.ai-config {
  padding: 0;
  background: var(--ds-bg);
  min-height: 100vh;
}

.config-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px 18px;
  background: var(--ds-surface);
  border: 1px solid var(--ds-border);
  border-radius: 18px;
  box-shadow: var(--ds-shadow-card);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-title i {
  font-size: 28px;
  color: var(--ds-primary);
}

.header-title h1 {
  margin: 0;
  font-size: 24px;
  color: #1f2937;
}

.config-content {
  display: grid;
  gap: 16px;
}

.config-section {
  background: var(--ds-surface);
  border: 1px solid var(--ds-border);
  border-radius: 16px;
  padding: 18px;
  box-shadow: var(--ds-shadow-card);
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--ds-border);
}

.section-header i {
  font-size: 20px;
  color: var(--ds-primary);
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  flex: 1;
}

.settings-card {
  max-width: 600px;
}

.settings-card .el-form-item {
  margin-bottom: 20px;
}

.slider-hint {
  display: block;
  font-size: 12px;
  color: #9ca3af;
  margin-top: 8px;
}

.agents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.agent-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--ds-border);
  background: #fffefa;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.agent-card:hover {
  border-color: var(--ds-primary);
  box-shadow: 0 10px 24px rgba(180, 83, 9, 0.12);
}

.agent-card.active {
  border-color: var(--ds-primary);
  background: var(--ds-primary-soft);
}

.agent-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.agent-icon i {
  font-size: 24px;
  color: white;
}

.agent-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
}

.agent-info p {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.agent-actions {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.agent-card:hover .agent-actions {
  opacity: 1;
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
  transition: all 0.3s ease;
}

.action-btn.edit {
  background: #f3f4f6;
  color: #6b7280;
}

.action-btn.edit:hover {
  background: #e5e7eb;
}

.action-btn.delete {
  background: #fef2f2;
  color: #ef4444;
}

.action-btn.delete:hover {
  background: #fee2e2;
}

.action-btn.test {
  background: #ecfdf5;
  color: #10b981;
}

.action-btn.test:hover {
  background: #d1fae5;
}

.skills-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.skill-item {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid var(--ds-border);
  background: #fffefa;
}

.skill-header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.skill-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--ds-primary), var(--ds-food));
  display: flex;
  align-items: center;
  justify-content: center;
}

.skill-icon i {
  font-size: 18px;
  color: white;
}

.skill-info h3 {
  margin: 0 0 4px 0;
  font-size: 15px;
  font-weight: 600;
}

.skill-info p {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
}

.skill-status {
  margin-left: auto;
}

.skill-config {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.config-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
}

.config-label {
  font-size: 13px;
  color: #9ca3af;
}

.config-value {
  font-size: 13px;
  color: #1f2937;
  font-weight: 500;
}

.skill-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;
}

.skill-actions .action-btn {
  width: auto;
  padding: 8px 16px;
  font-size: 13px;
}

.collab-card {
  padding: 18px;
  background: linear-gradient(135deg, rgba(255, 247, 237, 0.92), rgba(255, 253, 250, 0.96));
  border: 1px solid rgba(180, 83, 9, 0.14);
  border-radius: 12px;
}

.collab-intro {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 24px;
}

.collab-intro i {
  font-size: 24px;
  color: var(--ds-primary);
  flex-shrink: 0;
}

.collab-intro p {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  line-height: 1.6;
}

.collab-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-radius: 8px;
}

.setting-row span:first-child {
  font-size: 14px;
  color: #374151;
}

.el-button i {
  margin-right: 6px;
}

.test-skill-content {
  padding: 8px 0;
}

.test-input-section {
  margin-bottom: 20px;
}

.test-result-section {
  background: #fafafa;
  border-radius: 8px;
  padding: 16px;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 600;
  font-size: 14px;
}

.result-status {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.result-status.success {
  background: #ecfdf5;
  color: #10b981;
}

.result-status.error {
  background: #fef2f2;
  color: #ef4444;
}

.result-content {
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
  white-space: pre-wrap;
}

.result-content pre {
  background: #1f2937;
  color: #e5e7eb;
  padding: 12px;
  border-radius: 6px;
  overflow-x: auto;
}

.result-content code {
  background: #f3f4f6;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

@media (max-width: 768px) {
  .config-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .agents-grid {
    grid-template-columns: 1fr;
  }

  .skill-header {
    flex-wrap: wrap;
  }

  .skill-status {
    margin-left: 0;
    margin-top: 8px;
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
