# 虚实一体仿真系统 - 部署指南

## 系统要求

### 硬件要求
- **CPU**: Intel i5 或同等性能处理器
- **内存**: 8GB RAM (推荐 16GB)
- **硬盘**: 10GB 可用空间
- **网络**: 千兆以太网 (用于连接工业设备)

### 软件要求
- **操作系统**: Windows 10/11, Linux, macOS
- **Node.js**: v16.0.0 或更高版本
- **npm**: v8.0.0 或更高版本

---

## 安装步骤

### 1. 安装 Node.js

从 [Node.js 官网](https://nodejs.org/) 下载并安装 LTS 版本。

验证安装:
```bash
node --version
npm --version
```

### 2. 克隆或解压项目

```bash
cd virtual-real-simulation
```

### 3. 安装依赖

```bash
npm install
```

### 4. 配置系统

创建 `.env` 文件:
```env
# 服务器配置
PORT=3000
WS_PORT=8081

# 同步配置
SYNC_INTERVAL=10
MAX_LATENCY=100

# 故障注入
ENABLE_FAULT_INJECTION=true
MAX_CONCURRENT_FAULTS=3

# 日志
LOG_LEVEL=info
```

### 5. 编译 TypeScript

```bash
npx tsc
```

### 6. 启动服务器

```bash
npm start
```

或使用开发模式 (支持热重载):
```bash
npm run dev
```

---

## 设备连接配置

### Modbus TCP 设备 (如西门子 PLC)

1. 确保 PLC 已配置 Modbus TCP 服务
2. 记录 PLC 的 IP 地址和端口 (默认 502)
3. 使用 API 注册设备:

```bash
curl -X POST http://localhost:3000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{
    "id": "plc_1",
    "name": "主PLC",
    "type": "plc",
    "protocol": "modbus_tcp",
    "config": {
      "host": "192.168.1.100",
      "port": 502,
      "unitId": 1
    }
  }'
```

### Modbus RTU 设备 (如传感器)

1. 连接串口设备到电脑
2. 确认串口号 (如 COM1, /dev/ttyUSB0)
3. 注册设备:

```bash
curl -X POST http://localhost:3000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{
    "id": "sensor_1",
    "name": "温度传感器",
    "type": "sensor",
    "protocol": "modbus_rtu",
    "config": {
      "serialPort": "COM1",
      "baudRate": 9600,
      "dataBits": 8,
      "stopBits": 1,
      "parity": "none",
      "unitId": 1
    }
  }'
```

---

## 虚实联动配置

### 1. 启动同步引擎

```bash
curl -X POST http://localhost:3000/api/v1/sync/start
```

### 2. 注册数据通道

为每个需要同步的数据点创建通道:

```bash
# 机器人 X 轴位置
curl -X POST http://localhost:3000/api/v1/sync/channels \
  -H "Content-Type: application/json" \
  -d '{
    "id": "robot1_pos_x",
    "name": "机器人1 X轴位置",
    "virtualAddress": "virtual://robot1/position/x",
    "realAddress": "real://robot1/position/x",
    "dataType": "number",
    "bidirectional": true,
    "syncDirection": "both"
  }'

# 传感器状态
curl -X POST http://localhost:3000/api/v1/sync/channels \
  -H "Content-Type: application/json" \
  -d '{
    "id": "sensor1_status",
    "name": "传感器1状态",
    "virtualAddress": "virtual://sensor1/status",
    "realAddress": "real://sensor1/status",
    "dataType": "boolean",
    "bidirectional": false,
    "syncDirection": "r2v"
  }'
```

### 3. 虚拟仿真软件集成

在 Unity/UE 等虚拟仿真软件中:

```csharp
// Unity C# 示例
using UnityEngine;
using WebSocketSharp;

public class VirtualRobotController : MonoBehaviour
{
    private WebSocket ws;
    
    void Start()
    {
        ws = new WebSocket("ws://localhost:8081");
        ws.OnMessage += OnMessage;
        ws.Connect();
        
        // 订阅数据点
        ws.Send(JsonUtility.ToJson(new {
            type = "subscribe",
            dataPoints = new[] { "robot1_pos_x" }
        }));
    }
    
    void Update()
    {
        // 发送虚拟数据到真实设备
        var position = transform.position;
        ws.Send(JsonUtility.ToJson(new {
            type = "virtualData",
            data = new {
                id = "robot1_pos_x",
                deviceId = "robot_1",
                value = position.x
            }
        }));
    }
    
    void OnMessage(object sender, MessageEventArgs e)
    {
        var message = JsonUtility.FromJson<SyncMessage>(e.Data);
        if (message.type == "realToVirtual")
        {
            // 更新虚拟场景
            transform.position = new Vector3(
                (float)message.data.value, 
                transform.position.y, 
                transform.position.z
            );
        }
    }
}
```

---

## 故障注入使用

### 查看故障库

```bash
curl http://localhost:3000/api/v1/sync/fault-library
```

### 注入故障

```bash
# 注入机器人电机故障
curl -X POST http://localhost:3000/api/v1/sync/faults \
  -H "Content-Type: application/json" \
  -d '{"faultId": "F001"}'

# 注入传感器断线
curl -X POST http://localhost:3000/api/v1/sync/faults \
  -H "Content-Type: application/json" \
  -d '{"faultId": "F002"}'
```

### 清除故障

```bash
curl -X DELETE http://localhost:3000/api/v1/sync/faults/{faultInstanceId}
```

---

## 三种运行模式

### 模式一：纯虚拟仿真

无需连接真实设备，直接通过 API 发布虚拟数据:

```bash
# 启动同步引擎
curl -X POST http://localhost:3000/api/v1/sync/start

# 发布虚拟数据
curl -X POST http://localhost:3000/api/v1/sync/virtual-data \
  -H "Content-Type: application/json" \
  -d '{
    "id": "robot1_pos_x",
    "deviceId": "robot_1",
    "value": 150.5
  }'
```

### 模式二：虚实联动

同时连接虚拟仿真软件和真实设备:

```bash
# 1. 注册并连接真实设备
curl -X POST http://localhost:3000/api/v1/devices \
  -H "Content-Type: application/json" \
  -d '{"id": "plc_1", "protocol": "modbus_tcp", ...}'

curl -X POST http://localhost:3000/api/v1/devices/plc_1/connect

# 2. 启动同步引擎
curl -X POST http://localhost:3000/api/v1/sync/start

# 3. 注册数据通道
curl -X POST http://localhost:3000/api/v1/sync/channels \
  -H "Content-Type: application/json" \
  -d '{"id": "motor_speed", "syncDirection": "both", ...}'

# 4. 虚拟仿真软件通过 WebSocket 连接并收发数据
```

### 模式三：全实物实操

直接通过 API 控制真实设备，不使用虚拟仿真:

```bash
# 连接设备
curl -X POST http://localhost:3000/api/v1/devices/plc_1/connect

# 直接读写设备数据
curl -X POST http://localhost:3000/api/v1/devices/plc_1/data \
  -H "Content-Type: application/json" \
  -d '{"address": 10, "value": 123, "type": "register"}'
```

---

## 监控与调试

### 查看系统状态

```bash
curl http://localhost:3000/health
```

### 查看实时数据

使用 WebSocket 客户端连接 `ws://localhost:8081`，订阅数据点即可接收实时数据。

### 日志查看

服务器日志输出到控制台，可通过环境变量调整日志级别:
```env
LOG_LEVEL=debug  # debug, info, warn, error
```

---

## 常见问题

### Q: 无法连接到 Modbus 设备
A: 
1. 检查网络连接: `ping 192.168.1.100`
2. 确认 Modbus 端口开放: `telnet 192.168.1.100 502`
3. 检查设备地址 (unitId) 是否正确
4. 确认 PLC 已启用 Modbus TCP 服务

### Q: 数据同步延迟高
A:
1. 调整同步间隔: `SYNC_INTERVAL=5`
2. 检查网络质量
3. 减少同时同步的数据点数量
4. 使用有线网络连接

### Q: WebSocket 连接断开
A:
1. 检查服务器是否运行
2. 确认端口未被占用
3. 检查防火墙设置
4. 客户端实现自动重连机制

### Q: 故障注入无效
A:
1. 确认同步引擎已启动
2. 检查故障注入是否启用: `ENABLE_FAULT_INJECTION=true`
3. 确认故障类型与设备匹配
4. 检查是否达到最大并发故障数

---

## 安全注意事项

1. **生产环境部署前**，务必修改默认端口和启用身份验证
2. **工业网络隔离**，建议将仿真系统部署在独立网段
3. **数据备份**，定期备份配置文件和教学资源
4. **权限控制**，限制设备控制接口的访问权限
5. **急停保护**，真实设备必须配备硬件急停按钮

---

## 技术支持

- **文档**: `./docs/`
- **示例**: `./examples/`
- **Issues**: 项目 GitHub Issues 页面
- **邮箱**: support@vr-simulation.edu.cn
