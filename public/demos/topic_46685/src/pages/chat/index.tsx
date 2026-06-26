import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, Input, Button, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import ChatBubble from '@/components/ChatBubble';
import { ChatMessage, QuickQuestion } from '@/types/chat';
import { initialMessages, quickQuestions } from '@/data/chat';
import { ChatEngine } from '@/utils/chatEngine';
import { StorageUtil, STORAGE_KEYS } from '@/utils/storage';
import { formatCurrentTime } from '@/utils/time';
import { getAIService } from '@/services/ai';

// 这是一个空注释，用来强制 Webpack 重新构建该页面

const ChatPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useRealAI, setUseRealAI] = useState(false);
  const scrollViewRef = useRef<any>(null);

  // 初始化配置
  useEffect(() => {
    const aiConfig = StorageUtil.getAIConfig();
    getAIService().setConfig(aiConfig);
    setUseRealAI(!!aiConfig.apiKey?.trim());

    // 加载聊天记录
    const savedMessages = StorageUtil.get<ChatMessage[]>(STORAGE_KEYS.CHAT_MESSAGES);
    
    // 检查是否有重复ID的聊天记录
    const hasDuplicateIds = savedMessages && new Set(savedMessages.map(m => m.id)).size !== savedMessages.length;
    
    if (savedMessages && savedMessages.length > 0 && !hasDuplicateIds) {
      setMessages(savedMessages);
    } else {
      // 清理旧的聊天记录（如果有重复）
      if (hasDuplicateIds) {
        StorageUtil.remove(STORAGE_KEYS.CHAT_MESSAGES);
      }
      setMessages(initialMessages);
    }
  }, []);

  // 消息变化时自动滚动到底部并保存
  useEffect(() => {
    scrollToBottom();
    if (messages.length > 0) {
      StorageUtil.set(STORAGE_KEYS.CHAT_MESSAGES, messages);
    }
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToBottom?.();
      }
    }, 100);
  };

  // 调用AI回复
  const getAIResponse = useCallback(async (userInput: string, currentMessages: ChatMessage[]) => {
    if (useRealAI) {
      try {
        // 准备对话历史（不包含当前消息，因为它还没添加）
        const historyMessages = currentMessages.map(msg => ({
          role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }));
        
        const response = await getAIService().chat([
          ...historyMessages,
          { role: 'user', content: userInput }
        ]);
        return response;
      } catch (error) {
        console.error('真实AI调用失败，回退到规则引擎:', error);
        return ChatEngine.generateResponse(userInput);
      }
    } else {
      return ChatEngine.generateResponse(userInput);
    }
  }, [useRealAI]);

  // 生成唯一ID的辅助函数
  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // 发送消息
  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      type: 'user',
      content: inputText,
      time: formatCurrentTime()
    };

    const userInput = inputText;
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const aiResponse = await getAIResponse(userInput, updatedMessages);
      const aiMessage: ChatMessage = {
        id: generateId(),
        type: 'ai',
        content: aiResponse,
        time: formatCurrentTime()
      };
      setMessages([...updatedMessages, aiMessage]);
    } catch (error) {
      console.error('获取AI回复失败:', error);
      const failMessage: ChatMessage = {
        id: generateId(),
        type: 'ai',
        content: '抱歉，我现在有点累了，请稍后再试。',
        time: formatCurrentTime()
      };
      setMessages([...updatedMessages, failMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 快捷问题
  const handleQuickQuestion = async (question: QuickQuestion) => {
    if (isLoading) return;
    
    const userMessage: ChatMessage = {
      id: generateId(),
      type: 'user',
      content: question.text,
      time: formatCurrentTime()
    };

    const userInput = question.text;
    const updatedMessages = [...messages, userMessage];
    
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const aiResponse = await getAIResponse(userInput, updatedMessages);
      const aiMessage: ChatMessage = {
        id: generateId(),
        type: 'ai',
        content: aiResponse,
        time: formatCurrentTime()
      };
      setMessages([...updatedMessages, aiMessage]);
    } catch (error) {
      console.error('获取AI回复失败:', error);
      const failMessage: ChatMessage = {
        id: generateId(),
        type: 'ai',
        content: '抱歉，我现在有点累了，请稍后再试。',
        time: formatCurrentTime()
      };
      setMessages([...updatedMessages, failMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // 语音输入
  const handleVoiceInput = () => {
    Taro.showToast({
      title: '语音输入开发中',
      icon: 'none'
    });
  };

  // 清空聊天记录
  const handleClearHistory = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要清空聊天记录吗？',
      success: (res) => {
        if (res.confirm) {
          setMessages(initialMessages);
          Taro.showToast({
            title: '已清空',
            icon: 'success'
          });
        }
      }
    });
  };

  return (
    <View className={styles.container}>
      <View className={styles.header}>
        <View className={styles.headerLeft}>
          <Text className={styles.title}>小暖陪您聊天</Text>
          {useRealAI && (
            <View className={styles.realAIStatus}>
              <View className={styles.realAIDot}></View>
              <Text className={styles.realAIText}>AI模式</Text>
            </View>
          )}
        </View>
        <Button
          className={styles.clearBtn}
          onClick={handleClearHistory}
          size='small'
        >
          清空
        </Button>
      </View>

      <ScrollView
        className={styles.chatList}
        scrollY
        ref={scrollViewRef}
      >
        {messages.map(message => (
          <ChatBubble key={message.id} message={message} />
        ))}
        {isLoading && (
          <View className={styles.loadingBubble}>
            <View className={styles.typingIndicator}>
              <View className={styles.typingDot}></View>
              <View className={styles.typingDot}></View>
              <View className={styles.typingDot}></View>
            </View>
          </View>
        )}
      </ScrollView>

      <View className={styles.quickQuestions}>
        <Text className={styles.quickTitle}>试试问这些：</Text>
        <View className={styles.questionsList}>
          {quickQuestions.map(question => (
            <View
              key={question.id}
              className={styles.questionItem}
              onClick={() => handleQuickQuestion(question)}
            >
              <Text className={styles.questionText}>{question.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.inputArea}>
        <Button className={styles.voiceBtn} onClick={handleVoiceInput}>
          <Text>🎤</Text>
        </Button>
        <View className={styles.inputWrapper}>
          <Input
            className={styles.input}
            type='text'
            placeholder='说点什么...'
            value={inputText}
            onInput={(e) => setInputText(e.detail.value)}
            confirmType='send'
            onConfirm={handleSend}
            disabled={isLoading}
          />
        </View>
        <Button 
          className={`${styles.sendBtn} ${isLoading ? styles.sendBtnDisabled : ''}`}
          onClick={handleSend}
          disabled={isLoading}
        >
          <Text className={styles.sendBtnText}>
            {isLoading ? '思考中' : '发送'}
          </Text>
        </Button>
      </View>
    </View>
  );
};

export default ChatPage;
