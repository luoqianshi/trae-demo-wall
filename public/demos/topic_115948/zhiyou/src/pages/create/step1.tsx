import { View, Text } from '@tarojs/components'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import createStore from '../../store/create'
import friendApi from '../../api/friend'
import { ChevronLeft } from '../../components/svg/icons'
import './step1.scss'

definePageConfig({
  navigationStyle: 'custom',
  navigationBarTitleText: '创建智友',
  navigationBarBackgroundColor: '#FFF9F5',
  navigationBarTextStyle: 'black'
})

interface Identity {
  id: string
  name: string
  desc: string
  iconBg: string
  iconColor: string
}

const identities: Identity[] = [
  { id: 'friend', name: '朋友', desc: '像真正的朋友一样聊天陪伴', iconBg: 'rgba(255, 159, 67, 0.12)', iconColor: '#FF9F43' },
  { id: 'bestie', name: '闺蜜', desc: '懂你的贴心闺蜜，随时倾听', iconBg: 'rgba(255, 107, 107, 0.12)', iconColor: '#FF6B6B' },
  { id: 'teacher', name: '教师', desc: '耐心解答问题，帮助你学习', iconBg: 'rgba(100, 181, 246, 0.12)', iconColor: '#64B5F6' },
  { id: 'doctor', name: '医生', desc: '提供健康咨询和生活建议', iconBg: 'rgba(76, 175, 130, 0.12)', iconColor: '#4CAF82' },
  { id: 'lawyer', name: '律师', desc: '解答法律疑问，提供思路', iconBg: 'rgba(171, 130, 255, 0.12)', iconColor: '#AB82FF' },
  { id: 'counselor', name: '心理咨询师', desc: '倾听你的烦恼，给予支持', iconBg: 'rgba(77, 208, 225, 0.12)', iconColor: '#4DD0E1' }
]

export default function Step1() {
  const router = useRouter()
  const { editId = '' } = router.params

  const [selected, setSelected] = useState<string>('bestie')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editId) {
      loadDetail(editId)
    } else {
      const form = createStore.get()
      if (form.identity) {
        setSelected(form.identity)
      }
    }
  }, [editId])

  const loadDetail = async (id: string) => {
    setLoading(true)
    try {
      const res = await friendApi.getDetail(id)
      const detail = res.data
      setSelected(detail.identity)
      createStore.reset()
      createStore.set({
        editId: id,
        identity: detail.identity,
        identity_label: detail.identity_label,
        avatar_config: detail.avatar_config,
        personality_traits: detail.personality_traits,
        speaking_style: detail.speaking_style,
        name: detail.name,
        description: detail.description || '',
      })
    } catch (e) {
      // 错误已提示
    } finally {
      setLoading(false)
    }
  }

  const goBack = () => {
    Taro.navigateBack()
  }

  const goNext = () => {
    const identity = identities.find(i => i.id === selected)
    createStore.set({
      identity: selected,
      identity_label: identity?.name || '',
    })
    Taro.navigateTo({
      url: `/pages/create/step2`
    })
  }

  return (
    <View className='page-container'>
      {/* Nav Bar */}
      <View className='nav-bar'>
        <View className='nav-back' onClick={goBack}>
          <ChevronLeft color="#2D2D3A" />
        </View>
        <Text className='nav-title'>{editId ? '编辑智友' : '创建智友'}</Text>
        <View className='nav-placeholder' />
      </View>

      {/* Step Indicator */}
      <View className='step-indicator'>
        <View className='step-item active'>
          <View className='step-circle active'>
            <Text className='step-number'>1</Text>
          </View>
          <Text className='step-label active'>身份</Text>
        </View>
        <View className='step-line' />
        <View className='step-item'>
          <View className='step-circle'>
            <Text className='step-number'>2</Text>
          </View>
          <Text className='step-label'>形象</Text>
        </View>
        <View className='step-line' />
        <View className='step-item'>
          <View className='step-circle'>
            <Text className='step-number'>3</Text>
          </View>
          <Text className='step-label'>个性</Text>
        </View>
        <View className='step-line' />
        <View className='step-item'>
          <View className='step-circle'>
            <Text className='step-number'>4</Text>
          </View>
          <Text className='step-label'>完成</Text>
        </View>
      </View>

      {/* Title Section */}
      <View className='title-section'>
        <Text className='title-text'>选择一个身份</Text>
        <Text className='title-desc'>你的智友将以这个身份陪伴你</Text>
      </View>

      {/* Identity Cards */}
      <View className='identity-grid'>
        {identities.map((identity) => (
          <View 
            key={identity.id}
            className={`identity-card ${selected === identity.id ? 'selected' : ''}`}
            onClick={() => setSelected(identity.id)}
          >
            <View className='identity-icon' style={{ background: identity.iconBg }}>
              <Text className='icon-emoji' style={{ color: identity.iconColor }}>
                {identity.id === 'friend' ? '👤' : 
                 identity.id === 'bestie' ? '❤️' : 
                 identity.id === 'teacher' ? '📚' : 
                 identity.id === 'doctor' ? '💊' : 
                 identity.id === 'lawyer' ? '⚖️' : '💬'}
              </Text>
            </View>
            <Text className='identity-name'>{identity.name}</Text>
            <Text className='identity-desc'>{identity.desc}</Text>
          </View>
        ))}
      </View>

      {/* Bottom Button */}
      <View className='bottom-btn'>
        <View className='bottom-btn-inner' onClick={goNext}>
          <Text className='btn-text'>下一步</Text>
          <Text className='btn-arrow'>→</Text>
        </View>
      </View>
    </View>
  )
}
