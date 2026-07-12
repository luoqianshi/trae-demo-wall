const CATEGORIES = {
    'milk-tea': ['蜜雪冰城', '茶百道', '霸王茶姬', '喜茶', '奈雪的茶', '一点点', '古茗', '沪上阿姨'],
    'entertainment': ['打麻将', '羽毛球', '看电影', 'KTV', '桌游', '逛街', '剧本杀', '密室逃脱'],
    'food': ['火锅', '烧烤', '日料', '西餐', '川菜', '粤菜', '韩餐', '披萨'],
    'sports': ['跑步', '游泳', '篮球', '瑜伽', '健身', '骑行', '网球', '跳绳']
};

const COLORS = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
    '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
    '#BB8FCE', '#85C1E9', '#F8B500', '#00CED1'
];

class DecisionApp {
    constructor() {
        this.options = [];
        this.canvas = document.getElementById('wheelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.spinBtn = document.getElementById('spinBtn');
        this.addBtn = document.getElementById('addBtn');
        this.optionInput = document.getElementById('optionInput');
        this.optionsList = document.getElementById('optionsList');
        this.resultSection = document.getElementById('resultSection');
        this.resultText = document.getElementById('resultText');
        this.resetBtn = document.getElementById('resetBtn');
        this.countdown = document.getElementById('countdown');
        this.historyList = document.getElementById('historyList');
        this.clearHistoryBtn = document.getElementById('clearHistoryBtn');
        
        this.currentRotation = 0;
        this.isSpinning = false;
        this.animationFrameId = null;
        
        this.init();
    }

    init() {
        this.setupCanvas();
        this.loadFromStorage();
        this.bindEvents();
        this.setupShakeDetection();
        this.renderOptions();
        this.renderWheel();
        this.renderHistory();
    }

    setupCanvas() {
        const container = this.canvas.parentElement;
        const size = Math.min(container.clientWidth, 300);
        this.canvas.width = size * 2;
        this.canvas.height = size * 2;
        this.canvas.style.width = size + 'px';
        this.canvas.style.height = size + 'px';
        this.ctx.scale(2, 2);
        this.centerX = size / 2;
        this.centerY = size / 2;
        this.radius = size / 2 - 10;
    }

    bindEvents() {
        this.addBtn.addEventListener('click', () => this.addOption());
        this.optionInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addOption();
        });
        this.spinBtn.addEventListener('click', () => this.startSpin());
        this.resetBtn.addEventListener('click', () => this.reset());
        
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.target.dataset.category;
                this.loadCategory(category);
            });
        });

        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
    }

    setupShakeDetection() {
        let lastX = 0, lastY = 0, lastZ = 0;
        let lastTime = 0;
        const SHAKE_THRESHOLD = 15;
        
        const handleMotion = (event) => {
            if (this.isSpinning) return;
            
            const current = event.accelerationIncludingGravity;
            const currentTime = Date.now();
            
            if ((currentTime - lastTime) > 100) {
                const diffTime = currentTime - lastTime;
                lastTime = currentTime;
                
                const speed = Math.abs(current.x + current.y + current.z - lastX - lastY - lastZ) / diffTime * 10000;
                
                if (speed > SHAKE_THRESHOLD) {
                    this.startSpin();
                }
                
                lastX = current.x;
                lastY = current.y;
                lastZ = current.z;
            }
        };

        if (window.DeviceMotionEvent) {
            window.addEventListener('devicemotion', handleMotion, false);
        }
    }

    addOption() {
        const value = this.optionInput.value.trim();
        if (value && !this.options.includes(value)) {
            this.options.push(value);
            this.optionInput.value = '';
            this.renderOptions();
            this.renderWheel();
            this.saveToStorage();
        }
    }

    removeOption(index) {
        this.options.splice(index, 1);
        this.renderOptions();
        this.renderWheel();
        this.saveToStorage();
    }

    loadCategory(category) {
        this.options = [...CATEGORIES[category]];
        this.renderOptions();
        this.renderWheel();
        this.saveToStorage();
    }

    renderOptions() {
        this.optionsList.innerHTML = '';
        
        if (this.options.length === 0) {
            this.optionsList.innerHTML = '<div class="empty-tip">点击上方按钮或手动输入选项</div>';
            this.spinBtn.disabled = true;
            return;
        }

        this.spinBtn.disabled = this.options.length < 2;

        this.options.forEach((option, index) => {
            const tag = document.createElement('div');
            tag.className = 'option-tag';
            tag.innerHTML = `
                <span>${option}</span>
                <button class="remove-btn" onclick="app.removeOption(${index})">×</button>
            `;
            this.optionsList.appendChild(tag);
        });
    }

    renderWheel() {
        const ctx = this.ctx;
        const centerX = this.centerX;
        const centerY = this.centerY;
        const radius = this.radius;
        
        ctx.clearRect(0, 0, this.canvas.width / 2, this.canvas.height / 2);
        
        if (this.options.length === 0) {
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.fillStyle = '#eee';
            ctx.fill();
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 2;
            ctx.stroke();
            ctx.fillStyle = '#999';
            ctx.font = '16px "Zcool KuaiLe"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('请添加选项', centerX, centerY);
            return;
        }

        const anglePerOption = (Math.PI * 2) / this.options.length;
        
        this.options.forEach((option, index) => {
            const startAngle = index * anglePerOption - Math.PI / 2;
            const endAngle = startAngle + anglePerOption;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            ctx.closePath();
            
            ctx.fillStyle = COLORS[index % COLORS.length];
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.rotate(startAngle + anglePerOption / 2);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px "Zcool KuaiLe"';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            const textRadius = radius * 0.7;
            const text = option.length > 4 ? option.substring(0, 4) + '...' : option;
            ctx.fillText(text, textRadius, 0);
            
            ctx.restore();
        });
    }

    async startSpin() {
        if (this.isSpinning || this.options.length < 2) return;
        
        this.isSpinning = true;
        this.spinBtn.disabled = true;
        this.resultSection.classList.remove('show');
        
        await this.showCountdown();
        
        this.currentRotation = 0;
        const targetOptionIndex = Math.floor(Math.random() * this.options.length);
        const anglePerOption = (Math.PI * 2) / this.options.length;
        const safeOffset = anglePerOption * 0.2;
        const randomOffset = safeOffset + Math.random() * (anglePerOption - safeOffset * 2);
        const targetAngle = -targetOptionIndex * anglePerOption - anglePerOption / 2 - randomOffset + Math.PI * 2 * 5;
        
        this.animateSpin(targetAngle);
    }

    async showCountdown() {
        for (let i = 3; i > 0; i--) {
            this.countdown.textContent = i;
            this.countdown.classList.add('show');
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.countdown.classList.remove('show');
        }
    }

    animateSpin(targetRotation) {
        const duration = 3000;
        const startTime = Date.now();
        const startRotation = this.currentRotation;
        
        const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutCubic(progress);
            
            this.currentRotation = startRotation + targetRotation * easedProgress;
            this.canvas.style.transform = `rotate(${this.currentRotation}rad)`;
            
            if (progress < 1) {
                this.animationFrameId = requestAnimationFrame(animate);
            } else {
                this.onSpinComplete();
            }
        };
        
        this.animationFrameId = requestAnimationFrame(animate);
    }

    onSpinComplete() {
        const anglePerOption = (Math.PI * 2) / this.options.length;
        let normalizedRotation = this.currentRotation % (Math.PI * 2);
        if (normalizedRotation < 0) normalizedRotation += Math.PI * 2;
        
        let optionIndex = Math.floor(normalizedRotation / anglePerOption) % this.options.length;
        if (optionIndex < 0) optionIndex += this.options.length;
        const result = this.options[optionIndex];
        
        this.showResult(result);
        this.addToHistory(result);
    }

    showResult(result) {
        this.resultText.textContent = result;
        this.resultSection.classList.add('show');
        this.isSpinning = false;
        this.spinBtn.disabled = false;
    }

    reset() {
        this.resultSection.classList.remove('show');
        this.currentRotation = 0;
        this.canvas.style.transform = 'rotate(0)';
    }

    addToHistory(result) {
        const history = this.getHistory();
        const item = {
            result: result,
            time: new Date().toLocaleString('zh-CN')
        };
        history.unshift(item);
        if (history.length > 20) history.pop();
        localStorage.setItem('decisionHistory', JSON.stringify(history));
        this.renderHistory();
    }

    getHistory() {
        try {
            const stored = localStorage.getItem('decisionHistory');
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    renderHistory() {
        const history = this.getHistory();
        this.historyList.innerHTML = '';
        
        if (history.length === 0) {
            this.historyList.innerHTML = '<div class="empty-tip">暂无历史记录</div>';
            return;
        }

        history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'history-item';
            div.innerHTML = `
                <span class="time">${item.time}</span>
                <span class="result">🎯 ${item.result}</span>
            `;
            this.historyList.appendChild(div);
        });
    }

    clearHistory() {
        localStorage.removeItem('decisionHistory');
        this.renderHistory();
    }

    saveToStorage() {
        localStorage.setItem('decisionOptions', JSON.stringify(this.options));
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem('decisionOptions');
            if (stored) {
                this.options = JSON.parse(stored);
            }
        } catch {
            this.options = [];
        }
    }
}

const app = new DecisionApp();