import React, { useState, useRef } from 'react';
import { Button, Tooltip } from 'antd';
import { AudioOutlined, AudioMutedOutlined } from '@ant-design/icons';

interface Props {
  onResult: (text: string) => void;
}

export default function VoiceInput({ onResult }: Props) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('您的浏览器不支持语音识别，请使用Chrome浏览器');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return (
    <Tooltip title={listening ? '点击停止录音' : '点击语音输入'}>
      <Button shape="circle" icon={listening ? <AudioMutedOutlined /> : <AudioOutlined />} danger={listening} onClick={listening ? stopListening : startListening} />
    </Tooltip>
  );
}