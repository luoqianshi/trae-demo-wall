<script setup>
import { ref, reactive, watch } from 'vue'

// 上传模态框：可复用于照片上传
const props = defineProps({
  visible: { type: Boolean, default: false },
  title: { type: String, default: '上传照片' }
})

const emit = defineEmits(['close', 'submit'])

// 表单数据
const form = reactive({
  fileName: '',
  photoYear: '',
  peopleNames: '',
  description: ''
})

// 表单校验错误
const errors = reactive({})

// 占位图标池（Lucide）：模拟选择图片
const iconPool = [
  'lucide:wheat', 'lucide:mountain', 'lucide:leaf', 'lucide:home',
  'lucide:users', 'lucide:medal', 'lucide:scroll', 'lucide:image',
  'lucide:flame', 'lucide:sun', 'lucide:tree-pine', 'lucide:user'
]
const pickedIcon = ref(iconPool[Math.floor(Math.random() * iconPool.length)])

// 重置表单
const reset = () => {
  form.fileName = ''
  form.photoYear = ''
  form.peopleNames = ''
  form.description = ''
  Object.keys(errors).forEach((k) => delete errors[k])
  pickedIcon.value = iconPool[Math.floor(Math.random() * iconPool.length)]
}

// 打开时重置
watch(
  () => props.visible,
  (v) => {
    if (v) reset()
  }
)

// 随机换一个图标（模拟选择图片）
const pickIcon = () => {
  let next = pickedIcon.value
  while (next === pickedIcon.value) {
    next = iconPool[Math.floor(Math.random() * iconPool.length)]
  }
  pickedIcon.value = next
}

// 校验
const validate = () => {
  let ok = true
  if (!form.fileName) {
    errors.fileName = '请输入照片标题'
    ok = false
  }
  if (!form.photoYear) {
    errors.photoYear = '请输入拍摄年份'
    ok = false
  } else if (!/^\d{4}$/.test(form.photoYear)) {
    errors.photoYear = '请输入 4 位年份'
    ok = false
  }
  return ok
}

// 提交
const onSubmit = () => {
  if (!validate()) return
  emit('submit', { ...form, icon: pickedIcon.value })
}
</script>

<template>
  <transition name="modal">
    <div v-if="visible" class="modal-mask" @click.self="emit('close')">
      <div class="modal">
        <div class="modal-head">
          <h3>{{ title }}</h3>
          <button class="modal-close" @click="emit('close')">
            <AppIcon icon="lucide:x" :size="18" />
          </button>
        </div>
        <div class="modal-body">
          <div class="field">
            <label>照片标题</label>
            <input v-model="form.fileName" placeholder="如：爷爷年轻时的照片" />
            <div class="field-error" v-if="errors.fileName">{{ errors.fileName }}</div>
          </div>
          <div class="field">
            <label>拍摄年份</label>
            <input v-model="form.photoYear" placeholder="如：1965" maxlength="4" />
            <div class="field-error" v-if="errors.photoYear">{{ errors.photoYear }}</div>
          </div>
          <div class="field">
            <label>照片中的人物</label>
            <input v-model="form.peopleNames" placeholder="如：陈永福、李秀英" />
          </div>
          <div class="field">
            <label>照片描述</label>
            <textarea v-model="form.description" rows="3" placeholder="这张照片背后的故事..."></textarea>
          </div>
          <div class="field">
            <label>选择图片（模拟）</label>
            <div class="picker" @click="pickIcon">
              <span class="hint">
                <AppIcon icon="lucide:camera" :size="16" />
                点击此处模拟选择照片
              </span>
              <span class="pick-icon"><AppIcon :icon="pickedIcon" :size="40" /></span>
            </div>
          </div>
        </div>
        <div class="modal-foot">
          <button class="btn btn-ghost" @click="emit('close')">取消</button>
          <button class="btn btn-primary" @click="onSubmit">
            <AppIcon icon="lucide:upload" :size="16" />
            上传
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: translateY(30px) scale(0.96);
}

.picker {
  border: 2px dashed rgba(139, 107, 80, 0.3);
  border-radius: 10px;
  padding: 30px;
  text-align: center;
  color: var(--text-light);
  cursor: pointer;
  transition: all var(--transition);
}

.picker:hover {
  border-color: var(--primary);
  background: rgba(212, 165, 116, 0.08);
}

.picker .hint {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
  font-size: 14px;
}

.pick-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: var(--primary);
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.15));
}

/* 关闭按钮内部图标居中 */
.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
