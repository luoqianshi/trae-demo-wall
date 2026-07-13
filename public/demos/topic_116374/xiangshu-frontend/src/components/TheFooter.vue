<script setup>
import { useRouter } from 'vue-router'

// 页脚：项目介绍与快捷链接
const router = useRouter()

const links = [
  { label: '首页', path: '/', icon: 'lucide:home' },
  { label: '关于', path: '/about', icon: 'lucide:scroll-text' },
  { label: '探索', path: '/explore', icon: 'lucide:compass' }
]

const go = (path) => router.push(path)
</script>

<template>
  <footer class="footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <div class="seal-foot">乡</div>
        <div>
          <b>乡书 · 乡村家庭档案</b>
          <p class="tagline">让家族记忆，永不消失</p>
        </div>
      </div>

      <p class="desc">用数字技术帮每个乡村家庭建立永久档案，把根留住，把故事讲下去。</p>

      <nav class="foot-links">
        <a v-for="l in links" :key="l.path" @click="go(l.path)">
          <AppIcon :icon="l.icon" :size="14" />
          {{ l.label }}
        </a>
      </nav>

      <div class="footer-bottom">
        <span>© 2026 乡书 XIANGSHU</span>
        <span class="dot">·</span>
        <span>用数字技术守护乡村记忆</span>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: linear-gradient(180deg, var(--bg), var(--bg-deep));
  border-top: 1px solid rgba(139, 107, 80, 0.15);
  padding: 50px 28px 30px;
  position: relative;
  box-shadow: 0 -1px 0 rgba(255, 255, 255, 0.4) inset;
}

.footer-inner {
  max-width: 900px;
  margin: 0 auto;
  text-align: center;
}

.footer-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 18px;
}

.seal-foot {
  display: inline-flex;
  width: 50px;
  height: 50px;
  border-radius: 8px;
  background: var(--gradient-seal);
  color: var(--bg-warm);
  align-items: center;
  justify-content: center;
  font-family: var(--font-display);
  font-size: 24px;
  transform: rotate(-4deg);
  box-shadow: inset 0 0 0 2px rgba(243, 234, 217, 0.5), 0 4px 12px rgba(168, 50, 50, 0.3);
}

.footer-brand b {
  color: var(--primary-deep);
  font-family: var(--font-display);
  font-size: 20px;
  display: block;
  letter-spacing: 1px;
}

.tagline {
  font-size: 13px;
  color: var(--seal);
  letter-spacing: 2px;
  margin-top: 2px;
}

.desc {
  color: var(--text-light);
  font-size: 14px;
  margin-bottom: 22px;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
  line-height: 1.7;
}

.foot-links {
  display: flex;
  justify-content: center;
  gap: 28px;
  margin-bottom: 22px;
}

.foot-links a {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: var(--text-light);
  font-size: 14px;
  transition: color var(--transition);
}

.foot-links a:hover {
  color: var(--seal);
}

.footer-bottom {
  padding-top: 18px;
  border-top: 1px dashed rgba(139, 107, 80, 0.2);
  font-size: 12px;
  color: var(--text-soft);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.dot {
  opacity: 0.5;
}

@media (max-width: 600px) {
  .footer-brand {
    flex-direction: column;
    gap: 10px;
  }
  .foot-links {
    gap: 18px;
  }
}
</style>
