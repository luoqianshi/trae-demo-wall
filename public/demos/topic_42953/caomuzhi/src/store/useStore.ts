import { create } from 'zustand';
import { User, HistoryItem, Badge, CollectionItem } from '@/types';
import { getAvatarUrl } from '@/utils/imageUtils';

interface AppState {
  user: User | null;
  isLoggedIn: boolean;
  collections: CollectionItem[];
  history: HistoryItem[];
  currentBadge: Badge | null;
  toast: {
    show: boolean;
    message: string;
    type: 'success' | 'error' | 'info';
  };
  
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => boolean;
  register: (userData: Omit<User, 'id'>) => boolean;
  logout: () => void;
  addCollection: (item: CollectionItem) => void;
  removeCollection: (plantId: number) => void;
  addHistory: (item: HistoryItem) => void;
  removeFromHistory: (id: string) => void;
  clearHistory: () => void;
  updateUserProfile: (profile: Partial<User>) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideToast: () => void;
  getBadge: () => Badge | null;
}

export const badges: Badge[] = [
  { id: 'novice', name: '初识草木', icon: '🌱', minPlants: 0, maxPlants: 9, color: '#22c55e', description: '刚刚踏入草木世界的大门' },
  { id: 'traveler', name: '草木行者', icon: '🌿', minPlants: 10, maxPlants: 49, color: '#3b82f6', description: '已经认识不少草木了' },
  { id: 'expert', name: '草木达人', icon: '🍃', minPlants: 50, maxPlants: 99, color: '#8b5cf6', description: '对草木有深入的了解' },
  { id: 'master', name: '草木专家', icon: '🏆', minPlants: 100, maxPlants: 199, color: '#f59e0b', description: '草木知识的专家' },
  { id: 'legend', name: '草木通', icon: '👑', minPlants: 200, maxPlants: 9999, color: '#ec4899', description: '草木世界的王者' }
];

const getBadgeByPlantCount = (count: number): Badge | null => {
  return badges.find(badge => count >= badge.minPlants && count <= badge.maxPlants) || badges[badges.length - 1];
};

const loadUserFromStorage = (): User | null => {
  try {
    const stored = localStorage.getItem('caomuzhi_user');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load user:', error);
  }
  return null;
};

const loadCollectionsFromStorage = (): CollectionItem[] => {
  try {
    const stored = localStorage.getItem('caomuzhi_collections');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load collections:', error);
  }
  return [];
};

const loadHistoryFromStorage = (): HistoryItem[] => {
  try {
    const stored = localStorage.getItem('caomuzhi_history');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load history:', error);
  }
  return [];
};

const saveUserToStorage = (user: User | null): void => {
  try {
    if (user) {
      localStorage.setItem('caomuzhi_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('caomuzhi_user');
      localStorage.removeItem('caomuzhi_token');
    }
  } catch (error) {
    console.error('Failed to save user:', error);
  }
};

const saveCollectionsToStorage = (collections: CollectionItem[]): void => {
  try {
    localStorage.setItem('caomuzhi_collections', JSON.stringify(collections));
  } catch (error) {
    console.error('Failed to save collections:', error);
  }
};

const saveHistoryToStorage = (history: HistoryItem[]): void => {
  try {
    localStorage.setItem('caomuzhi_history', JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save history:', error);
  }
};

const getUsers = (): User[] => {
  try {
    const stored = localStorage.getItem('caomuzhi_users');
    const users = stored ? JSON.parse(stored) : [];
    
    if (users.length === 0) {
      const defaultUser: User = {
        id: 'default_user_001',
        email: 'admin@caomuzhi.com',
        username: '草木探索者',
        password: btoa('123456'),
        bio: '热爱自然，探索草木之美',
        location: '中国',
        createdAt: new Date().toISOString()
      };
      saveUsers([defaultUser]);
      return [defaultUser];
    }
    
    const hasDefault = users.some((u: User) => u.email === 'admin@caomuzhi.com');
    if (!hasDefault) {
      const defaultUser: User = {
        id: 'default_user_001',
        email: 'admin@caomuzhi.com',
        username: '草木探索者',
        password: btoa('123456'),
        bio: '热爱自然，探索草木之美',
        location: '中国',
        createdAt: new Date().toISOString()
      };
      users.push(defaultUser);
      saveUsers(users);
    }
    
    return users;
  } catch {
    return [];
  }
};

const saveUsers = (users: User[]): void => {
  localStorage.setItem('caomuzhi_users', JSON.stringify(users));
};

export const useStore = create<AppState>((set, get) => {
  const savedUser = loadUserFromStorage();
  const savedCollections = loadCollectionsFromStorage();
  const savedHistory = loadHistoryFromStorage();
  
  return {
    user: savedUser,
    isLoggedIn: savedUser !== null,
    collections: savedCollections,
    history: savedHistory,
    currentBadge: savedUser ? getBadgeByPlantCount(savedCollections.length) : null,
    toast: {
      show: false,
      message: '',
      type: 'info'
    },
    
    setUser: (user) => {
      saveUserToStorage(user);
      set({ 
        user, 
        isLoggedIn: user !== null,
        currentBadge: user ? getBadgeByPlantCount(get().collections.length) : null
      });
    },
    
    login: (email, password) => {
      const users = getUsers();
      const user = users.find(u => u.email === email && u.password === password);
      
      if (!user) {
        return false;
      }
      
      const token = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('caomuzhi_token', token);
      saveUserToStorage(user);
      set({ 
        user, 
        isLoggedIn: true,
        currentBadge: getBadgeByPlantCount(get().collections.length)
      });
      get().showToast('登录成功', 'success');
      return true;
    },
    
    register: (userData) => {
      const users = getUsers();
      
      if (users.some(u => u.email === userData.email)) {
        return false;
      }
      
      const newUser: User = {
        ...userData,
        id: Date.now().toString(),
        avatar: userData.avatar || getAvatarUrl(userData.email || Date.now().toString())
      };
      
      users.push(newUser);
      saveUsers(users);
      return true;
    },
    
    logout: () => {
      saveUserToStorage(null);
      set({ 
        user: null, 
        isLoggedIn: false,
        currentBadge: null
      });
      get().showToast('已退出登录', 'info');
    },
    
    addCollection: (item) => {
      const state = get();
      if (!state.user) {
        get().showToast('请先登录', 'error');
        return;
      }
      
      if (state.collections.some(c => c.plantId === item.plantId)) {
        get().showToast('已经收藏过了', 'info');
        return;
      }
      
      const newCollections = [...state.collections, item];
      const oldBadge = state.currentBadge;
      const newBadge = getBadgeByPlantCount(newCollections.length);
      
      saveCollectionsToStorage(newCollections);
      set({ 
        collections: newCollections,
        currentBadge: newBadge
      });
      
      get().showToast('收藏成功', 'success');
      
      if (newBadge && (!oldBadge || newBadge.id !== oldBadge.id)) {
        setTimeout(() => {
          get().showToast(`恭喜升级！获得"${newBadge.name}"徽章`, 'success');
        }, 500);
      }
    },
    
    removeCollection: (plantId) => {
      const state = get();
      if (!state.user) return;
      
      const newCollections = state.collections.filter(c => c.plantId !== plantId);
      
      saveCollectionsToStorage(newCollections);
      set({ 
        collections: newCollections,
        currentBadge: getBadgeByPlantCount(newCollections.length)
      });
      
      get().showToast('已取消收藏', 'info');
    },
    
    addHistory: (item) => {
      const state = get();
      if (!state.user) return;
      
      const newHistory = [item, ...state.history].slice(0, 50);
      
      saveHistoryToStorage(newHistory);
      set({ history: newHistory });
    },
    
    removeFromHistory: (id) => {
      const state = get();
      if (!state.user) return;
      
      const newHistory = state.history.filter(item => item.id !== id);
      
      saveHistoryToStorage(newHistory);
      set({ history: newHistory });
    },
    
    clearHistory: () => {
      const state = get();
      if (!state.user) return;
      
      saveHistoryToStorage([]);
      set({ history: [] });
      
      get().showToast('已清空识别记录', 'info');
    },
    
    updateUserProfile: (profile) => {
      const state = get();
      if (!state.user) return;
      
      const updatedUser: User = { ...state.user, ...profile };
      saveUserToStorage(updatedUser);
      set({ user: updatedUser });
      get().showToast('资料更新成功', 'success');
    },
    
    showToast: (message, type = 'info') => {
      set({ toast: { show: true, message, type } });
      setTimeout(() => {
        get().hideToast();
      }, 3000);
    },
    
    hideToast: () => {
      set({ toast: { show: false, message: '', type: 'info' } });
    },
    
    getBadge: () => {
      const state = get();
      return getBadgeByPlantCount(state.collections.length);
    }
  };
});
