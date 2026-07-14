const Speech = {
    synth: window.speechSynthesis,
    recognition: null,
    isRecording: false,
    isSpeaking: false,
    onResult: null,
    onEnd: null,
    init() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.lang = 'en-US';
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 3;
            this.recognition.onresult = (event) => {
                const results = [];
                for (let i = 0; i < event.results[0].length; i++) {
                    results.push({
                        text: event.results[0][i].transcript.toLowerCase().trim(),
                        confidence: event.results[0][i].confidence
                    });
                }
                if (this.onResult) this.onResult(results);
            };
            this.recognition.onend = () => {
                this.isRecording = false;
                if (this.onEnd) this.onEnd();
            };
            this.recognition.onerror = (e) => {
                this.isRecording = false;
                console.error('Speech recognition error:', e.error);
                if (this.onEnd) this.onEnd(e.error);
            };
        }
        return this;
    },
    speak(text, lang = 'en-US', rate = 0.9) {
        return new Promise((resolve) => {
            this.synth.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            utterance.rate = rate;
            utterance.pitch = 1;
            utterance.volume = 1;
            const voices = this.synth.getVoices();
            const enVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Female')) ||
                           voices.find(v => v.lang.startsWith('en-US')) ||
                           voices.find(v => v.lang.startsWith('en'));
            if (enVoice) utterance.voice = enVoice;
            utterance.onstart = () => { this.isSpeaking = true; };
            utterance.onend = () => { this.isSpeaking = false; resolve(); };
            utterance.onerror = () => { this.isSpeaking = false; resolve(); };
            this.synth.speak(utterance);
        });
    },
    speakChinese(text) {
        return this.speak(text, 'zh-CN', 1);
    },
    startRecording(onResult, onEnd) {
        if (!this.recognition) {
            if (onEnd) onEnd('not-supported');
            return false;
        }
        if (this.isRecording) return false;
        this.onResult = onResult;
        this.onEnd = onEnd;
        this.isRecording = true;
        try {
            this.recognition.start();
            return true;
        } catch (e) {
            this.isRecording = false;
            return false;
        }
    },
    stopRecording() {
        if (this.recognition && this.isRecording) {
            this.recognition.stop();
        }
    },
    isSupported() {
        return 'speechSynthesis' in window;
    },
    isRecognitionSupported() {
        return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    },
    checkSimilarity(spoken, target) {
        spoken = spoken.toLowerCase().replace(/[.,!?;:'"]/g, '').trim();
        target = target.toLowerCase().replace(/[.,!?;:'"]/g, '').trim();
        if (spoken === target) return { score: 100, perfect: true };
        const spokenWords = spoken.split(/\s+/);
        const targetWords = target.split(/\s+/);
        let correct = 0;
        const spokenSet = new Set(spokenWords);
        targetWords.forEach(w => { if (spokenSet.has(w)) correct++; });
        const wordAccuracy = targetWords.length > 0 ? (correct / targetWords.length) * 100 : 0;
        const lenDiff = Math.abs(spoken.length - target.length);
        const maxLen = Math.max(spoken.length, target.length);
        const charSimilarity = maxLen > 0 ? (1 - lenDiff / maxLen) * 100 : 100;
        let dp = [];
        for (let i = 0; i <= spoken.length; i++) {
            dp[i] = [i];
        }
        for (let j = 0; j <= target.length; j++) {
            dp[0][j] = j;
        }
        for (let i = 1; i <= spoken.length; i++) {
            for (let j = 1; j <= target.length; j++) {
                if (spoken[i-1] === target[j-1]) {
                    dp[i][j] = dp[i-1][j-1];
                } else {
                    dp[i][j] = Math.min(dp[i-1][j-1], dp[i][j-1], dp[i-1][j]) + 1;
                }
            }
        }
        const editDistance = dp[spoken.length][target.length];
        const levenshteinScore = Math.max(0, (1 - editDistance / maxLen) * 100);
        const finalScore = Math.round((wordAccuracy * 0.5 + charSimilarity * 0.2 + levenshteinScore * 0.3));
        return {
            score: finalScore,
            perfect: finalScore >= 90,
            good: finalScore >= 70,
            wordAccuracy: Math.round(wordAccuracy),
            levenshteinScore: Math.round(levenshteinScore)
        };
    },
    stop() {
        this.synth.cancel();
        this.isSpeaking = false;
    }
};
Speech.init();
if (Speech.synth.onvoiceschanged !== undefined) {
    Speech.synth.onvoiceschanged = () => Speech.init();
}
