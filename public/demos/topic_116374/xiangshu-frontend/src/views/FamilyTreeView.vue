<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useArchiveStore } from '@/store/archiveStore'
import { useUiStore } from '@/store/uiStore'
import FamilyTree from '@/components/FamilyTree.vue'
import MemberCard from '@/components/MemberCard.vue'
import { genderText, genderClass, lifeSpan } from '@/utils/format'

// 家族树页：树形展示 + 成员详情弹窗 + 添加成员
const router = useRouter()
const archiveStore = useArchiveStore()
const uiStore = useUiStore()

// 当前查看的成员
const currentMember = ref(null)
const showMember = ref(false)

// 添加成员弹窗
const showAdd = ref(false)
const addForm = ref({
  name: '',
  gender: 1,
  birthYear: '',
  parentId: null,
  spouseName: '',
  description: ''
})

// 可选父节点（仅前几代成员可作为父节点）
const parentOptions = ref([])

onMounted(async () => {
  if (!archiveStore.members.length) {
    await archiveStore.fetchMembers()
  }
  refreshParentOptions()
})

const refreshParentOptions = () => {
  // 排除最年轻一代（无法作为父节点）— 简化为：所有成员都可作父节点
  parentOptions.value = archiveStore.members.map((m) => ({
    id: m.id,
    label: `${m.name}（${m.birthYear}）`
  }))
}

// 选中成员
const onSelect = (m) => {
  currentMember.value = m
  showMember.value = true
}

// 提交添加成员
const onAdd = async () => {
  if (!addForm.value.name) {
    uiStore.showToast('请输入成员姓名', 'err')
    return
  }
  if (!addForm.value.birthYear) {
    uiStore.showToast('请输入出生年份', 'err')
    return
  }
  try {
    await archiveStore.addMember({ ...addForm.value })
    uiStore.showToast('成员添加成功')
    showAdd.value = false
    addForm.value = {
      name: '',
      gender: 1,
      birthYear: '',
      parentId: null,
      spouseName: '',
      description: ''
    }
    refreshParentOptions()
  } catch (e) {
    uiStore.showToast('添加失败', 'err')
  }
}

// 返回档案页
const back = () => router.push('/archive')
</script>

<template>
  <div class="page">
    <div class="page-head">
      <button class="back-btn" @click="back">
        <AppIcon icon="lucide:arrow-left" :size="16" />
        返回档案
      </button>
      <div class="section-eyebrow">家族树</div>
      <h2 class="section-title">三代血脉，一脉相承</h2>
      <p class="section-sub">点击任一节点查看成员详情，可添加新成员完善族谱。</p>
    </div>

    <FamilyTree
      :members="archiveStore.members"
      @select="onSelect"
      @add="showAdd = true"
    />

    <!-- 成员列表（卡片形式） -->
    <div class="section-eyebrow" style="margin-top: 50px">所有成员</div>
    <h3 class="sub-title">共 {{ archiveStore.members.length }} 位</h3>
    <div class="member-grid">
      <MemberCard
        v-for="m in archiveStore.members"
        :key="m.id"
        :member="m"
        @click="onSelect"
      />
    </div>

    <!-- 成员详情弹窗 -->
    <transition name="modal">
      <div v-if="showMember && currentMember" class="modal-mask" @click.self="showMember = false">
        <div class="modal member-detail">
          <div class="modal-head">
            <h3>成员资料</h3>
            <button class="modal-close" @click="showMember = false">
              <AppIcon icon="lucide:x" :size="18" />
            </button>
          </div>
          <div class="modal-body">
            <div class="avatar-big" :class="genderClass(currentMember.gender)">
              {{ currentMember.name.charAt(0) }}
            </div>
            <div class="name-big">{{ currentMember.name }}</div>
            <div class="life">
              {{ lifeSpan(currentMember.birthYear, currentMember.deathYear) }} · {{ genderText(currentMember.gender) }}
            </div>
            <div class="bio">{{ currentMember.description || '暂无简介' }}</div>
            <div class="rela">
              <span v-if="currentMember.spouseName">配偶：{{ currentMember.spouseName }}</span>
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn btn-primary" @click="showMember = false">关闭</button>
          </div>
        </div>
      </div>
    </transition>

    <!-- 添加成员弹窗 -->
    <transition name="modal">
      <div v-if="showAdd" class="modal-mask" @click.self="showAdd = false">
        <div class="modal">
          <div class="modal-head">
            <h3>添加家族成员</h3>
            <button class="modal-close" @click="showAdd = false">
              <AppIcon icon="lucide:x" :size="18" />
            </button>
          </div>
          <div class="modal-body">
            <div class="field">
              <label>姓名</label>
              <input v-model="addForm.name" placeholder="成员姓名" />
            </div>
            <div class="field">
              <label>性别</label>
              <select v-model="addForm.gender">
                <option :value="1">男</option>
                <option :value="2">女</option>
              </select>
            </div>
            <div class="field">
              <label>出生年份</label>
              <input v-model="addForm.birthYear" placeholder="如：1980" maxlength="4" />
            </div>
            <div class="field">
              <label>父亲（可选）</label>
              <select v-model="addForm.parentId">
                <option :value="null">无（第一代）</option>
                <option v-for="p in parentOptions" :key="p.id" :value="p.id">{{ p.label }}</option>
              </select>
            </div>
            <div class="field">
              <label>配偶姓名（可选）</label>
              <input v-model="addForm.spouseName" placeholder="配偶姓名" />
            </div>
            <div class="field">
              <label>简介</label>
              <textarea v-model="addForm.description" rows="3" placeholder="成员简介..."></textarea>
            </div>
          </div>
          <div class="modal-foot">
            <button class="btn btn-ghost" @click="showAdd = false">取消</button>
            <button class="btn btn-primary" @click="onAdd">添加</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.page-head {
  margin-bottom: 30px;
}

.back-btn {
  border: none;
  background: transparent;
  color: var(--text-light);
  cursor: pointer;
  font-family: var(--font-serif);
  font-size: 14px;
  margin-bottom: 14px;
  padding: 0;
  transition: color var(--transition);
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.back-btn:hover {
  color: var(--seal);
}

.sub-title {
  font-family: var(--font-display);
  font-size: 22px;
  color: var(--primary-deep);
  font-weight: 400;
  margin-bottom: 20px;
}

.member-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.25s ease;
}

.modal-enter-active .modal,
.modal-leave-active .modal {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal,
.modal-leave-to .modal {
  transform: translateY(30px) scale(0.96);
}

.member-detail .avatar-big {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 32px;
  color: var(--bg-warm);
}

.avatar-big.male {
  background: linear-gradient(135deg, var(--moss), var(--moss-deep));
}

.avatar-big.female {
  background: linear-gradient(135deg, var(--seal), var(--seal-deep));
}

.name-big {
  text-align: center;
  font-family: var(--font-display);
  font-size: 28px;
  color: var(--primary-deep);
  margin-bottom: 4px;
}

.life {
  text-align: center;
  color: var(--text-light);
  font-size: 14px;
  margin-bottom: 20px;
}

.bio {
  padding: 16px;
  background: var(--bg-warm);
  border-radius: 10px;
  font-size: 14px;
  color: var(--text-light);
  line-height: 1.7;
}

.rela {
  display: flex;
  gap: 10px;
  margin-top: 14px;
  flex-wrap: wrap;
}

.rela span {
  font-size: 12px;
  padding: 5px 12px;
  border-radius: 14px;
  background: rgba(90, 122, 107, 0.12);
  color: var(--moss-deep);
}

@media (max-width: 768px) {
  .member-grid {
    grid-template-columns: 1fr;
  }
}
</style>
