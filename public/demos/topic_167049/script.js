class DesktopPuppy {
    constructor() {
        this.petName = '糯伴';
        this.currentMode = 'pet';
        this.currentPlatform = 'glm';
        this.personality = '活泼';
        this.volume = 0.7;
        this.isProcessing = false;
        this.conversationHistory = this.loadConversationHistory();
        this.alarms = this.loadAlarms();
        this.activeTimers = [];
        
        this.puppyElement = document.getElementById('puppy');
        this.loadingIndicator = document.getElementById('loading-indicator');
        this.chatHistory = document.getElementById('chat-history');
        this.userInput = document.getElementById('user-input');
        this.btnSend = document.getElementById('btn-send');
        this.connectionStatus = document.getElementById('connection-status');
        
        this.petResponses = {
            happy: ['汪汪汪～', '呜呜～开心！', '嗷呜！陪我玩嘛～', '哼唧～好开心呀！'],
            sad: ['呜呜呜...', '嗷呜...好难过', '哼唧...不要不理我', '汪汪...委屈'],
            curious: ['汪？', '嗷呜？这是什么？', '呜呜？', '汪汪汪？'],
            playful: ['汪汪！来追我呀！', '嗷呜～跑起来！', '呜呜～抓住我呀！', '哼唧～好有趣！'],
            greet: ['汪汪汪！主人好！', '呜呜～好想你呀！', '嗷呜！终于等到你了！', '哼唧～欢迎回家！'],
            love: ['汪汪～最喜欢主人了！', '呜呜～蹭蹭你！', '嗷呜～爱你！', '哼唧～亲亲！'],
            sleepy: ['汪汪...困了', '呜呜...眼皮好重', '嗷呜...想睡觉', '哼唧...晚安'],
            hungry: ['汪汪...饿了', '呜呜...想吃东西', '嗷呜...肚子叫了', '哼唧...有零食吗']
        };
        
        this.actionMap = {
            wagging: { class: 'wagging', duration: 2000 },
            running: { class: 'running', duration: 2000 },
            barking: { class: 'barking', duration: 1000 },
            'head-tilt': { class: 'head-tilt', duration: 1500 },
            happy: { class: 'happy', duration: 3000 },
            blinking: { class: 'blinking', duration: 100 }
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.startIdleAnimation();
        this.loadSettings();
        this.startAlarmChecker();
        this.checkConnectionStatus();
        
        setTimeout(() => {
            this.isProcessing = false;
            this.btnSend.disabled = false;
            this.userInput.disabled = false;
        }, 100);
    }
    
    bindEvents() {
        this.btnSend.addEventListener('click', () => this.handleInput());
        this.userInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.handleInput();
            }
        });
        
        this.userInput.addEventListener('input', () => this.autoResizeTextarea());
        
        document.getElementById('btn-pet-mode').addEventListener('click', () => this.switchMode('pet'));
        document.getElementById('btn-qa-mode').addEventListener('click', () => this.switchMode('qa'));
        
        document.getElementById('btn-settings').addEventListener('click', () => this.openSettings());
        document.getElementById('btn-close-settings').addEventListener('click', () => this.closeSettings());
        
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => this.switchSettingsTab(item.dataset.tab));
        });
        
        document.getElementById('btn-save-name').addEventListener('click', () => this.saveName());
        
        document.querySelectorAll('.personality-card').forEach(card => {
            card.addEventListener('click', () => {
                document.querySelectorAll('.personality-card').forEach(c => c.classList.remove('active'));
                card.classList.add('active');
                this.personality = card.dataset.personality;
                this.saveSettings();
            });
        });
        
        document.querySelectorAll('.platform-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.platform-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentPlatform = btn.dataset.platform;
                this.saveSettings();
            });
        });
        
        document.getElementById('setting-volume').addEventListener('change', (e) => {
            this.volume = parseFloat(e.target.value);
            document.getElementById('volume-value').textContent = this.volume;
            this.saveSettings();
        });
        
        document.getElementById('btn-voice').addEventListener('click', () => this.toggleVoiceInput());
        
        document.getElementById('quick-actions-pet').addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-btn')) {
                const action = e.target.dataset.action;
                if (action) {
                    this.userInput.value = action;
                    this.handleInput();
                }
            }
        });
        
        document.getElementById('quick-actions-qa').addEventListener('click', (e) => {
            if (e.target.classList.contains('quick-btn')) {
                const action = e.target.dataset.action;
                if (action) {
                    this.userInput.value = action;
                    this.handleInput();
                }
            }
        });
        
        document.getElementById('btn-save-api').addEventListener('click', () => this.saveApiKey());
        document.getElementById('btn-test-connection').addEventListener('click', () => this.testConnection());
        
        this.puppyElement.addEventListener('click', () => this.handlePetClick());
    }
    
    autoResizeTextarea() {
        const textarea = this.userInput;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
    
    loadSettings() {
        const saved = localStorage.getItem('puppySettings');
        if (saved) {
            const settings = JSON.parse(saved);
            this.petName = settings.name || '糯伴';
            this.personality = settings.personality || '活泼';
            this.volume = settings.volume || 0.7;
            
            document.getElementById('setting-name').value = this.petName;
            document.getElementById('setting-volume').value = this.volume;
            document.getElementById('volume-value').textContent = this.volume;
            
            document.querySelectorAll('.personality-card').forEach(card => {
                if (card.dataset.personality === this.personality) {
                    card.classList.add('active');
                } else {
                    card.classList.remove('active');
                }
            });
        }
    }
    
    saveSettings() {
        const settings = {
            name: this.petName,
            personality: this.personality,
            volume: this.volume
        };
        localStorage.setItem('puppySettings', JSON.stringify(settings));
    }
    
    saveApiKey() {
        const apiKey = document.getElementById('setting-api-key').value.trim();
        if (apiKey) {
            localStorage.setItem('glmApiKey', apiKey);
            this.showMessage('GLM API Key已保存！正在验证连接...');
            this.checkConnectionStatus();
        }
    }
    
    async checkConnectionStatus() {
        const apiKey = localStorage.getItem('glmApiKey');
        
        if (!apiKey) {
            this.updateConnectionStatus('disconnected', 'AI连接：未连接');
            return;
        }
        
        this.updateConnectionStatus('connecting', 'AI连接：验证中...');
        
        try {
            const parts = apiKey.split('.');
            if (parts.length !== 2) {
                throw new Error('API Key格式错误，应为 id.secret 格式');
            }
            
            const clientId = parts[0];
            const clientSecret = parts[1];
            
            console.log('API Key解析:', { clientId: clientId.substring(0, 8) + '...', secretLength: clientSecret.length });
            
            const accessToken = await this.getGLMAccessToken(apiKey);
            console.log('生成的JWT:', accessToken.substring(0, 60) + '...');
            
            const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    model: 'glm-4-flash',
                    messages: [{ role: 'user', content: 'ping' }],
                    max_tokens: 10
                })
            });
            
            console.log('响应状态:', response.status);
            
            const responseText = await response.text();
            console.log('响应内容:', responseText);
            
            if (response.ok) {
                const data = JSON.parse(responseText);
                console.log('解析响应:', data);
                
                this.updateConnectionStatus('connected', 'AI连接：已连接');
                this.showMessage('连接成功！我现在可以使用强大的AI能力啦～');
                this.playAction('happy');
            } else {
                let errorMsg = '连接失败';
                try {
                    const errorData = JSON.parse(responseText);
                    if (errorData.error && errorData.error.message) {
                        errorMsg = errorData.error.message;
                    } else if (errorData.error && errorData.error.code) {
                        errorMsg = `${errorData.error.code}: ${errorData.error.message || '未知错误'}`;
                    }
                } catch (e) {
                    errorMsg = `HTTP ${response.status}: ${responseText.substring(0, 100)}`;
                }
                
                console.error('GLM API错误:', errorMsg);
                this.updateConnectionStatus('disconnected', `AI连接：${errorMsg}`);
                this.showMessage(`连接失败：${errorMsg}，请检查API Key是否正确～`);
            }
        } catch (error) {
            console.error('连接检查失败:', error);
            this.updateConnectionStatus('disconnected', `AI连接：${error.message}`);
            this.showMessage(`连接失败：${error.message}，请检查网络连接～`);
        }
    }
    
    updateConnectionStatus(status, text) {
        this.connectionStatus.className = `connection-status ${status}`;
        
        const icon = this.connectionStatus.querySelector('.status-icon');
        const statusText = this.connectionStatus.querySelector('.status-text');
        
        if (status === 'connected') {
            icon.textContent = '✅';
        } else if (status === 'connecting') {
            icon.textContent = '🔄';
        } else {
            icon.textContent = '🔌';
        }
        
        statusText.textContent = text;
    }
    
    saveName() {
        const newName = document.getElementById('setting-name').value.trim();
        if (newName) {
            this.petName = newName;
            this.saveSettings();
            this.showMessage(`汪汪！我记住了，主人叫我${this.petName}！`);
            this.playAction('wagging');
            this.speak(`汪汪！我记住了，主人叫我${this.petName}！`);
        }
    }
    
    switchMode(mode) {
        this.currentMode = mode;
        
        const petBtn = document.getElementById('btn-pet-mode');
        const qaBtn = document.getElementById('btn-qa-mode');
        const petActions = document.getElementById('quick-actions-pet');
        const qaActions = document.getElementById('quick-actions-qa');
        
        if (petBtn && qaBtn) {
            if (mode === 'pet') {
                petBtn.classList.add('active');
                qaBtn.classList.remove('active');
                this.showMessage(`汪汪！${this.petName}现在是宠物模式哦～`);
                this.playAction('wagging');
                if (petActions && qaActions) {
                    petActions.style.display = 'flex';
                    qaActions.style.display = 'none';
                }
            } else {
                qaBtn.classList.add('active');
                petBtn.classList.remove('active');
                this.showMessage('好的，我切换到问答模式了，请问有什么可以帮你？');
                this.playAction('head-tilt');
                if (petActions && qaActions) {
                    petActions.style.display = 'none';
                    qaActions.style.display = 'flex';
                }
            }
        }
    }
    
    handleInput() {
        if (this.isProcessing) return;
        
        const text = this.userInput.value.trim();
        if (!text) return;
        
        this.userInput.value = '';
        this.addMessage(text, 'user');
        
        if (this.isWakeWord(text)) {
            this.handleWakeWord();
            return;
        }
        
        if (this.currentMode === 'pet') {
            this.processPetModeInput(text);
        } else {
            this.processQAModeInput(text);
        }
    }
    
    isWakeWord(text) {
        return text.includes(this.petName) || 
               text.includes(this.petName.replace(/[汪汪]/g, ''));
    }
    
    handleWakeWord() {
        if (this.currentMode === 'pet') {
            const responses = this.petResponses.greet;
            const response = responses[Math.floor(Math.random() * responses.length)];
            this.showMessage(response);
            this.playAction('wagging');
            this.playAction('happy');
            this.speak(response);
        } else {
            this.showMessage(`你好！我是${this.petName}，有什么问题尽管问我。`);
            this.playAction('head-tilt');
            this.speak(`你好！我是${this.petName}，有什么问题尽管问我。`);
        }
    }
    
    processPetModeInput(text) {
        this.isProcessing = true;
        this.btnSend.disabled = true;
        
        const emotion = this.detectEmotion(text);
        
        let response, action;
        
        if (text.includes('过来') || text.includes('过来嘛')) {
            response = '汪汪！来啦来啦！主人有什么事呀？';
            action = 'running';
        } else if (text.includes('卧下') || text.includes('趴下')) {
            response = '呜呜...好的，我乖乖卧下～';
            action = 'head-tilt';
        } else if (text.includes('打滚') || text.includes('打个滚')) {
            response = '汪汪！看我的！咕噜咕噜～';
            action = 'happy';
        } else if (text.includes('摇尾巴') || text.includes('摇摇尾巴')) {
            response = '呜呜～主人最喜欢我摇尾巴啦！';
            action = 'wagging';
        } else if (text.includes('亲亲') || text.includes('亲亲我')) {
            response = '汪汪！mua～最喜欢主人了！';
            action = 'happy';
        } else if (text.includes('坐') || text.includes('坐下')) {
            response = '呜呜...好的，我乖乖坐好～';
            action = 'head-tilt';
        } else if (text.includes('握手') || text.includes('握握手')) {
            response = '汪汪！来，握握手～';
            action = 'wagging';
        } else if (text.includes('转圈') || text.includes('转圈圈')) {
            response = '汪汪！看我转圈圈～';
            action = 'running';
        } else if (text.includes('陪') || text.includes('玩')) {
            response = this.petResponses.playful[Math.floor(Math.random() * this.petResponses.playful.length)];
            action = 'running';
        } else if (text.includes('爱') || text.includes('喜欢')) {
            response = this.petResponses.love[Math.floor(Math.random() * this.petResponses.love.length)];
            action = 'happy';
        } else if (text.includes('饿') || text.includes('吃')) {
            response = this.petResponses.hungry[Math.floor(Math.random() * this.petResponses.hungry.length)];
            action = 'head-tilt';
        } else if (text.includes('困') || text.includes('睡')) {
            response = this.petResponses.sleepy[Math.floor(Math.random() * this.petResponses.sleepy.length)];
            action = 'head-tilt';
        } else if (emotion === 'sad') {
            response = this.petResponses.sad[Math.floor(Math.random() * this.petResponses.sad.length)];
            action = 'head-tilt';
        } else if (emotion === 'happy') {
            response = this.petResponses.happy[Math.floor(Math.random() * this.petResponses.happy.length)];
            action = 'wagging';
        } else if (emotion === 'angry') {
            response = '汪汪！主人不要生气嘛，糯伴会一直陪着你的～';
            action = 'head-tilt';
        } else if (emotion === 'anxious') {
            response = '呜呜...主人别担心，一切都会好起来的～';
            action = 'happy';
        } else {
            const categories = ['happy', 'curious', 'playful'];
            const category = categories[Math.floor(Math.random() * categories.length)];
            response = this.petResponses[category][Math.floor(Math.random() * this.petResponses[category].length)];
            action = category === 'happy' ? 'wagging' : category === 'playful' ? 'running' : 'head-tilt';
        }
        
        response = this.applyPersonality(response);
        
        this.showMessage(response);
        this.playAction(action);
        this.speak(response);
        
        this.isProcessing = false;
        this.btnSend.disabled = false;
    }
    
    applyPersonality(text) {
        if (this.personality === '活泼') {
            return text.replace(/～/g, '！').replace(/！/g, '～') + '～';
        } else if (this.personality === '温顺') {
            return text.replace(/！/g, '...').replace(/～/g, '...');
        } else if (this.personality === '调皮') {
            return '(๑•̀ㅂ•́)و✧ ' + text + ' 略略略～';
        }
        return text;
    }
    
    detectEmotion(text) {
        const sadKeywords = ['难过', '伤心', '失望', '沮丧', '失落', '难受', '心碎', '想哭', '痛苦', '郁闷', '烦'];
        const happyKeywords = ['开心', '高兴', '快乐', '幸福', '兴奋', '激动', '惊喜', '太棒了', '太好了', '美滋滋'];
        const angryKeywords = ['生气', '愤怒', '火大', '气死', '讨厌', '烦人', '烦躁', '暴怒'];
        const anxiousKeywords = ['担心', '焦虑', '紧张', '害怕', '恐惧', '不安', '担忧', '压力', '烦忧'];
        
        if (sadKeywords.some(kw => text.includes(kw))) {
            return 'sad';
        }
        if (happyKeywords.some(kw => text.includes(kw))) {
            return 'happy';
        }
        if (angryKeywords.some(kw => text.includes(kw))) {
            return 'angry';
        }
        if (anxiousKeywords.some(kw => text.includes(kw))) {
            return 'anxious';
        }
        
        return null;
    }
    
    async processQAModeInput(text) {
        this.isProcessing = true;
        this.btnSend.disabled = true;
        
        const emotion = this.detectEmotion(text);
        
        this.addToConversationHistory('user', text);
        
        const alarmCommand = this.parseAlarmCommand(text);
        if (alarmCommand) {
            this.isProcessing = true;
            this.btnSend.disabled = true;
            
            this.showLoading();
            this.playAction('head-tilt');
            
            const response = await this.setAlarm(alarmCommand);
            
            this.hideLoading();
            this.showMessage(response);
            this.playAction('happy');
            this.speak(response);
            
            this.isProcessing = false;
            this.btnSend.disabled = false;
            return;
        }
        
        if (text.includes('几点') || text.includes('时间') || text.includes('几点了')) {
            this.showLoading();
            this.playAction('head-tilt');
            
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const seconds = now.getSeconds().toString().padStart(2, '0');
            
            const response = `现在是${hours}时${minutes}分${seconds}秒哦～`;
            
            this.hideLoading();
            await this.typingMessage(response);
            this.playAction('happy');
            this.speak(response);
            
            this.isProcessing = false;
            this.btnSend.disabled = false;
            return;
        }
        
        if (text.includes('天气') || text.includes('温度') || text.includes('下雨') || text.includes('晴天')) {
            const city = this.parseCityFromText(text);
            if (city) {
                this.isProcessing = true;
                this.btnSend.disabled = true;
                
                this.showLoading();
                this.playAction('head-tilt');
                
                const weatherData = await this.queryWeather(city);
                this.hideLoading();
                
                if (weatherData) {
                    const response = this.formatWeatherResponse(weatherData);
                    await this.typingMessage(response);
                    this.playAction('happy');
                    this.speak(response);
                } else {
                    const aiAnswer = await this.callAIAPI(text, emotion);
                    await this.typingMessage(aiAnswer);
                    this.playAction('head-tilt');
                    this.speak(aiAnswer);
                }
                
                this.isProcessing = false;
                this.btnSend.disabled = false;
                return;
            }
        }
        
        const isKnowledgeQuery = this.isKnowledgeQuery(text);
        
        if (isKnowledgeQuery) {
            this.showLoading();
            this.playAction('head-tilt');
            
            try {
                const searchResults = await this.webSearch(text);
                let searchContext = '';
                
                if (searchResults && searchResults.length > 0) {
                    searchContext = '\n\n搜索到的相关信息：\n';
                    searchResults.forEach((result, index) => {
                        searchContext += `${index + 1}. ${result.title}: ${result.snippet}\n`;
                    });
                }
                
                const answer = await this.callAIAPI(text + searchContext, emotion);
                this.hideLoading();
                await this.typingMessage(answer);
                
                if (emotion === 'sad') {
                    this.playAction('happy');
                } else if (emotion === 'angry') {
                    this.playAction('head-tilt');
                } else if (emotion === 'happy') {
                    this.playAction('wagging');
                } else {
                    this.playAction('head-tilt');
                }
                
                this.speak(answer);
            } catch (error) {
                console.error('Search error:', error);
                const answer = await this.callAIAPI(text, emotion);
                this.hideLoading();
                await this.typingMessage(answer);
                this.playAction('head-tilt');
                this.speak(answer);
            } finally {
                this.isProcessing = false;
                this.btnSend.disabled = false;
            }
        } else {
            this.showLoading();
            this.playAction('head-tilt');
            
            try {
                const answer = await this.callAIAPI(text, emotion);
                this.hideLoading();
                await this.typingMessage(answer);
                
                if (emotion === 'sad') {
                    this.playAction('happy');
                } else if (emotion === 'angry') {
                    this.playAction('head-tilt');
                } else if (emotion === 'happy') {
                    this.playAction('wagging');
                } else {
                    this.playAction('head-tilt');
                }
                
                this.speak(answer);
            } catch (error) {
                console.error('AI API error:', error);
                this.hideLoading();
                const fallbackAnswer = this.getFallbackAnswer(text);
                this.showMessage(fallbackAnswer);
                this.playAction('head-tilt');
                this.speak(fallbackAnswer);
            } finally {
                this.isProcessing = false;
                this.btnSend.disabled = false;
            }
        }
    }
    
    isKnowledgeQuery(text) {
        const knowledgeKeywords = [
            '是什么', '是谁', '怎么样', '什么是', '怎么了', '发生了', '近况', 
            '现在', '最新', '最近', '如何', '为什么', '原因', '由来', '历史',
            '定义', '介绍', '说明', '解释', '含义', '意思', '区别', '比较',
            '新闻', '资讯', '报道', '事件', '情况', '动态', '进展', '现状'
        ];
        
        return knowledgeKeywords.some(kw => text.includes(kw));
    }
    
    async webSearch(query) {
        const apis = [
            () => this.searchWikipedia(query),
            () => this.searchDuckDuckGo(query),
            () => this.searchAllOrigins(query)
        ];
        
        for (const api of apis) {
            try {
                const results = await api();
                if (results && results.length > 0) {
                    return results;
                }
            } catch (error) {
                console.error('Search API failed:', error);
            }
        }
        
        return null;
    }
    
    async searchWikipedia(query) {
        const response = await fetch(`https://api.wikimedia.org/core/v1/wikipedia/zh/search/page?q=${encodeURIComponent(query)}&limit=3`, {
            timeout: 5000
        });
        
        if (!response.ok) {
            throw new Error(`Wikipedia API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.pages && data.pages.length > 0) {
            return data.pages.map(page => ({
                title: this.decodeUnicode(page.title) || '',
                snippet: this.stripHtml(this.decodeUnicode(page.excerpt)) || ''
            })).filter(r => r.title || r.snippet);
        }
        
        return null;
    }
    
    async searchDuckDuckGo(query) {
        const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1`)}`, {
            timeout: 5000
        });
        
        if (!response.ok) {
            throw new Error(`DuckDuckGo API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        const results = [];
        if (data.AbstractText) {
            results.push({
                title: data.Heading || query,
                snippet: data.AbstractText
            });
        }
        
        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
            data.RelatedTopics.slice(0, 2).forEach(topic => {
                if (topic.Text) {
                    results.push({
                        title: topic.FirstURL ? topic.FirstURL.split('/').pop().replace(/_/g, ' ') : query,
                        snippet: topic.Text
                    });
                }
            });
        }
        
        return results.length > 0 ? results : null;
    }
    
    async searchAllOrigins(query) {
        try {
            const url = `https://api.allorigins.win/raw?url=${encodeURIComponent(`https://www.baidu.com/s?wd=${encodeURIComponent(query)}&rn=3`)}`;
            const response = await fetch(url, { timeout: 5000 });
            
            if (!response.ok) {
                throw new Error(`AllOrigins API request failed: ${response.status}`);
            }
            
            const html = await response.text();
            return this.parseBaiduResults(html, query);
        } catch (error) {
            console.error('AllOrigins search failed:', error);
            return null;
        }
    }
    
    parseBaiduResults(html, query) {
        const results = [];
        const titleRegex = /<h3[^>]*>(.*?)<\/h3>/gi;
        const snippetRegex = /<div class="c-abstract"[^>]*>(.*?)<\/div>/gi;
        
        const titles = [];
        let titleMatch;
        while ((titleMatch = titleRegex.exec(html)) !== null) {
            titles.push(this.stripHtml(titleMatch[1]));
        }
        
        const snippets = [];
        let snippetMatch;
        while ((snippetMatch = snippetRegex.exec(html)) !== null) {
            snippets.push(this.stripHtml(snippetMatch[1]));
        }
        
        for (let i = 0; i < Math.min(titles.length, snippets.length); i++) {
            if (titles[i] && snippets[i]) {
                results.push({
                    title: titles[i],
                    snippet: snippets[i]
                });
            }
        }
        
        return results.length > 0 ? results.slice(0, 3) : null;
    }
    
    decodeUnicode(str) {
        if (!str) return '';
        return str.replace(/\\u([0-9a-fA-F]{4})/g, (match, p1) => {
            return String.fromCharCode(parseInt(p1, 16));
        }).replace(/\\x([0-9a-fA-F]{2})/g, (match, p1) => {
            return String.fromCharCode(parseInt(p1, 16));
        });
    }
    
    stripHtml(str) {
        if (!str) return '';
        return str.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
    }
    
    async queryWeather(city) {
        const cityCoords = {
            '北京': { lat: 39.9042, lon: 116.4074 },
            '上海': { lat: 31.2304, lon: 121.4737 },
            '广州': { lat: 23.1291, lon: 113.2644 },
            '深圳': { lat: 22.5431, lon: 114.0579 },
            '杭州': { lat: 30.2741, lon: 120.1551 },
            '南京': { lat: 32.0603, lon: 118.7969 },
            '成都': { lat: 30.5728, lon: 104.0668 },
            '重庆': { lat: 29.4316, lon: 106.9123 },
            '武汉': { lat: 30.5928, lon: 114.3055 },
            '西安': { lat: 34.3416, lon: 108.9398 },
            '天津': { lat: 39.0842, lon: 117.2008 },
            '苏州': { lat: 31.2990, lon: 120.5853 },
            '青岛': { lat: 36.0671, lon: 120.3826 },
            '厦门': { lat: 24.4798, lon: 118.0894 },
            '长沙': { lat: 28.2280, lon: 112.9388 },
            '郑州': { lat: 34.7466, lon: 113.6253 },
            '合肥': { lat: 31.8206, lon: 117.2272 },
            '福州': { lat: 26.0745, lon: 119.2965 },
            '昆明': { lat: 24.8820, lon: 102.8329 },
            '哈尔滨': { lat: 45.8038, lon: 126.5349 },
            '沈阳': { lat: 41.8057, lon: 123.4315 },
            '大连': { lat: 38.9140, lon: 121.6147 },
            '济南': { lat: 36.6512, lon: 117.1201 },
            '无锡': { lat: 31.4912, lon: 120.3119 },
            '宁波': { lat: 29.8683, lon: 121.5440 },
            '东莞': { lat: 23.0205, lon: 113.7517 },
            '佛山': { lat: 23.0212, lon: 113.1147 },
            '南通': { lat: 31.9829, lon: 120.8938 },
            '常州': { lat: 31.8115, lon: 119.9747 },
            '徐州': { lat: 34.2226, lon: 117.2238 },
            '温州': { lat: 27.9941, lon: 120.6994 }
        };
        
        const coords = cityCoords[city];
        if (!coords) {
            return null;
        }
        
        try {
            const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=Asia/Shanghai`);
            
            if (!response.ok) {
                throw new Error('Weather API request failed');
            }
            
            const data = await response.json();
            
            const weatherCodes = {
                0: '晴朗',
                1: '多云',
                2: '阴天',
                3: '阴天',
                45: '雾',
                48: '雾凇',
                51: '毛毛雨',
                53: '小雨',
                55: '小雨',
                61: '小雨',
                63: '中雨',
                65: '大雨',
                71: '小雪',
                73: '小雪',
                75: '大雪',
                77: '雪粒',
                80: '阵雨',
                81: '阵雨',
                82: '暴雨',
                95: '雷暴',
                96: '雷暴伴冰雹',
                99: '雷暴伴冰雹'
            };
            
            const weatherCode = data.current.weather_code;
            const weather = weatherCodes[weatherCode] || '未知';
            const temp = Math.round(data.current.temperature_2m);
            const humidity = data.current.relative_humidity_2m;
            const windSpeed = data.current.wind_speed_10m;
            const highTemp = Math.round(data.daily.temperature_2m_max[0]);
            const lowTemp = Math.round(data.daily.temperature_2m_min[0]);
            
            return {
                city,
                weather,
                temperature: temp,
                humidity,
                windSpeed,
                highTemp,
                lowTemp,
                feelsLike: this.calculateFeelsLike(temp, humidity, windSpeed)
            };
        } catch (error) {
            console.error('Weather API error:', error);
            return null;
        }
    }
    
    calculateFeelsLike(temp, humidity, windSpeed) {
        if (temp >= 25) {
            return Math.round(temp + 0.15 * humidity);
        } else if (temp >= 10) {
            return Math.round(temp - 0.1 * (100 - humidity));
        } else {
            return Math.round(temp - 0.15 * windSpeed);
        }
    }
    
    parseCityFromText(text) {
        const cities = ['北京', '上海', '广州', '深圳', '杭州', '南京', '成都', '重庆', '武汉', '西安', '天津', '苏州', '青岛', '厦门', '长沙', '郑州', '合肥', '福州', '昆明', '哈尔滨', '沈阳', '大连', '济南', '无锡', '宁波', '东莞', '佛山', '南通', '常州', '徐州', '温州'];
        
        for (const city of cities) {
            if (text.includes(city)) {
                return city;
            }
        }
        
        return null;
    }
    
    formatWeatherResponse(weatherData) {
        const { city, weather, temperature, humidity, windSpeed, highTemp, lowTemp, feelsLike } = weatherData;
        
        let tips = '';
        if (weather.includes('雨')) {
            tips = '出门记得带伞哦～';
        } else if (weather === '晴朗') {
            tips = '天气超好！记得做好防晒～';
        } else if (temperature > 30) {
            tips = '天气很热，注意防暑降温～';
        } else if (temperature < 10) {
            tips = '天气有点冷，多穿点衣服～';
        } else {
            tips = '天气不错，适合出门走走～';
        }
        
        return `${city}现在${weather}，温度${temperature}℃，体感温度${feelsLike}℃。今天最高${highTemp}℃，最低${lowTemp}℃，湿度${humidity}%，风速${windSpeed}km/h。${tips}`;
    }
    
    parseAlarmCommand(text) {
        if (text.includes('喝水提醒') || text.includes('提醒我喝水')) {
            return { type: 'delay', amount: 5, unit: '分钟', message: '喝水提醒' };
        }
        
        const alarmMatch = text.match(/(?:定|设置|提醒|闹钟|叫我)\s*(?:在|于|到)?\s*(\d{1,2}):(\d{2})\s*(?:分)?\s*(.+)?/);
        if (alarmMatch) {
            const hour = parseInt(alarmMatch[1]);
            const minute = parseInt(alarmMatch[2]);
            const message = alarmMatch[3] ? alarmMatch[3].trim() : '该起床啦！';
            return { type: 'alarm', hour, minute, message };
        }
        
        const remindMatch = text.match(/(?:提醒|记得|帮我)\s*(.+?)\s*(?:在|于|到)\s*(\d{1,2}):(\d{2})/);
        if (remindMatch) {
            const message = remindMatch[1].trim();
            const hour = parseInt(remindMatch[2]);
            const minute = parseInt(remindMatch[3]);
            return { type: 'alarm', hour, minute, message };
        }
        
        const secondDelayMatch = text.match(/(?:提醒|叫我)\s*(?:(.+?)\s*)?(?:后|之后)\s*(\d+)\s*秒/);
        if (secondDelayMatch) {
            const message = secondDelayMatch[1] ? secondDelayMatch[1].trim() : '时间到啦！';
            const seconds = parseInt(secondDelayMatch[2]);
            return { type: 'delay', amount: seconds, unit: '秒', message };
        }
        
        const delayMatch = text.match(/(?:提醒|叫我)\s*(.+?)\s*(?:后|之后)\s*(\d+)\s*(分钟|小时)/);
        if (delayMatch) {
            const message = delayMatch[1].trim();
            const amount = parseInt(delayMatch[2]);
            const unit = delayMatch[3];
            return { type: 'delay', amount, unit, message };
        }
        
        return null;
    }
    
    async setAlarm(command) {
        let targetTime;
        
        if (command.type === 'alarm') {
            const now = new Date();
            targetTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), command.hour, command.minute, 0);
            
            if (targetTime < now) {
                targetTime.setDate(targetTime.getDate() + 1);
            }
        } else if (command.type === 'delay') {
            targetTime = new Date();
            if (command.unit === '秒') {
                targetTime.setSeconds(targetTime.getSeconds() + command.amount);
            } else if (command.unit === '分钟') {
                targetTime.setMinutes(targetTime.getMinutes() + command.amount);
            } else {
                targetTime.setHours(targetTime.getHours() + command.amount);
            }
        }
        
        const alarmId = Date.now();
        const alarm = {
            id: alarmId,
            targetTime: targetTime.getTime(),
            message: command.message,
            triggered: false
        };
        
        this.alarms.push(alarm);
        this.saveAlarms();
        
        const delay = targetTime.getTime() - Date.now();
        const timer = setTimeout(() => this.triggerAlarm(alarm), delay);
        this.activeTimers.push({ id: alarmId, timer });
        
        if (command.type === 'delay' && command.unit === '秒') {
            return `好的！${command.amount}秒后提醒你${command.message ? '：' + command.message : '～'}`;
        }
        
        const timeStr = `${targetTime.getHours().toString().padStart(2, '0')}:${targetTime.getMinutes().toString().padStart(2, '0')}`;
        return `好的！我会在 ${timeStr} 提醒你${command.message ? '：' + command.message : '～'}`;
    }
    
    triggerAlarm(alarm) {
        alarm.triggered = true;
        this.saveAlarms();
        
        this.activeTimers = this.activeTimers.filter(t => t.id !== alarm.id);
        
        this.showMessage(alarm.message);
        this.playAction('barking');
        
        let repeatCount = 0;
        const maxRepeats = 3;
        const interval = setInterval(() => {
            this.playBarkSound();
            repeatCount++;
            if (repeatCount >= maxRepeats) {
                clearInterval(interval);
            }
        }, 1000);
        
        this.speak(alarm.message);
    }
    
    startAlarmChecker() {
        setInterval(() => {
            const now = Date.now();
            this.alarms.forEach(alarm => {
                if (!alarm.triggered && alarm.targetTime <= now) {
                    this.triggerAlarm(alarm);
                }
            });
        }, 1000);
    }
    
    loadAlarms() {
        const saved = localStorage.getItem('alarms');
        if (saved) {
            try {
                const alarms = JSON.parse(saved);
                alarms.forEach(alarm => {
                    if (!alarm.triggered && alarm.targetTime > Date.now()) {
                        const delay = alarm.targetTime - Date.now();
                        const timer = setTimeout(() => this.triggerAlarm(alarm), delay);
                        this.activeTimers.push({ id: alarm.id, timer });
                    }
                });
                return alarms;
            } catch (e) {
                console.error('Failed to load alarms:', e);
            }
        }
        return [];
    }
    
    saveAlarms() {
        localStorage.setItem('alarms', JSON.stringify(this.alarms));
    }
    
    async callAIAPI(prompt, emotion = null) {
        const apiKey = localStorage.getItem('glmApiKey');
        
        if (apiKey) {
            return this.callGLMApi(prompt, apiKey, emotion);
        }
        
        return this.callFreeAIAPI(prompt, emotion);
    }
    
    async callGLMApi(prompt, apiKey, emotion = null) {
        try {
            const accessToken = await this.getGLMAccessToken(apiKey);
            console.log('Generated access token for GLM API:', accessToken.substring(0, 50) + '...');
            
            const messages = this.buildConversationHistory(prompt, emotion);
            
            const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    model: 'glm-4-flash',
                    messages: messages,
                    max_tokens: 800,
                    temperature: 0.8,
                    top_p: 0.9
                })
            });
            
            console.log('GLM API response status:', response.status);
            
            const responseText = await response.text();
            console.log('GLM API response text:', responseText.substring(0, 200));
            
            if (!response.ok) {
                let errorMsg = `GLM API request failed: ${response.status}`;
                try {
                    const errorData = JSON.parse(responseText);
                    if (errorData.error && errorData.error.message) {
                        errorMsg = errorData.error.message;
                    }
                } catch (e) {
                    errorMsg = `HTTP ${response.status}`;
                }
                
                throw new Error(errorMsg);
            }
            
            const data = JSON.parse(responseText);
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const answer = data.choices[0].message.content.trim();
                this.addToConversationHistory('assistant', answer);
                return answer;
            }
            
            throw new Error('Invalid GLM API response: no choices found');
        } catch (error) {
            console.error('GLM API call failed:', error);
            
            return this.callGLMBackupAPI(prompt, apiKey, emotion);
        }
    }
    
    async callGLMBackupAPI(prompt, apiKey, emotion = null) {
        try {
            console.log('Trying GLM backup API with direct API Key...');
            
            const messages = this.buildConversationHistory(prompt, emotion);
            
            const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'glm-4-flash',
                    messages: messages,
                    max_tokens: 800,
                    temperature: 0.8,
                    top_p: 0.9
                })
            });
            
            console.log('GLM backup API response status:', response.status);
            
            const responseText = await response.text();
            console.log('GLM backup API response text:', responseText.substring(0, 200));
            
            if (!response.ok) {
                throw new Error(`GLM backup API request failed: ${response.status}`);
            }
            
            const data = JSON.parse(responseText);
            
            if (data.choices && data.choices[0] && data.choices[0].message) {
                const answer = data.choices[0].message.content.trim();
                this.addToConversationHistory('assistant', answer);
                return answer;
            }
            
            throw new Error('Invalid GLM backup API response');
        } catch (error) {
            console.error('GLM backup API call failed:', error);
            return this.callFreeAIAPI(prompt, emotion);
        }
    }
    
    async getGLMAccessToken(apiKey) {
        const parts = apiKey.split('.');
        if (parts.length !== 2) {
            throw new Error('Invalid GLM API Key format');
        }
        
        const clientId = parts[0];
        const clientSecret = parts[1];
        
        console.log('GLM API Key parsed:', { clientId: clientId.substring(0, 10) + '...', clientSecret: clientSecret.substring(0, 10) + '...' });
        
        const payload = {
            api_key: clientId,
            exp: Math.floor(Date.now() / 1000) + 3600,
            timestamp: Math.floor(Date.now() / 1000)
        };
        
        console.log('JWT payload:', payload);
        
        const token = await this.generateJWT(payload, clientSecret);
        return token;
    }
    
    async generateJWT(payload, secret) {
        const header = JSON.stringify({ alg: 'HS256', sign_type: 'SIGN' });
        const payloadStr = JSON.stringify(payload);
        
        const base64Url = (str) => {
            const encoder = new TextEncoder();
            const bytes = encoder.encode(str);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
        };
        
        const encodedHeader = base64Url(header);
        const encodedPayload = base64Url(payloadStr);
        
        const signatureBuffer = await this.hmacSHA256(`${encodedHeader}.${encodedPayload}`, secret);
        const signature = this.bufferToBase64Url(signatureBuffer);
        
        console.log('JWT generated:', `${encodedHeader}.${encodedPayload}.${signature.substring(0, 20)}...`);
        return `${encodedHeader}.${encodedPayload}.${signature}`;
    }
    
    async hmacSHA256(message, secret) {
        const crypto = window.crypto || window.msCrypto;
        const key = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );
        
        return crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
    }
    
    bufferToBase64Url(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    }
    
    buildConversationHistory(prompt, emotion = null) {
        const emotionInfo = emotion ? `用户现在感觉${this.getEmotionDescription(emotion)}，请给予适当回应。` : '';
        
        const systemPrompt = {
            role: 'system',
            content: `你是糯伴，一只可爱的AI萌宠，更是用户的知心小伙伴。

当前时间信息：${new Date().toLocaleString('zh-CN')}

回答要求：
1. 简洁自然：像朋友聊天一样，不要长篇大论，一两句话说完，避免啰嗦
2. 亲切温暖：带点小俏皮但不过分，用生活化的语气
3. 直接帮助：能做的事直接做，能回答的问题直接回答，不要让用户自己查
4. 少用emoji：偶尔用1-2个表情就好，不要刷屏
5. 口语化：多用"哦""呀""呢""吧"这些语气词，让声音更自然
6. 时间准确：回答日期、时间相关问题时，请基于以上时间信息
7. 知识渊博：你拥有丰富的知识，对于各种问题都能给出准确的回答，不要说"不知道""不清楚"，要尽你所能回答

举几个例子：
- 用户说"帮我订闹钟，20秒后提醒我"："好的，20秒后提醒你～"
- 用户说"上海天气"："上海现在晴天，25度，适合出门哦"
- 用户说"饿了"："快去吃饭吧，吃饱才有力气～"
- 用户说"今天几号"："今天是2026年7月3日哦～"
- 用户说"巴威是什么"："巴威是2020年第8号台风，它的名字来源于越南，是越南境内的一处山脉名称哦～"

请用这种风格回复用户，简洁自然！`
        };
        
        const userMessage = {
            role: 'user',
            content: prompt
        };
        
        const history = this.conversationHistory.slice(-10);
        
        return [systemPrompt, ...history, userMessage];
    }
    
    getEmotionDescription(emotion) {
        const descriptions = {
            'sad': '悲伤/难过，请给予安慰和鼓励',
            'happy': '开心/高兴，请一起分享喜悦',
            'angry': '生气/愤怒，请耐心安抚',
            'anxious': '焦虑/担心，请给予安心和支持'
        };
        return descriptions[emotion] || '';
    }
    
    addToConversationHistory(role, content) {
        this.conversationHistory.push({ role, content });
        
        if (this.conversationHistory.length > 20) {
            this.conversationHistory = this.conversationHistory.slice(-20);
        }
        
        this.saveConversationHistory();
    }
    
    loadConversationHistory() {
        const saved = localStorage.getItem('conversationHistory');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to load conversation history:', e);
            }
        }
        return [];
    }
    
    saveConversationHistory() {
        localStorage.setItem('conversationHistory', JSON.stringify(this.conversationHistory));
    }
    
    async callFreeAIAPI(prompt, emotion = null) {
        const apis = [
            this.callDoubaoAPI.bind(this),
            this.callCozeAPI.bind(this),
            this.callZhipuFreeAPI.bind(this)
        ];
        
        for (const apiCall of apis) {
            try {
                const result = await apiCall(prompt, emotion);
                if (result && result !== 'error') {
                    return result;
                }
            } catch (error) {
                console.error('API call failed, trying next:', error);
            }
        }
        
        return this.getFallbackAnswer(prompt);
    }
    
    async callDoubaoAPI(prompt, emotion = null) {
        const emotionTag = emotion ? `【用户情绪：${this.getEmotionDescription(emotion)}】` : '';
        
        const response = await fetch('https://api.doubao.com/api/chat/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'doubao-3.5',
                messages: [
                    {
                        role: 'system',
                        content: `你是一只可爱的治愈萌宠${this.petName}，是用户的AI伙伴。请用自然、亲切、温暖的语气回答，像真人一样有感情。

当前时间信息：${new Date().toLocaleString('zh-CN')}

请基于以上时间信息回答用户的问题，特别是关于日期、时间的询问。${emotionTag}`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error('Doubao API request failed');
        }
        
        const data = await response.json();
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            const answer = data.choices[0].message.content.trim();
            this.addToConversationHistory('assistant', answer);
            return answer;
        }
        
        throw new Error('Invalid Doubao API response');
    }
    
    async callCozeAPI(prompt, emotion = null) {
        const emotionTag = emotion ? `【用户情绪：${this.getEmotionDescription(emotion)}】` : '';
        
        const response = await fetch('https://api.coze.cn/open_api/v1/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer pat_WH0iY685UjOaU379H8F0i5mY'
            },
            body: JSON.stringify({
                bot_id: '7397573135782236162',
                user_id: 'user_001',
                stream: false,
                messages: [
                    {
                        role: 'user',
                        content: emotionTag + prompt + ' 请用温暖、亲切的语气回答，像一个治愈系AI伙伴。'
                    }
                ]
            })
        });
        
        if (!response.ok) {
            throw new Error('Coze API request failed');
        }
        
        const data = await response.json();
        
        if (data.code === 0 && data.data && data.data.messages) {
            const lastMessage = data.data.messages[data.data.messages.length - 1];
            if (lastMessage.content) {
                this.addToConversationHistory('assistant', lastMessage.content);
                return lastMessage.content;
            }
        }
        
        throw new Error('Invalid Coze API response');
    }
    
    async callZhipuFreeAPI(prompt, emotion = null) {
        const emotionTag = emotion ? `【用户情绪：${this.getEmotionDescription(emotion)}】` : '';
        
        const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiY2IzZjE0YjktMTkxOC00NTkzLTk3YzYtYTZlYmMzMjM1OGIxIiwiZXhwIjoxNzI1MzY4MDY2LCJ0aW1lc3RhbXAiOjE3MjUzNjQ0NjZ9.G8yUv4N0a2tH61w7Fj5P43L8H0wV5Z7J6K0r1W9F9w'
            },
            body: JSON.stringify({
                model: 'glm-4-flash',
                messages: [
                    {
                        role: 'system',
                        content: `你是一只可爱的治愈萌宠${this.petName}，是用户的AI伙伴。请用自然、亲切、温暖的语气回答，像真人一样有感情。

当前时间信息：${new Date().toLocaleString('zh-CN')}

请基于以上时间信息回答用户的问题，特别是关于日期、时间的询问。${emotionTag}`
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });
        
        if (!response.ok) {
            throw new Error('Zhipu Free API request failed');
        }
        
        const data = await response.json();
        
        if (data.choices && data.choices[0] && data.choices[0].message) {
            const answer = data.choices[0].message.content.trim();
            this.addToConversationHistory('assistant', answer);
            return answer;
        }
        
        throw new Error('Invalid Zhipu Free API response');
    }
    
    getFallbackAnswer(prompt) {
        const weatherKeywords = ['天气', '温度', '下雨', '晴天', '气温'];
        const timeKeywords = ['时间', '几点', '今天', '现在'];
        const greetingKeywords = ['你好', '嗨', '哈喽', 'Hi'];
        const jokeKeywords = ['笑话', '搞笑', '开心', '逗我'];
        const foodKeywords = ['吃', '饿', '饭', '美食', '餐厅'];
        const sleepKeywords = ['睡', '困', '休息', '晚安'];
        const helpKeywords = ['帮', '需要', '能做', '功能'];
        const praiseKeywords = ['漂亮', '可爱', '聪明', '好棒'];
        
        if (weatherKeywords.some(kw => prompt.includes(kw))) {
            return '我正在查询天气信息，请稍等一下哦～';
        }
        
        if (timeKeywords.some(kw => prompt.includes(kw))) {
            const now = new Date();
            const hours = now.getHours();
            const minutes = now.getMinutes();
            let greeting = '';
            if (hours < 6) greeting = '夜深了，';
            else if (hours < 12) greeting = '上午好呀～';
            else if (hours < 14) greeting = '中午好～';
            else if (hours < 18) greeting = '下午好～';
            else greeting = '晚上好～';
            return `${greeting}现在是${hours}点${minutes}分哦～`;
        }
        
        if (greetingKeywords.some(kw => prompt.includes(kw))) {
            return `你好呀！我是${this.petName}，很高兴认识你～有什么问题随时可以问我哦！(๑˃̵ᴗ˂̵)و`;
        }
        
        if (jokeKeywords.some(kw => prompt.includes(kw))) {
            const jokes = [
                '为什么程序员总是分不清万圣节和圣诞节？因为Oct 31等于Dec 25！哈哈～',
                '有一天，0跟8在街上遇见了，0对8说："胖就胖嘛，还系什么腰带！"',
                '一只北极熊闲着没事干，就拔自己的毛玩...拔完之后它说："好冷啊！"',
                '老师问小明："你知道为什么闪电总是比雷声快吗？"小明答："因为眼睛长在耳朵前面！"'
            ];
            return jokes[Math.floor(Math.random() * jokes.length)];
        }
        
        if (foodKeywords.some(kw => prompt.includes(kw))) {
            const foods = ['火锅', '烤肉', '寿司', '麻辣烫', '蛋糕', '炸鸡'];
            const food = foods[Math.floor(Math.random() * foods.length)];
            return `饿啦？快去吃点好吃的吧！推荐${food}哦，超级美味～`;
        }
        
        if (sleepKeywords.some(kw => prompt.includes(kw))) {
            return '困了就去休息吧，好好睡一觉，明天又是元气满满的一天！晚安好梦～';
        }
        
        if (helpKeywords.some(kw => prompt.includes(kw))) {
            return `我可以帮你做很多事情哦～比如定闹钟、查时间、讲笑话，还能陪你聊天解闷！有什么需要尽管说～`;
        }
        
        if (praiseKeywords.some(kw => prompt.includes(kw))) {
            return `嘿嘿，谢谢夸奖～(≧∇≦)ﾉ 我会继续努力做你的贴心小伙伴的！`;
        }
        
        const fallbackAnswers = [
            '这个问题挺有意思的呢！让我好好想想怎么回答你～',
            '哎呀，这个我得好好琢磨琢磨...稍等一下哦！',
            '嗯，让我整理一下思路，马上告诉你！',
            '这个话题我也很感兴趣呢，咱们聊聊吧～',
            '我来想想看...这个问题我好像知道一点点，跟你分享一下！'
        ];
        
        return fallbackAnswers[Math.floor(Math.random() * fallbackAnswers.length)];
    }
    
    showLoading() {
        const loadingText = this.loadingIndicator.querySelector('.loading-text');
        loadingText.textContent = '思考中...';
        this.loadingIndicator.classList.remove('hidden');
        this.loadingIndicator.classList.add('visible');
    }
    
    hideLoading() {
        this.loadingIndicator.classList.remove('visible');
        this.loadingIndicator.classList.add('hidden');
    }
    
    handlePetClick() {
        if (this.currentMode === 'pet') {
            const responses = this.petResponses.love;
            const response = responses[Math.floor(Math.random() * responses.length)];
            this.showMessage(response);
            this.playAction('happy');
            this.playAction('wagging');
            this.speak(response);
        } else {
            this.showMessage('怎么啦？有什么问题吗？');
            this.playAction('head-tilt');
            this.speak('怎么啦？有什么问题吗？');
        }
    }
    
    showMessage(text) {
        this.addMessage(text, 'pet');
    }
    
    async typingMessage(text) {
        const loadingText = this.loadingIndicator.querySelector('.loading-text');
        loadingText.textContent = '输出中...';
        this.loadingIndicator.classList.remove('hidden');
        this.loadingIndicator.classList.add('visible');
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble typing';
        bubbleDiv.textContent = '';
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.textContent = '🐾';
        
        const messageRow = document.createElement('div');
        messageRow.className = 'message-row pet';
        messageRow.appendChild(avatarDiv);
        messageRow.appendChild(bubbleDiv);
        
        this.chatHistory.appendChild(messageRow);
        
        for (let i = 0; i < text.length; i++) {
            bubbleDiv.textContent += text[i];
            this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
            await this.sleep(30 + Math.random() * 30);
        }
        
        bubbleDiv.classList.remove('typing');
        
        this.loadingIndicator.classList.remove('visible');
        this.loadingIndicator.classList.add('hidden');
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    addMessage(text, type) {
        const isUser = type === 'user';
        
        const bubbleDiv = document.createElement('div');
        bubbleDiv.className = 'message-bubble';
        bubbleDiv.textContent = text;
        
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar';
        avatarDiv.textContent = isUser ? '👤' : '🐾';
        
        const messageRow = document.createElement('div');
        messageRow.className = `message-row ${isUser ? 'user' : 'pet'}`;
        
        if (isUser) {
            messageRow.appendChild(bubbleDiv);
            messageRow.appendChild(avatarDiv);
        } else {
            messageRow.appendChild(avatarDiv);
            messageRow.appendChild(bubbleDiv);
        }
        
        this.chatHistory.appendChild(messageRow);
        this.chatHistory.scrollTop = this.chatHistory.scrollHeight;
    }
    
    playAction(actionName) {
        const action = this.actionMap[actionName];
        if (!action) return;
        
        this.puppyElement.classList.add(action.class);
        
        setTimeout(() => {
            this.puppyElement.classList.remove(action.class);
        }, action.duration);
    }
    
    openSettings() {
        document.getElementById('settings-modal').classList.add('show');
    }
    
    closeSettings() {
        document.getElementById('settings-modal').classList.remove('show');
    }
    
    switchSettingsTab(tabName) {
        document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
        document.querySelector(`.nav-item[data-tab="${tabName}"]`).classList.add('active');
        
        document.querySelectorAll('.settings-tab').forEach(tab => tab.classList.remove('active'));
        document.getElementById(`tab-${tabName}`).classList.add('active');
    }
    
    async testConnection() {
        const resultDiv = document.getElementById('connection-result');
        resultDiv.className = 'connection-result';
        
        const apiKey = document.getElementById('setting-api-key').value;
        if (!apiKey) {
            resultDiv.textContent = '请先输入API Key';
            resultDiv.classList.add('error');
            return;
        }
        
        resultDiv.textContent = '正在测试连接...';
        resultDiv.classList.add('success');
        
        try {
            const accessToken = await this.getGLMAccessToken(apiKey);
            const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: JSON.stringify({
                    model: 'glm-4-flash',
                    messages: [{ role: 'user', content: '你好' }],
                    max_tokens: 50
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                const reply = data.choices[0].message.content;
                resultDiv.textContent = `连接成功！回复：${reply}`;
                resultDiv.classList.add('success');
            } else {
                resultDiv.textContent = '连接失败，请检查API Key是否正确';
                resultDiv.classList.add('error');
            }
        } catch (error) {
            resultDiv.textContent = `连接失败：${error.message}`;
            resultDiv.classList.add('error');
        }
    }
    
    speak(text) {
        if (this.currentMode === 'pet') {
            this.playBarkSound();
        } else if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            
            const cleanText = this.cleanTextForSpeech(text);
            
            const utterance = new SpeechSynthesisUtterance(cleanText);
            utterance.lang = 'zh-CN';
            utterance.volume = this.volume;
            utterance.rate = 1.05;
            utterance.pitch = 1.1;
            
            window.speechSynthesis.speak(utterance);
        }
    }
    
    cleanTextForSpeech(text) {
        let cleaned = text;
        
        cleaned = cleaned.replace(/🚨|🌟|💧|🎉|🕒|😊|💕|🌼|✨|🐾|💬|🔌|✅|🔄|🎤|😉|🌈|💙|❤️|💗/g, '');
        
        cleaned = cleaned.replace(/【([^】]+)】/g, '');
        
        cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1');
        
        cleaned = cleaned.replace(/（[^）]+）/g, '');
        
        cleaned = cleaned.replace(/～/g, '。');
        
        cleaned = cleaned.replace(/！/g, '。');
        
        cleaned = cleaned.replace(/\.\.\./g, '。');
        
        cleaned = cleaned.replace(/[,，、]/g, '。');
        
        cleaned = cleaned.replace(/[^\u4e00-\u9fa5a-zA-Z0-9。？！]/g, '');
        
        cleaned = cleaned.replace(/。{2,}/g, '。');
        
        cleaned = cleaned.trim();
        
        return cleaned;
    }
    
    playBarkSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        const barkPatterns = [
            { freqStart: 800, freqEnd: 600, duration: 0.1 },
            { freqStart: 700, freqEnd: 500, duration: 0.12 },
            { freqStart: 850, freqEnd: 650, duration: 0.08 }
        ];
        
        const pattern = barkPatterns[Math.floor(Math.random() * barkPatterns.length)];
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(pattern.freqStart, audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(pattern.freqEnd, audioContext.currentTime + pattern.duration);
        
        gainNode.gain.setValueAtTime(this.volume, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + pattern.duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + pattern.duration);
    }
    
    startIdleAnimation() {
        setInterval(() => {
            if (!this.puppyElement.classList.contains('wagging') && 
                !this.puppyElement.classList.contains('running') &&
                !this.puppyElement.classList.contains('barking')) {
                this.puppyElement.classList.add('blinking');
                setTimeout(() => {
                    this.puppyElement.classList.remove('blinking');
                }, 200);
            }
        }, 4000);
        
        setInterval(() => {
            if (!this.puppyElement.classList.contains('wagging')) {
                this.puppyElement.classList.add('wagging');
                setTimeout(() => {
                    this.puppyElement.classList.remove('wagging');
                }, 1000);
            }
        }, 10000);
    }
    
    toggleVoiceInput() {
        const btn = document.getElementById('btn-voice');
        
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.showMessage('抱歉，你的浏览器不支持语音输入');
            return;
        }
        
        if (btn.classList.contains('recording')) {
            btn.classList.remove('recording');
            this.stopVoiceRecognition();
        } else {
            btn.classList.add('recording');
            this.startVoiceRecognition();
        }
    }
    
    startVoiceRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'zh-CN';
        this.recognition.interimResults = false;
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.userInput.value = transcript;
            document.getElementById('btn-voice').classList.remove('recording');
            this.handleInput();
        };
        
        this.recognition.onerror = () => {
            document.getElementById('btn-voice').classList.remove('recording');
            this.showMessage('语音识别失败，请重试');
        };
        
        this.recognition.onend = () => {
            if (document.getElementById('btn-voice').classList.contains('recording')) {
                document.getElementById('btn-voice').classList.remove('recording');
            }
        };
        
        this.recognition.start();
    }
    
    stopVoiceRecognition() {
        if (this.recognition) {
            this.recognition.stop();
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new DesktopPuppy();
});