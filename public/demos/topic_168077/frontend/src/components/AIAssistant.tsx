import React, { useState, useCallback } from 'react';
import { Modal, Input, Button, message, Space, Tooltip } from 'antd';
import { BulbOutlined, AudioOutlined, SnippetsOutlined } from '@ant-design/icons';
import { settingsAPI } from '../api/client';

const { TextArea } = Input;

interface Props {
  visible: boolean;
  onClose: () => void;
  mode: 'child' | 'schedule' | 'reward';
  onParsed: (data: any) => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

function getHint(mode: string) {
  const hints: Record<string, string> = {
    child: '💡 例如："添加一个叫小明的男孩，6岁，在阳光小学一年级三班"',
    schedule: '💡 例如："周一到周五早上7点起床，7点半吃早餐，8点上学"',
    reward: '💡 例如："收拾玩具奖励2元，打人扣5元"',
  };
  return hints[mode] || '';
}

export default function AIAssistant({ visible, onClose, mode, onParsed }: Props) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [polishing, setPolishing] = useState(false);
  const [listening, setListening] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const parsed = localParse(text, mode);
      onParsed(parsed);
      message.success('解析成功');
      onClose();
    } catch (err) {
      message.error('解析失败，请手动填写');
    } finally {
      setLoading(false);
    }
  };

  const handlePolish = async () => {
    if (!text.trim()) { message.warning('请先输入内容'); return; }
    setPolishing(true);
    try {
      const res = await settingsAPI.get();
      const ai = res.data.ai;
      if (!ai?.api_endpoint) {
        message.warning('请先在系统设置中配置 AI API');
        setPolishing(false);
        return;
      }
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (ai.api_key) headers['Authorization'] = `Bearer ${ai.api_key}`;

      const promptMap: Record<string, string> = {
        child: '将以下自然语言描述整理为标准的孩子信息格式，输出JSON：{"name":"","age":0,"gender":"male/female","school":"","class":""}',
        schedule: '将以下自然语言描述整理为作息计划列表，输出JSON数组：[{"start_time":"HH:MM","end_time":"HH:MM","activity":"","status":"pending"}]',
        reward: '将以下自然语言描述整理为奖惩规则列表，输出JSON数组：[{"name":"","type":"reward/punishment","amount":0}]',
      };

      const resp = await fetch(ai.api_endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: ai.model || 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: promptMap[mode] || '请整理以下内容' },
            { role: 'user', content: text },
          ],
        }),
      });

      if (!resp.ok) throw new Error('HTTP ' + resp.status);
      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content || '';
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setText(JSON.stringify(parsed, null, 2));
        message.success('润色完成');
      } else {
        setText(content);
        message.success('润色完成（非JSON格式）');
      }
    } catch (e: any) {
      message.error('润色失败: ' + e.message);
    } finally {
      setPolishing(false);
    }
  };

  const handleVoiceInput = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      message.warning('您的浏览器不支持语音识别，请使用 Chrome');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = (event: any) => {
      setListening(false);
      message.error('语音识别出错: ' + event.error);
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setText(prev => prev ? prev + transcript : transcript);
    };

    try {
      recognition.start();
    } catch (e: any) {
      setListening(false);
      message.error('启动语音识别失败');
    }
  }, []);

  return (
    <Modal
      title="AI 智能输入"
      open={visible}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
      width={560}
    >
      <div style={{ marginBottom: 12, color: '#888', fontSize: 13 }}>{getHint(mode)}</div>
      <TextArea
        rows={6}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="请输入自然语言描述..."
      />
      <div style={{ marginTop: 12 }}>
        <Space>
          <Tooltip title="语音输入（说中文）">
            <Button
              icon={<AudioOutlined />}
              onClick={handleVoiceInput}
              danger={listening}
              type={listening ? 'primary' : 'default'}
            >
              {listening ? '录音中...' : '语音输入'}
            </Button>
          </Tooltip>
          <Tooltip title="使用 AI 润色输入的内容">
            <Button
              icon={<SnippetsOutlined />}
              onClick={handlePolish}
              loading={polishing}
            >
              AI 润色
            </Button>
          </Tooltip>
        </Space>
      </div>
    </Modal>
  );
}

function localParse(text: string, mode: string): any {
  if (mode === 'child') {
    const nameMatch = text.match(/(?:名叫?|叫)([^\s，,。]+)/);
    const ageMatch = text.match(/(\d+)岁/);
    const genderMatch = text.match(/(男|女孩?|女)/);
    const schoolMatch = text.match(/(.+?)(?:小学|中学|幼儿园)/);
    const classMatch = text.match(/(\S+班)/);
    return {
      name: nameMatch?.[1] || '',
      age: ageMatch ? parseInt(ageMatch[1]) : undefined,
      gender: genderMatch ? (genderMatch[1].includes('女') ? 'female' : 'male') : undefined,
      school: schoolMatch ? schoolMatch[0] : '',
      class: classMatch?.[1] || '',
    };
  }
  if (mode === 'schedule') {
    const schedules: any[] = [];
    const parts = text.split(/[,，、]/);
    parts.forEach(p => {
      const timeMatch = p.match(/(\d{1,2}[:：]\d{2})/);
      const activityMatch = p.match(/(起床|早餐|上学|午餐|放学|作业|晚餐|洗漱|睡觉|阅读|运动|兴趣班|游戏)/);
      if (timeMatch && activityMatch) {
        schedules.push({ start_time: timeMatch[1].replace('：', ':'), activity: activityMatch[1] });
      }
    });
    return schedules;
  }
  if (mode === 'reward') {
    const records: any[] = [];
    const parts = text.split(/[,，、;；]/);
    parts.forEach(p => {
      const rewardMatch = p.match(/(.+?)(奖励|扣|罚)(\d+)/);
      if (rewardMatch) {
        records.push({
          name: rewardMatch[1].trim(),
          type: rewardMatch[2] === '奖励' ? 'reward' : 'punishment',
          amount: parseInt(rewardMatch[3]),
        });
      }
    });
    return records;
  }
  return {};
}