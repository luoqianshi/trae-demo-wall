// 爪印城市 - 轮播组件
const Carousel = {
  init(containerId, images, autoPlay = true) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const colors = ['#FF8C42', '#5B9BD5', '#86D9C8', '#B39DDB'];
    const icons = {
      cafe: '☕', bar: '🍺', catcafe: '🍰', hotel: '🏨', park: '🌳',
      mall: '🛍️', hutong: '🏘️', barkpark: '🐕', apt: '🏠', shop: '🛒',
      canal: '🌊', daycare: '🐾', catforest: '🐱', plaza: '🏬', square: '🏛️',
      starbucks: '☕'
    };

    let currentIndex = 0;
    let interval = null;

    const slides = images.map((img, i) => {
      const key = img.replace(/[0-9]/g, '');
      const icon = icons[key] || '🐾';
      return `<div class="carousel-slide" style="background:${colors[i % colors.length]};">
        <span>${icon}</span>
      </div>`;
    }).join('');

    const dots = images.map((_, i) =>
      `<span class="carousel-dot${i === 0 ? ' active' : ''}" data-index="${i}"></span>`
    ).join('');

    container.innerHTML = `
      <div class="carousel-track" id="${containerId}-track">${slides}</div>
      <div class="carousel-dots" id="${containerId}-dots">${dots}</div>
    `;

    const track = document.getElementById(`${containerId}-track`);
    const dotsEl = document.getElementById(`${containerId}-dots`);

    const goTo = (index) => {
      currentIndex = index;
      track.style.transform = `translateX(-${index * 100}%)`;
      dotsEl.querySelectorAll('.carousel-dot').forEach((d, i) => {
        d.classList.toggle('active', i === index);
      });
    };

    dotsEl.addEventListener('click', (e) => {
      if (e.target.classList.contains('carousel-dot')) {
        goTo(parseInt(e.target.dataset.index));
      }
    });

    // 触摸滑动
    let startX = 0;
    track.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
      if (interval) clearInterval(interval);
    });
    track.addEventListener('touchend', (e) => {
      const diff = startX - e.changedTouches[0].clientX;
      if (Math.abs(diff) > 50) {
        goTo(diff > 0
          ? Math.min(currentIndex + 1, images.length - 1)
          : Math.max(currentIndex - 1, 0));
      }
      if (autoPlay) startAuto();
    });

    const startAuto = () => {
      interval = setInterval(() => {
        goTo((currentIndex + 1) % images.length);
      }, 3000);
    };

    if (autoPlay) startAuto();
  }
};