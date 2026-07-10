import request from '@/utils/request'

// 设备状态：ACTIVE 活跃 / INACTIVE 停用
export type DeviceStatus = 'ACTIVE' | 'INACTIVE'

// 设备信息 VO（与后端 DeviceVO 对齐）
export interface DeviceVO {
  id: number
  deviceType: string
  model: string
  status: DeviceStatus
  boundAt: string
  lastSyncAt: string | null
}

// 绑定设备入参（与后端 BindDeviceDTO 对齐）
export interface BindDeviceParams {
  deviceType: string
  model?: string
  token: string
}

// 设备数据上报入参（与后端 DeviceDataDTO 对齐）
export interface DeviceDataParams {
  metricId: number
  value: string
  recordedAt?: string
}

// 绑定设备，返回设备ID
export const bindDevice = (data: BindDeviceParams): Promise<number> => {
  return request.post<number, number>('/devices/bind', data)
}

// 查询当前用户的设备列表
export const getMyDevices = (): Promise<DeviceVO[]> => {
  return request.get<DeviceVO[], DeviceVO[]>('/devices/mine')
}

// 解绑设备
export const unbindDevice = (deviceId: number): Promise<void> => {
  return request.post<void, void>(`/devices/${deviceId}/unbind`)
}

// 设备数据上报（独立 Token 鉴权，无需用户登录态）
// 注意：此接口需在请求头携带 X-Device-Token
export const reportDeviceData = (
  deviceId: number,
  deviceToken: string,
  data: DeviceDataParams
): Promise<{ alertLevel: string }> => {
  return request.post<{ alertLevel: string }, { alertLevel: string }>(
    `/devices/${deviceId}/data`,
    data,
    { headers: { 'X-Device-Token': deviceToken } }
  )
}
