class VoxHireMicCapture extends AudioWorkletProcessor {
  constructor() {
    super();
    this.samples = [];
    this.enabled = false;
    this.targetLength = 640;
    this.port.onmessage = (event) => {
      if (event.data?.type === "capture") {
        if (this.enabled === event.data.value) return;
        this.enabled = event.data.value;
        if (!this.enabled) this.finishTurn();
      }
    };
  }

  emitPacket(samples) {
    const pcm = new Int16Array(samples.length);
    samples.forEach((sample, index) => { pcm[index] = sample * 0x7fff; });
    this.port.postMessage(pcm.buffer, [pcm.buffer]);
  }

  finishTurn() {
    if (this.samples.length > 0) {
      const tail = this.samples.splice(0, this.samples.length);
      while (tail.length < this.targetLength) tail.push(0);
      this.emitPacket(tail);
    }
    // The gateway is configured with a 1.5 s VAD end-of-turn threshold.
    // Send slightly more silence only after release, so pauses during a held answer do not split it.
    for (let index = 0; index < 40; index += 1) this.emitPacket(new Array(this.targetLength).fill(0));
  }

  process(inputs) {
    if (!this.enabled || !inputs[0]?.[0]) return true;
    const input = inputs[0][0];
    const ratio = sampleRate / 16000;
    for (let index = 0; index < input.length; index += ratio) {
      this.samples.push(Math.max(-1, Math.min(1, input[Math.floor(index)])));
    }
    while (this.samples.length >= this.targetLength) {
      this.emitPacket(this.samples.splice(0, this.targetLength));
    }
    return true;
  }
}

registerProcessor("voxhire-mic-capture", VoxHireMicCapture);
