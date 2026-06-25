// 求助发布模块
window.CommunityAidHelp = (function() {
  // 初始化：绑定事件
  function init() {
    const publishBtn = document.getElementById('publish-help-btn');
    const helpForm = document.getElementById('help-form');
    const helpModal = document.getElementById('help-modal');

    if (publishBtn) publishBtn.addEventListener('click', openHelpModal);
    if (helpForm) helpForm.addEventListener('submit', handleHelp);

    if (helpModal) {
      const closeBtn = helpModal.querySelector('.modal-close');
      if (closeBtn) closeBtn.addEventListener('click', closeHelpModal);

      // 点击弹窗外部关闭
      helpModal.addEventListener('click', function(e) {
        if (e.target === helpModal) closeHelpModal();
      });
    }

    // ESC键关闭弹窗
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        const modal = document.getElementById('help-modal');
        if (modal && modal.classList.contains('show')) {
          closeHelpModal();
        }
      }
    });
  }

  // 打开求助弹窗
  function openHelpModal() {
    if (!CommunityAidData.isLoggedIn()) {
      CommunityAidUI.showToast('请先登录后再发布求助');
      CommunityAidUI.openModal('login-modal');
      return;
    }
    CommunityAidUI.openModal('help-modal');
    setTimeout(function() {
      const typeSelect = document.getElementById('help-type');
      if (typeSelect) typeSelect.focus();
    }, 100);
  }

  // 关闭求助弹窗
  function closeHelpModal() {
    CommunityAidUI.closeModal('help-modal');
    const form = document.getElementById('help-form');
    if (form) form.reset();
  }

  // 表单验证
  function validateForm(type, description, phone) {
    if (!type) {
      CommunityAidUI.showToast('请选择服务类型');
      const typeEl = document.getElementById('help-type');
      if (typeEl) typeEl.focus();
      return false;
    }
    if (!description) {
      CommunityAidUI.showToast('请输入需求描述');
      const descEl = document.getElementById('help-description');
      if (descEl) descEl.focus();
      return false;
    }
    if (description.length < 10 || description.length > 100) {
      CommunityAidUI.showToast('需求描述请输入10-100字');
      const descEl = document.getElementById('help-description');
      if (descEl) descEl.focus();
      return false;
    }
    if (!phone) {
      CommunityAidUI.showToast('请输入联系电话');
      const phoneEl = document.getElementById('help-phone');
      if (phoneEl) phoneEl.focus();
      return false;
    }
    if (!/^1\d{10}$/.test(phone)) {
      CommunityAidUI.showToast('请输入正确的11位手机号');
      const phoneEl = document.getElementById('help-phone');
      if (phoneEl) phoneEl.focus();
      return false;
    }
    return true;
  }

  // 发布处理
  function handleHelp(event) {
    event.preventDefault();
    const type = document.getElementById('help-type').value;
    const description = document.getElementById('help-description').value.trim();
    const phone = document.getElementById('help-phone').value.trim();

    if (!validateForm(type, description, phone)) return;

    const newNeed = CommunityAidData.addNeed({
      type: type,
      description: description,
      phone: phone,
      time: CommunityAidUI.formatCurrentTime(),
      status: 'pending'
    });

    closeHelpModal();
    CommunityAidUI.showToast('发布成功！志愿者将尽快与您联系');

    // 通知其他模块刷新
    document.dispatchEvent(new CustomEvent('help:published', {
      detail: { need: newNeed }
    }));
  }

  return {
    init: init,
    openHelpModal: openHelpModal,
    closeHelpModal: closeHelpModal,
    validateForm: validateForm,
    handleHelp: handleHelp
  };
})();
