/**
 * 模块3：人生时间轴
 */

(function() {
  'use strict';

  // DOM 元素
  const els = {
    timeline: document.getElementById('timeline'),
    emptyState: document.getElementById('emptyState'),
    addEventBtn: document.getElementById('addEventBtn'),
    eventModal: document.getElementById('eventModal'),
    eventForm: document.getElementById('eventForm'),
    modalTitle: document.getElementById('modalTitle'),
    modalClose: document.getElementById('modalClose'),
    cancelBtn: document.getElementById('cancelBtn'),
    eventYear: document.getElementById('eventYear'),
    eventTitle: document.getElementById('eventTitle'),
    eventDesc: document.getElementById('eventDesc'),
    eventPhoto: document.getElementById('eventPhoto'),
    photoPreview: document.getElementById('photoPreview'),
    detailModal: document.getElementById('detailModal'),
    detailTitle: document.getElementById('detailTitle'),
    detailBody: document.getElementById('detailBody'),
    detailClose: document.getElementById('detailClose'),
    detailSpeak: document.getElementById('detailSpeak'),
    detailEdit: document.getElementById('detailEdit'),
    detailDelete: document.getElementById('detailDelete')
  };

  let events = [];
  let editingId = null;
  let currentPhoto = '';
  let viewingEvent = null;

  /**
   * 初始化
   */
  function init() {
    loadEvents();
    bindEvents();
  }

  /**
   * 加载时间轴事件
   */
  function loadEvents() {
    events = Storage.get(StorageKeys.TIMELINE, []);
    renderTimeline();
  }

  /**
   * 渲染时间轴
   */
  function renderTimeline() {
    if (!els.timeline || !els.emptyState) return;

    if (events.length === 0) {
      els.timeline.innerHTML = '';
      els.emptyState.classList.remove('hidden');
      return;
    }

    els.emptyState.classList.add('hidden');

    // 按年份排序
    const sorted = [...events].sort((a, b) => a.year - b.year);

    els.timeline.innerHTML = sorted.map(event => `
      <div class="timeline-item" data-id="${event.id}">
        <div class="timeline-dot"></div>
        <div class="timeline-year">${event.year}年</div>
        <div class="timeline-card" onclick="window.timelineApp.viewEvent('${event.id}')">
          <div class="timeline-title">${escapeHtml(event.title)}</div>
          ${event.desc ? `<p class="timeline-desc">${escapeHtml(event.desc)}</p>` : ''}
          ${event.photo ? `
            <div class="timeline-photo">
              <img src="${event.photo}" alt="${escapeHtml(event.title)}">
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');
  }

  /**
   * 查看事件详情
   */
  function viewEvent(id) {
    const event = events.find(e => e.id === id);
    if (!event) return;

    viewingEvent = event;

    if (els.detailTitle) els.detailTitle.textContent = event.title;
    if (els.detailBody) {
      els.detailBody.innerHTML = `
        <div class="timeline-year" style="font-size:24px;margin-bottom:16px;">${event.year}年</div>
        ${event.photo ? `
          <div class="detail-photo">
            <img src="${event.photo}" alt="${escapeHtml(event.title)}">
          </div>
        ` : ''}
        ${event.desc ? `<p class="detail-desc">${escapeHtml(event.desc)}</p>` : ''}
      `;
    }

    openModal(els.detailModal);

    // 发布事件
    EventBus.emit(EVENTS.MEMORY_ADDED, event);
  }

  /**
   * 打开弹窗
   */
  function openModal(modalEl) {
    if (modalEl) {
      modalEl.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
    }
  }

  /**
   * 关闭弹窗
   */
  function closeModal(modalEl) {
    if (modalEl) {
      modalEl.classList.add('hidden');
      document.body.style.overflow = '';
    }
  }

  /**
   * 保存事件
   */
  function saveEvent(e) {
    e.preventDefault();

    const eventData = {
      id: editingId || 'event_' + Date.now(),
      year: parseInt(els.eventYear.value),
      title: els.eventTitle.value.trim(),
      desc: els.eventDesc.value.trim(),
      photo: currentPhoto,
      updatedAt: new Date().toISOString()
    };

    if (editingId) {
      const index = events.findIndex(e => e.id === editingId);
      if (index !== -1) {
        events[index] = eventData;
      }
      EventBus.emit(EVENTS.TIMELINE_EVENT_EDITED, eventData);
    } else {
      events.push(eventData);
      EventBus.emit(EVENTS.TIMELINE_EVENT_ADDED, eventData);
    }

    Storage.set(StorageKeys.TIMELINE, events);
    renderTimeline();
    closeModal(els.eventModal);
    resetForm();
  }

  /**
   * 删除事件
   */
  function deleteEvent() {
    if (!viewingEvent) return;

    if (confirm('确定要删除这个事件吗？')) {
      events = events.filter(e => e.id !== viewingEvent.id);
      Storage.set(StorageKeys.TIMELINE, events);
      renderTimeline();
      closeModal(els.detailModal);
      viewingEvent = null;
    }
  }

  /**
   * 编辑事件
   */
  function editEvent() {
    if (!viewingEvent) return;

    editingId = viewingEvent.id;
    els.eventYear.value = viewingEvent.year;
    els.eventTitle.value = viewingEvent.title;
    els.eventDesc.value = viewingEvent.desc || '';
    currentPhoto = viewingEvent.photo || '';

    if (currentPhoto && els.photoPreview) {
      els.photoPreview.innerHTML = `<img src="${currentPhoto}" alt="预览">`;
      els.photoPreview.classList.remove('hidden');
    }

    els.modalTitle.textContent = '编辑事件';
    closeModal(els.detailModal);
    openModal(els.eventModal);
  }

  /**
   * 重置表单
   */
  function resetForm() {
    if (els.eventForm) els.eventForm.reset();
    editingId = null;
    currentPhoto = '';
    if (els.photoPreview) {
      els.photoPreview.innerHTML = '';
      els.photoPreview.classList.add('hidden');
    }
    if (els.modalTitle) els.modalTitle.textContent = '添加事件';
  }

  /**
   * 处理照片上传
   */
  function handlePhotoUpload(file) {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      currentPhoto = e.target.result;
      if (els.photoPreview) {
        els.photoPreview.innerHTML = `<img src="${currentPhoto}" alt="预览">`;
        els.photoPreview.classList.remove('hidden');
      }
    };
    reader.readAsDataURL(file);
  }

  /**
   * 语音播报事件
   */
  function speakEvent() {
    if (!viewingEvent) return;

    const text = `${viewingEvent.year}年，${viewingEvent.title}。${viewingEvent.desc || ''}`;
    speakText(text);
  }

  /**
   * 语音播报
   */
  function speakText(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-CN';
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  }

  /**
   * HTML 转义
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    // 添加事件按钮
    if (els.addEventBtn) {
      els.addEventBtn.addEventListener('click', () => {
        resetForm();
        openModal(els.eventModal);
      });
    }

    // 表单提交
    if (els.eventForm) {
      els.eventForm.addEventListener('submit', saveEvent);
    }

    // 关闭弹窗
    if (els.modalClose) {
      els.modalClose.addEventListener('click', () => closeModal(els.eventModal));
    }
    if (els.cancelBtn) {
      els.cancelBtn.addEventListener('click', () => closeModal(els.eventModal));
    }
    if (els.detailClose) {
      els.detailClose.addEventListener('click', () => closeModal(els.detailModal));
    }

    // 点击遮罩关闭
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        closeModal(e.target.closest('.modal'));
      });
    });

    // 照片上传
    if (els.eventPhoto) {
      els.eventPhoto.addEventListener('change', (e) => {
        if (e.target.files[0]) handlePhotoUpload(e.target.files[0]);
      });
    }

    // 详情操作
    if (els.detailSpeak) els.detailSpeak.addEventListener('click', speakEvent);
    if (els.detailEdit) els.detailEdit.addEventListener('click', editEvent);
    if (els.detailDelete) els.detailDelete.addEventListener('click', deleteEvent);
  }

  // 暴露查看事件方法到全局
  window.timelineApp = { viewEvent };

  // 启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
