<template>
  <div class="product-edit">
    <div class="header">
      <el-button @click="router.back()">返回</el-button>
      <h2>{{ isEdit ? '编辑商品' : '发布新商品' }}</h2>
    </div>

    <el-card class="form-card" v-loading="loading">
      <el-form 
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="商品名称" prop="product_name">
          <el-input v-model="form.product_name" placeholder="请输入商品名称" maxlength="100" show-word-limit />
        </el-form-item>

        <el-form-item label="商品主图" prop="image">
          <el-upload
            class="image-uploader"
            action="/api/common/upload/"
            :show-file-list="false"
            :on-success="handleImageSuccess"
            :before-upload="beforeImageUpload"
            :headers="uploadHeaders"
          >
            <img v-if="form.image" :src="form.image" class="preview-img" />
            <el-icon v-else class="uploader-icon"><Plus /></el-icon>
          </el-upload>
          <div class="upload-tip">建议尺寸 800x800，支持 jpg、png 格式</div>
        </el-form-item>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="销售价格" prop="price">
              <el-input-number v-model="form.price" :precision="2" :step="1" :min="0.01" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="划线价格" prop="original_price">
              <el-input-number v-model="form.original_price" :precision="2" :step="1" :min="0" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="商品库存" prop="stock">
              <el-input-number v-model="form.stock" :min="0" :step="1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属分类" prop="category">
              <el-select v-model="form.category" placeholder="请选择商品分类" style="width: 100%">
                <el-option 
                  v-for="item in categories" 
                  :key="item.id" 
                  :label="item.category_name" 
                  :value="item.id" 
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="商品描述" prop="product_desc">
          <el-input 
            v-model="form.product_desc" 
            type="textarea" 
            placeholder="请输入商品详细描述"
            :rows="6"
            maxlength="1000"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="上架状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">立即上架</el-radio>
            <el-radio :label="0">放入仓库</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="推荐商品" prop="is_recommend">
          <el-switch v-model="form.is_recommend" :active-value="1" :inactive-value="0" />
          <span class="tip-text ml-10">开启后商品将展示在推荐列表中</span>
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            {{ isEdit ? '保存修改' : '立即发布' }}
          </el-button>
          <el-button @click="router.back()">取消</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const submitting = ref(false)
const categories = ref([])
const formRef = ref(null)

const isEdit = computed(() => !!route.params.id)

const form = reactive({
  product_name: '',
  image: '',
  price: 0.01,
  original_price: 0,
  stock: 100,
  category: '',
  product_desc: '',
  status: 1,
  is_recommend: 0
})

const rules = {
  product_name: [{ required: true, message: '请输入商品名称', trigger: 'blur' }],
  image: [{ required: true, message: '请上传商品主图', trigger: 'change' }],
  price: [{ required: true, message: '请输入销售价格', trigger: 'blur' }],
  category: [{ required: true, message: '请选择商品分类', trigger: 'change' }],
  product_desc: [{ required: true, message: '请输入商品描述', trigger: 'blur' }]
}

const uploadHeaders = ref({
  'Authorization': `Bearer ${localStorage.getItem('token')}`
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

const fetchProductDetail = async () => {
  if (!isEdit.value) return
  loading.value = true
  try {
    const response = await axios.get(`/api/product/merchant/detail/${route.params.id}/`)
    if (response.data.code === 200) {
      const data = response.data.data
      Object.assign(form, {
        product_name: data.product_name,
        image: data.image,
        price: data.price,
        original_price: data.original_price,
        stock: data.stock,
        category: data.category_id,
        product_desc: data.product_desc,
        status: data.status,
        is_recommend: data.is_recommend
      })
    }
  } catch (error) {
    console.error('获取详情失败:', error)
    ElMessage.error('获取详情失败')
  } finally {
    loading.value = false
  }
}

const handleImageSuccess = (response) => {
  if (response.code === 200) {
    form.image = response.data.url
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

const beforeImageUpload = (file) => {
  const isJPGorPNG = file.type === 'image/jpeg' || file.type === 'image/png'
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isJPGorPNG) ElMessage.error('上传图片只能是 JPG 或 PNG 格式!')
  if (!isLt5M) ElMessage.error('上传图片大小不能超过 5MB!')
  return isJPGorPNG && isLt5M
}

const handleSubmit = async () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        const url = isEdit.value 
          ? `/api/product/merchant/detail/${route.params.id}/` 
          : '/api/product/merchant/add/'
        const method = isEdit.value ? 'put' : 'post'
        
        const response = await axios[method](url, {
          ...form,
          category_id: form.category
        })
        
        if (response.data.code === 200 || response.data.code === 201) {
          ElMessage.success(isEdit.value ? '修改成功' : '发布成功')
          router.push('/merchant/products')
        }
      } catch (error) {
        console.error('操作失败:', error)
        ElMessage.error(error.response?.data?.message || '操作失败')
      } finally {
        submitting.value = false
      }
    }
  })
}

onMounted(() => {
  fetchCategories()
  fetchProductDetail()
})
</script>

<style scoped>
.product-edit {
  padding: 10px;
}

.header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.header h2 {
  margin: 0;
  font-size: 20px;
}

.form-card {
  max-width: 800px;
  margin: 0 auto;
}

.image-uploader {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 150px;
  height: 150px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #fafafa;
}

.image-uploader:hover {
  border-color: #409eff;
}

.uploader-icon {
  font-size: 28px;
  color: #8c939d;
}

.preview-img {
  width: 150px;
  height: 150px;
  object-fit: cover;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 8px;
}

.tip-text {
  font-size: 12px;
  color: #909399;
}

.ml-10 {
  margin-left: 10px;
}
</style>
