<script setup>
import { computed } from 'vue'
import { genderClass, lifeSpan } from '@/utils/format'

// 家族树组件：接收成员数组，按 parentId 构建代际树
const props = defineProps({
  members: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['select', 'add'])

// 按 parentId 分组构建代际：null 为第一代
const generations = computed(() => {
  const roots = props.members.filter((m) => m.parentId === null)
  const result = []
  let current = roots
  while (current.length) {
    result.push(current)
    const next = []
    current.forEach((p) => {
      next.push(...props.members.filter((c) => c.parentId === p.id))
    })
    current = next
  }
  return result
})

// 代际标签
const genLabels = ['第一代', '第二代', '第三代', '第四代', '第五代']

// 点击节点
const onSelect = (m) => emit('select', m)

// 同代成员间是否需要画配偶连接（同名互为 spouseName）
const isSpouseOf = (a, b) => {
  if (!a.spouseName || !b.spouseName) return false
  return a.spouseName === b.name || b.spouseName === a.name
}
</script>

<template>
  <div class="tree-canvas">
    <div v-for="(gen, gi) in generations" :key="gi" class="tree-gen">
      <div class="gen-label">{{ genLabels[gi] }}</div>
      <div class="gen-nodes">
        <template v-for="(m, mi) in gen" :key="m.id">
          <div class="tree-node" :class="genderClass(m.gender)" @click="onSelect(m)">
            <div class="dot-m" :class="genderClass(m.gender)"></div>
            <div class="name">{{ m.name }}</div>
            <div class="year">{{ m.birthYear }}{{ m.deathYear ? ' - ' + m.deathYear : ' - 至今' }}</div>
          </div>
          <!-- 配偶连接符 -->
          <div
            v-if="mi < gen.length - 1 && isSpouseOf(m, gen[mi + 1])"
            class="spouse-link"
          >⟷</div>
        </template>
      </div>
      <!-- 代际间连接线 -->
      <div v-if="gi < generations.length - 1" class="tree-vline"></div>
    </div>

    <button class="btn-add" @click="emit('add')">
      <AppIcon icon="lucide:user-plus" :size="16" />
      添加成员
    </button>
  </div>
</template>

<style scoped>
.tree-canvas {
  background: linear-gradient(160deg, var(--bg-warm), var(--bg-deep));
  border-radius: var(--radius-lg);
  padding: 40px 24px;
  box-shadow: var(--shadow-soft);
  position: relative;
  overflow: auto;
  border: 1px solid rgba(139, 107, 80, 0.1);
  text-align: center;
}

.tree-canvas::before {
  content: '';
  position: absolute;
  inset: 0;
  opacity: 0.06;
  pointer-events: none;
  background-image: radial-gradient(circle, var(--primary) 1px, transparent 1px);
  background-size: 24px 24px;
}

.tree-gen {
  position: relative;
  margin-bottom: 16px;
}

.gen-label {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  writing-mode: vertical-rl;
  font-family: var(--font-display);
  font-size: 14px;
  color: var(--seal);
  letter-spacing: 6px;
  background: rgba(168, 50, 50, 0.06);
  padding: 14px 4px;
  border-radius: 6px;
}

.gen-nodes {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 18px;
  flex-wrap: wrap;
}

.tree-node {
  background: var(--bg);
  border: 2px solid var(--primary);
  border-radius: 12px;
  padding: 14px 20px;
  text-align: center;
  cursor: pointer;
  min-width: 110px;
  transition: all var(--transition);
  position: relative;
  z-index: 2;
  box-shadow: 0 4px 12px rgba(94, 70, 50, 0.12);
}

.tree-node.female {
  border-color: var(--seal);
}

.tree-node:hover {
  transform: translateY(-4px) scale(1.04);
  box-shadow: 0 10px 24px rgba(139, 107, 80, 0.25);
}

.dot-m {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin: 0 auto 6px;
  background: var(--moss);
}

.dot-m.female {
  background: var(--seal);
}

.name {
  font-family: var(--font-display);
  font-size: 20px;
  color: var(--primary-deep);
  line-height: 1.2;
}

.year {
  font-size: 12px;
  color: var(--text-light);
  margin-top: 3px;
}

.spouse-link {
  color: var(--seal);
  font-size: 18px;
}

.tree-vline {
  width: 2px;
  height: 28px;
  background: var(--primary);
  opacity: 0.4;
  margin: 0 auto;
}

.btn-add {
  margin-top: 24px;
  padding: 10px 24px;
  border: 1.5px dashed var(--primary);
  background: transparent;
  color: var(--primary-deep);
  border-radius: 30px;
  cursor: pointer;
  font-family: var(--font-serif);
  font-size: 14px;
  transition: all var(--transition);
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-add:hover {
  background: var(--primary);
  color: var(--bg);
}

@media (max-width: 600px) {
  .gen-label {
    display: none;
  }

  .tree-node {
    min-width: 90px;
    padding: 10px 14px;
  }
}
</style>
