<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Clip } from '@/stores/editor'
import { Delete, Close } from '@element-plus/icons-vue'

const props = defineProps<{
  clip: Clip
}>()

const emit = defineEmits<{
  (e: 'update', updates: Partial<Clip>): void
  (e: 'delete'): void
}>()

const clipName = ref('')
const volume = ref(100)
const opacity = ref(100)
const speed = ref(1.0)
const inTransition = ref('')
const outTransition = ref('')
const transitionDuration = ref(500)

const transitions = [
  { value: '', label: '无' },
  { value: 'fade', label: '淡入淡出' },
  { value: 'dissolve', label: '溶解' },
  { value: 'slide', label: '滑动' },
  { value: 'zoom', label: '缩放' },
  { value: 'rotate', label: '旋转' }
]

watch(() => props.clip, (clip) => {
  clipName.value = clip.clipName
  volume.value = clip.volume
  opacity.value = clip.opacity
  speed.value = clip.speed
  inTransition.value = clip.inTransition || ''
  outTransition.value = clip.outTransition || ''
  transitionDuration.value = clip.transitionDuration || 500
}, { immediate: true })

const handleUpdate = (field: string, value: any) => {
  emit('update', { [field]: value })
}

const handleDelete = () => {
  emit('delete')
}

const formatDuration = (ms: number) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const formatTime = (ms: number) => {
  const seconds = Math.floor(ms / 1000)
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  const remainingMs = Math.floor((ms % 1000) / 10)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}.${remainingMs.toString().padStart(2, '0')}`
}
</script>

<template>
  <div class="property-panel">
    <div class="panel-header">
      <h3>属性面板</h3>
      <el-button
        class="delete-btn"
        size="small"
        type="danger"
        @click="handleDelete"
      >
        <el-icon><Delete /></el-icon>
        删除
      </el-button>
    </div>

    <div class="panel-content">
      <div class="section">
        <h4>基本信息</h4>
        <el-form :model="{ clipName }" label-width="70px">
          <el-form-item label="名称">
            <el-input
              v-model="clipName"
              @change="(val) => handleUpdate('clipName', val)"
            />
          </el-form-item>
          <el-form-item label="类型">
            <el-tag>{{ clip.sourceType === 'video' ? '视频' : clip.sourceType === 'audio' ? '音频' : '图片' }}</el-tag>
          </el-form-item>
          <el-form-item label="时长">
            <span class="info-value">{{ formatDuration(clip.duration) }}</span>
          </el-form-item>
          <el-form-item label="位置">
            <span class="info-value">{{ formatTime(clip.startPosition) }}</span>
          </el-form-item>
          <el-form-item label="源偏移">
            <span class="info-value">{{ formatTime(clip.sourceStart) }}</span>
          </el-form-item>
        </el-form>
      </div>

      <div class="section">
        <h4>播放设置</h4>
        <el-form :model="{ volume, opacity, speed }" label-width="70px">
          <el-form-item label="音量">
            <div class="slider-row">
              <el-slider
                v-model="volume"
                :min="0"
                :max="100"
                @change="(val) => handleUpdate('volume', val)"
              />
              <span class="slider-value">{{ volume }}%</span>
            </div>
          </el-form-item>
          <el-form-item label="透明度">
            <div class="slider-row">
              <el-slider
                v-model="opacity"
                :min="0"
                :max="100"
                @change="(val) => handleUpdate('opacity', val)"
              />
              <span class="slider-value">{{ opacity }}%</span>
            </div>
          </el-form-item>
          <el-form-item label="播放速度">
            <div class="slider-row">
              <el-slider
                v-model="speed"
                :min="0.5"
                :max="2"
                :step="0.1"
                @change="(val) => handleUpdate('speed', val)"
              />
              <span class="slider-value">{{ speed }}x</span>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <div class="section" v-if="clip.sourceType === 'video' || clip.sourceType === 'image'">
        <h4>转场效果</h4>
        <el-form :model="{ inTransition, outTransition, transitionDuration }" label-width="70px">
          <el-form-item label="入转场">
            <el-select
              v-model="inTransition"
              placeholder="选择转场"
              @change="(val) => handleUpdate('inTransition', val)"
            >
              <el-option
                v-for="t in transitions"
                :key="t.value"
                :label="t.label"
                :value="t.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="出转场">
            <el-select
              v-model="outTransition"
              placeholder="选择转场"
              @change="(val) => handleUpdate('outTransition', val)"
            >
              <el-option
                v-for="t in transitions"
                :key="t.value"
                :label="t.label"
                :value="t.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="转场时长">
            <div class="slider-row">
              <el-slider
                v-model="transitionDuration"
                :min="100"
                :max="2000"
                :step="100"
                @change="(val) => handleUpdate('transitionDuration', val)"
              />
              <span class="slider-value">{{ transitionDuration }}ms</span>
            </div>
          </el-form-item>
        </el-form>
      </div>

      <div class="section">
        <h4>特效</h4>
        <el-form label-width="70px">
          <el-form-item>
            <el-button size="small">添加特效</el-button>
          </el-form-item>
          <el-form-item>
            <div v-if="clip.effects" class="effects-list">
              <div class="effect-item">
                <span class="effect-name">自定义特效</span>
                <el-icon class="effect-remove"><Close /></el-icon>
              </div>
            </div>
            <div v-else class="empty-effects">
              <p>暂无特效</p>
            </div>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.property-panel {
  width: 280px;
  background: #16213e;
  border-left: 1px solid #0f3460;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid #0f3460;
}

.panel-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.delete-btn {
  padding: 4px 8px;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.section {
  margin-bottom: 20px;
}

.section h4 {
  margin: 0 0 12px 0;
  font-size: 12px;
  color: #888;
}

.info-value {
  font-size: 13px;
  color: #fff;
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slider-value {
  min-width: 40px;
  font-size: 12px;
  color: #888;
  text-align: right;
}

.effects-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.effect-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: #0f3460;
  border-radius: 4px;
}

.effect-name {
  font-size: 12px;
  color: #fff;
}

.effect-remove {
  color: #f56c6c;
  cursor: pointer;
}

.empty-effects {
  padding: 16px;
  text-align: center;
  color: #666;
}

.empty-effects p {
  margin: 0;
  font-size: 12px;
}
</style>