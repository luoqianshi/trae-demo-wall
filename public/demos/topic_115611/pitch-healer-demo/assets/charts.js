(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim() || '#E85D3A';
  var accent2 = style.getPropertyValue('--accent2').trim() || '#2A9D8F';
  var ink = style.getPropertyValue('--ink').trim() || '#1A1A1A';
  var muted = style.getPropertyValue('--muted').trim() || '#6B6B6B';
  var rule = style.getPropertyValue('--rule').trim() || '#D4D4D0';
  var bg2 = style.getPropertyValue('--bg2').trim() || '#F0EFEB';

  // Colors for dark theme fallback
  var targetColor = '#6B7280';
  var userColor = '#E85D3A';
  var accurateColor = '#2A9D8F';
  var deviateColor = '#E9C46A';
  var badColor = '#D64045';

  window.PitchHealerCharts = {
    // Report page: pitch comparison chart
    initReportChart: function() {
      var el = document.getElementById('chart-report-pitch');
      if (!el) return;
      var chart = echarts.init(el, null, { renderer: 'svg' });

      var timeLabels = [];
      var targetData = [];
      var userData = [];
      var userColors = [];

      for (var i = 0; i <= 60; i++) {
        timeLabels.push(i);
        var t = i / 60;
        var targetPitch = 60 + Math.sin(t * Math.PI * 4) * 15 + Math.sin(t * Math.PI * 8) * 5;
        targetData.push(targetPitch.toFixed(1));

        var deviation = 0;
        if (i > 10 && i < 20) deviation = -8 + Math.random() * 4;
        else if (i > 30 && i < 40) deviation = 6 + Math.random() * 5;
        else if (i > 45 && i < 52) deviation = -5 + Math.random() * 3;
        else deviation = (Math.random() - 0.5) * 3;

        var userPitch = targetPitch + deviation;
        userData.push(userPitch.toFixed(1));

        var diff = Math.abs(deviation);
        if (diff < 2) userColors.push(accurateColor);
        else if (diff < 5) userColors.push(deviateColor);
        else userColors.push(badColor);
      }

      var option = {
        animation: true,
        animationDuration: 1500,
        grid: { top: 20, right: 15, bottom: 30, left: 40 },
        xAxis: {
          type: 'category',
          data: timeLabels,
          axisLine: { lineStyle: { color: '#334155' } },
          axisLabel: { color: '#94A3B8', fontSize: 10, interval: 9 },
          axisTick: { show: false }
        },
        yAxis: {
          type: 'value',
          min: 30,
          max: 90,
          axisLine: { show: false },
          splitLine: { lineStyle: { color: '#1E293B' } },
          axisLabel: { color: '#94A3B8', fontSize: 10, formatter: function(v) { return 'MIDI ' + v; } }
        },
        tooltip: {
          trigger: 'axis',
          backgroundColor: '#1E293B',
          borderColor: '#334155',
          textStyle: { color: '#F1F5F9' },
          formatter: function(params) {
            var t = params[0].axisValue;
            var target = params[0].value;
            var user = params[1].value;
            var diff = (user - target).toFixed(1);
            var color = diff > 0 ? '#D64045' : '#2A9D8F';
            return '时间: ' + t + 's<br/>标准音高: ' + target + '<br/>你的音高: ' + user + '<br/>偏差: <span style="color:' + color + '">' + (diff > 0 ? '+' : '') + diff + ' cents</span>';
          }
        },
        series: [
          {
            name: '标准音高',
            type: 'line',
            data: targetData,
            smooth: true,
            symbol: 'none',
            lineStyle: { color: targetColor, width: 2, type: 'dashed' },
            areaStyle: { color: 'rgba(107,114,128,0.05)' }
          },
          {
            name: '你的音高',
            type: 'line',
            data: userData,
            smooth: true,
            symbol: 'none',
            lineStyle: { color: userColor, width: 3 },
            itemStyle: { color: userColor }
          }
        ],
        legend: {
          data: ['标准音高', '你的音高'],
          bottom: 0,
          textStyle: { color: '#94A3B8', fontSize: 11 },
          itemWidth: 20,
          itemHeight: 10
        }
      };

      chart.setOption(option);
      window.addEventListener('resize', function() { chart.resize(); });
      return chart;
    },

    // Sing page: real-time pitch visualization
    initSingChart: function() {
      var el = document.getElementById('chart-sing-pitch');
      if (!el) return;
      var chart = echarts.init(el, null, { renderer: 'svg' });

      var timeLabels = [];
      var targetData = [];
      var userData = [];

      for (var i = 0; i <= 50; i++) {
        timeLabels.push(i);
        var t = i / 50;
        var targetPitch = 55 + Math.sin(t * Math.PI * 3) * 12 + Math.sin(t * Math.PI * 6) * 4;
        targetData.push(targetPitch.toFixed(1));

        if (i < 5) {
          userData.push(null);
        } else {
          var delay = 3;
          var refIdx = Math.max(0, i - delay);
          var refPitch = parseFloat(targetData[refIdx]);
          var deviation = (Math.random() - 0.5) * 4;
          if (i > 18 && i < 28) deviation = -6 + Math.random() * 3;
          else if (i > 35 && i < 42) deviation = 5 + Math.random() * 3;
          userData.push((refPitch + deviation).toFixed(1));
        }
      }

      var option = {
        animation: false,
        grid: { top: 15, right: 10, bottom: 20, left: 35 },
        xAxis: {
          type: 'category',
          data: timeLabels,
          axisLine: { lineStyle: { color: '#334155' } },
          axisLabel: { show: false },
          axisTick: { show: false }
        },
        yAxis: {
          type: 'value',
          min: 35,
          max: 80,
          axisLine: { show: false },
          splitLine: { lineStyle: { color: '#1E293B' } },
          axisLabel: { color: '#64748B', fontSize: 9 }
        },
        series: [
          {
            name: '标准音高',
            type: 'line',
            data: targetData,
            smooth: true,
            symbol: 'none',
            lineStyle: { color: '#64748B', width: 2, type: 'dashed' }
          },
          {
            name: '你的音高',
            type: 'line',
            data: userData,
            smooth: true,
            symbol: 'none',
            lineStyle: { color: '#E85D3A', width: 3 }
          }
        ]
      };

      chart.setOption(option);
      window.addEventListener('resize', function() { chart.resize(); });
      return chart;
    },

    // Progress chart for report page
    initProgressChart: function() {
      var el = document.getElementById('chart-progress');
      if (!el) return;
      var chart = echarts.init(el, null, { renderer: 'svg' });

      var option = {
        animation: true,
        animationDuration: 1200,
        series: [{
          type: 'gauge',
          startAngle: 200,
          endAngle: -20,
          min: 0,
          max: 100,
          splitNumber: 10,
          radius: '95%',
          center: ['50%', '55%'],
          itemStyle: { color: '#E85D3A' },
          progress: { show: true, width: 12, roundCap: true },
          pointer: { show: false },
          axisLine: { lineStyle: { width: 12, color: [[1, '#1E293B']] } },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: { show: false },
          anchor: { show: false },
          title: { show: false },
          detail: {
            valueAnimation: true,
            fontSize: 36,
            fontWeight: 'bold',
            color: '#F1F5F9',
            offsetCenter: [0, '5%'],
            formatter: '{value}'
          },
          data: [{ value: 72 }]
        }]
      };

      chart.setOption(option);
      window.addEventListener('resize', function() { chart.resize(); });
      return chart;
    }
  };
})();
