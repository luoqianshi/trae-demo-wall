<template>
  <el-dialog v-model="visible" :title="dialogTitle" width="480px" @open="loadConfig">
    <!-- ComfyUI 配置 -->
    <el-form v-if="serviceType === 'COMFYUI'" :model="form" label-width="100px" label-position="right">
      <el-form-item label="服务地址">
        <el-input v-model="form.endpoint" placeholder="http://localhost:8188" clearable />
      </el-form-item>
      <el-form-item label="API 密钥">
        <el-input v-model="form.apiKey" placeholder="可选" clearable show-password />
      </el-form-item>
      <el-form-item label="启用">
        <el-switch v-model="form.enabled" :active-value="1" :inactive-value="0" />
      </el-form-item>
      <el-form-item label="设为默认">
        <el-switch v-model="form.isDefault" :active-value="1" :inactive-value="0" />
      </el-form-item>
      <el-form-item>
        <el-button :loading="testing" @click="handleTest">测试连接</el-button>
        <el-tag v-if="testResult" :type="testResult.connected ? 'success' : 'danger'" style="margin-left: 12px;">
          {{ testResult.message }}
        </el-tag>
      </el-form-item>
    </el-form>

    <!-- TTS 配置 -->
    <el-form v-else-if="serviceType === 'TTS'" :model="ttsForm" label-width="100px" label-position="right">
      <el-form-item label="服务地址">
        <el-input v-model="ttsForm.endpoint" placeholder="http://localhost:5000" clearable />
      </el-form-item>
      <el-form-item label="API 密钥">
        <el-input v-model="ttsForm.apiKey" placeholder="可选" clearable show-password />
      </el-form-item>
      <el-form-item label="默认音色">
        <el-input v-model="ttsForm.defaultVoice" placeholder="默认音色 ID" clearable />
      </el-form-item>
      <el-form-item label="语速范围">
        <div style="display: flex; gap: 8px;">
          <el-input-number v-model="ttsForm.minSpeed" :min="0.1" :max="1" :step="0.1" size="small" />
          <span>~</span>
          <el-input-number v-model="ttsForm.maxSpeed" :min="1" :max="3" :step="0.1" size="small" />
        </div>
      </el-form-item>
      <el-form-item label="启用">
        <el-switch v-model="ttsForm.enabled" :active-value="1" :inactive-value="0" />
      </el-form-item>
      <el-form-item label="设为默认">
        <el-switch v-model="ttsForm.isDefault" :active-value="1" :inactive-value="0" />
      </el-form-item>
      <el-form-item>
        <el-button :loading="testing" @click="handleTestTts">测试连接</el-button>
        <el-tag v-if="testResult" :type="testResult.connected ? 'success' : 'danger'" style="margin-left: 12px;">
          {{ testResult.message }}
        </el-tag>
      </el-form-item>
    </el-form>

    <!-- RVC 配置 -->
    <el-form v-else-if="serviceType === 'RVC'" :model="rvcForm" label-width="100px" label-position="right">
      <el-form-item label="服务地址">
        <el-input v-model="rvcForm.endpoint" placeholder="http://localhost:6000" clearable />
      </el-form-item>
      <el-form-item label="API 密钥">
        <el-input v-model="rvcForm.apiKey" placeholder="可选" clearable show-password />
      </el-form-item>
      <el-form-item label="模型路径">
        <el-input v-model="rvcForm.modelPath" placeholder="RVC 模型存放路径" clearable />
      </el-form-item>
      <el-form-item label="采样率">
        <el-select v-model="rvcForm.sampleRate" style="width: 100%">
          <el-option label="16000 Hz" :value="16000" />
          <el-option label="22050 Hz" :value="22050" />
          <el-option label="40000 Hz" :value="40000" />
          <el-option label="48000 Hz" :value="48000" />
        </el-select>
      </el-form-item>
      <el-form-item label="启用">
        <el-switch v-model="rvcForm.enabled" :active-value="1" :inactive-value="0" />
      </el-form-item>
      <el-form-item label="设为默认">
        <el-switch v-model="rvcForm.isDefault" :active-value="1" :inactive-value="0" />
      </el-form-item>
      <el-form-item>
        <el-button :loading="testing" @click="handleTestRvc">测试连接</el-button>
        <el-tag v-if="testResult" :type="testResult.connected ? 'success' : 'danger'" style="margin-left: 12px;">
          {{ testResult.message }}
        </el-tag>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  getAiConfig,
  saveAiConfig,
  testComfyUiCustom,
  type ComfyUiTestResult,
  type AiServiceConfig
} from '@/api/frame'
import {
  testTtsService,
  testRvcService
} from '@/api/audio'

const props = defineProps<{
  modelValue: boolean
  serviceType?: 'COMFYUI' | 'TTS' | 'RVC'
}>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved'): void
}>()

const serviceType = computed(() => props.serviceType || 'COMFYUI')

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const dialogTitle = computed(() => {
  const titles: Record<string, string> = {
    COMFYUI: 'ComfyUI 服务配置',
    TTS: 'TTS 服务配置',
    RVC: 'RVC 服务配置'
  }
  return titles[serviceType.value] || 'AI 服务配置'
})

// ComfyUI 配置表单
const form = reactive({
  endpoint: 'http://localhost:8188',
  apiKey: '',
  enabled: 1,
  isDefault: 0
})

// TTS 配置表单
const ttsForm = reactive({
  endpoint: 'http://localhost:5000',
  apiKey: '',
  defaultVoice: '',
  minSpeed: 0.5,
  maxSpeed: 2.0,
  enabled: 1,
  isDefault: 0
})

// RVC 配置表单
const rvcForm = reactive({
  endpoint: 'http://localhost:6000',
  apiKey: '',
  modelPath: '',
  sampleRate: 40000,
  enabled: 1,
  isDefault: 0
})

const testing = ref(false)
const saving = ref(false)
const testResult = ref<ComfyUiTestResult | null>(null)

interface ConfigData {
  endpoint: string
  apiKey: string
  enabled: number
  isDefault: number
  [key: string]: any
}

const loadConfig = async () => {
  testResult.value = null
  try {
    const data: any = await getAiConfig(serviceType.value)
    if (data) {
      if (serviceType.value === 'COMFYUI') {
        form.endpoint = data.endpoint || 'http://localhost:8188'
        form.apiKey = data.apiKey || ''
        form.enabled = data.enabled ?? 1
        form.isDefault = data.isDefault ?? 0
      } else if (serviceType.value === 'TTS') {
        ttsForm.endpoint = data.endpoint || 'http://localhost:5000'
        ttsForm.apiKey = data.apiKey || ''
        ttsForm.defaultVoice = data.defaultVoice || ''
        ttsForm.minSpeed = data.minSpeed ?? 0.5
        ttsForm.maxSpeed = data.maxSpeed ?? 2.0
        ttsForm.enabled = data.enabled ?? 1
        ttsForm.isDefault = data.isDefault ?? 0
      } else if (serviceType.value === 'RVC') {
        rvcForm.endpoint = data.endpoint || 'http://localhost:6000'
        rvcForm.apiKey = data.apiKey || ''
        rvcForm.modelPath = data.modelPath || ''
        rvcForm.sampleRate = data.sampleRate ?? 40000
        rvcForm.enabled = data.enabled ?? 1
        rvcForm.isDefault = data.isDefault ?? 0
      }
    }
  } catch {
    // 未配置，使用默认值
  }
}

const handleTest = async () => {
  if (!form.endpoint) {
    ElMessage.warning('请输入服务地址')
    return
  }
  testing.value = true
  try {
    const data: any = await testComfyUiCustom(form.endpoint, form.apiKey)
    testResult.value = data
    if (data.connected) {
      ElMessage.success('连接成功')
    } else {
      ElMessage.error(data.message || '连接失败')
    }
  } catch (e: any) {
    testResult.value = { connected: false, message: e.message || '连接失败' }
    ElMessage.error('连接失败')
  } finally {
    testing.value = false
  }
}

const handleTestTts = async () => {
  if (!ttsForm.endpoint) {
    ElMessage.warning('请输入服务地址')
    return
  }
  testing.value = true
  try {
    const data: any = await testTtsService({
      endpoint: ttsForm.endpoint,
      apiKey: ttsForm.apiKey
    })
    testResult.value = data
    if (data.connected) {
      ElMessage.success('TTS 连接成功')
    } else {
      ElMessage.error(data.message || '连接失败')
    }
  } catch (e: any) {
    testResult.value = { connected: false, message: e.message || '连接失败' }
    ElMessage.error('连接失败')
  } finally {
    testing.value = false
  }
}

const handleTestRvc = async () => {
  if (!rvcForm.endpoint) {
    ElMessage.warning('请输入服务地址')
    return
  }
  testing.value = true
  try {
    const data: any = await testRvcService({
      endpoint: rvcForm.endpoint,
      apiKey: rvcForm.apiKey
    })
    testResult.value = data
    if (data.connected) {
      ElMessage.success('RVC 连接成功')
    } else {
      ElMessage.error(data.message || '连接失败')
    }
  } catch (e: any) {
    testResult.value = { connected: false, message: e.message || '连接失败' }
    ElMessage.error('连接失败')
  } finally {
    testing.value = false
  }
}

const handleSave = async () => {
  let configData: ConfigData
  if (serviceType.value === 'COMFYUI') {
    if (!form.endpoint) {
      ElMessage.warning('请输入服务地址')
      return
    }
    configData = { ...form }
  } else if (serviceType.value === 'TTS') {
    if (!ttsForm.endpoint) {
      ElMessage.warning('请输入服务地址')
      return
    }
    configData = { ...ttsForm }
  } else if (serviceType.value === 'RVC') {
    if (!rvcForm.endpoint) {
      ElMessage.warning('请输入服务地址')
      return
    }
    configData = { ...rvcForm }
  } else {
    return
  }

  saving.value = true
  try {
    await saveAiConfig({
      serviceType: serviceType.value,
      ...configData
    } as AiServiceConfig)
    ElMessage.success('保存成功')
    emit('saved')
    visible.value = false
  } catch (e: any) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}
</script>