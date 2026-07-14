// 志愿者端逻辑
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    JLCommon.renderBottomNav(2);
  });

  window.toggleOnline = function() {
    const sw = document.getElementById('online-switch');
    sw.classList.toggle('on');
  };

  window.acceptTask = function() {
    document.getElementById('emergency-alert').style.display = 'none';
    document.getElementById('task-detail').classList.remove('hidden');
  };

  window.rejectTask = function() {
    document.getElementById('emergency-alert').style.display = 'none';
    JLCommon.alert('您已拒绝本次救援，系统将转派给其他志愿者。', '提示');
  };

  window.startNavigation = function() {
    JLCommon.alert('正在打开导航...\n目标：朝阳公园南门东侧 50 米\n预计 3 分钟到达', '导航');
  };
})();
