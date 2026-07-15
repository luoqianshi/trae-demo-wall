// 墨脉 MoMai - 插件模块
// 包含插件系统：番茄钟、白噪音、微信排版
window.MoMaiModules = window.MoMaiModules || {};
window.MoMaiModules.plugins = function(Vue, deps) {
    const { ref } = Vue;
    const { activeNote } = deps;

    // Global active plugins database state
    const plugins = ref({
        pomodoro: { active: false },
        soundspace: { active: false }
    });

    const togglePlugin = (key) => {
        plugins.value[key].active = !plugins.value[key].active;
    };

    // Plugin functional 1: Pure Pomodoro Timer
    const pomodoro = ref({
        seconds: 1500, // 25 mins default
        isRunning: false,
        timer: null
    });

    const togglePomodoro = () => {
        if (pomodoro.value.isRunning) {
            clearInterval(pomodoro.value.timer);
            pomodoro.value.isRunning = false;
        } else {
            pomodoro.value.isRunning = true;
            pomodoro.value.timer = setInterval(() => {
                if (pomodoro.value.seconds > 0) {
                    pomodoro.value.seconds--;
                } else {
                    clearInterval(pomodoro.value.timer);
                    pomodoro.value.isRunning = false;
                    playBowlSound(); // Play Web Audio gong sound
                }
            }, 1000);
        }
    };

    const resetPomodoro = () => {
        clearInterval(pomodoro.value.timer);
        pomodoro.value.isRunning = false;
        pomodoro.value.seconds = 1500;
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60).toString().padStart(2, '0');
        const s = (seconds % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // Sound effect helper: Synth-bowl & Jiangnan Rain using Web Audio API
    const audioCtx = ref(null);
    const zenAudio = ref({
        isPlaying: false,
        rainSource: null,
        gainNode: null
    });

    const initAudio = () => {
        if (!audioCtx.value) {
            audioCtx.value = new (window.AudioContext || window.webkitAudioContext)();
        }
    };

    // Synthesize Classic Chime sound directly inside the browser using Oscillator
    const playBowlSound = () => {
        initAudio();
        const ctx = audioCtx.value;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(140, ctx.currentTime); // Soft deep chime
        osc.frequency.exponentialRampToValueAtTime(138, ctx.currentTime + 3);

        gain.gain.setValueAtTime(0.5, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3); // Slow release

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 3.2);
    };

    // Synthesize Zen Rain using White Noise generation
    const toggleZenRain = () => {
        initAudio();
        const ctx = audioCtx.value;

        if (zenAudio.value.isPlaying) {
            zenAudio.value.rainSource.stop();
            zenAudio.value.isPlaying = false;
        } else {
            // Generate white noise buffer
            const bufferSize = 2 * ctx.sampleRate;
            const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
            const output = noiseBuffer.getChannelData(0);

            for (let i = 0; i < bufferSize; i++) {
                output[i] = Math.random() * 2 - 1;
            }

            const whiteNoise = ctx.createBufferSource();
            whiteNoise.buffer = noiseBuffer;
            whiteNoise.loop = true;

            // Soft filtering for rain acoustic
            const filter = ctx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 800; // Low hum rain sound

            const gain = ctx.createGain();
            gain.gain.value = 0.15; // Soft volume

            whiteNoise.connect(filter);
            filter.connect(gain);
            gain.connect(ctx.destination);

            whiteNoise.start();

            zenAudio.value.rainSource = whiteNoise;
            zenAudio.value.gainNode = gain;
            zenAudio.value.isPlaying = true;
        }
    };

    // WeChat post rich text formatter simulation
    const copyWeChatFormat = () => {
        const title = activeNote.value.title;
        let htmlContent = `
            <section style="margin: 20px auto; max-width: 90%; font-family: 'Noto Serif SC', serif; background-color: #fcfbf9; padding: 20px; border: 1px solid #d5cfbe; border-radius: 8px;">
                <h2 style="font-size: 20px; color: #4c4136; border-bottom: 2px solid #9c8f7c; padding-bottom: 6px; font-weight: bold;">${title}</h2>
        `;

        activeNote.value.blocks.forEach(b => {
            if (b.type === 'h2' || b.type === 'h1') {
                htmlContent += `<h3 style="font-size: 16px; font-weight: bold; color: #7f7160; margin-top: 20px;">${b.content}</h3>`;
            } else if (b.type === 'callout') {
                htmlContent += `<blockquote style="background-color: #fdfaf2; border-left: 3px solid #b47820; padding: 10px; margin: 15px 0; font-size: 13px; color: #7c4d12;">${b.content}</blockquote>`;
            } else if (b.type === 'todo') {
                htmlContent += `<p style="font-size: 13px; color: #645749; margin: 8px 0;">[${b.checked ? '✔' : ' '}] ${b.content}</p>`;
            } else {
                htmlContent += `<p style="font-size: 13px; color: #2d2620; line-height: 1.6; margin: 12px 0;">${b.content}</p>`;
            }
        });

        htmlContent += `</section>`;

        // Fallback copy structure to ensure seamless browser compliance
        const textArea = document.createElement("textarea");
        textArea.value = htmlContent;
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            alert("🎉 微信一键富文本排版代码已成功复制到剪贴板！可以直接在微信编辑器里通过富文本或HTML模式贴入。");
        } catch (err) {
            console.error('Copy failed', err);
        }
        document.body.removeChild(textArea);
    };

    return {
        plugins,
        togglePlugin,
        pomodoro,
        togglePomodoro,
        resetPomodoro,
        formatTime,
        audioCtx,
        zenAudio,
        playBowlSound,
        toggleZenRain,
        copyWeChatFormat
    };
};
