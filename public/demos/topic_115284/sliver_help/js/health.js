const Health = {
  chartInstance: null,

  saveHealthData() {
    const systolic = parseInt(document.getElementById('blood-pressure-sys').value);
    const diastolic = parseInt(document.getElementById('blood-pressure-dia').value);
    const sugar = parseFloat(document.getElementById('blood-sugar').value);
    const heartRate = parseInt(document.getElementById('heart-rate').value);

    if (isNaN(systolic) || isNaN(diastolic) || isNaN(sugar) || isNaN(heartRate)) {
      UI.showToast('请填写完整的健康数据');
      return;
    }

    Data.incrementHealthStreak();

    UI.showToast('今天的健康数据已记录');

    setTimeout(() => {
      this.generateHealthReport(systolic, diastolic, sugar, heartRate);
      this.updateHealthScore(systolic, diastolic, sugar, heartRate);
      this.generateChart();
    }, 1000);
  },

  generateChart() {
    const ctx = document.getElementById('healthChart').getContext('2d');

    if (this.chartInstance) {
      this.chartInstance.destroy();
    }

    const labels = Data.healthRecords.map(r => r.date);
    const systolicData = Data.healthRecords.map(r => r.systolic);
    const sugarData = Data.healthRecords.map(r => r.sugar);
    const heartRateData = Data.healthRecords.map(r => r.heartRate);

    this.chartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: '血压(收缩压)',
            data: systolicData,
            borderColor: '#E74C3C',
            backgroundColor: 'rgba(231, 76, 60, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: '血糖',
            data: sugarData,
            borderColor: '#F39C12',
            backgroundColor: 'rgba(243, 156, 18, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: '心率',
            data: heartRateData,
            borderColor: '#3498DB',
            backgroundColor: 'rgba(52, 152, 219, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              font: { size: 14 },
              padding: 20
            }
          }
        },
        scales: {
          y: {
            beginAtZero: false,
            grid: { color: '#eee' }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  },

  generateHealthReport(systolic, diastolic, sugar, heartRate) {
    const report = Data.getHealthAdvice(systolic, diastolic, sugar, heartRate);
    document.getElementById('healthReport').textContent = report;
  },

  updateHealthScore(systolic, diastolic, sugar, heartRate) {
    const score = Data.getHealthScore(systolic, diastolic, sugar, heartRate);
    const status = Data.getHealthStatus(score);

    const scoreCard = document.createElement('div');
    scoreCard.className = 'health-score-card';
    scoreCard.innerHTML = `
      <div class="score-header">
        <span class="score-icon">🏥</span>
        <span class="score-title">今日健康评分</span>
      </div>
      <div class="score-content">
        <div class="score-circle" style="background: conic-gradient(${status.color} ${score * 3.6}deg, #eee ${score * 3.6}deg)">
          <span class="score-value">${score}</span>
        </div>
        <div class="score-status" style="color: ${status.color}; background: ${status.bg}">${status.text}</div>
      </div>
      <div class="score-message" style="color: ${status.color}">${status.message}</div>
    `;

    const scoreSection = document.getElementById('scoreSection');
    scoreSection.innerHTML = '';
    scoreSection.appendChild(scoreCard);

    setTimeout(() => {
      scoreCard.classList.add('show');
    }, 100);
  }
};