/* ============================================
   utils.js - 通用工具函数模块
   提供 DOM 操作封装、日期格式化、UUID 生成、
   Toast 提示、Modal 确认弹窗、表单弹窗等基础能力
   挂载到全局命名空间 App.Utils
   ============================================ */

(function (global) {
  'use strict';

  // 初始化全局命名空间
  global.App = global.App || {};

  // ---------- DOM 工具 ----------
  /** 选择单个元素 */
  function $(selector, parent) {
    return (parent || document).querySelector(selector);
  }

  /** 选择多个元素 */
  function $all(selector, parent) {
    return Array.prototype.slice.call((parent || document).querySelectorAll(selector));
  }

  /** 创建元素并设置属性/子节点 */
  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (key) {
        if (key === 'class') {
          node.className = attrs[key];
        } else if (key === 'text') {
          node.textContent = attrs[key];
        } else if (key === 'html') {
          node.innerHTML = attrs[key];
        } else if (key.indexOf('on') === 0 && typeof attrs[key] === 'function') {
          node.addEventListener(key.slice(2).toLowerCase(), attrs[key]);
        } else if (key === 'dataset') {
          Object.keys(attrs[key]).forEach(function (dk) {
            node.dataset[dk] = attrs[key][dk];
          });
        } else {
          node.setAttribute(key, attrs[key]);
        }
      });
    }
    if (children) {
      (Array.isArray(children) ? children : [children]).forEach(function (c) {
        if (c == null) return;
        if (typeof c === 'string') {
          node.appendChild(document.createTextNode(c));
        } else {
          node.appendChild(c);
        }
      });
    }
    return node;
  }

  /** HTML 转义，防止注入 */
  function escapeHTML(str) {
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ---------- UUID 生成 ----------
  /** 生成简易唯一 ID（时间戳 + 随机串） */
  function uuid() {
    return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
  }

  // ---------- 日期工具 ----------
  /** 补零 */
  function pad(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  /** 格式化日期为 YYYY-MM-DD */
  function formatDate(date) {
    var d = date instanceof Date ? date : new Date(date);
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  /** 格式化时间为 HH:MM */
  function formatTime(date) {
    var d = date instanceof Date ? date : new Date(date);
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  /** 格式化日期时间：MM-DD HH:MM */
  function formatDateTime(date) {
    var d = date instanceof Date ? date : new Date(date);
    return pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + ' ' + pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  /** 友好日期：今天/昨天/前天/MM-DD */
  function formatRelativeDate(date) {
    var d = date instanceof Date ? date : new Date(date);
    var today = new Date();
    var todayStr = formatDate(today);
    var yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    var yesterdayStr = formatDate(yesterday);
    var beforeYesterday = new Date(today);
    beforeYesterday.setDate(today.getDate() - 2);
    var beforeYesterdayStr = formatDate(beforeYesterday);
    var dStr = formatDate(d);
    if (dStr === todayStr) return '今天';
    if (dStr === yesterdayStr) return '昨天';
    if (dStr === beforeYesterdayStr) return '前天';
    return pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }

  /** 获取某天的起始 Date（本地时区） */
  function startOfDay(date) {
    var d = date instanceof Date ? new Date(date) : new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /** 获取最近 N 天的日期数组（含今天，倒序） */
  function lastNDays(n) {
    var days = [];
    var today = startOfDay(new Date());
    for (var i = n - 1; i >= 0; i--) {
      var d = new Date(today);
      d.setDate(today.getDate() - i);
      days.push(d);
    }
    return days;
  }

  /** 计算年龄字符串（X岁X月） */
  function ageFromBirthday(birthday) {
    if (!birthday) return '';
    var b = new Date(birthday);
    if (isNaN(b.getTime())) return '';
    var now = new Date();
    var years = now.getFullYear() - b.getFullYear();
    var months = now.getMonth() - b.getMonth();
    if (now.getDate() < b.getDate()) months--;
    if (months < 0) { years--; months += 12; }
    if (years <= 0 && months <= 0) return '刚出生';
    var s = '';
    if (years > 0) s += years + '岁';
    if (months > 0) s += months + '个月';
    return s;
  }

  // ---------- Toast 提示 ----------
  /** 显示 Toast（type: add/deduct/info/warning） */
  function toast(message, type) {
    type = type || 'info';
    var container = $('#toastContainer');
    if (!container) return;
    var t = el('div', { class: 'toast ' + type, text: message });
    container.appendChild(t);
    setTimeout(function () {
      t.classList.add('toast-out');
      setTimeout(function () {
        if (t.parentNode) t.parentNode.removeChild(t);
      }, 300);
    }, 2000);
  }

  // ---------- Modal 弹窗 ----------
  var modalRoot = null;
  var modalTitleEl = null;
  var modalBodyEl = null;
  var modalFooterEl = null;

  /** 初始化 Modal 元素引用 */
  function initModalRefs() {
    modalRoot = $('#modalRoot');
    modalTitleEl = $('#modalTitle');
    modalBodyEl = $('#modalBody');
    modalFooterEl = $('#modalFooter');
  }

  /** 显示 Modal */
  function showModal(options) {
    if (!modalRoot) initModalRefs();
    options = options || {};
    modalTitleEl.textContent = options.title || '提示';
    modalBodyEl.innerHTML = '';
    if (typeof options.body === 'string') {
      modalBodyEl.innerHTML = options.body;
    } else if (options.body instanceof Node) {
      modalBodyEl.appendChild(options.body);
    }
    modalFooterEl.innerHTML = '';
    var footerNodes = options.footer || [
      el('button', { class: 'btn btn-ghost', text: '取消', onclick: function () { closeModal(); if (options.onCancel) options.onCancel(); } }),
      el('button', { class: 'btn btn-primary', text: options.confirmText || '确认', onclick: function () { if (options.onConfirm) options.onConfirm(); } })
    ];
    footerNodes.forEach(function (n) { modalFooterEl.appendChild(n); });
    modalRoot.classList.remove('hidden');
  }

  /** 关闭 Modal */
  function closeModal() {
    if (!modalRoot) initModalRefs();
    modalRoot.classList.add('hidden');
  }

  /** 确认弹窗（替代 confirm） */
  function confirmDialog(message, onConfirm, options) {
    options = options || {};
    showModal({
      title: options.title || '请确认',
      body: el('div', { class: 'confirm-text', text: message }),
      confirmText: options.confirmText || '确认',
      onConfirm: function () {
        closeModal();
        if (onConfirm) onConfirm();
      }
    });
  }

  /** 表单弹窗（替代 prompt） */
  function formDialog(options) {
    options = options || {};
    var formEl = el('div', { class: 'form-container' });
    var fields = options.fields || [];
    var values = {};
    var inputs = {};

    fields.forEach(function (field) {
      var group = el('div', { class: 'form-group' });
      var label = el('label', { class: 'form-label' });
      label.textContent = field.label;
      if (field.required) {
        label.appendChild(el('span', { class: 'required', text: '*' }));
      }
      group.appendChild(label);

      if (field.type === 'emoji') {
        var picker = el('div', { class: 'emoji-picker' });
        var current = field.value || field.options[0];
        values[field.name] = current;
        field.options.forEach(function (emoji) {
          var opt = el('div', {
            class: 'emoji-option' + (emoji === current ? ' selected' : ''),
            text: emoji,
            onclick: function () {
              $all('.emoji-option', picker).forEach(function (n) { n.classList.remove('selected'); });
              opt.classList.add('selected');
              values[field.name] = emoji;
            }
          });
          picker.appendChild(opt);
        });
        group.appendChild(picker);
      } else if (field.type === 'color') {
        var cpicker = el('div', { class: 'color-picker' });
        var currentColor = field.value || field.options[0];
        values[field.name] = currentColor;
        field.options.forEach(function (color) {
          var opt = el('div', {
            class: 'color-option' + (color === currentColor ? ' selected' : ''),
            style: 'background:' + color + ';',
            onclick: function () {
              $all('.color-option', cpicker).forEach(function (n) { n.classList.remove('selected'); });
              opt.classList.add('selected');
              values[field.name] = color;
            }
          });
          cpicker.appendChild(opt);
        });
        group.appendChild(cpicker);
      } else if (field.type === 'type') {
        var tpicker = el('div', { class: 'type-picker' });
        var currentType = field.value || field.options[0].value;
        values[field.name] = currentType;
        field.options.forEach(function (opt) {
          var btn = el('div', {
            class: 'type-option' + (opt.value === currentType ? ' selected ' + opt.value : ''),
            text: opt.label,
            onclick: function () {
              $all('.type-option', tpicker).forEach(function (n) {
                n.classList.remove('selected', 'add', 'deduct');
              });
              btn.classList.add('selected', opt.value);
              values[field.name] = opt.value;
            }
          });
          tpicker.appendChild(btn);
        });
        group.appendChild(tpicker);
      } else {
        var input;
        if (field.type === 'select') {
          input = el('select', { class: 'form-select' });
          field.options.forEach(function (opt) {
            var o = el('option', { value: opt.value, text: opt.label });
            if (field.value !== undefined && String(field.value) === String(opt.value)) {
              o.selected = true;
            }
            input.appendChild(o);
          });
          values[field.name] = field.value !== undefined ? field.value : (field.options[0] && field.options[0].value);
          input.addEventListener('change', function () { values[field.name] = input.value; });
        } else {
          input = el('input', {
            class: 'form-input',
            type: field.type || 'text',
            placeholder: field.placeholder || ''
          });
          if (field.value !== undefined && field.value !== null) input.value = field.value;
          values[field.name] = field.value || '';
          input.addEventListener('input', function () { values[field.name] = input.value; });
        }
        if (field.min !== undefined) input.min = field.min;
        if (field.max !== undefined) input.max = field.max;
        inputs[field.name] = input;
        group.appendChild(input);
      }
      formEl.appendChild(group);
    });

    var footer = [
      el('button', { class: 'btn btn-ghost', text: '取消', onclick: function () { closeModal(); if (options.onCancel) options.onCancel(); } }),
      el('button', {
        class: 'btn btn-primary', text: options.confirmText || '保存', onclick: function () {
          // 校验必填
          for (var i = 0; i < fields.length; i++) {
            var f = fields[i];
            if (f.required) {
              var v = values[f.name];
              if (v === '' || v == null) {
                toast(f.label + '不能为空', 'warning');
                return;
              }
            }
            if (f.type === 'number' && values[f.name] !== '' && values[f.name] != null) {
              var num = Number(values[f.name]);
              if (isNaN(num) || num <= 0) {
                toast(f.label + '必须为正数', 'warning');
                return;
              }
              values[f.name] = Math.floor(num);
            }
          }
          closeModal();
          if (options.onSubmit) options.onSubmit(values);
        }
      })
    ];

    showModal({
      title: options.title || '填写信息',
      body: formEl,
      footer: footer
    });

    return values;
  }

  // ---------- 事件委托工具 ----------
  /** 在容器上代理事件 */
  function delegate(container, eventType, selector, handler) {
    container.addEventListener(eventType, function (e) {
      var target = e.target.closest(selector);
      if (target && container.contains(target)) {
        handler(target, e);
      }
    });
  }

  // ---------- 预设数据 ----------
  /** 可选 emoji 头像 */
  var BABY_EMOJIS = ['👶', '🧒', '👧', '👦', '👼', '🦄', '🐰', '🐻', '🐼', '🐯'];
  var BEHAVIOR_EMOJIS = ['🛏️', '🍚', '🪥', '🤬', '🧸', '📚', '🧹', '💧', '🏃', '🎨', '🎵', '🙏', '💪', '⭐', '🌟', '🍎', '🥦', '😴', '📱', '🎮'];
  var REWARD_EMOJIS = ['🎁', '🍭', '🍦', '🍫', '🧸', '🎈', '🚲', '🎟️', '🎮', '📺', '🏖️', '🏆', '⭐', '🌟', '🎯', '🪁', '🛴', '🎨'];
  /** 可选主题色 */
  var THEME_COLORS = ['#FF9F43', '#FF6B9D', '#26DE81', '#FC5C65', '#4A90E2', '#9B59B6', '#F39C12', '#1ABC9C'];

  // ---------- 暴露 API ----------
  App.Utils = {
    $: $,
    $all: $all,
    el: el,
    escapeHTML: escapeHTML,
    uuid: uuid,
    pad: pad,
    formatDate: formatDate,
    formatTime: formatTime,
    formatDateTime: formatDateTime,
    formatRelativeDate: formatRelativeDate,
    startOfDay: startOfDay,
    lastNDays: lastNDays,
    ageFromBirthday: ageFromBirthday,
    toast: toast,
    showModal: showModal,
    closeModal: closeModal,
    confirmDialog: confirmDialog,
    formDialog: formDialog,
    delegate: delegate,
    initModalRefs: initModalRefs,
    BABY_EMOJIS: BABY_EMOJIS,
    BEHAVIOR_EMOJIS: BEHAVIOR_EMOJIS,
    REWARD_EMOJIS: REWARD_EMOJIS,
    THEME_COLORS: THEME_COLORS
  };

})(typeof window !== 'undefined' ? window : this);
