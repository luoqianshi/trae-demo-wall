/* page-community.js · 社区帮忙 · 语音下单 */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  var presetOrders = {
    '买菜': ['鸡蛋 2 斤', '嫩豆腐 1 块', '小油菜 1 把'],
    '买药': ['氨氯地平 1 盒（处方药）', '钙片 1 瓶'],
    '电费': ['查询电费余额', '代缴 200 元电费'],
    '挂号': ['天津医大总医院 · 心内科 · 张主任', '下周三上午'],
    '跑腿': ['厨房水龙头滴水维修', '需要换垫圈'],
    '陪诊': ['陪同就医（周三 9:00）', '需要轮椅 · 全程陪护'],
    '临时看护': ['子女出差 3 天', '每天上门陪伴 1 小时 + 做饭 + 提醒吃药'],
    '儿童陪护': ['明天 16:00 接团团放学', '辅导作业 1 小时 ·帮热晚饭'],
    '外卖': ['蜜雪冰城 · 草莓圣代 + 珍珠奶茶（少糖）', '送达：天津市河西区友谊路 28 号 3 栋 502', '备注：老人专属·少糖·无需餐具']
  };

  window.simulateOrder = function (kind) {
    var items = presetOrders[kind] || ['根据您的语音整理的需求'];
    $('orderPanel').style.display = '';
    $('donePanel').style.display = 'none';
    var list = $('orderList');
    list.innerHTML = '';
    for (var i = 0; i < items.length; i++) {
      var li = document.createElement('li');
      li.textContent = items[i];
      list.appendChild(li);
    }
    if (window.toast) window.toast('AI 已整理：' + kind + '订单');
  };

  window.confirmOrder = function () {
    $('orderPanel').style.display = 'none';
    $('donePanel').style.display = '';
    if (window.toast) window.toast('订单已确认 · 网格员正在接单');
  };

  window.cancelOrder = function () {
    if (window.toast) window.toast('可以重新说一次您的需求');
  };

  // 语音按钮交互
  document.addEventListener('DOMContentLoaded', function () {
    // 检查是否从智能家居跳转过来
    try {
      var smOrder = JSON.parse(localStorage.getItem('hml_sm_order') || 'null');
      if (smOrder && smOrder.kind === '奶茶' && (Date.now() - smOrder.ts < 60000)) {
        setTimeout(function () { simulateOrder('外卖'); }, 600);
        localStorage.removeItem('hml_sm_order');
      }
    } catch (e) {}
    var btn = $('voiceBtn');
    if (!btn) return;
    var t = null;
    function startRec() {
      btn.classList.add('recording');
      if (window.toast) window.toast('🎤 正在听...');
      clearTimeout(t);
      t = setTimeout(function () {
        btn.classList.remove('recording');
        if (window.toast) window.toast('识别完成');
        simulateOrder('买菜');
      }, 2200);
    }
    function endRec() {
      btn.classList.remove('recording');
      clearTimeout(t);
    }
    btn.addEventListener('mousedown', startRec);
    btn.addEventListener('touchstart', startRec, { passive: true });
    btn.addEventListener('mouseup', endRec);
    btn.addEventListener('mouseleave', endRec);
    btn.addEventListener('touchend', endRec);
  });
})();
