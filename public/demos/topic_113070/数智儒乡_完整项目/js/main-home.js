function animateCounter(element, target, duration = 2000) {
  const start = 0;
  const startTime = performance.now();
  
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (target - start) * easeOut);
    
    element.textContent = current;
    
    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }
  
  requestAnimationFrame(update);
}

function initHeroStats() {
  setTimeout(() => {
    const statLunyu = document.getElementById('stat-lunyu');
    const statLife = document.getElementById('stat-life');
    const statThought = document.getElementById('stat-thought');
    const statCulture = document.getElementById('stat-culture');
    
    if (statLunyu) animateCounter(statLunyu, 492);
    if (statLife) animateCounter(statLife, 73);
    if (statThought) animateCounter(statThought, 12);
    if (statCulture) animateCounter(statCulture, 30);
  }, 1000);
}

document.addEventListener('DOMContentLoaded', () => {
  initHeroStats();
});