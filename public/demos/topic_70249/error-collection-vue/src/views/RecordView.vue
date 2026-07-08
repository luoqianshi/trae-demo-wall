<template>
  <div class="page-content">
    <div class="flex items-center mb-4">
      <el-button text circle @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon>
      </el-button>
      <h1 class="text-lg font-bold ml-2">录入错题</h1>
    </div>

    <!-- Image Upload Area -->
    <div
      class="border-2 border-dashed border-slate-300 rounded-xl h-40 flex flex-col items-center justify-center gap-2 mb-4 bg-slate-50 cursor-pointer active:bg-slate-100 transition-colors"
      @click="simulateUpload"
    >
      <el-icon size="32" class="text-slate-400"><Camera /></el-icon>
      <span class="text-sm text-slate-500">点击拍照或从相册选择</span>
      <span class="text-xs text-slate-400">支持单题拍照和试卷批量导入</span>
    </div>

    <!-- OCR Result -->
    <div class="mb-4">
      <label class="text-sm font-medium text-slate-700 mb-1 block">题目文本 <span class="text-xs text-slate-400">(OCR 识别，可编辑)</span></label>
      <el-input
        v-model="form.content"
        type="textarea"
        :rows="3"
        placeholder="题目内容..."
        class="!text-sm"
      />
    </div>

    <!-- Subject & Topic -->
    <div class="grid grid-cols-2 gap-3 mb-4">
      <div>
        <label class="text-sm font-medium text-slate-700 mb-1 block">科目 <span class="text-red-500">*</span></label>
        <el-select v-model="form.subject" placeholder="选择科目" class="w-full">
          <el-option label="数学" value="数学" />
          <el-option label="物理" value="物理" />
          <el-option label="化学" value="化学" />
          <el-option label="英语" value="英语" />
          <el-option label="语文" value="语文" />
        </el-select>
      </div>
      <div>
        <label class="text-sm font-medium text-slate-700 mb-1 block">知识点 <span class="text-red-500">*</span></label>
        <el-cascader
          v-model="form.topicPath"
          :options="topicOptions"
          placeholder="选择知识点"
          class="w-full"
          :props="{ expandTrigger: 'hover' }"
        />
      </div>
    </div>

    <!-- Difficulty & Reason -->
    <div class="grid grid-cols-2 gap-3 mb-4">
      <div>
        <label class="text-sm font-medium text-slate-700 mb-1 block">难度</label>
        <el-select v-model="form.difficulty" placeholder="难度" class="w-full">
          <el-option label="简单" value="easy" />
          <el-option label="中等" value="medium" />
          <el-option label="困难" value="hard" />
        </el-select>
      </div>
      <div>
        <label class="text-sm font-medium text-slate-700 mb-1 block">错误原因 <span class="text-red-500">*</span></label>
        <el-select v-model="form.reason" multiple placeholder="选择原因" class="w-full">
          <el-option label="概念不清" value="概念不清" />
          <el-option label="公式记错" value="公式记错" />
          <el-option label="计算失误" value="计算失误" />
          <el-option label="审题偏差" value="审题偏差" />
          <el-option label="思路受阻" value="思路受阻" />
          <el-option label="其他" value="其他" />
        </el-select>
      </div>
    </div>

    <!-- Wrong Answer -->
    <div class="mb-4">
      <label class="text-sm font-medium text-slate-700 mb-1 block">我的错解 <span class="text-slate-400 font-normal">(可选)</span></label>
      <el-input
        v-model="form.wrongAnswer"
        type="textarea"
        :rows="2"
        placeholder="记录当时的错误解答..."
        class="!text-sm"
      />
    </div>

    <!-- Correct Answer -->
    <div class="mb-6">
      <label class="text-sm font-medium text-slate-700 mb-1 block">正解 / 笔记 <span class="text-slate-400 font-normal">(可选)</span></label>
      <el-input
        v-model="form.correctAnswer"
        type="textarea"
        :rows="2"
        placeholder="正确答案或解题笔记..."
        class="!text-sm"
      />
    </div>

    <!-- Actions -->
    <div class="flex gap-3">
      <el-button class="flex-1" size="large" round @click="$router.back()">取消</el-button>
      <el-button
        type="primary"
        class="flex-1 !bg-primary !border-primary"
        size="large"
        round
        :disabled="!isValid"
        @click="saveError"
      >
        保存错题
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

const form = reactive({
  content: '已知函数 f(x) = 2sin(2x + π/3)，求其在 [0, π] 上的最大值。',
  subject: '数学',
  topicPath: ['数学', '三角函数', '诱导公式'],
  difficulty: 'medium',
  reason: ['公式记错'],
  wrongAnswer: '',
  correctAnswer: '',
})

const topicOptions = [
  {
    value: '数学',
    label: '数学',
    children: [
      { value: '函数与导数', label: '函数与导数', children: [{ value: '单调性', label: '单调性' }, { value: '极值', label: '极值' }] },
      { value: '三角函数', label: '三角函数', children: [{ value: '诱导公式', label: '诱导公式' }, { value: '图像变换', label: '图像变换' }] },
      { value: '数列', label: '数列', children: [{ value: '等差数列', label: '等差数列' }, { value: '等比数列', label: '等比数列' }] },
      { value: '解析几何', label: '解析几何', children: [{ value: '椭圆', label: '椭圆' }, { value: '双曲线', label: '双曲线' }] },
    ],
  },
  {
    value: '物理',
    label: '物理',
    children: [
      { value: '力学', label: '力学', children: [{ value: '牛顿定律', label: '牛顿定律' }, { value: '动量守恒', label: '动量守恒' }] },
      { value: '电磁学', label: '电磁学', children: [{ value: '电磁感应', label: '电磁感应' }, { value: '电路', label: '电路' }] },
    ],
  },
  {
    value: '化学',
    label: '化学',
    children: [
      { value: '氧化还原', label: '氧化还原', children: [{ value: '方程式配平', label: '方程式配平' }] },
      { value: '化学平衡', label: '化学平衡', children: [{ value: '勒夏特列', label: '勒夏特列' }] },
    ],
  },
]

const isValid = computed(() => {
  return form.content && form.subject && form.topicPath.length > 0 && form.reason.length > 0
})

function simulateUpload() {
  ElMessage.success('模拟拍照成功，已识别题目')
}

function saveError() {
  ElMessage.success('错题保存成功')
  router.push('/book')
}
</script>
