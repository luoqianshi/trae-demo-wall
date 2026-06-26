import { ChatMessage, QuickQuestion } from '@/types/chat';

export const initialMessages: ChatMessage[] = [
  {
    id: '1',
    type: 'ai',
    content: '叔叔阿姨好！我是您的专属陪伴机器人小暖，有什么我可以帮您的吗？',
    time: '刚刚'
  }
];

export const quickQuestions: QuickQuestion[] = [
  { id: '1', text: '今天天气怎么样' },
  { id: '2', text: '讲个笑话吧' },
  { id: '3', text: '播放一首老歌' },
  { id: '4', text: '提醒我吃药' },
  { id: '5', text: '我想聊聊天' },
  { id: '6', text: '教我用智能手机' }
];

export const aiResponses: string[] = [
  '好的，我来为您服务！',
  '这个问题问得好，让我想想...',
  '哈哈，您真有意思！',
  '别担心，有我陪着您呢。',
  '今天也要开开心心的哦！',
  '记得多喝水，保重身体！',
  '想儿女了吗？可以给他们打个电话呀。'
];
