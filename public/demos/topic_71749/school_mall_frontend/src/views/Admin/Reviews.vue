<template>
  <div class="admin-reviews">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>评价管理</span>
        </div>
      </template>

      <el-table :data="reviews" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="username" label="评价人" width="120" />
        <el-table-column prop="product_name" label="商品名称" width="200" show-overflow-tooltip />
        <el-table-column prop="rating" label="评分" width="150">
          <template #default="scope">
            <el-rate v-model="scope.row.rating" disabled />
          </template>
        </el-table-column>
        <el-table-column prop="content" label="评价内容" min-width="300" />
        <el-table-column prop="create_time" label="评价时间" width="180" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="scope">
            <el-button type="danger" link @click="handleDelete(scope.row)">隐藏/删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const reviews = ref([])
const loading = ref(false)

const fetchReviews = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/management/reviews/', {
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.data.code === 200) {
      reviews.value = response.data.data
    }
  } catch (error) {
    ElMessage.error('获取评价列表失败')
  } finally {
    loading.value = false
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除该评价吗？删除后用户将不可见。', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.delete('/api/management/reviews/', {
        params: { id: row.id },
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.code === 200) {
        ElMessage.success('操作成功')
        fetchReviews()
      }
    } catch (error) {
      ElMessage.error('操作失败')
    }
  })
}

onMounted(() => {
  fetchReviews()
})
</script>

<style scoped>
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
