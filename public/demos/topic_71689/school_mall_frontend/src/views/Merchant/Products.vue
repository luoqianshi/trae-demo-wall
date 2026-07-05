<template>
  <div class="products-container">
    <div class="header-actions">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="商品名称">
          <el-input v-model="searchForm.keyword" placeholder="搜索商品名称" clearable />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="searchForm.category" placeholder="选择分类" clearable>
            <el-option 
              v-for="item in categories" 
              :key="item.id" 
              :label="item.category_name" 
              :value="item.id" 
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="fetchProducts">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
      <el-button type="success" @click="handleAdd">
        <el-icon><Plus /></el-icon> 发布新商品
      </el-button>
    </div>

    <el-table :data="products" v-loading="loading" stripe style="width: 100%">
      <el-table-column label="图片" width="100">
        <template #default="scope">
          <el-image 
            :src="scope.row.image" 
            style="width: 60px; height: 60px; border-radius: 4px;" 
            fit="cover"
            :preview-src-list="[scope.row.image]"
            preview-teleported
          />
        </template>
      </el-table-column>
      <el-table-column prop="product_name" label="商品名称" min-width="200" show-overflow-tooltip />
      <el-table-column prop="price" label="价格" width="120">
        <template #default="scope">¥{{ scope.row.price }}</template>
      </el-table-column>
      <el-table-column prop="stock" label="库存" width="100" sortable />
      <el-table-column prop="sales_count" label="销量" width="100" sortable />
      <el-table-column prop="status" label="状态" width="120">
        <template #default="scope">
          <el-switch
            v-model="scope.row.status"
            :active-value="1"
            :inactive-value="0"
            active-text="上架"
            inactive-text="下架"
            @change="handleStatusChange(scope.row)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="create_time" label="创建时间" width="180" />
      <el-table-column label="操作" width="180" fixed="right">
        <template #default="scope">
          <el-button type="primary" link @click="handleEdit(scope.row)">编辑</el-button>
          <el-button type="danger" link @click="handleDelete(scope.row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const loading = ref(false)
const products = ref([])
const categories = ref([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(10)

const searchForm = reactive({
  keyword: '',
  category: ''
})

const fetchCategories = async () => {
  try {
    const response = await axios.get('/api/product/category/list/')
    if (response.data.code === 200) {
      categories.value = response.data.data
    }
  } catch (error) {
    console.error('获取分类失败(V2):', error)
  }
}

const fetchProducts = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/product/merchant/list/', {
      params: {
        page: currentPage.value,
        page_size: pageSize.value,
        keyword: searchForm.keyword,
        category: searchForm.category
      }
    })
    if (response.data.code === 200) {
      products.value = response.data.data.results || response.data.data
      total.value = response.data.data.total || products.value.length
    }
  } catch (error) {
    console.error('获取商品列表失败:', error)
    ElMessage.error('获取商品列表失败')
  } finally {
    loading.value = false
  }
}

const resetSearch = () => {
  searchForm.keyword = ''
  searchForm.category = ''
  fetchProducts()
}

const handleAdd = () => {
  router.push('/merchant/product-edit')
}

const handleEdit = (row) => {
  router.push(`/merchant/product-edit/${row.id}`)
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除商品 "${row.product_name}" 吗?`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const response = await axios.delete(`/api/product/merchant/detail/${row.id}/`)
      if (response.data.code === 200) {
        ElMessage.success('删除成功')
        fetchProducts()
      }
    } catch (error) {
      console.error('删除失败:', error)
      ElMessage.error('删除失败')
    }
  })
}

const handleStatusChange = async (row) => {
  try {
    const response = await axios.put(`/api/product/merchant/status/${row.id}/`, {
      status: row.status
    })
    if (response.data.code === 200) {
      ElMessage.success(row.status === 1 ? '商品已上架' : '商品已下架')
    }
  } catch (error) {
    row.status = row.status === 1 ? 0 : 1 // 恢复状态
    ElMessage.error('操作失败')
  }
}

const handleSizeChange = (val) => {
  pageSize.value = val
  fetchProducts()
}

const handleCurrentChange = (val) => {
  currentPage.value = val
  fetchProducts()
}

onMounted(() => {
  fetchCategories()
  fetchProducts()
})
</script>

<style scoped>
.products-container {
  padding: 10px;
}

.header-actions {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.search-form {
  margin-bottom: 0;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>
