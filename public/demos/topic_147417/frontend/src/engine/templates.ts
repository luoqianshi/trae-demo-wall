import type { SceneTemplate } from "./types"
import { getFirstDefaultName } from "./defaultDevices"

export const defaultTemplates: SceneTemplate[] = [
  {
    id: "template-night-light",
    name: "夜间起夜灯",
    description: "检测到人体移动且处于夜间时段时，自动开启过道灯",
    keywords: ["起夜", "夜间", "半夜", "晚上上厕所", "夜里开灯", "摸黑", "起床上厕所", "夜灯", "人体", "移动", "过道", "走廊", "关夜灯", "关掉夜灯", "夜灯关", "夜灯关闭"],
    params: [
      { key: "pirSensor", label: "人体传感器", type: "deviceSelect", deviceType: "sensor", required: true, defaultName: getFirstDefaultName("sensor") },
      { key: "lightDevice", label: "过道灯", type: "deviceSelect", deviceType: "light", required: true, defaultName: getFirstDefaultName("light") },
      { key: "startTime", label: "开始时间", type: "time", required: true, defaultValue: "22:00" },
      { key: "endTime", label: "结束时间", type: "time", required: true, defaultValue: "06:00" },
      { key: "brightness", label: "灯光亮度(%)", type: "number", required: false, defaultValue: 30 },
    ],
    triggers: [
      { type: "device_status", entityId: "{{pirSensor}}", value: "pir", operator: "==", label: "人体传感器检测到移动" },
    ],
    conditions: [
      { type: "timer", entityId: "", value: "{{startTime}}-{{endTime}}", operator: "in", label: "处于夜间时段" },
    ],
    actions: [
      { type: "device_control", entityId: "{{lightDevice}}", value: { switch: true, bright_value: "{{brightness}}" }, label: "开启过道灯" },
      { type: "delay", entityId: "", value: 300, label: "延时5分钟" },
      { type: "device_control", entityId: "{{lightDevice}}", value: { switch: false }, label: "关闭过道灯" },
    ],
  },
  {
    id: "template-leave-home",
    name: "离家一键布防",
    description: "手动触发后，关闭所有电器并启用安防设备",
    keywords: ["离家", "出门", "不在家", "布防", "一键关闭", "全屋关闭", "出门", "安防", "锁门", "关闭", "断电"],
    params: [
      { key: "mainLight", label: "客厅灯", type: "deviceSelect", deviceType: "light", required: true, defaultName: getFirstDefaultName("light") },
      { key: "aircon", label: "空调", type: "deviceSelect", deviceType: "ac", required: true, defaultName: getFirstDefaultName("ac") },
      { key: "camera", label: "摄像头", type: "deviceSelect", deviceType: "camera", required: true, defaultName: getFirstDefaultName("camera") },
      { key: "doorLock", label: "门锁", type: "deviceSelect", deviceType: "lock", required: false, defaultName: getFirstDefaultName("lock") },
      { key: "powerSwitch", label: "插座", type: "deviceSelect", deviceType: "switch", required: false, defaultName: getFirstDefaultName("switch") },
    ],
    triggers: [
      { type: "manual", entityId: "", value: "", label: "手动触发" },
    ],
    actions: [
      { type: "device_control", entityId: "{{mainLight}}", value: { switch: false }, label: "关闭客厅灯" },
      { type: "device_control", entityId: "{{aircon}}", value: { switch: false }, label: "关闭空调" },
      { type: "device_control", entityId: "{{camera}}", value: { switch: true }, label: "启用摄像头监控" },
      { type: "device_control", entityId: "{{powerSwitch}}", value: { switch: false }, label: "关闭插座电源" },
      { type: "device_control", entityId: "{{doorLock}}", value: { lock: true }, label: "锁门" },
    ],
  },
  {
    id: "template-welcome-home",
    name: "回家自动亮灯",
    description: "检测到门磁打开且光线暗时，自动开启玄关灯",
    keywords: ["回家", "进门", "到家", "开门亮灯", "回家开灯", "推门", "开门", "玄关", "亮灯", "门磁", "光线"],
    params: [
      { key: "doorSensor", label: "门磁传感器", type: "deviceSelect", deviceType: "sensor", required: true, defaultName: getFirstDefaultName("sensor") },
      { key: "lightSensor", label: "光照传感器", type: "deviceSelect", deviceType: "sensor", required: true, defaultName: getFirstDefaultName("sensor") },
      { key: "entranceLight", label: "玄关灯", type: "deviceSelect", deviceType: "light", required: true, defaultName: getFirstDefaultName("light") },
      { key: "luxThreshold", label: "光照阈值(lux)", type: "number", required: true, defaultValue: 100 },
    ],
    triggers: [
      { type: "device_status", entityId: "{{doorSensor}}", value: "open", operator: "==", label: "门磁打开" },
    ],
    conditions: [
      { type: "device_status", entityId: "{{lightSensor}}", value: "{{luxThreshold}}", operator: "<", label: "光线昏暗" },
    ],
    actions: [
      { type: "device_control", entityId: "{{entranceLight}}", value: { switch: true }, label: "开启玄关灯" },
    ],
  },
  {
    id: "template-movie-night",
    name: "观影模式",
    description: "触发后关闭窗帘、调暗灯光、开启电视",
    keywords: ["看电影", "观影", "影院", "家庭影院", "投影", "看剧", "影音", "电影", "看电视", "客厅", "窗帘", "调暗"],
    params: [
      { key: "curtain", label: "窗帘", type: "deviceSelect", deviceType: "curtain", required: true, defaultName: getFirstDefaultName("curtain") },
      { key: "livingLight", label: "灯光设备", type: "deviceSelect", deviceType: "light", required: true, defaultName: getFirstDefaultName("light") },
      { key: "tv", label: "电视设备", type: "deviceSelect", deviceType: "tv", required: true, defaultName: getFirstDefaultName("tv") },
      { key: "lightLevel", label: "灯光亮度(%)", type: "number", required: false, defaultValue: 15 },
    ],
    triggers: [
      { type: "manual", entityId: "", value: "", label: "手动触发" },
    ],
    actions: [
      { type: "device_control", entityId: "{{curtain}}", value: { control: "close" }, label: "关闭窗帘" },
      { type: "device_control", entityId: "{{livingLight}}", value: { switch: true, bright_value: "{{lightLevel}}" }, label: "调暗客厅灯光" },
      { type: "device_control", entityId: "{{tv}}", value: { switch: true }, label: "开启电视" },
    ],
  },
  {
    id: "template-window-aircon",
    name: "开窗自动关空调",
    description: "检测到窗磁打开时，自动关闭空调以节省能源",
    keywords: ["开窗", "窗户开", "开窗关", "通风关空调", "空调", "节能", "窗磁", "通风", "关闭"],
    params: [
      { key: "windowSensor", label: "窗磁传感器", type: "deviceSelect", deviceType: "sensor", required: true, defaultName: getFirstDefaultName("sensor") },
      { key: "aircon", label: "空调", type: "deviceSelect", deviceType: "ac", required: true, defaultName: getFirstDefaultName("ac") },
    ],
    triggers: [
      { type: "device_status", entityId: "{{windowSensor}}", value: "open", operator: "==", label: "窗户打开" },
    ],
    actions: [
      { type: "device_control", entityId: "{{aircon}}", value: { switch: false }, label: "关闭空调" },
    ],
  },
  {
    id: "template-motion-light",
    name: "有人经过开灯",
    description: "检测到人体移动时自动开灯",
    keywords: ["有人", "经过", "开灯", "移动", "人体", "感应", "人来灯亮", "经过开灯", "检测到人", "自动亮灯", "人动"],
    params: [
      { key: "motionSensor", label: "人体传感器", type: "deviceSelect", deviceType: "sensor", required: true, defaultName: "客厅人体传感器" },
      { key: "targetLight", label: "灯", type: "deviceSelect", deviceType: "light", required: true, defaultName: "客厅灯" },
      { key: "duration", label: "延时关闭(秒)", type: "number", required: false, defaultValue: 0 },
    ],
    triggers: [
      { type: "device_status", entityId: "{{motionSensor}}", value: "pir", operator: "==", label: "人体传感器检测到移动" },
    ],
    actions: [
      { type: "device_control", entityId: "{{targetLight}}", value: { switch: true }, label: "开灯" },
    ],
  },
  {
    id: "template-no-person-off-ac",
    name: "无人自动关空调",
    description: "检测到房间无人时自动关闭空调",
    keywords: ["无人", "没人", "离开", "关空调", "省电", "人走", "空房", "自动关", "没人就关", "长时间无人"],
    params: [
      { key: "motionSensor", label: "人体传感器", type: "deviceSelect", deviceType: "sensor", required: true, defaultName: "客厅人体传感器" },
      { key: "acDevice", label: "空调", type: "deviceSelect", deviceType: "ac", required: true, defaultName: "客厅空调" },
      { key: "noPersonDuration", label: "无人时长(分钟)", type: "number", required: false, defaultValue: 30 },
    ],
    triggers: [
      { type: "device_status", entityId: "{{motionSensor}}", value: "no_person", operator: "==", label: "检测到无人" },
    ],
    conditions: [
      { type: "device_status", entityId: "{{motionSensor}}", value: "no_person", operator: "==", label: "无人状态持续{{noPersonDuration}}分钟" },
    ],
    actions: [
      { type: "device_control", entityId: "{{acDevice}}", value: { switch: false }, label: "关闭空调" },
    ],
  },
  {
    id: "template-morning-routine",
    name: "早安唤醒",
    description: "设定时间自动开启窗帘、灯光，播放早安音乐",
    keywords: ["起床", "早上", "早晨", "唤醒", "日出", "天亮", "起床模式", "早安", "窗帘", "音乐", "闹钟"],
    params: [
      { key: "curtain", label: "窗帘", type: "deviceSelect", deviceType: "curtain", required: true, defaultName: getFirstDefaultName("curtain") },
      { key: "light", label: "卧室灯", type: "deviceSelect", deviceType: "light", required: true, defaultName: getFirstDefaultName("light") },
      { key: "speaker", label: "音箱", type: "deviceSelect", deviceType: "speaker", required: true, defaultName: getFirstDefaultName("speaker") },
      { key: "wakeTime", label: "唤醒时间", type: "time", required: true, defaultValue: "07:00" },
      { key: "brightness", label: "灯光亮度(%)", type: "number", required: false, defaultValue: 80 },
    ],
    triggers: [
      { type: "timer", entityId: "", value: "{{wakeTime}}", operator: "==", label: "到达唤醒时间" },
    ],
    actions: [
      { type: "device_control", entityId: "{{curtain}}", value: { control: "open" }, label: "打开窗帘" },
      { type: "device_control", entityId: "{{light}}", value: { switch: true, bright_value: "{{brightness}}" }, label: "开启卧室灯" },
      { type: "device_control", entityId: "{{speaker}}", value: { play: "morning_music" }, label: "播放早安音乐" },
    ],
  },
  {
    id: "template-bathroom-auto",
    name: "卫生间自动灯",
    description: "检测到人体进入卫生间自动开灯，离开后延时关闭",
    keywords: ["卫生间", "厕所", "人体", "自动灯", "洗手间", "上厕所", "洗手", "如厕"],
    params: [
      { key: "pirSensor", label: "人体传感器", type: "deviceSelect", deviceType: "sensor", required: true, defaultName: getFirstDefaultName("sensor") },
      { key: "light", label: "卫生间灯", type: "deviceSelect", deviceType: "light", required: true, defaultName: getFirstDefaultName("light") },
      { key: "fan", label: "卫生间风扇", type: "deviceSelect", deviceType: "fan", required: false, defaultName: getFirstDefaultName("fan") },
      { key: "delayTime", label: "延时关闭时间(秒)", type: "number", required: false, defaultValue: 180 },
    ],
    triggers: [
      { type: "device_status", entityId: "{{pirSensor}}", value: "pir", operator: "==", label: "检测到人体" },
    ],
    actions: [
      { type: "device_control", entityId: "{{light}}", value: { switch: true }, label: "打开卫生间灯" },
      { type: "device_control", entityId: "{{fan}}", value: { switch: true }, label: "打开排气扇" },
      { type: "delay", entityId: "", value: "{{delayTime}}", label: "延时等待" },
      { type: "device_control", entityId: "{{light}}", value: { switch: false }, label: "关闭卫生间灯" },
      { type: "device_control", entityId: "{{fan}}", value: { switch: false }, label: "关闭排气扇" },
    ],
  },
  {
    id: "template-sleep-mode",
    name: "睡眠模式",
    description: "一键关闭所有灯光，拉上窗帘，开启安防",
    keywords: ["睡觉", "晚安", "入睡", "睡了", "关灯睡觉", "睡眠", "关灯", "窗帘", "安防"],
    params: [
      { key: "bedroomLight", label: "卧室灯", type: "deviceSelect", deviceType: "light", required: true, defaultName: getFirstDefaultName("light") },
      { key: "hallwayLight", label: "走廊灯", type: "deviceSelect", deviceType: "light", required: false, defaultName: getFirstDefaultName("light") },
      { key: "curtain", label: "卧室窗帘", type: "deviceSelect", deviceType: "curtain", required: true, defaultName: getFirstDefaultName("curtain") },
      { key: "camera", label: "摄像头", type: "deviceSelect", deviceType: "camera", required: false, defaultName: getFirstDefaultName("camera") },
    ],
    triggers: [
      { type: "manual", entityId: "", value: "", label: "手动触发" },
    ],
    actions: [
      { type: "device_control", entityId: "{{bedroomLight}}", value: { switch: false }, label: "关闭卧室灯" },
      { type: "device_control", entityId: "{{hallwayLight}}", value: { switch: false }, label: "关闭走廊灯" },
      { type: "device_control", entityId: "{{curtain}}", value: { control: "close" }, label: "拉上卧室窗帘" },
      { type: "device_control", entityId: "{{camera}}", value: { switch: true }, label: "开启摄像头监控" },
    ],
  },
  {
    id: "template-cooking-mode",
    name: "厨房烹饪模式",
    description: "打开厨房灯和抽油烟机，关闭客厅空调节省电力",
    keywords: ["厨房", "烹饪", "做饭", "抽油烟机", "炒菜", "煮饭", "煲汤", "油烟"],
    params: [
      { key: "kitchenLight", label: "厨房灯", type: "deviceSelect", deviceType: "light", required: true, defaultName: getFirstDefaultName("light") },
      { key: "rangeHood", label: "抽油烟机", type: "deviceSelect", deviceType: "fan", required: true, defaultName: getFirstDefaultName("fan") },
      { key: "livingAc", label: "客厅空调", type: "deviceSelect", deviceType: "ac", required: false, defaultName: getFirstDefaultName("ac") },
    ],
    triggers: [
      { type: "manual", entityId: "", value: "", label: "手动触发" },
    ],
    actions: [
      { type: "device_control", entityId: "{{kitchenLight}}", value: { switch: true }, label: "打开厨房灯" },
      { type: "device_control", entityId: "{{rangeHood}}", value: { switch: true }, label: "开启抽油烟机" },
      { type: "device_control", entityId: "{{livingAc}}", value: { switch: false }, label: "关闭客厅空调" },
    ],
  },
  {
    id: "template-smoke-detection",
    name: "烟雾报警联动",
    description: "检测到烟雾时，自动打开窗户、关闭燃气阀门、推送报警",
    keywords: ["烟雾", "报警", "火灾", "安全", "燃气", "窗户", "火警", "冒烟", "探测器"],
    params: [
      { key: "smokeSensor", label: "烟雾传感器", type: "deviceSelect", deviceType: "sensor", required: true, defaultName: getFirstDefaultName("sensor") },
      { key: "gasValve", label: "燃气阀门", type: "deviceSelect", deviceType: "switch", required: true, defaultName: getFirstDefaultName("switch") },
      { key: "windowCurtain", label: "窗户窗帘", type: "deviceSelect", deviceType: "curtain", required: false, defaultName: getFirstDefaultName("curtain") },
      { key: "speaker", label: "音箱", type: "deviceSelect", deviceType: "speaker", required: false, defaultName: getFirstDefaultName("speaker") },
    ],
    triggers: [
      { type: "device_status", entityId: "{{smokeSensor}}", value: "alarm", operator: "==", label: "烟雾传感器报警" },
    ],
    actions: [
      { type: "device_control", entityId: "{{gasValve}}", value: { switch: false }, label: "关闭燃气阀门" },
      { type: "device_control", entityId: "{{windowCurtain}}", value: { control: "open" }, label: "打开窗户" },
      { type: "device_control", entityId: "{{speaker}}", value: { play: "fire_alarm" }, label: "播放报警音" },
      { type: "notification", entityId: "", value: "检测到烟雾，请立即检查！", label: "推送报警通知" },
    ],
  },
  {
    id: "template-temperature-control",
    name: "温度自动调节",
    description: "根据温湿度传感器自动调节空调和加湿器",
    keywords: ["温度", "湿度", "空调", "加湿器", "太热", "太冷", "升温", "降温", "自动调节"],
    params: [
      { key: "tempSensor", label: "温湿度传感器", type: "deviceSelect", deviceType: "sensor", required: true, defaultName: getFirstDefaultName("sensor") },
      { key: "ac", label: "空调", type: "deviceSelect", deviceType: "ac", required: true, defaultName: getFirstDefaultName("ac") },
      { key: "humidifier", label: "加湿器", type: "deviceSelect", deviceType: "switch", required: false, defaultName: getFirstDefaultName("switch") },
      { key: "tempThreshold", label: "温度阈值(℃)", type: "number", required: true, defaultValue: 26 },
      { key: "humidityThreshold", label: "湿度阈值(%)", type: "number", required: false, defaultValue: 40 },
    ],
    triggers: [
      { type: "device_status", entityId: "{{tempSensor}}", value: "{{tempThreshold}}", operator: ">", label: "温度超过阈值" },
    ],
    conditions: [
      { type: "device_status", entityId: "{{tempSensor}}", value: "{{humidityThreshold}}", operator: "<", label: "湿度低于阈值" },
    ],
    actions: [
      { type: "device_control", entityId: "{{ac}}", value: { switch: true, temp: "{{tempThreshold}}" }, label: "开启空调" },
      { type: "device_control", entityId: "{{humidifier}}", value: { switch: true }, label: "开启加湿器" },
    ],
  },
  {
    id: "template-pet-home-alone",
    name: "宠物独处模式",
    description: "离家后自动开启宠物喂食器、摄像头和空气净化器",
    keywords: ["宠物", "喂食", "独处", "摄像头", "净化器", "猫狗", "自动喂食", "宠物监控"],
    params: [
      { key: "feeder", label: "喂食器", type: "deviceSelect", deviceType: "switch", required: true, defaultName: getFirstDefaultName("switch") },
      { key: "camera", label: "宠物摄像头", type: "deviceSelect", deviceType: "camera", required: true, defaultName: getFirstDefaultName("camera") },
      { key: "purifier", label: "空气净化器", type: "deviceSelect", deviceType: "purifier", required: false, defaultName: getFirstDefaultName("purifier") },
      { key: "feedTime", label: "喂食时间", type: "time", required: true, defaultValue: "12:00" },
    ],
    triggers: [
      { type: "timer", entityId: "", value: "{{feedTime}}", operator: "==", label: "到达喂食时间" },
    ],
    actions: [
      { type: "device_control", entityId: "{{feeder}}", value: { feed: true }, label: "启动喂食器" },
      { type: "device_control", entityId: "{{camera}}", value: { switch: true }, label: "开启宠物摄像头" },
      { type: "device_control", entityId: "{{purifier}}", value: { switch: true }, label: "开启空气净化器" },
    ],
  },
  {
    id: "template-rain-close-window",
    name: "下雨自动关窗",
    description: "检测到下雨时自动关闭窗户和窗帘",
    keywords: ["下雨", "天气", "窗户", "窗帘", "雨水", "淋湿", "自动关窗", "雨天"],
    params: [
      { key: "rainSensor", label: "雨水传感器", type: "deviceSelect", deviceType: "sensor", required: true, defaultName: getFirstDefaultName("sensor") },
      { key: "windowCurtain", label: "窗户窗帘", type: "deviceSelect", deviceType: "curtain", required: true, defaultName: getFirstDefaultName("curtain") },
    ],
    triggers: [
      { type: "device_status", entityId: "{{rainSensor}}", value: "rain", operator: "==", label: "检测到下雨" },
    ],
    actions: [
      { type: "device_control", entityId: "{{windowCurtain}}", value: { control: "close" }, label: "关闭窗户" },
    ],
  },
  {
    id: "template-heater-auto",
    name: "冬季自动取暖",
    description: "温度低于设定值时自动开启取暖器",
    keywords: ["取暖", "冬天", "温度", "暖气", "制热", "寒冷", "天冷", "暖气"],
    params: [
      { key: "tempSensor", label: "温度传感器", type: "deviceSelect", deviceType: "sensor", required: true, defaultName: getFirstDefaultName("sensor") },
      { key: "heater", label: "取暖器", type: "deviceSelect", deviceType: "heater", required: true, defaultName: getFirstDefaultName("heater") },
      { key: "tempThreshold", label: "温度阈值(℃)", type: "number", required: true, defaultValue: 18 },
    ],
    triggers: [
      { type: "device_status", entityId: "{{tempSensor}}", value: "{{tempThreshold}}", operator: "<", label: "温度低于阈值" },
    ],
    actions: [
      { type: "device_control", entityId: "{{heater}}", value: { switch: true }, label: "开启取暖器" },
    ],
  },
  {
    id: "template-robot-clean",
    name: "定时扫地机器人",
    description: "设定时间自动启动扫地机器人进行清洁",
    keywords: ["扫地", "清洁", "机器人", "定时", "打扫", "拖地", "吸尘", "自动清洁"],
    params: [
      { key: "robot", label: "扫地机器人", type: "deviceSelect", deviceType: "robot", required: true, defaultName: getFirstDefaultName("robot") },
      { key: "cleanTime", label: "清洁时间", type: "time", required: true, defaultValue: "09:00" },
    ],
    triggers: [
      { type: "timer", entityId: "", value: "{{cleanTime}}", operator: "==", label: "到达清洁时间" },
    ],
    actions: [
      { type: "device_control", entityId: "{{robot}}", value: { start: true }, label: "启动扫地机器人" },
    ],
  },
  {
    id: "template-dinner-mode",
    name: "晚餐模式",
    description: "开启餐厅灯光和音乐，营造用餐氛围",
    keywords: ["晚餐", "吃饭", "餐厅", "灯光", "音乐", "用餐", "美食", "烛光"],
    params: [
      { key: "diningLight", label: "餐厅灯", type: "deviceSelect", deviceType: "light", required: true, defaultName: getFirstDefaultName("light") },
      { key: "speaker", label: "音箱", type: "deviceSelect", deviceType: "speaker", required: true, defaultName: getFirstDefaultName("speaker") },
      { key: "brightness", label: "灯光亮度(%)", type: "number", required: false, defaultValue: 60 },
    ],
    triggers: [
      { type: "manual", entityId: "", value: "", label: "手动触发" },
    ],
    actions: [
      { type: "device_control", entityId: "{{diningLight}}", value: { switch: true, bright_value: "{{brightness}}" }, label: "开启餐厅灯光" },
      { type: "device_control", entityId: "{{speaker}}", value: { play: "dinner_music" }, label: "播放用餐音乐" },
    ],
  },
  {
    id: "template-working-mode",
    name: "工作模式",
    description: "开启书房灯和风扇，关闭客厅娱乐设备",
    keywords: ["工作", "学习", "书房", "专注", "办公", "写代码", "阅读", "做作业"],
    params: [
      { key: "studyLight", label: "书房灯", type: "deviceSelect", deviceType: "light", required: true, defaultName: getFirstDefaultName("light") },
      { key: "fan", label: "风扇", type: "deviceSelect", deviceType: "fan", required: false, defaultName: getFirstDefaultName("fan") },
      { key: "tv", label: "客厅电视", type: "deviceSelect", deviceType: "tv", required: false, defaultName: getFirstDefaultName("tv") },
      { key: "speaker", label: "客厅音箱", type: "deviceSelect", deviceType: "speaker", required: false, defaultName: getFirstDefaultName("speaker") },
    ],
    triggers: [
      { type: "manual", entityId: "", value: "", label: "手动触发" },
    ],
    actions: [
      { type: "device_control", entityId: "{{studyLight}}", value: { switch: true }, label: "开启书房灯" },
      { type: "device_control", entityId: "{{fan}}", value: { switch: true }, label: "开启风扇" },
      { type: "device_control", entityId: "{{tv}}", value: { switch: false }, label: "关闭电视" },
      { type: "device_control", entityId: "{{speaker}}", value: { switch: false }, label: "关闭音箱" },
    ],
  },
  {
    id: "template-guest-mode",
    name: "迎宾模式",
    description: "客人到访时自动开启客厅灯光和音乐",
    keywords: ["客人", "迎宾", "到访", "门铃", "开门", "访客", "朋友来了", "迎接"],
    params: [
      { key: "doorSensor", label: "门磁传感器", type: "deviceSelect", deviceType: "sensor", required: true, defaultName: getFirstDefaultName("sensor") },
      { key: "livingLight", label: "客厅灯", type: "deviceSelect", deviceType: "light", required: true, defaultName: getFirstDefaultName("light") },
      { key: "speaker", label: "音箱", type: "deviceSelect", deviceType: "speaker", required: false, defaultName: getFirstDefaultName("speaker") },
    ],
    triggers: [
      { type: "device_status", entityId: "{{doorSensor}}", value: "open", operator: "==", label: "门被打开" },
    ],
    actions: [
      { type: "device_control", entityId: "{{livingLight}}", value: { switch: true }, label: "开启客厅灯光" },
      { type: "device_control", entityId: "{{speaker}}", value: { play: "welcome" }, label: "播放欢迎音乐" },
    ],
  },
  {
    id: "template-power-saving",
    name: "节能模式",
    description: "无人时自动关闭非必要设备电源",
    keywords: ["节能", "省电", "无人", "自动断电", "环保", "省钱", "节约", "绿色"],
    params: [
      { key: "pirSensor", label: "人体传感器", type: "deviceSelect", deviceType: "sensor", required: true, defaultName: getFirstDefaultName("sensor") },
      { key: "lights", label: "房间灯光", type: "deviceSelect", deviceType: "light", required: true, defaultName: getFirstDefaultName("light") },
      { key: "switch", label: "插座", type: "deviceSelect", deviceType: "switch", required: false, defaultName: getFirstDefaultName("switch") },
    ],
    triggers: [
      { type: "device_status", entityId: "{{pirSensor}}", value: "no_pir", operator: "==", label: "长时间无人" },
    ],
    actions: [
      { type: "device_control", entityId: "{{lights}}", value: { switch: false }, label: "关闭灯光" },
      { type: "device_control", entityId: "{{switch}}", value: { switch: false }, label: "关闭插座电源" },
    ],
  },
  {
    id: "template-baby-monitor",
    name: "婴儿监护模式",
    description: "监控婴儿房温湿度，异常时推送通知",
    keywords: ["婴儿", "监护", "监控", "温湿度", "报警", "宝宝", "育婴", "新生儿"],
    params: [
      { key: "tempSensor", label: "温湿度传感器", type: "deviceSelect", deviceType: "sensor", required: true, defaultName: getFirstDefaultName("sensor") },
      { key: "camera", label: "婴儿房摄像头", type: "deviceSelect", deviceType: "camera", required: true, defaultName: getFirstDefaultName("camera") },
      { key: "ac", label: "婴儿房空调", type: "deviceSelect", deviceType: "ac", required: false, defaultName: getFirstDefaultName("ac") },
      { key: "tempMin", label: "最低温度(℃)", type: "number", required: true, defaultValue: 22 },
      { key: "tempMax", label: "最高温度(℃)", type: "number", required: true, defaultValue: 28 },
    ],
    triggers: [
      { type: "device_status", entityId: "{{tempSensor}}", value: "{{tempMin}}", operator: "<", label: "温度过低" },
    ],
    conditions: [
      { type: "device_status", entityId: "{{tempSensor}}", value: "{{tempMax}}", operator: ">", label: "温度过高" },
    ],
    actions: [
      { type: "device_control", entityId: "{{camera}}", value: { switch: true }, label: "开启摄像头" },
      { type: "device_control", entityId: "{{ac}}", value: { switch: true }, label: "调节空调" },
      { type: "notification", entityId: "", value: "婴儿房温度异常，请检查！", label: "推送通知" },
    ],
  },
]

export function getTemplatesByKeyword(
  templates: SceneTemplate[],
  keyword: string
): SceneTemplate[] {
  if (!keyword.trim()) return templates
  const lower = keyword.toLowerCase()
  return templates.filter((t) =>
    t.keywords.some((k) => k.toLowerCase().includes(lower)) ||
    t.name.toLowerCase().includes(lower) ||
    t.description.toLowerCase().includes(lower)
  )
}
