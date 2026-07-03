# 虚实一体仿真系统 - API 文档

## 概述

本文档描述了虚实一体仿真系统的 REST API 和 WebSocket 接口，用于与虚拟仿真软件和真实硬件设备进行数据交互。

## 基础信息

- **REST API Base URL**: `http://localhost:3000/api/v1`
- **WebSocket URL**: `ws://localhost:8081`
- **Content-Type**: `application/json`

---

## REST API

### 设备管理

#### 获取所有设备
```http
GET /api/v1/devices
```

**响应示例**:
```json
{
  "success": true,
  "data": [
    {
      "id": "plc_1",
      "name": "主PLC",
      "type": "plc",
      "protocol": "modbus_tcp",
      "status": "connected",
      "connected": true,
      "lastSeen": 1704067200000
    }
  ],
  "total": 1
}
```

#### 注册新设备
```http
POST /api/v1/devices
```

**请求体**:
```json
{
  "id": "plc_1",
  "name": "主PLC",
  "type": "plc",
  "protocol": "modbus_tcp",
  "config": {
    "host": "192.168.1.100",
    "port": 502,
    "unitId": 1
  }
}
```

#### 连接设备
```http
POST /api/v1/devices/{id}/connect
```

#### 断开设备
```http
POST /api/v1/devices/{id}/disconnect
```

#### 读取设备数据
```http
GET /api/v1/devices/{id}/data?address=0&count=10&type=holding
```

**参数说明**:
- `address`: 起始地址
- `count`: 读取数量
- `type`: 数据类型 (`coil`, `input`, `holding`, `input_register`)

#### 写入设备数据
```http
POST /api/v1/devices/{id}/data
```

**请求体**:
```json
{
  "address": 10,
  "value": 123,
  "type": "register"
}
```

#### 启动轮询
```http
POST /api/v1/devices/{id}/poll
```

**请求体**:
```json
{
  "registerType": "holding",
  "startAddress": 0,
  "count": 10,
  "interval": 100
}
```

#### 停止轮询
```http
POST /api/v1/devices/{id}/stop-poll
```

---

### 虚实同步

#### 获取同步状态
```http
GET /api/v1/sync/status
```

#### 启动同步引擎
```http
POST /api/v1/sync/start
```

#### 停止同步引擎
```http
POST /api/v1/sync/stop
```

#### 注册数据通道
```http
POST /api/v1/sync/channels
```

**请求体**:
```json
{
  "id": "robot1_position_x",
  "name": "机器人1 X轴位置",
  "virtualAddress": "virtual://robot1/position/x",
  "realAddress": "real://robot1/position/x",
  "dataType": "number",
  "bidirectional": true,
  "syncDirection": "both"
}
```

#### 发布虚拟数据
```http
POST /api/v1/sync/virtual-data
```

**请求体**:
```json
{
  "id": "robot1_position_x",
  "deviceId": "robot_1",
  "name": "机器人1 X轴位置",
  "value": 150.5,
  "unit": "mm"
}
```

#### 发布真实数据
```http
POST /api/v1/sync/real-data
```

#### 获取数据点
```http
GET /api/v1/sync/data-points?deviceId=robot_1
```

---

### 故障注入

#### 获取故障库
```http
GET /api/v1/sync/fault-library
```

#### 注入故障
```http
POST /api/v1/sync/faults
```

**请求体**:
```json
{
  "faultId": "F001"
}
```

#### 获取激活的故障
```http
GET /api/v1/sync/faults
```

#### 清除故障
```http
DELETE /api/v1/sync/faults/{id}
```

---

## WebSocket 接口

### 连接
```javascript
const ws = new WebSocket('ws://localhost:8081');
```

### 消息类型

#### 客户端 → 服务器

**订阅数据点**:
```json
{
  "type": "subscribe",
  "dataPoints": ["robot1_position_x", "sensor_1"]
}
```

**取消订阅**:
```json
{
  "type": "unsubscribe",
  "dataPoints": ["sensor_1"]
}
```

**心跳**:
```json
{
  "type": "ping"
}
```

**获取状态**:
```json
{
  "type": "getStatus"
}
```

#### 服务器 → 客户端

**连接确认**:
```json
{
  "type": "connected",
  "data": {
    "clientId": "client_1234567890",
    "serverTime": 1704067200000,
    "message": "已连接到虚实一体仿真系统"
  }
}
```

**实时数据**:
```json
{
  "type": "data",
  "data": {
    "id": "robot1_position_x",
    "deviceId": "robot_1",
    "name": "机器人1 X轴位置",
    "value": 150.5,
    "unit": "mm",
    "timestamp": 1704067200000,
    "quality": "good",
    "source": "real"
  }
}
```

**同步事件**:
```json
{
  "type": "virtualToReal",
  "data": {
    "id": "robot1_position_x",
    "value": 150.5,
    "timestamp": 1704067200000
  }
}
```

**故障事件**:
```json
{
  "type": "faultInjected",
  "data": {
    "id": "F001_1704067200000",
    "definition": {
      "id": "F001",
      "name": "机器人电机故障",
      "severity": "critical"
    },
    "startTime": 1704067200000,
    "active": true
  }
}
```

---

## 错误处理

### 错误响应格式
```json
{
  "success": false,
  "error": "错误描述",
  "message": "详细错误信息"
}
```

### HTTP 状态码
- `200`: 成功
- `201`: 创建成功
- `400`: 请求参数错误
- `404`: 资源不存在
- `500`: 服务器内部错误

---

## 数据类型定义

### DataPoint
```typescript
interface DataPoint {
  id: string;           // 数据点唯一标识
  deviceId: string;     // 设备ID
  name: string;         // 数据点名称
  value: number | boolean | string;  // 值
  unit?: string;        // 单位
  timestamp: number;    // 时间戳
  quality: 'good' | 'bad' | 'uncertain';  // 数据质量
  source: 'virtual' | 'real';  // 数据来源
}
```

### DataChannelConfig
```typescript
interface DataChannelConfig {
  id: string;           // 通道ID
  name: string;         // 通道名称
  virtualAddress: string;   // 虚拟端地址
  realAddress: string;      // 真实端地址
  dataType: 'number' | 'boolean' | 'string';  // 数据类型
  scale?: number;       // 缩放系数
  offset?: number;      // 偏移量
  bidirectional: boolean;   // 是否双向
  syncDirection: 'v2r' | 'r2v' | 'both';  // 同步方向
}
```

---

## 使用示例

### 完整流程示例

```typescript
import axios from 'axios';
import WebSocket from 'ws';

// 1. 注册设备
await axios.post('http://localhost:3000/api/v1/devices', {
  id: 'plc_1',
  name: '主PLC',
  protocol: 'modbus_tcp',
  config: { host: '192.168.1.100', port: 502 }
});

// 2. 连接设备
await axios.post('http://localhost:3000/api/v1/devices/plc_1/connect');

// 3. 启动同步引擎
await axios.post('http://localhost:3000/api/v1/sync/start');

// 4. 注册数据通道
await axios.post('http://localhost:3000/api/v1/sync/channels', {
  id: 'motor_speed',
  virtualAddress: 'virtual://motor/speed',
  realAddress: 'real://motor/speed',
  syncDirection: 'both'
});

// 5. 连接 WebSocket 接收实时数据
const ws = new WebSocket('ws://localhost:8081');
ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('实时数据:', message);
});

// 6. 发布虚拟数据
await axios.post('http://localhost:3000/api/v1/sync/virtual-data', {
  id: 'motor_speed',
  deviceId: 'motor_1',
  value: 1500
});
```
