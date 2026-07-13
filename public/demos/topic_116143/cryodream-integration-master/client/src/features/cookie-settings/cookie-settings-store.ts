interface ApiResponse<T> {
  code: number
  data: T
  message?: string
}

const SYSTEM_SETTING_API_PREFIX = '/api/systemSetting'

export interface PlatformCookieSetting {
  configured: boolean
  maskedCookie: string
  cookieCount: number
  updateTime?: string
}

export interface PlatformCookieDefinition {
  id: 'douyin'
  name: string
  description: string
  supportedFormats: string[]
  usage: string
  status?: PlatformCookieSetting | null
}

const request = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  })
  if (!response.ok) {
    throw new Error(`请求失败：${response.status}`)
  }
  const result = (await response.json()) as ApiResponse<T>
  if (result.code !== 0) {
    throw new Error(result.message || 'Cookie 设置接口请求失败')
  }
  return result.data
}

export const cookiePlatforms: PlatformCookieDefinition[] = [
  {
    id: 'douyin',
    name: '抖音',
    description: '网页端 Cookie，用于抖音分享链接解析、视频详情获取和下载链路。',
    supportedFormats: ['EditThisCookie V3 JSON', 'Cookie Header'],
    usage: '知识库抖音链接入库',
  },
]

export const getPlatformCookieSetting = async (platform: PlatformCookieDefinition['id']) => {
  return request<PlatformCookieSetting>(`${SYSTEM_SETTING_API_PREFIX}/${platform}/cookie`)
}

export const updatePlatformCookieSetting = async (platform: PlatformCookieDefinition['id'], cookie: string) => {
  return request<PlatformCookieSetting>(`${SYSTEM_SETTING_API_PREFIX}/${platform}/cookie`, {
    method: 'POST',
    body: JSON.stringify({ cookie }),
  })
}
