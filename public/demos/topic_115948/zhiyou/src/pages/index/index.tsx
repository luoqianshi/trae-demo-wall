import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState, useEffect, useCallback, useRef } from 'react'
import { PullDownRefresh } from '@tarojs/components'
import friendApi, { FriendItem } from '../../api/friend'
import authStore from '../../store/auth'
import ChibiAvatar from '../../components/svg/ChibiAvatar'
import { SearchIcon, PlusIcon } from '../../components/svg/icons'
import TabBar from '../../components/TabBar'
import './index.scss'

definePageConfig({
  navigationBarTitleText: '我的智友',
  navigationBarBackgroundColor: '#FFF9F5',
  navigationBarTextStyle: 'black',
  enablePullDownRefresh: true,
})

const IDENTITY_COLORS: Record<string, { bg: string; tagBg: string; tagColor: string }> = {
  friend: { bg: 'linear-gradient(135deg, #FFD1D1 0%, #FFB4B4 100%)', tagBg: '#FFDADA', tagColor: '#E85555' },
  bestie: { bg: 'linear-gradient(135deg, #FFD1D1 0%, #FFB4B4 100%)', tagBg: '#FFDADA', tagColor: '#E85555' },
  teacher: { bg: 'linear-gradient(135deg, #D4F0D4 0%, #B4E0B4 100%)', tagBg: '#E0F0D4', tagColor: '#5A9A4A' },
  doctor: { bg: 'linear-gradient(135deg, #D1E8FF 0%, #B4D4FF 100%)', tagBg: '#E3F0FF', tagColor: '#4A7FBF' },
  lawyer: { bg: 'linear-gradient(135deg, #E0D4F0 0%, #C4B4E0 100%)', tagBg: '#EDE3F5', tagColor: '#7B5BBF' },
  counselor: { bg: 'linear-gradient(135deg, #FFE4CC 0%, #FFD4A0 100%)', tagBg: '#FFE8CC', tagColor: '#E88A2E' },
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString()
}

export default function Index() {
  const [friendList, setFriendList] = useState<FriendItem[]>([])
  const [searchText, setSearchText] = useState('')
  const [loading, setLoading] = useState(false)
  const [isEmpty, setIsEmpty] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const loadFriends = useCallback(async () => {
    setLoading(true)
    try {
      const res = await friendApi.getList(searchText)
      setFriendList(res.data.list)
      setIsEmpty(res.data.list.length === 0)
    } catch (e) {
      // 错误已在 request 中提示
    } finally {
      setLoading(false)
      Taro.stopPullDownRefresh()
    }
  }, [searchText])

  useEffect(() => {
    loadFriends()
  }, [loadFriends])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadFriends()
    }, 300)
    return () => clearTimeout(timer)
  }, [searchText, loadFriends])

  const onPullDownRefresh = () => {
    loadFriends()
  }

  const goToChat = (friend: FriendItem) => {
    Taro.navigateTo({
      url: `/pages/chat/chat?id=${friend.id}&name=${friend.name}`
    })
  }

  const goToCreate = () => {
    Taro.navigateTo({
      url: '/pages/create/step1'
    })
  }

  const goToProfile = (friend: FriendItem) => {
    Taro.navigateTo({
      url: `/pages/profile/profile?id=${friend.id}&name=${friend.name}`
    })
  }

  const goToMyPage = () => {
    Taro.switchTab({ url: '/pages/my/my' })
  }

  const getAvatarConfig = (friend: FriendItem) => {
    const colors = IDENTITY_COLORS[friend.identity] || IDENTITY_COLORS.friend
    const hairColor = friend.avatar_config?.color || '#FF9F43'
    const clothesColor = friend.avatar_config?.color || '#FF6B6B'

    return {
      avatarBg: colors.bg,
      hairColor,
      clothesColor,
      tagBg: colors.tagBg,
      tagColor: colors.tagColor,
    }
  }

  return (
    <View className='page-container'>
      {/* 状态栏 */}
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

      {/* 顶部问候栏 */}
      <View className='header'>
        <View className='header-info'>
          <Text className='header-greeting'>下午好</Text>
          <Text className='header-title'>我的智友</Text>
        </View>
        <View className='header-avatar' onClick={goToMyPage}>
          <View className='avatar-face'>
            <View className='face-head' />
            <View className='face-body' />
          </View>
        </View>
      </View>

      {/* 搜索栏 */}
      <View className='search-bar' onClick={() => searchInputRef.current?.focus?.()}>
        <SearchIcon className='search-icon' />
        <Input
          className='search-input'
          placeholder='搜索你的智友...'
          value={searchText}
          onInput={(e) => setSearchText(e.detail.value)}
          ref={searchInputRef}
        />
      </View>

      {/* 空状态 */}
      {isEmpty && !loading && (
        <View className='empty-state'>
          <View className='empty-mascot'>
            <ChibiAvatar size="large" hairColor="#FF9F43" clothesColor="#FF6B6B" />
          </View>
          <Text className='empty-title'>还没有智友</Text>
          <Text className='empty-desc'>创建你的第一个智友\n开始一段温暖的陪伴之旅</Text>
          <View className='empty-btn' onClick={goToCreate}>
            <PlusIcon color="white" />
            <Text>创建第一个智友</Text>
          </View>
        </View>
      )}

      {/* 智友列表 */}
      {!isEmpty && (
        <View className='friend-list'>
          {friendList.map((friend) => {
            const config = getAvatarConfig(friend)
            return (
              <View
                key={friend.id}
                className='friend-card'
                onClick={() => goToChat(friend)}
                onLongPress={() => goToProfile(friend)}
              >
                <View className='friend-avatar' style={{ background: config.avatarBg }}>
                  <ChibiAvatar size="medium" hairColor={config.hairColor} clothesColor={config.clothesColor} />
                </View>
                <View className='friend-info'>
                  <View className='friend-name-row'>
                    <Text className='friend-name'>{friend.name}</Text>
                    <View className='friend-tag' style={{ background: config.tagBg }}>
                      <Text style={{ color: config.tagColor }}>{friend.identity_label}</Text>
                    </View>
                  </View>
                  <Text className='friend-lastmsg'>{friend.last_message || '快来和我聊天吧~'}</Text>
                </View>
                <View className='friend-right'>
                  <Text className='friend-time'>{formatTime(friend.last_message_at)}</Text>
                  {friend.unread_count > 0 && (
                    <View className='friend-badge'>
                      <Text>{friend.unread_count > 99 ? '99+' : friend.unread_count}</Text>
                    </View>
                  )}
                </View>
              </View>
            )
          })}
        </View>
      )}

      {/* 新建智友悬浮按钮 */}
      <View className='fab-btn' onClick={goToCreate}>
        <PlusIcon color="white" />
      </View>

      {/* 底部Tab导航 */}
      <TabBar currentPage="/pages/index/index" />
    </View>
  )
}
