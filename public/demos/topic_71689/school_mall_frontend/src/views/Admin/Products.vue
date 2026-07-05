<template>
  <div class="admin-products">
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="商品名称">
          <el-input v-model="filters.keyword" placeholder="搜索商品名称" clearable @clear="handleSearch" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="选择状态" clearable @change="handleSearch">
            <el-option label="上架" :value="1" />
            <el-option label="下架" :value="0" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="mt-20">
      <el-table :data="products" v-loading="loading" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="product_name" label="商品名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="merchant_name" label="所属商家" width="150" />
        <el-table-column prop="price" label="价格" width="100">
          <template #default="scope">¥{{ scope.row.price }}</template>
        </el-table-column>
        <el-table-column prop="stock" label="库存" width="100" />
        <el-table-column prop="sales_count" label="销量" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === 1 ? 'success' : 'info'">
              {{ scope.row.status === 1 ? '已上架' : '已下架' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button 
              v-if="scope.row.status === 1"
              type="danger" 
              link 
              @click="toggleStatus(scope.row, 0)"
            >
              违规下架
            </el-button>
            <el-button 
              v-else
              type="success" 
              link 
              @click="toggleStatus(scope.row, 1)"
            >
              恢复上架
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const products = ref([])
const loading = ref(false)
const filters = reactive({
  keyword: '',
  status: ''
})

const fetchProducts = async () => {
  loading.value = true
  try {
    const token = localStorage.getItem('token')
    const response = await axios.get('/api/management/products/', {
      params: filters,
      headers: { Authorization: `Bearer ${token}` }
    })
    if (response.data.code === 200) {
      products.value = response.data.data
    }
  } catch (error) {
    ElMessage.error('获取商品列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  fetchProducts()
}

const toggleStatus = (product, status) => {
  const action = status === 0 ? '下架' : '上架'
  ElMessageBox.confirm(`确定要${action}商品 "${product.product_name}" 吗?`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: status === 0 ? 'warning' : 'info'
  }).then(async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.post('/api/management/products/', {
        product_id: product.id,
        status: status
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.data.code === 200) {
        ElMessage.success(`${action}成功`)
        fetchProducts()
      } else {
        ElMessage.error(response.data.message)
      }
    } catch (error) {
      ElMessage.error('操作失败')
    }
  })
}

onMounted(() => {
  fetchProducts()
})
</script>

<style scoped>
.mt-20 { margin-top: 20px; }
</style>
