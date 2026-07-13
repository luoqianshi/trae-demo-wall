import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect } from 'react'
import { HomeIcon, UserIcon } from '../svg/icons'
import themeStore from '../../store/theme'
import './index.scss'

interface TabBarProps {
  currentPage: string
}

export default function TabBar({ currentPage }: TabBarProps) {
  const [primaryColor, setPrimaryColor] = useState('#FF6B6B')

  useEffect(() => {
    setPrimaryColor(themeStore.currentTheme.primary)
    const unsubscribe = themeStore.subscribe(() => {
      setPrimaryColor(themeStore.currentTheme.primary)
    })
    return unsubscribe
  }, [])

  const tabs = [
    { path: '/pages/index/index', text: '首页', icon: HomeIcon },
    { path: '/pages/my/my', text: '我的', icon: UserIcon },
  ]

  const handleClick = (path: string) => {
    if (path !== currentPage) {
      Taro.redirectTo({ url: path })
    }
  }

  return (
    <View className='tab-bar'>
      {tabs.map((tab, index) => {
        const Icon = tab.icon
        const isActive = currentPage === tab.path
        return (
          <View
            key={index}
            className={`tab-item ${isActive ? 'active' : ''}`}
            onClick={() => handleClick(tab.path)}
          >
            <Icon color={isActive ? primaryColor : '#9B9BAB'} />
            <Text className='tab-text' style={{ color: isActive ? primaryColor : '#9B9BAB' }}>{tab.text}</Text>
          </View>
        )
      })}
    </View>
  )
}
