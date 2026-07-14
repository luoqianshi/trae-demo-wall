document.addEventListener('DOMContentLoaded', () => {
  initRippleEffect();
  initHoverEffects();
  initSmoothScroll();
});

function initRippleEffect() {
  document.addEventListener('click', function(e) {
    const target = e.target;
    if (target.closest('button, a, [data-ripple]')) {
      const element = target.closest('button, a, [data-ripple]');
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const ripple = document.createElement('span');
      ripple.style.position = 'absolute';
      ripple.style.borderRadius = '50%';
      ripple.style.background = 'rgba(255, 255, 255, 0.4)';
      ripple.style.width = '20px';
      ripple.style.height = '20px';
      ripple.style.left = x + 'px';
      ripple.style.top = y + 'px';
      ripple.style.transform = 'translate(-50%, -50%) scale(0)';
      ripple.style.transition = 'all 0.4s ease-out';
      ripple.style.pointerEvents = 'none';
      ripple.style.zIndex = '9999';

      element.style.position = 'relative';
      element.style.overflow = 'hidden';
      element.appendChild(ripple);

      requestAnimationFrame(() => {
        ripple.style.transform = 'translate(-50%, -50%) scale(4)';
        ripple.style.opacity = '0';
      });

      setTimeout(() => {
        ripple.remove();
      }, 400);
    }
  });
}

function initHoverEffects() {
  const items = document.querySelectorAll('[data-hover]');
  
  items.forEach(item => {
    item.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
      this.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.12)';
    });

    item.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
      this.style.boxShadow = '';
    });
  });
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

function createWaveform(container, audio) {
  const canvas = document.createElement('canvas');
  canvas.style.width = '100%';
  canvas.style.height = '60px';
  container.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  let animationId;
  
  function resize() {
    canvas.width = container.offsetWidth;
    canvas.height = 60;
  }
  
  resize();
  window.addEventListener('resize', resize);

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 256;
  
  const source = audioContext.createMediaElementSource(audio);
  source.connect(analyser);
  analyser.connect(audioContext.destination);

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    animationId = requestAnimationFrame(draw);
    
    analyser.getByteFrequencyData(dataArray);
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i] / 255 * canvas.height * 0.8;
      
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
      gradient.addColorStop(0, 'rgba(0, 113, 227, 0.1)');
      gradient.addColorStop(1, 'rgba(0, 113, 227, 0.6)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.roundRect(x, canvas.height - barHeight, barWidth - 1, barHeight, 4);
      ctx.fill();
      
      x += barWidth + 1;
    }
  }

  audio.addEventListener('play', function() {
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }
    draw();
  });

  audio.addEventListener('pause', function() {
    cancelAnimationFrame(animationId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  });

  return {
    destroy: function() {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      audioContext.close();
      canvas.remove();
    }
  };
}

function addParticleEffect(element) {
  element.addEventListener('click', function(e) {
    for (let i = 0; i < 8; i++) {
      const particle = document.createElement('span');
      particle.style.position = 'absolute';
      particle.style.width = '8px';
      particle.style.height = '8px';
      particle.style.borderRadius = '50%';
      particle.style.background = getRandomColor();
      particle.style.left = e.offsetX + 'px';
      particle.style.top = e.offsetY + 'px';
      particle.style.transform = 'translate(-50%, -50%)';
      particle.style.pointerEvents = 'none';
      particle.style.zIndex = '100';
      
      const angle = (i / 8) * Math.PI * 2;
      const velocity = 50 + Math.random() * 50;
      const tx = Math.cos(angle) * velocity;
      const ty = Math.sin(angle) * velocity;
      
      particle.animate([
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0)`, opacity: 0 }
      ], {
        duration: 600 + Math.random() * 400,
        easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
        fill: 'forwards'
      });
      
      element.appendChild(particle);
      
      setTimeout(() => particle.remove(), 1000);
    }
  });
}

function getRandomColor() {
  const colors = [
    'rgba(0, 113, 227, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(251, 146, 60, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(139, 92, 246, 0.8)'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

function initGlowEffect(element) {
  element.style.position = 'relative';
  
  const glow = document.createElement('div');
  glow.style.cssText = `
    position: absolute;
    inset: -2px;
    border-radius: inherit;
    background: linear-gradient(135deg, rgba(0, 113, 227, 0.3), rgba(139, 92, 246, 0.3));
    opacity: 0;
    transition: opacity 0.3s ease;
    z-index: -1;
    filter: blur(8px);
  `;
  
  element.appendChild(glow);
  
  element.addEventListener('mouseenter', function() {
    glow.style.opacity = '1';
  });
  
  element.addEventListener('mouseleave', function() {
    glow.style.opacity = '0';
  });
}

function initProgressBarAnimation(progressBar) {
  let isDragging = false;
  
  progressBar.addEventListener('mousedown', function() {
    isDragging = true;
    progressBar.style.cursor = 'grabbing';
  });
  
  document.addEventListener('mouseup', function() {
    isDragging = false;
    progressBar.style.cursor = 'grab';
  });
  
  progressBar.addEventListener('mousemove', function() {
    if (isDragging) {
      progressBar.style.transition = 'none';
    } else {
      progressBar.style.transition = 'width 0.1s linear';
    }
  });
}

export {
  initRippleEffect,
  initHoverEffects,
  initSmoothScroll,
  createWaveform,
  addParticleEffect,
  initGlowEffect,
  initProgressBarAnimation
};
