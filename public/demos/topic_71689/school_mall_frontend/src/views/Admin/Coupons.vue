<template>
  <div class="admin-coupons">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>优惠券管理</span>
          <el-button type="primary" @click="handleAdd">新增优惠券</el-button>
        </div>
      </template>

      <el-table :data="coupons" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="name" label="名称" min-width="150" />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="scope">
            <el-tag>{{ getTypeName(scope.row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="value" label="面额/折扣" width="120">
          <template #default="scope">
            {{ scope.row.type === 2 ? scope.row.value + '折' : '¥' + scope.row.value }}
          </template>
        </el-table-column>
        <el-table-column prop="condition" label="门槛" width="120">
          <template #default="scope">
            满¥{{ scope.row.condition }}可用
          </template>
        </el-table-column>
        <el-table-column label="有效期" min-width="200">
          <template #default="scope">
            {{ scope.row.start_time.split(' ')[0] }} 至 {{ scope.row.end_time.split(' ')[0] }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="handleSend(scope.row)">发放</el-button>
            <el-button type="danger" link @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 发放对话框 -->
    <el-dialog v-model="sendDialog.visible" title="发放优惠券" width="400px">
      <el-form :model="sendForm" label-width="80px">
        <el-form-item label="优惠券">
          <span>{{ sendForm.couponName }}</span>
        </el-form-item>
        <el-form-item label="发放范围">
          <el-radio-group v-model="sendForm.scope">
            <el-radio label="all">全部用户</el-radio>
            <el-radio label="student">仅认证学生</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="sendDialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="sendDialog.loading" @click="submitSend">确定发放</el-button>
      </template>
    </el-dialog>

    <!-- 新增对话框 -->
    <el-dialog v-model="dialog.visible" title="新增优惠券" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="名称">
          <el-input v-model="form.name" placeholder="请输入优惠券名称" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" placeholder="请选择类型" style="width: 100%">
            <el-option label="满减券" :value="1" />
            <el-option label="折扣券" :value="2" />
            <el-option label="无门槛券" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item label="面额/折扣">
          <el-input-number v-model="form.value" :min="0.1" :precision="2" style="width: 100%" />
          <div class="tip">如果是折扣券，请输入 0.1-9.9 之间的数字</div>
        </el-form-item>
        <el-form-item label="使用门槛">
          <el-input-number v-model="form.condition" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="有效时间">
          <el-date-picker
            v-model="form.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialog.visible = false">取消</el-button>
        <el-button type="primary" :loading="dialog.loading" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const coupons = ref([])
const loading = ref(false)

const dialog = reactive({
  visible: false,
  loading: false
})

const sendDialog = reactive({
  visible: false,
  loading: false
})

const sendForm = reactive({
  couponId: null,
  couponName: '',
  scope: 'all'
})

const form = reactive({
  name: '',
  type: 1,
  value: 0,
  condition: 0,
  dateRange: []
})

const getTypeName = (type) => {
  const names = { 1: '满减券', 2: '折扣券', 3: '无门槛券' }
  return names[type] || '未知'
}

const fetchCoupons = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/management/coupons/', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.data.code === 200) {
      coupons.value = response.data.data
    }
  } catch (error) {
    ElMessage.error('获取优惠券失败')
  } finally {
    loading.value = false
  }
}

const handleSend = (row) => {
  sendForm.couponId = row.id
  sendForm.couponName = row.name
  sendForm.scope = 'all'
  sendDialog.visible = true
}

const submitSend = async () => {
  sendDialog.loading = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.post('/api/coupon/send/', {
      coupon_id: sendForm.couponId,
      scope: sendForm.scope
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (response.data.code === 200) {
      ElMessage.success(response.data.message || '发放成功')
      sendDialog.visible = false
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.message || '发放失败')
  } finally {
    sendDialog.loading = false
  }
}

const handleAdd = () => {
  form.name = ''
  form.type = 1
  form.value = 0
  form.condition = 0
  form.dateRange = []
  dialog.visible = true
}

const submitForm = async () => {
  if (!form.name || !form.dateRange.length) return ElMessage.warning('请填写完整信息')
  
  dialog.loading = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.post('/api/management/coupons/', {
      name: form.name,
      type: form.type,
      value: form.value,
      condition: form.condition,
      start_time: form.dateRange[0],
      end_time: form.dateRange[1]
    }, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (response.data.code === 200) {
      ElMessage.success('创建成功')
      dialog.visible = false
      fetchCoupons()
    }
  } catch (error) {
    ElMessage.error('创建失败')
  } finally {
    dialog.loading = false
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除优惠券 "${row.name}" 吗?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.delete('/api/management/coupons/', {
        params: { id: row.id },
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.code === 200) {
        ElMessage.success('删除成功')
        fetchCoupons()
      }
    } catch (error) {
      ElMessage.error('删除失败')
    }
  })
}

onMounted(() => {
  fetchCoupons()
})
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
.tip { font-size: 12px; color: #909399; margin-top: 4px; }
</style>
