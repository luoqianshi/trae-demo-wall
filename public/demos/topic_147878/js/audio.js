/* ==========================================
   White Noise Player - 白噪音
========================================== */

class AudioPlayer {

    constructor() {
        this.audioContext = null;
        this.sourceNode = null;
        this.gainNode = null;
        this.isPlaying = false;
        this.currentType = 'rain';
        
        this.select = document.getElementById("audioSelect");
        this.playBtn = document.getElementById("playAudio");
        this.pauseBtn = document.getElementById("pauseAudio");
        this.volumeSlider = document.getElementById("volume");
        
        this.bindEvents();
    }

    bindEvents() {
        if (this.playBtn) {
            this.playBtn.addEventListener("click", () => this.play());
        }
        
        if (this.pauseBtn) {
            this.pauseBtn.addEventListener("click", () => this.pause());
        }
        
        if (this.select) {
            this.select.addEventListener("change", () => {
                if (this.isPlaying) {
                    this.stop();
                    this.currentType = this.select.value;
                    this.play();
                } else {
                    this.currentType = this.select.value;
                }
            });
        }
        
        if (this.volumeSlider) {
            this.volumeSlider.addEventListener("input", (e) => {
                if (this.gainNode) {
                    this.gainNode.gain.value = parseFloat(e.target.value);
                }
            });
        }
    }

    initAudioContext() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.connect(this.audioContext.destination);
            this.gainNode.gain.value = this.volumeSlider ? parseFloat(this.volumeSlider.value) : 0.5;
        }
        return this.audioContext;
    }

    createNoise(type) {
        const ctx = this.initAudioContext();
        
        if (this.sourceNode) {
            try {
                this.sourceNode.stop();
            } catch (e) {}
            this.sourceNode = null;
        }
        
        const bufferSize = 2 * ctx.sampleRate;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        
        switch(type) {
            case 'rain':
                let lastOut = 0;
                for (let i = 0; i < bufferSize; i++) {
                    const white = Math.random() * 2 - 1;
                    data[i] = (lastOut + (0.02 * white)) / 1.02;
                    lastOut = data[i];
                    data[i] *= 3.5;
                }
                break;
                
            case 'sea':
                let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
                for (let i = 0; i < bufferSize; i++) {
                    const white = Math.random() * 2 - 1;
                    b0 = 0.99886 * b0 + white * 0.0555179;
                    b1 = 0.99332 * b1 + white * 0.0750759;
                    b2 = 0.96900 * b2 + white * 0.1538520;
                    b3 = 0.86650 * b3 + white * 0.3104856;
                    b4 = 0.55000 * b4 + white * 0.5329522;
                    b5 = -0.7616 * b5 - white * 0.0168980;
                    data[i] = (b0+b1+b2+b3+b4+b5+b6+white*0.5362) * 0.11;
                    b6 = white * 0.115926;
                }
                break;
                
            case 'forest':
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * 0.5;
                }
                break;
                
            case 'fire':
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() > 0.97 ? (Math.random() * 2 - 1) * 0.8 : 0) + (Math.random() * 2 - 1) * 0.08;
                }
                break;
                
            case 'cafe':
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * 0.3;
                }
                break;
                
            default:
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
        }
        
        this.sourceNode = ctx.createBufferSource();
        this.sourceNode.buffer = buffer;
        this.sourceNode.loop = true;
        
        if (type === 'forest' || type === 'sea') {
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = type === 'forest' ? 800 : 400;
            this.sourceNode.connect(filter);
            filter.connect(this.gainNode);
        } else if (type === 'fire') {
            const filter = ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.frequency.value = 200 + Math.random() * 300;
            this.sourceNode.connect(filter);
            filter.connect(this.gainNode);
        } else {
            this.sourceNode.connect(this.gainNode);
        }
        
        return this.sourceNode;
    }

    play() {
        try {
            const ctx = this.initAudioContext();
            if (ctx.state === 'suspended') {
                ctx.resume();
            }
            
            this.currentType = this.select ? this.select.value : 'rain';
            this.createNoise(this.currentType);
            
            if (this.sourceNode) {
                this.sourceNode.start(0);
                this.isPlaying = true;
                toast("开始播放白噪音");
            }
        } catch (err) {
            console.log('Audio error:', err);
        }
    }

    pause() {
        if (this.sourceNode) {
            try {
                this.sourceNode.stop();
            } catch (e) {}
            this.sourceNode = null;
        }
        this.isPlaying = false;
    }

    stop() {
        this.pause();
    }
}

const audioPlayer = new AudioPlayer();