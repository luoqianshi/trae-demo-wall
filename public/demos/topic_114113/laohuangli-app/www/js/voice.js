var Voice = {
    synth: null,
    useCordovaTTS: false,
    isSpeaking: false,
    rate: 0.85,
    gender: 'female',
    voices: [],
    initialized: false,
    ttsCheckAttempts: 0,
    
    init: function() {
        console.log('Voice.init called');
        this.initSpeech();
        
        var self = this;
        
        var tryInitCordovaTTS = function() {
            console.log('Voice: tryInitCordovaTTS called');
            
            if (typeof TTS !== 'undefined') {
                console.log('Voice: TTS plugin detected, version:', TTS.version || 'unknown');
                self.useCordovaTTS = true;
                return true;
            } else if (typeof window.TTS !== 'undefined') {
                console.log('Voice: window.TTS detected');
                self.useCordovaTTS = true;
                return true;
            }
            
            return false;
        };
        
        var checkCordovaTTS = function() {
            self.ttsCheckAttempts++;
            
            if (tryInitCordovaTTS()) {
                console.log('Voice: TTS plugin successfully initialized after ' + self.ttsCheckAttempts + ' attempts');
                return;
            }
            
            if (self.ttsCheckAttempts < 30) {
                setTimeout(checkCordovaTTS, 150);
            } else {
                console.log('Voice: TTS plugin not detected after ' + self.ttsCheckAttempts + ' attempts');
                console.log('Voice: cordova:', typeof cordova);
                console.log('Voice: TTS:', typeof TTS);
                console.log('Voice: window.TTS:', typeof window.TTS);
                
                var ttsRelatedKeys = Object.keys(window).filter(function(k) { 
                    return k.toLowerCase().indexOf('tts') !== -1 || 
                           k.toLowerCase().indexOf('speech') !== -1 ||
                           k.toLowerCase().indexOf('cordova') !== -1; 
                });
                console.log('Voice: Related window properties:', ttsRelatedKeys.join(', '));
            }
        };
        
        if (typeof cordova !== 'undefined') {
            console.log('Voice: Cordova object exists');
            
            if (cordova.plugins && cordova.plugins.TTS) {
                console.log('Voice: cordova.plugins.TTS exists');
                self.useCordovaTTS = true;
            }
            
            var onDeviceReady = function() {
                console.log('Voice: deviceready event fired');
                checkCordovaTTS();
            };
            
            if (document.readyState === 'complete' || (typeof cordova !== 'undefined' && cordova.platformId)) {
                console.log('Voice: Document or Cordova already ready');
                onDeviceReady();
            } else {
                document.addEventListener('deviceready', onDeviceReady, false);
            }
            
            checkCordovaTTS();
        } else {
            console.log('Voice: cordova not defined, checking for TTS directly');
            
            if (tryInitCordovaTTS()) {
                console.log('Voice: TTS plugin detected directly');
            } else {
                checkCordovaTTS();
            }
        }
        
        setTimeout(function() {
            console.log('Voice initialized after 2000ms, useCordovaTTS:', self.useCordovaTTS, 'synth:', !!self.synth);
            self.initialized = true;
        }, 2000);
    },
    
    initSpeech: function() {
        if ('speechSynthesis' in window) {
            console.log('Web Speech API available');
            this.synth = window.speechSynthesis;
            this.loadVoices();
            window.speechSynthesis.onvoiceschanged = function() {
                Voice.loadVoices();
            };
        } else {
            console.log('Web Speech API NOT available');
        }
    },
    
    initCordovaTTS: function() {
        if (typeof TTS !== 'undefined') {
            this.useCordovaTTS = true;
            console.log('Cordova TTS plugin detected, version:', TTS.version || 'unknown');
        } else {
            console.log('Cordova TTS plugin NOT detected');
            console.log('Window object keys related to TTS:', Object.keys(window).filter(function(k) { return k.toLowerCase().indexOf('tts') !== -1; }));
        }
    },
    
    loadVoices: function() {
        if (this.synth) {
            this.voices = this.synth.getVoices();
            console.log('Voices loaded:', this.voices.length);
            if (this.voices.length > 0) {
                var chineseVoices = this.voices.filter(function(v) { return v.lang && v.lang.indexOf('zh') !== -1; });
                console.log('Chinese voices:', chineseVoices.length);
                chineseVoices.forEach(function(v) {
                    console.log('  -', v.name, ':', v.lang);
                });
            }
            // voices加载后如果有人在等待播放，自动重试
            if (this._pendingSpeak) {
                var text = this._pendingSpeak;
                this._pendingSpeak = null;
                this.speakWeb(text);
            }
        }
    },
    
    speak: function(text, retryCount) {
        retryCount = retryCount || 0;
        
        console.log('Voice.speak called, text:', text ? text.substring(0, 50) + '...' : 'empty');
        console.log('  useCordovaTTS:', this.useCordovaTTS);
        console.log('  typeof TTS:', typeof TTS);
        console.log('  typeof window.TTS:', typeof window.TTS);
        console.log('  synth available:', !!this.synth);
        console.log('  retryCount:', retryCount);
        
        if (!text || text.length === 0) {
            console.error('Empty text to speak');
            return;
        }
        
        if (this.isSpeaking && retryCount === 0) {
            this.stop();
        }
        
        this.isSpeaking = true;
        UI.showSpeakStatus(true);
        
        var self = this;
        var callbackFired = false;
        
        if (typeof TTS !== 'undefined' || typeof window.TTS !== 'undefined') {
            var ttsObj = typeof TTS !== 'undefined' ? TTS : window.TTS;
            console.log('Using Cordova TTS plugin');
            ttsObj.speak({
                text: text,
                locale: 'zh-CN',
                rate: this.rate
            }, 
            function() { 
                callbackFired = true;
                console.log('Cordova TTS speak success (onDone)');
                self.isSpeaking = false; 
                UI.showSpeakStatus(false); 
            }, 
            function(err) { 
                callbackFired = true;
                console.error('Cordova TTS error:', err);
                self.isSpeaking = false; 
                UI.showSpeakStatus(false);
                
                if (err === 'ERR_NOT_INITIALIZED' && retryCount < 10) {
                    console.log('TTS not initialized yet, retrying in 300ms...');
                    setTimeout(function() {
                        self.speak(text, retryCount + 1);
                    }, 300);
                } else if (err === 'ERR_ERROR_INITIALIZING' && retryCount < 5) {
                    console.log('TTS initialization error, retrying in 1000ms...');
                    setTimeout(function() {
                        self.speak(text, retryCount + 1);
                    }, 1000);
                } else if (self.synth) {
                    console.log('Falling back to Web Speech API');
                    self.speakWeb(text);
                } else if (retryCount >= 5) {
                    // 所有重试都失败，给用户反馈
                    if (typeof UI.showToast === 'function') {
                        UI.showToast('语音播放不可用：设备未安装TTS引擎', 'error');
                    }
                }
            });
        } else if (this.synth) {
            callbackFired = true;
            console.log('Using Web Speech API');
            setTimeout(function() {
                self.speakWeb(text);
            }, 50);
        } else {
            callbackFired = true;
            console.error('No speech synthesis available');
            self.isSpeaking = false;
            UI.showSpeakStatus(false);
            
            if (retryCount < 10) {
                setTimeout(function() {
                    if (typeof TTS !== 'undefined' || typeof window.TTS !== 'undefined') {
                        console.log('TTS became available, retrying');
                        self.speak(text, retryCount + 1);
                    }
                }, 500);
            }
        }
    },
    
    speakWeb: function(text) {
        var self = this;
        
        // Chrome等浏览器需要在用户交互后先"解锁"speechSynthesis
        if (!self._unlocked) {
            var silent = new SpeechSynthesisUtterance(' ');
            silent.volume = 0;
            try { self.synth.speak(silent); } catch(e) {}
            self._unlocked = true;
        }
        
        // 先取消正在进行的语音，避免排队
        self.synth.cancel();
        
        var utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = self.rate;
        utterance.pitch = self.gender === 'male' ? 0.8 : 1.0;
        utterance.volume = 1.0;
        
        var chineseVoice = self.getChineseVoice();
        if (chineseVoice) {
            utterance.voice = chineseVoice;
            console.log('Using voice:', chineseVoice.name, 'lang:', chineseVoice.lang);
        } else {
            console.log('No Chinese voice found, using default');
        }
        
        var finished = false;
        var done = function() {
            if (finished) return;
            finished = true;
            clearInterval(self._keepAliveTimer);
            self._keepAliveTimer = null;
            self.isSpeaking = false;
            UI.showSpeakStatus(false);
        };
        
        utterance.onend = function() {
            console.log('Web Speech ended');
            done();
        };
        
        utterance.onerror = function(e) {
            console.error('Web Speech error:', e.error, e);
            done();
        };
        
        utterance.onstart = function() {
            console.log('Web Speech started');
        };
        
        try {
            self.synth.speak(utterance);
            
            // Chrome bug: 长文本约15秒后speechSynthesis会静默暂停
            // 通过定期pause/resume来保活
            self._keepAliveTimer = setInterval(function() {
                if (self.synth.speaking && !self.synth.paused) {
                    self.synth.pause();
                    self.synth.resume();
                } else if (!self.synth.speaking) {
                    done();
                }
            }, 10000);
            
            // 安全超时：根据文本长度估算最大时长，超时后自动清理
            var estimatedMs = Math.max(60000, (text.length / 3) * 1000 / self.rate);
            setTimeout(function() {
                if (self.synth.speaking) {
                    console.log('Speech timeout, forcing stop');
                    self.synth.cancel();
                }
                done();
            }, estimatedMs);
            
        } catch (e) {
            console.error('Web Speech exception:', e);
            done();
        }
    },
    
    stop: function() {
        if (this._keepAliveTimer) {
            clearInterval(this._keepAliveTimer);
            this._keepAliveTimer = null;
        }
        if (typeof TTS !== 'undefined') {
            try { TTS.stop(function() {}, function() {}); } catch(e) {
                TTS.speak('', function() {}, function() {});
            }
        } else if (typeof window.TTS !== 'undefined') {
            try { window.TTS.stop(function() {}, function() {}); } catch(e) {
                window.TTS.speak('', function() {}, function() {});
            }
        } else if (this.synth) {
            this.synth.cancel();
        }
        this.isSpeaking = false;
        UI.showSpeakStatus(false);
    },
    
    getChineseVoice: function() {
        if (this.voices.length === 0) {
            return null;
        }
        
        // 先按偏好名称精确匹配
        var preferredNames = ['Google 普通话', 'Google Chinese', 'Microsoft Xiaoxiao', 'Microsoft Yaoyao', 'Microsoft Zira'];
        for (var i = 0; i < preferredNames.length; i++) {
            for (var j = 0; j < this.voices.length; j++) {
                var v = this.voices[j];
                if (v.name && v.name.indexOf(preferredNames[i]) !== -1) {
                    return v;
                }
            }
        }
        
        // 再按语言匹配中文语音
        for (var k = 0; k < this.voices.length; k++) {
            if (this.voices[k].lang && this.voices[k].lang.toLowerCase().indexOf('zh') !== -1) {
                return this.voices[k];
            }
        }
        
        return null;
    },
    
    speakToday: function() {
        console.log('Voice.speakToday called');
        var almanac = Calendar.getAlmanac(UI.currentDate);
        console.log('Almanac data:', almanac);
        var text = this.buildSpeechText(almanac);
        console.log('Speech text:', text ? text.substring(0, 100) + '...' : 'empty');
        this.speak(text);
    },
    
    buildSpeechText: function(data) {
        var text = '';
        
        text += '今天是';
        text += (data.year || '') + '年' + (data.month || '') + '月' + (data.day || '') + '日';
        text += '，星期' + (data.week || '') + '。';
        
        text += '农历' + (data.lunarMonthDay || '') + '，';
        text += (data.ganzhi || '') + '，';
        text += (data.shengxiao || '') + '年。';
        
        if (data.jieqi) {
            text += '今天是' + data.jieqi + '节气。';
        }
        
        if (data.festival) {
            text += '今天是' + data.festival + '。';
        }
        
        text += '今日宜：';
        text += (data.yi && data.yi.length > 0) ? data.yi.join('，') + '。' : '无。';
        
        text += '今日忌：';
        text += (data.ji && data.ji.length > 0) ? data.ji.join('，') + '。' : '无。';
        
        if (data.chongsha) {
            text += data.chongsha + '。';
        }
        
        text += '财神方位：' + (data.caishen || '') + '，';
        text += '喜神方位：' + (data.xishen || '') + '，';
        text += '福神方位：' + (data.fushen || '') + '。';
        
        text += '今日吉时：';
        if (data.shiChen) {
            var jiShi = data.shiChen.filter(function(s) { return s.isJi; });
            if (jiShi.length > 0) {
                text += jiShi.map(function(s) { return s.name; }).join('、') + '。';
            } else {
                text += '无特别吉时。';
            }
        } else {
            text += '无特别吉时。';
        }
        
        return text;
    },
    
    setRate: function(rate) {
        this.rate = rate;
        App.saveSettings();
    },
    
    setGender: function(gender) {
        this.gender = gender;
        App.saveSettings();
    },
    
    getRate: function() {
        return this.rate;
    },
    
    getGender: function() {
        return this.gender;
    },
    
    testSpeak: function() {
        console.log('Testing speech');
        this.speak('你好，这是一个测试。');
    }
};