// ====================================================================
//  族迹 · 注册页交互逻辑
// ====================================================================

// ---------- DOM 引用 ----------
const regForm = document.getElementById('registerForm');
const usernameInput = document.getElementById('regUsername');
const passwordInput = document.getElementById('regPassword');
const confirmPwdInput = document.getElementById('regConfirmPwd');
const familyNameInput = document.getElementById('regFamilyName');
const familyCodeInput = document.getElementById('regFamilyCode');
const togglePwdBtn = document.getElementById('togglePwd');
const registerBtn = document.getElementById('registerBtn');
const registerSpinner = document.getElementById('registerSpinner');
const toast = document.getElementById('toast');

const usernameError = document.getElementById('regUsernameError');
const passwordError = document.getElementById('regPasswordError');
const confirmError = document.getElementById('regConfirmError');
const nameError = document.getElementById('regNameError');
const familyNameError = document.getElementById('regFamilyNameError');
const familyCodeError = document.getElementById('regFamilyCodeError');

const aliveSelect = document.getElementById('regAlive');
const deathGroup = document.getElementById('regDeathGroup');

// ---------- 密码显隐切换 ----------
togglePwdBtn.addEventListener('click', function () {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  togglePwdBtn.textContent = isPassword ? '🙈' : '👁️';
});

// ---------- 在世/已故切换 ----------
aliveSelect.addEventListener('change', function () {
  deathGroup.style.display = this.value === '0' ? '' : 'none';
});

// ---------- 实时校验 ----------
usernameInput.addEventListener('input', validateUsername);
passwordInput.addEventListener('input', function () { validatePassword(); validateConfirm(); });
confirmPwdInput.addEventListener('input', validateConfirm);
document.getElementById('regName').addEventListener('input', validateName);
familyNameInput.addEventListener('input', validateFamilyName);
familyCodeInput.addEventListener('input', validateFamilyCode);

function addBlurValidation(input, validateFn) {
  input.addEventListener('blur', function () {
    if (this.value.trim()) {
      this.classList.toggle('success', validateFn());
      this.classList.toggle('error', !validateFn());
    }
  });
}
addBlurValidation(usernameInput, validateUsername);
addBlurValidation(passwordInput, validatePassword);
addBlurValidation(confirmPwdInput, validateConfirm);
addBlurValidation(familyNameInput, validateFamilyName);

familyCodeInput.addEventListener('blur', function () {
  const val = this.value.trim();
  if (val) {
    this.value = val.toUpperCase();
    this.classList.toggle('success', validateFamilyCode());
    this.classList.toggle('error', !validateFamilyCode());
  }
});

function validateUsername() {
  const val = usernameInput.value.trim();
  if (!val) { usernameError.textContent = '请输入账号'; return false; }
  if (val.length < 3) { usernameError.textContent = '账号至少需要 3 个字符'; return false; }
  if (getUserByUsername(val)) { usernameError.textContent = '该账号已被注册'; return false; }
  usernameError.textContent = '';
  return true;
}

function validatePassword() {
  const val = passwordInput.value;
  if (!val) { passwordError.textContent = '请输入密码'; return false; }
  if (val.length < 6) { passwordError.textContent = '密码长度不能少于 6 位'; return false; }
  passwordError.textContent = '';
  return true;
}

function validateConfirm() {
  const pwd = passwordInput.value;
  const confirm = confirmPwdInput.value;
  if (!confirm) { confirmError.textContent = '请再次输入密码'; return false; }
  if (pwd !== confirm) { confirmError.textContent = '两次密码输入不一致'; return false; }
  confirmError.textContent = '';
  return true;
}

function validateName() {
  const val = document.getElementById('regName').value.trim();
  if (!val) { nameError.textContent = '请输入姓名'; return false; }
  nameError.textContent = '';
  return true;
}

function validateFamilyName() {
  const val = familyNameInput.value.trim();
  if (!val) { familyNameError.textContent = '请输入家族名称'; return false; }
  if (val.length < 2) { familyNameError.textContent = '家族名称至少 2 个字符'; return false; }
  familyNameError.textContent = '';
  return true;
}

function validateFamilyCode() {
  const val = familyCodeInput.value.trim().toUpperCase();
  if (!val) { familyCodeError.textContent = '请输入家族编码'; return false; }
  if (val.length < 3 || val.length > 20) { familyCodeError.textContent = '编码需 3-20 位字母数字'; return false; }
  if (!/^[A-Z0-9]+$/.test(val)) { familyCodeError.textContent = '编码只能包含字母和数字'; return false; }
  if (getFamilyByCode(val)) { familyCodeError.textContent = '该编码已被使用'; return false; }
  familyCodeError.textContent = '';
  return true;
}

// ---------- localStorage 存储 ----------
const USER_STORAGE_KEY = 'zupu_dynamic_users';
const FAMILY_STORAGE_KEY = 'zupu_families';

function getAllUsers() {
  try { const raw = localStorage.getItem(USER_STORAGE_KEY); return raw ? JSON.parse(raw) : {}; }
  catch (e) { return {}; }
}

function getUserByUsername(username) {
  const all = getAllUsers();
  return all[username] || null;
}

function saveUser(username, userData) {
  const all = getAllUsers();
  all[username] = userData;
  try {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(all));
    localStorage.setItem('zupu_remember_user', username);
  } catch (e) { /* file:// 模式静默失败 */ }
}

function getFamilies() {
  try { const raw = localStorage.getItem(FAMILY_STORAGE_KEY); return raw ? JSON.parse(raw) : {}; }
  catch (e) { return {}; }
}

function getFamilyByCode(code) {
  const families = getFamilies();
  return families[code] || null;
}

function saveFamily(code, familyData) {
  const families = getFamilies();
  families[code] = familyData;
  try {
    localStorage.setItem(FAMILY_STORAGE_KEY, JSON.stringify(families));
  } catch (e) { /* file:// 模式静默失败 */ }
}

// ---------- 注册提交 ----------
regForm.addEventListener('submit', async function (e) {
  e.preventDefault();

  // 清除校验状态
  document.querySelectorAll('.reg-input, .reg-select').forEach(el => el.classList.remove('error', 'success'));
  familyCodeInput.value = familyCodeInput.value.trim().toUpperCase();

  const isUserValid = validateUsername();
  const isPwdValid = validatePassword();
  const isConfirmValid = validateConfirm();
  const isFamilyNameValid = validateFamilyName();
  const isFamilyCodeValid = validateFamilyCode();
  const isNameValid = validateName();

  if (!isUserValid) usernameInput.classList.add('error');
  if (!isPwdValid) passwordInput.classList.add('error');
  if (!isConfirmValid) confirmPwdInput.classList.add('error');
  if (!isFamilyNameValid) familyNameInput.classList.add('error');
  if (!isFamilyCodeValid) familyCodeInput.classList.add('error');
  if (!isNameValid) document.getElementById('regName').classList.add('error');

  if (!isUserValid || !isPwdValid || !isConfirmValid || !isFamilyNameValid || !isFamilyCodeValid || !isNameValid) return;

  setLoading(true);

  try {
    await mockRegister();
    showToast('注册成功，即将跳转登录……', 'success');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1500);
  } catch (err) {
    showToast(err.message || '注册失败，请重试', 'error');
  } finally {
    setLoading(false);
  }
});

function mockRegister() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const username = usernameInput.value.trim();
      const password = passwordInput.value;
      const familyCode = familyCodeInput.value.trim().toUpperCase();
      const familyName = familyNameInput.value.trim();
      const name = document.getElementById('regName').value.trim();
      const gender = document.getElementById('regGender').value;
      const genName = document.getElementById('regGenName').value.trim();
      const generation = parseInt(document.getElementById('regGeneration').value) || 1;
      const birthDate = document.getElementById('regBirth').value || null;
      const isAlive = parseInt(document.getElementById('regAlive').value);
      const deathDate = document.getElementById('regDeath').value || null;
      const birthPlace = document.getElementById('regBirthplace').value.trim();

      // 计算新用户 ID
      const allUsers = getAllUsers();
      const allFamilies = getFamilies();
      const maxExistingId = Math.max(
        100,
        ...Object.values(allUsers).map(u => u.userId || 0),
        0
      );
      const userId = maxExistingId + 1;

      // 保存用户（含 familyCode）
      saveUser(username, {
        password: password,
        userId: userId,
        name: name,
        familyCode: familyCode,
      });

      // 创建家族：以注册者为唯一成员（始祖）
      const member = {
        id: userId,
        familyId: 1,
        name: name,
        gender: gender,
        generationName: genName,
        generationOrder: generation,
        birthDate: birthDate,
        deathDate: deathDate,
        isAlive: isAlive,
        fatherId: null,
        motherId: null,
        birthPlace: birthPlace,
        biography: '',
      };

      saveFamily(familyCode, {
        code: familyCode,
        name: familyName,
        generationCount: 1,
        members: [member],
        spouses: [],
        rules: [],
      });

      resolve();
    }, 600 + Math.random() * 400);
  });
}

// ---------- Toast ----------
let toastTimer;
function showToast(message, type) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = 'toast ' + type + ' show';
  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
}

// ---------- Loading ----------
function setLoading(loading) {
  if (loading) {
    registerBtn.classList.add('loading');
    registerBtn.disabled = true;
  } else {
    registerBtn.classList.remove('loading');
    registerBtn.disabled = false;
  }
}
