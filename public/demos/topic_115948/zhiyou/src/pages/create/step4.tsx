import { View, Text } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import createStore from '../../store/create'
import { ChevronLeft } from '../../components/svg/icons'
import './step4.scss'

definePageConfig({
  navigationStyle: 'custom',
  navigationBarTitleText: '创建智友',
  navigationBarBackgroundColor: '#FFF9F5',
  navigationBarTextStyle: 'black'
})

const styleLabels: Record<string, string> = {
  gentle: '温柔体贴',
  warm: '温暖亲切',
  humorous: '幽默风趣',
  calm: '沉稳理性',
  professional: '专业严谨',
  normal: '自然随性'
}

export default function Step4() {
  const form = createStore.get()
  const [submitted, setSubmitted] = useState(false)
  const [friendId, setFriendId] = useState(form.friendId || '')

  useDidShow(() => {
    const f = createStore.get()
    setFriendId(f.friendId || '')
    setSubmitted(true)
    createStore.reset()
  })

  const goBack = () => {
    if (submitted) {
      Taro.reLaunch({ url: '/pages/index/index' })
    } else {
      Taro.navigateBack()
    }
  }

  const goToHome = () => {
    Taro.reLaunch({ url: '/pages/index/index' })
  }

  const goToChat = () => {
    if (!friendId) return
    Taro.reLaunch({
      url: `/pages/chat/chat?id=${friendId}&name=${form.name}`
    })
  }

  return (
    <View className='page-container'>
      {/* Nav Bar */}
      <View className='nav-bar'>
        <View className='nav-back' onClick={goBack}>
          <ChevronLeft color="#2D2D3A" />
        </View>
        <Text className='nav-title'>{form.editId ? '编辑智友' : '创建智友'}</Text>
        <View className='nav-placeholder' />
      </View>

      {/* Step Indicator */}
      <View className='step-indicator'>
        <View className='step-item done'>
          <View className='step-circle done'>
            <Text className='step-check'>✓</Text>
          </View>
          <Text className='step-label'>身份</Text>
        </View>
        <View className='step-line done' />
        <View className='step-item done'>
          <View className='step-circle done'>
            <Text className='step-check'>✓</Text>
          </View>
          <Text className='step-label'>形象</Text>
        </View>
        <View className='step-line done' />
        <View className='step-item done'>
          <View className='step-circle done'>
            <Text className='step-check'>✓</Text>
          </View>
          <Text className='step-label'>个性</Text>
        </View>
        <View className='step-line done' />
        <View className='step-item done'>
          <View className='step-circle done'>
            <Text className='step-check'>✓</Text>
          </View>
          <Text className='step-label'>完成</Text>
        </View>
      </View>

      {submitted && (
        <>
          {/* Celebration Area */}
          <View className='celebration-area'>
            {/* Avatar with glow */}
            <View className='avatar-glow'>
              <View className='avatar-main'>
                <View className='chibi-done'>
                  <View className='done-hair' style={{ background: form.avatar_config.color }} />
                  <View className='done-face'>
                    <View className='done-eye' />
                    <View className='done-eye' />
                    <View className='done-mouth' />
                  </View>
                  <View className='done-body' style={{ background: form.avatar_config.color }} />
                </View>
              </View>
              {/* Success Badge */}
              <View className='success-badge'>
                <Text className='badge-check'>✓</Text>
              </View>
            </View>

            {/* Name */}
            <Text className='celebration-name'>{form.name}</Text>

            {/* Identity Tag */}
            <View className='identity-tag'>
              <Text>{form.identity_label}</Text>
            </View>

            {/* Description */}
            <Text className='celebration-desc'>{form.description || '你的贴心伙伴，随时倾听你的心声'}</Text>
          </View>

          {/* Stats Card Row */}
          <View className='stats-row'>
            <View className='stat-mini'>
              <Text className='stat-mini-label'>身份</Text>
              <Text className='stat-mini-value'>{form.identity_label}</Text>
            </View>
            <View className='stat-mini'>
              <Text className='stat-mini-label'>风格</Text>
              <Text className='stat-mini-value'>{styleLabels[form.speaking_style] || form.speaking_style}</Text>
            </View>
            <View className='stat-mini'>
              <Text className='stat-mini-label'>性格</Text>
              <Text className='stat-mini-value'>{form.personality_traits.slice(0, 2).join('、') || '温柔'}</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className='action-buttons'>
            <View className='primary-btn' onClick={goToChat}>
              <Text className='primary-text'>开始聊天</Text>
            </View>
            <View className='secondary-btn' onClick={goToHome}>
              <Text className='secondary-text'>返回首页</Text>
            </View>
          </View>

          {/* Bottom Hint */}
          <View className='bottom-hint'>
            <Text className='hint-text'>{form.name}会越来越懂你，聊得越多越好哦~</Text>
          </View>
        </>
      )}
    </View>
  )
}
