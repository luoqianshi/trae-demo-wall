# Coin Kids - 家庭儿童管理系统

基于 M5Stack CoreS3 设备的儿童习惯养成系统，支持起床打卡、数学题作答、睡眠检测等功能。

## 项目结构

```
coin-kids/
├── backend/                    # Go 后端 API 服务
│   ├── cmd/server/main.go      # 入口
│   ├── internal/
│   │   ├── model/              # 数据模型
│   │   ├── repository/         # 数据库操作层
│   │   ├── service/            # 业务逻辑层
│   │   ├── handler/            # HTTP API Handler
│   │   └── testutil/           # 测试工具
│   └── go.mod
├── frontend/                   # React + TypeScript 管理页面
│   ├── src/
│   │   ├── api/client.ts       # API 客户端
│   │   ├── components/         # 公共组件
│   │   └── pages/              # 页面组件
│   └── package.json
├── esp32/
│   └── cores3/main.py          # CoreS3 统一固件
└── README.md
```

## 启动方式

### 前置要求

- Go 1.21+
- Node.js 18+
- SQLite（Go 内置驱动）

### 1. 启动后端

```bash
cd backend
go run cmd/server/main.go
```

后端运行在 `http://localhost:8080`，API 路径前缀为 `/api/v1`。

### 2. 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端运行在 `http://localhost:5173`，开发模式自动代理 API 请求到后端。

### 3. 运行测试

```bash
# 后端测试
cd backend && go test ./... -v -count=1

# 前端测试
cd frontend && npx vitest run
```

## API 端点

| 资源 | 方法 | 路径 |
|------|------|------|
| Children | GET/POST | `/api/v1/children` |
| Children | GET/PUT/DELETE | `/api/v1/children/:id` |
| Schedules | GET | `/api/v1/schedules?child_id=&date=` |
| Schedules | GET | `/api/v1/schedules/date?date=` |
| Schedules | POST/PUT/DELETE | `/api/v1/schedules[/:id]` |
| Schedules | POST | `/api/v1/schedules/generate` |
| Schedule Templates | GET/POST | `/api/v1/schedule-templates` |
| Schedule Templates | PUT/DELETE | `/api/v1/schedule-templates/:id` |
| Allowance | GET | `/api/v1/allowance/:child_id` |
| Allowance Transactions | GET | `/api/v1/allowance/:child_id/transactions` |
| Allowance Spend | POST | `/api/v1/allowance/:child_id/spend` |
| Reward Rules | GET/POST | `/api/v1/reward-rules` |
| Reward Rules | PUT/DELETE | `/api/v1/reward-rules/:id` |
| Reward Records | GET/POST | `/api/v1/reward-records` |
| Reward Records | PUT/DELETE | `/api/v1/reward-records/:id` |
| Clock-in | POST | `/api/v1/clock-in` |
| Clock-in Confirm/Reject | POST | `/api/v1/clock-in/:id/confirm\|reject` |
| Clock-in ListByChild | GET | `/api/v1/clock-in/child/:child_id` |
| Clock-in ListByDevice | GET | `/api/v1/clock-in/device` |
| Devices | GET/POST | `/api/v1/devices` |
| Devices | PUT/DELETE | `/api/v1/devices/:id` |
| RFID Bindings | GET/POST | `/api/v1/rfid-bindings` |
| RFID Bindings | PUT/DELETE | `/api/v1/rfid-bindings/:id` |
| Sleep Config | GET/PUT | `/api/v1/devices/:device_id/sleep-config` |
| Device Logs | GET | `/api/v1/device-logs` |
| Device Command | POST | `/api/v1/devices/:id/command` |
| Stats | GET | `/api/v1/stats?child_id=` |

## 管理页面

| 页面 | 路由 | 功能 |
|------|------|------|
| 孩子管理 | `/children` | 增删改查 |
| 作息管理 | `/schedules` | 每日作息 CRUD + 模板管理 + 一键生成 |
| 零花钱 | `/allowance` | 余额查询 + 交易记录 + 消费扣款 |
| 奖惩规则 | `/rewards` | 规则/记录增删改查，自动更新零花钱 |
| 打卡记录 | `/clock-in` | 设备打卡记录 + 确认/拒绝 |
| 设备管理 | `/devices` | 设备/RFID CRUD + 睡眠配置 + 指令下发 |
| 统计看板 | `/stats` | 打卡统计 + 连续天数 + 历史记录 |

## ESP32 固件

支持 M5Stack CoreS3 设备，使用 UIFlow2/MicroPython。

### 功能模式

- **RFID模式**: 刷卡 → 显示孩子姓名 → 本地生成数学题 → 作答 → 上报结果
- **无RFID模式**: 从机模式，等待 MQTT 指令进入答题
- **答题逻辑**: 设备端生成三个两位数的四则运算题，最多 5 次重试机会
- **睡眠检测**: 指定时间段内检测环境声音，超阈值时报警提醒
- **阈值校准**: MQTT 指令进入校准模式，实时显示音量并允许调整阈值
- **RFID录入**: MQTT 指令进入录入模式，依次刷卡录入

### MQTT 话题

```
发布: coin-kids/device/{id}/rfid       → RFID刷卡
发布: coin-kids/device/{id}/result     → 答题结果
发布: coin-kids/device/{id}/sound      → 声音检测
发布: coin-kids/device/{id}/enroll     → RFID录入
订阅: coin-kids/device/{id}/child_info → 孩子信息
订阅: coin-kids/device/{id}/command    → 指令 (wake/sleep/reset/enroll/calibrate/stop_calibrate)
订阅: coin-kids/device/{id}/sleep-config → 睡眠配置
订阅: coin-kids/device/{id}/error      → 错误消息
```

### 配置文件 (config.json)

```json
{
  "device_id": "cores3-01",
  "mqtt_broker": "broker.emqx.io",
  "wifi_ssid": "...",
  "wifi_password": "...",
  "sleep_timeout_sec": 30,
  "wake_up": {
    "max_attempts": 5,
    "start_time": "06:00",
    "end_time": "08:00"
  },
  "rfid": {
    "enabled": true,
    "i2c_scl": 1,
    "i2c_sda": 2,
    "i2c_addr": 40
  },
  "sleep_check": {
    "start_time": "22:00",
    "end_time": "22:30",
    "reminder_1_min": 20,
    "reminder_2_min": 10,
    "sound_threshold": 500,
    "is_enabled": true
  }
}
```

## 数据库

使用 SQLite，数据库文件位于 `backend/coin-kids.db`（自动创建）。