/**
 * 语音模块
 * 使用 Web Speech API 实现语音输入和朗读
 */

const Voice = {
    // 语音识别
    recognition: null,
    isRecording: false,

    // 初始化语音识别
    initRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('浏览器不支持语音识别');
            return false;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'zh-CN';
        this.recognition.continuous = false;
        this.recognition.interimResults = true;

        return true;
    },

    // 开始录音
    startRecording(onResult, onError) {
        if (!this.recognition) {
            if (!this.initRecognition()) {
                onError && onError('浏览器不支持语音识别');
                return;
            }
        }

        // 仅做启动：isRecording 由 onend 统一管理，避免双重 toggle
        this.isRecording = true;

        this.recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            onResult && onResult({
                final: finalTranscript,
                interim: interimTranscript,
                isFinal: event.results[event.results.length - 1].isFinal
            });
        };

        this.recognition.onerror = (event) => {
            console.error('语音识别错误:', event.error);
            this.isRecording = false;
            onError && onError(event.error);
        };

        this.recognition.onend = () => {
            this.isRecording = false;
        };

        this.recognition.start();
    },

    // 停止录音
    stopRecording() {
        if (this.recognition) {
            this.recognition.stop();
            // 兜底：onend 不触发时也能复位
            this.isRecording = false;
        }
    },

    // 语音朗读
    speak(text, { onStart, onEnd } = {}) {
        if (!('speechSynthesis' in window)) {
            console.warn('浏览器不支持语音合成');
            return;
        }

        // 停止之前的朗读
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        utterance.rate = 0.9; // 稍慢，适合长辈
        utterance.pitch = 1;

        // 尝试选择中文语音
        const voices = window.speechSynthesis.getVoices();
        const zhVoice = voices.find(v => v.lang.includes('zh') || v.lang.includes('CN'));
        if (zhVoice) {
            utterance.voice = zhVoice;
        }

        utterance.onstart = () => {
            onStart && onStart();
        };

        utterance.onend = () => {
            onEnd && onEnd();
        };

        utterance.onerror = (event) => {
            console.error('语音朗读错误:', event.error);
            onEnd && onEnd();
        };

        window.speechSynthesis.speak(utterance);
    },

    // 停止朗读
    stopSpeaking() {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    },

    // 检查是否支持语音
    isSupported() {
        return ('speechSynthesis' in window) || ('webkitSpeechRecognition' in window) || ('SpeechRecognition' in window);
    }
};

// 预加载语音列表
if ('speechSynthesis' in window) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}
