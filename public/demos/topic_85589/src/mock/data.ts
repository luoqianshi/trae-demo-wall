export interface User {
  id: string
  name: string
  avatar: string
  phone: string
  building: string
  room: string
  creditScore: number
  joinDate: string
}

export interface Task {
  id: string
  type: string
  title: string
  description: string
  expectTime: string
  status: 'pending' | 'accepted' | 'completed'
  publisher: User
  createdAt: string
}

export interface NeighborData {
  totalUsers: number
  monthlyHelpCount: number
  activeUsers: number
}

export const neighborData: NeighborData = {
  totalUsers: 126,
  monthlyHelpCount: 89,
  activeUsers: 67
}

export const mockUsers: User[] = [
  { id: '1', name: '小张', avatar: '', phone: '138****1234', building: '3号楼', room: '1502', creditScore: 98, joinDate: '2026-01-15' },
  { id: '2', name: '小李', avatar: '', phone: '139****5678', building: '5号楼', room: '801', creditScore: 95, joinDate: '2026-02-20' },
  { id: '3', name: '小王', avatar: '', phone: '137****9012', building: '2号楼', room: '1203', creditScore: 92, joinDate: '2026-03-08' },
  { id: '4', name: '小陈', avatar: '', phone: '136****3456', building: '4号楼', room: '604', creditScore: 88, joinDate: '2026-04-12' },
  { id: '5', name: '小刘', avatar: '', phone: '135****7890', building: '1号楼', room: '2001', creditScore: 96, joinDate: '2026-01-28' }
]

export const mockTasks: Task[] = [
  { id: '1', type: 'pet', title: '出差3天，需要帮忙喂猫', description: '出差3天，需要邻居每日上门喂猫并清理猫砂，猫粮和猫砂都准备好了', expectTime: '2026-07-08 ~ 2026-07-10', status: 'pending', publisher: mockUsers[0], createdAt: '2026-07-07' },
  { id: '2', type: 'buy', title: '帮忙代买药品', description: '感冒发烧，不方便出门，需要帮忙买退烧药和感冒药', expectTime: '2026-07-08', status: 'accepted', publisher: mockUsers[1], createdAt: '2026-07-08' },
  { id: '3', type: 'move', title: '搬家需要帮忙', description: '从3号楼搬到5号楼，需要2-3个人帮忙搬家具', expectTime: '2026-07-15', status: 'pending', publisher: mockUsers[2], createdAt: '2026-07-06' },
  { id: '4', type: 'companion', title: '周末一起跑步', description: '周末早上想找人一起跑步，有兴趣的邻居可以一起', expectTime: '2026-07-12', status: 'completed', publisher: mockUsers[3], createdAt: '2026-07-05' }
]

export const taskTypes = [
  { value: 'pet', label: '🐱 宠物照看' },
  { value: 'buy', label: '🛒 代买药品生鲜' },
  { value: 'move', label: '📦 大件搬运' },
  { value: 'companion', label: '👫 结伴休闲' }
]

export const helpCategories = [
  { icon: '🛒', title: '日常互助', desc: '代取快递 · 宠物照看 · 物资代买 · 家政帮忙' },
  { icon: '👫', title: '邻里结伴', desc: '生鲜拼单 · 运动组队 · 闲置互换 · 社区活动' },
  { icon: '🏠', title: '我的邻居', desc: `已认证同楼栋住户 ${neighborData.totalUsers} 人 · 本月互助 ${neighborData.monthlyHelpCount} 次` }
]

export const locationInfo = {
  lat: 30.5728,
  lng: 104.0668,
  address: '成都市武侯区天府大道123号 阳光小区 3号楼',
  radius: 500
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function getNeighborData(): Promise<NeighborData> {
  await delay(500)
  return neighborData
}

export async function getTasks(): Promise<Task[]> {
  await delay(500)
  return mockTasks
}

export async function getNearbyNeighbors(): Promise<User[]> {
  await delay(500)
  return mockUsers.slice(0, 3)
}

export async function publishTask(task: Omit<Task, 'id' | 'status' | 'createdAt'>): Promise<Task> {
  await delay(800)
  return {
    ...task,
    id: Date.now().toString(),
    status: 'pending',
    createdAt: new Date().toISOString().split('T')[0]
  }
}

export async function sendEmergencyHelp(desc: string): Promise<{ success: boolean; message: string; notifiedCount: number }> {
  await delay(1000)
  return {
    success: true,
    message: '求助已发送，正在通知周边邻居',
    notifiedCount: Math.floor(Math.random() * 5) + 3
  }
}

export async function updateCreditScore(userId: string, points: number): Promise<{ success: boolean; newScore: number }> {
  await delay(300)
  const user = mockUsers.find(u => u.id === userId)
  if (user) {
    user.creditScore = Math.min(100, user.creditScore + points)
    return { success: true, newScore: user.creditScore }
  }
  return { success: false, newScore: 0 }
}
