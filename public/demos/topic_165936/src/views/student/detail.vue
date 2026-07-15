<template>
  <div class="student-detail-container">
    <el-page-header @back="goBack" content="学生详情" />

    <el-row :gutter="20" class="detail-row">
      <el-col :md="6">
        <el-card class="avatar-card" shadow="hover">
          <div class="avatar-wrapper">
            <el-avatar :size="120" :src="student.avatar || ''">
              {{ student.name?.charAt(0) }}
            </el-avatar>
            <h3 class="student-name">{{ student.name }}</h3>
            <p class="student-no">{{ student.studentNo }}</p>
            <el-tag :type="student.status === 1 ? 'success' : 'danger'">
              {{ student.status === 1 ? '在读' : '休学' }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
      <el-col :md="18">
        <el-card class="info-card" shadow="hover">
          <template #header>
            <span>基本信息</span>
          </template>
          <el-descriptions :column="3" border>
            <el-descriptions-item label="姓名">{{ student.name }}</el-descriptions-item>
            <el-descriptions-item label="学号">{{ student.studentNo }}</el-descriptions-item>
            <el-descriptions-item label="性别">{{ student.gender }}</el-descriptions-item>
            <el-descriptions-item label="班级">{{ student.className }}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{ student.phone }}</el-descriptions-item>
            <el-descriptions-item label="邮箱">{{ student.email || '-' }}</el-descriptions-item>
            <el-descriptions-item label="身份证号">{{ student.idCard }}</el-descriptions-item>
            <el-descriptions-item label="入学时间">{{ student.createTime }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="student.status === 1 ? 'success' : 'danger'">
                {{ student.status === 1 ? '在读' : '休学' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="家庭住址" :span="3">{{ student.address || '-' }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="3">{{ student.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="detail-row">
      <el-col :md="24">
        <el-card class="score-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>操行分记录</span>
              <el-button type="primary" link>查看全部</el-button>
            </div>
          </template>
          <el-table :data="scoreRecords" stripe>
            <el-table-column type="index" label="序号" width="60" />
            <el-table-column prop="ruleName" label="规则名称" min-width="150" />
            <el-table-column prop="score" label="分值" width="80">
              <template #default="{ row }">
                <span :style="{ color: row.score > 0 ? '#67C23A' : '#F56C6C' }">
                  {{ row.score > 0 ? '+' : '' }}{{ row.score }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="type" label="类型" width="100" />
            <el-table-column prop="reason" label="原因" min-width="200" />
            <el-table-column prop="operatorName" label="操作人" width="100" />
            <el-table-column prop="createTime" label="时间" width="180" />
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const student = ref({
  id: 1,
  studentNo: '20230001',
  name: '张三',
  gender: '男',
  className: '计算机2301班',
  phone: '13800138001',
  idCard: '110101200501010001',
  email: 'zhangsan@example.com',
  avatar: '',
  address: '北京市朝阳区',
  status: 1,
  remark: '表现良好',
  createTime: '2024-01-01 00:00:00'
})

const scoreRecords = ref([
  { id: 1, ruleName: '按时交作业', score: 2, type: '学习', reason: '按时完成作业', operatorName: '王老师', createTime: '2024-01-15 10:00:00' },
  { id: 2, ruleName: '上课迟到', score: -1, type: '纪律', reason: '早自习迟到5分钟', operatorName: '李班长', createTime: '2024-01-14 08:00:00' },
  { id: 3, ruleName: '打扫卫生', score: 1, type: '卫生', reason: '值日认真', operatorName: '赵卫生委员', createTime: '2024-01-13 17:00:00' },
  { id: 4, ruleName: '上课积极回答问题', score: 2, type: '学习', reason: '课堂表现积极', operatorName: '张老师', createTime: '2024-01-12 14:00:00' },
  { id: 5, ruleName: '宿舍卫生优秀', score: 3, type: '卫生', reason: '宿舍被评为优秀', operatorName: '赵卫生委员', createTime: '2024-01-10 09:00:00' }
])

function goBack() {
  router.back()
}

onMounted(() => {
  const id = route.params.id
  console.log('Student ID:', id)
})
</script>

<style scoped lang="scss">
.student-detail-container {
  .detail-row {
    margin-top: 20px;
  }

  .avatar-card {
    border: none;
    border-radius: 8px;
  }

  .avatar-wrapper {
    text-align: center;
    padding: 20px 0;

    .student-name {
      margin: 15px 0 5px;
      font-size: 20px;
      color: #303133;
    }

    .student-no {
      margin: 0 0 15px;
      color: #909399;
      font-size: 14px;
    }
  }

  .info-card {
    border: none;
    border-radius: 8px;
  }

  .score-card {
    border: none;
    border-radius: 8px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}
</style>
