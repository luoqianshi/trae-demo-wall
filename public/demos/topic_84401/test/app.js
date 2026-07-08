class SignLanguageTranslator {
    constructor() {
        this.isSignRecognizing = false;
        this.isVoiceRecording = false;
        this.lastRecognizedSign = '';
        this.lastRecognizedTime = 0;
        this.signHistory = [];
        this.currentPhrase = '';
        this.gestureBuffer = [];
        this.bufferSize = 8;
        this.minConfirmCount = 3;
        this.confidenceThreshold = 0.6;
        this.recognitionStartTime = 0;
        this.timestampInterval = null;

        // DOM元素
        this.videoElement = document.getElementById('signVideo');
        this.signCanvas = document.getElementById('signCanvas');
        this.signCtx = this.signCanvas.getContext('2d');
        this.animationCanvas = document.getElementById('animationCanvas');
        this.animationCtx = this.animationCanvas.getContext('2d');

        this.signSubtitle = document.getElementById('signSubtitle');
        this.confidenceText = document.getElementById('confidenceText');
        this.animationText = document.getElementById('animationText');
        this.textInput = document.getElementById('textInput');
        this.historyList = document.getElementById('historyList');
        this.historyCount = document.getElementById('historyCount');
        this.gestureList = document.getElementById('gestureList');

        this.signStatusDot = document.getElementById('signStatusDot');
        this.signStatusLabel = document.getElementById('signStatusLabel');
        this.voiceStatusDot = document.getElementById('voiceStatusDot');
        this.voiceStatusLabel = document.getElementById('voiceStatusLabel');
        this.systemStatusDot = document.getElementById('systemStatusDot');
        this.systemStatusText = document.getElementById('systemStatusText');

        this.recTag = document.getElementById('recTag');
        this.timestamp = document.getElementById('timestamp');
        this.animationStage = document.getElementById('animationStage');
        this.toastContainer = document.getElementById('toastContainer');
        this.modelInfo = document.getElementById('modelInfo');

        // MediaPipe和CSL模型
        this.hands = null;
        this.cslModel = null;
        this.animationFrame = null;

        this.init();
    }

    async init() {
        await this.initHands();
        await this.initCSLModel();
        this.renderGestureList();
        document.getElementById('loading').classList.add('hidden');
        this.modelInfo.style.display = 'flex';
        this.setupEventListeners();
        this.setupAnimationCanvas();
        this.updateSystemStatus('ready', '系统就绪');
    }

    async initHands() {
        this.hands = new Hands({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
            }
        });

        this.hands.setOptions({
            maxNumHands: 2,
            modelComplexity: 1,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.5
        });

        this.hands.onResults(this.onHandsResults.bind(this));
    }

    async initCSLModel() {
        // 使用Python训练的模型由CSL模型
        this.cslModel = new CSLModel();

        // 更新加载进度
        document.getElementById('loadingText').textContent = '正在加载模型...';
        document.getElementById('loadingProgress').style.width = '20%';

        try {
            // 仅在有预训练模型时才尝试加载，否则直接使用规则匹配
            const hasModel = await this.checkModelExists('js/tfjs_model/model.json');
            if (hasModel) {
                const success = await this.cslModel.loadModel('js/tfjs_model/model.json');
                if (success) {
                    console.log('使用预训练模型');
                }
            } else {
                console.log('未找到预训练模型，使用规则匹配');
                this.cslModel.useTfModel = false;
            }

            document.getElementById('loadingProgress').style.width = '90%';
            document.getElementById('loadingText').textContent = '模型加载完成';

        } catch (error) {
            console.error('模型初始化失败:', error);
        }

        document.getElementById('loadingProgress').style.width = '100%';
        document.getElementById('loadingText').textContent = '系统初始化完成';
    }

    async checkModelExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch (e) {
            return false;
        }
    }

    setupEventListeners() {
        document.getElementById('startSignBtn').addEventListener('click', () => this.startSignRecognition());
        document.getElementById('stopSignBtn').addEventListener('click', () => this.stopSignRecognition());
        document.getElementById('speakBtn').addEventListener('click', () => this.speakCurrentText());
        document.getElementById('startVoiceBtn').addEventListener('click', () => this.toggleVoiceRecording());
        document.getElementById('convertBtn').addEventListener('click', () => this.convertToSign());
    }

    setupAnimationCanvas() {
        const rect = this.animationStage.getBoundingClientRect();
        this.animationCanvas.width = rect.width;
        this.animationCanvas.height = rect.height;

        window.addEventListener('resize', () => {
            const r = this.animationStage.getBoundingClientRect();
            this.animationCanvas.width = r.width;
            this.animationCanvas.height = r.height;
        });
    }

    renderGestureList() {
        this.gestureList.innerHTML = '';
        const categories = CSLWords.getCategories();

        for (const [category, items] of Object.entries(categories)) {
            const header = document.createElement('div');
            header.className = 'gesture-category-header';
            header.textContent = category;
            this.gestureList.appendChild(header);

            items.forEach(item => {
                const tag = document.createElement('span');
                tag.className = 'gesture-tag';
                tag.textContent = item.word;
                tag.title = item.pinyin;
                this.gestureList.appendChild(tag);
            });
        }
    }

    async startSignRecognition() {
        if (this.isSignRecognizing) return;

        // 检查安全上下文
        if (!window.isSecureContext) {
            const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
            if (!isLocalhost) {
                this.showToast('⚠️ Chrome/Edge需要HTTPS或localhost才能用摄像头', 'error');
                console.error('当前URL不是安全上下文:', location.href);
                console.error('解决方案：');
                console.error('1. 用 http://localhost:8000 访问（不要用IP地址）');
                console.error('2. 或者部署到HTTPS网站');
                return;
            }
        }

        // 检查浏览器支持
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.showToast('您的浏览器不支持摄像头访问', 'error');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                }
            });

            this.videoElement.srcObject = stream;
            this.videoElement.autoplay = true;
            this.videoElement.playsInline = true;
            this.videoElement.muted = true;

            // 等待视频元数据加载
            await new Promise((resolve) => {
                this.videoElement.onloadedmetadata = resolve;
            });

            // 设置canvas尺寸为视频实际尺寸
            this.signCanvas.width = this.videoElement.videoWidth || 640;
            this.signCanvas.height = this.videoElement.videoHeight || 480;

            await this.videoElement.play();

            this.isSignRecognizing = true;
            this.recognitionStartTime = Date.now();

            document.getElementById('startSignBtn').disabled = true;
            document.getElementById('stopSignBtn').disabled = false;
            this.updateSignStatus('active', '识别中');

            this.recTag.classList.remove('hidden');
            this.startTimestamp();
            this.processVideoFrame();
        } catch (error) {
            console.error('无法访问摄像头:', error);
            let msg = '无法访问摄像头';
            if (error.name === 'NotAllowedError') {
                msg = '请在浏览器中允许摄像头权限';
            } else if (error.name === 'NotFoundError') {
                msg = '未找到摄像头设备';
            } else if (error.name === 'NotReadableError') {
                msg = '摄像头被其他程序占用';
            } else if (error.name === 'OverconstrainedError') {
                msg = '摄像头参数不支持';
            } else if (error.name === 'SecurityError') {
                msg = '安全限制：请用localhost或HTTPS访问';
            }
            this.showToast(msg, 'error');
        }
    }

    stopSignRecognition() {
        if (!this.isSignRecognizing) return;

        this.isSignRecognizing = false;
        const stream = this.videoElement.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        this.videoElement.srcObject = null;

        document.getElementById('startSignBtn').disabled = false;
        document.getElementById('stopSignBtn').disabled = true;
        this.updateSignStatus('idle', '待启动');

        this.recTag.classList.add('hidden');
        this.stopTimestamp();
        this.signSubtitle.textContent = '准备就绪';
        this.signSubtitle.classList.add('placeholder');
        this.confidenceText.style.display = 'none';
        this.signCtx.clearRect(0, 0, this.signCanvas.width, this.signCanvas.height);
        this.gestureBuffer = [];
    }

    startTimestamp() {
        this.timestamp.textContent = '00:00';
        this.timestampInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.recognitionStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            this.timestamp.textContent = `${minutes}:${seconds}`;
        }, 1000);
    }

    stopTimestamp() {
        if (this.timestampInterval) {
            clearInterval(this.timestampInterval);
            this.timestampInterval = null;
        }
    }

    async processVideoFrame() {
        if (!this.isSignRecognizing) return;

        if (this.videoElement.readyState >= 2) {
            // 使用视频实际尺寸
            const videoWidth = this.videoElement.videoWidth || 640;
            const videoHeight = this.videoElement.videoHeight || 480;

            this.signCanvas.width = videoWidth;
            this.signCanvas.height = videoHeight;

            try {
                await this.hands.send({ image: this.videoElement });
            } catch (error) {
                console.error('处理视频帧失败:', error);
            }
        }

        requestAnimationFrame(() => this.processVideoFrame());
    }

    onHandsResults(results) {
        if (!this.isSignRecognizing) return;

        this.signCtx.save();
        this.signCtx.clearRect(0, 0, this.signCanvas.width, this.signCanvas.height);

        if (results.image) {
            this.signCtx.drawImage(results.image, 0, 0, this.signCanvas.width, this.signCanvas.height);
        }

        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            for (const landmarks of results.multiHandLandmarks) {
                this.drawHand(landmarks);
            }

            // 使用中国手语模型识别
            const recognizedSign = this.recognizeCSLSign(results.multiHandLandmarks);

            // 实时显示调试信息
            if (recognizedSign.debug) {
                const debugEl = document.getElementById('debugText');
                if (debugEl) {
                    debugEl.style.display = 'block';
                    const d = recognizedSign.debug;
                    const candidates = d.candidates || '';
                    debugEl.textContent = `[指:${d.fingers}] [向:${d.fingerDir}] [掌:${d.palmFacing}] [散:${d.spread}] [动:${d.motion}] → ${candidates}`;
                }
            }

            if (recognizedSign.word) {
                this.gestureBuffer.push({
                    word: recognizedSign.word,
                    confidence: recognizedSign.confidence,
                    pinyin: recognizedSign.pinyin,
                    debug: recognizedSign.debug
                });

                if (this.gestureBuffer.length > this.bufferSize) {
                    this.gestureBuffer.shift();
                }

                const now = Date.now();
                if (now - this.lastRecognizedTime > 600) {
                    const mostFrequent = this.getMostFrequentSign();
                    if (mostFrequent && mostFrequent.word !== this.lastRecognizedSign &&
                        mostFrequent.confidence >= this.confidenceThreshold) {
                        this.lastRecognizedSign = mostFrequent.word;
                        this.lastRecognizedTime = now;
                        this.updateSubtitle(mostFrequent, mostFrequent.confidence);
                        this.addToHistory('sign', `${mostFrequent.word} (${mostFrequent.pinyin})`);
                        document.getElementById('speakBtn').disabled = false;
                        this.gestureBuffer = [];
                    }
                }
            } else {
                this.gestureBuffer = [];
            }
        } else {
            this.lastRecognizedSign = '';
            this.gestureBuffer = [];
        }

        this.signCtx.restore();
    }

    recognizeCSLSign(handLandmarks) {
        if (!handLandmarks || handLandmarks.length === 0 || !this.cslModel) {
            return { word: '', confidence: 0 };
        }

        const landmarks = handLandmarks[0];
        return this.cslModel.recognize(landmarks);
    }

    getMostFrequentSign() {
        if (this.gestureBuffer.length === 0) return null;

        const frequency = {};
        let maxFreq = 0;
        let mostFrequent = null;
        let bestConfidence = 0;
        let pinyin = '';

        for (const item of this.gestureBuffer) {
            if (!frequency[item.word]) {
                frequency[item.word] = {
                    count: 0,
                    totalConfidence: 0,
                    pinyin: item.pinyin
                };
            }
            frequency[item.word].count++;
            frequency[item.word].totalConfidence += item.confidence;

            if (frequency[item.word].count > maxFreq) {
                maxFreq = frequency[item.word].count;
                mostFrequent = item.word;
                pinyin = frequency[item.word].pinyin;
                bestConfidence = frequency[item.word].totalConfidence / frequency[item.word].count;
            }
        }

        return maxFreq >= this.minConfirmCount ? {
            word: mostFrequent,
            confidence: bestConfidence,
            pinyin: pinyin
        } : null;
    }

    drawHand(landmarks) {
        // 绘制连线
        this.signCtx.strokeStyle = '#00FF88';
        this.signCtx.lineWidth = 3;
        this.signCtx.lineCap = 'round';
        this.signCtx.lineJoin = 'round';

        const connections = [
            [0, 1], [1, 2], [2, 3], [3, 4],
            [0, 5], [5, 6], [6, 7], [7, 8],
            [0, 9], [9, 10], [10, 11], [11, 12],
            [0, 13], [13, 14], [14, 15], [15, 16],
            [0, 17], [17, 18], [18, 19], [19, 20],
            [5, 9], [9, 13], [13, 17]
        ];

        for (const [start, end] of connections) {
            this.signCtx.beginPath();
            this.signCtx.moveTo(landmarks[start].x * this.signCanvas.width, landmarks[start].y * this.signCanvas.height);
            this.signCtx.lineTo(landmarks[end].x * this.signCanvas.width, landmarks[end].y * this.signCanvas.height);
            this.signCtx.stroke();
        }

        // 绘制关节点 - 大圆点
        this.signCtx.fillStyle = '#FF4444';
        for (const landmark of landmarks) {
            this.signCtx.beginPath();
            this.signCtx.arc(landmark.x * this.signCanvas.width, landmark.y * this.signCanvas.height, 8, 0, Math.PI * 2);
            this.signCtx.fill();
        }

        // 绘制手腕点（特殊标记）
        this.signCtx.fillStyle = '#00FF88';
        this.signCtx.beginPath();
        this.signCtx.arc(landmarks[0].x * this.signCanvas.width, landmarks[0].y * this.signCanvas.height, 12, 0, Math.PI * 2);
        this.signCtx.fill();
    }

    updateSubtitle(signInfo, confidence = 0) {
        this.signSubtitle.textContent = `${signInfo.word} (${signInfo.pinyin})`;
        this.signSubtitle.classList.remove('placeholder');
        this.currentPhrase = signInfo.word;

        if (confidence > 0) {
            this.confidenceText.style.display = 'block';
            this.confidenceText.textContent = `置信度: ${Math.round(confidence * 100)}%`;
        }

        // 显示调试信息
        if (signInfo.debug) {
            const debugEl = document.getElementById('debugText');
            if (debugEl) {
                debugEl.style.display = 'block';
                const d = signInfo.debug;
                const candidates = d.topCandidates ? d.topCandidates.join(' | ') : '';
                debugEl.textContent = `[指:${d.fingers}] [手向:${d.palmDir}] [指向:${d.fingersDir}] [动态:${d.motion}] → ${candidates}`;
            }
        }
    }

    speakCurrentText() {
        if (!this.currentPhrase) return;

        const utterance = new SpeechSynthesisUtterance(this.currentPhrase);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.9;
        utterance.pitch = 1;

        speechSynthesis.speak(utterance);
        this.showToast('正在播放: ' + this.currentPhrase, 'success');
    }

    async toggleVoiceRecording() {
        if (this.isVoiceRecording) {
            this.stopVoiceRecording();
        } else {
            await this.startVoiceRecording();
        }
    }

    async startVoiceRecording() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showToast('您的浏览器不支持语音识别功能', 'error');
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'zh-CN';
        this.recognition.continuous = true;
        this.recognition.interimResults = true;

        this.recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            this.textInput.value = finalTranscript + interimTranscript;
        };

        this.recognition.onerror = (event) => {
            console.error('语音识别错误:', event.error);
            this.stopVoiceRecording();
            this.showToast('语音识别出错: ' + event.error, 'error');
        };

        this.recognition.onend = () => {
            if (this.isVoiceRecording) {
                this.recognition.start();
            }
        };

        try {
            await this.recognition.start();
            this.isVoiceRecording = true;
            const btn = document.getElementById('startVoiceBtn');
            btn.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="6" y="6" width="12" height="12"/>
                </svg>
                停止录音
            `;
            btn.classList.remove('btn-warning');
            btn.classList.add('btn-danger');
            this.updateVoiceStatus('recording', '录音中');
        } catch (error) {
            console.error('启动语音识别失败:', error);
            this.showToast('无法启动语音识别，请确保已授权麦克风权限', 'error');
        }
    }

    stopVoiceRecording() {
        if (!this.isVoiceRecording || !this.recognition) return;

        this.recognition.stop();
        this.isVoiceRecording = false;
        const btn = document.getElementById('startVoiceBtn');
        btn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
            </svg>
            语音输入
        `;
        btn.classList.remove('btn-danger');
        btn.classList.add('btn-warning');
        this.updateVoiceStatus('idle', '待启动');
    }

    convertToSign() {
        const text = this.textInput.value.trim();
        if (!text) {
            this.showToast('请输入要转换的文字', 'error');
            return;
        }

        this.addToHistory('voice', text);
        this.animationText.textContent = text;
        this.playSignAnimation(text);
        this.showToast('正在生成手语动画', 'success');
    }

    playSignAnimation(text) {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }

        this.animationProgress = 0;
        const chars = text.split('');
        let currentIndex = 0;

        const animate = () => {
            this.animationCtx.clearRect(0, 0, this.animationCanvas.width, this.animationCanvas.height);

            if (currentIndex < chars.length) {
                const progress = this.animationProgress % 1;
                this.drawAnimatedHand(chars[currentIndex], progress);

                this.animationProgress += 0.02;

                if (this.animationProgress >= 1) {
                    currentIndex++;
                    this.animationProgress = 0;
                }
            }

            if (currentIndex < chars.length) {
                this.animationFrame = requestAnimationFrame(animate);
            }
        };

        animate();
    }

    drawAnimatedHand(char, progress) {
        const centerX = this.animationCanvas.width / 2;
        const centerY = this.animationCanvas.height / 2;
        const scale = Math.min(this.animationCanvas.width, this.animationCanvas.height) / 250;

        this.animationCtx.save();
        this.animationCtx.translate(centerX, centerY);
        this.animationCtx.scale(scale, scale);

        const handConfig = this.getHandConfig(char);

        const pulseScale = 1 + Math.sin(progress * Math.PI * 2) * 0.05;
        this.animationCtx.scale(pulseScale, pulseScale);

        this.animationCtx.fillStyle = '#FFE0BD';
        this.animationCtx.strokeStyle = '#E0B090';
        this.animationCtx.lineWidth = 2;

        this.animationCtx.beginPath();
        this.animationCtx.ellipse(0, 0, 45, 50, 0, 0, Math.PI * 2);
        this.animationCtx.fill();
        this.animationCtx.stroke();

        const fingers = ['thumb', 'index', 'middle', 'ring', 'pinky'];
        const fingerLengths = { thumb: 35, index: 50, middle: 55, ring: 50, pinky: 40 };
        const fingerAngles = { thumb: -70, index: -25, middle: 0, ring: 25, pinky: 55 };

        fingers.forEach((finger) => {
            const isExtended = handConfig[finger];
            const baseLength = fingerLengths[finger];
            const targetLength = isExtended ? baseLength : baseLength * 0.4;
            const currentLength = baseLength * (1 - progress) + targetLength * progress;

            const angle = (fingerAngles[finger] * Math.PI) / 180;

            this.animationCtx.save();
            this.animationCtx.rotate(angle);

            this.animationCtx.fillStyle = '#FFE0BD';
            this.animationCtx.strokeStyle = '#E0B090';
            this.animationCtx.lineWidth = 10;
            this.animationCtx.lineCap = 'round';

            this.animationCtx.beginPath();
            this.animationCtx.moveTo(0, 0);
            this.animationCtx.lineTo(0, -currentLength);
            this.animationCtx.stroke();

            this.animationCtx.beginPath();
            this.animationCtx.arc(0, -currentLength, 6, 0, Math.PI * 2);
            this.animationCtx.fill();
            this.animationCtx.stroke();

            this.animationCtx.restore();
        });

        this.animationCtx.restore();
    }

    getHandConfig(char) {
        const configs = {
            '你': { thumb: false, index: true, middle: false, ring: false, pinky: false },
            '好': { thumb: false, index: true, middle: true, ring: false, pinky: false },
            '谢': { thumb: false, index: false, middle: false, ring: false, pinky: false },
            '爱': { thumb: true, index: false, middle: false, ring: false, pinky: false },
            '是': { thumb: false, index: true, middle: false, ring: false, pinky: false },
            '不': { thumb: false, index: false, middle: true, ring: false, pinky: false },
            '抱': { thumb: true, index: false, middle: false, ring: false, pinky: false },
            '歉': { thumb: true, index: false, middle: false, ring: false, pinky: false },
            '开': { thumb: true, index: true, middle: true, ring: true, pinky: true },
            '心': { thumb: true, index: true, middle: true, ring: false, pinky: false },
            '帮': { thumb: true, index: true, middle: false, ring: false, pinky: true },
            '助': { thumb: true, index: true, middle: false, ring: false, pinky: true },
            '安': { thumb: false, index: true, middle: true, ring: true, pinky: true },
            '静': { thumb: false, index: true, middle: true, ring: true, pinky: true },
            '的': { thumb: false, index: true, middle: true, ring: false, pinky: false },
            '打': { thumb: false, index: false, middle: false, ring: false, pinky: true },
            '电': { thumb: false, index: false, middle: false, ring: false, pinky: true },
            '话': { thumb: false, index: false, middle: false, ring: false, pinky: true },
            '胜': { thumb: false, index: true, middle: false, ring: false, pinky: true },
            '利': { thumb: false, index: true, middle: false, ring: false, pinky: true },
            '一': { thumb: false, index: true, middle: false, ring: false, pinky: false },
            '二': { thumb: false, index: true, middle: true, ring: false, pinky: false },
            '三': { thumb: false, index: true, middle: true, ring: true, pinky: false },
            '四': { thumb: false, index: true, middle: true, ring: true, pinky: true },
            '五': { thumb: true, index: true, middle: true, ring: true, pinky: true },
            '六': { thumb: true, index: true, middle: false, ring: false, pinky: false },
            '七': { thumb: true, index: false, middle: false, ring: false, pinky: false },
            '八': { thumb: true, index: true, middle: false, ring: false, pinky: false },
            '九': { thumb: false, index: false, middle: false, ring: false, pinky: true },
            '加': { thumb: false, index: false, middle: false, ring: false, pinky: false },
            '油': { thumb: false, index: false, middle: false, ring: false, pinky: false },
            '棒': { thumb: false, index: false, middle: true, ring: true, pinky: true },
            '友': { thumb: false, index: true, middle: false, ring: true, pinky: false },
            '喜': { thumb: true, index: false, middle: false, ring: true, pinky: false },
            '欢': { thumb: true, index: false, middle: false, ring: true, pinky: false },
            '需': { thumb: false, index: false, middle: true, ring: true, pinky: true },
            '要': { thumb: false, index: false, middle: true, ring: true, pinky: true },
            '鼓': { thumb: true, index: true, middle: true, ring: true, pinky: true },
            '掌': { thumb: true, index: true, middle: true, ring: true, pinky: true },
            '再': { thumb: false, index: true, middle: false, ring: false, pinky: false },
            '见': { thumb: false, index: true, middle: false, ring: false, pinky: false },
            '请': { thumb: false, index: true, middle: true, ring: false, pinky: false },
            '对': { thumb: true, index: false, middle: false, ring: false, pinky: false },
            '起': { thumb: true, index: false, middle: false, ring: false, pinky: false },
            '欢': { thumb: true, index: true, middle: true, ring: true, pinky: true },
            '迎': { thumb: true, index: true, middle: true, ring: true, pinky: true },
            '没': { thumb: true, index: true, middle: true, ring: true, pinky: true },
            '问': { thumb: true, index: true, middle: true, ring: true, pinky: true },
            '题': { thumb: true, index: true, middle: true, ring: true, pinky: true },
            '停': { thumb: false, index: false, middle: false, ring: false, pinky: false },
        };

        return configs[char] || { thumb: true, index: true, middle: true, ring: true, pinky: true };
    }

    addToHistory(type, text) {
        const now = new Date();
        const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;

        const empty = this.historyList.querySelector('.history-empty');
        if (empty) empty.remove();

        const item = document.createElement('div');
        item.className = 'history-item';

        const iconClass = type === 'sign' ? 'sign' : 'voice';
        const iconContent = type === 'sign' ? '🤟' : '🎤';

        item.innerHTML = `
            <div class="history-icon ${iconClass}">${iconContent}</div>
            <div class="history-content">
                <div class="history-text">${text}</div>
                <div class="history-time">${timeStr}</div>
            </div>
        `;

        this.historyList.insertBefore(item, this.historyList.firstChild);

        this.signHistory.push({ type, text, time: now });
        if (this.signHistory.length > 20) {
            this.signHistory.shift();
            this.historyList.removeChild(this.historyList.lastChild);
        }

        this.historyCount.textContent = `${this.signHistory.length} 条`;
    }

    updateSignStatus(state, label) {
        this.signStatusDot.className = 'panel-status-dot';
        this.signStatusLabel.className = 'panel-status-label';
        if (state === 'active') {
            this.signStatusDot.classList.add('active');
            this.signStatusLabel.classList.add('active');
        }
        this.signStatusLabel.textContent = label;
    }

    updateVoiceStatus(state, label) {
        this.voiceStatusDot.className = 'panel-status-dot';
        this.voiceStatusLabel.className = 'panel-status-label';
        if (state === 'recording') {
            this.voiceStatusDot.classList.add('recording');
            this.voiceStatusLabel.classList.add('recording');
        } else if (state === 'active') {
            this.voiceStatusDot.classList.add('active');
            this.voiceStatusLabel.classList.add('active');
        }
        this.voiceStatusLabel.textContent = label;
    }

    updateSystemStatus(state, label) {
        this.systemStatusDot.className = 'status-dot';
        if (state === 'active') {
            this.systemStatusDot.classList.add('active');
        }
        this.systemStatusText.textContent = label;
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            padding: 12px 20px;
            background: var(--text-primary);
            color: var(--text-inverse);
            border-radius: var(--radius-md);
            font-size: 0.85rem;
            font-weight: 500;
            box-shadow: var(--shadow-lg);
            animation: slideIn 0.2s ease;
        `;
        this.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(20px)';
            toast.style.transition = 'all 0.2s ease';
            setTimeout(() => toast.remove(), 200);
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SignLanguageTranslator();
});
