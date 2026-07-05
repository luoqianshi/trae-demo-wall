<template>
  <div class="admin-categories">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>分类管理</span>
          <el-button type="primary" @click="handleAdd">新增分类</el-button>
        </div>
      </template>

      <el-table :data="categories" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="category_name" label="分类名称" />
        <el-table-column prop="sort_order" label="排序值" width="100" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="scope">
            <el-button type="primary" link @click="handleEdit(scope.row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 编辑/新增对话框 -->
    <el-dialog v-model="dialog.visible" :title="dialog.isEdit ? '编辑分类' : '新增分类'" width="400px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="分类名称">
          <el-input v-model="form.category_name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="排序值">
          <el-input-number v-model="form.sort_order" :min="0" />
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

const categories = ref([])
const loading = ref(false)

const dialog = reactive({
  visible: false,
  loading: false,
  isEdit: false
})

const form = reactive({
  id: null,
  category_name: '',
  sort_order: 0
})

const fetchCategories = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/management/categories/', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.data.code === 200) {
      categories.value = response.data.data
    }
  } catch (error) {
    ElMessage.error('获取分类失败')
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  dialog.isEdit = false
  form.id = null
  form.category_name = ''
  form.sort_order = 0
  dialog.visible = true
}

const handleEdit = (row) => {
  dialog.isEdit = true
  form.id = row.id
  form.category_name = row.category_name
  form.sort_order = row.sort_order
  dialog.visible = true
}

const submitForm = async () => {
  if (!form.category_name) return ElMessage.warning('请输入分类名称')
  
  dialog.loading = true
  try {
    const token = localStorage.getItem('token')
    let response
    if (dialog.isEdit) {
      response = await axios.put('/api/management/categories/', form, {
        headers: { Authorization: `Bearer ${token}` }
      })
    } else {
      response = await axios.post('/api/management/categories/', form, {
        headers: { Authorization: `Bearer ${token}` }
      })
    }
    
    if (response.data.code === 200) {
      ElMessage.success(dialog.isEdit ? '更新成功' : '创建成功')
      dialog.visible = false
      fetchCategories()
    } else {
      ElMessage.error(response.data.message)
    }
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    dialog.loading = false
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除分类 "${row.category_name}" 吗?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.delete('/api/management/categories/', {
        params: { id: row.id },
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.code === 200) {
        ElMessage.success('删除成功')
        fetchCategories()
      } else {
        ElMessage.error(response.data.message)
      }
    } catch (error) {
      ElMessage.error('删除失败，可能该分类下已有商品')
    }
  })
}

onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
