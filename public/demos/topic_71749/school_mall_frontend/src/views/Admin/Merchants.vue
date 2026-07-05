<template>
  <div class="admin-merchants">
    <el-card shadow="never" class="filter-card">
      <el-radio-group v-model="filters.status" @change="handleSearch">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button :label="0">待审核</el-radio-button>
        <el-radio-button :label="1">已通过</el-radio-button>
        <el-radio-button :label="2">已驳回</el-radio-button>
      </el-radio-group>
    </el-card>

    <el-card shadow="never" class="mt-20">
      <el-table :data="merchants" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="merchant_name" label="店铺名称" min-width="150" />
        <el-table-column prop="username" label="关联账号" width="120" />
        <el-table-column prop="contact_name" label="联系人" width="120" />
        <el-table-column prop="contact_phone" label="联系电话" width="150" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="申请时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button 
              v-if="scope.row.status === 0"
              type="primary" 
              link 
              @click="handleAudit(scope.row)"
            >
              审核
            </el-button>
            <el-button type="info" link @click="viewDetail(scope.row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 审核对话框 -->
    <el-dialog v-model="auditDialog.visible" title="商家审核" width="500px">
      <el-form :model="auditForm" label-width="80px">
        <el-form-item label="审核结果">
          <el-radio-group v-model="auditForm.status">
            <el-radio :label="1">通过</el-radio>
            <el-radio :label="2">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核意见">
          <el-input 
            type="textarea" 
            v-model="auditForm.audit_opinion" 
            placeholder="请输入审核意见（可选）"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="auditDialog.loading" @click="submitAudit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const merchants = ref([])
const loading = ref(false)
const filters = reactive({
  status: 0 // 默认看待审核
})

const auditDialog = reactive({
  visible: false,
  loading: false,
  row: null
})

const auditForm = reactive({
  status: 1,
  audit_opinion: ''
})

const getStatusText = (status) => {
  const texts = {
    0: '待审核',
    1: '已通过',
    2: '已驳回'
  }
  return texts[status] || '未知'
}

const getStatusTag = (status) => {
  const tags = {
    0: 'warning',
    1: 'success',
    2: 'danger'
  }
  return tags[status] || 'info'
}

const fetchMerchants = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/management/merchants/', {
      params: filters,
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.data.code === 200) {
      merchants.value = response.data.data
    }
  } catch (error) {
    ElMessage.error('获取商家列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  fetchMerchants()
}

const handleAudit = (row) => {
  auditDialog.row = row
  auditForm.status = 1
  auditForm.audit_opinion = ''
  auditDialog.visible = true
}

const submitAudit = async () => {
  auditDialog.loading = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.post('/api/management/merchants/', {
      merchant_id: auditDialog.row.id,
      status: auditForm.status,
      audit_opinion: auditForm.audit_opinion
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.data.code === 200) {
      ElMessage.success('审核完成')
      auditDialog.visible = false
      fetchMerchants()
    } else {
      ElMessage.error(response.data.message)
    }
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    auditDialog.loading = false
  }
}

const viewDetail = (row) => {
  // 详情展示，此处简化
  ElMessageBox.alert(`
    <p><b>店铺名称：</b>${row.merchant_name}</p>
    <p><b>商家地址：</b>${row.merchant_address}</p>
    <p><b>联系人：</b>${row.contact_name}</p>
    <p><b>联系电话：</b>${row.contact_phone}</p>
  `, '商家详情', { dangerouslyUseHTMLString: true })
}

onMounted(() => {
  fetchMerchants()
})
</script>

<style scoped>
.mt-20 { margin-top: 20px; }
.filter-card { margin-bottom: 0; }
</style>
