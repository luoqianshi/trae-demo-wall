# 虚实一体仿真系统 - 数据字典文档

> 文档版本：v2.1.0  
> 适用系统版本：Virtual-Real Simulation System v2.x  
> 最后更新日期：2026-06-16  
> 文档作者：数据架构部

---

## 1. 数据模型总览

### 1.1 数据库架构

系统采用 MongoDB 作为核心数据库，Redis 作为缓存与会话存储。数据按业务域划分为以下集合（Collection）：

| 集合名称 | 英文名称 | 业务域 | 数据量预估 | 增长频率 |
|----------|----------|--------|------------|----------|
| 设备数据 | devices | 工业控制 | 1,000-10,000 | 低 |
| 用户数据 | users | 用户管理 | 100-50,000 | 中 |
| 任务数据 | tasks | 教学管理 | 1,000-100,000 | 高 |
| 资源数据 | resources | 教学资源 | 10,000-1,000,000 | 高 |
| 考核数据 | assessments | 考核评估 | 10,000-500,000 | 高 |
| 协议配置 | protocols | 通信配置 | 100-5,000 | 低 |
| 数据通道 | channels | 虚实联动 | 1,000-50,000 | 中 |
| 日志数据 | logs | 系统运维 | 1,000,000+ | 极高 |
| 会话数据 | sessions | 用户认证 | 100-10,000 | 高 |
| 操作记录 | operations | 审计追踪 | 100,000+ | 极高 |

### 1.2 数据关系图

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   users     │────▶│   classes   │◀────│   tasks     │
│  (用户表)    │     │  (班级表)    │     │  (任务表)    │
└──────┬──────┘     └─────────────┘     └──────┬──────┘
       │                                        │
       │         ┌─────────────┐               │
       └────────▶│ assessments │◀──────────────┘
                 │  (考核表)    │
                 └──────┬──────┘
                        │
       ┌────────────────┼────────────────┐
       │                │                │
┌──────┴──────┐  ┌─────┴──────┐  ┌─────┴──────┐
│  resources  │  │   logs     │  │ operations │
│  (资源表)    │  │  (日志表)   │  │ (操作记录)  │
└─────────────┘  └────────────┘  └────────────┘

┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   devices   │◀───▶│  protocols  │────▶│  channels   │
│  (设备表)    │     │ (协议配置表) │     │ (数据通道表) │
└─────────────┘     └─────────────┘     └─────────────┘
```

---

## 2. 设备数据表 (devices)

存储系统中管理的所有工业设备信息，包括虚拟设备和真实设备。

| 字段名 | 数据类型 | 长度/精度 | 是否必填 | 默认值 | 说明 |
|--------|----------|-----------|----------|--------|------|
| _id | ObjectId | - | 是 | 自动生成 | MongoDB 主键 |
| device_id | String | 32 | 是 | - | 设备唯一标识符 (UUID) |
| name | String | 100 | 是 | - | 设备名称 |
| type | String | 50 | 是 | - | 设备类型：robot/plc/sensor/vision/conveyor/others |
| brand | String | 50 | 否 | null | 设备品牌：siemens/mitsubishi/abb/fanuc/kuka/etc |
| model | String | 100 | 否 | null | 设备型号 |
| status | String | 20 | 是 | "offline" | 设备状态：online/offline/error/maintenance |
| is_virtual | Boolean | - | 是 | false | 是否为虚拟设备 |
| ip_address | String | 15 | 否 | null | 设备 IP 地址 (IPv4) |
| port | Number | - | 否 | null | 通信端口 |
| protocol_id | String | 32 | 否 | null | 关联的协议配置 ID |
| location | String | 200 | 否 | null | 设备物理位置描述 |
| workspace | String | 100 | 否 | null | 所属工作区/产线 |
| properties | Object | - | 否 | {} | 设备扩展属性 (JSON) |
| created_at | Date | - | 是 | 当前时间 | 创建时间 |
| updated_at | Date | - | 是 | 当前时间 | 最后更新时间 |
| created_by | String | 32 | 是 | - | 创建者用户 ID |
| is_deleted | Boolean | - | 是 | false | 软删除标记 |

### 2.1 设备类型枚举值

| 枚举值 | 说明 | 典型品牌 |
|--------|------|----------|
| robot | 工业机器人 | ABB, KUKA, FANUC, 安川 |
| plc | 可编程逻辑控制器 | 西门子, 三菱, 欧姆龙 |
| sensor | 传感器 | 欧姆龙, 基恩士, 西克 |
| vision | 视觉系统 | 康耐视, 基恩士, 海康 |
| conveyor | 输送设备 | 各类品牌 |
| actuator | 执行机构 | 气动/电动执行器 |
| hmi | 人机界面 | 西门子, 威纶通 |
| others | 其他设备 | - |

### 2.2 设备状态枚举值

| 枚举值 | 说明 | 颜色标识 |
|--------|------|----------|
| online | 在线运行 | 绿色 |
| offline | 离线 | 灰色 |
| error | 故障报警 | 红色 |
| maintenance | 维护中 | 黄色 |
| standby | 待机 | 蓝色 |

---

## 3. 用户数据表 (users)

存储系统所有用户信息，支持管理员、教师、学生三种角色。

| 字段名 | 数据类型 | 长度/精度 | 是否必填 | 默认值 | 说明 |
|--------|----------|-----------|----------|--------|------|
| _id | ObjectId | - | 是 | 自动生成 | MongoDB 主键 |
| user_id | String | 32 | 是 | - | 用户唯一标识符 (UUID) |
| username | String | 50 | 是 | - | 登录用户名 |
| password_hash | String | 255 | 是 | - | bcrypt 加密后的密码 |
| email | String | 100 | 是 | - | 电子邮箱 |
| phone | String | 20 | 否 | null | 手机号码 |
| real_name | String | 50 | 是 | - | 真实姓名 |
| role | String | 20 | 是 | "student" | 角色：admin/teacher/student |
| avatar | String | 255 | 否 | null | 头像图片 URL |
| class_id | String | 32 | 否 | null | 所属班级 ID (学生必填) |
| department | String | 100 | 否 | null | 所属院系/部门 |
| student_id | String | 30 | 否 | null | 学号 (学生必填) |
| permissions | Array | - | 否 | [] | 权限列表 (角色外额外权限) |
| status | String | 20 | 是 | "active" | 账号状态：active/inactive/locked |
| last_login | Date | - | 否 | null | 最后登录时间 |
| last_ip | String | 45 | 否 | null | 最后登录 IP |
| login_count | Number | - | 是 | 0 | 累计登录次数 |
| created_at | Date | - | 是 | 当前时间 | 创建时间 |
| updated_at | Date | - | 是 | 当前时间 | 最后更新时间 |
| created_by | String | 32 | 否 | null | 创建者用户 ID |
| is_deleted | Boolean | - | 是 | false | 软删除标记 |

### 3.1 角色权限矩阵

| 权限项 | 管理员 (admin) | 教师 (teacher) | 学生 (student) |
|--------|----------------|----------------|----------------|
| 用户管理 | 全部权限 | 查看本班学生 | 仅查看自己 |
| 设备控制 | 全部权限 | 授权设备 | 授权设备 |
| 任务发布 | 全部权限 | 本班任务 | 无 |
| 任务完成 | 无 | 无 | 自己的任务 |
| 资源管理 | 全部权限 | 本班资源 | 只读 |
| 考核评分 | 全部权限 | 本班学生 | 查看自己的 |
| 系统配置 | 全部权限 | 无 | 无 |
| 日志查看 | 全部权限 | 本班日志 | 仅自己的 |

### 3.2 账号状态枚举值

| 枚举值 | 说明 | 触发条件 |
|--------|------|----------|
| active | 正常 | 账号正常可用 |
| inactive | 未激活 | 新注册未激活或手动停用 |
| locked | 锁定 | 连续登录失败 5 次自动锁定 |
| expired | 过期 | 订阅到期或账号有效期结束 |

---

## 4. 任务数据表 (tasks)

存储教学任务和实训任务信息。

| 字段名 | 数据类型 | 长度/精度 | 是否必填 | 默认值 | 说明 |
|--------|----------|-----------|----------|--------|------|
| _id | ObjectId | - | 是 | 自动生成 | MongoDB 主键 |
| task_id | String | 32 | 是 | - | 任务唯一标识符 (UUID) |
| name | String | 200 | 是 | - | 任务名称 |
| type | String | 30 | 是 | - | 任务类型 |
| category | String | 50 | 是 | - | 任务分类 |
| description | String | 2000 | 否 | null | 任务描述 |
| content | String | 5000 | 否 | null | 任务详细内容 (富文本) |
| difficulty | String | 10 | 是 | "medium" | 难度：easy/medium/hard/expert |
| status | String | 20 | 是 | "draft" | 任务状态 |
| creator_id | String | 32 | 是 | - | 创建者用户 ID |
| class_ids | Array | - | 否 | [] | 关联班级 ID 列表 |
| device_ids | Array | - | 否 | [] | 关联设备 ID 列表 |
| resource_ids | Array | - | 否 | [] | 关联资源 ID 列表 |
| max_score | Number | - | 是 | 100 | 满分分值 |
| scoring_rules | Object | - | 否 | {} | 评分规则 (JSON) |
| deadline | Date | - | 否 | null | 截止日期 |
| start_time | Date | - | 否 | null | 开始时间 |
| estimated_duration | Number | - | 否 | null | 预计完成时长 (分钟) |
| tags | Array | - | 否 | [] | 标签列表 |
| attachments | Array | - | 否 | [] | 附件列表 |
| created_at | Date | - | 是 | 当前时间 | 创建时间 |
| updated_at | Date | - | 是 | 当前时间 | 最后更新时间 |
| is_deleted | Boolean | - | 是 | false | 软删除标记 |

### 4.1 任务类型枚举值

| 枚举值 | 说明 | 适用场景 |
|--------|------|----------|
| programming | 编程任务 | 机器人示教编程、PLC 编程 |
| simulation | 仿真任务 | 工艺模拟、布局规划 |
| operation | 操作任务 | 设备操作实训 |
| debugging | 调试任务 | 故障排查与调试 |
| design | 设计任务 | 产线设计、路径规划 |
| theory | 理论任务 | 理论知识考核 |
| comprehensive | 综合任务 | 多技能综合实训 |

### 4.2 任务状态枚举值

| 枚举值 | 说明 | 流转条件 |
|--------|------|----------|
| draft | 草稿 | 创建后未发布 |
| published | 已发布 | 发布给学生 |
| in_progress | 进行中 | 学生已开始执行 |
| completed | 已完成 | 学生提交完成 |
| graded | 已评分 | 教师完成评分 |
| closed | 已关闭 | 任务结束或过期 |
| archived | 已归档 | 历史任务归档 |

### 4.3 评分规则结构 (scoring_rules)

```json
{
  "dimensions": [
    {
      "name": "操作规范性",
      "weight": 0.3,
      "max_score": 30,
      "criteria": "操作步骤是否符合标准流程"
    },
    {
      "name": "完成效率",
      "weight": 0.2,
      "max_score": 20,
      "criteria": "是否在预计时间内完成"
    },
    {
      "name": "结果准确性",
      "weight": 0.3,
      "max_score": 30,
      "criteria": "仿真结果是否正确"
    },
    {
      "name": "创新能力",
      "weight": 0.2,
      "max_score": 20,
      "criteria": "是否有优化改进"
    }
  ],
  "auto_grading": true,
  "pass_score": 60
}
```

---

## 5. 资源数据表 (resources)

存储教学资源、模型文件、文档资料等。

| 字段名 | 数据类型 | 长度/精度 | 是否必填 | 默认值 | 说明 |
|--------|----------|-----------|----------|--------|------|
| _id | ObjectId | - | 是 | 自动生成 | MongoDB 主键 |
| resource_id | String | 32 | 是 | - | 资源唯一标识符 (UUID) |
| name | String | 200 | 是 | - | 资源名称 |
| type | String | 30 | 是 | - | 资源类型 |
| category | String | 50 | 是 | - | 资源分类 |
| description | String | 1000 | 否 | null | 资源描述 |
| file_path | String | 500 | 否 | null | 文件存储路径 |
| file_size | Number | - | 否 | null | 文件大小 (字节) |
| file_format | String | 20 | 否 | null | 文件格式 |
| thumbnail | String | 255 | 否 | null | 缩略图 URL |
| uploader_id | String | 32 | 是 | - | 上传者用户 ID |
| visibility | String | 20 | 是 | "public" | 可见性：public/class/private |
| allowed_classes | Array | - | 否 | [] | 允许访问的班级 ID 列表 |
| download_count | Number | - | 是 | 0 | 下载次数 |
| view_count | Number | - | 是 | 0 | 查看次数 |
| tags | Array | - | 否 | [] | 标签列表 |
| version | String | 20 | 是 | "1.0.0" | 资源版本号 |
| created_at | Date | - | 是 | 当前时间 | 创建时间 |
| updated_at | Date | - | 是 | 当前时间 | 最后更新时间 |
| is_deleted | Boolean | - | 是 | false | 软删除标记 |

### 5.1 资源类型枚举值

| 枚举值 | 说明 | 支持格式 |
|--------|------|----------|
| model_3d | 3D 模型 | .step, .stl, .obj, .fbx, .gltf |
| video | 视频教程 | .mp4, .avi, .mov |
| document | 文档资料 | .pdf, .doc, .docx, .ppt, .pptx |
| image | 图片素材 | .jpg, .png, .gif, .svg |
| program | 程序代码 | .json, .xml, .py, .lua |
| scene | 仿真场景 | .vrss, .json |
| courseware | 课件 | .pptx, .html, .zip |
| dataset | 数据集 | .csv, .json, .xlsx |
| others | 其他 | 任意格式 |

### 5.2 可见性枚举值

| 枚举值 | 说明 | 访问范围 |
|--------|------|----------|
| public | 公开 | 所有用户 |
| class | 班级内 | 指定班级的师生 |
| private | 私有 | 仅上传者和管理员 |
| department | 院系内 | 同院系用户 |

---

## 6. 考核数据表 (assessments)

存储学生任务完成情况和考核评分结果。

| 字段名 | 数据类型 | 长度/精度 | 是否必填 | 默认值 | 说明 |
|--------|----------|-----------|----------|--------|------|
| _id | ObjectId | - | 是 | 自动生成 | MongoDB 主键 |
| assessment_id | String | 32 | 是 | - | 考核唯一标识符 (UUID) |
| task_id | String | 32 | 是 | - | 关联任务 ID |
| student_id | String | 32 | 是 | - | 学生用户 ID |
| class_id | String | 32 | 是 | - | 班级 ID |
| status | String | 20 | 是 | "pending" | 考核状态 |
| start_time | Date | - | 否 | null | 开始时间 |
| submit_time | Date | - | 否 | null | 提交时间 |
| grade_time | Date | - | 否 | null | 评分时间 |
| grader_id | String | 32 | 否 | null | 评分教师 ID |
| dimensions | Array | - | 否 | [] | 各维度得分详情 |
| total_score | Number | - | 否 | null | 总分 |
| max_score | Number | - | 是 | 100 | 满分 |
| percentage | Number | - | 否 | null | 得分百分比 |
| is_passed | Boolean | - | 否 | null | 是否通过 |
| feedback | String | 2000 | 否 | null | 教师评语 |
| submission_data | Object | - | 否 | {} | 提交数据 (JSON) |
| auto_graded | Boolean | - | 是 | false | 是否自动评分 |
| attempt_count | Number | - | 是 | 1 | 尝试次数 |
| time_spent | Number | - | 否 | null | 实际耗时 (秒) |
| created_at | Date | - | 是 | 当前时间 | 创建时间 |
| updated_at | Date | - | 是 | 当前时间 | 最后更新时间 |

### 6.1 考核状态枚举值

| 枚举值 | 说明 |
|--------|------|
| pending | 待完成 |
| in_progress | 进行中 |
| submitted | 已提交待评分 |
| auto_graded | 已自动评分 |
| graded | 已人工评分 |
| returned | 已退回修改 |
| expired | 已过期 |

### 6.2 维度得分结构 (dimensions)

```json
[
  {
    "name": "操作规范性",
    "weight": 0.3,
    "score": 28,
    "max_score": 30,
    "feedback": "操作步骤基本规范，第3步有轻微偏差"
  },
  {
    "name": "完成效率",
    "weight": 0.2,
    "score": 18,
    "max_score": 20,
    "feedback": "提前5分钟完成，效率优秀"
  },
  {
    "name": "结果准确性",
    "weight": 0.3,
    "score": 27,
    "max_score": 30,
    "feedback": "仿真结果与预期一致"
  },
  {
    "name": "创新能力",
    "weight": 0.2,
    "score": 15,
    "max_score": 20,
    "feedback": "有改进思路但未完全实现"
  }
]
```

### 6.3 提交数据结构 (submission_data)

```json
{
  "program_code": "...",
  "simulation_result": {
    "cycle_time": 45.2,
    "collision_count": 0,
    "path_length": 1200.5
  },
  "screenshots": ["url1", "url2"],
  "attachments": ["file_id_1", "file_id_2"],
  "notes": "学生备注信息"
}
```

---

## 7. 协议配置表 (protocols)

存储工业通信协议的配置信息。

| 字段名 | 数据类型 | 长度/精度 | 是否必填 | 默认值 | 说明 |
|--------|----------|-----------|----------|--------|------|
| _id | ObjectId | - | 是 | 自动生成 | MongoDB 主键 |
| protocol_id | String | 32 | 是 | - | 协议唯一标识符 (UUID) |
| name | String | 100 | 是 | - | 协议配置名称 |
| type | String | 30 | 是 | - | 协议类型 |
| device_id | String | 32 | 是 | - | 关联设备 ID |
| host | String | 255 | 否 | null | 目标主机 IP 或域名 |
| port | Number | - | 否 | null | 通信端口 |
| unit_id | Number | - | 否 | null | 从站地址/单元 ID |
| timeout | Number | - | 是 | 5000 | 超时时间 (毫秒) |
| poll_interval | Number | - | 是 | 1000 | 轮询间隔 (毫秒) |
| security | Object | - | 否 | {} | 安全配置 (JSON) |
| register_config | Array | - | 否 | [] | 寄存器配置列表 |
| connection_params | Object | - | 否 | {} | 额外连接参数 |
| is_active | Boolean | - | 是 | true | 是否启用 |
| status | String | 20 | 是 | "disconnected" | 连接状态 |
| last_connected | Date | - | 否 | null | 最后连接时间 |
| error_count | Number | - | 是 | 0 | 连续错误次数 |
| created_at | Date | - | 是 | 当前时间 | 创建时间 |
| updated_at | Date | - | 是 | 当前时间 | 最后更新时间 |
| created_by | String | 32 | 是 | - | 创建者用户 ID |

### 7.1 协议类型枚举值

| 枚举值 | 说明 | 默认端口 |
|--------|------|----------|
| modbus_tcp | Modbus TCP 协议 | 502 |
| modbus_rtu | Modbus RTU over TCP | 502 |
| modbus_rtu_serial | Modbus RTU 串口 | - |
| opc_ua | OPC Unified Architecture | 4840 |
| s7comm | 西门子 S7 通信 | 102 |
| mc_protocol | 三菱 MC 协议 | 5007 |
| fins | 欧姆龙 FINS 协议 | 9600 |
| ethernet_ip | EtherNet/IP | 44818 |
| profinet | Profinet IO | - |
| tcp_generic | 通用 TCP 协议 | 自定义 |
| udp_generic | 通用 UDP 协议 | 自定义 |

### 7.2 安全配置结构 (security)

```json
{
  "mode": "sign_and_encrypt",
  "policy": "Basic256Sha256",
  "username": "operator",
  "password": "encrypted_password",
  "certificate": {
    "client_cert_path": "./certs/client.der",
    "client_key_path": "./certs/client_key.pem"
  }
}
```

### 7.3 寄存器配置结构 (register_config)

```json
[
  {
    "name": "温度传感器",
    "address": 40001,
    "type": "holding_register",
    "count": 2,
    "data_type": "float32",
    "scale": 1.0,
    "offset": 0.0,
    "unit": "°C",
    "read_only": true,
    "description": "炉膛温度"
  },
  {
    "name": "电机启停",
    "address": 1,
    "type": "coil",
    "count": 1,
    "data_type": "boolean",
    "read_only": false,
    "description": "主电机启动信号"
  }
]
```

### 7.4 寄存器类型枚举值

| 枚举值 | 说明 | Modbus 功能码 |
|--------|------|---------------|
| coil | 线圈 (读写) | 01, 05, 15 |
| discrete_input | 离散输入 (只读) | 02 |
| holding_register | 保持寄存器 (读写) | 03, 06, 16 |
| input_register | 输入寄存器 (只读) | 04 |

### 7.5 数据类型枚举值

| 枚举值 | 说明 | 长度 (字节) |
|--------|------|-------------|
| boolean | 布尔值 | 1 |
| int16 | 有符号短整型 | 2 |
| uint16 | 无符号短整型 | 2 |
| int32 | 有符号整型 | 4 |
| uint32 | 无符号整型 | 4 |
| float32 | 单精度浮点 | 4 |
| float64 | 双精度浮点 | 8 |
| string | 字符串 | 可变 |
| bytes | 字节数组 | 可变 |

---

## 8. 数据通道表 (channels)

存储虚实联动的数据映射通道，实现虚拟数据与真实数据的同步。

| 字段名 | 数据类型 | 长度/精度 | 是否必填 | 默认值 | 说明 |
|--------|----------|-----------|----------|--------|------|
| _id | ObjectId | - | 是 | 自动生成 | MongoDB 主键 |
| channel_id | String | 32 | 是 | - | 通道唯一标识符 (UUID) |
| name | String | 100 | 是 | - | 通道名称 |
| description | String | 500 | 否 | null | 通道描述 |
| protocol_id | String | 32 | 是 | - | 关联协议配置 ID |
| virtual_address | String | 100 | 是 | - | 虚拟端地址/变量名 |
| real_address | String | 100 | 是 | - | 真实端地址/寄存器 |
| direction | String | 20 | 是 | "bidirectional" | 同步方向 |
| data_type | String | 20 | 是 | "float32" | 数据类型 |
| scale | Number | - | 是 | 1.0 | 比例因子 |
| offset | Number | - | 是 | 0.0 | 偏移量 |
| unit | String | 20 | 否 | null | 单位 |
| update_mode | String | 20 | 是 | "realtime" | 更新模式 |
| interval | Number | - | 否 | null | 定时更新间隔 (毫秒) |
| filter | Object | - | 否 | {} | 数据过滤规则 |
| transform | Object | - | 否 | {} | 数据转换规则 |
| is_active | Boolean | - | 是 | true | 是否启用 |
| status | String | 20 | 是 | "idle" | 通道状态 |
| last_value | Mixed | - | 否 | null | 最后同步值 |
| last_sync_time | Date | - | 否 | null | 最后同步时间 |
| sync_count | Number | - | 是 | 0 | 同步次数 |
| error_count | Number | - | 是 | 0 | 错误次数 |
| created_at | Date | - | 是 | 当前时间 | 创建时间 |
| updated_at | Date | - | 是 | 当前时间 | 最后更新时间 |
| created_by | String | 32 | 是 | - | 创建者用户 ID |

### 8.1 同步方向枚举值

| 枚举值 | 说明 | 数据流向 |
|--------|------|----------|
| virtual_to_real | 虚控实 | 虚拟端 -> 真实设备 |
| real_to_virtual | 实驱虚 | 真实设备 -> 虚拟端 |
| bidirectional | 双向 | 双向同步 |
| readonly | 只读 | 仅监控，不同步 |

### 8.2 更新模式枚举值

| 枚举值 | 说明 | 适用场景 |
|--------|------|----------|
| realtime | 实时更新 | 高实时性控制 |
| interval | 定时更新 | 周期性数据采集 |
| on_change | 变化触发 | 状态量监控 |
| manual | 手动触发 | 调试模式 |

### 8.3 数据过滤规则 (filter)

```json
{
  "type": "deadband",
  "deadband_value": 0.5,
  "deadband_type": "absolute"
}
```

| 过滤类型 | 说明 | 参数 |
|----------|------|------|
| deadband | 死区过滤 | deadband_value, deadband_type (absolute/percent) |
| range | 范围过滤 | min_value, max_value |
| rate_limit | 变化率限制 | max_rate_per_second |
| average | 滑动平均 | window_size |

### 8.4 数据转换规则 (transform)

```json
{
  "type": "linear",
  "formula": "value * scale + offset",
  "scale": 0.1,
  "offset": -273.15
}
```

---

## 9. 日志数据表 (logs)

存储系统运行日志、操作日志和错误日志。

| 字段名 | 数据类型 | 长度/精度 | 是否必填 | 默认值 | 说明 |
|--------|----------|-----------|----------|--------|------|
| _id | ObjectId | - | 是 | 自动生成 | MongoDB 主键 |
| log_id | String | 32 | 是 | - | 日志唯一标识符 (UUID) |
| level | String | 10 | 是 | "info" | 日志级别 |
| category | String | 30 | 是 | "system" | 日志分类 |
| message | String | 4000 | 是 | - | 日志消息 |
| detail | Object | - | 否 | {} | 详细数据 (JSON) |
| source | String | 100 | 否 | null | 日志来源 (模块/服务名) |
| user_id | String | 32 | 否 | null | 关联用户 ID |
| ip_address | String | 45 | 否 | null | 客户端 IP 地址 |
| user_agent | String | 500 | 否 | null | 客户端 User-Agent |
| request_id | String | 32 | 否 | null | 请求追踪 ID |
| session_id | String | 32 | 否 | null | 会话 ID |
| device_id | String | 32 | 否 | null | 关联设备 ID |
| task_id | String | 32 | 否 | null | 关联任务 ID |
| duration | Number | - | 否 | null | 操作耗时 (毫秒) |
| stack_trace | String | 8000 | 否 | null | 错误堆栈 (错误日志) |
| timestamp | Date | - | 是 | 当前时间 | 日志时间戳 |
| created_at | Date | - | 是 | 当前时间 | 写入时间 |

### 9.1 日志级别枚举值

| 级别 | 数值 | 说明 | 颜色 | 使用场景 |
|------|------|------|------|----------|
| debug | 10 | 调试 | 灰色 | 开发调试信息 |
| info | 20 | 信息 | 蓝色 | 常规运行信息 |
| warn | 30 | 警告 | 黄色 | 潜在问题提示 |
| error | 40 | 错误 | 红色 | 功能异常 |
| fatal | 50 | 致命 | 深红 | 系统崩溃 |

### 9.2 日志分类枚举值

| 枚举值 | 说明 | 典型内容 |
|--------|------|----------|
| system | 系统日志 | 服务启动/停止、配置变更 |
| user | 用户日志 | 登录/登出、权限变更 |
| operation | 操作日志 | 业务操作记录 |
| device | 设备日志 | 设备连接/断开、数据读写 |
| protocol | 协议日志 | 通信报文、协议错误 |
| simulation | 仿真日志 | 仿真启动/停止、计算结果 |
| security | 安全日志 | 认证失败、越权访问 |
| performance | 性能日志 | 响应时间、资源使用 |

### 9.3 日志保留策略

| 日志级别 | 保留周期 | 存储位置 | 归档方式 |
|----------|----------|----------|----------|
| debug | 7 天 | MongoDB | 自动删除 |
| info | 30 天 | MongoDB | 自动归档到文件 |
| warn | 90 天 | MongoDB + 文件 | 自动归档 |
| error | 1 年 | MongoDB + 文件 | 手动归档 |
| fatal | 永久 | MongoDB + 文件 + 备份 | 手动归档 |

---

## 10. 其他数据表

### 10.1 班级数据表 (classes)

| 字段名 | 数据类型 | 长度/精度 | 是否必填 | 默认值 | 说明 |
|--------|----------|-----------|----------|--------|------|
| _id | ObjectId | - | 是 | 自动生成 | MongoDB 主键 |
| class_id | String | 32 | 是 | - | 班级唯一标识符 |
| name | String | 100 | 是 | - | 班级名称 |
| code | String | 20 | 是 | - | 班级代码 |
| department | String | 100 | 否 | null | 所属院系 |
| grade | String | 10 | 否 | null | 年级 |
| teacher_id | String | 32 | 是 | - | 班主任/任课教师 ID |
| student_count | Number | - | 是 | 0 | 学生人数 |
| description | String | 500 | 否 | null | 班级描述 |
| status | String | 20 | 是 | "active" | 状态 |
| created_at | Date | - | 是 | 当前时间 | 创建时间 |
| updated_at | Date | - | 是 | 当前时间 | 最后更新时间 |

### 10.2 会话数据表 (sessions)

存储在 Redis 中，用于用户认证和状态管理。

| 字段名 | 数据类型 | 长度/精度 | 是否必填 | 默认值 | 说明 |
|--------|----------|-----------|----------|--------|------|
| session_id | String | 64 | 是 | - | 会话唯一标识符 |
| user_id | String | 32 | 是 | - | 关联用户 ID |
| token | String | 500 | 是 | - | JWT Token |
| ip_address | String | 45 | 否 | null | 登录 IP |
| user_agent | String | 500 | 否 | null | 客户端信息 |
| login_time | Date | - | 是 | 当前时间 | 登录时间 |
| expire_time | Date | - | 是 | - | 过期时间 |
| last_active | Date | - | 是 | 当前时间 | 最后活跃时间 |
| is_valid | Boolean | - | 是 | true | 是否有效 |

### 10.3 操作记录表 (operations)

| 字段名 | 数据类型 | 长度/精度 | 是否必填 | 默认值 | 说明 |
|--------|----------|-----------|----------|--------|------|
| _id | ObjectId | - | 是 | 自动生成 | MongoDB 主键 |
| operation_id | String | 32 | 是 | - | 操作唯一标识符 |
| user_id | String | 32 | 是 | - | 操作用户 ID |
| user_name | String | 50 | 否 | null | 用户姓名 |
| role | String | 20 | 否 | null | 用户角色 |
| action | String | 50 | 是 | - | 操作动作 |
| target_type | String | 30 | 是 | - | 操作对象类型 |
| target_id | String | 32 | 否 | null | 操作对象 ID |
| target_name | String | 200 | 否 | null | 操作对象名称 |
| old_value | Object | - | 否 | null | 修改前数据 |
| new_value | Object | - | 否 | null | 修改后数据 |
| description | String | 500 | 否 | null | 操作描述 |
| ip_address | String | 45 | 否 | null | 操作 IP |
| result | String | 20 | 是 | "success" | 操作结果 |
| error_message | String | 1000 | 否 | null | 错误信息 |
| timestamp | Date | - | 是 | 当前时间 | 操作时间 |

### 10.4 系统配置表 (settings)

| 字段名 | 数据类型 | 长度/精度 | 是否必填 | 默认值 | 说明 |
|--------|----------|-----------|----------|--------|------|
| _id | ObjectId | - | 是 | 自动生成 | MongoDB 主键 |
| key | String | 100 | 是 | - | 配置键 (唯一) |
| value | Mixed | - | 否 | null | 配置值 |
| type | String | 20 | 是 | "string" | 值类型 |
| category | String | 50 | 是 | "general" | 配置分类 |
| description | String | 500 | 否 | null | 配置说明 |
| is_editable | Boolean | - | 是 | true | 是否可编辑 |
| created_at | Date | - | 是 | 当前时间 | 创建时间 |
| updated_at | Date | - | 是 | 当前时间 | 最后更新时间 |

---

## 11. 索引设计

### 11.1 集合索引列表

| 集合 | 索引字段 | 索引类型 | 唯一 | 说明 |
|------|----------|----------|------|------|
| devices | device_id | 升序 | 是 | 主键查询 |
| devices | status | 升序 | 否 | 状态筛选 |
| devices | type + brand | 升序 | 否 | 类型品牌组合查询 |
| users | user_id | 升序 | 是 | 主键查询 |
| users | username | 升序 | 是 | 登录查询 |
| users | email | 升序 | 是 | 邮箱查询 |
| users | role + status | 升序 | 否 | 角色状态筛选 |
| users | class_id | 升序 | 否 | 班级用户查询 |
| tasks | task_id | 升序 | 是 | 主键查询 |
| tasks | creator_id + status | 升序 | 否 | 创建者任务查询 |
| tasks | class_ids | 升序 | 否 | 班级任务查询 |
| tasks | deadline | 升序 | 否 | 截止日期排序 |
| resources | resource_id | 升序 | 是 | 主键查询 |
| resources | uploader_id | 升序 | 否 | 上传者查询 |
| resources | type + category | 升序 | 否 | 类型分类筛选 |
| assessments | assessment_id | 升序 | 是 | 主键查询 |
| assessments | task_id + student_id | 升序 | 否 | 任务学生组合查询 |
| assessments | student_id + status | 升序 | 否 | 学生考核查询 |
| assessments | class_id | 升序 | 否 | 班级考核统计 |
| protocols | protocol_id | 升序 | 是 | 主键查询 |
| protocols | device_id | 升序 | 否 | 设备协议查询 |
| protocols | type + status | 升序 | 否 | 类型状态筛选 |
| channels | channel_id | 升序 | 是 | 主键查询 |
| channels | protocol_id | 升序 | 否 | 协议通道查询 |
| channels | direction + is_active | 升序 | 否 | 方向激活筛选 |
| logs | timestamp | 降序 | 否 | 时间范围查询 |
| logs | level + timestamp | 降序 | 否 | 级别时间筛选 |
| logs | user_id + timestamp | 降序 | 否 | 用户日志查询 |
| logs | category + timestamp | 降序 | 否 | 分类日志查询 |
| operations | timestamp | 降序 | 否 | 时间范围查询 |
| operations | user_id + timestamp | 降序 | 否 | 用户操作查询 |

### 11.2 复合索引说明

```javascript
// 日志查询优化 - 按用户和时间范围查询
db.logs.createIndex({ "user_id": 1, "timestamp": -1 })

// 考核统计优化 - 按班级和状态统计
db.assessments.createIndex({ "class_id": 1, "status": 1, "task_id": 1 })

// 资源搜索优化 - 支持类型和可见性筛选
db.resources.createIndex({ "type": 1, "visibility": 1, "created_at": -1 })

// 设备监控优化 - 按工作区和状态查询
db.devices.createIndex({ "workspace": 1, "status": 1, "is_virtual": 1 })
```

---

## 12. 数据备份策略

| 数据类型 | 备份频率 | 保留周期 | 备份方式 | 存储位置 |
|----------|----------|----------|----------|----------|
| 全量数据库 | 每日 02:00 | 30 天 | mongodump | 本地 NAS + 云端 |
| 增量数据库 | 每小时 | 7 天 | oplog 备份 | 本地 NAS |
| 文件资源 | 每日 03:00 | 30 天 | rsync | 本地 NAS + 云端 |
| 日志数据 | 每周 | 90 天 | 归档导出 | 冷存储 |
| 配置文件 | 变更时 | 永久 | Git 版本控制 | Git 仓库 |

---

> 本文档由虚实一体仿真系统数据架构部维护。数据库设计遵循第三范式原则，同时针对查询性能进行了适当的反范式设计。任何数据结构的变更需经过评审并同步更新本文档。
