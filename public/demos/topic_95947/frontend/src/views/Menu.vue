<template>
  <div class="menu-page">
    <ModuleAIPanel module="菜品菜单" title="AI 菜品优化诊断" />
    <div class="page-header">
      <div class="header-left">
        <div class="header-icon">
          <i class="fas fa-utensils"></i>
        </div>
        <div class="header-title">
          <h1>菜单管理</h1>
          <p>管理菜品分类和菜品信息</p>
        </div>
      </div>
      <div class="header-right">
        <el-button type="primary" class="btn-primary" @click="showAddCategoryDialog = true">
          <i class="fas fa-plus"></i> 添加分类
        </el-button>
        <el-button type="primary" class="btn-primary" @click="showAddDishDialog = true">
          <i class="fas fa-plus"></i> 添加菜品
        </el-button>
        <el-button class="btn-secondary" @click="refreshData">
          <i class="fas fa-sync-alt"></i> 刷新
        </el-button>
        <el-button type="success" class="btn-success" @click="batchGenerateImages" :loading="generatingImages">
          <i class="fas fa-image"></i> 批量生成图片
        </el-button>
      </div>
    </div>

    <div class="main-content">
      <div class="left-sidebar">
        <div class="sidebar-section">
          <div class="section-header">
            <h3 class="section-title">
              <i class="fas fa-layer-group"></i> 分类管理
            </h3>
            <div class="search-wrapper">
              <el-input v-model="categorySearch" placeholder="搜索分类..." class="search-input" clearable>
                <template #prefix><i class="fas fa-search"></i></template>
              </el-input>
            </div>
          </div>
          <div class="category-list">
            <div 
              v-for="category in filteredCategories" 
              :key="category.id"
              :class="['category-item', { active: selectedCategory === category.id }]" 
              @click="selectCategory(category.id)"
            >
              <div class="category-icon-wrapper">
                <i :class="category.icon || 'fas fa-utensils'"></i>
              </div>
              <div class="category-info">
                <span class="category-name">{{ category.name }}</span>
                <span class="category-count">{{ getCategoryDishCount(category.id) }} 道</span>
              </div>
              <div class="category-actions">
                <button class="action-btn" @click.stop="editCategory(category)">
                  <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete" @click.stop="deleteCategory(category)">
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>
            <div v-if="filteredCategories.length === 0" class="empty-category">
              <i class="fas fa-layer-group"></i>
              <span>暂无分类</span>
            </div>
          </div>
        </div>
      </div>

      <div class="right-content">
        <div class="dish-section">
          <div class="section-header">
            <div class="section-title-wrapper">
              <h2 class="section-title">
                <i class="fas fa-food"></i> 
                {{ selectedCategoryName || '所有菜品' }}
              </h2>
              <span class="result-count">共 {{ filteredDishes.length }} 道菜品</span>
              <span class="no-image-count" v-if="dishesWithoutImages.length > 0">
                <i class="fas fa-image-slash"></i> {{ dishesWithoutImages.length }} 道菜品无图片
              </span>
            </div>
            <div class="search-wrapper">
              <el-input v-model="dishSearch" placeholder="搜索菜品名称..." class="search-input" clearable>
                <template #prefix><i class="fas fa-search"></i></template>
              </el-input>
            </div>
          </div>
          <div class="dish-grid">
            <div v-for="dish in filteredDishes" :key="dish.id" class="dish-card">
              <div class="dish-image-wrapper">
                <template v-if="dish.image">
                  <img :src="dish.image" :alt="dish.name" class="dish-image">
                </template>
                <template v-else>
                  <div class="dish-image-placeholder">
                    <i class="fas fa-utensils"></i>
                    <span>{{ dish.name }}</span>
                  </div>
                </template>
                <div class="dish-tag hot-tag" v-if="dish.is_hot">
                  <i class="fas fa-flame"></i>
                  <span>热销</span>
                </div>
                <div class="dish-tag no-image-tag" v-if="!dish.image">
                  <i class="fas fa-image-slash"></i>
                  <span>无图</span>
                </div>
                <div class="dish-image-overlay">
                  <button class="overlay-btn" @click="editDish(dish)">
                    <i class="fas fa-edit"></i>
                  </button>
                  <button class="overlay-btn" @click="generateSingleImage(dish)" v-if="!dish.image">
                    <i class="fas fa-image"></i>
                  </button>
                </div>
              </div>
              <div class="dish-info">
                <div class="dish-header">
                  <h3 class="dish-name">{{ dish.name }}</h3>
                  <span class="dish-price">¥{{ dish.price.toFixed(2) }}</span>
                </div>
                <p class="dish-description">{{ dish.description || '暂无描述' }}</p>
                <div class="dish-meta">
                  <span class="dish-category">{{ getCategoryName(dish.category_id) }}</span>
                  <span class="dish-sales">
                    <i class="fas fa-chart-line"></i> {{ dish.sales || 0 }}
                  </span>
                </div>
                <div class="dish-actions">
                  <button class="action-btn edit-btn" @click="editDish(dish)">
                    <i class="fas fa-edit"></i> 编辑
                  </button>
                  <button class="action-btn delete-btn" @click="deleteDish(dish.id)">
                    <i class="fas fa-trash"></i> 删除
                  </button>
                  <button class="action-btn hot-btn" :class="{ active: dish.is_hot }" @click="toggleHot(dish)">
                    <i class="fas fa-flame"></i> {{ dish.is_hot ? '取消' : '热销' }}
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-if="filteredDishes.length === 0" class="empty-state">
            <div class="empty-icon">
              <i class="fas fa-utensils-alt"></i>
            </div>
            <h3>暂无菜品</h3>
            <p>点击上方按钮添加您的第一道菜品</p>
          </div>
        </div>
      </div>
    </div>

    <el-dialog title="添加分类" v-model="showAddCategoryDialog" width="400px">
      <el-form :model="categoryForm" label-width="80px">
        <el-form-item label="分类名称">
          <el-input v-model="categoryForm.name" placeholder="请输入分类名称"></el-input>
        </el-form-item>
        <el-form-item label="图标">
          <el-select v-model="categoryForm.icon" placeholder="选择图标">
            <el-option label="🍳 炒菜" value="fas fa-frying-pan"></el-option>
            <el-option label="🍜 面食" value="fas fa-utensils"></el-option>
            <el-option label="🍣 凉菜" value="fas fa-salad"></el-option>
            <el-option label="🍲 汤品" value="fas fa-soup"></el-option>
            <el-option label="🍰 甜点" value="fas fa-cake"></el-option>
            <el-option label="🍹 饮品" value="fas fa-wine-glass"></el-option>
            <el-option label="🍚 主食" value="fas fa-bread-slice"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeCategoryDialog">取消</el-button>
        <el-button type="primary" @click="saveCategory">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog :title="editingCategoryId ? '编辑菜品' : '添加菜品'" v-model="showAddDishDialog" width="600px">
      <el-form :model="dishForm" label-width="80px">
        <el-form-item label="菜品名称">
          <el-input v-model="dishForm.name" placeholder="请输入菜品名称"></el-input>
        </el-form-item>
        <el-form-item label="所属分类">
          <el-select v-model="dishForm.category_id" placeholder="选择分类">
            <el-option v-for="cat in categories" :key="cat.id" :label="cat.name" :value="cat.id"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="价格">
          <el-input-number v-model="dishForm.price" :min="0" :step="0.01" placeholder="请输入价格"></el-input-number>
        </el-form-item>
        <el-form-item label="描述">
          <el-input type="textarea" v-model="dishForm.description" placeholder="请输入菜品描述"></el-input>
        </el-form-item>
        <el-form-item label="图片">
          <el-upload class="dish-upload" :action="uploadUrl" :on-success="handleImageUpload"
            :before-upload="beforeImageUpload" :show-file-list="false">
            <img v-if="dishForm.image" :src="dishForm.image" class="upload-preview">
            <div v-else class="upload-placeholder">
              <i class="fas fa-upload"></i>
              <p>点击上传图片</p>
            </div>
          </el-upload>
        </el-form-item>
        <el-form-item label="是否热销">
          <el-switch v-model="dishForm.is_hot"></el-switch>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDishDialog">取消</el-button>
        <el-button type="primary" @click="saveDish">确定</el-button>
      </template>
    </el-dialog>

    <el-dialog title="批量生成图片" v-model="showGenerateDialog" width="500px">
      <div class="generate-dialog-content">
        <div class="generate-info">
          <div class="info-icon">
            <i class="fas fa-image"></i>
          </div>
          <div class="info-text">
            <h4>为菜品生成图片</h4>
            <p>系统将为所有没有图片的菜品自动生成图片并保存到数据库</p>
            <p class="count-info">共 {{ dishesWithoutImages.length }} 道菜品需要生成图片</p>
          </div>
        </div>
        <div v-if="generatingProgress" class="progress-section">
          <div class="progress-header">
            <span>生成进度</span>
            <span>{{ generatingProgress.current }}/{{ generatingProgress.total }}</span>
          </div>
          <el-progress :percentage="generatingProgress.percentage" :stroke-width="8" />
          <div v-if="generatingProgress.currentDish" class="current-dish">
            <i class="fas fa-spinner fa-spin"></i>
            <span>正在生成: {{ generatingProgress.currentDish }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showGenerateDialog = false">取消</el-button>
        <el-button type="primary" @click="startBatchGenerate" :loading="generatingImages">开始生成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ModuleAIPanel from '@/components/ModuleAIPanel.vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { dishApi, categoryApi } from '@/api'

const uploadUrl = '/api/dishes/upload-image'
const generatingImages = ref(false)
const showGenerateDialog = ref(false)
const generatingProgress = ref(null)

const categories = ref([])
const dishes = ref([])

const selectedCategory = ref(null)
const categorySearch = ref('')
const dishSearch = ref('')
const showAddCategoryDialog = ref(false)
const showAddDishDialog = ref(false)

const categoryForm = ref({ name: '', icon: '' })
const dishForm = ref({ name: '', category_id: '', price: 0, description: '', image: '', is_hot: false })
const editingCategoryId = ref(null)

const filteredCategories = computed(() => {
  if (!categorySearch.value) return categories.value
  const keyword = categorySearch.value.toLowerCase()
  return categories.value.filter(c => c.name.toLowerCase().includes(keyword))
})

const filteredDishes = computed(() => {
  let result = dishes.value
  if (selectedCategory.value) {
    result = result.filter(d => d.category_id === selectedCategory.value)
  }
  if (dishSearch.value) {
    const keyword = dishSearch.value.toLowerCase()
    result = result.filter(d => d.name.toLowerCase().includes(keyword))
  }
  return result
})

const selectedCategoryName = computed(() => {
  const cat = categories.value.find(c => c.id === selectedCategory.value)
  return cat ? cat.name : ''
})

const dishesWithoutImages = computed(() => {
  return dishes.value.filter(d => !d.image || d.image.trim() === '')
})

function getCategoryDishCount(categoryId) {
  return dishes.value.filter(d => d.category_id === categoryId).length
}

function getCategoryName(categoryId) {
  const cat = categories.value.find(c => c.id === categoryId)
  return cat ? cat.name : '未分类'
}

function selectCategory(id) {
  selectedCategory.value = selectedCategory.value === id ? null : id
}

async function refreshData() {
  await loadCategories()
  await loadDishes()
}

async function loadCategories() {
  try {
    const response = await categoryApi.getCategories()
    categories.value = response.data || response || []
  } catch (error) {
    console.error('加载分类失败:', error)
    categories.value = []
  }
}

async function loadDishes() {
  try {
    const response = await dishApi.getDishes()
    const data = response.data || response || []
    dishes.value = data.map(d => ({
      id: d.id,
      name: d.name,
      price: d.price,
      description: d.description,
      image: d.image_url,
      is_hot: false,
      category_id: d.category_id,
      sales: d.sales_count || 0,
      status: d.status
    }))
  } catch (error) {
    console.error('加载菜品失败:', error)
    dishes.value = []
  }
}

async function saveCategory() {
  if (!categoryForm.value.name) {
    ElMessage.warning('请输入分类名称')
    return
  }
  try {
    if (editingCategoryId.value) {
      await categoryApi.updateCategory(editingCategoryId.value, categoryForm.value)
      ElMessage.success('分类更新成功')
    } else {
      const exists = categories.value.some(c => c.name === categoryForm.value.name)
      if (exists) {
        ElMessage.warning('分类已存在')
        return
      }
      await categoryApi.createCategory(categoryForm.value)
      ElMessage.success('分类添加成功')
    }
    closeCategoryDialog()
    await loadCategories()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

function editCategory(category) {
  editingCategoryId.value = category.id
  categoryForm.value = { name: category.name, icon: category.icon }
  showAddCategoryDialog.value = true
}

function closeCategoryDialog() {
  showAddCategoryDialog.value = false
  categoryForm.value = { name: '', icon: '' }
  editingCategoryId.value = null
}

async function deleteCategory(category) {
  const hasDishes = dishes.value.some(d => d.category_id === category.id)
  if (hasDishes) {
    ElMessage.warning('该分类下还有菜品，请先删除菜品')
    return
  }
  await ElMessageBox.confirm('确定删除该分类？', '提示', { type: 'warning' })
  try {
    await categoryApi.deleteCategory(category.id)
    ElMessage.success('删除成功')
    await loadCategories()
    if (selectedCategory.value === category.id) {
      selectedCategory.value = null
    }
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

async function saveDish() {
  if (!dishForm.value.name || !dishForm.value.category_id) {
    ElMessage.warning('请填写完整信息')
    return
  }
  try {
    const data = {
      name: dishForm.value.name,
      category_id: dishForm.value.category_id,
      price: dishForm.value.price,
      description: dishForm.value.description,
      image_url: dishForm.value.image,
      is_hot: dishForm.value.is_hot,
      sales_count: 0
    }
    if (editingCategoryId.value) {
      await dishApi.updateDish(editingCategoryId.value, data)
      ElMessage.success('菜品更新成功')
    } else {
      await dishApi.createDish(data)
      ElMessage.success('菜品添加成功')
    }
    closeDishDialog()
    await loadDishes()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

function editDish(dish) {
  editingCategoryId.value = dish.id
  dishForm.value = { 
    name: dish.name,
    category_id: dish.category_id,
    price: dish.price,
    description: dish.description,
    image: dish.image,
    is_hot: dish.is_hot
  }
  showAddDishDialog.value = true
}

function closeDishDialog() {
  showAddDishDialog.value = false
  dishForm.value = { name: '', category_id: '', price: 0, description: '', image: '', is_hot: false }
  editingCategoryId.value = null
}

async function deleteDish(id) {
  await ElMessageBox.confirm('确定删除该菜品？', '提示', { type: 'warning' })
  try {
    await dishApi.deleteDish(id)
    ElMessage.success('删除成功')
    await loadDishes()
  } catch (error) {
    ElMessage.error('删除失败')
  }
}

function toggleHot(dish) {
  dish.is_hot = !dish.is_hot
  dishApi.updateDish(dish.id, { is_hot: dish.is_hot })
}

function handleImageUpload(response) {
  if (response.image_url) {
    dishForm.value.image = response.image_url
  }
}

function beforeImageUpload(file) {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.warning('请上传图片文件')
    return false
  }
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.warning('图片大小不能超过2MB')
    return false
  }
  return true
}

function batchGenerateImages() {
  if (dishesWithoutImages.value.length === 0) {
    ElMessage.info('所有菜品都已有图片')
    return
  }
  showGenerateDialog.value = true
}

async function startBatchGenerate() {
  const dishesToGenerate = dishesWithoutImages.value
  generatingImages.value = true
  generatingProgress.value = {
    current: 0,
    total: dishesToGenerate.length,
    percentage: 0,
    currentDish: ''
  }

  try {
    for (let i = 0; i < dishesToGenerate.length; i++) {
      const dish = dishesToGenerate[i]
      generatingProgress.value.current = i + 1
      generatingProgress.value.percentage = Math.round((i + 1) / dishesToGenerate.length * 100)
      generatingProgress.value.currentDish = dish.name

      await dishApi.generateImages({ dish_ids: [dish.id] })
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    ElMessage.success(`成功为 ${dishesToGenerate.length} 道菜品生成图片`)
    showGenerateDialog.value = false
    await loadDishes()
  } catch (error) {
    console.error('批量生成图片失败:', error)
    ElMessage.error('批量生成图片失败')
  } finally {
    generatingImages.value = false
    generatingProgress.value = null
  }
}

async function generateSingleImage(dish) {
  await ElMessageBox.confirm(`确定为「${dish.name}」生成图片？`, '提示', { type: 'info' })
  try {
    await dishApi.generateImages({ dish_ids: [dish.id] })
    ElMessage.success('图片生成成功')
    await loadDishes()
  } catch (error) {
    ElMessage.error('图片生成失败')
  }
}

onMounted(() => {
  loadCategories()
  loadDishes()
})
</script>

<style scoped>
.menu-page {
  padding: 18px;
  background: var(--ds-bg);
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18px;
  padding: 18px 20px;
  background: var(--ds-surface);
  border: 1px solid var(--ds-border);
  border-radius: 16px;
  box-shadow: var(--ds-shadow-card);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--ds-primary), #2f6f5e);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 22px;
}

.header-title h1 {
  font-size: 24px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.header-title p {
  font-size: 14px;
  color: #64748b;
  margin: 4px 0 0 0;
}

.header-right {
  display: flex;
  gap: 12px;
}

.btn-primary {
  background: linear-gradient(135deg, var(--ds-primary), var(--ds-primary-700)) !important;
  border: none !important;
  border-radius: 10px !important;
  padding: 10px 20px !important;
  font-weight: 500 !important;
  box-shadow: 0 4px 12px rgba(180, 83, 9, 0.22) !important;
  transition: all 0.3s ease !important;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(180, 83, 9, 0.26) !important;
}

.btn-secondary {
  border-radius: 10px !important;
  padding: 10px 20px !important;
  color: #64748b !important;
  border-color: #e2e8f0 !important;
  background: white !important;
}

.btn-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
  border: none !important;
  border-radius: 10px !important;
  padding: 10px 20px !important;
  font-weight: 500 !important;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3) !important;
  transition: all 0.3s ease !important;
}

.btn-success:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4) !important;
}

.main-content {
  display: flex;
  gap: 16px;
}

.left-sidebar {
  width: 280px;
  flex-shrink: 0;
}

.sidebar-section {
  background: var(--ds-surface);
  border: 1px solid var(--ds-border);
  border-radius: 16px;
  padding: 16px;
  box-shadow: var(--ds-shadow-card);
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f1f5f9;
}

.section-title {
  font-size: 16px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.section-title i {
  width: 32px;
  height: 32px;
  border-radius: 10px;
  background: var(--ds-primary-soft);
  color: var(--ds-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.search-wrapper {
  position: relative;
}

.search-input {
  width: 100%;
  border-radius: 10px;
  border: 2px solid #e2e8f0;
  padding: 8px 14px;
  transition: all 0.3s ease;
}

.search-input:focus {
  border-color: var(--ds-primary);
  box-shadow: 0 0 0 3px rgba(180, 83, 9, 0.1);
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.category-item {
  display: flex;
  align-items: center;
  padding: 12px 14px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.category-item:hover {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.category-item.active {
  background: var(--ds-primary-soft);
  border-color: var(--ds-primary);
}

.category-icon-wrapper {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--ds-primary), #2f6f5e);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 16px;
  margin-right: 12px;
}

.category-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.category-name {
  font-size: 14px;
  font-weight: 600;
  color: #1e293b;
}

.category-count {
  font-size: 12px;
  color: #94a3b8;
}

.category-actions {
  display: flex;
  gap: 6px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.category-item:hover .category-actions {
  opacity: 1;
}

.category-actions .action-btn {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 12px;
  background: #f1f5f9;
  color: #64748b;
}

.category-actions .action-btn:hover {
  background: #e2e8f0;
}

.category-actions .action-btn.delete:hover {
  background: #fee2e2;
  color: #ef4444;
}

.empty-category {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px;
  color: #94a3b8;
}

.empty-category i {
  font-size: 24px;
  margin-bottom: 8px;
  opacity: 0.6;
}

.empty-category span {
  font-size: 13px;
}

.right-content {
  flex: 1;
  min-width: 0;
}

.dish-section {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.section-title-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.result-count {
  font-size: 13px;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 6px 14px;
  border-radius: 20px;
}

.no-image-count {
  font-size: 13px;
  color: #ef4444;
  background: #fef2f2;
  padding: 6px 14px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.dish-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 20px;
}

.dish-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  background: white;
}

.dish-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.12);
}

.dish-image-wrapper {
  position: relative;
  height: 200px;
  overflow: hidden;
}

.dish-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.dish-image-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #64748b;
}

.dish-image-placeholder i {
  font-size: 48px;
  opacity: 0.6;
}

.dish-image-placeholder span {
  font-size: 16px;
  font-weight: 500;
  color: #94a3b8;
}

.dish-card:hover .dish-image {
  transform: scale(1.05);
}

.dish-image-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  gap: 12px;
}

.dish-card:hover .dish-image-overlay {
  opacity: 1;
}

.overlay-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--ds-primary);
  font-size: 16px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.overlay-btn:hover {
  transform: scale(1.1);
}

.dish-tag {
  position: absolute;
  top: 12px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
}

.hot-tag {
  right: 12px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.4);
  animation: pulse 2s infinite;
}

.no-image-tag {
  left: 12px;
  background: #fef2f2;
  color: #ef4444;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.dish-info {
  padding: 20px;
}

.dish-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.dish-name {
  font-size: 17px;
  font-weight: 700;
  color: #1e293b;
  margin: 0;
}

.dish-price {
  font-size: 22px;
  font-weight: 700;
  color: #ef4444;
}

.dish-description {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 14px 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.6;
}

.dish-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.dish-category, .dish-sales {
  font-size: 12px;
  color: #64748b;
  background: #f1f5f9;
  padding: 6px 12px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.dish-category {
  background: var(--ds-primary-soft);
  color: var(--ds-primary);
}

.dish-sales i {
  font-size: 11px;
}

.dish-actions {
  display: flex;
  gap: 10px;
}

.dish-actions .action-btn {
  flex: 1;
  height: 38px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 500;
}

.dish-actions .edit-btn {
  background: var(--ds-primary-soft);
  color: var(--ds-primary);
}

.dish-actions .edit-btn:hover {
  background: #fff7ed;
}

.dish-actions .delete-btn {
  background: #fef2f2;
  color: #ef4444;
}

.dish-actions .delete-btn:hover {
  background: #fee2e2;
}

.hot-btn {
  background: #fffbeb;
  color: #f59e0b;
}

.hot-btn.active {
  background: #fef3c7;
  color: #d97706;
}

.empty-state {
  text-align: center;
  padding: 80px 0;
  color: #94a3b8;
}

.empty-icon {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  color: #cbd5e1;
  font-size: 36px;
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: #64748b;
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
}

.dish-upload {
  width: 100%;
}

.upload-preview {
  width: 200px;
  height: 200px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.upload-placeholder {
  width: 200px;
  height: 200px;
  border: 2px dashed #e2e8f0;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.3s;
  background: #f8fafc;
}

.upload-placeholder:hover {
  border-color: var(--ds-primary);
  background: var(--ds-primary-soft);
  color: var(--ds-primary);
}

.upload-placeholder i {
  font-size: 32px;
  margin-bottom: 8px;
}

.generate-dialog-content {
  padding: 16px 0;
}

.generate-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f1f5f9;
}

.info-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--ds-primary), var(--ds-food));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
}

.info-text h4 {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.info-text p {
  font-size: 14px;
  color: #64748b;
  margin: 0 0 4px 0;
  line-height: 1.6;
}

.count-info {
  font-weight: 500;
  color: var(--ds-primary) !important;
}

.progress-section {
  padding-top: 20px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-size: 14px;
  color: #64748b;
}

.current-dish {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  font-size: 14px;
  color: var(--ds-primary);
}
</style>
