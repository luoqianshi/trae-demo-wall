<template>
  <div class="page-table-container">
    <div class="table-wrapper">
      <el-table
        v-loading="loading"
        :data="tableData"
        :height="height"
        :stripe="stripe"
        :border="border"
        :size="size"
        @selection-change="handleSelectionChange"
      >
        <slot name="columns">
          <el-table-column
            v-for="col in columns"
            :key="col.prop"
            :prop="col.prop"
            :label="col.label"
            :width="col.width"
            :min-width="col.minWidth"
            :fixed="col.fixed"
            :align="col.align || 'center'"
            :show-overflow-tooltip="col.tooltip !== false"
          >
            <template v-if="col.slot" #default="scope">
              <slot :name="col.slot" :row="scope.row" :index="scope.$index" />
            </template>
            <template v-else-if="col.type === 'index'" #default="scope">
              {{ (pageNum - 1) * pageSize + scope.$index + 1 }}
            </template>
            <template v-else-if="col.type === 'status'" #default="scope">
              <el-tag :type="scope.row[col.prop] ? 'success' : 'danger'">
                {{ scope.row[col.prop] ? '启用' : '禁用' }}
              </el-tag>
            </template>
            <template v-else-if="col.type === 'time'" #default="scope">
              {{ formatTime(scope.row[col.prop]) }}
            </template>
          </el-table-column>
        </slot>
      </el-table>
    </div>
    <div class="pagination-wrapper">
      <el-pagination
        v-model:current-page="pageNum"
        v-model:page-size="pageSize"
        :page-sizes="pageSizes"
        :total="total"
        :layout="layout"
        :background="background"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  columns: {
    type: Array,
    default: () => []
  },
  data: {
    type: Array,
    default: () => []
  },
  total: {
    type: Number,
    default: 0
  },
  loading: {
    type: Boolean,
    default: false
  },
  height: {
    type: [String, Number],
    default: 'auto'
  },
  stripe: {
    type: Boolean,
    default: true
  },
  border: {
    type: Boolean,
    default: false
  },
  size: {
    type: String,
    default: 'default'
  },
  pageSizes: {
    type: Array,
    default: () => [10, 20, 50, 100]
  },
  layout: {
    type: String,
    default: 'total, sizes, prev, pager, next, jumper'
  },
  background: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['update:currentPage', 'update:pageSize', 'selectionChange', 'pageChange'])

const pageNum = ref(1)
const pageSize = ref(10)
const tableData = ref([])

watch(
  () => props.data,
  (val) => {
    tableData.value = val
  },
  { immediate: true, deep: true }
)

function formatTime(time) {
  if (!time) return '-'
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}

function handleSelectionChange(selection) {
  emit('selectionChange', selection)
}

function handleSizeChange(size) {
  pageSize.value = size
  emit('update:pageSize', size)
  emit('pageChange', { pageNum: pageNum.value, pageSize: size })
}

function handleCurrentChange(page) {
  pageNum.value = page
  emit('update:currentPage', page)
  emit('pageChange', { pageNum: page, pageSize: pageSize.value })
}
</script>

<style scoped lang="scss">
.page-table-container {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.table-wrapper {
  flex: 1;
  overflow: hidden;
}

.pagination-wrapper {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}
</style>
