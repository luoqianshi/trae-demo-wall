/* 省份数据（按拼音首字母排序） */
var provinces = [
  { name: '北京', pinyin: 'beijing', mode: '3+3' },
  { name: '海南', pinyin: 'hainan', mode: '3+3' },
  { name: '山东', pinyin: 'shandong', mode: '3+3' },
  { name: '上海', pinyin: 'shanghai', mode: '3+3' },
  { name: '天津', pinyin: 'tianjin', mode: '3+3' },
  { name: '浙江', pinyin: 'zhejiang', mode: '3+3' },
  { name: '安徽', pinyin: 'anhui', mode: '3+1+2' },
  { name: '重庆', pinyin: 'chongqing', mode: '3+1+2' },
  { name: '福建', pinyin: 'fujian', mode: '3+1+2' },
  { name: '甘肃', pinyin: 'gansu', mode: '3+1+2' },
  { name: '广东', pinyin: 'guangdong', mode: '3+1+2' },
  { name: '广西', pinyin: 'guangxi', mode: '3+1+2' },
  { name: '贵州', pinyin: 'guizhou', mode: '3+1+2' },
  { name: '河北', pinyin: 'hebei', mode: '3+1+2' },
  { name: '河南', pinyin: 'henan', mode: '3+1+2' },
  { name: '黑龙江', pinyin: 'heilongjiang', mode: '3+1+2' },
  { name: '湖北', pinyin: 'hubei', mode: '3+1+2' },
  { name: '湖南', pinyin: 'hunan', mode: '3+1+2' },
  { name: '吉林', pinyin: 'jilin', mode: '3+1+2' },
  { name: '江苏', pinyin: 'jiangsu', mode: '3+1+2' },
  { name: '江西', pinyin: 'jiangxi', mode: '3+1+2' },
  { name: '辽宁', pinyin: 'liaoning', mode: '3+1+2' },
  { name: '内蒙古', pinyin: 'neimenggu', mode: '3+1+2' },
  { name: '宁夏', pinyin: 'ningxia', mode: '3+1+2' },
  { name: '青海', pinyin: 'qinghai', mode: '3+1+2' },
  { name: '山西', pinyin: 'shanxi', mode: '3+1+2' },
  { name: '陕西', pinyin: 'shaanxi', mode: '3+1+2' },
  { name: '四川', pinyin: 'sichuan', mode: '3+1+2' },
  { name: '西藏', pinyin: 'xizang', mode: '3+1+2' },
  { name: '新疆', pinyin: 'xinjiang', mode: '3+1+2' },
  { name: '云南', pinyin: 'yunnan', mode: '3+1+2' }
];

/* 获取用户列表 */
function getUsers() {
  var users = localStorage.getItem('users');
  return users ? JSON.parse(users) : [];
}

/* 保存用户列表 */
function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}

/* 获取首字母 */
function getFirstLetter(pinyin) {
  return pinyin.charAt(0).toUpperCase();
}

/* 初始化省份选择器 */
function initProvinceSelector() {
  var listEl = document.getElementById('provinceList');
  var indexEl = document.getElementById('provinceIndex');
  var letters = [];
  var html = '';
  var indexHtml = '';

  for (var i = 0; i < provinces.length; i++) {
    var p = provinces[i];
    var letter = getFirstLetter(p.pinyin);
    var showLetter = letters.indexOf(letter) === -1;

    if (showLetter) {
      letters.push(letter);
      html += '<div class="province-letter-header" data-letter="' + letter + '">' + letter + '</div>';
    }

    html += '<div class="province-item" data-name="' + p.name + '" data-pinyin="' + p.pinyin + '" onclick="selectProvince(\'' + p.name + '\', \'' + p.mode + '\')">';
    html += p.name + '<span class="pinyin">' + p.pinyin + '</span></div>';
  }

  for (var j = 0; j < letters.length; j++) {
    indexHtml += '<div class="index-letter" onclick="scrollToLetter(\'' + letters[j] + '\')">' + letters[j] + '</div>';
  }

  listEl.innerHTML = html;
  indexEl.innerHTML = indexHtml;
}

/* 展开/收起下拉框 */
function toggleProvinceList() {
  var selector = document.getElementById('provinceSelector');
  selector.classList.toggle('open');

  if (selector.classList.contains('open')) {
    document.getElementById('provinceSearch').value = '';
    filterProvinces();
  }
}

/* 选择省份 */
function selectProvince(name, mode) {
  document.getElementById('selectedProvince').textContent = name + ' (' + mode + ')';
  document.getElementById('province').value = name;

  var items = document.querySelectorAll('#provinceList .province-item');
  for (var i = 0; i < items.length; i++) {
    items[i].classList.remove('selected');
    if (items[i].dataset.name === name) {
      items[i].classList.add('selected');
    }
  }

  document.getElementById('provinceSelector').classList.remove('open');
}

/* 搜索过滤 */
function filterProvinces() {
  var keyword = document.getElementById('provinceSearch').value.toLowerCase();
  var items = document.querySelectorAll('#provinceList .province-item');
  var headers = document.querySelectorAll('#provinceList .province-letter-header');

  for (var i = 0; i < items.length; i++) {
    var name = items[i].dataset.name;
    var pinyin = items[i].dataset.pinyin;
    var match = name.indexOf(keyword) > -1 || pinyin.indexOf(keyword) > -1;
    items[i].style.display = match ? '' : 'none';
  }

  for (var j = 0; j < headers.length; j++) {
    var letter = headers[j].dataset.letter;
    var hasVisible = false;
    var nextItems = headers[j].nextElementSibling;
    while (nextItems && !nextItems.classList.contains('province-letter-header')) {
      if (nextItems.style.display !== 'none') {
        hasVisible = true;
        break;
      }
      nextItems = nextItems.nextElementSibling;
    }
    headers[j].style.display = hasVisible ? '' : 'none';
  }
}

/* 点击字母跳转 */
function scrollToLetter(letter) {
  var headers = document.querySelectorAll('#provinceList .province-letter-header');

  for (var i = 0; i < headers.length; i++) {
    if (headers[i].dataset.letter === letter) {
      headers[i].scrollIntoView({ behavior: 'smooth', block: 'start' });
      break;
    }
  }

  var letters = document.querySelectorAll('#provinceIndex .index-letter');
  for (var j = 0; j < letters.length; j++) {
    letters[j].classList.remove('active');
    if (letters[j].textContent === letter) {
      letters[j].classList.add('active');
    }
  }
}

/* 切换到注册 */
function switchToRegister() {
  document.querySelector('.login-form').style.display = 'none';
  document.getElementById('registerForm').style.display = 'block';
  document.querySelector('.nav-title').textContent = '注册';
}

/* 切换到登录 */
function switchToLogin() {
  document.getElementById('registerForm').style.display = 'none';
  document.querySelector('.login-form').style.display = 'block';
  document.querySelector('.nav-title').textContent = '登录';
}

/* 注册 */
function doRegister() {
  var province = document.getElementById('province').value;
  var u = document.getElementById('regUsername').value.trim();
  var p = document.getElementById('regPassword').value.trim();
  var p2 = document.getElementById('regPassword2').value.trim();

  if (!province) { alert('请选择高考省份'); return; }
  if (!u) { alert('请输入用户名'); return; }
  if (!p) { alert('请输入密码'); return; }
  if (p.length < 6) { alert('密码至少6位'); return; }
  if (p !== p2) { alert('两次输入的密码不一致'); return; }

  var users = getUsers();
  for (var i = 0; i < users.length; i++) {
    if (users[i].username === u) {
      alert('该用户名已被注册');
      return;
    }
  }

  var mode = '';
  for (var j = 0; j < provinces.length; j++) {
    if (provinces[j].name === province) {
      mode = provinces[j].mode;
      break;
    }
  }

  users.push({
    username: u,
    password: p,
    province: province,
    mode: mode,
    createdAt: new Date().toISOString()
  });

  saveUsers(users);

  localStorage.setItem('province', province);
  localStorage.setItem('mode', mode);
  localStorage.setItem('username', u);

  alert('注册成功！欢迎加入选科导航仪');
  location.href = '../index.html';
}

/* 登录验证 */
function doLogin() {
  var province = document.getElementById('province').value;
  var u = document.getElementById('username').value.trim();
  var p = document.getElementById('password').value.trim();

  if (!province) { alert('请选择高考省份'); return; }
  if (!u || !p) { alert('请输入用户名和密码'); return; }

  var users = getUsers();
  var found = false;
  var userMode = '';

  for (var i = 0; i < users.length; i++) {
    if (users[i].username === u && users[i].password === p) {
      found = true;
      userMode = users[i].mode;
      break;
    }
  }

  if (!found) {
    alert('用户名或密码错误');
    return;
  }

  var mode = '';
  for (var j = 0; j < provinces.length; j++) {
    if (provinces[j].name === province) {
      mode = provinces[j].mode;
      break;
    }
  }

  localStorage.setItem('province', province);
  localStorage.setItem('mode', mode);
  localStorage.setItem('username', u);

  alert('登录成功！欢迎回来，' + u + '\n你的省份：' + province + '（' + mode + '模式）');
  location.href = '../index.html';
}

/* 访客登录 */
function guestLogin() {
  var province = document.getElementById('province').value;

  if (!province) { alert('请选择高考省份后再继续'); return; }

  var mode = '';
  for (var i = 0; i < provinces.length; i++) {
    if (provinces[i].name === province) {
      mode = provinces[i].mode;
      break;
    }
  }

  localStorage.setItem('province', province);
  localStorage.setItem('mode', mode);
  localStorage.removeItem('username');

  location.href = '../index.html';
}

/* 点击外部关闭 */
document.addEventListener('click', function (e) {
  var selector = document.getElementById('provinceSelector');
  if (selector && !selector.contains(e.target)) {
    selector.classList.remove('open');
  }
});

/* 页面加载时初始化 */
window.onload = function () {
  initProvinceSelector();
};