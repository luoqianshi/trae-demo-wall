    function initProfile() {
      // Load from localStorage (set by onboarding)
      var stageName = localStorage.getItem('qingya_stage_name') || '促排';
      var stageDay = localStorage.getItem('qingya_stage_day') || '5';
      var joinDate = localStorage.getItem('qingya_join_date') || '06月17日';
      var seedName = localStorage.getItem('qingya_seed_name') || '小芽';
      var isGuest = localStorage.getItem('qingya_guest') === 'true';

      document.getElementById('user-meta').textContent = joinDate + '加入' + (isGuest ? ' · 访客' : '');
      document.getElementById('profile-stage-tag').textContent = stageName + ' · 第' + stageDay + '天';
      document.getElementById('profile-day-count').textContent = stageDay;
      document.getElementById('profile-record-count').textContent = todayData.records.length;
      document.getElementById('profile-hug-count').textContent = todayData.streakDays;

      // Update global data
      app.globalData.currentStage = stageName;
      app.globalData.stageDay = parseInt(stageDay);
    }
