import { useCallback, useRef, useEffect } from "react";
import type { AudioType, BackgroundMusic } from "@/types";

interface UseAudioReturn {
  playKeySound: () => void;
  stopBgMusic: () => void;
}

export function useAudio(audio: AudioType, bgMusic: BackgroundMusic): UseAudioReturn {
  const audioContextRef = useRef<AudioContext | null>(null);
  const bgSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const bgOscillatorsRef = useRef<OscillatorNode[]>([]);
  const bgGainRef = useRef<GainNode | null>(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const playKeySound = useCallback(() => {
    if (audio === "off") return;
    
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    switch (audio) {
      case "tap":
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(800, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);
        break;
      case "paper":
        oscillator.type = "triangle";
        oscillator.frequency.setValueAtTime(200, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.1);
        break;
      case "mechanical":
        oscillator.type = "square";
        oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.03);
        break;
    }
    
    gainNode.gain.setValueAtTime(0.05, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.1);
  }, [audio, getAudioContext]);

  const stopBgMusic = useCallback(() => {
    if (bgSourceRef.current) {
      bgSourceRef.current.stop();
      bgSourceRef.current.disconnect();
      bgSourceRef.current = null;
    }
    bgOscillatorsRef.current.forEach(osc => {
      osc.stop();
      osc.disconnect();
    });
    bgOscillatorsRef.current = [];
    if (bgGainRef.current) {
      bgGainRef.current.disconnect();
      bgGainRef.current = null;
    }
  }, []);

  useEffect(() => {
    stopBgMusic();
    
    if (bgMusic === "none") return;
    
    const ctx = getAudioContext();
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0.1;
    gainNode.connect(ctx.destination);
    bgGainRef.current = gainNode;
    
    if (bgMusic === "rain") {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 800;
      
      source.connect(filter);
      filter.connect(gainNode);
      source.start();
      bgSourceRef.current = source;
    } else if (bgMusic === "low") {
      const frequencies = [80, 120, 160];
      frequencies.forEach(freq => {
        const oscillator = ctx.createOscillator();
        oscillator.type = "sine";
        oscillator.frequency.value = freq;
        oscillator.connect(gainNode);
        oscillator.start();
        bgOscillatorsRef.current.push(oscillator);
      });
    }
    
    return () => stopBgMusic();
  }, [bgMusic, getAudioContext, stopBgMusic]);

  return { playKeySound, stopBgMusic };
}
