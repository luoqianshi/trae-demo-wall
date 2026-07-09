import React, { useState, useEffect } from 'react'
import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import styles from './index.module.scss'
import { callFunction } from '@/services/cloud'
import type { QARecord } from '@/types'

const faqs = [
  '城乡居民养老保险政策',
  '就业援助申请流程',
  '义务教育学生资助',
  '农村危房改造',
  '农业支持保护补贴',
  '城乡低保申请条件'
]

export default function QAPage() {
  const [messages, setMessages] = useState<{ type: 'user' | 'bot'; content: string }[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  
  useEffect(() => {
    loadHistory()
  }, [])
  
  const loadHistory = async () => {
    try {
      const result = await callFunction('getQARecords', { page: 1, pageSize: 5 })
      const history = (result.records || []).map((record: QARecord) => [
        { type: 'user' as const, content: record.question },
        { type: 'bot' as const, content: record.answer }
      ]).flat()
      setMessages(history)
    } catch (err) {
      console.error('[QAPage] loadHistory error:', err)
    }
  }
  
  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return
    
    const userMsg = { type: 'user' as const, content: inputValue.trim() }
    setMessages(prev => [...prev, userMsg])
    setInputValue('')
    setIsLoading(true)
    
    try {
      const result = await callFunction('createQARecord', { question: userMsg.content })
      const botMsg = { type: 'bot' as const, content: result.record?.answer || '抱歉，我暂时无法回答这个问题，请稍后再试。' }
      setMessages(prev => [...prev, botMsg])
    } catch (err) {
      console.error('[QAPage] createQARecord error:', err)
      const botMsg = { type: 'bot' as const, content: '抱歉，服务暂时不可用，请稍后再试。' }
      setMessages(prev => [...prev, botMsg])
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleFaqClick = (question: string) => {
    setInputValue(question)
  }
  
  const handleInputChange = (e: any) => {
    setInputValue(e.detail.value)
  }
  
  const handleMicClick = () => {
    if (isRecording) {
      setIsRecording(false)
      Taro.showToast({ title: '录音已停止', icon: 'none' })
    } else {
      setIsRecording(true)
      Taro.showToast({ title: '开始录音，请说话...', icon: 'none' })
      // 模拟语音识别
      setTimeout(() => {
        setIsRecording(false)
        setInputValue('请问社保怎么办理？')
        Taro.showToast({ title: '语音识别完成', icon: 'none' })
      }, 2000)
    }
  }
  
  const handleKeyPress = (e: any) => {
    if (e.key === 'Enter') {
      handleSend()
    }
  }
  
  return (
    <View className={styles.container}>
      <View className={styles.navBar}>
        <Text className={styles.navTitle}>智能问答</Text>
      </View>
      
      <ScrollView className={styles.chatArea} scrollY scrollTop={99999}>
        {messages.length === 0 ? (
          <View className={styles.welcome}>
            <Text className={styles.welcomeIcon}>🤖</Text>
            <Text className={styles.welcomeTitle}>智能问答助手</Text>
            <Text className={styles.welcomeDesc}>7x24小时在线，为您解答政策相关问题</Text>
            <View className={styles.faqList}>
              {faqs.map((faq, idx) => (
                <Text key={idx} className={styles.faqItem} onClick={() => handleFaqClick(faq)}>
                  {faq}
                </Text>
              ))}
            </View>
          </View>
        ) : (
          messages.map((msg, idx) => (
            <View key={idx} className={styles.chatItem}>
              {msg.type === 'user' ? (
                <View className={styles.userMsg}>
                  <Text className={styles.msgText}>{msg.content}</Text>
                </View>
              ) : (
                <View className={styles.botMsg}>
                  <View className={styles.botAvatar}>🤖</View>
                  <Text className={styles.msgText}>{msg.content}</Text>
                </View>
              )}
            </View>
          ))
        )}
        
        {isLoading && (
          <View className={styles.chatItem}>
            <View className={styles.botMsg}>
              <View className={styles.botAvatar}>🤖</View>
              <Text className={styles.msgText}>
                <Text className={styles.loadingDot}></Text>
                <Text className={styles.loadingDot}></Text>
                <Text className={styles.loadingDot}></Text>
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
      
      <View className={styles.inputArea}>
        <View className={styles.inputWrap}>
          <View 
            className={`${styles.micBtn} ${isRecording ? styles.micBtnActive : ''}`}
            onClick={handleMicClick}
          >
            <Text className={styles.micIcon}>🎤</Text>
          </View>
          <Input 
            className={styles.input}
            placeholder="请输入您的问题..."
            placeholderStyle="color: #999999"
            value={inputValue}
            onChange={handleInputChange}
            onConfirm={handleSend}
            disabled={isLoading}
          />
          <View className={styles.sendBtn} onClick={handleSend}>
            发送
          </View>
        </View>
      </View>
    </View>
  )
}