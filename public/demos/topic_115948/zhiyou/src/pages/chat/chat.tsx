import { View, Text, Input, ScrollView } from '@tarojs/components'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import { useState, useEffect, useRef } from 'react'
import chatApi, { MessageItem } from '../../api/chat'
import friendApi, { FriendDetail } from '../../api/friend'
import ChibiAvatar from '../../components/svg/ChibiAvatar'
import { ChevronLeft, Ellipsis, PaperclipIcon, MicIcon, ArrowUpIcon } from '../../components/svg/icons'
import './chat.scss'

definePageConfig({
  navigationStyle: 'custom',
  navigationBarTitleText: '聊天',
  navigationBarBackgroundColor: '#FFF9F5',
  navigationBarTextStyle: 'black',
})

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${month}月${day}日 ${hours}:${minutes}`
}

export default function Chat() {
  const router = useRouter()
  const { id = '', name = '' } = router.params

  const [friendDetail, setFriendDetail] = useState<FriendDetail | null>(null)
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<any>(null)

  const loadFriendDetail = async () => {
    if (!id) return
    try {
      const res = await friendApi.getDetail(id)
      setFriendDetail(res.data)
    } catch (e) {
    }
  }

  const loadMessages = async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await chatApi.getHistory(id, undefined, 50)
      setMessages(res.data.list)
    } catch (e) {
    } finally {
      setLoading(false)
      scrollToBottom()
    }
  }

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        Taro.createSelectorQuery()
          .select('.message-area')
          .boundingClientRect()
          .exec((res) => {
            if (res && res[0]) {
              scrollRef.current.scrollTop = res[0].height
            }
          })
      }
    }, 100)
  }

  useEffect(() => {
    loadFriendDetail()
    loadMessages()
  }, [id])

  useDidShow(() => {
    if (id) {
      chatApi.markAsRead(id)
    }
  })

  const goBack = () => {
    Taro.reLaunch({ url: '/pages/index/index' })
  }

  const goToProfile = () => {
    Taro.navigateTo({
      url: `/pages/profile/profile?id=${id}&name=${name}`
    })
  }

  const handleSend = async () => {
    if (!inputValue.trim() || sending || !id) return

    const userMessage: MessageItem = {
      id: `temp_${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      message_type: 'text',
      created_at: new Date().toISOString(),
    }

    setMessages(prev => [...prev, userMessage])
    const content = inputValue.trim()
    setInputValue('')
    setSending(true)
    scrollToBottom()

    try {
      const res = await chatApi.sendMessage(id, content)
      setMessages(prev => [...prev, res.data])
      scrollToBottom()
    } catch (e) {
    } finally {
      setSending(false)
    }
  }

  const getAvatarColor = () => {
    if (!friendDetail) return { hair: '#FF9F43', clothes: '#FF6B6B' }
    const color = friendDetail.avatar_config?.color || '#FF6B6B'
    return { hair: color, clothes: color }
  }

  const groupMessagesByDate = () => {
    const groups: { date: string; messages: MessageItem[] }[] = []
    let currentDate = ''

    messages.forEach(msg => {
      const msgDate = new Date(msg.created_at).toDateString()
      if (msgDate !== currentDate) {
        currentDate = msgDate
        groups.push({ date: msg.created_at, messages: [msg] })
      } else {
        groups[groups.length - 1].messages.push(msg)
      }
    })

    return groups
  }

  const groupedMessages = groupMessagesByDate()

  return (
    <View className='chat-container'>
      <View className='status-bar'>
        <Text className='status-time'>9:41</Text>
        <View className='status-icons'>
          <View className='icon-signal'>
            <View className='signal-bar s1' />
            <View className='signal-bar s2' />
            <View className='signal-bar s3' />
            <View className='signal-bar s4' />
          </View>
          <View className='icon-wifi'>
            <View className='wifi-dot' />
            <View className='wifi-ring r1' />
            <View className='wifi-ring r2' />
            <View className='wifi-ring r3' />
          </View>
          <View className='icon-battery'>
            <View className='battery-body' />
            <View className='battery-level' />
            <View className='battery-tip' />
          </View>
        </View>
      </View>

      <View className='chat-header'>
        <View className='back-btn' onClick={goBack}>
          <ChevronLeft color="#2D2D3A" />
        </View>
        <View className='header-center'>
          <View className='chat-avatar'>
            <ChibiAvatar size="mini" hairColor={getAvatarColor().hair} clothesColor={getAvatarColor().clothes} />
          </View>
          <View className='header-info'>
            <Text className='header-name'>{friendDetail?.name || name}</Text>
            <View className='online-dot' />
          </View>
        </View>
        <View className='more-btn' onClick={goToProfile}>
          <Ellipsis color="#6B6B7B" />
        </View>
      </View>

      <ScrollView
        className='message-area'
        scrollY
        scrollWithAnimation
        ref={scrollRef}
      >
        {messages.length === 0 && !loading && (
          <View className='empty-chat'>
            <Text className='empty-text'>开始和{name}聊天吧~</Text>
          </View>
        )}

        {groupedMessages.map((group, groupIndex) => (
          <View key={groupIndex}>
            <View className='time-divider'>
              <Text className='time-text'>{formatTime(group.date)}</Text>
            </View>
            {group.messages.map((msg) => (
              <View
                key={msg.id}
                className={`message-row ${msg.role === 'user' ? 'user' : 'ai'}`}
              >
                {msg.role === 'assistant' && (
                  <View className='ai-avatar'>
                    <ChibiAvatar size="small" hairColor={getAvatarColor().hair} clothesColor={getAvatarColor().clothes} />
                  </View>
                )}
                <View className={`message-bubble ${msg.role === 'user' ? 'user' : 'ai'}`}>
                  <Text className='bubble-text'>{msg.content}</Text>
                </View>
              </View>
            ))}
          </View>
        ))}

        {sending && (
          <View className='message-row ai'>
            <View className='ai-avatar'>
              <ChibiAvatar size="small" hairColor={getAvatarColor().hair} clothesColor={getAvatarColor().clothes} />
            </View>
            <View className='message-bubble ai typing'>
              <View className='typing-dots'>
                <View className='dot' />
                <View className='dot' />
                <View className='dot' />
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <View className='input-bar'>
        <View className='attach-btn'>
          <PaperclipIcon color="#9B9BAB" />
        </View>
        <View className='input-wrapper'>
          <Input
            className='message-input'
            placeholder='输入消息...'
            value={inputValue}
            onInput={(e) => setInputValue(e.detail.value)}
            onConfirm={handleSend}
            confirmType='send'
            disabled={sending}
          />
        </View>
        <View className='voice-btn'>
          <MicIcon color="#9B9BAB" />
        </View>
        <View
          className={`send-btn ${!inputValue.trim() || sending ? 'disabled' : ''}`}
          onClick={handleSend}
        >
          <ArrowUpIcon color="white" />
        </View>
      </View>
    </View>
  )
}