// 录音功能模块
class AudioRecorder {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.startTime = null;
        this.timerInterval = null;
        this.onRecordingComplete = null;
    }

    async init() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.stream = stream;
            return true;
        } catch (error) {
            console.error('无法访问麦克风:', error);
            alert('无法访问麦克风，请检查浏览器权限设置');
            return false;
        }
    }

    async startRecording() {
        if (!this.stream) {
            const success = await this.init();
            if (!success) return false;
        }

        this.audioChunks = [];
        this.mediaRecorder = new MediaRecorder(this.stream);

        this.mediaRecorder.ondataavailable = (event) => {
            this.audioChunks.push(event.data);
        };

        this.mediaRecorder.onstop = () => {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
            if (this.onRecordingComplete) {
                this.onRecordingComplete(audioBlob);
            }
        };

        this.mediaRecorder.start();
        this.isRecording = true;
        this.startTime = Date.now();
        this.startTimer();
        
        return true;
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.stopTimer();
            return true;
        }
        return false;
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
            const seconds = (elapsed % 60).toString().padStart(2, '0');
            const timerElement = document.getElementById('recordTimer');
            if (timerElement) {
                timerElement.textContent = `${minutes}:${seconds}`;
            }
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    cleanup() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        this.stopTimer();
    }
}

// 波形动画
class WaveAnimation {
    constructor() {
        this.waveBars = document.querySelectorAll('.wave-bar');
        this.animationInterval = null;
    }

    start() {
        this.waveBars.forEach(bar => bar.classList.add('active'));
    }

    stop() {
        this.waveBars.forEach(bar => bar.classList.remove('active'));
    }
}

// 导出
window.AudioRecorder = AudioRecorder;
window.WaveAnimation = WaveAnimation;
