const App = {
  currentUser: null,
  uploadedFiles: [],
  selectedStyle: 'french',
  selectedScene: null,
  generatedImage: null,
  
  init() {
    this.loadUser();
    this.bindEvents();
    this.loadHistory();
  },
  
  loadUser() {
    const saved = localStorage.getItem('wedding_user');
    if (saved) {
      this.currentUser = JSON.parse(saved);
      this.updateNav();
    }
  },
  
  saveUser(user) {
    this.currentUser = user;
    localStorage.setItem('wedding_user', JSON.stringify(user));
    this.updateNav();
  },
  
  logout() {
    this.currentUser = null;
    localStorage.removeItem('wedding_user');
    this.updateNav();
    this.showToast('已退出登录', 'success');
  },
  
  updateNav() {
    const loginBtn = document.getElementById('loginBtn');
    const registerBtn = document.getElementById('registerBtn');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');
    
    if (this.currentUser) {
      loginBtn.classList.add('hidden');
      registerBtn.classList.add('hidden');
      userMenu.classList.remove('hidden');
      userName.textContent = this.currentUser.name;
    } else {
      loginBtn.classList.remove('hidden');
      registerBtn.classList.remove('hidden');
      userMenu.classList.add('hidden');
    }
  },
  
  bindEvents() {
    document.getElementById('loginBtn').addEventListener('click', () => this.openModal('login'));
    document.getElementById('registerBtn').addEventListener('click', () => this.openModal('register'));
    document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
    
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => this.closeModal());
    });
    
    document.getElementById('modalOverlay').addEventListener('click', (e) => {
      if (e.target === document.getElementById('modalOverlay')) {
        this.closeModal();
      }
    });
    
    document.getElementById('switchToRegister').addEventListener('click', (e) => {
      e.preventDefault();
      this.switchModal('register');
    });
    
    document.getElementById('switchToLogin').addEventListener('click', (e) => {
      e.preventDefault();
      this.switchModal('login');
    });
    
    document.getElementById('loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin(e);
    });
    
    document.getElementById('registerForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleRegister(e);
    });
    
    document.getElementById('fileInput').addEventListener('change', (e) => {
      this.handleFileSelect(e.target.files);
    });
    
    const dropZone = document.getElementById('dropZone');
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
    
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('dragover');
    });
    
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      this.handleFileSelect(e.dataTransfer.files);
    });
    
    document.querySelectorAll('.style-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.selectedStyle = btn.dataset.style;
      });
    });
    
    document.querySelectorAll('.scene-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.scene-btn').forEach(b => b.classList.remove('active'));
        if (this.selectedScene === btn.dataset.scene) {
          this.selectedScene = null;
        } else {
          btn.classList.add('active');
          this.selectedScene = btn.dataset.scene;
        }
      });
    });
    
    document.getElementById('generateBtn').addEventListener('click', () => {
      this.generatePhoto();
    });
    
    document.getElementById('resetBtn').addEventListener('click', () => {
      this.resetEditor();
    });
    
    document.getElementById('downloadBtn').addEventListener('click', () => {
      this.downloadImage();
    });
    
    document.getElementById('startBtn').addEventListener('click', () => {
      document.getElementById('editor').scrollIntoView({ behavior: 'smooth' });
    });
  },
  
  openModal(type) {
    document.getElementById('modalOverlay').classList.remove('hidden');
    if (type === 'login') {
      document.getElementById('loginModal').classList.remove('hidden');
      document.getElementById('registerModal').classList.add('hidden');
    } else {
      document.getElementById('registerModal').classList.remove('hidden');
      document.getElementById('loginModal').classList.add('hidden');
    }
  },
  
  closeModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
    document.getElementById('loginModal').classList.add('hidden');
    document.getElementById('registerModal').classList.add('hidden');
  },
  
  switchModal(type) {
    if (type === 'login') {
      document.getElementById('loginModal').classList.remove('hidden');
      document.getElementById('registerModal').classList.add('hidden');
    } else {
      document.getElementById('registerModal').classList.remove('hidden');
      document.getElementById('loginModal').classList.add('hidden');
    }
  },
  
  handleRegister(e) {
    const name = document.getElementById('regName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;
    
    if (password !== confirm) {
      this.showToast('两次输入的密码不一致', 'error');
      return;
    }
    
    if (password.length < 6) {
      this.showToast('密码至少需要6位', 'error');
      return;
    }
    
    const users = JSON.parse(localStorage.getItem('wedding_users') || '[]');
    if (users.some(u => u.email === email)) {
      this.showToast('该邮箱已被注册', 'error');
      return;
    }
    
    const newUser = { id: Date.now(), name, email, password };
    users.push(newUser);
    localStorage.setItem('wedding_users', JSON.stringify(users));
    this.saveUser(newUser);
    this.closeModal();
    this.showToast('注册成功！', 'success');
    e.target.reset();
  },
  
  handleLogin(e) {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    const users = JSON.parse(localStorage.getItem('wedding_users') || '[]');
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      this.showToast('邮箱或密码错误', 'error');
      return;
    }
    
    this.saveUser(user);
    this.closeModal();
    this.showToast('登录成功！', 'success');
    e.target.reset();
    this.loadHistory();
  },
  
  showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  },
  
  handleFileSelect(files) {
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        this.showToast(`${file.name} 超过10MB限制`, 'error');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        this.showToast(`${file.name} 不是有效的图片文件`, 'error');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileData = {
          id: Date.now() + Math.random(),
          name: file.name,
          url: e.target.result,
          file: file
        };
        
        this.uploadedFiles.push(fileData);
        this.renderUploadedList();
        this.updatePreviewBefore(fileData.url);
      };
      reader.readAsDataURL(file);
    });
  },
  
  renderUploadedList() {
    const list = document.getElementById('uploadedList');
    list.innerHTML = this.uploadedFiles.map(file => `
      <div class="uploaded-item" data-id="${file.id}">
        <img src="${file.url}" alt="${file.name}">
        <span>${file.name}</span>
        <button onclick="App.removeFile(${file.id})">✕</button>
      </div>
    `).join('');
  },
  
  removeFile(id) {
    this.uploadedFiles = this.uploadedFiles.filter(f => f.id !== id);
    this.renderUploadedList();
    
    if (this.uploadedFiles.length > 0) {
      this.updatePreviewBefore(this.uploadedFiles[0].url);
    } else {
      this.updatePreviewBefore(null);
    }
  },
  
  updatePreviewBefore(url) {
    const box = document.getElementById('previewBefore');
    if (url) {
      box.innerHTML = `<h4>原图</h4><img src="${url}" alt="原图">`;
    } else {
      box.innerHTML = `<h4>原图</h4><div class="preview-placeholder">请先上传照片</div>`;
    }
  },
  
  async generatePhoto() {
    if (this.uploadedFiles.length === 0) {
      this.showToast('请先上传照片', 'error');
      return;
    }
    
    if (!this.currentUser) {
      this.showToast('请先登录', 'error');
      this.openModal('login');
      return;
    }
    
    const loading = document.getElementById('loading');
    const previewAfter = document.getElementById('previewAfter');
    const downloadBtn = document.getElementById('downloadBtn');
    
    loading.classList.remove('hidden');
    downloadBtn.classList.add('hidden');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const styleNames = {
      french: '法式浪漫',
      sunset: '海边日落',
      film: '电影胶片',
      korean: '韩式清透',
      magazine: '高级杂志',
      forest: '森系婚礼'
    };
    
    const sceneNames = {
      garden: '法式花园',
      beach: '海边日落',
      city: '城市夜景',
      forest: '森林婚礼',
      church: '教堂婚礼',
      ancient: '古镇老街',
      flower: '花海',
      snow: '雪景'
    };
    
    const styleColors = {
      french: 'sepia(20%) saturate(120%) contrast(90%)',
      sunset: 'sepia(30%) saturate(150%) hue-rotate(-10deg) brightness(110%)',
      film: 'sepia(40%) saturate(80%) contrast(110%)',
      korean: 'saturate(90%) brightness(105%) contrast(95%)',
      magazine: 'saturate(130%) contrast(110%) brightness(95%)',
      forest: 'sepia(10%) saturate(110%) hue-rotate(10deg)'
    };
    
    const sceneEffects = {
      garden: { bg: 'linear-gradient(135deg, #e8dcc8 0%, #c9b896 50%, #a68b5b 100%)', blend: 'overlay', opacity: 0.3 },
      beach: { bg: 'linear-gradient(180deg, #ff9a9e 0%, #fecfef 30%, #a18cd1 70%, #fbc2eb 100%)', blend: 'soft-light', opacity: 0.4 },
      city: { bg: 'linear-gradient(180deg, #0f0c29 0%, #302b63 50%, #24243e 100%)', blend: 'overlay', opacity: 0.5 },
      forest: { bg: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)', blend: 'color-burn', opacity: 0.35 },
      church: { bg: 'linear-gradient(180deg, #f5f5f5 0%, #e0e0e0 50%, #bdbdbd 100%)', blend: 'soft-light', opacity: 0.3 },
      ancient: { bg: 'linear-gradient(135deg, #d4a574 0%, #8b5a2b 50%, #5d4e37 100%)', blend: 'multiply', opacity: 0.4 },
      flower: { bg: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 50%, #ff7675 100%)', blend: 'overlay', opacity: 0.35 },
      snow: { bg: 'linear-gradient(180deg, #e8e8e8 0%, #ffffff 50%, #d4d4d4 100%)', blend: 'lighten', opacity: 0.4 }
    };
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      
      if (this.selectedScene && sceneEffects[this.selectedScene]) {
        const effect = sceneEffects[this.selectedScene];
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext('2d');
        
        const gradient = this.createGradient(ctx, effect.bg, img.width, img.height);
        tempCtx.fillStyle = gradient;
        tempCtx.fillRect(0, 0, img.width, img.height);
        
        tempCtx.globalCompositeOperation = effect.blend;
        tempCtx.globalAlpha = effect.opacity;
        ctx.filter = styleColors[this.selectedStyle];
        ctx.drawImage(img, 0, 0);
        
        ctx.globalCompositeOperation = effect.blend;
        ctx.globalAlpha = effect.opacity;
        ctx.drawImage(tempCanvas, 0, 0);
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.filter = styleColors[this.selectedStyle];
        ctx.drawImage(img, 0, 0, img.width, img.height);
      } else {
        ctx.filter = styleColors[this.selectedStyle];
        ctx.drawImage(img, 0, 0);
      }
      
      const resultUrl = canvas.toDataURL('image/jpeg', 0.9);
      const styleName = styleNames[this.selectedStyle];
      const sceneName = this.selectedScene ? sceneNames[this.selectedScene] : '';
      const description = sceneName ? `${styleName} · ${sceneName}` : styleName;
      
      this.generatedImage = {
        url: resultUrl,
        style: description,
        timestamp: Date.now()
      };
      
      loading.classList.add('hidden');
      previewAfter.innerHTML = `
        <h4>AI 精修效果${sceneName ? ' · ' + sceneName : ''}</h4>
        <img src="${resultUrl}" alt="AI精修结果">
        <div id="loading" class="loading hidden">
          <div class="spinner"></div>
          <p>AI 正在精修中，请稍候...</p>
        </div>
      `;
      downloadBtn.classList.remove('hidden');
      
      this.saveToHistory(resultUrl, description);
      this.showToast(`AI精修完成！${sceneName ? '已更换场景：' + sceneName : ''}`, 'success');
    };
    
    img.src = this.uploadedFiles[0].url;
  },
  
  createGradient(ctx, bgString, width, height) {
    if (bgString.includes('linear-gradient')) {
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      const colors = bgString.match(/#[a-fA-F0-9]{6}/g);
      const stops = bgString.match(/(\d+)%/g);
      
      if (colors && stops) {
        colors.forEach((color, i) => {
          gradient.addColorStop(parseInt(stops[i]) / 100, color);
        });
      }
      return gradient;
    }
    return bgString;
  },
  
  resetEditor() {
    this.uploadedFiles = [];
    this.selectedScene = null;
    this.generatedImage = null;
    document.getElementById('uploadedList').innerHTML = '';
    document.getElementById('previewBefore').innerHTML = `<h4>原图</h4><div class="preview-placeholder">请先上传照片</div>`;
    document.getElementById('previewAfter').innerHTML = `
      <h4>AI 精修效果</h4>
      <div class="preview-placeholder">精修结果将在这里显示</div>
      <div id="loading" class="loading hidden">
        <div class="spinner"></div>
        <p>AI 正在精修中，请稍候...</p>
      </div>
    `;
    document.getElementById('downloadBtn').classList.add('hidden');
    document.getElementById('fileInput').value = '';
    document.querySelectorAll('.scene-btn').forEach(b => b.classList.remove('active'));
  },
  
  downloadImage() {
    if (!this.generatedImage) return;
    
    const link = document.createElement('a');
    link.href = this.generatedImage.url;
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    link.download = `wedding_ai_${timestamp}.jpg`;
    link.click();
    this.showToast('图片已下载', 'success');
  },
  
  saveToHistory(imageUrl, style) {
    if (!this.currentUser) return;
    
    const history = JSON.parse(localStorage.getItem(`wedding_history_${this.currentUser.id}`) || '[]');
    const record = {
      id: Date.now(),
      imageUrl,
      style,
      date: new Date().toLocaleString('zh-CN')
    };
    
    history.unshift(record);
    if (history.length > 20) history.pop();
    
    localStorage.setItem(`wedding_history_${this.currentUser.id}`, JSON.stringify(history));
    this.loadHistory();
  },
  
  loadHistory() {
    const historyList = document.getElementById('historyList');
    
    if (!this.currentUser) {
      historyList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📁</div>
          <p>暂无精修记录</p>
          <p class="empty-hint">登录后上传照片并进行 AI 精修，作品将保存在这里</p>
        </div>
      `;
      return;
    }
    
    const history = JSON.parse(localStorage.getItem(`wedding_history_${this.currentUser.id}`) || '[]');
    
    if (history.length === 0) {
      historyList.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📁</div>
          <p>暂无精修记录</p>
          <p class="empty-hint">上传照片并进行 AI 精修，作品将保存在这里</p>
        </div>
      `;
    } else {
      historyList.innerHTML = history.map(item => `
        <div class="history-item">
          <img src="${item.imageUrl}" alt="精修作品">
          <div class="history-item-info">
            <p>${item.date}</p>
            <span>${item.style}</span>
          </div>
        </div>
      `).join('');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});