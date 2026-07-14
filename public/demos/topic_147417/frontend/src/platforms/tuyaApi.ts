interface TuyaApiConfig {
  clientId: string
  secret: string
  region: string
}

export interface TuyaAccessToken {
  access_token: string
  refresh_token: string
  expires_in: number
  expires_at: number
}

let cachedToken: TuyaAccessToken | null = null
let currentConfig: TuyaApiConfig | null = null

const regionEndpoints: Record<string, string> = {
  cn: "https://openapi.tuyacn.com",
  us: "https://openapi.tuyaus.com",
  eu: "https://openapi.tuyaeu.com",
  in: "https://openapi.tuyain.com",
}

function getEndpoint(region: string): string {
  return regionEndpoints[region] || regionEndpoints.cn
}

const EMPTY_BODY_SHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"

function generateNonce(): string {
  const arr = new Uint8Array(16)
  crypto.getRandomValues(arr)
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("")
}

async function hmacSha256Hex(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const sign = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message))
  return Array.from(new Uint8Array(sign))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()
}

async function sha256Hex(message: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(message))
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

function buildSignedUrl(path: string, params: Record<string, string> = {}): string {
  const keys = Object.keys(params).sort()
  if (keys.length === 0) return path
  const query = keys.map((k) => `${k}=${params[k]}`).join("&")
  return `${path}?${query}`
}

async function buildStringToSign(method: string, body: string, signedUrl: string): Promise<string> {
  const contentSha256 = body ? await sha256Hex(body) : EMPTY_BODY_SHA256
  const headers = ""
  return `${method}\n${contentSha256}\n${headers}\n${signedUrl}`
}

async function signForToken(clientId: string, secret: string, timestamp: string, nonce: string, stringToSign: string): Promise<string> {
  return hmacSha256Hex(secret, `${clientId}${timestamp}${nonce}${stringToSign}`)
}

async function signForAPI(clientId: string, secret: string, accessToken: string, timestamp: string, nonce: string, stringToSign: string): Promise<string> {
  return hmacSha256Hex(secret, `${clientId}${accessToken}${timestamp}${nonce}${stringToSign}`)
}

async function fetchWithRetry(url: string, options: RequestInit, retries: number = 2): Promise<Response> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, options)
      if (response.status === 401 && i < retries && cachedToken) {
        cachedToken = null
        await getAccessToken()
        continue
      }
      return response
    } catch (error) {
      if (i === retries) throw error
      await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
    }
  }
  throw new Error("Max retries exceeded")
}

export async function initApi(config: TuyaApiConfig): Promise<void> {
  currentConfig = config
  cachedToken = null
}

export async function getAccessToken(externalToken?: TuyaAccessToken): Promise<TuyaAccessToken> {
  if (!currentConfig) {
    throw new Error("API config not initialized")
  }

  if (externalToken && externalToken.access_token && externalToken.expires_at > Date.now() + 60000) {
    cachedToken = externalToken
    return externalToken
  }

  if (cachedToken && cachedToken.expires_at > Date.now() + 60000) {
    return cachedToken
  }

  const { clientId, secret, region } = currentConfig
  const endpoint = getEndpoint(region)
  const timestamp = Date.now().toString()
  const nonce = generateNonce()
  const signedUrl = buildSignedUrl("/v1.0/token", { grant_type: "1" })
  const stringToSign = await buildStringToSign("GET", "", signedUrl)
  const signature = await signForToken(clientId, secret, timestamp, nonce, stringToSign)

  const response = await fetch(`${endpoint}${signedUrl}`, {
    method: "GET",
    headers: {
      "client_id": clientId,
      "sign": signature,
      "t": timestamp,
      "nonce": nonce,
      "sign_method": "HMAC-SHA256",
    },
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(`获取令牌失败: ${errorBody.msg || response.statusText}`)
  }

  const data = await response.json()

  if (!data || typeof data !== "object") {
    throw new Error("获取令牌失败: API 返回数据格式错误")
  }

  if (!data.result || typeof data.result !== "object") {
    const errorMsg = data.msg || "获取令牌失败: 返回数据格式错误"
    throw new Error(errorMsg)
  }

  const result = data.result

  if (!result.access_token || typeof result.access_token !== "string") {
    throw new Error("获取令牌失败: 返回数据中缺少 access_token")
  }

  const expireTime = result.expire_time ?? result.expires_in
  if (!expireTime || typeof expireTime !== "number") {
    throw new Error("获取令牌失败: 返回数据中缺少 expire_time")
  }

  const token: TuyaAccessToken = {
    access_token: result.access_token,
    refresh_token: String(result.refresh_token || ""),
    expires_in: expireTime,
    expires_at: Date.now() + expireTime * 1000,
  }
  cachedToken = token
  return token
}

export interface TuyaDevice {
  id: string
  name: string
  category: string
  product_name: string
  online: boolean
  icon: string
}

export async function getDeviceList(): Promise<TuyaDevice[]> {
  const token = await getAccessToken()
  const { clientId, secret, region } = currentConfig!
  const endpoint = getEndpoint(region)
  const timestamp = Date.now().toString()
  const nonce = generateNonce()
  const signedUrl = buildSignedUrl("/v1.0/devices")
  const stringToSign = await buildStringToSign("GET", "", signedUrl)
  const signature = await signForAPI(clientId, secret, token.access_token, timestamp, nonce, stringToSign)

  const response = await fetchWithRetry(`${endpoint}${signedUrl}`, {
    method: "GET",
    headers: {
      "client_id": clientId,
      "access_token": token.access_token,
      "sign": signature,
      "t": timestamp,
      "nonce": nonce,
      "sign_method": "HMAC-SHA256",
    },
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(`获取设备列表失败: ${errorBody.msg || response.statusText}`)
  }

  const data = await response.json()

  if (!data || typeof data !== "object") {
    throw new Error("获取设备列表失败: API 返回数据格式错误")
  }

  return data.result || []
}

export async function getDevicesByUser(accessToken: string, uid: string): Promise<TuyaDevice[]> {
  if (!uid) {
    console.warn("未配置涂鸦用户 UID，无法获取设备列表")
    return []
  }

  if (!currentConfig) {
    throw new Error("API config not initialized")
  }

  const { clientId, secret, region } = currentConfig
  const endpoint = getEndpoint(region)
  const timestamp = Date.now().toString()
  const nonce = generateNonce()
  const signedUrl = buildSignedUrl("/v1.2/iot-03/devices", { source_type: "tuyaUser", source_id: uid })
  const stringToSign = await buildStringToSign("GET", "", signedUrl)
  const signature = await signForAPI(clientId, secret, accessToken, timestamp, nonce, stringToSign)

  const response = await fetchWithRetry(`${endpoint}${signedUrl}`, {
    method: "GET",
    headers: {
      "client_id": clientId,
      "access_token": accessToken,
      "sign": signature,
      "t": timestamp,
      "nonce": nonce,
      "sign_method": "HMAC-SHA256",
    },
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(`获取设备列表失败，请检查 UID 是否正确: ${errorBody.msg || response.statusText}`)
  }

  const data = await response.json()

  if (!data || typeof data !== "object") {
    throw new Error("获取设备列表失败: API 返回数据格式错误")
  }

  if (!data.success) {
    throw new Error(`获取设备列表失败: ${data.msg || "未知错误"}`)
  }

  const resultList = data.result?.list || []
  return resultList.map((device: Record<string, unknown>) => ({
    id: String(device.id || ""),
    name: String(device.name || "未命名设备"),
    category: String(device.category || ""),
    product_name: String(device.product_name || ""),
    online: Boolean(device.is_online ?? device.online ?? false),
    icon: String(device.icon || ""),
  }))
}

export interface TuyaCommand {
  code: string
  value: unknown
}

export interface TuyaDeviceFunction {
  code: string
  type: string
  values: Record<string, unknown>
  name?: string
}

export interface TuyaDeviceSpecification {
  functions: TuyaDeviceFunction[]
  status: Array<{
    code: string
    type: string
    values: Record<string, unknown>
  }>
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 255 }
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const v = max * 100

  const d = max - min
  s = max === 0 ? 0 : (d / max) * 100

  if (max === min) {
    h = 0
  } else {
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60
        break
      case g:
        h = ((b - r) / d + 2) * 60
        break
      case b:
        h = ((r - g) / d + 4) * 60
        break
    }
  }

  return { h, s, v }
}

export function rgbToTuyaColor(hexColor: string, brightness?: number): { colourData: string; brightValue?: number } {
  const rgb = hexToRgb(hexColor)
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b)

  const H_hex = Math.round((hsv.h / 360) * 0x168).toString(16).padStart(4, '0').toUpperCase()
  const S_hex = Math.round(hsv.s * 10).toString(16).padStart(4, '0').toUpperCase()
  const V_hex = Math.round(hsv.v * 10).toString(16).padStart(4, '0').toUpperCase()

  return {
    colourData: H_hex + S_hex + V_hex,
    brightValue: brightness,
  }
}

export async function getDeviceSpecification(deviceId: string): Promise<TuyaDeviceSpecification | null> {
  const token = await getAccessToken()
  const { clientId, secret, region } = currentConfig!
  const endpoint = getEndpoint(region)
  const timestamp = Date.now().toString()
  const nonce = generateNonce()
  const signedUrl = buildSignedUrl(`/v1.0/devices/${deviceId}/specifications`)
  const stringToSign = await buildStringToSign("GET", "", signedUrl)
  const signature = await signForAPI(clientId, secret, token.access_token, timestamp, nonce, stringToSign)

  try {
    const response = await fetchWithRetry(`${endpoint}${signedUrl}`, {
      method: "GET",
      headers: {
        "client_id": clientId,
        "access_token": token.access_token,
        "sign": signature,
        "t": timestamp,
        "nonce": nonce,
        "sign_method": "HMAC-SHA256",
      },
    })

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      console.warn(`获取设备物模型失败: ${errorBody.msg || response.statusText}`)
      return null
    }

    const data = await response.json()
    if (!data || typeof data !== "object" || !data.result) {
      return null
    }

    return data.result
  } catch (error) {
    console.warn(`获取设备物模型异常: ${error instanceof Error ? error.message : error}`)
    return null
  }
}

export async function sendDeviceCommand(deviceId: string, commands: TuyaCommand[]): Promise<boolean> {
  const token = await getAccessToken()
  const { clientId, secret, region } = currentConfig!
  const endpoint = getEndpoint(region)
  const timestamp = Date.now().toString()
  const nonce = generateNonce()
  const body = JSON.stringify({ commands })
  const signedUrl = buildSignedUrl(`/v1.0/devices/${deviceId}/commands`)
  const stringToSign = await buildStringToSign("POST", body, signedUrl)
  const signature = await signForAPI(clientId, secret, token.access_token, timestamp, nonce, stringToSign)

  const response = await fetchWithRetry(`${endpoint}${signedUrl}`, {
    method: "POST",
    headers: {
      "client_id": clientId,
      "access_token": token.access_token,
      "sign": signature,
      "t": timestamp,
      "nonce": nonce,
      "sign_method": "HMAC-SHA256",
      "Content-Type": "application/json",
    },
    body,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    throw new Error(`设备控制失败: ${errorBody.msg || response.statusText}`)
  }

  const data = await response.json()

  if (!data || typeof data !== "object") {
    throw new Error("设备控制失败: API 返回数据格式错误")
  }

  return data.success === true
}

export interface TuyaScene {
  scene_id: string
  name: string
  status: string
}

export async function createScene(name: string, actions: unknown[]): Promise<TuyaScene | null> {
  const token = await getAccessToken()
  const { clientId, secret, region } = currentConfig!
  const endpoint = getEndpoint(region)
  const timestamp = Date.now().toString()
  const nonce = generateNonce()
  const body = JSON.stringify({ name, actions })
  const signedUrl = buildSignedUrl("/v1.0/iot-03/scenes")
  const stringToSign = await buildStringToSign("POST", body, signedUrl)
  const signature = await signForAPI(clientId, secret, token.access_token, timestamp, nonce, stringToSign)

  const response = await fetchWithRetry(`${endpoint}${signedUrl}`, {
    method: "POST",
    headers: {
      "client_id": clientId,
      "access_token": token.access_token,
      "sign": signature,
      "t": timestamp,
      "nonce": nonce,
      "sign_method": "HMAC-SHA256",
      "Content-Type": "application/json",
    },
    body,
  })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}))
    console.warn(`场景创建失败（可能无权限）: ${errorBody.msg}`)
    return null
  }

  const data = await response.json()

  if (!data || typeof data !== "object") {
    throw new Error("场景创建失败: API 返回数据格式错误")
  }

  return data.result || null
}