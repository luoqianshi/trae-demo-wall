// AudioWorklet 处理器：采集 float32 音频，重采样到 16kHz，动态归一化，累积 3s 后发送
// 3秒块适配 SenseVoice（非自回归模型，需要完整音频片段）
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.inputSampleRate = sampleRate;
    this.targetSampleRate = 16000;
    this.buffer = [];
    this.chunkSize = 48000; // 3000ms @ 16kHz（SenseVoice 分块推理）
    // 动态增益：根据短时音量自动调整
    this.targetRMS = 3000;
    this.currentGain = 5.0; // 初始增益
    this.minGain = 1.0;
    this.maxGain = 30.0;
    // 平滑系数（避免增益跳变）
    this.smoothFactor = 0.1;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const channel = input[0];
    if (!channel || channel.length === 0) return true;

    // 重采样到 16kHz（线性插值）
    const ratio = this.targetSampleRate / this.inputSampleRate;
    const outLength = Math.floor(channel.length * ratio);
    const resampled = new Float32Array(outLength);
    for (let i = 0; i < outLength; i++) {
      const srcIdx = i / ratio;
      const idx0 = Math.floor(srcIdx);
      const idx1 = Math.min(idx0 + 1, channel.length - 1);
      const frac = srcIdx - idx0;
      resampled[i] = channel[idx0] * (1 - frac) + channel[idx1] * frac;
    }

    // 计算当前片段的 RMS（float 域，0~1）
    let sumSq = 0;
    for (let i = 0; i < resampled.length; i++) {
      sumSq += resampled[i] * resampled[i];
    }
    const floatRMS = Math.sqrt(sumSq / resampled.length);

    // 动态调整增益：目标是让输出 RMS 接近 targetRMS
    // floatRMS * gain * 32767 ≈ targetRMS → gain ≈ targetRMS / (floatRMS * 32767)
    if (floatRMS > 0.001) { // 有声音时才调整
      const desiredGain = this.targetRMS / (floatRMS * 32767);
      // 平滑过渡，避免增益跳变
      this.currentGain = this.currentGain * (1 - this.smoothFactor) + desiredGain * this.smoothFactor;
      // 限制增益范围
      this.currentGain = Math.max(this.minGain, Math.min(this.maxGain, this.currentGain));
    }

    // 增益放大 + 转为 Int16 并累积
    for (let i = 0; i < resampled.length; i++) {
      let s = resampled[i] * this.currentGain;
      s = Math.max(-1, Math.min(1, s)); // clip 防止溢出
      s = s < 0 ? s * 0x8000 : s * 0x7FFF;
      this.buffer.push(s | 0);
    }

    while (this.buffer.length >= this.chunkSize) {
      const chunk = this.buffer.splice(0, this.chunkSize);
      const int16 = new Int16Array(chunk);
      this.port.postMessage(int16.buffer, [int16.buffer]);
    }

    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
