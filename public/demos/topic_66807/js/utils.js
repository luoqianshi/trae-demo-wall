/* ============================================
   无聊APP · 工具函数
   ============================================ */

const U = {
  // 随机整数
  rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },

  // 随机选取
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },

  // 随机选取N个不重复
  pickN(arr, n) {
    const copy = [...arr];
    const result = [];
    for (let i = 0; i < n && copy.length; i++) {
      const idx = Math.floor(Math.random() * copy.length);
      result.push(copy.splice(idx, 1)[0]);
    }
    return result;
  },

  // toast 提示
  toast(msg, duration = 1800) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(U._toastTimer);
    U._toastTimer = setTimeout(() => el.classList.remove('show'), duration);
  },

  // 模态弹层
  modal(html) {
    const layer = document.getElementById('modal-layer');
    layer.innerHTML = `<div class="modal-box">${html}</div>`;
    layer.classList.remove('hide');
    layer.onclick = (e) => {
      if (e.target === layer) U.closeModal();
    };
  },
  closeModal() {
    const layer = document.getElementById('modal-layer');
    layer.classList.add('hide');
    layer.innerHTML = '';
  },

  // 加币
  addCoin(n) {
    DATA.me.coin += n;
    U.toast(`+${n} 无聊币 💰`);
    App.refreshProfile();
  },

  // 减币
  spendCoin(n) {
    if (DATA.me.coin < n) {
      U.toast('无聊币不足，去打工赚点吧！');
      return false;
    }
    DATA.me.coin -= n;
    App.refreshProfile();
    return true;
  },

  // 转义
  esc(str) {
    return String(str).replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
  },

  // 时分
  now() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  },

  // 当前小时
  hour() { return new Date().getHours(); },

  // 根据年龄推算"几零后"
  decade(age) {
    const year = new Date().getFullYear();
    const birthYear = year - age;
    const decade = Math.floor(birthYear / 10) * 10;
    return `${decade % 100}后`;
  },

  // 根据出生年推算"几零后"
  decadeByYear(birthYear) {
    const decade = Math.floor(birthYear / 10) * 10;
    return `${decade % 100}后`;
  },

  // 根据"几零后"反推一个默认出生年份
  yearFromDecade(decadeStr) {
    const n = parseInt(decadeStr);
    return 2000 + n;
  },

  // 根据年份返回生肖
  zodiacAnimal(year) {
    const animals = ['猴','鸡','狗','猪','鼠','牛','虎','兔','龙','蛇','马','羊'];
    return animals[year % 12];
  },

  // 当前时段：早餐/午餐/晚餐(17点后)/夜宵
  mealPeriod(h) {
    if (h === undefined) h = new Date().getHours();
    if (h >= 5 && h < 10) return '早餐';
    if (h >= 10 && h < 17) return '午餐';
    if (h >= 17 && h < 22) return '晚餐';
    return '夜宵';
  },

  // 抖动
  shake(el) {
    el.style.animation = 'none';
    el.offsetHeight;
    el.style.animation = 'shake .4s';
  },
};

window.U = U;
