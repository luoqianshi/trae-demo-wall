import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useDidShow } from '@tarojs/taro'
import { useState } from 'react'
import createStore from '../../store/create'
import { ChevronLeft } from '../../components/svg/icons'
import AvatarBuilder from '../../components/svg/AvatarBuilder'
import { HairIcon, FaceIcon, ClothesIcon } from '../../components/svg/AvatarIcons'
import './step2.scss'

definePageConfig({
  navigationStyle: 'custom',
  navigationBarTitleText: '创建智友',
  navigationBarBackgroundColor: '#FFF9F5',
  navigationBarTextStyle: 'black'
})

export default function Step2() {
  const form = createStore.get()
  
  const [activeTab, setActiveTab] = useState('hair')
  const [selectedHair, setSelectedHair] = useState(form.avatar_config.hairstyle)
  const [selectedFace, setSelectedFace] = useState(form.avatar_config.face_shape)
  const [selectedClothes, setSelectedClothes] = useState(form.avatar_config.clothing)
  const [hairColor, setHairColor] = useState(form.avatar_config.hair_color || '#2D2D3A')
  const [clothesColor, setClothesColor] = useState(form.avatar_config.clothes_color || '#FF6B6B')

  useDidShow(() => {
    const f = createStore.get()
    setSelectedHair(f.avatar_config.hairstyle)
    setSelectedFace(f.avatar_config.face_shape)
    setSelectedClothes(f.avatar_config.clothing)
    setHairColor(f.avatar_config.hair_color || '#2D2D3A')
    setClothesColor(f.avatar_config.clothes_color || '#FF6B6B')
  })

  const goBack = () => {
    Taro.navigateBack()
  }

  const goPrev = () => {
    Taro.navigateBack()
  }

  const goNext = () => {
    createStore.set({
      avatar_config: {
        hairstyle: selectedHair,
        face_shape: selectedFace,
        clothing: selectedClothes,
        hair_color: hairColor,
        clothes_color: clothesColor,
      },
    })
    Taro.navigateTo({
      url: `/pages/create/step3`
    })
  }

  const hairOptions = [
    { id: 'long', name: '长发' },
    { id: 'curly', name: '卷发' },
    { id: 'ponytail', name: '马尾' },
    { id: 'short', name: '短发' },
    { id: 'bob', name: '波波头' },
    { id: 'bun', name: '丸子头' }
  ]

  const faceOptions = [
    { id: 'round', name: '圆脸' },
    { id: 'oval', name: '鹅蛋脸' },
    { id: 'square', name: '方脸' },
    { id: 'heart', name: '心形脸' },
    { id: 'long', name: '长脸' }
  ]

  const clothesOptions = [
    { id: 'tshirt', name: 'T恤' },
    { id: 'dress', name: '连衣裙' },
    { id: 'hoodie', name: '卫衣' },
    { id: 'suit', name: '西装' },
    { id: 'casual', name: '休闲装' },
    { id: 'uniform', name: '校服' }
  ]

  const hairColorOptions = [
    { color: '#2D2D3A', name: '黑色' },
    { color: '#5C3D2E', name: '棕色' },
    { color: '#FF9EC6', name: '粉色' },
    { color: '#D4A853', name: '黄色' },
    { color: '#9B9BAB', name: '灰色' },
  ]

  const clothesColorOptions = [
    { color: '#2D2D3A', name: '黑色' },
    { color: '#FFFFFF', name: '白色' },
    { color: '#9B9BAB', name: '灰色' },
    { color: '#FFD460', name: '黄色' },
    { color: '#FF9EC6', name: '粉色' },
  ]

  const getOptions = () => {
    if (activeTab === 'hair') return hairOptions
    if (activeTab === 'face') return faceOptions
    if (activeTab === 'clothes') return clothesOptions
    return []
  }

  const getSelected = () => {
    if (activeTab === 'hair') return selectedHair
    if (activeTab === 'face') return selectedFace
    if (activeTab === 'clothes') return selectedClothes
    return ''
  }

  const setSelected = (id: string) => {
    if (activeTab === 'hair') setSelectedHair(id)
    if (activeTab === 'face') setSelectedFace(id)
    if (activeTab === 'clothes') setSelectedClothes(id)
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
        <View className='step-item active'>
          <View className='step-circle active'>
            <Text className='step-number'>2</Text>
          </View>
          <Text className='step-label active'>形象</Text>
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

      {/* Q-Version Preview */}
      <View className='preview-area'>
        <View className='preview-glow'>
          <AvatarBuilder
            hairstyle={selectedHair as any}
            faceShape={selectedFace as any}
            clothing={selectedClothes as any}
            hairColor={hairColor}
            clothesColor={clothesColor}
            size={200}
          />
        </View>
      </View>

      {/* Category Tabs */}
      <View className='category-tabs'>
        <View 
          className={`category-tab ${activeTab === 'hair' ? 'active' : ''}`}
          onClick={() => setActiveTab('hair')}
        >
          <Text>发型</Text>
        </View>
        <View 
          className={`category-tab ${activeTab === 'face' ? 'active' : ''}`}
          onClick={() => setActiveTab('face')}
        >
          <Text>脸型</Text>
        </View>
        <View 
          className={`category-tab ${activeTab === 'clothes' ? 'active' : ''}`}
          onClick={() => setActiveTab('clothes')}
        >
          <Text>服装</Text>
        </View>
      </View>

      {/* Selection Options */}
      <ScrollView className='options-area' scrollX>
        <View className='options-inner'>
          {getOptions().map((option) => (
            <View 
              key={option.id}
              className={`option-card ${getSelected() === option.id ? 'selected' : ''}`}
              onClick={() => setSelected(option.id)}
            >
              <View className='option-inner'>
                {activeTab === 'hair' && <HairIcon type={option.id} color={hairColor} size={48} />}
                {activeTab === 'face' && <FaceIcon type={option.id} size={48} />}
                {activeTab === 'clothes' && <ClothesIcon type={option.id} color={clothesColor} size={48} />}
              </View>
              <Text className={`option-name ${getSelected() === option.id ? 'selected' : ''}`}>
                {option.name}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {activeTab !== 'face' && (
        <View className='color-section'>
          <Text className='color-title'>颜色</Text>
          <View className='color-list'>
            {(activeTab === 'hair' ? hairColorOptions : clothesColorOptions).map((item) => (
              <View 
                key={item.color}
                className={`color-circle ${(activeTab === 'hair' ? hairColor : clothesColor) === item.color ? 'selected' : ''}`}
                style={{ background: item.color }}
                onClick={() => {
                  if (activeTab === 'hair') {
                    setHairColor(item.color)
                  } else {
                    setClothesColor(item.color)
                  }
                }}
              />
            ))}
          </View>
        </View>
      )}

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
