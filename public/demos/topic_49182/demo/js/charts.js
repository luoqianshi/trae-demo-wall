const Charts = {
  radar(elementId, data, options = {}) {
    if (!window.echarts) {
      console.warn('ECharts not loaded');
      return null;
    }

    const chart = echarts.init(document.getElementById(elementId));

    const defaultData = {
      quality: 80,
      delivery: 80,
      communication: 80,
      cooperation: 80,
      certification: 80
    };

    const mergedData = { ...defaultData, ...data };

    const option = {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(24, 24, 27, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: {
          color: '#fafafa'
        }
      },
      radar: {
        indicator: [
          { name: '质量', max: 100 },
          { name: '时效', max: 100 },
          { name: '沟通', max: 100 },
          { name: '合作', max: 100 },
          { name: '资质', max: 100 }
        ],
        center: ['50%', '50%'],
        radius: '65%',
        splitNumber: 5,
        shape: 'polygon',
        axisName: {
          color: '#a1a1aa',
          fontSize: 12,
          fontFamily: 'Plus Jakarta Sans'
        },
        splitArea: {
          areaStyle: {
            color: ['rgba(255, 255, 255, 0.02)', 'rgba(255, 255, 255, 0.05)'],
            opacity: 1
          }
        },
        axisLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        },
        splitLine: {
          lineStyle: {
            color: 'rgba(255, 255, 255, 0.1)'
          }
        }
      },
      series: [{
        name: '能力画像',
        type: 'radar',
        emphasis: {
          lineStyle: {
            width: 3
          }
        },
        data: [{
          value: [
            mergedData.quality,
            mergedData.delivery,
            mergedData.communication,
            mergedData.cooperation,
            mergedData.certification
          ],
          name: '能力画像',
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 2,
            color: '#06b6d4'
          },
          areaStyle: {
            color: 'rgba(6, 182, 212, 0.2)',
            opacity: 0.8
          },
          itemStyle: {
            color: '#06b6d4'
          }
        }]
      }]
    };

    chart.setOption(option);

    window.addEventListener('resize', () => {
      chart.resize();
    });

    return chart;
  },

  ringProgress(elementId, percent, options = {}) {
    if (!window.echarts) {
      console.warn('ECharts not loaded');
      return null;
    }

    const chart = echarts.init(document.getElementById(elementId));
    const size = options.size || 120;
    const strokeWidth = options.strokeWidth || 10;
    const color = options.color || '#06b6d4';
    const bgColor = options.bgColor || 'rgba(255, 255, 255, 0.1)';

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: `{b}: {c}%`
      },
      series: [{
        name: '完成度',
        type: 'pie',
        radius: ['65%', '85%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 0,
          borderColor: 'transparent',
          borderWidth: 0
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: false
          }
        },
        labelLine: {
          show: false
        },
        data: [
          {
            value: percent,
            name: '完成度',
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: color },
                { offset: 1, color: '#22d3ee' }
              ])
            }
          },
          {
            value: 100 - percent,
            name: '剩余',
            itemStyle: {
              color: bgColor
            }
          }
        ],
        animationType: 'scale',
        animationEasing: 'elasticOut',
        animationDelay: () => Math.random() * 200
      }]
    };

    chart.setOption(option);

    window.addEventListener('resize', () => {
      chart.resize();
    });

    return chart;
  },

  horizontalBar(elementId, data, options = {}) {
    if (!window.echarts) {
      console.warn('ECharts not loaded');
      return null;
    }

    const chart = echarts.init(document.getElementById(elementId));

    const categories = data.map(item => item.name);
    const values = data.map(item => item.value);
    const colors = data.map(item => item.color || '#0EA5E9');

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        },
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        borderColor: '#E2E8F0',
        textStyle: {
          color: '#FFFFFF'
        },
        formatter: (params) => {
          const item = params[0];
          return `${item.name}<br/>评分: <strong>${item.value}</strong>`;
        }
      },
      grid: {
        left: '80',
        right: '20',
        top: '10',
        bottom: '10',
        containLabel: false
      },
      xAxis: {
        type: 'value',
        max: 100,
        show: false,
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false
        }
      },
      yAxis: {
        type: 'category',
        data: categories,
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: '#475569',
          fontSize: 13,
          fontFamily: 'Plus Jakarta Sans',
          fontWeight: 500
        },
        inverse: true
      },
      series: [{
        type: 'bar',
        data: values.map((value, index) => ({
          value: value,
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: colors[index] },
              { offset: 1, color: colors[index] + '80' }
            ]),
            borderRadius: [0, 6, 6, 0]
          }
        })),
        barWidth: '60%',
        animationDuration: 800,
        animationEasing: 'easeOutQuart'
      }]
    };

    chart.setOption(option);

    window.addEventListener('resize', () => {
      chart.resize();
    });

    return chart;
  },

  simpleRing(elementId, percent, options = {}) {
    const canvas = document.getElementById(elementId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const center = size / 2;
    const radius = (size - (options.strokeWidth || 8)) / 2;
    const strokeWidth = options.strokeWidth || 8;
    const color = options.color || '#7C3AED';
    const bgColor = options.bgColor || '#E2E8F0';

    ctx.clearRect(0, 0, size, size);

    ctx.beginPath();
    ctx.arc(center, center, radius, 0, Math.PI * 2);
    ctx.strokeStyle = bgColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (Math.PI * 2 * (percent / 100));

    ctx.beginPath();
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.strokeStyle = color;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
  },

  animateRing(elementId, targetPercent, duration = 1000, options = {}) {
    const canvas = document.getElementById(elementId);
    if (!canvas) return;

    const startTime = performance.now();
    const startPercent = 0;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentPercent = startPercent + (targetPercent - startPercent) * easeOut;

      this.simpleRing(elementId, currentPercent, options);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  },

  createSparkline(elementId, data, options = {}) {
    if (!window.echarts) {
      console.warn('ECharts not loaded');
      return null;
    }

    const chart = echarts.init(document.getElementById(elementId));

    const option = {
      grid: {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        containLabel: true
      },
      xAxis: {
        show: false,
        type: 'category',
        data: data.map((_, i) => i)
      },
      yAxis: {
        show: false,
        type: 'value'
      },
      tooltip: {
        show: true,
        formatter: (params) => `评分: ${params.value}`
      },
      series: [{
        type: 'line',
        data: data,
        smooth: true,
        symbol: 'none',
        lineStyle: {
          width: 2,
          color: options.color || '#0EA5E9'
        },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: (options.color || '#0EA5E9') + '40' },
            { offset: 1, color: (options.color || '#0EA5E9') + '00' }
          ])
        }
      }]
    };

    chart.setOption(option);

    return chart;
  },

  destroy(elementId) {
    if (window.echarts) {
      const chart = echarts.getInstanceByDom(document.getElementById(elementId));
      if (chart) {
        chart.dispose();
      }
    }
  }
};

if (typeof module !== 'undefined') {
  module.exports = Charts;
}
