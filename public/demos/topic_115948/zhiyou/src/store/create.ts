import { AvatarConfig } from '../api/friend'

export interface CreateFormData {
  identity: string
  identity_label: string
  avatar_config: AvatarConfig
  personality_traits: string[]
  speaking_style: string
  name: string
  description: string
  editId: string
}

const STORAGE_KEY = 'zhiyou_create_form'

class CreateStore {
  private data: CreateFormData = {
    identity: 'bestie',
    identity_label: '闺蜜',
    avatar_config: {
      hairstyle: 'long',
      face_shape: 'oval',
      clothing: 'dress',
      hair_color: '#2D2D3A',
      clothes_color: '#FF6B6B',
    },
    personality_traits: [],
    speaking_style: 'gentle',
    name: '',
    description: '',
    editId: '',
  }

  constructor() {
    try {
      const saved = Taro.getStorageSync(STORAGE_KEY)
      if (saved) {
        this.data = JSON.parse(saved)
      }
    } catch (e) {
      // 忽略存储错误
    }
  }

  get(): CreateFormData {
    return this.data
  }

  set(partial: Partial<CreateFormData>) {
    this.data = { ...this.data, ...partial }
    try {
      Taro.setStorageSync(STORAGE_KEY, JSON.stringify(this.data))
    } catch (e) {
      // 忽略存储错误
    }
  }

  reset() {
    this.data = {
      identity: 'bestie',
      identity_label: '闺蜜',
      avatar_config: {
        hairstyle: 'long',
        face_shape: 'oval',
        clothing: 'dress',
        hair_color: '#2D2D3A',
        clothes_color: '#FFD460',
      },
      personality_traits: [],
      speaking_style: 'gentle',
      name: '',
      description: '',
      editId: '',
    }
    try {
      Taro.removeStorageSync(STORAGE_KEY)
    } catch (e) {
      // 忽略存储错误
    }
  }
}

export const createStore = new CreateStore()
export default createStore
