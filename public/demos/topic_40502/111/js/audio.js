// ============ 心声树洞 - 白噪音生成（Web Audio） ============
(function(global){
  'use strict';

  let audioCtx = null;
  let currentNode = null;

  function getCtx(){
    if (!audioCtx){
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  // 生成噪声 buffer
  function makeNoiseBuffer(ctx, seconds=2){
    const len = ctx.sampleRate * seconds;
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i=0;i<len;i++) data[i] = Math.random()*2-1;
    return buffer;
  }

  function stop(){
    if (currentNode){
      try { currentNode.stop(); } catch(e){}
      currentNode.disconnect();
      currentNode = null;
    }
  }

  // 预设声景
  const presets = {
    rain: {
      name: '细雨',
      setup(ctx){
        const src = ctx.createBufferSource();
        src.buffer = makeNoiseBuffer(ctx, 3);
        src.loop = true;
        // 低通模拟雨声
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 900;
        const g = ctx.createGain();
        g.gain.value = 0.35;
        src.connect(lp).connect(g).connect(ctx.destination);
        src.start();
        return src;
      }
    },
    wave: {
      name: '海浪',
      setup(ctx){
        const src = ctx.createBufferSource();
        src.buffer = makeNoiseBuffer(ctx, 4);
        src.loop = true;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 400;
        const g = ctx.createGain();
        g.gain.value = 0;
        // 包络模拟海浪起伏
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 0.08;
        const lfoGain = ctx.createGain();
        lfoGain.gain.value = 0.3;
        lfo.connect(lfoGain).connect(g.gain);
        src.connect(lp).connect(g).connect(ctx.destination);
        src.start(); lfo.start();
        return { stop(){ try{src.stop();}catch(e){} lfo.stop(); src.disconnect(); lfo.disconnect(); } };
      }
    },
    forest: {
      name: '森林',
      setup(ctx){
        const src = ctx.createBufferSource();
        src.buffer = makeNoiseBuffer(ctx, 2);
        src.loop = true;
        const bp = ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.value = 2000;
        bp.Q.value = 0.6;
        const g = ctx.createGain();
        g.gain.value = 0.18;
        src.connect(bp).connect(g).connect(ctx.destination);
        src.start();
        // 偶发鸟鸣：用 oscillator 加随机触发
        const birdTimer = setInterval(() => {
          if (Math.random() < 0.4) playBird(ctx);
        }, 2500);
        const handle = src;
        const origStop = () => { try{handle.stop();}catch(e){} clearInterval(birdTimer); handle.disconnect(); };
        return { stop: origStop };
      }
    }
  };

  function playBird(ctx){
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const now = ctx.currentTime;
    o.type = 'sine';
    o.frequency.setValueAtTime(1800 + Math.random()*600, now);
    o.frequency.exponentialRampToValueAtTime(2600, now+0.15);
    o.frequency.exponentialRampToValueAtTime(1500, now+0.3);
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(0.12, now+0.05);
    g.gain.exponentialRampToValueAtTime(0.001, now+0.35);
    o.connect(g).connect(ctx.destination);
    o.start(now);
    o.stop(now+0.4);
  }

  const Audio = {
    play(name){
      stop();
      const ctx = getCtx();
      const preset = presets[name];
      if (!preset) return;
      currentNode = preset.setup(ctx);
    },
    stop,
    list: Object.keys(presets).map(k => ({ key:k, name: presets[k].name }))
  };

  global.TH = global.TH || {};
  global.TH.Audio = Audio;

})(window);
