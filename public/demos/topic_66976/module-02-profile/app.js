/**
 * 模块2：个人档案管理
 */

(function() {
  'use strict';

  // DOM 元素
  const els = {
    form: document.getElementById('profileForm'),
    nameInput: document.getElementById('nameInput'),
    birthYearInput: document.getElementById('birthYearInput'),
    hometownInput: document.getElementById('hometownInput'),
    interestsInput: document.getElementById('interestsInput'),
    avatarInput: document.getElementById('avatarInput'),
    avatarPreview: document.getElementById('avatarPreview'),
    uploadBtn: document.getElementById('uploadBtn'),
    lifeStages: document.getElementById('lifeStages'),
    lifeEvents: document.getElementById('lifeEvents'),
    addEventBtn: document.getElementById('addEventBtn'),
    saveToast: document.getElementById('saveToast')
  };

  let selectedStages = [];
  let avatarBase64 = '';

  /**
   * 初始化
   */
  function init() {
    loadProfile();
    bindEvents();
  }

  /**
   * 加载已有档案
   */
  function loadProfile() {
    const profile = Storage.get(StorageKeys.PROFILE);
    if (!profile) return;

    if (els.nameInput) els.nameInput.value = profile.name || '';
    if (els.birthYearInput) els.birthYearInput.value = profile.birthYear || '';
    if (els.hometownInput) els.hometownInput.value = profile.hometown || '';
    if (els.interestsInput) els.interestsInput.value = (profile.interests || []).join('、');

    // 头像
    if (profile.photo) {
      avatarBase64 = profile.photo;
      updateAvatarPreview(profile.photo);
    }

    // 人生阶段
    if (profile.lifeStages) {
      selectedStages = profile.lifeStages;
      updateStageTags();
    }

    // 人生大事
    if (profile.lifeEvents && els.lifeEvents) {
      profile.lifeEvents.forEach(event => addEventRow(event.year, event.event));
    }
  }

  /**
   * 更新头像预览
   */
  function updateAvatarPreview(src) {
    if (!els.avatarPreview) return;
    els.avatarPreview.innerHTML = `<img src="${src}" alt="头像">`;
  }

  /**
   * 更新阶段标签状态
   */
  function updateStageTags() {
    document.querySelectorAll('.stage-tag').forEach(tag => {
      const stage = tag.dataset.stage;
      tag.classList.toggle('active', selectedStages.includes(stage));
    });
  }

  /**
   * 添加人生大事行
   */
  function addEventRow(year = '', name = '') {
    const template = els.lifeEvents.querySelector('.template');
    const row = template.cloneNode(true);
    row.classList.remove('template', 'hidden');

    const yearInput = row.querySelector('.event-year');
    const nameInput = row.querySelector('.event-name');
    const removeBtn = row.querySelector('.btn-remove');

    if (yearInput) yearInput.value = year;
    if (nameInput) nameInput.value = name;

    removeBtn.addEventListener('click', () => row.remove());

    els.lifeEvents.appendChild(row);
  }

  /**
   * 处理头像上传
   */
  function handleAvatarUpload(file) {
    if (!file || !file.type.startsWith('image/')) {
      alert('请选择图片文件');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      avatarBase64 = e.target.result;
      updateAvatarPreview(avatarBase64);
    };
    reader.readAsDataURL(file);
  }

  /**
   * 保存档案
   */
  function saveProfile(e) {
    e.preventDefault();

    // 收集人生大事
    const events = [];
    els.lifeEvents.querySelectorAll('.event-item:not(.template)').forEach(row => {
      const year = row.querySelector('.event-year').value;
      const name = row.querySelector('.event-name').value;
      if (year && name) {
        events.push({ year: parseInt(year), event: name });
      }
    });

    // 收集兴趣爱好
    const interests = els.interestsInput.value
      .split(/[,，、]/)
      .map(s => s.trim())
      .filter(s => s);

    const profile = {
      name: els.nameInput.value.trim(),
      birthYear: parseInt(els.birthYearInput.value) || null,
      hometown: els.hometownInput.value.trim(),
      lifeStages: selectedStages,
      lifeEvents: events,
      interests: interests,
      photo: avatarBase64,
      updatedAt: new Date().toISOString()
    };

    Storage.set(StorageKeys.PROFILE, profile);

    // 发布事件
    const isNew = !Storage.has(StorageKeys.PROFILE);
    EventBus.emit(EVENTS.PROFILE_UPDATED, profile);
    if (isNew) {
      EventBus.emit(EVENTS.PROFILE_CREATED, profile);
    }

    // 显示成功提示
    showToast();
  }

  /**
   * 显示保存成功提示
   */
  function showToast() {
    if (!els.saveToast) return;
    els.saveToast.classList.remove('hidden');
    setTimeout(() => {
      els.saveToast.classList.add('hidden');
    }, 3000);
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    // 表单提交
    if (els.form) {
      els.form.addEventListener('submit', saveProfile);
    }

    // 头像上传
    if (els.uploadBtn && els.avatarInput) {
      els.uploadBtn.addEventListener('click', () => els.avatarInput.click());
      els.avatarInput.addEventListener('change', (e) => {
        if (e.target.files[0]) {
          handleAvatarUpload(e.target.files[0]);
        }
      });
    }

    // 人生阶段选择
    if (els.lifeStages) {
      els.lifeStages.addEventListener('click', (e) => {
        if (e.target.classList.contains('stage-tag')) {
          const stage = e.target.dataset.stage;
          if (selectedStages.includes(stage)) {
            selectedStages = selectedStages.filter(s => s !== stage);
          } else {
            selectedStages.push(stage);
          }
          updateStageTags();
        }
      });
    }

    // 添加人生大事
    if (els.addEventBtn) {
      els.addEventBtn.addEventListener('click', () => addEventRow());
    }
  }

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
