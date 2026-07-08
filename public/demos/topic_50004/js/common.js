/**
 * 安伴守护 - 公共工具模块 V3
 * 存储、加密模拟、硬件API封装、账号体系、CRUD操作、预设数据
 */

const AnBan = {
  // ============================
  // 存储工具
  // ============================
  storage: {
    get(key) {
      try {
        var raw = localStorage.getItem('anban_' + key);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (e) { return null; }
    },
    set(key, value) {
      try {
        localStorage.setItem('anban_' + key, JSON.stringify(value));
        return true;
      } catch (e) { return false; }
    },
    remove(key) {
      localStorage.removeItem('anban_' + key);
    },
    clearAll() {
      Object.keys(localStorage).forEach(function(k) {
        if (k.startsWith('anban_')) localStorage.removeItem(k);
      });
    }
  },

  // ============================
  // 模拟加密
  // ============================
  crypto: {
    encrypt(text) {
      try { return btoa(unescape(encodeURIComponent(text))); }
      catch (e) { return text; }
    },
    decrypt(encoded) {
      try { return decodeURIComponent(escape(atob(encoded))); }
      catch (e) { return encoded; }
    },
    mask(text) {
      if (!text || text.length <= 4) return '****';
      return text.substring(0, 3) + '****' + text.substring(text.length - 4);
    },
    maskId(text) {
      if (!text || text.length <= 8) return '****';
      return text.substring(0, 3) + '***********' + text.substring(text.length - 4);
    }
  },

  // ============================
  // 硬件 API
  // ============================
  hardware: {
    vibrate(pattern) {
      if (navigator.vibrate) navigator.vibrate(pattern || [100, 50, 100]);
    },
    speak(text, rate) {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = 'zh-CN'; u.rate = rate || 0.9; u.volume = 1;
      window.speechSynthesis.speak(u);
    },
    stopSpeaking() {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    },
    // 录音相关
    _recorder: null,
    _audioChunks: [],
    recordAudio() {
      var self = this;
      return new Promise(function(resolve, reject) {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          // Demo fallback: simulate recording
          resolve({ data: 'data:audio/webm;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQoGAACAgICAgICAgICAgICA', duration: 3 });
          return;
        }
        navigator.mediaDevices.getUserMedia({ audio: true }).then(function(stream) {
          self._audioChunks = [];
          self._recorder = new MediaRecorder(stream);
          self._recorder.ondataavailable = function(e) { self._audioChunks.push(e.data); };
          self._recorder.onstop = function() {
            var blob = new Blob(self._audioChunks, { type: 'audio/webm' });
            stream.getTracks().forEach(function(t) { t.stop(); });
            var reader = new FileReader();
            reader.onloadend = function() {
              resolve({ data: reader.result, duration: Math.round(blob.size / 16000) || 3 });
            };
            reader.readAsDataURL(blob);
          };
          self._recorder.start();
        }).catch(function() {
          // Fallback for demo
          resolve({ data: 'data:audio/webm;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABAAZGF0YQoGAACAgICAgICAgICAgICA', duration: 3 });
        });
      });
    },
    stopRecording() {
      if (this._recorder && this._recorder.state === 'recording') {
        this._recorder.stop();
      }
    },
    isRecording() {
      return this._recorder && this._recorder.state === 'recording';
    },
    playAudio(base64Data) {
      if (!base64Data) return;
      var audio = new Audio(base64Data);
      audio.play().catch(function() {});
    }
  },

  // ============================
  // UI 工具
  // ============================
  ui: {
    toast(message, duration) {
      var d = duration || 2000;
      var old = document.querySelector('.toast');
      if (old) old.remove();
      var t = document.createElement('div');
      t.className = 'toast'; t.textContent = message;
      var frame = document.querySelector('.phone-frame') || document.querySelector('.phone');
      (frame || document.body).appendChild(t);
      setTimeout(function() {
        t.style.opacity = '0'; t.style.transition = 'opacity 0.3s';
        setTimeout(function() { t.remove(); }, 300);
      }, d);
    },
    showOverlay(id) {
      var el = document.getElementById(id);
      if (el) { el.classList.add('active', 'on'); el.style.display = 'flex'; }
    },
    hideOverlay(id) {
      var el = document.getElementById(id);
      if (el) { el.classList.remove('active', 'on'); el.style.display = 'none'; }
    },
    showView(viewId) {
      document.querySelectorAll('.view').forEach(function(v) { v.style.display = 'none'; });
      var target = document.getElementById(viewId);
      if (target) { target.style.display = 'block'; target.style.animation = 'fadeIn 0.3s ease'; }
    },
    updateTime() {
      var now = new Date();
      var str = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
      document.querySelectorAll('.sbar .time, .status-bar .time').forEach(function(el) {
        el.textContent = str;
      });
    },
    formatDate(d) {
      var days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      var dt = d || new Date();
      return String(dt.getMonth() + 1).padStart(2, '0') + '月' +
        String(dt.getDate()).padStart(2, '0') + '日 ' + days[dt.getDay()];
    },
    formatTime(d) {
      var dt = d || new Date();
      return String(dt.getHours()).padStart(2, '0') + ':' + String(dt.getMinutes()).padStart(2, '0');
    },
    /** 确认弹窗 */
    confirm(message, onConfirm, onCancel) {
      var overlay = document.getElementById('confirmOverlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'confirmOverlay';
        overlay.className = 'overlay';
        overlay.innerHTML = '<div class="overlay-content text-center">' +
          '<div id="confirmMsg" style="font-size:14px;line-height:1.6;margin-bottom:20px"></div>' +
          '<div style="display:flex;gap:10px">' +
          '<button class="btn btn-outline" style="flex:1" id="confirmCancel">取消</button>' +
          '<button class="btn btn-danger" style="flex:1" id="confirmOk">确定</button>' +
          '</div></div>';
        var frame = document.querySelector('.phone-frame') || document.querySelector('.phone');
        (frame || document.body).appendChild(overlay);
      }
      document.getElementById('confirmMsg').textContent = message;
      AnBan.ui.showOverlay('confirmOverlay');
      document.getElementById('confirmOk').onclick = function() {
        AnBan.ui.hideOverlay('confirmOverlay');
        if (onConfirm) onConfirm();
      };
      document.getElementById('confirmCancel').onclick = function() {
        AnBan.ui.hideOverlay('confirmOverlay');
        if (onCancel) onCancel();
      };
    }
  },

  // ============================
  // 账号体系
  // ============================
  auth: {
    /** 登录：自动判断注册/角色 */
    login(phone) {
      var accounts = AnBan.storage.get('accounts') || [];
      var account = accounts.find(function(a) { return a.phone === phone; });
      if (!account) {
        // 未注册 → 自动注册为监护人
        account = { phone: phone, type: 'guardian', name: '', guardianPhone: null, createdAt: new Date().toISOString().slice(0, 10) };
        accounts.push(account);
        AnBan.storage.set('accounts', accounts);
        // 监护人手机号自动设为默认接听号码
        var phones = AnBan.storage.get('answerPhones');
        if (!phones || !phones.length) {
          AnBan.storage.set('answerPhones', [phone]);
        }
      }
      AnBan.storage.set('currentUser', account);
      return account;
    },
    logout() {
      AnBan.storage.remove('currentUser');
      window.location.href = 'index.html';
    },
    getCurrentUser() {
      return AnBan.storage.get('currentUser') || null;
    },
    isGuardian() {
      var u = this.getCurrentUser();
      return u && u.type === 'guardian';
    },
    isWard() {
      var u = this.getCurrentUser();
      return u && u.type === 'ward';
    },
    getWardPhone() {
      var u = this.getCurrentUser();
      return u ? u.phone : null;
    },
    getGuardianPhone() {
      var u = this.getCurrentUser();
      if (!u) return null;
      return u.type === 'guardian' ? u.phone : u.guardianPhone;
    },
    /** 添加被监护人账号 */
    addWardAccount(phone, name, guardianPhone) {
      var accounts = AnBan.storage.get('accounts') || [];
      var exists = accounts.find(function(a) { return a.phone === phone; });
      if (exists) return null; // 已存在
      var account = { phone: phone, type: 'ward', name: name, guardianPhone: guardianPhone, createdAt: new Date().toISOString().slice(0, 10) };
      accounts.push(account);
      AnBan.storage.set('accounts', accounts);
      return account;
    },
    /** 注销被监护人 */
    deleteWard(wardId) {
      var ward = AnBan.data.getWard(wardId);
      if (!ward) return;
      // 删除账号
      var accounts = AnBan.storage.get('accounts') || [];
      accounts = accounts.filter(function(a) { return !(a.type === 'ward' && a.phone === ward.phone); });
      AnBan.storage.set('accounts', accounts);
      // 删除被监护人数据
      var wards = AnBan.storage.get('wards') || [];
      wards = wards.filter(function(w) { return w.id !== wardId; });
      AnBan.storage.set('wards', wards);
      // 删除关联提醒
      var reminders = AnBan.storage.get('reminders') || [];
      reminders = reminders.filter(function(r) { return r.wardId !== wardId; });
      AnBan.storage.set('reminders', reminders);
      // 删除关联安全区域
      var zones = AnBan.storage.get('safeZones') || [];
      zones = zones.filter(function(z) { return z.wardId !== wardId; });
      AnBan.storage.set('safeZones', zones);
      // 删除打卡记录
      var checkins = AnBan.storage.get('checkinRecords') || [];
      checkins = checkins.filter(function(c) { return c.wardId !== wardId; });
      AnBan.storage.set('checkinRecords', checkins);
      // 删除SOS记录
      var sos = AnBan.storage.get('sosRecords') || [];
      sos = sos.filter(function(s) { return s.wardId !== wardId; });
      AnBan.storage.set('sosRecords', sos);
      // 切换当前选中
      var currentId = AnBan.data.getCurrentWardId();
      if (currentId === wardId) {
        var remaining = AnBan.storage.get('wards') || [];
        AnBan.data.setCurrentWardId(remaining.length > 0 ? remaining[0].id : '');
      }
    },
    /** 注销监护人（清空所有数据） */
    deleteGuardian() {
      AnBan.storage.clearAll();
    }
  },

  // ============================
  // 数据操作（CRUD）
  // ============================
  data: {
    // ── 被监护人 CRUD ──
    getWards() { return AnBan.storage.get('wards') || []; },
    getWard(id) { return this.getWards().find(function(w) { return w.id === id; }) || null; },
    getWardByPhone(phone) { return this.getWards().find(function(w) { return w.phone === phone; }) || null; },
    getCurrentWardId() { return AnBan.storage.get('currentWardId') || (this.getWards()[0] ? this.getWards()[0].id : ''); },
    setCurrentWardId(id) { AnBan.storage.set('currentWardId', id); },
    addWard(ward) {
      var wards = this.getWards();
      ward.id = 'w' + Date.now();
      wards.push(ward);
      AnBan.storage.set('wards', wards);
      return ward;
    },
    updateWard(id, updates) {
      var wards = this.getWards();
      var idx = wards.findIndex(function(w) { return w.id === id; });
      if (idx >= 0) { Object.assign(wards[idx], updates); AnBan.storage.set('wards', wards); }
    },

    // ── 接听号码（全局） ──
    getAnswerPhones() { return AnBan.storage.get('answerPhones') || []; },
    getPrimaryPhone() {
      var list = this.getAnswerPhones();
      return list.length > 0 ? list[0] : null;
    },
    addAnswerPhone(phone) {
      var list = this.getAnswerPhones();
      if (list.indexOf(phone) === -1) {
        list.push(phone);
        AnBan.storage.set('answerPhones', list);
        return true;
      }
      return false;
    },
    removeAnswerPhone(idx) {
      var list = this.getAnswerPhones();
      if (idx > 0 && idx < list.length) { // idx=0 是默认号码不可删
        list.splice(idx, 1);
        AnBan.storage.set('answerPhones', list);
      }
    },
    setPrimaryPhone(idx) {
      var list = this.getAnswerPhones();
      if (idx > 0 && idx < list.length) {
        var tmp = list[0];
        list[0] = list[idx];
        list[idx] = tmp;
        AnBan.storage.set('answerPhones', list);
      }
    },

    // ── 提醒 CRUD ──
    getReminders(wardId) {
      var all = AnBan.storage.get('reminders') || [];
      if (wardId) return all.filter(function(r) { return r.wardId === wardId; });
      return all;
    },
    getEnabledReminders(wardId) {
      return this.getReminders(wardId).filter(function(r) { return r.enabled; });
    },
    addReminder(reminder) {
      var all = AnBan.storage.get('reminders') || [];
      all.push(reminder);
      AnBan.storage.set('reminders', all);
    },
    updateReminder(wardId, idx, updates) {
      var all = AnBan.storage.get('reminders') || [];
      var filtered = all.filter(function(r) { return r.wardId === wardId; });
      if (idx >= 0 && idx < filtered.length) {
        var target = filtered[idx];
        var globalIdx = all.indexOf(target);
        if (globalIdx >= 0) Object.assign(all[globalIdx], updates);
        AnBan.storage.set('reminders', all);
      }
    },
    deleteReminder(wardId, idx) {
      var all = AnBan.storage.get('reminders') || [];
      var filtered = all.filter(function(r) { return r.wardId === wardId; });
      if (idx >= 0 && idx < filtered.length) {
        var globalIdx = all.indexOf(filtered[idx]);
        if (globalIdx >= 0) all.splice(globalIdx, 1);
        AnBan.storage.set('reminders', all);
      }
    },

    // ── 安全区域 CRUD ──
    getSafeZones(wardId) {
      var all = AnBan.storage.get('safeZones') || [];
      if (wardId) return all.filter(function(z) { return z.wardId === wardId; });
      return all;
    },
    addSafeZone(zone) {
      var all = AnBan.storage.get('safeZones') || [];
      all.push(zone);
      AnBan.storage.set('safeZones', all);
    },
    updateSafeZone(wardId, idx, updates) {
      var all = AnBan.storage.get('safeZones') || [];
      var filtered = all.filter(function(z) { return z.wardId === wardId; });
      if (idx >= 0 && idx < filtered.length) {
        var globalIdx = all.indexOf(filtered[idx]);
        if (globalIdx >= 0) Object.assign(all[globalIdx], updates);
        AnBan.storage.set('safeZones', all);
      }
    },
    deleteSafeZone(wardId, idx) {
      var all = AnBan.storage.get('safeZones') || [];
      var filtered = all.filter(function(z) { return z.wardId === wardId; });
      if (idx >= 0 && idx < filtered.length) {
        var globalIdx = all.indexOf(filtered[idx]);
        if (globalIdx >= 0) all.splice(globalIdx, 1);
        AnBan.storage.set('safeZones', all);
      }
    },

    // ── 打卡记录 ──
    getCheckins(wardId) {
      var all = AnBan.storage.get('checkinRecords') || [];
      if (wardId) return all.filter(function(r) { return r.wardId === wardId; });
      return all;
    },
    addCheckin(wardId, location, zoneName) {
      var records = AnBan.storage.get('checkinRecords') || [];
      var now = new Date();
      records.unshift({
        wardId: wardId, time: AnBan.ui.formatTime(now), date: AnBan.ui.formatDate(now),
        location: location, zone: zoneName || null, status: zoneName ? 'safe' : 'outOfRange',
        timestamp: now.getTime()
      });
      AnBan.storage.set('checkinRecords', records);
      return records[0];
    },
    getLastCheckinTime(wardId) {
      var records = this.getCheckins(wardId);
      if (records.length > 0 && records[0].timestamp) return records[0].timestamp;
      return 0;
    },

    // ── SOS 记录 ──
    getSosRecords(wardId) {
      var all = AnBan.storage.get('sosRecords') || [];
      if (wardId) return all.filter(function(r) { return r.wardId === wardId; });
      return all;
    },
    addSosRecord(wardId, location) {
      var records = AnBan.storage.get('sosRecords') || [];
      var now = new Date();
      records.unshift({
        wardId: wardId, time: AnBan.ui.formatTime(now), date: AnBan.ui.formatDate(now),
        location: location, resolved: false
      });
      AnBan.storage.set('sosRecords', records);
    },

    // ── 提醒响应 ──
    getRespondedToday(wardId) {
      var key = 'responded_' + wardId + '_' + new Date().toISOString().slice(0, 10);
      return AnBan.storage.get(key) || [];
    },
    markResponded(wardId, reminderIdx) {
      var key = 'responded_' + wardId + '_' + new Date().toISOString().slice(0, 10);
      var list = AnBan.storage.get(key) || [];
      if (list.indexOf(reminderIdx) === -1) list.push(reminderIdx);
      AnBan.storage.set(key, list);
    },

    // ── 锁机/学习模式 ──
    getLockMode() { return AnBan.storage.get('lockMode') || false; },
    setLockMode(v) { AnBan.storage.set('lockMode', v); },
    getStudyMode() { return AnBan.storage.get('studyMode') || false; },
    setStudyMode(v) { AnBan.storage.set('studyMode', v); },

    // ── 定位模拟 ──
    simulateLocation(safeZone) {
      if (!safeZone) {
        return { lat: 30.28 + (Math.random() - 0.5) * 0.05, lng: 120.15 + (Math.random() - 0.5) * 0.05, address: '文一西路与紫荆花路交叉口' };
      }
      return { lat: safeZone.lat + (Math.random() - 0.5) * 0.002, lng: safeZone.lng + (Math.random() - 0.5) * 0.002, address: safeZone.address };
    },
    isInSafeZone(lat, lng, wardId) {
      var zones = this.getSafeZones(wardId);
      for (var i = 0; i < zones.length; i++) {
        var z = zones[i];
        var dx = (lng - z.lng) * 111000 * Math.cos(z.lat * Math.PI / 180);
        var dy = (lat - z.lat) * 111000;
        var dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= z.radius) return z;
      }
      return null;
    }
  },

  // ============================
  // 预设数据
  // ============================
  defaultData: {
    accounts: [
      { phone: '13812345678', type: 'guardian', name: '王建设', guardianPhone: null, createdAt: '2026-06-20' },
      { phone: '13900001111', type: 'ward', name: '王秀兰', guardianPhone: '13812345678', createdAt: '2026-06-20' },
      { phone: '13900002222', type: 'ward', name: '王建国', guardianPhone: '13812345678', createdAt: '2026-06-20' },
      { phone: '13900003333', type: 'ward', name: '李明轩', guardianPhone: '13812345678', createdAt: '2026-06-21' },
      { phone: '13900004444', type: 'ward', name: '李思琪', guardianPhone: '13812345678', createdAt: '2026-06-21' },
      { phone: '13900005555', type: 'ward', name: '张美华', guardianPhone: '13812345678', createdAt: '2026-06-22' }
    ],

    wards: [
      { id: 'w1', phone: '13900001111', name: '王秀兰', relation: '妈妈', type: 'elderly',
        age: 82, gender: '女', status: 'safe', lastCheckin: '昨天',
        height: '160cm', weight: '55kg', bloodType: 'A',
        features: '左耳后有黑痣，短发，常穿红色外套',
        chronicDiseases: '高血压、糖尿病', medications: '氨氯地平 5mg 每日1次, 二甲双胍 500mg 每日2次',
        allergy: '青霉素过敏', idCard: '310106194403152031', address: '翠苑街道幸福小区3号楼601室', photos: 3, mandatoryCheckin: true },
      { id: 'w2', phone: '13900002222', name: '王建国', relation: '爸爸', type: 'elderly',
        age: 78, gender: '男', status: 'warning', lastCheckin: '昨天',
        height: '172cm', weight: '68kg', bloodType: 'B',
        features: '戴眼镜，头发花白',
        chronicDiseases: '冠心病', medications: '阿司匹林 100mg 每日1次', idCard: '310106194807250412', address: '建国路88号3栋502室', photos: 2 },
      { id: 'w3', phone: '13900003333', name: '李明轩', relation: '儿子', type: 'child',
        age: 10, gender: '男', status: 'safe', lastCheckin: '1小时前',
        height: '140cm', weight: '35kg', bloodType: 'O',
        features: '圆脸，戴蓝色眼镜', school: '翠苑小学 四年级1班', idCard: '310106201605120033', address: '翠苑街道幸福小区3号楼601室', photos: 4 },
      { id: 'w4', phone: '13900004444', name: '李思琪', relation: '女儿', type: 'child',
        age: 8, gender: '女', status: 'offline', lastCheckin: '3天前',
        height: '128cm', weight: '26kg', bloodType: 'AB',
        features: '双马尾辫，戴粉色发卡', school: '翠苑小学 二年级3班', idCard: '310106201810080044', address: '翠苑街道幸福小区3号楼601室', photos: 2 },
      { id: 'w5', phone: '13900005555', name: '张美华', relation: '外婆', type: 'elderly',
        age: 85, gender: '女', status: 'safe', lastCheckin: '30分钟前',
        height: '155cm', weight: '50kg', bloodType: 'A',
        features: '银发盘发，戴玉手镯',
        chronicDiseases: '骨质疏松', medications: '钙片 每日1次', idCard: '310106194101050028', address: '拱墅区幸福里6号楼302室', photos: 3 }
    ],

    answerPhones: ['13812345678', '13698765432'],

    reminders: [
      { wardId: 'w1', name: '吃降压药', time: '08:00', cycle: '每天', color: '#2f81f7', enabled: true, audio: null },
      { wardId: 'w1', name: '测量血压', time: '09:00', cycle: '每天', color: '#d29922', enabled: true, audio: null },
      { wardId: 'w1', name: '出门散步', time: '16:00', cycle: '周一至周五', color: '#3fb950', enabled: true, audio: null },
      { wardId: 'w1', name: '吃降糖药', time: '20:00', cycle: '每天', color: '#2f81f7', enabled: true, audio: null },
      { wardId: 'w2', name: '吃阿司匹林', time: '08:00', cycle: '每天', color: '#2f81f7', enabled: true, audio: null },
      { wardId: 'w2', name: '测量心率', time: '10:00', cycle: '每天', color: '#d29922', enabled: true, audio: null },
      { wardId: 'w3', name: '按时回家', time: '16:30', cycle: '周一至周五', color: '#d29922', enabled: true, audio: null },
      { wardId: 'w3', name: '完成作业', time: '17:00', cycle: '周一至周五', color: '#2f81f7', enabled: true, audio: null },
      { wardId: 'w3', name: '睡前刷牙', time: '21:00', cycle: '每天', color: '#bc8cff', enabled: true, audio: null },
      { wardId: 'w5', name: '吃钙片', time: '09:00', cycle: '每天', color: '#2f81f7', enabled: true, audio: null },
      { wardId: 'w5', name: '晨间散步', time: '07:00', cycle: '每天', color: '#3fb950', enabled: true, audio: null }
    ],

    safeZones: [
      { wardId: 'w1', name: '翠苑小区（家）', address: '翠苑街道幸福小区3号楼', radius: 500, lat: 30.2741, lng: 120.1307 },
      { wardId: 'w1', name: '翠苑街道卫生中心', address: '翠苑街道和平路188号', radius: 200, lat: 30.2760, lng: 120.1280 },
      { wardId: 'w2', name: '建国路小区（家）', address: '建国路88号', radius: 500, lat: 30.2680, lng: 120.1400 },
      { wardId: 'w3', name: '翠苑小学', address: '翠苑街道学院路56号', radius: 300, lat: 30.2800, lng: 120.1250 },
      { wardId: 'w3', name: '翠苑小区（家）', address: '翠苑街道幸福小区3号楼', radius: 500, lat: 30.2741, lng: 120.1307 },
      { wardId: 'w4', name: '翠苑小学', address: '翠苑街道学院路56号', radius: 300, lat: 30.2800, lng: 120.1250 },
      { wardId: 'w5', name: '幸福里小区（家）', address: '拱墅区幸福里6号楼', radius: 400, lat: 30.3050, lng: 120.1180 }
    ],

    checkinTemplates: [
      { wardId: 'w1', time: '08:32', daysAgo: 1, location: '翠苑街道社区卫生服务中心', zone: '翠苑街道卫生中心', status: 'safe' },
      { wardId: 'w1', time: '07:15', daysAgo: 1, location: '翠苑小区北门', zone: '翠苑小区（家）', status: 'safe' },
      { wardId: 'w1', time: '18:40', daysAgo: 2, location: '文一西路与紫荆花路交叉口', zone: null, status: 'outOfRange' },
      { wardId: 'w1', time: '08:20', daysAgo: 2, location: '翠苑街道社区卫生服务中心', zone: '翠苑街道卫生中心', status: 'safe' },
      { wardId: 'w1', time: '09:05', daysAgo: 3, location: '翠苑小区南门', zone: '翠苑小区（家）', status: 'safe' },
      { wardId: 'w2', time: '14:20', daysAgo: 1, location: '建国路小区门口', zone: '建国路小区（家）', status: 'safe' },
      { wardId: 'w2', time: '08:10', daysAgo: 1, location: '杭州市第一人民医院', zone: null, status: 'outOfRange' },
      { wardId: 'w3', time: '16:35', daysAgo: 0, location: '翠苑小学门口', zone: '翠苑小学', status: 'safe' },
      { wardId: 'w3', time: '07:40', daysAgo: 0, location: '翠苑小区', zone: '翠苑小区（家）', status: 'safe' },
      { wardId: 'w3', time: '16:30', daysAgo: 1, location: '翠苑小学', zone: '翠苑小学', status: 'safe' },
      { wardId: 'w4', time: '08:00', daysAgo: 3, location: '翠苑小区', zone: '翠苑小区（家）', status: 'safe' },
      { wardId: 'w5', time: '09:10', daysAgo: 0, location: '幸福里小区花园', zone: '幸福里小区（家）', status: 'safe' },
      { wardId: 'w5', time: '07:05', daysAgo: 0, location: '幸福里小区', zone: '幸福里小区（家）', status: 'safe' }
    ],

    sosTemplates: [
      { wardId: 'w1', time: '22:15', daysAgo: 5, location: '翠苑小区3号楼', resolved: true },
      { wardId: 'w3', time: '17:30', daysAgo: 7, location: '翠苑小学操场', resolved: true }
    ],

    lockMode: false,
    studyMode: false
  },

  // ============================
  // 日期工具
  // ============================
  _formatDateAgo(daysAgo) {
    var days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    var d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return String(d.getMonth() + 1).padStart(2, '0') + '月' +
      String(d.getDate()).padStart(2, '0') + '日 ' + days[d.getDay()];
  },

  // ============================
  // 初始化
  // ============================
  init() {
    // 首次加载：写入所有预设数据（包括动态生成日期的模板数据）
    if (!this.storage.get('initialized')) {
      var checkins = this.defaultData.checkinTemplates.map(function(t) {
        return { wardId: t.wardId, time: t.time, date: AnBan._formatDateAgo(t.daysAgo), location: t.location, zone: t.zone, status: t.status };
      });
      var sosRecords = this.defaultData.sosTemplates.map(function(t) {
        return { wardId: t.wardId, time: t.time, date: AnBan._formatDateAgo(t.daysAgo), location: t.location, resolved: t.resolved };
      });
      this.storage.set('accounts', this.defaultData.accounts);
      this.storage.set('wards', this.defaultData.wards);
      this.storage.set('answerPhones', this.defaultData.answerPhones);
      this.storage.set('reminders', this.defaultData.reminders);
      this.storage.set('safeZones', this.defaultData.safeZones);
      this.storage.set('checkinRecords', checkins);
      this.storage.set('sosRecords', sosRecords);
      this.storage.set('lockMode', this.defaultData.lockMode);
      this.storage.set('studyMode', this.defaultData.studyMode);
      this.storage.set('currentWardId', 'w1');
      this.storage.set('initialized', true);
    }
    // 启动状态栏时间更新
    this.ui.updateTime();
    setInterval(function() { AnBan.ui.updateTime(); }, 1000);
  }
};
