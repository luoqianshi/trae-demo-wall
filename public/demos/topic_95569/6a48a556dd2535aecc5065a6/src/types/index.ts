export interface Food {
  id: string
  name: string
  image: string
  calories: number
  protein: number
  fat: number
  carbs: number
  isForbidden: boolean
  forbiddenReason?: string
}

export interface Meal {
  id: string
  type: 'breakfast' | 'lunch' | 'dinner'
  foods: Food[]
  time: string
}

export interface DailyDiet {
  date: string
  meals: Meal[]
  totalCalories: number
  totalProtein: number
  totalFat: number
  totalCarbs: number
}

export interface ElderProfile {
  id: string
  name: string
  age: number
  avatar: string
  conditions: string[]
  invitationCode: string
  bindStatus: boolean
  familyMembers: FamilyMember[]
}

export interface FamilyMember {
  id: string
  name: string
  relation: string
}

export interface FamilyProfile {
  id: string
  name: string
  avatar: string
  elders: ElderProfile[]
}

export interface TrendData {
  date: string
  calories: