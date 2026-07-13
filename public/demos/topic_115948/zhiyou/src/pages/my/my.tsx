import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import authStore from '../../store/auth'
import themeStore, { ThemeConfig } from '../../store/theme'
import { UserIcon, MoonIcon, LogoutIcon, ChevronRight } from '../../components/svg/icons'
import TabBar from '../../components/TabBar'
import './my.scss'

definePageConfig({
  navigationStyle: 'custom',
  navigationBarTitleText: '我的',
  navigationBarBackgroundColor: '#FFF9F5',
  navigationBarTextStyle: 'black'
})

export default function My() {
  const [userInfo, setUserInfo] = useState<{ phone: string } | null>(null)
  const [currentThemeId, setCurrentThemeId] = useState<string>('coral')

  useEffect(() => {
    if (authStore.userInfo) {
      setUserInfo({ phone: authStore.userInfo.phone || '' })
    }
    setCurrentThemeId(themeStore.themeId)
    const unsubscribe = themeStore.subscribe(() => {
      setCurrentThemeId(themeStore.themeId)
    })
    return unsubscribe
  }, [])

  const getCurrentTheme = (): ThemeConfig => {
    const themes: Record<string, ThemeConfig> = {
      coral: { id: 'coral', name: '珊瑚暖阳', nameEn: 'Sunshine Coral', primary: '#FF6B6B', primaryLight: '#FF8A8A', primaryLighter: '#FFB4B4', primaryLightest: '#FFDADA', secondary: '#FF9F43', secondaryLight: '#FFB76B', bg: '#FFF9F5', bgWarm: '#FFF3EB', gradient: 'linear-gradient(135deg, #FF6B6B 0%, #FF9F43 100%)' },
      lavender: { id: 'lavender', name: '薰衣草梦境', nameEn: 'Lavender Dream', primary: '#9B7BBF', primaryLight: '#B49BD4', primaryLighter: '#D4C4EB', primaryLightest: '#EDE3F5', secondary: '#7B5BBF', secondaryLight: '#9B7BBF', bg: '#FAF5FF', bgWarm: '#F5EEFF', gradient: 'linear-gradient(135deg, #9B7BBF 0%, #7B5BBF 100%)' },
      mint: { id: 'mint', name: '薄荷清风', nameEn: 'Mint Breeze', primary: '#5AB8A6', primaryLight: '#7BC4B4', primaryLighter: '#A8DCD3', primaryLightest: '#D4F5ED', secondary: '#4A9A8A', secondaryLight: '#5AB8A6', bg: '#F0FFF8', bgWarm: '#E6FFFA', gradient: 'linear-gradient(135deg, #5AB8A6 0%, #4A9A8A 100%)' },
    }
    return themes[currentThemeId] || themes.coral
  }

  const handleLogout = () => {
    Taro.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          authStore.logout()
          Taro.redirectTo({ url: '/pages/login/login' })
        }
      }
    })
  }

  const formatPhone = (phone: string) => {
    if (!phone || phone.length !== 11) return phone
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
  }

  return (
    <View className='my-container'>
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

      <View className='my-header'>
        <Text className='header-title'>我的</Text>
      </View>

      <View className='profile-card'>
        <View className='profile-avatar'>
          <UserIcon color="white" />
        </View>
        <View className='profile-info'>
          <Text className='profile-name'>智友用户</Text>
          <Text className='profile-phone'>ID: {formatPhone(userInfo?.phone || '')}</Text>
        </View>
      </View>

      <View className='menu-list'>
        <View className='menu-item' onClick={() => Taro.navigateTo({ url: '/pages/theme/theme' })}>
          <View className='menu-icon' style={{ background: `${getCurrentTheme().primary}15` }}>
            <MoonIcon color={getCurrentTheme().primary} />
          </View>
          <View className='menu-content'>
            <Text className='menu-title'>主题设置</Text>
            <Text className='menu-desc'>{getCurrentTheme().name}</Text>
          </View>
          <ChevronRight color="#C4C4CD" />
        </View>

        <View className='menu-item' onClick={handleLogout}>
          <View className='menu-icon' style={{ background: 'rgba(232, 85, 85, 0.1)' }}>
            <LogoutIcon color="#E85555" />
          </View>
          <View className='menu-content'>
            <Text className='menu-title'>退出登录</Text>
          </View>
          <ChevronRight color="#C4C4CD" />
        </View>
      </View>

      <View className='version-info'>
        <Text className='version-text'>智友 v1.0.0</Text>
      </View>

      {/* 底部Tab导航 */}
      <TabBar currentPage="/pages/my/my" />
    </View>
  )
}
