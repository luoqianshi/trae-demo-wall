/* ============================================
   baby.js - 宝宝管理模块
   负责宝宝列表渲染、添加/编辑/删除（含级联删除）、
   以及顶部宝宝选择器下拉的渲染。
   挂载到全局命名空间 App.BabyManager
   ============================================ */

(function (global) {
  'use strict';

  global.App = global.App || {};
  var Utils = App.Utils;
  var Storage = App.Storage;
  // 本地别名，简化调用
  var $ = Utils.$, $all = Utils.$all, el = Utils.el;

  /** 渲染设置页的宝宝列表 */
  function renderBabyList() {
    var listEl = $('#babyList');
    var emptyEl = $('#babiesEmpty');
    if (!listEl) return;
    var babies = Storage.getBabies();
    var currentBabyId = Storage.getData().currentBabyId;

    listEl.innerHTML = '';
    if (babies.length === 0) {
      emptyEl.classList.remove('hidden');
      return;
    }
    emptyEl.classList.add('hidden');

    babies.forEach(function (baby) {
      var isCurrent = baby.id === currentBabyId;
      var age = Utils.ageFromBirthday(baby.birthday);
      var subText = age ? (age + (baby.birthday ? ' · ' + baby.birthday : '')) : (baby.birthday || '未设置生日');
      var item = el('div', { class: 'list-item' + (isCurrent ? ' current' : ''), dataset: { id: baby.id } }, [
        el('div', { class: 'list-item-icon', text: baby.avatar || '👶' }),
        el('div', { class: 'list-item-main' }, [
          el('div', { class: 'list-item-name', html: '<span class="baby-color-dot" style="background:' + baby.color + '"></span>' + Utils.escapeHTML(baby.name) + (isCurrent ? '<span class="current-badge">当前</span>' : '') }),
          el('div', { class: 'list-item-sub', text: subText })
        ]),
        el('div', { class: 'list-item-actions' }, [
          el('button', { class: 'icon-btn', text: '设为当前', title: '设为当前宝宝', onclick: function (e) { e.stopPropagation(); handleSetCurrent(baby.id); } }),
          el('button', { class: 'icon-btn edit', text: '✎', title: '编辑', onclick: function (e) { e.stopPropagation(); showBabyForm(baby); } }),
          el('button', { class: 'icon-btn delete', text: '🗑', title: '删除', onclick: function (e) { e.stopPropagation(); handleDelete(baby); } })
        ])
      ]);
      listEl.appendChild(item);
    });
  }

  /** 渲染顶部宝宝选择器下拉 */
  function renderBabyDropdown() {
    var listEl = $('#babyDropdownList');
    if (!listEl) return;
    var babies = Storage.getBabies();
    var currentBabyId = Storage.getData().currentBabyId;
    listEl.innerHTML = '';
    babies.forEach(function (baby) {
      var isCurrent = baby.id === currentBabyId;
      var item = el('div', { class: 'dropdown-item' + (isCurrent ? ' current' : ''), dataset: { id: baby.id } }, [
        el('div', { class: 'dropdown-item-icon', text: baby.avatar || '👶' }),
        el('div', { class: 'dropdown-item-name', html: '<span class="baby-color-dot" style="background:' + baby.color + '"></span>' + Utils.escapeHTML(baby.name) }),
        isCurrent ? el('div', { class: 'dropdown-item-check', text: '✓' }) : null
      ]);
      item.addEventListener('click', function () {
        Storage.setCurrentBaby(baby.id);
        App.Controller.refreshAll();
        App.Controller.hideBabyDropdown();
      });
      listEl.appendChild(item);
    });
  }

  /** 设为当前宝宝 */
  function handleSetCurrent(id) {
    Storage.setCurrentBaby(id);
    App.Controller.refreshAll();
    Utils.toast('已切换当前宝宝', 'info');
  }

  /** 显示宝宝表单（添加/编辑） */
  function showBabyForm(baby) {
    var isEdit = !!baby;
    Utils.formDialog({
      title: isEdit ? '编辑宝宝' : '添加宝宝',
      fields: [
        { name: 'name', label: '昵称', type: 'text', required: true, placeholder: '请输入宝宝昵称', value: isEdit ? baby.name : '' },
        { name: 'avatar', label: '头像', type: 'emoji', options: Utils.BABY_EMOJIS, value: isEdit ? baby.avatar : Utils.BABY_EMOJIS[0] },
        { name: 'birthday', label: '生日', type: 'date', value: isEdit ? baby.birthday : '' },
        { name: 'color', label: '主题色', type: 'color', options: Utils.THEME_COLORS, value: isEdit ? baby.color : Utils.THEME_COLORS[0] }
      ],
      confirmText: isEdit ? '保存' : '添加',
      onSubmit: function (values) {
        if (isEdit) {
          Storage.updateBaby(baby.id, {
            name: values.name,
            avatar: values.avatar,
            birthday: values.birthday || '',
            color: values.color
          });
          Utils.toast('宝宝信息已更新', 'info');
        } else {
          var newBaby = Storage.addBaby({
            name: values.name,
            avatar: values.avatar,
            birthday: values.birthday || '',
            color: values.color
          });
          // 新增宝宝自动设为当前
          Storage.setCurrentBaby(newBaby.id);
          Utils.toast('宝宝已添加', 'info');
        }
        App.Controller.refreshAll();
      }
    });
  }

  /** 处理删除宝宝（二次确认 + 级联删除） */
  function handleDelete(baby) {
    Utils.confirmDialog(
      '确定要删除宝宝「' + baby.name + '」吗？\n该宝宝的所有行为记录和兑换记录将一并删除，此操作不可恢复。',
      function () {
        Storage.deleteBaby(baby.id);
        Utils.toast('宝宝已删除', 'info');
        App.Controller.refreshAll();
      },
      { title: '删除宝宝', confirmText: '确认删除' }
    );
  }

  /** 绑定事件 */
  function bindEvents() {
    // 添加宝宝按钮
    var addBtn = $('#addBabyBtn');
    if (addBtn) addBtn.addEventListener('click', function () { showBabyForm(null); });
    // 下拉中的添加宝宝
    var dropdownAdd = $('#dropdownAddBaby');
    if (dropdownAdd) dropdownAdd.addEventListener('click', function () {
      App.Controller.hideBabyDropdown();
      App.Controller.switchView('settings');
      showBabyForm(null);
    });
  }

  // ---------- 暴露 API ----------
  App.BabyManager = {
    renderBabyList: renderBabyList,
    renderBabyDropdown: renderBabyDropdown,
    showBabyForm: showBabyForm,
    bindEvents: bindEvents
  };

})(typeof window !== 'undefined' ? window : this);
