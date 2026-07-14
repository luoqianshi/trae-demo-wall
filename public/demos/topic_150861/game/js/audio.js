(function() {
    'use strict';

    let audioCtx = null;
    let masterGain = null;
    let initialized = false;
    let currentBgm = null;
    let bgmNodes = [];
    let bellTimer = null;
    let pulseTimer = null;

    function createNoiseBuffer(ctx, duration) {
        const bufferSize = ctx.sampleRate * duration;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }
        return buffer;
    }

    function scheduleDisconnect(node, delay) {
        setTimeout(() => {
            try {
                node.disconnect();
            } catch (e) {}
        }, delay * 1000 + 100);
    }

    function createReverbSend(ctx, destination, feedback, delayTime) {
        const delay = ctx.createDelay(2);
        delay.delayTime.value = delayTime;
        const feedbackGain = ctx.createGain();
        feedbackGain.gain.value = feedback;
        const wetGain = ctx.createGain();
        wetGain.gain.value = feedback * 0.5;

        delay.connect(feedbackGain);
        feedbackGain.connect(delay);
        delay.connect(wetGain);
        wetGain.connect(destination);

        return { delay, feedbackGain, wetGain, input: delay };
    }

    const GameAudio = {
        init() {
            if (initialized) return;

            const AudioContext = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContext();

            masterGain = audioCtx.createGain();
            masterGain.gain.value = 0.4;
            masterGain.connect(audioCtx.destination);

            initialized = true;
        },

        isInitialized() {
            return initialized;
        },

        stopBGM() {
            if (!initialized || !currentBgm) return;

            const now = audioCtx.currentTime;
            const fadeTime = 0.5;

            bgmNodes.forEach(node => {
                if (node.gain) {
                    try {
                        node.gain.cancelScheduledValues(now);
                        node.gain.setValueAtTime(node.gain.value, now);
                        node.gain.linearRampToValueAtTime(0, now + fadeTime);
                    } catch (e) {}
                }
            });

            if (bellTimer) {
                clearTimeout(bellTimer);
                bellTimer = null;
            }
            if (pulseTimer) {
                clearTimeout(pulseTimer);
                pulseTimer = null;
            }

            const nodesToStop = [...bgmNodes];
            setTimeout(() => {
                nodesToStop.forEach(node => {
                    try {
                        if (node.stop) node.stop();
                        node.disconnect();
                    } catch (e) {}
                });
            }, fadeTime * 1000 + 100);

            bgmNodes = [];
            currentBgm = null;
        },

        playAmbient() {
            if (!initialized) return;
            this.stopBGM();
            currentBgm = 'ambient';

            const ctx = audioCtx;
            const now = ctx.currentTime;

            const droneGain = ctx.createGain();
            droneGain.gain.value = 0.15;
            droneGain.connect(masterGain);
            bgmNodes.push(droneGain);

            const drone1 = ctx.createOscillator();
            drone1.type = 'sine';
            drone1.frequency.value = 65;
            drone1.connect(droneGain);
            drone1.start(now);
            bgmNodes.push(drone1);

            const drone2 = ctx.createOscillator();
            drone2.type = 'sine';
            drone2.frequency.value = 75;
            drone2.connect(droneGain);
            drone2.start(now);
            bgmNodes.push(drone2);

            const drone3 = ctx.createOscillator();
            drone3.type = 'sine';
            drone3.frequency.value = 82;
            drone3.connect(droneGain);
            drone3.start(now);
            bgmNodes.push(drone3);

            const lfo = ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 1 / 10;
            const lfoGain = ctx.createGain();
            lfoGain.gain.value = 0.08;
            lfo.connect(lfoGain);
            lfoGain.connect(droneGain.gain);
            lfo.start(now);
            bgmNodes.push(lfo);
            bgmNodes.push(lfoGain);

            const padGain = ctx.createGain();
            padGain.gain.value = 0.04;
            padGain.connect(masterGain);
            bgmNodes.push(padGain);

            [220, 277, 330, 392].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = freq;
                const detuneLfo = ctx.createOscillator();
                detuneLfo.frequency.value = 0.1 + i * 0.05;
                const detuneGain = ctx.createGain();
                detuneGain.gain.value = 3;
                detuneLfo.connect(detuneGain);
                detuneGain.connect(osc.detune);
                osc.connect(padGain);
                osc.start(now);
                detuneLfo.start(now);
                bgmNodes.push(osc);
                bgmNodes.push(detuneLfo);
                bgmNodes.push(detuneGain);
            });

            const playBell = () => {
                if (currentBgm !== 'ambient') return;

                const bellFreq = 400 + Math.random() * 400;
                const bellGain = ctx.createGain();
                bellGain.gain.value = 0;
                bellGain.connect(masterGain);

                const reverb = createReverbSend(ctx, masterGain, 0.3, 0.4);
                bellGain.connect(reverb.input);

                const bellOsc = ctx.createOscillator();
                bellOsc.type = 'sine';
                bellOsc.frequency.value = bellFreq;
                bellOsc.connect(bellGain);

                const bellOsc2 = ctx.createOscillator();
                bellOsc2.type = 'triangle';
                bellOsc2.frequency.value = bellFreq * 1.5;
                const bell2Gain = ctx.createGain();
                bell2Gain.gain.value = 0.2;
                bellOsc2.connect(bell2Gain);
                bell2Gain.connect(bellGain);

                const t = ctx.currentTime;
                bellGain.gain.setValueAtTime(0, t);
                bellGain.gain.linearRampToValueAtTime(0.12, t + 0.02);
                bellGain.gain.exponentialRampToValueAtTime(0.001, t + 3.5);

                bellOsc.start(t);
                bellOsc.stop(t + 4);
                bellOsc2.start(t);
                bellOsc2.stop(t + 3);

                scheduleDisconnect(bellOsc, 4);
                scheduleDisconnect(bellOsc2, 3);
                scheduleDisconnect(bell2Gain, 3);
                scheduleDisconnect(bellGain, 4);
                scheduleDisconnect(reverb.delay, 4);
                scheduleDisconnect(reverb.feedbackGain, 4);
                scheduleDisconnect(reverb.wetGain, 4);

                const nextBellIn = 10000 + Math.random() * 10000;
                bellTimer = setTimeout(playBell, nextBellIn);
            };

            bellTimer = setTimeout(playBell, 3000 + Math.random() * 5000);
        },

        playBattle() {
            if (!initialized) return;
            this.stopBGM();
            currentBgm = 'battle';

            const ctx = audioCtx;
            const now = ctx.currentTime;

            const droneGain = ctx.createGain();
            droneGain.gain.value = 0.08;
            droneGain.connect(masterGain);
            bgmNodes.push(droneGain);

            [55, 62, 73].forEach(freq => {
                const osc = ctx.createOscillator();
                osc.type = 'sawtooth';
                osc.frequency.value = freq;
                const filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 200;
                filter.Q.value = 1;
                osc.connect(filter);
                filter.connect(droneGain);
                osc.start(now);
                bgmNodes.push(osc);
                bgmNodes.push(filter);
            });

            const pulseGain = ctx.createGain();
            pulseGain.gain.value = 0;
            pulseGain.connect(masterGain);
            bgmNodes.push(pulseGain);

            const pulseOsc = ctx.createOscillator();
            pulseOsc.type = 'sine';
            pulseOsc.frequency.value = 90;
            pulseOsc.connect(pulseGain);
            pulseOsc.start(now);
            bgmNodes.push(pulseOsc);

            const pulsePattern = () => {
                if (currentBgm !== 'battle') return;

                const t = ctx.currentTime;
                pulseGain.gain.setValueAtTime(0, t);
                pulseGain.gain.linearRampToValueAtTime(0.25, t + 0.02);
                pulseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

                const stacFreqs = [196, 220, 261, 294, 311, 349];
                const stacFreq = stacFreqs[Math.floor(Math.random() * stacFreqs.length)];
                const stacGain = ctx.createGain();
                stacGain.gain.value = 0;
                stacGain.connect(masterGain);
                const stacOsc = ctx.createOscillator();
                stacOsc.type = 'square';
                stacOsc.frequency.value = stacFreq;
                const stacFilter = ctx.createBiquadFilter();
                stacFilter.type = 'highpass';
                stacFilter.frequency.value = 800;
                stacOsc.connect(stacFilter);
                stacFilter.connect(stacGain);
                stacGain.gain.setValueAtTime(0, t);
                stacGain.gain.linearRampToValueAtTime(0.08, t + 0.01);
                stacGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
                stacOsc.start(t);
                stacOsc.stop(t + 0.2);
                scheduleDisconnect(stacOsc, 0.2);
                scheduleDisconnect(stacFilter, 0.2);
                scheduleDisconnect(stacGain, 0.2);

                pulseTimer = setTimeout(pulsePattern, 450 + Math.random() * 100);
            };

            pulsePattern();

            const tensionGain = ctx.createGain();
            tensionGain.gain.value = 0.03;
            tensionGain.connect(masterGain);
            bgmNodes.push(tensionGain);

            [146, 155, 174, 196].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = freq;
                osc.connect(tensionGain);
                osc.start(now);
                bgmNodes.push(osc);
            });
        },

        playSfx(name) {
            if (!initialized) return;

            switch (name) {
                case 'buttonHover':
                    this._sfxButtonHover();
                    break;
                case 'buttonClick':
                    this._sfxButtonClick();
                    break;
                case 'cardPop':
                    this._sfxCardPop();
                    break;
                case 'chainBreak':
                    this._sfxChainBreak();
                    break;
                case 'awaken':
                    this._sfxAwaken();
                    break;
                case 'swordSlash':
                    this._sfxSwordSlash();
                    break;
                case 'ultimateDash':
                    this._sfxUltimateDash();
                    break;
                default:
                    console.warn('Unknown sfx:', name);
            }
        },

        _sfxButtonHover() {
            const ctx = audioCtx;
            const now = ctx.currentTime;

            const gain = ctx.createGain();
            gain.gain.value = 0;
            gain.connect(masterGain);

            const osc = ctx.createOscillator();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(160, now);
            osc.frequency.exponentialRampToValueAtTime(210, now + 0.08);

            const osc2 = ctx.createOscillator();
            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(320, now);
            osc2.frequency.exponentialRampToValueAtTime(420, now + 0.08);
            const gain2 = ctx.createGain();
            gain2.gain.value = 0.15;
            osc2.connect(gain2);

            osc.connect(gain);
            gain2.connect(gain);

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.2, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

            osc.start(now);
            osc.stop(now + 0.35);
            osc2.start(now);
            osc2.stop(now + 0.3);

            scheduleDisconnect(osc, 0.35);
            scheduleDisconnect(osc2, 0.3);
            scheduleDisconnect(gain2, 0.3);
            scheduleDisconnect(gain, 0.35);
        },

        _sfxButtonClick() {
            const ctx = audioCtx;
            const now = ctx.currentTime;

            const gain = ctx.createGain();
            gain.gain.value = 0;
            gain.connect(masterGain);

            const reverb = createReverbSend(ctx, masterGain, 0.4, 0.5);
            gain.connect(reverb.input);

            const harmonics = [
                { freq: 587, ratio: 1, type: 'sine' },
                { freq: 880, ratio: 0.5, type: 'sine' },
                { freq: 1174, ratio: 0.3, type: 'sine' },
                { freq: 1467, ratio: 0.15, type: 'triangle' },
                { freq: 1760, ratio: 0.1, type: 'sine' }
            ];

            harmonics.forEach(h => {
                const osc = ctx.createOscillator();
                osc.type = h.type;
                osc.frequency.value = h.freq;
                const hGain = ctx.createGain();
                hGain.gain.value = h.ratio;
                osc.connect(hGain);
                hGain.connect(gain);
                osc.start(now);
                osc.stop(now + 2);
                scheduleDisconnect(osc, 2);
                scheduleDisconnect(hGain, 2);
            });

            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.25, now + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 1.8);

            scheduleDisconnect(gain, 2);
            scheduleDisconnect(reverb.delay, 3);
            scheduleDisconnect(reverb.feedbackGain, 3);
            scheduleDisconnect(reverb.wetGain, 3);
        },

        _sfxCardPop() {
            const ctx = audioCtx;
            const now = ctx.currentTime;

            const noiseBuffer = createNoiseBuffer(ctx, 0.1);
            const noiseSource = ctx.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'highpass';
            noiseFilter.frequency.value = 2000;
            const noiseGain = ctx.createGain();
            noiseGain.gain.value = 0;
            noiseSource.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(masterGain);
            noiseGain.gain.setValueAtTime(0, now);
            noiseGain.gain.linearRampToValueAtTime(0.15, now + 0.005);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            noiseSource.start(now);
            noiseSource.stop(now + 0.06);
            scheduleDisconnect(noiseSource, 0.06);
            scheduleDisconnect(noiseFilter, 0.06);
            scheduleDisconnect(noiseGain, 0.06);

            const popGain = ctx.createGain();
            popGain.gain.value = 0;
            popGain.connect(masterGain);
            const popOsc = ctx.createOscillator();
            popOsc.type = 'sine';
            popOsc.frequency.setValueAtTime(200, now);
            popOsc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
            popOsc.connect(popGain);
            popGain.gain.setValueAtTime(0, now);
            popGain.gain.linearRampToValueAtTime(0.2, now + 0.01);
            popGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
            popOsc.start(now);
            popOsc.stop(now + 0.2);
            scheduleDisconnect(popOsc, 0.2);
            scheduleDisconnect(popGain, 0.2);
        },

        _sfxChainBreak() {
            const ctx = audioCtx;
            const now = ctx.currentTime;

            const playBreak = (time, vol) => {
                const noiseBuffer = createNoiseBuffer(ctx, 0.4);
                const noiseSource = ctx.createBufferSource();
                noiseSource.buffer = noiseBuffer;
                const noiseFilter = ctx.createBiquadFilter();
                noiseFilter.type = 'bandpass';
                noiseFilter.frequency.value = 3000;
                noiseFilter.Q.value = 0.5;
                const distortion = ctx.createWaveShaper();
                const curve = new Float32Array(256);
                for (let i = 0; i < 256; i++) {
                    const x = (i / 128) - 1;
                    curve[i] = Math.tanh(x * 3);
                }
                distortion.curve = curve;
                const noiseGain = ctx.createGain();
                noiseGain.gain.value = 0;
                noiseSource.connect(noiseFilter);
                noiseFilter.connect(distortion);
                distortion.connect(noiseGain);
                noiseGain.connect(masterGain);
                noiseGain.gain.setValueAtTime(0, time);
                noiseGain.gain.linearRampToValueAtTime(0.3 * vol, time + 0.01);
                noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.3);
                noiseSource.start(time);
                noiseSource.stop(time + 0.35);
                scheduleDisconnect(noiseSource, 0.35);
                scheduleDisconnect(noiseFilter, 0.35);
                scheduleDisconnect(distortion, 0.35);
                scheduleDisconnect(noiseGain, 0.35);

                [800, 1200, 1800].forEach(freq => {
                    const osc = ctx.createOscillator();
                    osc.type = 'triangle';
                    osc.frequency.value = freq;
                    const oscGain = ctx.createGain();
                    oscGain.gain.value = 0;
                    osc.connect(oscGain);
                    oscGain.connect(masterGain);
                    oscGain.gain.setValueAtTime(0, time);
                    oscGain.gain.linearRampToValueAtTime(0.2 * vol, time + 0.005);
                    oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
                    osc.start(time);
                    osc.stop(time + 0.25);
                    scheduleDisconnect(osc, 0.25);
                    scheduleDisconnect(oscGain, 0.25);
                });
            };

            playBreak(now, 1);
            playBreak(now + 0.3, 0.5);
            playBreak(now + 0.6, 0.25);
        },

        _sfxAwaken() {
            const ctx = audioCtx;
            const now = ctx.currentTime;
            const duration = 2.2;

            const noiseBuffer = createNoiseBuffer(ctx, duration);
            const noiseSource = ctx.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'lowpass';
            noiseFilter.frequency.setValueAtTime(200, now);
            noiseFilter.frequency.exponentialRampToValueAtTime(8000, now + 1.5);
            noiseFilter.Q.value = 0.5;
            const noiseGain = ctx.createGain();
            noiseGain.gain.value = 0;
            noiseSource.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(masterGain);
            noiseGain.gain.setValueAtTime(0, now);
            noiseGain.gain.linearRampToValueAtTime(0.15, now + 0.5);
            noiseGain.gain.linearRampToValueAtTime(0.2, now + 1);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
            noiseSource.start(now);
            noiseSource.stop(now + duration + 0.1);
            scheduleDisconnect(noiseSource, duration + 0.1);
            scheduleDisconnect(noiseFilter, duration + 0.1);
            scheduleDisconnect(noiseGain, duration + 0.1);

            const toneGain = ctx.createGain();
            toneGain.gain.value = 0;
            toneGain.connect(masterGain);
            const toneOsc = ctx.createOscillator();
            toneOsc.type = 'sine';
            toneOsc.frequency.setValueAtTime(220, now);
            toneOsc.frequency.exponentialRampToValueAtTime(440, now + 2);
            toneOsc.connect(toneGain);
            toneGain.gain.setValueAtTime(0, now);
            toneGain.gain.linearRampToValueAtTime(0.12, now + 0.8);
            toneGain.gain.linearRampToValueAtTime(0.15, now + 1.4);
            toneGain.gain.exponentialRampToValueAtTime(0.001, now + 2.2);
            toneOsc.start(now);
            toneOsc.stop(now + 2.3);
            scheduleDisconnect(toneOsc, 2.3);
            scheduleDisconnect(toneGain, 2.3);

            [1, 1.5, 2, 3].forEach((ratio, i) => {
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(220 * ratio, now);
                osc.frequency.exponentialRampToValueAtTime(440 * ratio, now + 2);
                const hGain = ctx.createGain();
                hGain.gain.value = 0;
                osc.connect(hGain);
                hGain.connect(toneGain);
                const delay = i * 0.1;
                hGain.gain.setValueAtTime(0, now + delay);
                hGain.gain.linearRampToValueAtTime(0.05 / (i + 1), now + 0.8 + delay);
                hGain.gain.exponentialRampToValueAtTime(0.001, now + 2);
                osc.start(now);
                osc.stop(now + 2.1);
                scheduleDisconnect(osc, 2.1);
                scheduleDisconnect(hGain, 2.1);
            });
        },

        _sfxSwordSlash() {
            const ctx = audioCtx;
            const now = ctx.currentTime;
            const duration = 0.2;

            const noiseBuffer = createNoiseBuffer(ctx, duration);
            const noiseSource = ctx.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'highpass';
            noiseFilter.frequency.setValueAtTime(500, now);
            noiseFilter.frequency.exponentialRampToValueAtTime(8000, now + 0.12);
            noiseFilter.Q.value = 0.3;
            const noiseGain = ctx.createGain();
            noiseGain.gain.value = 0;
            noiseSource.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(masterGain);
            noiseGain.gain.setValueAtTime(0, now);
            noiseGain.gain.linearRampToValueAtTime(0.35, now + 0.02);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
            noiseSource.start(now);
            noiseSource.stop(now + duration + 0.05);
            scheduleDisconnect(noiseSource, duration + 0.05);
            scheduleDisconnect(noiseFilter, duration + 0.05);
            scheduleDisconnect(noiseGain, duration + 0.05);

            const impactGain = ctx.createGain();
            impactGain.gain.value = 0;
            impactGain.connect(masterGain);
            [1200, 1800, 2400].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                osc.type = 'triangle';
                osc.frequency.value = freq;
                const iGain = ctx.createGain();
                iGain.gain.value = 0.2 - i * 0.05;
                osc.connect(iGain);
                iGain.connect(impactGain);
                osc.start(now + 0.08);
                osc.stop(now + 0.15);
                scheduleDisconnect(osc, 0.15);
                scheduleDisconnect(iGain, 0.15);
            });
            impactGain.gain.setValueAtTime(0, now + 0.08);
            impactGain.gain.linearRampToValueAtTime(0.3, now + 0.09);
            impactGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
            scheduleDisconnect(impactGain, 0.2);
        },

        _sfxUltimateDash() {
            const ctx = audioCtx;
            const now = ctx.currentTime;
            const duration = 0.6;

            const noiseBuffer = createNoiseBuffer(ctx, duration);
            const noiseSource = ctx.createBufferSource();
            noiseSource.buffer = noiseBuffer;
            const noiseFilter = ctx.createBiquadFilter();
            noiseFilter.type = 'bandpass';
            noiseFilter.frequency.setValueAtTime(400, now);
            noiseFilter.frequency.exponentialRampToValueAtTime(6000, now + duration * 0.8);
            noiseFilter.Q.value = 2;
            const noiseGain = ctx.createGain();
            noiseGain.gain.value = 0;
            noiseSource.connect(noiseFilter);
            noiseFilter.connect(noiseGain);
            noiseGain.connect(masterGain);
            noiseGain.gain.setValueAtTime(0, now);
            noiseGain.gain.linearRampToValueAtTime(0.3, now + 0.05);
            noiseGain.gain.linearRampToValueAtTime(0.4, now + 0.2);
            noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
            noiseSource.start(now);
            noiseSource.stop(now + duration + 0.05);
            scheduleDisconnect(noiseSource, duration + 0.05);
            scheduleDisconnect(noiseFilter, duration + 0.05);
            scheduleDisconnect(noiseGain, duration + 0.05);

            const sweepGain = ctx.createGain();
            sweepGain.gain.value = 0;
            sweepGain.connect(masterGain);
            const sweepOsc = ctx.createOscillator();
            sweepOsc.type = 'sawtooth';
            sweepOsc.frequency.setValueAtTime(150, now);
            sweepOsc.frequency.exponentialRampToValueAtTime(1200, now + 0.4);
            const sweepFilter = ctx.createBiquadFilter();
            sweepFilter.type = 'lowpass';
            sweepFilter.frequency.setValueAtTime(800, now);
            sweepFilter.frequency.exponentialRampToValueAtTime(4000, now + 0.4);
            sweepOsc.connect(sweepFilter);
            sweepFilter.connect(sweepGain);
            sweepGain.gain.setValueAtTime(0, now);
            sweepGain.gain.linearRampToValueAtTime(0.15, now + 0.08);
            sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            sweepOsc.start(now);
            sweepOsc.stop(now + 0.55);
            scheduleDisconnect(sweepOsc, 0.55);
            scheduleDisconnect(sweepFilter, 0.55);
            scheduleDisconnect(sweepGain, 0.55);

            const chimeGain = ctx.createGain();
            chimeGain.gain.value = 0;
            chimeGain.connect(masterGain);
            [880, 1320, 1760].forEach((freq, i) => {
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = freq;
                const g = ctx.createGain();
                g.gain.value = 0;
                osc.connect(g);
                g.connect(chimeGain);
                const delay = 0.05 + i * 0.03;
                g.gain.setValueAtTime(0, now + delay);
                g.gain.linearRampToValueAtTime(0.12 - i * 0.03, now + delay + 0.02);
                g.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.4);
                osc.start(now + delay);
                osc.stop(now + delay + 0.5);
                scheduleDisconnect(osc, 0.6);
                scheduleDisconnect(g, 0.6);
            });
            chimeGain.gain.setValueAtTime(1, now);
            scheduleDisconnect(chimeGain, 0.6);
        }
    };

    window.GameAudio = GameAudio;
})();
