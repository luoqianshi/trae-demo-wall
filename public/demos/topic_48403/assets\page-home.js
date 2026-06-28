/* page-home.js · 智能家电引导 */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  var currentStep = 3;

  var deviceMap = {
    microwave: { name: '美的微波炉 EG7XCGW3-NSH', icon: '🍲' },
    washer: { name: '海尔滚筒洗衣机 EG10014LS39SU1', icon: '🧺' },
    ac: { name: '美的空调 KFR-35GW/BP3DN8Y-PH200(1)', icon: '❄' },
    robotic: { name: '石头扫地机器人 S7 MaxV', icon: '🤖' },
    tvbox: { name: '小米电视盒子 4S Max', icon: '📺' }
  };

  window.pickDevice = function (kind) {
    var d = deviceMap[kind];
    if (!d) return;
    $('deviceStage').querySelector('.device-illu').textContent = d.icon;
    $('deviceName').textContent = d.name;
    $('scanFrame').style.display = '';
    if (window.toast) window.toast('AI 正在识别...');
    setTimeout(function () {
      $('scanFrame').style.display = 'none';
      $('identifyCard').style.display = '';
      if (window.toast) window.toast('识别成功');
    }, 1500);
  };

  window.startGuide = function () {
    $('guideCard').style.display = '';
    $('identifyCard').style.display = 'none';
    currentStep = 1;
    updateStep();
    setTimeout(function () { $('familyAlert').style.display = ''; }, 6000);
  };

  window.nextStep = function () {
    if (currentStep < 6) {
      currentStep++;
      updateStep();
    }
  };

  window.prevStep = function () {
    if (currentStep > 1) {
      currentStep--;
      updateStep();
    }
  };

  function updateStep() {
    var titles = ['把剩饭放进微波炉专用碗', '关上微波炉门', '按"时间"按钮', '按数字键 "2" "0"', '按"开始"键', '等"叮"一声就热好啦'];
    var descs = ['⚠️ 别用金属碗 / 保鲜膜要戳洞', '听到"咔哒"一声就是关紧了', '📍 微波炉右下角、写着"时间"两个字的按钮', '按一下数字会出现在屏幕上', '绿灯亮起就开始转了', '开门小心烫'];
    var card = $('guideCard');
    card.querySelector('p').textContent = '第 ' + currentStep + ' 步 / 共 6 步';
    card.querySelector('h3').textContent = titles[currentStep - 1];
    card.querySelector('p + p').innerHTML = descs[currentStep - 1];
  }

  // 拍照按钮
  document.addEventListener('DOMContentLoaded', function () {
    var btn = $('btnShoot');
    if (!btn) return;
    btn.addEventListener('click', function () {
      $('scanFrame').style.display = '';
      if (window.toast) window.toast('📷 模拟拍摄中...');
      setTimeout(function () {
        pickDevice('microwave');
      }, 1500);
    });
  });
})();
