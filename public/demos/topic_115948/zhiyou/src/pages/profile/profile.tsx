import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useRouter, useDidShow } from '@tarojs/taro'
import { useState, useEffect } from 'react'
import friendApi, { FriendDetail } from '../../api/friend'
import chatApi, { MemoryItem } from '../../api/chat'
import ChibiAvatar from '../../components/svg/ChibiAvatar'
import { ChevronLeft, HeartIcon, PencilIcon } from '../../components/svg/icons'
import './profile.scss'

definePageConfig({
  navigationStyle: 'custom',
  navigationBarTitleText: '智友档案',
  navigationBarBackgroundColor: '#FFF9F5',
  navigationBarTextStyle: 'black'
})

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / 86400000)
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)

  if (days < 1) return '今天'
  if (days < 7) return `${days}天前`
  if (weeks < 5) return `${weeks}周前`
  if (months < 12) return `${months}个月前`
  return `${Math.floor(months / 12)}年前`
}

function formatMonth(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getFullYear()}年${date.getMonth() + 1}月`
}

export default function Profile() {
  const router = useRouter()
  const { id = '', name = '' } = router.params

  const [friendDetail, setFriendDetail] = useState<FriendDetail | null>(null)
  const [memories, setMemories] = useState<MemoryItem[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [loading, setLoading] = useState(false)

  const loadData = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [friendRes, memoryRes] = await Promise.all([
        friendApi.getDetail(id),
        chatApi.getMemories(id, 1, 20),
      ])
      setFriendDetail(friendRes.data)
      setMemories(memoryRes.data.list)
    } catch (e) {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [id])

  useDidShow(() => {
    loadData()
  })

  const goBack = () => {
    Taro.navigateBack()
  }

  const goToChat = () => {
    Taro.redirectTo({
      url: `/pages/chat/chat?id=${id}&name=${friendDetail?.name || name}`
    })
  }

  const goToEdit = () => {
    Taro.navigateTo({
      url: `/pages/create/step1?editId=${id}`
    })
  }

  const handleDelete = () => {
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!id) return
    setShowDeleteModal(false)
    try {
      await friendApi.delete(id)
      Taro.showToast({ title: '删除成功', icon: 'success' })
      setTimeout(() => {
        Taro.reLaunch({ url: '/pages/index/index' })
      }, 1500)
    } catch (e) {
    }
  }

  const getAvatarColor = () => {
    const color = friendDetail?.avatar_config?.color || '#FF6B6B'
    return { hair: color, clothes: color }
  }

  return (
    <View className='profile-container'>
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

      <View className='profile-header'>
        <View className='back-btn' onClick={goBack}>
          <ChevronLeft color="#2D2D3A" />
        </View>
        <Text className='header-title'>智友档案</Text>
        <View className='edit-btn' onClick={goToEdit}>
          <PencilIcon color="#6B6B7B" />
        </View>
      </View>

      <ScrollView className='scroll-content' scrollY>
        <View className='profile-section'>
          <View className='profile-avatar'>
            <ChibiAvatar size="xlarge" hairColor={getAvatarColor().hair} clothesColor={getAvatarColor().clothes} />
          </View>
          <Text className='profile-name'>{friendDetail?.name || name}</Text>
          <View className='profile-tag'>
            <Text>{friendDetail?.identity_label || '闺蜜'}</Text>
          </View>
          <Text className='profile-date'>
            创建于 {friendDetail?.created_at ? formatMonth(friendDetail.created_at) : '2024年12月'}
          </Text>
        </View>

        <View className='stats-card'>
          <View className='stat-item'>
            <Text className='stat-value'>{friendDetail?.companion_days || 0}</Text>
            <Text className='stat-label'>陪伴天数</Text>
          </View>
          <View className='stat-divider' />
          <View className='stat-item'>
            <Text className='stat-value'>{friendDetail?.chat_count || 0}</Text>
            <Text className='stat-label'>聊天次数</Text>
          </View>
          <View className='stat-divider' />
          <View className='stat-item'>
            <Text className='stat-value'>{friendDetail?.memory_count || 0}</Text>
            <Text className='stat-label'>记忆点</Text>
          </View>
        </View>

        {(friendDetail?.personality_traits || []).length > 0 && (
          <View className='traits-section'>
            <Text className='section-title'>性格特征</Text>
            <View className='traits-list'>
              {(friendDetail?.personality_traits || []).map((trait, index) => (
                <View key={index} className='trait-tag'><Text>{trait}</Text></View>
              ))}
            </View>
          </View>
        )}

        <View className='memory-section'>
          <Text className='section-title'>记忆回顾</Text>
          <Text className='section-desc'>{friendDetail?.name || '小暖'}记住了这些关于你的事</Text>
          <View className='memory-list'>
            {memories.length === 0 && (
              <View className='empty-memory'>
                <Text className='empty-memory-text'>还没有记忆~多和TA聊聊天吧</Text>
              </View>
            )}
            {memories.map((memory) => (
              <View key={memory.id} className='memory-card'>
                <View className='memory-icon'>
                  <HeartIcon color="#FF6B6B" />
                </View>
                <View className='memory-content'>
                  <Text className='memory-text'>{memory.content}</Text>
                  <Text className='memory-time'>{formatTime(memory.recorded_at)}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className='delete-btn' onClick={handleDelete}>
          <Text className='delete-text'>删除智友</Text>
        </View>

        <View style={{ height: '40px' }} />
      </ScrollView>

      {showDeleteModal && (
        <View className='modal-overlay'>
          <View className='modal-content'>
            <Text className='modal-title'>确认删除</Text>
            <Text className='modal-desc'>
              删除后，{friendDetail?.name || '小暖'}的所有记忆和聊天记录将被清除，此操作不可撤销。
            </Text>
            <View className='modal-buttons'>
              <View className='modal-btn cancel' onClick={() => setShowDeleteModal(false)}>
                <Text>取消</Text>
              </View>
              <View className='modal-btn confirm' onClick={confirmDelete}>
                <Text>确认删除</Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </View>
  )
}