# 秒达定位系统 - API接口规范 v1.0

## 一、概述

### 1.1 文档目的

本文档定义秒达定位系统的标准API接口规范，包括紧急位置上报、位置查询、状态同步等核心接口，供终端SDK、第三方系统、应急指挥中心对接使用。

### 1.2 基础信息

| 项目 | 说明 |
|------|------|
| 协议 | HTTPS（强制TLS 1.2及以上） |
| 数据格式 | JSON (UTF-8) |
| 接口前缀 | `https://api.miaoda.gov.cn/v1` |
| 字符编码 | UTF-8 |
| 时间格式 | ISO 8601 (`2026-06-27T10:30:00+08:00`) |
| 时区 | 东八区（UTC+8） |

### 1.3 接口分类

| 接口类别 | 说明 | 优先级 |
|---------|------|-------|
| 紧急位置上报 | 终端拨打紧急电话时上报位置 | P0 |
| 位置查询 | 接警端查询报警人位置 | P0 |
| 通话状态同步 | 通话状态变更同步 | P1 |
| 历史记录 | 历史报警位置查询 | P2 |
| 统计分析 | 数据统计与报表 | P3 |
| 系统管理 | 配置、权限、日志 | P4 |

---

## 二、通用规范

### 2.1 请求头规范

所有请求必须包含以下HTTP头：

```http
Content-Type: application/json; charset=utf-8
X-App-Key: {应用标识}
X-Timestamp: {时间戳，秒级}
X-Nonce: {随机字符串，32位}
X-Signature: {请求签名}
X-Device-Id: {设备唯一标识，可选}
X-Request-Id: {请求追踪ID，可选}
```

**请求头说明：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| Content-Type | string | 是 | 固定为 application/json |
| X-App-Key | string | 是 | 接入方应用标识，由平台分配 |
| X-Timestamp | long | 是 | Unix时间戳（秒），允许偏差±300秒 |
| X-Nonce | string | 是 | 32位随机字符串，5分钟内不可重复 |
| X-Signature | string | 是 | 请求签名，详见2.2节 |
| X-Device-Id | string | 否 | 设备唯一标识（IMEI/IDFA等哈希值） |
| X-Request-Id | string | 否 | 用于链路追踪的请求ID |

### 2.2 签名算法

**签名生成步骤：**

1. **构造待签名字符串**
   ```
   stringToSign = 
       HTTP_METHOD + "\n" +
       PATH + "\n" +
       TIMESTAMP + "\n" +
       NONCE + "\n" +
       BODY_HASH
   ```

2. **计算Body哈希**
   ```
   BODY_HASH = SHA256(请求体原始字符串).toHexString().toLowerCase()
   ```
   GET请求Body为空时，BODY_HASH = SHA256("").toHexString().toLowerCase()

3. **计算签名**
   ```
   signature = HMAC-SHA256(secretKey, stringToSign).toHexString().toLowerCase()
   ```

**示例（JavaScript）：**
```javascript
const crypto = require('crypto');

function generateSignature(method, path, timestamp, nonce, body, secretKey) {
    const bodyHash = crypto.createHash('sha256')
        .update(body || '')
        .digest('hex')
        .toLowerCase();
    
    const stringToSign = [
        method.toUpperCase(),
        path,
        timestamp,
        nonce,
        bodyHash
    ].join('\n');
    
    return crypto.createHmac('sha256', secretKey)
        .update(stringToSign)
        .digest('hex')
        .toLowerCase();
}
```

### 2.3 统一响应格式

**成功响应：**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        // 具体业务数据
    },
    "request_id": "req_20260627_103000_abc123",
    "timestamp": 1751005800
}
```

**错误响应：**
```json
{
    "code": 40001,
    "message": "参数错误",
    "data": null,
    "details": {
        "field": "location",
        "reason": "坐标格式不正确"
    },
    "request_id": "req_20260627_103000_abc123",
    "timestamp": 1751005800
}
```

**响应字段说明：**

| 字段 | 类型 | 说明 |
|------|------|------|
| code | int | 状态码，0表示成功，非0表示错误 |
| message | string | 状态描述 |
| data | object | 业务数据，失败时为null |
| details | object | 错误详情，成功时不返回 |
| request_id | string | 请求唯一标识，用于问题排查 |
| timestamp | long | 响应时间戳 |

### 2.4 状态码规范

| 状态码 | 类别 | 说明 | HTTP状态码 |
|--------|------|------|-----------|
| 0 | 成功 | 请求成功 | 200 |
| 10000-19999 | 系统级 | 系统相关错误 | 5xx |
| 20000-29999 | 认证鉴权 | 认证、授权相关 | 401/403 |
| 30000-39999 | 参数校验 | 参数校验失败 | 400 |
| 40000-49999 | 业务逻辑 | 业务处理错误 | 200/400 |
| 50000-59999 | 限流降级 | 限流、熔断相关 | 429 |

**常见错误码：**

| 错误码 | 说明 | 建议处理 |
|--------|------|---------|
| 0 | 成功 | - |
| 10001 | 系统内部错误 | 稍后重试 |
| 10002 | 服务暂不可用 | 稍后重试，或走降级方案 |
| 10003 | 系统维护中 | 联系管理员 |
| 20001 | AppKey无效 | 检查AppKey是否正确 |
| 20002 | 签名验证失败 | 检查签名算法 |
| 20003 | 时间戳偏差过大 | 校准系统时间 |
| 20004 | Nonce重复 | 重新生成随机数 |
| 20005 | Token已过期 | 重新获取Token |
| 20006 | 权限不足 | 申请对应接口权限 |
| 30001 | 必填参数缺失 | 检查请求参数 |
| 30002 | 参数格式错误 | 检查参数格式 |
| 30003 | 参数值超出范围 | 检查参数取值范围 |
| 40001 | 报警记录不存在 | 检查报警ID |
| 40002 | 位置信息不存在 | 等待位置上报 |
| 50001 | 请求过于频繁 | 降低请求频率 |
| 50002 | IP被限制 | 联系管理员解封 |
| 50003 | 服务降级中 | 核心接口可用，非核心接口暂停 |

### 2.5 分页规范

列表类接口统一使用以下分页参数：

**请求参数：**
```json
{
    "page": 1,
    "page_size": 20
}
```

**响应数据：**
```json
{
    "code": 0,
    "data": {
        "list": [],
        "total": 100,
        "page": 1,
        "page_size": 20,
        "total_pages": 5
    }
}
```

### 2.6 坐标规范

**坐标系：** GCJ-02（国测局坐标系，火星坐标）

**格式：**
```json
{
    "location": {
        "latitude": 39.9087,
        "longitude": 116.3975,
        "accuracy": 25.5
    }
}
```

**字段说明：**

| 字段 | 类型 | 范围 | 说明 |
|------|------|------|------|
| latitude | double | -90 ~ 90 | 纬度，度，6位小数 |
| longitude | double | -180 ~ 180 | 经度，度，6位小数 |
| accuracy | double | >= 0 | 定位精度，米，1位小数 |

---

## 三、核心接口详情

### 3.1 紧急位置上报

> **接口说明**：终端SDK在检测到用户拨打紧急电话时，自动调用此接口上报位置信息。
> 
> **接口地址**：`POST /emergency/location/report`
> 
> **优先级**：P0（最高）
> 
> **限流策略**：单设备 1次/分钟，攻击时 3次/小时

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| call_session_id | string | 是 | 通话会话ID，32位UUID |
| emergency_type | string | 是 | 紧急类型：police(110)/fire(119)/medical(120)/other |
| caller_number | string | 是 | 主叫号码（脱敏处理，如138****8888） |
| caller_number_hash | string | 是 | 主叫号码SHA256哈希值，用于匹配 |
| callee_number | string | 是 | 被叫号码（110/119/120等） |
| device_id | string | 是 | 设备唯一标识（哈希值） |
| device_type | string | 是 | 设备类型：android/ios/other |
| os_version | string | 否 | 系统版本 |
| sdk_version | string | 是 | SDK版本号 |
| location | object | 是 | 位置信息对象 |
| location.latitude | double | 是 | 纬度 |
| location.longitude | double | 是 | 经度 |
| location.accuracy | double | 是 | 定位精度（米） |
| location.provider | string | 是 | 定位方式：gps/network/wifi/fused |
| location.timestamp | long | 是 | 定位时间戳 |
| altitude | double | 否 | 海拔高度（米） |
| bearing | double | 否 | 方向角度（0-360） |
| speed | double | 否 | 速度（米/秒） |
| network_type | string | 否 | 网络类型：5g/4g/3g/2g/wifi |
| carrier | string | 否 | 运营商：cmcc/ctcc/cucc/other |
| battery_level | int | 否 | 电池电量百分比 |
| extra_info | object | 否 | 扩展信息 |

**请求示例：**
```json
{
    "call_session_id": "550e8400-e29b-41d4-a716-446655440000",
    "emergency_type": "police",
    "caller_number": "138****8888",
    "caller_number_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "callee_number": "110",
    "device_id": "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8",
    "device_type": "android",
    "os_version": "Android 14",
    "sdk_version": "2.1.0",
    "location": {
        "latitude": 39.9087,
        "longitude": 116.3975,
        "accuracy": 25.5,
        "provider": "fused",
        "timestamp": 1751005800
    },
    "altitude": 45.2,
    "bearing": 135.5,
    "speed": 0.0,
    "network_type": "5g",
    "carrier": "cmcc",
    "battery_level": 65,
    "extra_info": {
        "is_emergency_call": true,
        "screen_state": "on"
    }
}
```

**响应参数：**

| 字段 | 类型 | 说明 |
|------|------|------|
| report_id | string | 上报记录ID |
| received_at | long | 接收时间戳 |
| dispatch_status | string | 调度状态：pending/dispatched/failed |
| estimated_arrival_seconds | int | 预计送达接警席时间（秒） |

**响应示例：**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "report_id": "rep_20260627103000_abc123",
        "received_at": 1751005800,
        "dispatch_status": "dispatched",
        "estimated_arrival_seconds": 2
    },
    "request_id": "req_20260627_103000_abc123",
    "timestamp": 1751005800
}
```

---

### 3.2 位置查询（接警端）

> **接口说明**：接警席通过报警手机号查询实时位置信息。
> 
> **接口地址**：`GET /emergency/location/query`
> 
> **优先级**：P0
> 
> **限流策略**：单用户 100次/分钟，攻击时 30次/分钟

**请求参数（Query）：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| call_session_id | string | 否* | 通话会话ID（优先使用） |
| caller_number_hash | string | 否* | 主叫号码SHA256哈希 |
| caller_number | string | 否* | 明文手机号（需特殊权限） |
| report_id | string | 否 | 上报记录ID |

> *注：call_session_id / caller_number_hash / caller_number 三选一，优先级依次递减

**请求示例：**
```
GET /v1/emergency/location/query?caller_number_hash=e3b0c442...
```

**响应参数：**

| 字段 | 类型 | 说明 |
|------|------|------|
| call_session_id | string | 通话会话ID |
| emergency_type | string | 紧急类型 |
| caller_number | string | 主叫号码（脱敏） |
| status | string | 通话状态：calling/connected/ended |
| location | object | 最新位置信息 |
| location.latitude | double | 纬度 |
| location.longitude | double | 经度 |
| location.accuracy | double | 精度（米） |
| location.provider | string | 定位方式 |
| location.timestamp | long | 定位时间 |
| address | string | 逆地理编码地址 |
| first_report_at | long | 首次上报时间 |
| last_report_at | long | 最后上报时间 |
| report_count | int | 累计上报次数 |
| device_info | object | 设备信息摘要 |

**响应示例：**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "call_session_id": "550e8400-e29b-41d4-a716-446655440000",
        "emergency_type": "police",
        "caller_number": "138****8888",
        "status": "connected",
        "location": {
            "latitude": 39.9087,
            "longitude": 116.3975,
            "accuracy": 25.5,
            "provider": "fused",
            "timestamp": 1751005805
        },
        "address": "北京市东城区东长安街天安门广场",
        "first_report_at": 1751005795,
        "last_report_at": 1751005805,
        "report_count": 3,
        "device_info": {
            "device_type": "android",
            "network_type": "5g",
            "battery_level": 64
        }
    },
    "request_id": "req_20260627_103005_def456",
    "timestamp": 1751005805
}
```

---

### 3.3 通话状态同步

> **接口说明**：运营商/交换机侧同步通话状态变更。
> 
> **接口地址**：`POST /emergency/call/status`
> 
> **优先级**：P1
> 
> **限流策略**：按事件触发，无固定频率限制

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| call_session_id | string | 是 | 通话会话ID |
| caller_number | string | 是 | 主叫号码 |
| callee_number | string | 是 | 被叫号码 |
| status | string | 是 | 状态：ringing/connected/ended/transferred |
| event_time | long | 是 | 事件发生时间戳 |
| operator | string | 是 | 运营商：cmcc/ctcc/cucc |
| call_center_id | string | 否 | 接警中心ID |
| agent_id | string | 否 | 接警员ID |
| end_reason | string | 否 | 结束原因（仅ended状态） |

**请求示例：**
```json
{
    "call_session_id": "550e8400-e29b-41d4-a716-446655440000",
    "caller_number": "13800138000",
    "callee_number": "110",
    "status": "connected",
    "event_time": 1751005803,
    "operator": "cmcc",
    "call_center_id": "bj_110_center_01",
    "agent_id": "agent_007"
}
```

**响应示例：**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "synced": true
    },
    "request_id": "req_20260627_103003_ghi789",
    "timestamp": 1751005803
}
```

---

### 3.4 位置实时推送（WebSocket）

> **接口说明**：接警端通过WebSocket订阅实时位置更新，适用于需要持续追踪的场景。
> 
> **连接地址**：`wss://api.miaoda.gov.cn/v1/emergency/location/ws`
> 
> **优先级**：P1

**连接建立：**
```
GET /v1/emergency/location/ws?token=xxx&call_session_id=yyy
Upgrade: websocket
Connection: Upgrade
```

**服务端推送消息格式：**
```json
{
    "type": "location_update",
    "call_session_id": "550e8400-e29b-41d4-a716-446655440000",
    "timestamp": 1751005810,
    "data": {
        "latitude": 39.9088,
        "longitude": 116.3976,
        "accuracy": 22.3,
        "provider": "fused",
        "location_time": 1751005809
    }
}
```

**消息类型：**

| type | 说明 |
|------|------|
| location_update | 位置更新 |
| call_status_change | 通话状态变更 |
| heartbeat | 心跳 |
| error | 错误通知 |

---

### 3.5 历史报警记录查询

> **接口说明**：查询历史报警定位记录。
> 
> **接口地址**：`GET /emergency/history/list`
> 
> **优先级**：P2
> 
> **限流策略**：单用户 20次/分钟

**请求参数（Query）：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| caller_number | string | 否 | 按手机号筛选（模糊查询需权限） |
| emergency_type | string | 否 | 按紧急类型筛选 |
| start_time | long | 否 | 开始时间戳 |
| end_time | long | 否 | 结束时间戳 |
| page | int | 否 | 页码，默认1 |
| page_size | int | 否 | 每页数量，默认20，最大100 |

**响应示例：**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "list": [
            {
                "report_id": "rep_20260627103000_abc123",
                "call_session_id": "550e8400-e29b-41d4-a716-446655440000",
                "emergency_type": "police",
                "caller_number": "138****8888",
                "first_location": {
                    "latitude": 39.9087,
                    "longitude": 116.3975,
                    "accuracy": 25.5
                },
                "address": "北京市东城区东长安街天安门广场",
                "report_time": 1751005800,
                "dispatch_duration": 3
            }
        ],
        "total": 1,
        "page": 1,
        "page_size": 20,
        "total_pages": 1
    },
    "request_id": "req_...",
    "timestamp": 1751005900
}
```

---

### 3.6 数据统计接口

> **接口说明**：获取统计报表数据。
> 
> **接口地址**：`GET /statistics/overview`
> 
> **优先级**：P3
> 
> **限流策略**：单用户 5次/分钟

**请求参数：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| time_range | string | 是 | 时间范围：today/yesterday/7d/30d/custom |
| start_time | long | 否 | 自定义开始时间 |
| end_time | long | 否 | 自定义结束时间 |
| region_code | string | 否 | 地区编码 |
| emergency_type | string | 否 | 紧急类型 |

**响应示例：**
```json
{
    "code": 0,
    "message": "success",
    "data": {
        "total_calls": 12580,
        "avg_dispatch_time": 4.2,
        "success_rate": 99.7,
        "police_count": 8650,
        "fire_count": 2130,
        "medical_count": 1800,
        "avg_accuracy": 28.5,
        "distribution_by_hour": [0, 0, 0, ...],
        "distribution_by_region": [...]
    },
    "request_id": "req_...",
    "timestamp": 1751005900
}
```

---

## 四、接入流程

### 4.1 接入步骤

```
1. 申请接入
   │  提交接入申请，说明用途和资质
   ▼
2. 获取AppKey
   │  审核通过后分配AppKey和SecretKey
   ▼
3. 开发联调
   │  根据本规范开发对接
   ▼
4. 测试验证
   │  在测试环境验证功能
   ▼
5. 上线审批
   │  安全审查 + 性能测试
   ▼
6. 正式上线
   │  切换生产环境
   ▼
7. 持续运维
   │  监控告警 + 定期审计
```

### 4.2 环境地址

| 环境 | 地址 | 说明 |
|------|------|------|
| 测试环境 | https://test-api.miaoda.gov.cn/v1 | 用于开发联调 |
| 预发布环境 | https://pre-api.miaoda.gov.cn/v1 | 上线前验证 |
| 生产环境 | https://api.miaoda.gov.cn/v1 | 正式服务 |

---

## 五、安全要求

### 5.1 传输安全

- 强制使用 HTTPS (TLS 1.2+)
- 禁止 HTTP 明文传输
- 禁用不安全的加密套件
- 证书有效期监控

### 5.2 数据安全

- 敏感数据（手机号等）传输和存储均脱敏
- 位置数据加密存储
- 访问日志完整记录，不可篡改
- 数据保留期限合规

### 5.3 接口安全

- 所有接口必须签名验证
- 敏感接口额外增加Token认证
- 接口级限流防护
- IP黑白名单机制

---

## 六、附录

### 6.1 紧急类型枚举

| 值 | 说明 | 对应号码 |
|----|------|---------|
| police | 公安报警 | 110 |
| fire | 消防救援 | 119 |
| medical | 医疗急救 | 120 |
| traffic | 交通事故 | 122 |
| other | 其他紧急 | - |

### 6.2 运营商枚举

| 值 | 说明 |
|----|------|
| cmcc | 中国移动 |
| ctcc | 中国电信 |
| cucc | 中国联通 |
| other | 其他 |

### 6.3 定位方式枚举

| 值 | 说明 | 典型精度 |
|----|------|---------|
| gps | GPS定位 | 10-30米 |
| network | 基站定位 | 100-500米 |
| wifi | Wi-Fi定位 | 20-100米 |
| fused | 混合定位 | 5-50米 |
| ip | IP定位 | 城市级 |

---

**文档版本**：v1.0  
**最后更新**：2026-06-27  
**维护团队**：秒达定位技术组  
**文档状态**：正式发布
