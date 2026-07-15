<template>
  <el-button
    v-if="hasPerm"
    :type="type"
    :size="size"
    :icon="icon"
    :disabled="disabled"
    :loading="loading"
    @click="handleClick"
  >
    <slot>{{ text }}</slot>
  </el-button>
</template>

<script setup>
import { computed } from 'vue'
import { hasPermission } from '@/utils/permission'

const props = defineProps({
  permission: {
    type: [String, Array],
    default: ''
  },
  type: {
    type: String,
    default: 'primary'
  },
  size: {
    type: String,
    default: 'default'
  },
  icon: {
    type: [String, Object],
    default: null
  },
  text: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

const hasPerm = computed(() => {
  if (!props.permission) return true
  return hasPermission(props.permission)
})

function handleClick(e) {
  emit('click', e)
}
</script>
