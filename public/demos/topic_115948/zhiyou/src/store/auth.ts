import { authApi, UserInfo, TokenResponse } from '../api/auth'
import Taro from '@tarojs/taro'
import { TOKEN_KEY, USER_INFO_KEY } from '../config/api'

export class AuthStore {
  private static instance: AuthStore

  private _token: string = ''
  private _userInfo: UserInfo | null = null

  static getInstance(): AuthStore {
    if (!AuthStore.instance) {
      AuthStore.instance = new AuthStore()
    }
    return AuthStore.instance
  }

  constructor() {
    this._token = Taro.getStorageSync(TOKEN_KEY) || ''
    const userInfoStr = Taro.getStorageSync(USER_INFO_KEY)
    if (userInfoStr) {
      try {
        this._userInfo = JSON.parse(userInfoStr)
      } catch (e) {
        this._userInfo = null
      }
    }
  }

  get token(): string {
    return this._token
  }

  get userInfo(): UserInfo | null {
    return this._userInfo
  }

  get isLoggedIn(): boolean {
    return !!this._token
  }

  async login(phone: string, password: string): Promise<TokenResponse> {
    const res = await authApi.login(phone, password)
    const data = res.data
    this._setAuthData(data)
    return data
  }

  async register(phone: string, password: string): Promise<TokenResponse> {
    const res = await authApi.register(phone, password)
    const data = res.data
    this._setAuthData(data)
    return data
  }

  logout(): void {
    this._token = ''
    this._userInfo = null
    Taro.removeStorageSync(TOKEN_KEY)
    Taro.removeStorageSync(USER_INFO_KEY)
  }

  private _setAuthData(data: TokenResponse): void {
    this._token = data.access_token
    this._userInfo = data.user
    Taro.setStorageSync(TOKEN_KEY, data.access_token)
    Taro.setStorageSync(USER_INFO_KEY, JSON.stringify(data.user))
  }
}

export const authStore = AuthStore.getInstance()
export default authStore
