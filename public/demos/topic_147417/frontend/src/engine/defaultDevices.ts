import type { DeviceType } from "./types"

export const defaultDeviceNames: Record<DeviceType, string[]> = {
  light: ["客厅灯", "卧室灯", "厨房灯", "书房灯", "卫生间灯", "阳台灯", "玄关灯", "走廊灯"],
  switch: ["客厅插座", "卧室插座", "厨房插座", "书房插座", "电视插座", "电脑插座"],
  curtain: ["客厅窗帘", "卧室窗帘", "书房窗帘", "阳台窗帘"],
  tv: ["客厅电视", "卧室电视", "书房电视"],
  ac: ["客厅空调", "卧室空调", "书房空调", "主卧空调", "次卧空调"],
  sensor: ["客厅人体传感器", "卧室人体传感器", "玄关门磁", "卧室门磁", "窗磁传感器", "温湿度传感器", "光照传感器", "烟雾传感器", "风雨传感器", "燃气传感器"],
  lock: ["大门锁", "卧室门锁", "书房门锁"],
  speaker: ["客厅音箱", "卧室音箱", "智能音箱"],
  camera: ["客厅摄像头", "门口摄像头", "阳台摄像头", "卧室摄像头"],
  fan: ["客厅风扇", "卧室风扇", "厨房风扇", "吊扇"],
  heater: ["客厅取暖器", "卧室取暖器", "浴室取暖器"],
  purifier: ["客厅净化器", "卧室净化器", "书房净化器"],
  robot: ["扫地机器人", "拖地机器人"],
}

export function getDefaultNamesByType(type: DeviceType): string[] {
  return defaultDeviceNames[type] || []
}

export function getFirstDefaultName(type: DeviceType): string | undefined {
  return getDefaultNamesByType(type)[0]
}
