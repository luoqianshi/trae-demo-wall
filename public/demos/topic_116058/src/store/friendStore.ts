import { create } from 'zustand';
import type { Friend, FurColor } from '@/types';

interface FriendStore {
  friends: Friend[];
  searchQuery: string;
  searchResults: Friend[];
  search: (query: string) => void;
  addFriend: (id: string) => void;
  removeFriend: (id: string) => void;
  interactWithFriend: (id: string, action: 'pet' | 'sendGift') => void;
}

// 模拟柯基名字池（用于"全网唯一"校验展示）
export const ALL_CORGI_NAMES_DB = [
  '布丁', '奶昔', '可可', '果冻', '汤圆', '麻薯', '芋圆', '奶酪',
  '小熊', '糖糖', '豆豆', '球球', '宝宝', '蜜糖', '棉花', '雪糕',
  '咖啡', '抹茶', '草莓', '蓝莓', '芒果', '蜜桃', '柚子', '柠檬',
];

// 模拟可搜索的用户库
const MOCK_USERS: Friend[] = [
  { id: 'u1', name: '小明', corgiName: '奶昔', corgiColor: 'cream', petType: 'corgi', affinity: 245, avatar: '👦', lastActive: '刚刚在线' },
  { id: 'u2', name: '小红', corgiName: '可可', corgiColor: 'chocolate', petType: 'corgi', affinity: 380, avatar: '👧', lastActive: '5分钟前' },
  { id: 'u3', name: '小华', corgiName: '果冻', corgiColor: 'mint', petType: 'ragdoll', affinity: 156, avatar: '🧑', lastActive: '10分钟前' },
  { id: 'u4', name: '小芳', corgiName: '汤圆', corgiColor: 'peach', petType: 'golden', affinity: 412, avatar: '👩', lastActive: '1小时前' },
  { id: 'u5', name: '阿杰', corgiName: '麻薯', corgiColor: 'lavender', petType: 'shiba', affinity: 502, avatar: '👨', lastActive: '在线' },
  { id: 'u6', name: '小雨', corgiName: '芋圆', corgiColor: 'lilac', petType: 'tabby', affinity: 89, avatar: '🧒', lastActive: '今天' },
  { id: 'u7', name: '阿明', corgiName: '奶酪', corgiColor: 'red', petType: 'corgi', affinity: 320, avatar: '👦', lastActive: '昨天' },
  { id: 'u8', name: '小桐', corgiName: '小熊', corgiColor: 'sable', petType: 'golden', affinity: 178, avatar: '👧', lastActive: '3天前' },
];

// 初始无好友，需搜索添加
const INITIAL_FRIENDS: Friend[] = [];

// 检查宠物名字是否全网唯一（mock）
export function checkCorgiNameUnique(name: string): { unique: boolean; suggestions: string[] } {
  if (ALL_CORGI_NAMES_DB.includes(name)) {
    // 名字在数据库中已存在
    return {
      unique: false,
      suggestions: ALL_CORGI_NAMES_DB.filter(n => n !== name).slice(0, 5),
    };
  }
  // 简单规则：3字以内的常见名字被占用概率高
  if (name.length <= 2) {
    return {
      unique: false,
      suggestions: [name + '酱', name + '宝', '小' + name, name + '君'].filter(s => !ALL_CORGI_NAMES_DB.includes(s)),
    };
  }
  return { unique: true, suggestions: [] };
}

export const useFriendStore = create<FriendStore>((set, get) => ({
  friends: INITIAL_FRIENDS,
  searchQuery: '',
  searchResults: [],
  search: (query) => {
    if (!query.trim()) {
      set({ searchQuery: '', searchResults: [] });
      return;
    }
    const results = MOCK_USERS.filter(
      (u) =>
        u.name.includes(query) ||
        u.corgiName.includes(query) ||
        !get().friends.some((f) => f.id === u.id)
    ).filter(
      (u) => u.name.includes(query) || u.corgiName.includes(query)
    );
    set({ searchQuery: query, searchResults: results });
  },
  addFriend: (id) => {
    const user = MOCK_USERS.find((u) => u.id === id);
    if (!user) return;
    if (get().friends.some((f) => f.id === id)) return;
    set((state) => ({ friends: [...state.friends, user], searchResults: [] }));
  },
  removeFriend: (id) => {
    set((state) => ({ friends: state.friends.filter((f) => f.id !== id) }));
  },
  interactWithFriend: (id, action) => {
    // 模拟互动：增加好感度展示
    set((state) => ({
      friends: state.friends.map((f) =>
        f.id === id
          ? {
              ...f,
              affinity: Math.min(500, f.affinity + (action === 'pet' ? 3 : 8)),
              lastActive: '刚刚互动',
            }
          : f
      ),
    }));
  },
}));

// 根据毛色获取颜色展示
export function getColorPreview(color: FurColor): string {
  const colorMap: Record<FurColor, string> = {
    classic: '#E8A857',
    tricolor: '#3A2E1E',
    red: '#C97B3E',
    cream: '#F5DEB3',
    merle: '#B8A090',
    sable: '#A0683C',
    chocolate: '#6B4226',
    peach: '#FFB6A3',
    mint: '#A8E0C8',
    blue: '#8FA8C8',
    lilac: '#C8B0D8',
    lavender: '#E0B0FF',
  };
  return colorMap[color] || '#E8A857';
}
