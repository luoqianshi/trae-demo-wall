<template>
  <div>
    <!-- CTA -->
    <section class="cta-section">
      <div class="container cta-inner">
        <div class="cta-icon-wrap">
          <IconRocket :size="48" />
        </div>
        <h2 class="cta-title">告别格式困扰，专注学术本身</h2>
        <p class="cta-desc">让毕格修为你的毕业论文保驾护航，一键格式检修，轻松达标</p>
        <button class="btn btn-primary cta-btn" @click="$router.push('/paper')">
          <IconRocket :size="18" />
          立即体验毕格修
        </button>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="container footer-inner">
        <div class="footer-brand">
          <div class="footer-brand-name">毕格修 <span class="footer-brand-en">PaperFix AI</span></div>
          <div class="footer-tagline">毕业论文格式智能检修工具</div>
        </div>
        <div class="footer-divider"></div>
        <div class="footer-bottom">
          <span>&copy; 2026 毕格修 PaperFix AI. All rights reserved.</span>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup>
import IconRocket from './icons/IconRocket.vue'
</script>

<style scoped>
.cta-section {
  background: var(--bg-section-alt);
  padding: 80px 0;
  text-align: center;
}

.cta-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.cta-icon-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 80px;
  border-radius: 24px;
  background: var(--color-primary-light);
  margin-bottom: 8px;
}

.cta-title {
  font-family: var(--font-heading);
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
}

.cta-desc {
  font-size: 17px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.cta-btn {
  padding: 16px 36px;
  font-size: 16px;
}

/* Footer */
.footer {
  background: var(--bg-footer);
  padding: 48px 0 32px;
  position: relative;
}

.footer::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, var(--color-accent) 50%, transparent 100%);
  opacity: 0.3;
}

.footer-inner {
  text-align: center;
}

.footer-brand-name {
  font-family: var(--font-heading);
  font-size: 24px;
  font-weight: 700;
  color: var(--text-on-dark);
  margin-bottom: 6px;
}

.footer-brand-en {
  font-family: var(--font-body);
  font-weight: 300;
  font-size: 16px;
  color: var(--color-footer-muted-60);
}

.footer-tagline {
  font-size: 14px;
  color: var(--color-footer-muted-50);
  letter-spacing: 2px;
}

.footer-divider {
  width: 60px;
  height: 1px;
  background: var(--color-footer-muted-15);
  margin: 24px auto;
}

.footer-bottom {
  font-size: 13px;
  color: var(--color-footer-muted-35);
}

@media (max-width: 640px) {
  .cta-title {
    font-size: 24px;
  }
  .cta-section {
    padding: 48px 0;
  }
}
</style>
