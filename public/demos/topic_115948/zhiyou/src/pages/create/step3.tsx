import { View, Text, Input, Textarea, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState, useRef } from 'react'
import createStore from '../../store/create'
import friendApi from '../../api/friend'
import { ChevronLeft } from '../../components/svg/icons'
import './step3.scss'

definePageConfig({
  navigationStyle: 'custom',
  navigationBarTitleText: '创建智友',
  navigationBarBackgroundColor: '#FFF9F5',
  navigationBarTextStyle: 'black'
})

const speakingStyles = [
  { id: 'gentle', name: '温柔体贴' },
  { id: 'warm', name: '温暖亲切' },
  { id: 'humorous', name: '幽默风趣' },
  { id: 'calm', name: '沉稳理性' },
  { id: 'professional', name: '专业严谨' },
  { id: 'normal', name: '自然随性' }
]

const traitOptions = [
  '温柔', '善良', '幽默', '乐观', '冷静', '细心', '善解人意',
  '正直', '勇敢', '热心', '沉稳', '活泼', '真诚', '体贴'
]

export default function Step3() {
  const form = createStore.get()
  const nameInputRef = useRef<HTMLInputElement>(null)
  
  const [speakingStyle, setSpeakingStyle] = useState(form.speaking_style)
  const [traits, setTraits] = useState<string[]>(form.personality_traits)
  const [name, setName] = useState(form.name)
  const [desc, setDesc] = useState(form.description)
  const [submitting, setSubmitting] = useState(false)

  useDidShow(() => {
    const f = createStore.get()
    setSpeakingStyle(f.speaking_style)
    setTraits(f.personality_traits)
    setName(f.name)
    setDesc(f.description)
  })

  const goBack = () => {
    Taro.navigateBack()
  }

  const goPrev = () => {
    Taro.navigateBack()
  }

  const toggleTrait = (trait: string) => {
    if (traits.includes(trait)) {
      setTraits(traits.filter(t => t !== trait))
    } else {
      if (traits.length >= 6) {
        Taro.showToast({ title: '最多选6个', icon: 'none' })
        return
      }
      setTraits([...traits, trait])
    }
  }

  const goNext = async () => {
    if (!name.trim()) {
      Taro.showToast({ title: '请输入名字', icon: 'none' })
      return
    }
    if (submitting) return
    
    setSubmitting(true)
    createStore.set({
      speaking_style: speakingStyle,
      personality_traits: traits,
      name: name.trim(),
      description: desc.trim(),
    })
    
    try {
      const formData = createStore.get()
      const data = {
        name: formData.name,
        description: formData.description,
        identity: formData.identity as any,
        avatar_config: formData.avatar_config,
        personality_traits: formData.personality_traits,
        speaking_style: formData.speaking_style as any,
      }
      let res
      if (formData.editId) {
        res = await friendApi.update(formData.editId, data)
      } else {
        res = await friendApi.create(data)
      }
      createStore.set({ friendId: res.data.id })
      Taro.navigateTo({
        url: `/pages/create/step4`
      })
    } catch (e) {
      // 错误已由request.ts提示
    } finally {
      setSubmitting(false)
    }
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
        <View className='step-item active'>
          <View className='step-circle active'>
            <Text className='step-number'>3</Text>
          </View>
          <Text className='step-label active'>个性</Text>
        </View>
        <View className='step-line' />
        <View className='step-item'>
          <View className='step-circle'>
            <Text className='step-number'>4</Text>
          </View>
          <Text className='step-label'>完成</Text>
        </View>
      </View>

      <ScrollView className='scroll-content' scrollY>
        {/* Title Section */}
        <View className='title-section'>
          <Text className='title-text'>设置个性</Text>
          <Text className='title-desc'>让你的智友拥有独特的性格</Text>
        </View>

        {/* Speaking Style Card */}
        <View className='style-card'>
          <Text className='card-title'>说话风格</Text>
          <View className='style-grid'>
            {speakingStyles.map((style) => (
              <View 
                key={style.id}
                className={`style-btn ${speakingStyle === style.id ? 'selected' : ''}`}
                onClick={() => setSpeakingStyle(style.id)}
              >
                <Text>{style.name}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Personality Traits Card */}
        <View className='style-card'>
          <Text className='card-title'>性格特点（可多选，最多6个）</Text>
          <View className='trait-list'>
            {traitOptions.map((trait) => (
              <View 
                key={trait}
                className={`trait-tag ${traits.includes(trait) ? 'selected' : ''}`}
                onClick={() => toggleTrait(trait)}
              >
                <Text>{trait}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Name Input Card */}
        <View className='input-card'>
          <Text className='card-title'>给智友起个名字</Text>
          <View className='name-input-wrapper' onClick={() => nameInputRef.current?.focus()}>
            <Input 
              className='text-input'
              placeholder='输入名字...'
              value={name}
              onInput={(e) => setName(e.detail.value)}
              maxLength={20}
              ref={nameInputRef}
            />
          </View>
        </View>

        {/* Description Input Card */}
        <View className='input-card'>
          <Text className='card-title'>一句话描述</Text>
          <View className='desc-input-wrapper'>
            <Textarea 
              className='desc-input'
              placeholder='用一句话描述你的智友...'
              value={desc}
              onInput={(e) => setDesc(e.detail.value)}
              maxLength={100}
            />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Buttons */}
      <View className='bottom-buttons'>
        <View className='prev-btn' onClick={goPrev}>
          <Text className='prev-text'>上一步</Text>
        </View>
        <View className='next-btn' onClick={goNext}>
          <Text className='next-text'>下一步</Text>
          <Text className='next-arrow'>→</Text>
        </View>
      </View>
    </View>
  )
}
