<template>
  <div class="search-form-container">
    <el-form :model="form" inline class="search-form">
      <slot>
        <el-form-item
          v-for="item in fields"
          :key="item.prop"
          :label="item.label"
          :prop="item.prop"
        >
          <el-input
            v-if="item.type === 'input'"
            v-model="form[item.prop]"
            :placeholder="item.placeholder || '请输入' + item.label"
            clearable
            style="width: 200px"
            @keyup.enter="handleSearch"
          />
          <el-select
            v-else-if="item.type === 'select'"
            v-model="form[item.prop]"
            :placeholder="item.placeholder || '请选择' + item.label"
            clearable
            style="width: 200px"
          >
            <el-option
              v-for="option in item.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
            />
          </el-select>
          <el-date-picker
            v-else-if="item.type === 'date'"
            v-model="form[item.prop]"
            :type="item.dateType || 'date'"
            :placeholder="item.placeholder || '请选择' + item.label"
            value-format="YYYY-MM-DD"
            clearable
            style="width: 200px"
          />
          <el-date-picker
            v-else-if="item.type === 'daterange'"
            v-model="form[item.prop]"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            clearable
            style="width: 300px"
          />
        </el-form-item>
      </slot>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
        <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { Search, RefreshRight } from '@element-plus/icons-vue'

const props = defineProps({
  fields: {
    type: Array,
    default: () => []
  },
  modelValue: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'search', 'reset'])

const form = reactive({ ...props.modelValue })

watch(
  () => props.modelValue,
  (val) => {
    Object.assign(form, val)
  },
  { deep: true }
)

function handleSearch() {
  emit('update:modelValue', { ...form })
  emit('search', { ...form })
}

function handleReset() {
  Object.keys(form).forEach(key => {
    form[key] = ''
  })
  emit('update:modelValue', { ...form })
  emit('reset', { ...form })
}
</script>

<style scoped lang="scss">
.search-form-container {
  margin-bottom: 15px;
  padding: 15px 20px 0;
  background-color: #fff;
  border-radius: 4px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
</style>
