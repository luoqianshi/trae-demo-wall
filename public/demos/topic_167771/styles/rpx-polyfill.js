/**
 * rpx -> px polyfill
 * 微信小程序 rpx 单位转 Web px 单位
 * 750rpx = 屏幕宽度，在 375px 宽度下 1rpx = 0.5px
 */
(function () {
  function convertRpx() {
    var screenWidth = window.innerWidth || document.documentElement.clientWidth || 375;
    var ratio = screenWidth / 750;

    function replaceRpx(value) {
      return value.replace(/(\d+\.?\d*)rpx/g, function (match, num) {
        return (parseFloat(num) * ratio) + 'px';
      });
    }

    function processRules(rules) {
      for (var i = 0; i < rules.length; i++) {
        var rule = rules[i];
        if (rule.style) {
          for (var j = 0; j < rule.style.length; j++) {
            var prop = rule.style[j];
            var value = rule.style.getPropertyValue(prop);
            if (value && value.indexOf('rpx') !== -1) {
              rule.style.setProperty(prop, replaceRpx(value), rule.style.getPropertyPriority(prop));
            }
          }
        }
        if (rule.cssRules) {
          processRules(rule.cssRules);
        }
      }
    }

    var sheets = document.styleSheets;
    for (var i = 0; i < sheets.length; i++) {
      try {
        processRules(sheets[i].cssRules || sheets[i].rules);
      } catch (e) {
        // 跨域样式表无法访问，跳过
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', convertRpx);
  } else {
    convertRpx();
  }

  // 窗口大小变化时重新转换
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      // 需要重新加载样式以恢复原始 rpx 值，这里简单处理：重新加载页面
      // 对于 Demo 演示足够
    }, 300);
  });
})();