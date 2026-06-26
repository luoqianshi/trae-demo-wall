/**
 * 知行合一盈亏记录系统 - 风控提醒模块
 */
var RiskControl = (function() {
  'use strict';

  function render(container) {
    var settings = Store.getSettings();
    var riskStatus = Store.getRiskStatus();
    var alerts = Store.checkRiskAlerts();

    container.innerHTML =
      '<div class="page-header"><h2>风控提醒</h2></div>' +
      '<div id="risk-alerts"></div>' +
      '<div class="card" style="margin-bottom:1.5rem">' +
      '<div class="card-header"><h3>当前风控状态</h3></div>' +
      '<div id="risk-status"></div>' +
      '</div>' +
      '<div class="card">' +
      '<div class="card-header"><h3>风控设置</h3></div>' +
      '<div class="trade-form" id="risk-form"></div>' +
      '</div>';

    // Alerts
    var alertsEl = container.querySelector('#risk-alerts');
    if (alerts.length > 0) {
      alertsEl.innerHTML = alerts.map(function(a) {
        return '<div class="risk-alert-bar ' + a.level + '" style="position:static;display:block;margin-bottom:0.75rem;border-radius:8px">⚠️ ' + a.message + '</div>';
      }).join('');
    } else {
      alertsEl.innerHTML = '<div class="insight-card"><h4>✅ 风控安全</h4><p>当前亏损在安全范围内，请继续保持理性交易。</p></div>';
    }

    // Status bars
    var statusEl = container.querySelector('#risk-status');
    var statusHtml = '';
    ['daily', 'weekly', 'monthly'].forEach(function(type) {
      var s = riskStatus[type];
      var label = type === 'daily' ? '日' : type === 'weekly' ? '周' : '月';
      if (s) {
        var pct = Math.round(s.ratio * 100);
        var level = pct >= 100 ? 'danger' : pct >= (settings.riskControl.alertThreshold || 80) ? 'warning' : 'safe';
        statusHtml +=
          '<div style="margin-bottom:1.25rem">' +
          '<div style="display:flex;justify-content:space-between;margin-bottom:0.5rem">' +
          '<span style="font-size:0.9rem;color:var(--ink)">' + label + '亏损</span>' +
          '<span style="font-family:var(--font-mono);font-size:0.85rem" class="' + (s.current < 0 ? 'loss' : 'profit') + '">' + Utils.formatMoney(s.current, true) + ' / ' + Utils.formatMoney(s.limit) + '</span>' +
          '</div>' +
          '<div style="height:8px;background:var(--bg4);border-radius:4px;overflow:hidden">' +
          '<div style="height:100%;width:' + Math.min(pct, 100) + '%;background:' + (level === 'safe' ? 'var(--accent)' : level === 'warning' ? 'var(--gold)' : 'var(--accent2)') + ';border-radius:4px;transition:width 0.5s"></div>' +
          '</div>' +
          '<div style="text-align:right;font-size:0.75rem;color:var(--muted);margin-top:0.25rem">' + pct + '%</div>' +
          '</div>';
      }
    });
    if (!statusHtml) {
      statusHtml = '<p class="text-muted" style="text-align:center;padding:1rem">未设置亏损上限</p>';
    }
    statusEl.innerHTML = statusHtml;

    // Settings form
    var formEl = container.querySelector('#risk-form');
    formEl.innerHTML =
      '<div class="form-group"><div class="form-row">' +
      '<div><label>日亏损上限 (¥)</label><input type="number" id="daily-limit" class="form-input" value="' + (settings.riskControl.dailyLossLimit || 0) + '" min="0" step="500"></div>' +
      '<div><label>周亏损上限 (¥)</label><input type="number" id="weekly-limit" class="form-input" value="' + (settings.riskControl.weeklyLossLimit || 0) + '" min="0" step="1000"></div>' +
      '</div></div>' +
      '<div class="form-group"><div class="form-row">' +
      '<div><label>月亏损上限 (¥)</label><input type="number" id="monthly-limit" class="form-input" value="' + (settings.riskControl.monthlyLossLimit || 0) + '" min="0" step="5000"></div>' +
      '<div><label>预警阈值 (%)</label><input type="number" id="alert-threshold" class="form-input" value="' + (settings.riskControl.alertThreshold || 80) + '" min="50" max="100" step="5"></div>' +
      '</div></div>' +
      '<p class="text-muted" style="font-size:0.8rem;margin-bottom:1rem">💡 设置为0表示不启用该级别的风控提醒</p>' +
      '<div class="form-actions"><button class="btn btn-primary" id="save-risk-btn">保存设置</button></div>';

    formEl.querySelector('#save-risk-btn').addEventListener('click', function() {
      var newSettings = {
        riskControl: {
          dailyLossLimit: parseInt(formEl.querySelector('#daily-limit').value) || 0,
          weeklyLossLimit: parseInt(formEl.querySelector('#weekly-limit').value) || 0,
          monthlyLossLimit: parseInt(formEl.querySelector('#monthly-limit').value) || 0,
          alertThreshold: parseInt(formEl.querySelector('#alert-threshold').value) || 80
        }
      };
      Store.updateSettings(newSettings);
      App.showToast('风控设置已保存', 'success');
      render(container); // Re-render
    });
  }

  return { render: render };
})();
