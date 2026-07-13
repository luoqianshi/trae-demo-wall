/**
 * 饭泛之交 - Utils 工具函数
 * 模块化拆分自单文件原型
 */

// ==================== TOAST ====================
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ==================== COUNTER ANIMATION ====================
function animateCounter(elementId, targetValue) {
  const el = document.getElementById(elementId);
  if(!el) return;
  const startValue = parseInt(el.textContent) || 0;
  if(startValue === targetValue) return;
  const duration = 600;
  const startTime = performance.now();
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    // Ease out cubic
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(startValue + (targetValue - startValue) * eased);
    el.textContent = current;
    if(progress < 1) {
      requestAnimationFrame(update);
    } else {
      el.textContent = targetValue;
    }
  }
  requestAnimationFrame(update);
}

// ==================== SCROLL REVEAL ====================
function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });
  
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// ==================== STAGGER HELPER ====================
function addStaggerAnimation(container, selector) {
  if(!container) return;
  const items = container.querySelectorAll(selector);
  items.forEach((item, i) => {
    item.style.animationDelay = (i * 0.06) + 's';
    item.classList.add('stagger-item');
  });
}