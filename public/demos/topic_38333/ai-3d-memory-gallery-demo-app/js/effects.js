/* ============================================
   AI 立体回忆馆 — 视觉特效
   ============================================ */

const Effects = {
  init() {
    this._initCardTilt();
    this._initTextGradient();
  },

  /**
   * 3D 卡片倾斜效果
   */
  _initCardTilt() {
    document.querySelectorAll('.card, .feature-card, .gallery-item').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -4;
        const rotateY = ((x - centerX) / centerX) * 4;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  },

  /**
   * 标题文字渐变扫光
   */
  _initTextGradient() {
    document.querySelectorAll('.hero h1').forEach(el => {
      el.addEventListener('mouseenter', () => {
        el.style.transition = 'background-position 0.6s ease';
        el.style.backgroundSize = '200% 100%';
        el.style.backgroundPosition = '100% 0';
        setTimeout(() => {
          el.style.backgroundPosition = '0% 0';
        }, 50);
      });
      el.addEventListener('mouseleave', () => {
        el.style.backgroundPosition = '50% 0';
      });
    });
  }
};

// Initialize effects when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  Effects.init();
});
