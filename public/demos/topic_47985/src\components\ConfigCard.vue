<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { X, Key, Globe, CheckCircle, AlertCircle } from 'lucide-vue-next'
import CryptoJS from 'crypto-js'

const props = defineProps<{
  onClose: () => void
}>()

const emit = defineEmits<{
  save: [apiKey: string, baseUrl: string, model: string]
}>()

const apiKey = ref('')
const baseUrl = ref('')
const model = ref('deepseek-v4-pro')
const showApiKey = ref(false)
const saved = ref(false)

// 可选模型列表
const models = [
  { value: 'deepseek-v4-pro', label: 'DeepSeek V4 Pro' },
  { value: 'deepseek-v4-flash', label: 'DeepSeek V4 Flash' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini' },
  { value: 'gpt-4o', label: 'GPT-4o' },
]

// 加密密钥（固定值）
const secretKey = 'eqagent-2024-secret'

onMounted(() => {
  // 从 localStorage 读取配置
  const savedKey = localStorage.getItem('eqagent_api_key')
  const savedUrl = localStorage.getItem('eqagent_base_url')
  const savedModel = localStorage.getItem('eqagent_model')
  
  if (savedKey) {
    try {
      // 解密 API Key
      const decrypted = CryptoJS.AES.decrypt(savedKey, secretKey).toString(CryptoJS.enc.Utf8)
      if (decrypted) {
        apiKey.value = decrypted
        saved.value = true
      }
    } catch {
      // 解密失败，忽略
    }
  }
  
  if (savedUrl) {
    baseUrl.value = savedUrl
  }
  
  if (savedModel) {
    model.value = savedModel
  }
})

// 保存配置
function saveConfig() {
  if (!apiKey.value.trim()) {
    alert('请填写 API Key')
    return
  }

  // 加密并存储
  const encryptedKey = CryptoJS.AES.encrypt(apiKey.value, secretKey).toString()
  localStorage.setItem('eqagent_api_key', encryptedKey)
  localStorage.setItem('eqagent_base_url', baseUrl.value)
  localStorage.setItem('eqagent_model', model.value)
  
  saved.value = true
  emit('save', apiKey.value, baseUrl.value, model.value)
}

// 删除配置
function clearConfig() {
  localStorage.removeItem('eqagent_api_key')
  localStorage.removeItem('eqagent_base_url')
  localStorage.removeItem('eqagent_model')
  apiKey.value = ''
  baseUrl.value = ''
  model.value = 'deepseek-v4-pro'
  saved.value = false
}
</script>

<template>
  <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
    <div class="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
      <!-- 标题栏 -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div class="flex items-center gap-2">
          <Key class="w-5 h-5 text-orange-500" />
          <h3 class="text-lg font-semibold text-slate-800">API 配置</h3>
        </div>
        <button 
          @click="props.onClose"
          class="p-1 text-slate-400 hover:text-slate-600 rounded transition-colors"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- 内容 -->
      <div class="px-6 py-4 space-y-4">
        <!-- 状态提示 -->
        <div v-if="saved" class="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-2 rounded-lg">
          <CheckCircle class="w-4 h-4" />
          <span class="text-sm">API Key 已配置</span>
        </div>

        <div v-else class="flex items-center gap-2 text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
          <AlertCircle class="w-4 h-4" />
          <span class="text-sm">请先配置 API Key 才能使用 AI 对话功能</span>
        </div>

        <!-- API Key 输入 -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">API Key</label>
          <div class="relative">
            <input 
              v-model="apiKey"
              :type="showApiKey ? 'text' : 'password'"
              placeholder="sk-xxx 或其他格式的 Key"
              class="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button 
              @click="showApiKey = !showApiKey"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-700"
            >
              {{ showApiKey ? '隐藏' : '显示' }}
            </button>
          </div>
        </div>

        <!-- Base URL 输入 -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">
            <span class="flex items-center gap-1">
              <Globe class="w-4 h-4" />
              API Base URL（可选）
            </span>
          </label>
          <input 
            v-model="baseUrl"
            type="text"
            placeholder="https://api.deepseek.com/v1"
            class="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <p class="text-xs text-slate-500 mt-1">
            DeepSeek 默认：https://api.deepseek.com/v1
          </p>
        </div>

        <!-- 模型选择 -->
        <div>
          <label class="block text-sm font-medium text-slate-700 mb-1">AI 模型</label>
          <select 
            v-model="model"
            class="w-full px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option v-for="m in models" :key="m.value" :value="m.value">
              {{ m.label }}
            </option>
          </select>
        </div>

        <!-- 说明 -->
        <div class="bg-slate-50 px-3 py-2 rounded-lg">
          <p class="text-xs text-slate-600">
            <strong>注意：</strong>API Key 仅存储在本地浏览器中，加密保存，不会上传到任何服务器。
          </p>
        </div>
      </div>

      <!-- 按钮 -->
      <div class="px-6 py-4 border-t border-slate-200 flex gap-3">
        <button 
          v-if="saved"
          @click="clearConfig"
          class="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          清除配置
        </button>
        <button 
          @click="props.onClose"
          class="flex-1 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
        >
          取消
        </button>
        <button 
          @click="saveConfig"
          class="flex-1 px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          保存
        </button>
      </div>
    </div>
  </div>
</template>