/**
 * 健康档案分析页面 - analysis.js
 * 功能：体检信息录入、AI分析报告、健康方案生成
 */
(function () {
  'use strict';

  var API_BASE = 'http://localhost:3000/api/v1';

  function getToken() {
    return localStorage.getItem('token') || localStorage.getItem('accessToken');
  }

  function apiRequest(url, options) {
    var token = getToken();
    var headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;
    return fetch(url, Object.assign({ headers: headers }, options))
      .then(function (res) { return res.json(); });
  }

  function showToast(msg, type) {
    type = type || 'info';
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();
    var toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.animation = 'toastOut 0.3s ease forwards';
      setTimeout(function () { toast.remove(); }, 300);
    }, 2500);
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  var state = {
    report: null,
    loading: false,
    view: 'input' // 'input' | 'report'
  };

  var referenceRanges = {
    systolic: { label: '收缩压', min: 90, max: 120, unit: 'mmHg', normal: '90-120', warning: '120-139', danger: '>=140' },
    diastolic: { label: '舒张压', min: 60, max: 80, unit: 'mmHg', normal: '60-80', warning: '80-89', danger: '>=90' },
    fastingGlucose: { label: '空腹血糖', min: 3.9, max: 6.1, unit: 'mmol/L', normal: '3.9-6.1', warning: '6.1-7.0', danger: '>=7.0' },
    postprandialGlucose: { label: '餐后血糖', min: 3.9, max: 7.8, unit: 'mmol/L', normal: '<7.8', warning: '7.8-11.1', danger: '>=11.1' },
    hba1c: { label: '糖化血红蛋白', min: 4, max: 6, unit: '%', normal: '4-6', warning: '6.0-6.5', danger: '>=6.5' },
    totalCholesterol: { label: '总胆固醇', min: 0, max: 5.2, unit: 'mmol/L', normal: '<5.2', warning: '5.2-6.2', danger: '>=6.2' },
    triglycerides: { label: '甘油三酯', min: 0, max: 1.7, unit: 'mmol/L', normal: '<1.7', warning: '1.7-2.3', danger: '>=2.3' },
    hdl: { label: 'HDL', min: 1.0, max: 999, unit: 'mmol/L', normal: '>=1.0', warning: '0.8-1.0', danger: '<0.8' },
    ldl: { label: 'LDL', min: 0, max: 3.4, unit: 'mmol/L', normal: '<3.4', warning: '3.4-4.1', danger: '>=4.1' },
    uricAcid: { label: '尿酸', min: 0, max: 420, unit: '\u03BCmol/L', normal: '男<420 女<360', warning: '略高', danger: '显著升高' },
    waist: { label: '腰围', min: 0, max: 85, unit: 'cm', normal: '男<85 女<80', warning: '略超', danger: '显著超标' }
  };

  function injectStyles() {
    if (document.getElementById('analysis-page-style')) return;
    var style = document.createElement('style');
    style.id = 'analysis-page-style';
    style.textContent = '\
.analysis-page { padding-bottom: 80px; }\
.scan-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; margin-bottom: 16px; background: var(--bg-card); border: 1.5px dashed var(--primary); color: var(--primary); border-radius: var(--radius); padding: 14px; font-size: 15px; font-weight: 500; cursor: pointer; transition: all 0.2s; }\
.scan-btn:active { background: rgba(13,148,136,0.05); }\
.metric-card { background: var(--bg-card); border-radius: var(--radius); padding: 16px; margin: 12px 16px; box-shadow: var(--shadow); }\
.metric-card .card-title { font-size: 16px; font-weight: 600; margin-bottom: 14px; display: flex; align-items: center; gap: 6px; }\
.metric-row { display: flex; gap: 12px; margin-bottom: 12px; }\
.metric-row .form-group { flex: 1; margin-bottom: 0; }\
.range-hint { font-size: 11px; color: var(--text-light); margin-top: 4px; }\
.score-ring-wrap { text-align: center; padding: 24px 16px; }\
.score-ring-wrap .score-label { font-size: 14px; color: var(--text-secondary); margin-top: 8px; }\
.indicator-cards { padding: 0 16px; }\
.indicator-card { background: var(--bg-card); border-radius: var(--radius); padding: 16px; margin-bottom: 12px; box-shadow: var(--shadow); display: flex; align-items: center; gap: 14px; }\
.indicator-card .indicator-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }\
.indicator-card .indicator-info { flex: 1; }\
.indicator-card .indicator-name { font-size: 14px; color: var(--text-secondary); margin-bottom: 2px; }\
.indicator-card .indicator-value { font-size: 18px; font-weight: 700; color: var(--text); }\
.indicator-card .indicator-status { font-size: 12px; font-weight: 500; padding: 2px 8px; border-radius: 10px; margin-top: 4px; display: inline-block; }\
.status-normal { background: var(--success-bg); color: #15803d; }\
.status-warning { background: var(--warning-bg); color: #b45309; }\
.status-danger { background: var(--danger-bg); color: #dc2626; }\
.risk-tags { display: flex; gap: 8px; flex-wrap: wrap; padding: 0 16px; margin-bottom: 16px; }\
.risk-tag { padding: 6px 14px; border-radius: 20px; font-size: 13px; font-weight: 500; }\
.risk-tag.normal { background: var(--success-bg); color: #15803d; }\
.risk-tag.warning { background: var(--warning-bg); color: #b45309; }\
.risk-tag.danger { background: var(--danger-bg); color: #dc2626; }\
.ai-advice { background: var(--bg-card); border-radius: var(--radius); padding: 16px; margin: 12px 16px; box-shadow: var(--shadow); }\
.ai-advice .advice-title { font-size: 15px; font-weight: 600; margin-bottom: 10px; display: flex; align-items: center; gap: 6px; }\
.advice-list { list-style: none; padding: 0; margin: 0; }\
.advice-list li { position: relative; padding-left: 18px; font-size: 14px; color: var(--text-secondary); line-height: 1.7; margin-bottom: 6px; }\
.advice-list li::before { content: "\\2713"; position: absolute; left: 0; color: var(--primary); font-weight: 700; }\
.generate-plan-btn { margin: 16px; }\
.back-btn { margin: 16px; background: var(--bg-input); color: var(--text); }\
.loading-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.85); z-index: 200; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; }\
.loading-overlay .loading-spinner { width: 48px; height: 48px; border: 4px solid var(--border); border-top-color: var(--primary); border-radius: 50%; animation: spin 0.8s linear infinite; }\
.loading-overlay .loading-text { font-size: 16px; color: var(--text-secondary); font-weight: 500; }\
';
    document.head.appendChild(style);
  }

  function getStatusClass(value, key) {
    var range = referenceRanges[key];
    if (!range || value === '' || value === null || value === undefined) return 'status-normal';
    var v = parseFloat(value);
    if (isNaN(v)) return 'status-normal';

    if (key === 'systolic') {
      if (v >= 140) return 'status-danger';
      if (v >= 120) return 'status-warning';
      return 'status-normal';
    }
    if (key === 'diastolic') {
      if (v >= 90) return 'status-danger';
      if (v >= 80) return 'status-warning';
      return 'status-normal';
    }
    if (key === 'fastingGlucose') {
      if (v >= 7.0) return 'status-danger';
      if (v >= 6.1) return 'status-warning';
      return 'status-normal';
    }
    if (key === 'postprandialGlucose') {
      if (v >= 11.1) return 'status-danger';
      if (v >= 7.8) return 'status-warning';
      return 'status-normal';
    }
    if (key === 'hba1c') {
      if (v >= 6.5) return 'status-danger';
      if (v >= 6.0) return 'status-warning';
      return 'status-normal';
    }
    if (key === 'totalCholesterol') {
      if (v >= 6.2) return 'status-danger';
      if (v >= 5.2) return 'status-warning';
      return 'status-normal';
    }
    if (key === 'triglycerides') {
      if (v >= 2.3) return 'status-danger';
      if (v >= 1.7) return 'status-warning';
      return 'status-normal';
    }
    if (key === 'hdl') {
      if (v < 0.8) return 'status-danger';
      if (v < 1.0) return 'status-warning';
      return 'status-normal';
    }
    if (key === 'ldl') {
      if (v >= 4.1) return 'status-danger';
      if (v >= 3.4) return 'status-warning';
      return 'status-normal';
    }
    if (key === 'uricAcid') {
      if (v > 480) return 'status-danger';
      if (v > 420) return 'status-warning';
      return 'status-normal';
    }
    if (key === 'waist') {
      if (v > 95) return 'status-danger';
      if (v > 85) return 'status-warning';
      return 'status-normal';
    }
    return 'status-normal';
  }

  function getStatusText(value, key) {
    var cls = getStatusClass(value, key);
    if (cls === 'status-danger') return '异常';
    if (cls === 'status-warning') return '注意';
    return '正常';
  }

  function calcBMI() {
    var profile = localStorage.getItem('userProfile');
    var height, weight;
    if (profile) {
      try {
        var p = JSON.parse(profile);
        height = p.height;
        weight = p.weight;
      } catch (e) {}
    }
    if (!height) height = document.getElementById('metric-height')?.value;
    if (!weight) weight = document.getElementById('metric-weight')?.value;
    if (!height || !weight) return null;
    var h = parseFloat(height) / 100;
    var w = parseFloat(weight);
    if (!h || !w) return null;
    return (w / (h * h)).toFixed(1);
  }

  function bmiEvaluate(bmi) {
    var v = parseFloat(bmi);
    if (v < 18.5) return { label: '偏瘦', cls: 'status-warning' };
    if (v < 24) return { label: '正常', cls: 'status-normal' };
    if (v < 28) return { label: '偏胖', cls: 'status-warning' };
    return { label: '肥胖', cls: 'status-danger' };
  }

  function collectMetrics() {
    var fields = ['systolic','diastolic','fastingGlucose','postprandialGlucose','hba1c','totalCholesterol','triglycerides','hdl','ldl','uricAcid','waist'];
    var metrics = {};
    fields.forEach(function (f) {
      var el = document.getElementById('metric-' + f);
      if (el) metrics[f] = el.value;
    });
    var heightEl = document.getElementById('metric-height');
    var weightEl = document.getElementById('metric-weight');
    if (heightEl) metrics.height = heightEl.value;
    if (weightEl) metrics.weight = weightEl.value;
    return metrics;
  }

  function showLoading(text) {
    var existing = document.getElementById('analysis-loading');
    if (existing) existing.remove();
    var overlay = document.createElement('div');
    overlay.id = 'analysis-loading';
    overlay.className = 'loading-overlay';
    overlay.innerHTML = '<div class="loading-spinner"></div><div class="loading-text">' + (text || '分析中...') + '</div>';
    document.body.appendChild(overlay);
  }

  function hideLoading() {
    var existing = document.getElementById('analysis-loading');
    if (existing) existing.remove();
  }

  function saveAndAnalyze() {
    var raw = collectMetrics();
    // 检查是否有值
    var hasValue = false;
    for (var k in raw) {
      if (raw[k] && String(raw[k]).trim() !== '') { hasValue = true; break; }
    }
    if (!hasValue) {
      showToast('请至少输入一项体检指标数据', 'error');
      return;
    }

    showLoading('正在保存并分析...');

    // 将扁平表单数据转换为后端期望的 metrics 数组格式
    var metrics = [];
    if (raw.systolic || raw.diastolic) {
      metrics.push({
        metric_type: 'blood_pressure',
        value: { systolic: parseFloat(raw.systolic) || 0, diastolic: parseFloat(raw.diastolic) || 0 }
      });
    }
    if (raw.fastingGlucose || raw.postprandialGlucose) {
      metrics.push({
        metric_type: 'blood_sugar',
        value: { fasting: parseFloat(raw.fastingGlucose) || 0, postprandial: parseFloat(raw.postprandialGlucose) || 0 }
      });
    }
    if (raw.hba1c) {
      metrics.push({ metric_type: 'hba1c', value: { value: parseFloat(raw.hba1c) } });
    }
    if (raw.totalCholesterol || raw.triglycerides || raw.hdl || raw.ldl) {
      metrics.push({
        metric_type: 'blood_lipid',
        value: {
          total_cholesterol: parseFloat(raw.totalCholesterol) || 0,
          triglycerides: parseFloat(raw.triglycerides) || 0,
          hdl: parseFloat(raw.hdl) || 0,
          ldl: parseFloat(raw.ldl) || 0
        }
      });
    }
    if (raw.uricAcid) {
      metrics.push({ metric_type: 'uric_acid', value: { value: parseFloat(raw.uricAcid) } });
    }
    if (raw.waist) {
      metrics.push({ metric_type: 'waist', value: { value: parseFloat(raw.waist) } });
    }
    if (raw.height && raw.weight) {
      metrics.push({ metric_type: 'bmi', value: { height: parseFloat(raw.height), weight: parseFloat(raw.weight) } });
    }

    if (metrics.length === 0) {
      hideLoading();
      showToast('请至少输入一项体检指标数据', 'error');
      return;
    }

    var token = getToken();
    var headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = 'Bearer ' + token;

    fetch(API_BASE + '/health/metrics', {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ metrics: metrics })
    })
    .then(function (res) { return res.json(); })
    .then(function (res) {
      if (res.code === 0) {
        return fetch(API_BASE + '/analysis/report', { headers: headers }).then(function (r) { return r.json(); });
      } else {
        throw new Error(res.message || '保存失败');
      }
    }).then(function (res) {
      hideLoading();
      if (res.code === 0 && res.data) {
        state.report = res.data;
        state.view = 'report';
        renderReport();
        showToast('分析完成', 'success');
      } else {
        showToast(res.message || '分析失败', 'error');
      }
    }).catch(function (err) {
      hideLoading();
      showToast(err.message || '网络错误，请重试', 'error');
    });
  }

  function generatePlan() {
    var btn = document.getElementById('btn-generate-plan');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '生成中...';
    }

    apiRequest(API_BASE + '/plans/generate', { method: 'POST' }).then(function (res) {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '生成健康方案';
      }
      if (res.code === 0) {
        showToast('健康方案已生成', 'success');
        setTimeout(function () {
          window.location.hash = '#/plan';
        }, 600);
      } else {
        showToast(res.message || '生成失败', 'error');
      }
    }).catch(function () {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '生成健康方案';
      }
      showToast('生成失败，请稍后重试', 'error');
    });
  }

  function renderScoreRing(score) {
    var s = Math.max(0, Math.min(100, parseInt(score) || 0));
    var radius = 42;
    var circumference = 2 * Math.PI * radius;
    var offset = circumference - (s / 100) * circumference;
    var color = s >= 80 ? 'var(--success)' : (s >= 60 ? 'var(--accent)' : 'var(--danger)');
    return '\
      <div class="circle-progress">\
        <svg width="100" height="100" viewBox="0 0 100 100">\
          <circle class="circle-bg" cx="50" cy="50" r="' + radius + '"></circle>\
          <circle class="circle-fill" cx="50" cy="50" r="' + radius + '" style="stroke-dasharray:' + circumference + ';stroke-dashoffset:' + offset + ';stroke:' + color + ';"></circle>\
        </svg>\
        <div class="circle-text" style="color:' + color + '">' + s + '</div>\
      </div>';
  }

  function renderInputForm(container) {
    var metricsHtml = '';
    var groups = [
      { title: '\u{1FA78} 血压', icon: '\u{1FA78}', fields: ['systolic', 'diastolic'] },
      { title: '\u{1F948} 血糖', icon: '\u{1F948}', fields: ['fastingGlucose', 'postprandialGlucose', 'hba1c'] },
      { title: '\u{1F9C0} 血脂', icon: '\u{1F9C0}', fields: ['totalCholesterol', 'triglycerides', 'hdl', 'ldl'] },
      { title: '\u{1F9A0} 其他', icon: '\u{1F9A0}', fields: ['uricAcid', 'waist'] }
    ];

    groups.forEach(function (g) {
      var fieldsHtml = '';
      g.fields.forEach(function (f) {
        var range = referenceRanges[f];
        fieldsHtml += '\
          <div class="form-group">\
            <label class="form-label">' + range.label + ' (' + range.unit + ')</label>\
            <input class="form-input" type="number" step="0.1" id="metric-' + f + '" placeholder="请输入">\
            <div class="range-hint">参考范围: ' + range.normal + '</div>\
          </div>';
      });

      var rowClass = g.fields.length >= 2 ? 'metric-row' : '';
      var innerHtml = g.fields.length >= 2 ? '<div class="metric-row">' + fieldsHtml + '</div>' : fieldsHtml;
      // For 3+ fields in a group, stack them; for 2, side by side
      if (g.fields.length > 2) innerHtml = fieldsHtml;

      metricsHtml += '\
        <div class="metric-card">\
          <div class="card-title">' + g.icon + ' ' + g.title + '</div>' + innerHtml + '\
        </div>';
    });

    var html = '\
      <div class="analysis-page">\
        <div class="page-header">\
          <h1>\u{1F4CB} 健康档案</h1>\
          <div class="subtitle">录入体检数据，获取AI分析报告</div>\
        </div>\
        <div class="section">\
          <button class="scan-btn" id="btn-scan">\u{1F4F7} 扫描体检报告</button>\
          ' + metricsHtml + '\
          <div class="metric-card">\
            <div class="card-title">\u{2696} 基础数据（用于计算BMI）</div>\
            <div class="metric-row">\
              <div class="form-group">\
                <label class="form-label">身高 (cm)</label>\
                <input class="form-input" type="number" id="metric-height" placeholder="175">\
              </div>\
              <div class="form-group">\
                <label class="form-label">体重 (kg)</label>\
                <input class="form-input" type="number" id="metric-weight" placeholder="70">\
              </div>\
            </div>\
          </div>\
          <button class="btn btn-primary btn-block" id="btn-save-analyze" style="margin:16px;">\u{1F50D} 保存并分析</button>\
        </div>\
      </div>';

    container.innerHTML = html;

    document.getElementById('btn-scan').addEventListener('click', function () {
      showToast('测试版提示：请手动输入关键指标', 'info');
    });

    document.getElementById('btn-save-analyze').addEventListener('click', saveAndAnalyze);
  }

  function renderReport() {
    try {
      var container = document.getElementById('app');
      if (!container) return;
      var data = state.report || {};
      var score = data.score || 0;

    // BMI - 兼容 data.bmi 是对象或数字的情况
    var bmi = calcBMI();
    if (!bmi) {
      if (data.bmi) {
        if (typeof data.bmi === 'number') {
          bmi = data.bmi.toFixed(1);
        } else if (typeof data.bmi === 'object' && data.bmi.value !== undefined) {
          bmi = parseFloat(data.bmi.value).toFixed(1);
        } else {
          bmi = '--';
        }
      } else {
        bmi = '--';
      }
    }
    var bmiInfo = bmiEvaluate(bmi);

    // 血压状态同时考虑收缩压和舒张压
    var bpStatusCls = 'status-normal';
    var bpStatusText = '正常';
    if (data.systolic || data.diastolic) {
      var sysCls = getStatusClass(data.systolic, 'systolic');
      var diaCls = getStatusClass(data.diastolic, 'diastolic');
      if (sysCls === 'status-danger' || diaCls === 'status-danger') {
        bpStatusCls = 'status-danger'; bpStatusText = '异常';
      } else if (sysCls === 'status-warning' || diaCls === 'status-warning') {
        bpStatusCls = 'status-warning'; bpStatusText = '注意';
      }
    }

    // Indicator cards
    var indicators = [
      { key: 'bmi', name: 'BMI', icon: '\u{2696}', value: bmi, status: bmiInfo.label, statusCls: bmiInfo.cls },
      { key: 'bloodPressure', name: '血压', icon: '\u{1FA78}', value: (data.systolic && data.diastolic) ? (data.systolic + '/' + data.diastolic) : '--', status: bpStatusText, statusCls: bpStatusCls },
      { key: 'bloodSugar', name: '血糖', icon: '\u{1F948}', value: data.fastingGlucose ? (data.fastingGlucose + ' mmol/L') : '--', status: getStatusText(data.fastingGlucose, 'fastingGlucose'), statusCls: getStatusClass(data.fastingGlucose, 'fastingGlucose') },
      { key: 'bloodLipid', name: '血脂', icon: '\u{1F9C0}', value: data.totalCholesterol ? ('胆固醇' + data.totalCholesterol + ' / 甘油三酯' + data.triglycerides) : '--', status: getStatusText(data.totalCholesterol, 'totalCholesterol'), statusCls: getStatusClass(data.totalCholesterol, 'totalCholesterol') },
      { key: 'uricAcid', name: '尿酸', icon: '\u{1F9A0}', value: data.uricAcid ? (data.uricAcid + ' \u03BCmol/L') : '--', status: getStatusText(data.uricAcid, 'uricAcid'), statusCls: getStatusClass(data.uricAcid, 'uricAcid') }
    ];

    var indicatorsHtml = '';
    indicators.forEach(function (ind) {
      var iconBg = ind.statusCls === 'status-normal' ? 'rgba(34,197,94,0.1)' : (ind.statusCls === 'status-warning' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)');
      indicatorsHtml += '\
        <div class="indicator-card">\
          <div class="indicator-icon" style="background:' + iconBg + ';">' + ind.icon + '</div>\
          <div class="indicator-info">\
            <div class="indicator-name">' + ind.name + '</div>\
            <div class="indicator-value">' + escapeHtml(String(ind.value)) + '</div>\
            <span class="indicator-status ' + ind.statusCls + '">' + ind.status + '</span>\
          </div>\
        </div>';
    });

    // Risk tags
    var riskTagsHtml = '';
    var risks = data.risks || [];
    if (risks.length === 0) {
      // auto generate from indicators
      indicators.forEach(function (ind) {
        if (ind.statusCls !== 'status-normal') {
          risks.push({ name: ind.name + ind.status, level: ind.statusCls === 'status-danger' ? 'danger' : 'warning' });
        }
      });
    }
    if (risks.length === 0) {
      riskTagsHtml = '<span class="risk-tag normal">\u{2705} 各项指标正常</span>';
    } else {
      risks.forEach(function (r) {
        riskTagsHtml += '<span class="risk-tag ' + r.level + '">' + escapeHtml(r.name) + '</span>';
      });
    }

    // AI advice
    var dietAdvice = data.dietAdvice || data.diet_advice || ['保持均衡饮食，少油少盐', '多吃蔬菜水果，控制精制糖摄入'];
    var exerciseAdvice = data.exerciseAdvice || data.exercise_advice || ['每周至少进行150分钟中等强度运动', '避免久坐，每小时起身活动'];
    if (typeof dietAdvice === 'string') dietAdvice = [dietAdvice];
    if (typeof exerciseAdvice === 'string') exerciseAdvice = [exerciseAdvice];

    var dietAdviceHtml = '';
    dietAdvice.forEach(function (item) {
      dietAdviceHtml += '<li>' + escapeHtml(item) + '</li>';
    });
    var exerciseAdviceHtml = '';
    exerciseAdvice.forEach(function (item) {
      exerciseAdviceHtml += '<li>' + escapeHtml(item) + '</li>';
    });

    var html = '\
      <div class="analysis-page">\
        <div class="page-header">\
          <h1>\u{1F4CB} 健康档案</h1>\
          <div class="subtitle">AI智能分析报告</div>\
        </div>\
        <div class="score-ring-wrap">\
          ' + renderScoreRing(score) + '\
          <div class="score-label">综合健康评分</div>\
        </div>\
        <div class="risk-tags">' + riskTagsHtml + '</div>\
        <div class="indicator-cards">' + indicatorsHtml + '</div>\
        <div class="ai-advice">\
          <div class="advice-title">\u{1F373} 饮食调理建议</div>\
          <ul class="advice-list">' + dietAdviceHtml + '</ul>\
        </div>\
        <div class="ai-advice">\
          <div class="advice-title">\u{1F3C3} 运动锻炼建议</div>\
          <ul class="advice-list">' + exerciseAdviceHtml + '</ul>\
        </div>\
        <button class="btn btn-primary btn-block generate-plan-btn" id="btn-generate-plan">\u{1F4CB} 生成健康方案</button>\
        <button class="btn btn-secondary btn-block back-btn" id="btn-back-input">\u{2B05} 重新录入数据</button>\
      </div>';

    container.innerHTML = html;

    document.getElementById('btn-generate-plan').addEventListener('click', generatePlan);
    document.getElementById('btn-back-input').addEventListener('click', function () {
      state.view = 'input';
      state.report = null;
      renderInputForm(container);
    });
    } catch (e) {
      console.error('[Analysis] renderReport 出错:', e);
      var c = document.getElementById('app');
      if (c) {
        c.innerHTML = '<div class="analysis-page"><div class="page-header"><h1>\u{1F4CB} 健康档案</h1></div><div style="padding:40px 16px;text-align:center;color:var(--text-secondary);font-size:14px;">报告加载出错，请<a href="javascript:void(0)" id="report-error-retry" style="color:var(--primary);text-decoration:underline;">点击重新录入</a></div></div>';
        var retryBtn = document.getElementById('report-error-retry');
        if (retryBtn) {
          retryBtn.addEventListener('click', function () {
            state.view = 'input';
            state.report = null;
            renderInputForm(c);
          });
        }
      }
    }
  }

  function render(container) {
    injectStyles();
    // 从外部导航进入时，重置为输入视图，确保用户看到录入表单
    // 报告视图只在点击"保存并分析"后才切换
    state.view = 'input';
    renderInputForm(container);
  }

  window.Pages = window.Pages || {};
  window.Pages.analysis = render;
})();
