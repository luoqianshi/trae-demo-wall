/**
 * 饭泛之交 - Auth 注册认证
 * 模块化拆分自单文件原型
 */

// ==================== SPLASH / AUTH ====================
function switchAuthTab(type) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  if(typeof event !== 'undefined' && event && event.target) {
    event.target.classList.add('active');
  } else {
    document.querySelector('.auth-tab[onclick*="' + type + '"]')?.classList.add('active');
  }
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.getElementById(type+'-form').classList.add('active');
}

function sendCode(type) {
  const phone = document.getElementById(type+'-phone').value;
  const btn = document.getElementById(type+'-get-code');
  if(btn.disabled) return;
  
  btn.disabled = true;
  btn.textContent = '发送中...';
  
  MockAPI.sendSmsCode(phone)
    .then(res => {
      showToast('✅ 验证码已发送：123456');
      let sec = MockAPI.getSmsCooldown();
      const timer = setInterval(() => {
        sec = MockAPI.getSmsCooldown();
        if(sec <= 0) { clearInterval(timer); btn.disabled = false; btn.textContent = '获取验证码'; }
        else { btn.textContent = sec + 's'; }
      }, 1000);
    })
    .catch(err => {
      showToast('❌ ' + err.message);
      btn.disabled = false;
      btn.textContent = '获取验证码';
    });
}

function doLogin() {
  const phone = document.getElementById('login-phone').value;
  const code = document.getElementById('login-code').value;
  if(!phone || phone.length !== 11) { showToast('请输入正确的手机号'); return; }
  if(code !== '123456') { showToast('验证码错误（演示请输入123456）'); return; }
  completeLogin(phone);
}

function doRegister() {
  const inviteCode = document.getElementById('reg-invite').value.trim();
  const phone = document.getElementById('reg-phone').value;
  const code = document.getElementById('reg-code').value;
  const name = document.getElementById('reg-name').value;
  
  // 表单校验
  if(!inviteCode) { showToast('请输入邀请码'); return; }
  if(!phone || !/^1[3-9]\d{9}$/.test(phone)) { showToast('请输入正确的11位手机号'); return; }
  if(!code || code.length !== 6) { showToast('请输入6位验证码'); return; }
  if(code !== '123456') { showToast('验证码错误（演示请输入123456）'); return; }
  if(!name || name.length < 2) { showToast('昵称至少2个字符'); return; }
  
  const btn = (typeof event !== 'undefined' && event && event.target) ? event.target : document.querySelector('#register-form .btn-primary');
  btn.disabled = true;
  btn.textContent = '注册中...';
  
  // 先验证邀请码
  MockAPI.validateInviteCode(inviteCode)
    .then(() => MockAPI.register({ phone, name }))
    .then(res => {
      Store.user = {phone, name, avatar: '😊'};
      Store.data.invitedBy = inviteCode;
      Store.generateInvitationCodes(3);
      Store.setVerificationStatus('basic', 'verified');
      showToast('🎉 注册成功！已获得3个邀请码');
      btn.disabled = false;
      btn.textContent = '注册';
      goTo('survey-page');
      updateSurveyProgress(0);
    })
    .catch(err => {
      showToast('❌ ' + err.message);
      btn.disabled = false;
      btn.textContent = '注册';
    });
}

function completeLogin(phone) {
  Store.user = {phone, name: '美食家'+phone.slice(-4), avatar: '😊'};
  Store.isLoggedIn = true;
  document.getElementById('bottom-nav').style.display = 'flex';
  showToast('登录成功！');
  switchTab('home');
}

function logout() {
  Store.clear();
  document.getElementById('bottom-nav').style.display = 'none';
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('splash-page').classList.add('active');
  showToast('已退出登录');
}

function resetDemoData() {
  if(!confirm('确定要重置所有演示数据吗？这将清除你的约饭记录、聊天和信用分。')) return;
  const user = Store.user;
  const isLoggedIn = Store.isLoggedIn;
  Store.clear();
  Store.user = user;
  Store.isLoggedIn = isLoggedIn;
  showToast('演示数据已重置');
  renderProfile();
  renderChatList();
}

// ==================== SURVEY ====================
let surveyStep = 0;
function updateSurveyProgress(step) {
  document.getElementById('survey-bar').style.width = ((step+1)/5*100) + '%';
}
function selectSurvey(el, step, val) {
  const parent = el.parentElement;
  parent.querySelectorAll('.survey-option').forEach(o => o.classList.remove('selected'));
  el.classList.add('selected');
  Store.data.surveyAnswers[step] = val;
  Store.save();
  setTimeout(() => nextSurveyStep(step+1), 300);
}
function toggleMulti(el, val) {
  el.classList.toggle('selected');
  const arr = Store.data.surveyAnswers[3] || [];
  if(el.classList.contains('selected')) arr.push(val);
  else Store.data.surveyAnswers[3] = arr.filter(v => v !== val);
  Store.data.surveyAnswers[3] = arr;
  Store.save();
}
function nextSurveyStep(next) {
  if(next >= 5) return;
  document.querySelectorAll('.survey-step').forEach(s => s.classList.remove('active'));
  document.querySelector(`.survey-step[data-step="${next}"]`)?.classList.add('active');
  updateSurveyProgress(next);
}
function finishSurvey(el, val) {
  el.classList.add('selected');
  Store.data.surveyAnswers[4] = val;
  Store.surveyCompleted = true;
  Store.isLoggedIn = true;
  updateSurveyProgress(4);
  document.getElementById('bottom-nav').style.display = 'flex';
  showToast('问卷完成！为你生成灵魂标签中...');
  setTimeout(() => { switchTab('home'); }, 800);
}
function skipSurvey() {
  Store.isLoggedIn = true;
  Store.surveyCompleted = false;
  document.getElementById('bottom-nav').style.display = 'flex';
  switchTab('home');
}