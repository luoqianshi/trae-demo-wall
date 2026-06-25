// 志愿者注册模块
window.CommunityAidVolunteer = (function() {
  // 初始化：绑定事件
  function init() {
    const becomeBtn = document.getElementById('become-volunteer-btn');
    const registerForm = document.getElementById('register-form');
    const registerModal = document.getElementById('register-modal');

    if (becomeBtn) becomeBtn.addEventListener('click', openRegisterModal);
    if (registerForm) registerForm.addEventListener('submit', handleRegister);

    if (registerModal) {
      const closeBtn = registerModal.querySelector('.modal-close');
      if (closeBtn) closeBtn.addEventListener('click', closeRegisterModal);

      // 点击弹窗外部关闭
      registerModal.addEventListener('click', function(e) {
        if (e.target === registerModal) closeRegisterModal();
      });
    }

    // ESC键关闭弹窗
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        const modal = document.getElementById('register-modal');
        if (modal && modal.classList.contains('show')) {
          closeRegisterModal();
        }
      }
    });
  }

  // 打开注册弹窗
  function openRegisterModal() {
    if (!CommunityAidData.isLoggedIn()) {
      CommunityAidUI.showToast('请先登录后再注册志愿者');
      CommunityAidUI.openModal('login-modal');
      return;
    }
    CommunityAidUI.openModal('register-modal');
    setTimeout(function() {
      const nameInput = document.getElementById('register-name');
      if (nameInput) nameInput.focus();
    }, 100);
  }

  // 关闭注册弹窗
  function closeRegisterModal() {
    CommunityAidUI.closeModal('register-modal');
    const form = document.getElementById('register-form');
    if (form) form.reset();
  }

  // 表单验证
  function validateForm(name, phone, skill) {
    if (!name) {
      CommunityAidUI.showToast('请输入姓名');
      const nameInput = document.getElementById('register-name');
      if (nameInput) nameInput.focus();
      return false;
    }
    if (!phone) {
      CommunityAidUI.showToast('请输入手机号');
      const phoneInput = document.getElementById('register-phone');
      if (phoneInput) phoneInput.focus();
      return false;
    }
    if (!/^1\d{10}$/.test(phone)) {
      CommunityAidUI.showToast('请输入正确的11位手机号');
      const phoneInput = document.getElementById('register-phone');
      if (phoneInput) phoneInput.focus();
      return false;
    }
    if (!skill) {
      CommunityAidUI.showToast('请输入技能特长');
      const skillInput = document.getElementById('register-skill');
      if (skillInput) skillInput.focus();
      return false;
    }
    return true;
  }

  // 注册处理
  function handleRegister(event) {
    event.preventDefault();
    const name = document.getElementById('register-name').value.trim();
    const phone = document.getElementById('register-phone').value.trim();
    const skill = document.getElementById('register-skill').value.trim();

    if (!validateForm(name, phone, skill)) return;

    const newVolunteer = CommunityAidData.addVolunteer({
      name: name,
      phone: phone,
      skill: skill,
      hours: 0,
      avatar: ''
    });

    closeRegisterModal();
    CommunityAidUI.showToast('注册成功！欢迎 ' + name + ' 加入志愿者团队');

    // 通知其他模块刷新
    document.dispatchEvent(new CustomEvent('volunteer:registered', {
      detail: { volunteer: newVolunteer }
    }));
  }

  return {
    init: init,
    openRegisterModal: openRegisterModal,
    closeRegisterModal: closeRegisterModal,
    validateForm: validateForm,
    handleRegister: handleRegister
  };
})();
