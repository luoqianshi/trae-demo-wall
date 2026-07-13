import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import themeStore, { THEMES } from '../../store/theme'
import { ChevronLeft, Check } from '../../components/svg/icons'
import './theme.scss'

definePageConfig({
  navigationStyle: 'custom',
  navigationBarTitleText: '主题设置',
  navigationBarBackgroundColor: '#FFF9F5',
  navigationBarTextStyle: 'black'
})

export default function Theme() {
  const [currentThemeId, setCurrentThemeId] = useState<string>('coral')

  useEffect(() => {
    setCurrentThemeId(themeStore.themeId)
  }, [])

  const handleThemeChange = (themeId: string) => {
    setCurrentThemeId(themeId)
    themeStore.setTheme(themeId)
  }

  return (
    <View className='theme-container'>
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

      <View className='theme-header'>
        <View className='back-btn' onClick={() => Taro.navigateBack()}>
          <ChevronLeft color="#2D2D3A" />
        </View>
        <Text className='header-title'>主题设置</Text>
        <View className='placeholder' />
      </View>

      <Text className='theme-subtitle'>选择你喜欢的主题</Text>
      <Text className='theme-desc'>换一个心情，换一种颜色</Text>

      <View className='theme-list'>
        {Object.values(THEMES).map((theme) => (
          <View
            key={theme.id}
            className={`theme-item ${currentThemeId === theme.id ? 'active' : ''}`}
            onClick={() => handleThemeChange(theme.id)}
          >
            <View className='theme-preview' style={{ background: theme.gradient }} />
            <View className='theme-info'>
              <Text className='theme-name'>{theme.name}</Text>
              <Text className='theme-name-en'>{theme.nameEn}</Text>
              <View className='theme-dots'>
                <View className='theme-dot' style={{ background: theme.primary }} />
                <View className='theme-dot' style={{ background: theme.secondary }} />
                <View className='theme-dot' style={{ background: theme.bg }} />
              </View>
            </View>
            {currentThemeId === theme.id && (
              <View className='theme-check'>
                <Check color="white" />
              </View>
            )}
          </View>
        ))}
      </View>

      <Text className='theme-footer'>主题切换立即生效，随时可以更换</Text>
    </View>
  )
}
