// 语音合成模块 - 绒花奶奶角色

const VoiceAssistant = {
    // 语音脚本（用逗号、句号制造自然停顿）
    scripts: {
        welcome: "欢迎来到绒花工坊。我是绒花奶奶。绒花啊，是咱们中国的传统手工艺，已经有上千年的历史了。今天，奶奶教你做一朵属于自己的绒花。来，跟着奶奶的指导，一步一步来。",
        step1: "第一步啊，咱们先给蚕丝染上漂亮的颜色。看到那边的染缸了吗？把蚕丝拖进去，选一个你喜欢的颜色。",
        step2: "现在呢，咱们来修剪绒毛的形状，让它更有层次感。先选一个你喜欢的形状，然后拿起剪刀，修剪一下。",
        step3: "现在把花瓣，一片一片地，贴到花蕊上。围成一圈，一朵花就成型了。",
        step4: "最后一步啦，把花朵装到花枝上，再加几片叶子，你的绒花就完成啦！",
        finish: "做得真好！这朵绒花真漂亮。绒花工艺啊，传承了上千年。希望你能喜欢这门手艺。"
    },
    
    currentUtterance: null,
    isSupported: false,
    chineseVoice: null,
    
    init() {
        if ('speechSynthesis' in window) {
            this.isSupported = true;
            this.loadVoices();
            speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
    },
    
    loadVoices() {
        const voices = speechSynthesis.getVoices();
        this.chineseVoice = voices.find(voice => 
            voice.lang.includes('zh') && voice.name.toLowerCase().includes('female')
        ) || voices.find(voice => 
            voice.lang.includes('zh')
        ) || voices[0];
        
        if (this.chineseVoice) {
            console.log('已选择语音:', this.chineseVoice.name);
        }
    },
    
    speak(text, callback) {
        // 显示漫画对话框
        this.showSpeechBubble(text);
        
        // 奶奶嘴巴动画
        this.setMouthState('speaking');
        // 奶奶点头
        this.playAnimation('nodding');
        
        if (!this.isSupported) {
            setTimeout(() => {
                this.setMouthState('smiling');
                if (callback) callback();
            }, 2000);
            return;
        }
        
        this.stop();
        
        this.currentUtterance = new SpeechSynthesisUtterance(text);
        
        if (this.chineseVoice) {
            this.currentUtterance.voice = this.chineseVoice;
        }
        this.currentUtterance.lang = 'zh-CN';
        this.currentUtterance.rate = 0.75;
        this.currentUtterance.pitch = 0.8;
        this.currentUtterance.volume = 1.0;
        
        this.currentUtterance.onend = () => {
            this.setMouthState('smiling');
            if (callback) callback();
        };
        
        this.currentUtterance.onerror = () => {
            this.setMouthState('smiling');
        };
        
        speechSynthesis.speak(this.currentUtterance);
    },
    
    // 显示漫画风格对话框
    showSpeechBubble(text) {
        const bubble = document.getElementById('grandmaSpeechBubble');
        const textEl = document.getElementById('speechText');
        
        if (!bubble || !textEl) return;
        
        // 先清空，重新触发 pop 动画
        bubble.style.animation = 'none';
        bubble.offsetHeight; // 触发 reflow
        bubble.style.animation = '';
        
        // 打字机效果
        textEl.textContent = '';
        let i = 0;
        const typing = () => {
            if (i < text.length) {
                textEl.textContent += text[i];
                i++;
                setTimeout(typing, 40);
            }
        };
        typing();
    },
    
    // 设置嘴巴状态
    setMouthState(state) {
        const mouth = document.getElementById('grandmaMouth');
        if (!mouth) return;
        mouth.className = 'grandma-mouth';
        if (state) {
            mouth.classList.add(state);
        }
    },
    
    // 播放动画
    playAnimation(name) {
        const body = document.getElementById('grandmaBody');
        if (!body) return;
        body.classList.add(name);
        setTimeout(() => {
            body.classList.remove(name);
        }, 2000);
    },
    
    speakStep(stepName) {
        const text = this.scripts[stepName];
        if (text) {
            this.speak(text);
        }
    },
    
    stop() {
        if (this.isSupported) {
            speechSynthesis.cancel();
        }
        this.setMouthState('smiling');
    }
};

window.VoiceAssistant = VoiceAssistant;
