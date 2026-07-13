const SOS = {
  steps: [
    {
      delay: 100, action: function () {
        const daughter = document.getElementById('contact-daughter');
        daughter.classList.add('active');
      }
    },
    {
      delay: 2000, action: function () {
        const daughter = document.getElementById('contact-daughter');
        daughter.classList.add('completed');
        daughter.querySelector('.contact-status').textContent = '已接听';
      }
    },
    {
      delay: 2000, action: function () {
        const community = document.getElementById('contact-community');
        community.classList.add('active');
      }
    },
    {
      delay: 1500, action: function () {
        const community = document.getElementById('contact-community');
        community.classList.add('completed');
        community.querySelector('.contact-status').textContent = '已通知';
      }
    },
    {
      delay: 1500, action: function () {
        const ambulance = document.getElementById('contact-120');
        ambulance.classList.add('active');
        ambulance.querySelector('.contact-status').textContent = '已通知，待命中';
      }
    },
    {
      delay: 800, action: function () {
        document.getElementById('sosFinal').style.display = 'block';
        SOS.updateETA();
      }
    }
  ],

  startSOS() {
    UI.navigateTo('page-sos');

    const sosPage = document.getElementById('sosContent');
    sosPage.classList.add('vibrate');

    setTimeout(() => {
      sosPage.classList.remove('vibrate');
    }, 2000);

    this.executeSteps();
  },

  executeSteps() {
    let cumulativeDelay = 0;
    this.steps.forEach((step, index) => {
      cumulativeDelay += step.delay;
      setTimeout(() => {
        step.action();
      }, cumulativeDelay);
    });
  },

  updateETA() {
    const etaContainer = document.createElement('div');
    etaContainer.className = 'sos-eta';
    etaContainer.innerHTML = `
      <div class="eta-title">⏱️ 预计到达时间</div>
      <div class="eta-content">
        <div class="eta-item">
          <span class="eta-icon">👩</span>
          <span class="eta-text">女儿 约 8 分钟</span>
        </div>
        <div class="eta-item">
          <span class="eta-icon">🏠</span>
          <span class="eta-text">社区人员 约 15 分钟</span>
        </div>
        <div class="eta-item">
          <span class="eta-icon">🚑</span>
          <span class="eta-text">120 救护车 约 5 分钟</span>
        </div>
      </div>
    `;

    const sosFinal = document.getElementById('sosFinal');
    sosFinal.appendChild(etaContainer);

    setTimeout(() => {
      etaContainer.classList.add('show');
    }, 100);
  }
};