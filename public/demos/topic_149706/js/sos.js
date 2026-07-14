// 求救流程逻辑
(function() {
  let selectedSymptom = null;
  let rescueTimer = null;
  let rescueSeconds = 0;

  function init() {
    renderSymptoms();
  }

  function renderSymptoms() {
    const grid = document.getElementById('symptom-grid');
    grid.innerHTML = JLData.symptoms.map(s => `
      <div class="symptom-card" data-id="${s.id}" onclick="window.selectSymptom('${s.id}')">
        <div class="symptom-icon">${s.icon}</div>
        <h3>${s.name}</h3>
        <p>${s.desc}</p>
      </div>
    `).join('');
  }

  window.selectSymptom = function(id) {
    selectedSymptom = id;
    document.querySelectorAll('.symptom-card').forEach(c => c.classList.remove('selected'));
    document.querySelector('.symptom-card[data-id="' + id + '"]').classList.add('selected');
    document.getElementById('confirm-symptom').disabled = false;
  };

  window.startRescue = function() {
    if (!selectedSymptom) return;
    JLCommon.setSymptom(selectedSymptom);
    showStep('loading');

    const logs = [
      { id: 'log-2', text: '推送附近持证志愿者', delay: 800 },
      { id: 'log-3', text: '触发 AED 设备调度', delay: 1800 },
      { id: 'log-4', text: '同步 120 急救中心', delay: 2800 }
    ];

    document.getElementById('loading-status').textContent = '正在获取您的位置...';

    logs.forEach(log => {
      setTimeout(() => {
        const el = document.getElementById(log.id);
        el.classList.remove('pending');
        el.classList.add('done');
        document.getElementById('loading-status').textContent = log.text + '完成';
      }, log.delay);
    });

    setTimeout(() => {
      showStep('rescue');
      startRescueTimer();
      updateGuidance();
    }, 3800);
  };

  function showStep(step) {
    document.querySelectorAll('.screen-section').forEach(s => s.classList.remove('active'));
    document.getElementById('step-' + step).classList.add('active');
  }

  function startRescueTimer() {
    rescueSeconds = 0;
    updateTimer();
    rescueTimer = setInterval(() => {
      rescueSeconds++;
      updateTimer();
      if (rescueSeconds === 15) {
        document.getElementById('rescue-status-text').textContent = '志愿者已到达附近，正在寻找患者';
      } else if (rescueSeconds === 35) {
        document.getElementById('rescue-status-text').textContent = '志愿者已到达现场，开始施救';
      }
    }, 1000);
  }

  function updateTimer() {
    document.getElementById('rescue-timer').textContent = JLCommon.formatTime(rescueSeconds);
  }

  function updateGuidance() {
    const symptom = JLData.symptoms.find(s => s.id === selectedSymptom) || JLData.symptoms[5];
    const list = document.getElementById('rescue-guidance');
    list.innerHTML = symptom.guidance.map((text, i) => 
      '<li data-num="' + (i + 1) + '">' + text + '</li>'
    ).join('');
  }

  window.callVolunteer = function() {
    JLCommon.alert('正在通过虚拟号联系志愿者李医生...\n（演示模式，不会真实拨号）', '联系志愿者');
  };

  window.call120 = function() {
    JLCommon.alert('即将为您拨打 120 急救电话\n（演示模式，不会真实拨号）', '拨打 120');
  };

  init();
})();
