/**
 * 拾音电台 - 主应用逻辑
 * 版本: 2.0
 * 更新时间: 2026-07-06
 */

class ShiyinRadio {
    constructor() {
        this.database = null;
        this.currentTrack = null;
        this.playHistory = [];
        this.narrationAudio = null;
        this.previewAudio = null;
        this.isPlaying = false;
        this.previewVolume = 0.3;
        this.narrationToken = 0;
        this.narrationAbortController = null;
        
        this.init();
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            await this.loadDatabase();
            this.initUI();
            this.startClock();
            this.bindEvents();
            console.log('拾音电台初始化完成');
        } catch (error) {
            console.error('初始化失败:', error);
        }
    }

    /**
     * 加载数据库
     */
    async loadDatabase() {
        try {
            const response = await fetch('./data/database.json');
            if (!response.ok) throw new Error('fetch failed');
            this.database = await response.json();
        } catch (e) {
            if (window.SHIYIN_DATABASE) {
                this.database = window.SHIYIN_DATABASE;
            } else {
                throw new Error('数据库加载失败');
            }
        }
    }

    /**
     * 初始化UI元素引用
     */
    initUI() {
        // 时间显示
        this.currentTimeEl = document.querySelector('.current-time');
        this.dateInfoEl = document.querySelector('.date-info');
        
        // ON AIR
        this.onAirBadge = document.querySelector('.on-air-badge');
        
        // 歌曲卡片
        this.trackCard = document.getElementById('trackCard');
        this.vinylSmall = document.querySelector('.vinyl-small');
        this.songNameSmall = document.querySelector('.song-name-small');
        this.artistNameSmall = document.querySelector('.artist-name-small');
        
        // DJ独白卡片
        this.narrationCard = document.getElementById('narrationCard');
        this.narrationList = document.getElementById('narrationList');
        
        // 随机按钮
        this.randomBtn = document.getElementById('randomBtn');
        
        // 详情弹窗
        this.detailModal = document.getElementById('detailModal');
        this.closeBtn = document.getElementById('closeBtn');
        this.detailOverlay = document.querySelector('.detail-overlay');
        
        // 详情内容
        this.detailTitle = document.querySelector('.detail-title');
        this.detailArtist = document.querySelector('.detail-artist');
        this.detailAlbum = document.querySelector('.detail-album');
        this.detailCreditList = document.querySelectorAll('.detail-credit');
        this.articleTitle = document.querySelector('.article-title');
        this.articleBody = document.querySelector('.article-body');
        
        // 外部链接按钮
        this.neteaseLink = document.querySelector('.netease-link');
        this.qqLink = document.querySelector('.qq-link');
    }

    /**
     * 绑定事件
     */
    bindEvents() {
        // 随机选歌按钮
        this.randomBtn.addEventListener('click', () => {
            this.pickRandomTrack();
        });
        
        // 歌曲卡片点击打开详情
        this.trackCard.addEventListener('click', () => {
            if (this.currentTrack) {
                this.openDetail();
            }
        });
        
        // 关闭详情
        this.closeBtn.addEventListener('click', () => {
            this.closeDetail();
        });
        
        this.detailOverlay.addEventListener('click', () => {
            this.closeDetail();
        });
        
        // ESC键关闭详情
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.detailModal.classList.contains('active')) {
                this.closeDetail();
            }
        });
        
        // 外部链接
        this.neteaseLink.addEventListener('click', () => {
            this.openExternalLink('netease');
        });
        
        this.qqLink.addEventListener('click', () => {
            this.openExternalLink('qqmusic');
        });
    }

    /**
     * 启动实时时钟
     */
    startClock() {
        this.updateClock();
        setInterval(() => {
            this.updateClock();
        }, 1000);
    }

    /**
     * 更新时钟显示
     */
    updateClock() {
        const now = new Date();
        
        // 时间
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        this.currentTimeEl.textContent = `${hours}:${minutes}`;
        
        // 日期和星期
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        const weekday = weekdays[now.getDay()];
        
        this.dateInfoEl.textContent = `${year}年${month}月${day}日 星期${weekday}`;
    }

    /**
     * 随机选取一首歌
     */
    pickRandomTrack() {
        if (!this.database || this.database.tracks.length === 0) {
            return;
        }
        
        // 过滤已播放的歌曲
        let availableTracks = this.database.tracks.filter(
            track => !this.playHistory.includes(track.id)
        );
        
        // 如果都播放过了，重置历史
        if (availableTracks.length === 0) {
            this.playHistory = [];
            availableTracks = this.database.tracks;
        }
        
        // 随机选取
        const randomIndex = Math.floor(Math.random() * availableTracks.length);
        const track = availableTracks[randomIndex];
        
        this.loadTrack(track);
    }

    /**
     * 加载歌曲
     */
    loadTrack(track) {
        this.currentTrack = track;
        this.playHistory.push(track.id);
        
        // 停止当前播放的音频
        this.stopNarration();
        
        // 更新歌曲卡片
        this.updateTrackCard(track);
        this.trackCard.classList.add('active');
        
        // 激活ON AIR
        this.onAirBadge.classList.add('active');
        
        // 添加新的DJ独白（累积显示）
        this.addNarration(track);
        this.narrationCard.classList.add('active');
        
        // 播放DJ独白音频
        this.playNarration(track);
        
        console.log(`已选曲: ${track.basicInfo.title} - ${track.basicInfo.artist}`);
    }
    
    /**
     * 更新歌曲卡片
     */
    updateTrackCard(track) {
        const trackMainLine = document.querySelector('.track-main-line');
        const trackHint = document.querySelector('.track-hint');
        const visualizer = document.querySelector('.audio-visualizer');
        
        // 替换等待文本为歌曲信息
        trackMainLine.innerHTML = `
            <span class="song-name-small">${track.basicInfo.title}</span>
            <span class="track-dot">·</span>
            <span class="artist-name-small">${track.basicInfo.artist}</span>
        `;
        
        // 显示提示文字
        trackHint.classList.remove('track-hint-hidden');
        trackHint.innerHTML = '<span class="hint-icon">📖</span>点击阅读歌曲故事';
        
        // 激活可视化
        visualizer.classList.remove('visualizer-idle');
    }

    /**
     * 添加新的DJ独白到列表
     */
    addNarration(track) {
        // 清空初始的占位符
        const placeholder = this.narrationList.querySelector('.narration-placeholder');
        if (placeholder) {
            this.narrationList.innerHTML = '';
        }
        
        // 创建新的独白项
        const item = document.createElement('div');
        item.className = 'narration-item';
        item.textContent = track.djNarration;
        
        // 添加到列表末尾（最新的在最下面）
        this.narrationList.appendChild(item);
        
        // 自动滚动到底部
        this.narrationCard.scrollTop = this.narrationCard.scrollHeight;
    }

    /**
     * 播放DJ独白音频
     */
    playNarration(track) {
        // 停止之前的音频/语音
        this.stopNarration();
        
        // 使用 Edge TTS 语音合成
        if (track.djNarration) {
            this.speakText(track.djNarration);
            return;
        }
        
        // 如果没有独白文字，则尝试播放音频文件
        if (!track.audioSources || !track.audioSources.narration) {
            return;
        }
        
        // 创建新的音频
        this.narrationAudio = new Audio();
        this.narrationAudio.crossOrigin = 'anonymous';
        this.narrationAudio.src = track.audioSources.narration.url;
        
        // 播放状态同步
        this.narrationAudio.addEventListener('playing', () => {
            this.isPlaying = true;
            this.vinylSmall.classList.add('playing');
        });
        
        this.narrationAudio.addEventListener('pause', () => {
            this.isPlaying = false;
            this.vinylSmall.classList.remove('playing');
        });
        
        this.narrationAudio.addEventListener('ended', () => {
            this.isPlaying = false;
            this.vinylSmall.classList.remove('playing');
        });
        
        this.narrationAudio.addEventListener('error', (e) => {
            console.warn('独白音频加载失败，仅显示文字', e);
            this.vinylSmall.classList.remove('playing');
        });
        
        // 播放
        this.narrationAudio.play().catch((e) => {
            console.warn('自动播放被阻止，需要用户交互');
        });
    }
    
    /**
     * 使用 Edge TTS 朗读文字
     */
    async speakText(text) {
        this.narrationToken++;
        const myToken = this.narrationToken;
        console.log(`[speakText] 新请求 token=${myToken}, text="${text.slice(0, 20)}..."`);
        
        if (this.narrationAbortController) {
            this.narrationAbortController.abort();
        }
        this.narrationAbortController = new AbortController();
        
        try {
            const response = await fetch('/api/tts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: text }),
                signal: this.narrationAbortController.signal,
            });
            
            if (myToken !== this.narrationToken) {
                console.log(`[speakText] token 已过期，放弃播放 token=${myToken}`);
                return;
            }
            
            if (!response.ok) {
                throw new Error('TTS 请求失败');
            }
            
            const audioBlob = await response.blob();
            
            if (myToken !== this.narrationToken) {
                console.log(`[speakText] token 已过期，放弃播放 token=${myToken}`);
                return;
            }
            
            const audioUrl = URL.createObjectURL(audioBlob);
            
            const audio = new Audio(audioUrl);
            this.narrationAudio = audio;
            
            audio.addEventListener('playing', () => {
                if (myToken === this.narrationToken) {
                    this.isPlaying = true;
                    this.vinylSmall.classList.add('playing');
                }
            });
            
            audio.addEventListener('ended', () => {
                if (myToken === this.narrationToken) {
                    this.isPlaying = false;
                    this.vinylSmall.classList.remove('playing');
                }
                URL.revokeObjectURL(audioUrl);
            });
            
            audio.addEventListener('error', (e) => {
                console.warn('TTS 音频播放失败', e);
                if (myToken === this.narrationToken) {
                    this.isPlaying = false;
                    this.vinylSmall.classList.remove('playing');
                }
                URL.revokeObjectURL(audioUrl);
            });
            
            await audio.play();
            
        } catch (e) {
            if (e.name === 'AbortError') {
                console.log(`[speakText] 请求被取消 token=${myToken}`);
                return;
            }
            console.warn('Edge TTS 不可用，降级为浏览器语音合成', e);
            if (myToken === this.narrationToken) {
                this.speakTextFallback(text);
            }
        }
    }
    
    /**
     * 降级：使用浏览器内置语音合成
     */
    speakTextFallback(text) {
        if (!('speechSynthesis' in window)) return;
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.85;
        utterance.pitch = 0.85;
        utterance.volume = 1.0;
        
        // 尝试选择中文男声
        const voices = speechSynthesis.getVoices();
        const maleKeywords = ['男', 'Male', 'Yunjian', 'Yunyang', 'Kangkang'];
        let selectedVoice = null;
        for (const kw of maleKeywords) {
            selectedVoice = voices.find(v => v.lang.includes('zh') && v.name.toLowerCase().includes(kw.toLowerCase()));
            if (selectedVoice) break;
        }
        if (!selectedVoice) {
            selectedVoice = voices.find(v => v.lang.includes('zh'));
        }
        if (selectedVoice) utterance.voice = selectedVoice;
        
        utterance.onstart = () => { this.isPlaying = true; this.vinylSmall.classList.add('playing'); };
        utterance.onend = () => { this.isPlaying = false; this.vinylSmall.classList.remove('playing'); };
        utterance.onerror = () => { this.isPlaying = false; this.vinylSmall.classList.remove('playing'); };
        
        this.currentUtterance = utterance;
        speechSynthesis.speak(utterance);
    }

    /**
     * 停止独白播放
     */
    stopNarration() {
        console.log('[stopNarration] 停止独白播放');
        
        this.narrationToken++;
        
        if (this.narrationAbortController) {
            this.narrationAbortController.abort();
            this.narrationAbortController = null;
        }
        
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
        }
        this.currentUtterance = null;
        
        if (this.narrationAudio) {
            console.log('[stopNarration] 停止 narrationAudio');
            this.narrationAudio.pause();
            this.narrationAudio.currentTime = 0;
            this.narrationAudio.src = '';
            this.narrationAudio = null;
        }
        this.isPlaying = false;
        this.vinylSmall.classList.remove('playing');
    }

    /**
     * 打开详情弹窗
     */
    openDetail() {
        if (!this.currentTrack) {
            return;
        }
        
        this.stopNarration();
        
        const track = this.currentTrack;
        const info = track.basicInfo;
        
        // 填充详情内容
        this.detailTitle.textContent = info.title;
        this.detailArtist.textContent = info.artist;
        this.detailAlbum.textContent = info.album;
        
        // 填充制作信息
        const credits = [
            { label: '作词', value: info.lyricist || '未知' },
            { label: '作曲', value: info.composer || '未知' },
            { label: '编曲', value: info.arranger || '未知' },
            { label: '年份', value: info.year || '未知' }
        ];
        
        this.detailCreditList.forEach((el, index) => {
            if (credits[index]) {
                el.innerHTML = `<span>${credits[index].label}</span>${credits[index].value}`;
            }
        });
        
        // 填充文章
        this.articleTitle.textContent = track.article.title;
        this.articleBody.innerHTML = '';
        track.article.content.forEach(paragraph => {
            const p = document.createElement('p');
            p.textContent = paragraph;
            this.articleBody.appendChild(p);
        });
        
        // 显示弹窗
        this.detailModal.classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // 播放歌曲试听音乐
        this.playPreview(track);
    }

    /**
     * 关闭详情弹窗
     */
    closeDetail() {
        this.detailModal.classList.remove('active');
        document.body.style.overflow = '';
        
        // 停止试听音乐
        this.stopPreview();
    }

    /**
     * 搜索并播放歌曲试听音乐（Apple Music）
     */
    async playPreview(track) {
        this.stopPreview();
        this.stopNarration();
        
        try {
            const title = track.basicInfo.title;
            const artist = track.basicInfo.artist;
            
            const response = await fetch(`/api/preview?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`);
            
            if (!response.ok) {
                console.warn('未找到试听音乐');
                return;
            }
            
            const data = await response.json();
            const previewUrl = data.previewUrl;
            
            if (!previewUrl) {
                return;
            }
            
            // 创建试听音频
            this.previewAudio = new Audio(previewUrl);
            this.previewAudio.loop = true;
            this.previewAudio.volume = 0;
            
            // 淡入播放
            this.previewAudio.addEventListener('canplaythrough', () => {
                this.previewAudio.play().then(() => {
                    this.fadeInPreview();
                }).catch(e => {
                    console.warn('试听音乐自动播放被阻止:', e);
                });
            });
            
            this.previewAudio.addEventListener('error', (e) => {
                console.warn('试听音乐加载失败:', e);
                this.previewAudio = null;
            });
            
        } catch (e) {
            console.warn('获取试听音乐失败:', e);
        }
    }

    /**
     * 试听音乐淡入
     */
    fadeInPreview() {
        if (!this.previewAudio) return;
        
        const targetVolume = this.previewVolume;
        const duration = 2000;
        const steps = 40;
        const stepDuration = duration / steps;
        const stepVolume = targetVolume / steps;
        let currentStep = 0;
        
        const fadeIn = setInterval(() => {
            if (!this.previewAudio) {
                clearInterval(fadeIn);
                return;
            }
            currentStep++;
            this.previewAudio.volume = Math.min(stepVolume * currentStep, targetVolume);
            if (currentStep >= steps) {
                clearInterval(fadeIn);
            }
        }, stepDuration);
    }

    /**
     * 试听音乐淡出
     */
    fadeOutPreview(callback) {
        if (!this.previewAudio) {
            if (callback) callback();
            return;
        }
        
        const startVolume = this.previewAudio.volume;
        const duration = 1500;
        const steps = 30;
        const stepDuration = duration / steps;
        const stepVolume = startVolume / steps;
        let currentStep = 0;
        
        const fadeOut = setInterval(() => {
            if (!this.previewAudio) {
                clearInterval(fadeOut);
                if (callback) callback();
                return;
            }
            currentStep++;
            this.previewAudio.volume = Math.max(startVolume - stepVolume * currentStep, 0);
            if (currentStep >= steps) {
                clearInterval(fadeOut);
                if (callback) callback();
            }
        }, stepDuration);
    }

    /**
     * 停止试听音乐
     */
    stopPreview() {
        if (this.previewAudio) {
            this.fadeOutPreview(() => {
                if (this.previewAudio) {
                    this.previewAudio.pause();
                    this.previewAudio = null;
                }
            });
        }
    }

    /**
     * 打开外部链接
     */
    openExternalLink(platform) {
        if (!this.currentTrack || !this.currentTrack.externalLinks) {
            return;
        }
        
        const url = this.currentTrack.externalLinks[platform];
        if (url) {
            window.open(url, '_blank');
        }
    }
}

// 初始化应用
const app = new ShiyinRadio();