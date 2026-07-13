<script setup>
import { genderText, genderClass, lifeSpan } from '@/utils/format'

// 家族成员卡片：展示头像、姓名、生卒、配偶、简介
defineProps({
  member: {
    type: Object,
    required: true
  }
})

// 点击查看详情
const emit = defineEmits(['click'])
</script>

<template>
  <div class="member-card" :class="genderClass(member.gender)" @click="emit('click', member)">
    <div class="avatar" :class="genderClass(member.gender)">
      {{ member.name.charAt(0) }}
    </div>
    <div class="info">
      <h4>{{ member.name }} <span class="gender">{{ genderText(member.gender) }}</span></h4>
      <div class="meta">{{ lifeSpan(member.birthYear, member.deathYear) }}</div>
      <p v-if="member.description">{{ member.description }}</p>
      <div class="spouse" v-if="member.spouseName">
        <span class="lbl">配偶</span>{{ member.spouseName }}
      </div>
    </div>
    <div class="arrow">›</div>
  </div>
</template>

<style scoped>
.member-card {
  display: flex;
  gap: 16px;
  background: var(--bg-warm);
  border-radius: var(--radius);
  padding: 18px;
  box-shadow: var(--shadow-soft);
  cursor: pointer;
  transition: all var(--transition);
  border: 1px solid rgba(139, 107, 80, 0.1);
  border-left: 4px solid var(--moss);
}

.member-card.female {
  border-left-color: var(--seal);
}

.member-card:hover {
  transform: translateX(4px);
  box-shadow: var(--shadow-lift);
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 26px;
  color: var(--bg-warm);
  background: linear-gradient(135deg, var(--moss), var(--moss-deep));
}

.avatar.female {
  background: linear-gradient(135deg, var(--seal), var(--seal-deep));
}

.info {
  flex: 1;
  min-width: 0;
}

.info h4 {
  font-family: var(--font-display);
  font-size: 20px;
  color: var(--primary-deep);
  font-weight: 400;
  margin-bottom: 2px;
}

.gender {
  font-size: 12px;
  color: var(--text-soft);
  font-family: var(--font-serif);
  font-weight: normal;
}

.meta {
  font-size: 13px;
  color: var(--text-light);
  margin-bottom: 6px;
  font-family: var(--font-sub);
}

.info p {
  font-size: 13px;
  color: var(--text-light);
  line-height: 1.5;
}

.spouse {
  margin-top: 8px;
  font-size: 12px;
  color: var(--moss-deep);
}

.spouse .lbl {
  display: inline-block;
  padding: 2px 8px;
  background: rgba(90, 122, 107, 0.12);
  border-radius: 10px;
  margin-right: 6px;
  color: var(--moss-deep);
}

.arrow {
  align-self: center;
  color: var(--text-soft);
  font-size: 22px;
  transition: transform var(--transition);
}

.member-card:hover .arrow {
  transform: translateX(4px);
  color: var(--seal);
}
</style>
