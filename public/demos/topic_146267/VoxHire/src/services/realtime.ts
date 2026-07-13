import type { TranscriptEntry } from "../types";

type GatewayEvent = Record<string, unknown>;

export interface GatewayHandlers {
  onStatus: (status: "connecting" | "ready" | "listening" | "thinking" | "speaking" | "error") => void;
  onTranscript: (entry: TranscriptEntry) => void;
  onError: (message: string) => void;
}

function base64FromBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function pcmToAudioBuffer(context: AudioContext, value: string): AudioBuffer {
  const binary = atob(value);
  const output = context.createBuffer(1, binary.length / 2, 16000);
  const data = output.getChannelData(0);
  for (let index = 0; index < data.length; index += 1) {
    const low = binary.charCodeAt(index * 2);
    const high = binary.charCodeAt(index * 2 + 1);
    const signed = (high << 8) | low;
    data[index] = (signed > 32767 ? signed - 65536 : signed) / 32768;
  }
  return output;
}

export class SpeechGatewayClient {
  private socket: WebSocket | null = null;
  private audioContext: AudioContext | null = null;
  private captureNode: AudioWorkletNode | null = null;
  private stream: MediaStream | null = null;
  private playAt = 0;
  private configured = false;
  private capturing = false;

  constructor(private readonly url: string, private readonly instructions: string, private readonly handlers: GatewayHandlers) {}

  async connect(): Promise<void> {
    this.handlers.onStatus("connecting");
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    this.audioContext = new AudioContext();
    await this.audioContext.audioWorklet.addModule("/mic-worklet.js");
    this.captureNode = new AudioWorkletNode(this.audioContext, "voxhire-mic-capture");
    this.captureNode.port.onmessage = (event) => {
      this.sendAudio(event.data as ArrayBuffer);
    };
    const source = this.audioContext.createMediaStreamSource(this.stream);
    source.connect(this.captureNode);

    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(this.url);
      this.socket = socket;
      socket.onopen = () => resolve();
      socket.onerror = () => reject(new Error("无法连接本地语音网关"));
      socket.onmessage = (event) => this.handleEvent(JSON.parse(event.data) as GatewayEvent);
      socket.onclose = () => this.handlers.onStatus("error");
    });
  }

  setCapturing(value: boolean): void {
    if (!this.configured || this.capturing === value) return;
    this.capturing = value;
    this.captureNode?.port.postMessage({ type: "capture", value });
    this.handlers.onStatus(value ? "listening" : "thinking");
  }

  close(): void {
    this.captureNode?.disconnect();
    this.stream?.getTracks().forEach((track) => track.stop());
    this.audioContext?.close();
    this.socket?.close();
    this.captureNode = null;
    this.socket = null;
    this.capturing = false;
  }

  private sendAudio(buffer: ArrayBuffer): void {
    if (this.socket?.readyState !== WebSocket.OPEN) return;
    this.socket.send(JSON.stringify({ type: "input_audio_buffer.append", audio: base64FromBuffer(buffer) }));
  }

  private handleEvent(event: GatewayEvent): void {
    const type = String(event.type ?? "");
    if (type === "session.created") {
      this.socket?.send(JSON.stringify({
        type: "session.update",
        session: {
          type: "realtime",
          instructions: this.instructions,
          audio: {
            input: {
              turn_detection: { type: "server_vad", silence_duration_ms: 1500 },
            },
          },
        },
      }));
      this.configured = true;
      this.handlers.onStatus("speaking");
      this.socket?.send(JSON.stringify({ type: "response.create" }));
      return;
    }
    if (type === "input_audio_buffer.speech_stopped") {
      this.handlers.onStatus("thinking");
      return;
    }
    if (type.includes("input_audio_transcription.completed") && typeof event.transcript === "string") {
      this.handlers.onTranscript({ role: "user", text: event.transcript });
      return;
    }
    if (type.includes("output_audio_transcript.done") && typeof event.transcript === "string") {
      this.handlers.onTranscript({ role: "assistant", text: event.transcript });
      return;
    }
    if (type === "response.output_audio.delta" && typeof event.delta === "string") {
      this.playAudio(event.delta);
      this.handlers.onStatus("speaking");
      return;
    }
    if (type === "response.done") this.handlers.onStatus("ready");
    if (type === "error") this.handlers.onError(String((event.error as { message?: string } | undefined)?.message ?? "语音网关返回错误"));
  }

  private playAudio(delta: string): void {
    if (!this.audioContext) return;
    const source = this.audioContext.createBufferSource();
    source.buffer = pcmToAudioBuffer(this.audioContext, delta);
    source.connect(this.audioContext.destination);
    this.playAt = Math.max(this.playAt, this.audioContext.currentTime);
    source.start(this.playAt);
    this.playAt += source.buffer.duration;
  }
}
