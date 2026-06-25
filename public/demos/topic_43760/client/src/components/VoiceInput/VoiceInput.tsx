import { useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Mic, MicOff } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  className?: string;
  disabled?: boolean;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

export function VoiceInput({
  onTranscript,
  className,
  disabled = false,
}: VoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const startRecording = useCallback(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "zh-CN";

    recognition.onstart = () => setIsRecording(true);

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) onTranscript(finalTranscript);
    };

    recognition.onerror = () => setIsRecording(false);
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
  }, [onTranscript]);

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsRecording(false);
  }, []);

  useEffect(() => {
    return () => { recognitionRef.current?.abort(); };
  }, []);

  const isSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  return (
    <Tooltip>
      <TooltipTrigger>
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled || !isSupported}
          className={cn(
            "inline-flex items-center justify-center w-7 h-7 rounded-md transition-colors",
            "text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10",
            "disabled:opacity-40 disabled:cursor-not-allowed",
            isRecording && "text-red-400 animate-pulse",
            className
          )}
        >
          {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top">
        {!isSupported
          ? "浏览器不支持语音"
          : isRecording
            ? "停止录音"
            : "语音输入"}
      </TooltipContent>
    </Tooltip>
  );
}
