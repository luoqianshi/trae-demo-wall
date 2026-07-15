<template>
  <div class="operation-log-container">
    <el-card class="page-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>操作日志</span>
        </div>
      </template>

      <el-form :model="searchForm" class="search-form" inline @submit.prevent>
        <el-form-item label="用户名">
          <el-input v-model="searchForm.username" placeholder="请输入用户名" clearable style="width: 180px;" />
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select v-model="searchForm.operationType" placeholder="请选择" clearable style="width: 140px;">
            <el-option label="全部" value="" />
            <el-option label="查询" value="查询" />
            <el-option label="新增" value="新增" />
            <el-option label="修改" value="修改" />
            <el-option label="删除" value="删除" />
          </el-select>
        </el-form-item>
        <el-form-item label="请求路径">
          <el-input v-model="searchForm.requestPath" placeholder="请输入路径" clearable style="width: 180px;" />
        </el-form-item>
        <el-form-item label="操作时间">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 280px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <div class="table-toolbar">
        <div class="toolbar-right">
          <el-button :icon="Refresh" @click="getList">刷新</el-button>
        </div>
      </div>

      <PageTable
        :columns="columns"
        :data="tableData"
        :total="total"
        :loading="loading"
        @pageChange="handlePageChange"
      >
        <template #operationType="{ row }">
          <el-tag :type="getOperationTypeTag(row.operationType)">
            {{ row.operationType }}
          </el-tag>
        </template>
        <template #operationResult="{ row }">
          <el-tag :type="row.operationResult ? 'success' : 'danger'">
            {{ row.operationResult ? '成功' : '失败' }}
          </el-tag>
        </template>
        <template #costMs="{ row }">
          <span>{{ row.costMs }} ms</span>
        </template>
        <template #action="{ row }">
          <el-button type="primary" link @click="handleView(row)">详情</el-button>
        </template>
      </PageTable>
    </el-card>

    <el-dialog v-model="detailVisible" title="日志详情" width="700px">
      <el-descriptions :column="2" border v-if="detailData">
        <el-descriptions-item label="日志ID">{{ detailData.id }}</el-descriptions-item>
        <el-descriptions-item label="操作结果">
          <el-tag :type="detailData.operationResult ? 'success' : 'danger'">
            {{ detailData.operationResult ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="用户名">{{ detailData.username || '-' }}</el-descriptions-item>
        <el-descriptions-item label="用户角色">{{ detailData.role || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作类型">
          <el-tag :type="getOperationTypeTag(detailData.operationType)">
            {{ detailData.operationType }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="请求方法">{{ detailData.requestMethod }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ detailData.ipAddress }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ detailData.costMs }} ms</el-descriptions-item>
        <el-descriptions-item label="操作时间" :span="2">
          {{ detailData.createTime }}
        </el-descriptions-item>
        <el-descriptions-item label="请求路径" :span="2">
          <span class="path-text">{{ detailData.requestPath }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <pre class="params-pre">{{ detailData.requestParams || '无' }}</pre>
        </el-descriptions-item>
        <el-descriptions-item v-if="!detailData.operationResult" label="错误信息" :span="2">
          <span class="error-text">{{ detailData.errorMsg || '-' }}</span>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'
import PageTable from '@/components/PageTable.vue'
import { getOperationLogList, getOperationLogDetail } from '@/api/operationLog'

const loading = ref(false)
const detailVisible = ref(false)
const detailData = ref(null)
const tableData = ref([])
const total = ref(0)
const pageNum = ref(1)
const pageSize = ref(10)
const dateRange = ref([])

const searchForm = reactive({
  username: '',
  operationType: '',
  requestPath: ''
})

const columns = [
  { type: 'index', label: '序号', width: 60 },
  { prop: 'username', label: '用户名', minWidth: 120 },
  { slot: 'operationType', label: '操作类型', width: 100 },
  { prop: 'requestMethod', label: '方法', width: 80 },
  { prop: 'requestPath', label: '请求路径', minWidth: 200, showOverflowTooltip: true },
  { prop: 'ipAddress', label: 'IP地址', width: 140 },
  { slot: 'operationResult', label: '结果', width: 80 },
  { slot: 'costMs', label: '耗时', width: 100 },
  { prop: 'createTime', label: '操作时间', type: 'time', width: 180 },
  { slot: 'action', label: '操作', width: 100, fixed: 'right' }
]

function getOperationTypeTag(type) {
  const map = {
    '查询': 'info',
    '新增': 'success',
    '修改': 'warning',
    '删除': 'danger'
  }
  return map[type] || 'info'
}

async function getList() {
  loading.value = true
  try {
    const params = {
      pageIndex: pageNum.value,
      pageSize: pageSize.value,
      ...searchForm
    }
    if (dateRange.value && dateRange.value.length === 2) {
      params.startTime = dateRange.value[0]
      params.endTime = dateRange.value[1]
    }
    const res = await getOperationLogList(params)
    tableData.value = res.data?.items || []
    total.value = res.data?.totalCount || 0
  } catch (error) {
    console.error('Get operation log list error:', error)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  pageNum.value = 1
  getList()
}

function handleReset() {
  searchForm.username = ''
  searchForm.operationType = ''
  searchForm.requestPath = ''
  dateRange.value = []
  pageNum.value = 1
  getList()
}

function handlePageChange({ pageNum: pn, pageSize: ps }) {
  pageNum.value = pn
  pageSize.value = ps
  getList()
}

async function handleView(row) {
  try {
    const res = await getOperationLogDetail(row.id)
    detailData.value = res.data
    detailVisible.value = true
  } catch (error) {
    console.error('Get operation log detail error:', error)
  }
}

onMounted(() => {
  getList()
})
</script>

<style scoped lang="scss">
.operation-log-container {
  .page-card {
    border: none;
    border-radius: 8px;
  }

  .card-header {
    font-size: 16px;
    font-weight: 600;
  }

  .search-form {
    margin-bottom: 15px;
    padding: 0 20px;
  }

  .table-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15px;
    padding: 0 20px;
  }

  .toolbar-right {
    display: flex;
    gap: 10px;
  }

  .path-text {
    font-family: monospace;
    font-size: 13px;
    word-break: break-all;
  }

  .params-pre {
    margin: 0;
    max-height: 200px;
    overflow-y: auto;
    font-family: monospace;
    font-size: 12px;
    white-space: pre-wrap;
    word-break: break-all;
    background: #f5f7fa;
    padding: 10px;
    border-radius: 4px;
  }

  .error-text {
    color: #f56c6c;
  }
}
</style>
