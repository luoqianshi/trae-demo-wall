<template>
  <div class="tags-view-container">
    <el-scrollbar class="tags-scrollbar">
      <div class="tags-wrapper">
        <router-link
          v-for="tag in appStore.visitedViews"
          :key="tag.path"
          :class="['tag-item', { active: isActive(tag) }]"
          :to="tag.path"
        >
          <span>{{ tag.title }}</span>
          <el-icon
            v-if="!tag.meta?.affix"
            class="close-icon"
            @click.prevent.stop="closeTag(tag)"
          >
            <Close />
          </el-icon>
        </router-link>
      </div>
    </el-scrollbar>
  </div>
</template>

<script setup>
import { watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()

onMounted(() => {
  if (route.name) {
    appStore.addVisitedView(route)
  }
})

watch(
  () => route.path,
  () => {
    if (route.name) {
      appStore.addVisitedView(route)
    }
  }
)

function isActive(tag) {
  return tag.path === route.path
}

async function closeTag(tag) {
  await appStore.delVisitedView(tag.path)
  if (isActive(tag)) {
    const latestView = appStore.visitedViews.slice(-1)[0]
    if (latestView) {
      router.push(latestView.path)
    } else {
      router.push('/dashboard')
    }
  }
}
</script>

<style scoped lang="scss">
.tags-view-container {
  height: 35px;
  padding: 4px 10px;
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
}

.tags-scrollbar {
  width: 100%;
  white-space: nowrap;
}

.tags-wrapper {
  display: flex;
  gap: 6px;
  padding: 2px 0;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  font-size: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 3px;
  background-color: #fff;
  color: #495060;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;

  &:hover {
    color: #409EFF;
  }

  &.active {
    background-color: #409EFF;
    color: #fff;
    border-color: #409EFF;

    &:hover {
      color: #fff;
    }

    .close-icon {
      color: #fff;

      &:hover {
        background-color: rgba(255, 255, 255, 0.3);
      }
    }
  }

  .close-icon {
    margin-left: 4px;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    transition: background-color 0.2s;

    &:hover {
      background-color: #e4e7ed;
      color: #909399;
    }
  }
}
</style>
