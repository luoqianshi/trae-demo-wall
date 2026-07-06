# 绿电智储（Green Energy Smart Storage）项目设计文档

> **文档版本**：V1.0  
> **编制日期**：2026年6月27日  
> **项目名称**：绿电智储 — 光伏储能智能管理系统  
> **项目代号**：GESS  

---

## 目录

1. [系统架构设计](#1-系统架构设计)
2. [数据库设计](#2-数据库设计)
3. [接口设计](#3-接口设计)
4. [技术选型](#4-技术选型)
5. [安全策略](#5-安全策略)

---

## 1. 系统架构设计

### 1.1 总体架构

系统采用**四层分布式架构**，自下而上分别为设备层、边缘层、平台层和应用层，层间通过标准化协议与接口进行解耦通信。

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        应用层 (Application Layer)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Web Dashboard │  │  Mobile App  │  │ API Gateway  │  │  Report    │ │
│  │  (Vue 3 + TS) │  │ (UniApp/RN)  │  │  (Kong/Nginx)│  │  Service   │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│                         平台层 (Platform Layer)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │Data Processing│  │  AI Engine   │  │ Rule Engine  │  │  Alert     │ │
│  │ (Flink/Spark) │  │(TF/PyTorch)  │  │ (Drools/自研)│  │  Engine    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │
│  ┌──────────────┐  ┌──────────────┐                                   │
│  │   Device Mgmt │  │  OData/API   │                                   │
│  └──────────────┘  └──────────────┘                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                          边缘层 (Edge Layer)                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │EMS Controller │  │Data Collector│  │Protocol Adapt│  │Local Cache │ │
│  │  (策略引擎)    │  │ (采集引擎)   │  │ (协议适配)   │  │(SQLite/TSDB│ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │
├─────────────────────────────────────────────────────────────────────────┤
│                          设备层 (Device Layer)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │ Solar Panels  │  │Huawei Inverter│  │Battery Module│  │Grid Meter  │ │
│  │  (光伏阵列)    │  │  (华为逆变器) │  │ (储能电池组)  │  │ (智能电表) │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │
│  ┌──────────────┐                                                      │
│  │   Sensors    │                                                      │
│  │ (温感/烟感等) │                                                      │
│  └──────────────┘                                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

**层级职责说明：**

| 层级 | 职责 | 关键特性 |
|------|------|----------|
| 设备层 | 物理设备数据采集与执行 | 多协议接入、实时采集、设备抽象 |
| 边缘层 | 本地计算、协议转换、断网续传 | 边缘推理、离线自治、数据缓存 |
| 平台层 | 数据处理、AI分析、业务逻辑 | 弹性扩缩、模型迭代、规则驱动 |
| 应用层 | 用户交互、数据展示、业务入口 | 多端适配、响应式设计、权限隔离 |

### 1.2 硬件架构

#### 1.2.1 电气拓扑

```
                    ┌─────────────────┐
                    │   光伏阵列 PV    │
                    │  (多串串并联)     │
                    └────────┬────────┘
                             │ DC
                    ┌────────▼────────┐
                    │  华为逆变器      │
                    │  SUN2000-6KTL   │
                    │  (MPPT×2 / DC-AC)│
                    └────────┬────────┘
                             │ AC (380V 三相)
              ┌──────────────┼──────────────┐
              │              │              │
     ┌────────▼───────┐     │     ┌────────▼────────┐
     │  LUNA2000 储能  │     │     │   智能电表       │
     │  (电池模块×N)   │     │     │  (并网计量)      │
     │  DC-AC 双向变换 │     │     └────────┬────────┘
     └────────┬───────┘     │              │
              │              │              │
              └──────────────┼──────────────┘
                             │
                    ┌────────▼────────┐
                    │   本地负载       │
                    │  (用户用电设备)   │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
                    │   电网           │
                    │  (10kV/380V)     │
                    └─────────────────┘
```

#### 1.2.2 通信架构

| 链路 | 协议 | 接口 | 说明 |
|------|------|------|------|
| 逆变器 ↔ 储能电池 | Modbus RTU / RS485 | 双向 | 实时功率调度、SOC读取、充放电控制 |
| 电池模块间 | CAN 2.0B | 双向 | 模块级BMS数据、均衡管理、温度监控 |
| 逆变器 → 智能电表 | Modbus RTU / RS485 | 单向 | 并网功率、电压电流、电能质量 |
| 逆变器/电池 → EMS控制器 | Modbus TCP | 双向 | 设备遥测、远程控制指令 |
| EMS控制器 → 云平台 | MQTT (EMQX) / 4G+WiFi | 双向 | 遥测上报、指令下发、OTA升级 |
| 云平台 → 华为智能光伏 | HTTPS / OAuth2 | 双向 | FusionSolar API对接、电站数据同步 |

#### 1.2.3 设备规格参数

| 设备 | 型号 | 关键参数 |
|------|------|----------|
| 光伏组件 | 通用 550W 双面 | 转换效率≥21.3%, 工作温度-40~+85℃ |
| 逆变器 | 华为 SUN2000-6KTL-M1 | 最大效率98.6%, MPPT路数2, 直流输入18kW |
| 储能电池 | 华为 LUNA2000-7-S1 | 7kWh/模块, 最大可扩至42kWh(6模块), DoD 90% |
| 智能电表 | 三相智能电表 | 精度0.5S级, 支持双向计量 |
| EMS控制器 | ARM Cortex-A72 | 4核1.8GHz, 4GB RAM, 32GB eMMC, RS485×4 |

### 1.3 软件架构

#### 1.3.1 技术栈全景

```
┌─────────────────────────────────────────────────────────────────────┐
│                          Frontend                                   │
│   Vue 3 + TypeScript + Vite + Pinia + Element Plus + ECharts        │
├─────────────────────────────────────────────────────────────────────┤
│                          Backend                                    │
│   ┌─────────────────────┐    ┌──────────────────────┐              │
│   │  Spring Boot 3.x    │    │  Python FastAPI      │              │
│   │  (业务服务主框架)     │    │  (AI服务 / 数据分析)  │              │
│   └─────────────────────┘    └──────────────────────┘              │
├─────────────────────────────────────────────────────────────────────┤
│                          IoT Layer                                  │
│   EMQX Broker (MQTT 5.0) + Protocol Adapter (Modbus/OPC-UA)        │
├─────────────────────────────────────────────────────────────────────┤
│                          Data Layer                                 │
│   PostgreSQL 15 + TimescaleDB + Redis 7 + MinIO (对象存储)          │
├─────────────────────────────────────────────────────────────────────┤
│                          AI/ML Layer                                │
│   TensorFlow Lite (边缘推理) + PyTorch (云端训练) + MLflow (模型管理)│
├─────────────────────────────────────────────────────────────────────┤
│                          DevOps                                     │
│   Kubernetes + Docker + Helm + GitHub Actions + Prometheus + Grafana│
└─────────────────────────────────────────────────────────────────────┘
```

#### 1.3.2 微服务划分

| 服务 | 职责 | 技术栈 | 端口 |
|------|------|--------|------|
| gess-gateway | API网关、路由、限流、鉴权 | Spring Cloud Gateway | 8080 |
| gess-auth | 用户认证、授权、Token管理 | Spring Boot + JWT | 8081 |
| gess-device | 设备注册、拓扑管理、状态监控 | Spring Boot + PostgreSQL | 8082 |
| gess-energy | 能量数据采集、存储、查询 | Spring Boot + TimescaleDB | 8083 |
| gess-ems | 策略引擎、模式切换、调度优化 | Spring Boot + Drools | 8084 |
| gess-alert | 告警规则、通知分发、升级处理 | Spring Boot + Redis | 8085 |
| gess-ai | 负荷预测、发电预测、异常检测 | Python FastAPI + PyTorch | 8086 |
| gess-report | 报表生成、数据导出、定期统计 | Spring Boot + MinIO | 8087 |
| gess-iot | MQTT接入、协议转换、指令下发 | EMQX + Spring Boot | 1883/8088 |

#### 1.3.3 边缘端软件架构

```
┌─────────────────────────────────────────────┐
│              EMS 边缘控制器                    │
│  ┌───────────┐  ┌───────────┐  ┌──────────┐ │
│  │ 采集引擎   │  │ 协议适配层 │  │ 本地TSDB │ │
│  │(定时轮询)  │  │(Modbus/   │  │(SQLite + │ │
│  │           │  │ CAN/HTTP) │  │  扩展)   │ │
│  └───────────┘  └───────────┘  └──────────┘ │
│  ┌───────────┐  ┌───────────┐  ┌──────────┐ │
│  │ 策略引擎   │  │ 边缘AI    │  │ 云端同步  │ │
│  │(充放电策略)│  │(TF Lite   │  │(断网续传)│ │
│  │           │  │  推理)    │  │         │ │
│  └───────────┘  └───────────┘  └──────────┘ │
│  ┌───────────┐  ┌───────────┐               │
│  │ 规则引擎   │  │ 安全模块   │               │
│  │(告警/保护)│  │(TLS/证书) │               │
│  └───────────┘  └───────────┘               │
└─────────────────────────────────────────────┘
```

### 1.4 部署架构

#### 1.4.1 云端部署

```
┌─────────────────────────────────────────────────────────────────┐
│                     Kubernetes Cluster (阿里云 ACK)               │
│                                                                   │
│  ┌── Ingress ──┐                                                 │
│  │  SLB + WAF  │                                                 │
│  └──────┬──────┘                                                 │
│         │                                                         │
│  ┌──────▼──────────────────────────────────────────────────┐     │
│  │  Namespace: gess-prod                                  │     │
│  │                                                         │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │     │
│  │  │ gateway  │ │  auth    │ │  device  │ │  energy  │  │     │
│  │  │ (2 pods) │ │ (2 pods) │ │ (2 pods) │ │ (3 pods) │  │     │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │     │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │     │
│  │  │   ems    │ │  alert   │ │   ai     │ │  report  │  │     │
│  │  │ (2 pods) │ │ (2 pods) │ │ (2 pods) │ │ (2 pods) │  │     │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │     │
│  └─────────────────────────────────────────────────────────┘     │
│                                                                   │
│  ┌── Data Services ──────────────────────────────────────────┐   │
│  │  PostgreSQL (RDS)  │  TimescaleDB  │  Redis Cluster       │   │
│  │  EMQX Cluster (3节点) │  MinIO       │  MLflow             │   │
│  └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

#### 1.4.2 边缘部署

| 组件 | 部署方式 | 说明 |
|------|----------|------|
| EMS控制器 | Yocto Linux + Docker Compose | 轻固化系统，容器化服务 |
| 数据采集 | systemd 服务 | C/C++ 高性能采集进程 |
| 边缘AI | Docker 容器 | TensorFlow Lite 推理服务 |
| 本地数据库 | SQLite + 扩展TSDB | 断网缓存，联网同步 |

#### 1.4.3 边缘-云协同策略

```
┌──────────────┐                          ┌──────────────┐
│  边缘 EMS    │  ── MQTT (在线) ──→      │   云平台      │
│              │  ←── 指令下发 ───        │              │
│              │                          │              │
│  本地缓存    │  ── 批量同步 (恢复) ──→  │  数据合并     │
│  (SQLite)    │  ←── 冲突解决 ───       │  (TimescaleDB)│
│              │                          │              │
│  自治策略    │  (离线时独立运行)         │  全局优化     │
└──────────────┘                          └──────────────┘
```

**协同机制：**
- **在线模式**：实时上报 + 云端策略下发，延迟 < 3s
- **弱网模式**：本地缓存 + 压缩批量上传，心跳间隔 30s
- **离线模式**：边缘自治策略运行，本地存储数据，网络恢复后增量同步
- **数据一致性**：采用 CRDT（无冲突复制数据类型）解决边缘-云数据冲突

---

## 2. 数据库设计

### 2.1 ER图

```
┌──────────┐       ┌──────────┐       ┌──────────────┐
│   User   │──1:N──│  Device  │──1:N──│ EnergyRecord │
│          │       │          │       │  (时序超表)    │
└──────────┘       └────┬─────┘       └──────────────┘
     │                   │
     │1:N               │1:N
     ▼                   ▼
┌──────────┐       ┌──────────┐       ┌──────────────┐
│  Report  │       │  Alert   │       │ SystemConfig │
└──────────┘       └──────────┘       └──────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  SolarPanel  │──┐  │   Inverter   │──┐  │BatteryModule │
│  (光伏组件)   │  │  │  (逆变器)    │  │  │ (电池模块)    │
└──────────────┘  │  └──────────────┘  │  └──────────────┘
                   │                     │
                   └──── N:1 ───────────┘
                          │
                          ▼
                     ┌──────────┐
                     │  Device  │
                     └──────────┘
```

**实体关系说明：**

| 关系 | 类型 | 说明 |
|------|------|------|
| User → Device | 1:N | 用户可管理多个设备（租户隔离） |
| Device → EnergyRecord | 1:N | 设备产生多条能量记录 |
| Device → Alert | 1:N | 设备可触发多条告警 |
| User → Report | 1:N | 用户可生成多份报表 |
| Device → SolarPanel | 1:N | 设备包含多个光伏组件 |
| Device → Inverter | 1:1 | 设备对应一台逆变器 |
| Device → BatteryModule | 1:N | 设备包含多个电池模块 |

### 2.2 核心表结构

#### 2.2.1 用户表 (users)

```sql
CREATE TABLE users (
    id              BIGSERIAL       PRIMARY KEY,
    username        VARCHAR(64)     NOT NULL UNIQUE,
    password_hash   VARCHAR(256)    NOT NULL,              -- bcrypt hash
    real_name       VARCHAR(64),
    phone           VARCHAR(20),
    email           VARCHAR(128),
    role            VARCHAR(32)     NOT NULL DEFAULT 'viewer',  -- admin/operator/viewer
    tenant_id       BIGINT          NOT NULL,              -- 租户ID（多租户隔离）
    status          SMALLINT        NOT NULL DEFAULT 1,    -- 1:启用 0:禁用
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_role ON users(role);
```

#### 2.2.2 设备表 (devices)

```sql
CREATE TABLE devices (
    id              BIGSERIAL       PRIMARY KEY,
    type            VARCHAR(32)     NOT NULL,              -- inverter/battery/meter/sensor
    model           VARCHAR(64)     NOT NULL,              -- SUN2000-6KTL-M1 / LUNA2000-7-S1
    sn              VARCHAR(64)     NOT NULL UNIQUE,       -- 设备序列号
    name            VARCHAR(128),                          -- 用户自定义名称
    station_id      BIGINT,                                -- 所属电站ID
    tenant_id       BIGINT          NOT NULL,
    status          VARCHAR(16)     NOT NULL DEFAULT 'offline',  -- online/offline/fault/maintenance
    firmware_ver    VARCHAR(32),
    ip_address      INET,
    port            INTEGER,
    protocol        VARCHAR(16)     DEFAULT 'modbus_tcp',  -- modbus_tcp/modbus_rtu/mqtt/can
    config_json     JSONB           DEFAULT '{}',          -- 设备配置（协议参数、采集频率等）
    metadata_json   JSONB           DEFAULT '{}',          -- 设备元数据（固件版本、硬件版本等）
    installed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_devices_tenant ON devices(tenant_id);
CREATE INDEX idx_devices_type ON devices(type);
CREATE INDEX idx_devices_station ON devices(station_id);
CREATE INDEX idx_devices_status ON devices(status);
```

#### 2.2.3 能量记录表 (energy_records) — TimescaleDB 超表

```sql
CREATE TABLE energy_records (
    time            TIMESTAMPTZ     NOT NULL,              -- 采集时间戳
    device_id       BIGINT          NOT NULL,              -- 设备ID
    station_id      BIGINT          NOT NULL,              -- 电站ID
    -- 光伏侧
    pv_power        REAL,                                   -- 光伏实时功率 (kW)
    pv_voltage      REAL,                                   -- 光伏电压 (V)
    pv_current      REAL,                                   -- 光伏电流 (A)
    pv_energy_day   REAL,                                   -- 日发电量 (kWh)
    pv_energy_total REAL,                                   -- 累计发电量 (kWh)
    -- 负载侧
    load_power      REAL,                                   -- 负载功率 (kW)
    -- 储能侧
    battery_soc     REAL,                                   -- 电池SOC (%)
    battery_power   REAL,                                   -- 电池功率 (kW, 正=充电 负=放电)
    battery_voltage REAL,                                   -- 电池电压 (V)
    battery_temp    REAL,                                   -- 电池温度 (℃)
    -- 电网侧
    grid_power      REAL,                                   -- 电网交互功率 (kW, 正=购电 负=售电)
    grid_voltage    REAL,                                   -- 电网电压 (V)
    grid_freq       REAL,                                   -- 电网频率 (Hz)
    -- 运行模式
    mode            VARCHAR(16)     DEFAULT 'auto',        -- auto/self_use/peak_shaving/backup/feed_in
    -- 电能质量
    power_factor    REAL,                                   -- 功率因数
    -- 元数据
    quality         SMALLINT        DEFAULT 0              -- 数据质量标记 (0:正常 1:估算 2:异常)
);

SELECT create_hypertable('energy_records', 'time', chunk_time_interval => INTERVAL '1 day');

CREATE INDEX idx_energy_device ON energy_records(device_id, time DESC);
CREATE INDEX idx_energy_station ON energy_records(station_id, time DESC);
CREATE INDEX idx_energy_mode ON energy_records(mode, time DESC);

-- 连续聚合：1分钟粒度
CREATE MATERIALIZED VIEW energy_1min
WITH (timescaledb.continuous) AS
SELECT
    time_bucket('1 min', time) AS bucket,
    device_id,
    station_id,
    avg(pv_power)    AS pv_power,
    avg(load_power)  AS load_power,
    avg(battery_soc) AS battery_soc,
    avg(battery_power) AS battery_power,
    avg(grid_power)  AS grid_power,
    first(mode, time) AS mode
FROM energy_records
GROUP BY bucket, device_id, station_id;

-- 数据保留策略：原始数据保留1年，聚合数据永久保留
SELECT add_retention_policy('energy_records', INTERVAL '1 year');
```

#### 2.2.4 告警表 (alerts)

```sql
CREATE TABLE alerts (
    id              BIGSERIAL       PRIMARY KEY,
    device_id       BIGINT          NOT NULL,
    station_id      BIGINT,
    tenant_id       BIGINT          NOT NULL,
    level           VARCHAR(16)     NOT NULL,              -- critical/warning/info
    type            VARCHAR(64)     NOT NULL,              -- 告警类型编码
    code            VARCHAR(32),                           -- 设备原始告警码
    message         TEXT            NOT NULL,              -- 告警描述
    suggestion      TEXT,                                   -- 处置建议
    source          VARCHAR(16)     DEFAULT 'system',      -- system/device/ai
    status          VARCHAR(16)     NOT NULL DEFAULT 'active',  -- active/acknowledged/resolved/suppressed
    acknowledged_by BIGINT,
    resolved_by     BIGINT,
    metadata_json   JSONB           DEFAULT '{}',          -- 告警附加数据
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    resolved_at     TIMESTAMPTZ
);

CREATE INDEX idx_alerts_device ON alerts(device_id, created_at DESC);
CREATE INDEX idx_alerts_status ON alerts(status, level);
CREATE INDEX idx_alerts_tenant ON alerts(tenant_id, created_at DESC);
```

#### 2.2.5 系统配置表 (system_config)

```sql
CREATE TABLE system_config (
    id              BIGSERIAL       PRIMARY KEY,
    key             VARCHAR(128)    NOT NULL,              -- 配置键
    value           TEXT            NOT NULL,              -- 配置值
    scope           VARCHAR(32)     NOT NULL DEFAULT 'global',  -- global/tenant/station/device
    scope_id        BIGINT,                                -- scope对应的实体ID
    description     TEXT,
    encrypted       BOOLEAN         DEFAULT FALSE,         -- 值是否加密存储
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    UNIQUE(key, scope, scope_id)
);

CREATE INDEX idx_config_scope ON system_config(scope, scope_id);
```

#### 2.2.6 报表表 (reports)

```sql
CREATE TABLE reports (
    id              BIGSERIAL       PRIMARY KEY,
    type            VARCHAR(32)     NOT NULL,              -- daily/weekly/monthly/custom
    station_id      BIGINT,
    tenant_id       BIGINT          NOT NULL,
    title           VARCHAR(256),
    period_start    TIMESTAMPTZ     NOT NULL,
    period_end      TIMESTAMPTZ     NOT NULL,
    data_json       JSONB           NOT NULL,              -- 报表数据（统计指标、图表数据等）
    file_url        TEXT,                                  -- 导出文件URL (MinIO)
    file_format     VARCHAR(16),                           -- pdf/xlsx/csv
    status          VARCHAR(16)     DEFAULT 'completed',   -- generating/completed/failed
    created_by      BIGINT,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_tenant ON reports(tenant_id, created_at DESC);
CREATE INDEX idx_reports_type ON reports(type, period_start);
```

#### 2.2.7 光伏组件表 (solar_panels)

```sql
CREATE TABLE solar_panels (
    id              BIGSERIAL       PRIMARY KEY,
    device_id       BIGINT          NOT NULL REFERENCES devices(id),
    string_no       INTEGER         NOT NULL,              -- 组串号
    position_no     INTEGER         NOT NULL,              -- 组件位置号
    model           VARCHAR(64),                           -- 组件型号
    rated_power     REAL,                                   -- 额定功率 (W)
    orientation     VARCHAR(16),                           -- 朝向 (south/south_west等)
    tilt_angle      REAL,                                   -- 倾斜角 (度)
    installed_at    TIMESTAMPTZ,
    metadata_json   JSONB           DEFAULT '{}'
);
```

#### 2.2.8 电池模块表 (battery_modules)

```sql
CREATE TABLE battery_modules (
    id              BIGSERIAL       PRIMARY KEY,
    device_id       BIGINT          NOT NULL REFERENCES devices(id),
    module_index    INTEGER         NOT NULL,              -- 模块序号 (1-6 for LUNA2000)
    sn              VARCHAR(64)     NOT NULL UNIQUE,
    rated_capacity  REAL            NOT NULL,              -- 额定容量 (kWh)
    current_soc     REAL,                                   -- 当前SOC (%)
    current_soh     REAL,                                   -- 当前SOH (%)
    cycle_count     INTEGER         DEFAULT 0,             -- 循环次数
    firmware_ver    VARCHAR(32),
    status          VARCHAR(16)     DEFAULT 'standby',     -- charging/discharging/standby/fault
    installed_at    TIMESTAMPTZ,
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
```

---

## 3. 接口设计

### 3.1 RESTful API

#### 3.1.1 认证接口

| 方法 | 路径 | 说明 | 请求体 | 响应 |
|------|------|------|--------|------|
| POST | `/api/v1/auth/login` | 用户登录 | `{username, password}` | `{access_token, refresh_token, expires_in}` |
| POST | `/api/v1/auth/refresh` | 刷新令牌 | `{refresh_token}` | `{access_token, expires_in}` |
| POST | `/api/v1/auth/logout` | 用户登出 | — | `{success}` |
| GET | `/api/v1/auth/me` | 当前用户信息 | — | `{id, username, role, tenant_id}` |

#### 3.1.2 设备管理接口

| 方法 | 路径 | 说明 | 请求体 | 响应 |
|------|------|------|--------|------|
| GET | `/api/v1/devices` | 设备列表 | — (Query: `type, status, station_id, page, size`) | `{total, items:[Device]}` |
| GET | `/api/v1/devices/{id}` | 设备详情 | — | `Device` |
| POST | `/api/v1/devices` | 注册设备 | `{type, model, sn, name, station_id, config}` | `Device` |
| PUT | `/api/v1/devices/{id}` | 更新设备 | `{name, config}` | `Device` |
| DELETE | `/api/v1/devices/{id}` | 删除设备 | — | `{success}` |
| POST | `/api/v1/devices/{id}/config` | 下发配置 | `{config_json}` | `{task_id}` |
| GET | `/api/v1/devices/{id}/status` | 设备实时状态 | — | `{status, last_seen, metrics}` |

#### 3.1.3 能量数据接口

| 方法 | 路径 | 说明 | 请求体 | 响应 |
|------|------|------|--------|------|
| GET | `/api/v1/energy/realtime` | 实时能量数据 | — (Query: `station_id`) | `{pv_power, load_power, battery_soc, battery_power, grid_power, mode, timestamp}` |
| GET | `/api/v1/energy/history` | 历史能量数据 | — (Query: `start, end, granularity[1min/5min/1h/1d], station_id, device_id`) | `{total, items:[EnergyRecord]}` |
| GET | `/api/v1/energy/statistics` | 统计数据 | — (Query: `period[daily/weekly/monthly], station_id, date`) | `{pv_total, load_total, grid_import, grid_export, self_use_rate, savings}` |
| GET | `/api/v1/energy/flow` | 能量流向 | — (Query: `station_id`) | `{pv→load, pv→battery, pv→grid, battery→load, grid→load, battery→grid}` |

#### 3.1.4 EMS策略接口

| 方法 | 路径 | 说明 | 请求体 | 响应 |
|------|------|------|--------|------|
| GET | `/api/v1/mode` | 当前运行模式 | — | `{mode, params, effective_from}` |
| POST | `/api/v1/mode/switch` | 切换运行模式 | `{mode, params, reason}` | `{success, effective_from}` |
| GET | `/api/v1/mode/list` | 可用模式列表 | — | `[{mode, name, description, params_schema}]` |
| GET | `/api/v1/ems/strategy` | 当前策略配置 | — | `StrategyConfig` |
| PUT | `/api/v1/ems/strategy` | 更新策略配置 | `StrategyConfig` | `{success}` |

**运行模式枚举：**

| 模式 | 编码 | 说明 |
|------|------|------|
| 自用优先 | `self_use` | 光伏优先供负载，余电充电，满充后余电上网 |
| 峰谷套利 | `peak_shaving` | 谷电充电、峰电放电，最大化电费节省 |
| 备用电源 | `backup` | 电池保留指定SOC，仅在断网/故障时放电 |
| 全额上网 | `feed_in` | 光伏全部上网，电网供电负载 |
| 智能调度 | `auto` | AI根据电价、负荷预测、天气自动选择最优策略 |

#### 3.1.5 告警接口

| 方法 | 路径 | 说明 | 请求体 | 响应 |
|------|------|------|--------|------|
| GET | `/api/v1/alerts` | 告警列表 | — (Query: `level, status, device_id, start, end, page, size`) | `{total, items:[Alert]}` |
| GET | `/api/v1/alerts/{id}` | 告警详情 | — | `Alert` |
| PUT | `/api/v1/alerts/{id}/acknowledge` | 确认告警 | `{note}` | `{success}` |
| PUT | `/api/v1/alerts/{id}/resolve` | 解决告警 | `{resolution}` | `{success}` |
| GET | `/api/v1/alerts/stats` | 告警统计 | — (Query: `station_id, period`) | `{critical, warning, info, by_type, by_device}` |

#### 3.1.6 报表接口

| 方法 | 路径 | 说明 | 请求体 | 响应 |
|------|------|------|--------|------|
| GET | `/api/v1/reports/{type}` | 报表列表 | — (Query: `station_id, period_start, period_end`) | `{items:[Report]}` |
| POST | `/api/v1/reports/generate` | 生成报表 | `{type, station_id, period_start, period_end}` | `{report_id, status}` |
| GET | `/api/v1/reports/{id}/download` | 下载报表文件 | — | File stream |

#### 3.1.7 仪表盘接口

| 方法 | 路径 | 说明 | 请求体 | 响应 |
|------|------|------|--------|------|
| GET | `/api/v1/dashboard/summary` | 总览数据 | — (Query: `station_id`) | `{pv_today, pv_total, savings, co2_avoided, self_use_rate, battery_soc, active_alerts}` |
| GET | `/api/v1/dashboard/trend` | 趋势数据 | — (Query: `range[7d/30d/1y]`) | `{dates, pv_energy, load_energy, grid_import, grid_export}` |
| GET | `/api/v1/dashboard/devices` | 设备概览 | — | `{total, online, offline, fault, by_type}` |

#### 3.1.8 通用响应格式

```json
// 成功响应
{
    "code": 0,
    "message": "success",
    "data": { ... },
    "timestamp": "2026-06-27T10:30:00+08:00"
}

// 错误响应
{
    "code": 40001,
    "message": "设备不存在",
    "errors": [
        {"field": "device_id", "message": "ID 999 不存在"}
    ],
    "timestamp": "2026-06-27T10:30:00+08:00"
}
```

**错误码规范：**

| 范围 | 说明 | 示例 |
|------|------|------|
| 0 | 成功 | — |
| 40000-40099 | 客户端参数错误 | 40001: 资源不存在 |
| 40100-40199 | 认证授权错误 | 40101: Token过期 |
| 40300-40399 | 权限错误 | 40301: 无操作权限 |
| 50000-50099 | 服务端内部错误 | 50001: 数据库异常 |
| 60000-60099 | 设备通信错误 | 60001: 设备离线 |
| 70000-70099 | EMS策略错误 | 70001: 模式切换失败 |

### 3.2 MQTT Topics

#### 3.2.1 Topic 规范

| Topic | 方向 | QoS | 说明 | Payload 示例 |
|-------|------|-----|------|-------------|
| `gess/device/{sn}/telemetry` | 设备→云 | 1 | 遥测数据上报 | `{"ts":1719475200,"pv_power":4.2,"battery_soc":85,...}` |
| `gess/device/{sn}/command` | 云→设备 | 1 | 控制指令下发 | `{"cmd":"mode_switch","params":{"mode":"peak_shaving"},"ts":1719475200}` |
| `gess/device/{sn}/status` | 设备→云 | 1 | 设备状态变更 | `{"status":"online","firmware":"V1.2.3","ts":1719475200}` |
| `gess/device/{sn}/config` | 云→设备 | 1 | 配置下发 | `{"collect_interval":5,"report_interval":30}` |
| `gess/device/{sn}/ota` | 云→设备 | 1 | OTA升级指令 | `{"version":"V1.3.0","url":"https://...","checksum":"sha256:..."}` |
| `gess/device/{sn}/alert` | 设备→云 | 1 | 设备告警上报 | `{"level":"warning","code":"BATT_TEMP_HIGH","message":"电池温度过高"}` |
| `gess/device/{sn}/response` | 设备→云 | 1 | 指令执行响应 | `{"cmd_id":"xxx","result":"success","data":{}}` |

#### 3.2.2 遥测数据格式

```json
{
    "ts": 1719475200,
    "pv_power": 4.2,
    "pv_voltage": 380.5,
    "pv_current": 11.05,
    "pv_energy_day": 22.5,
    "load_power": 3.1,
    "battery_soc": 85.2,
    "battery_power": 0.8,
    "battery_voltage": 51.2,
    "battery_temp": 32.5,
    "grid_power": -0.3,
    "grid_voltage": 220.1,
    "grid_freq": 50.01,
    "mode": "self_use",
    "power_factor": 0.98
}
```

### 3.3 Huawei FusionSolar API Integration

#### 3.3.1 接入架构

```
┌──────────────┐                    ┌────────────────────┐
│  GESS 平台   │ ── HTTPS/OAuth2 ──→│ Huawei FusionSolar │
│              │                    │   Open API         │
│  数据同步    │ ←─ JSON ────────── │                    │
│  服务        │                    │  电站/设备/数据     │
└──────────────┘                    └────────────────────┘
```

#### 3.3.2 认证流程

```
1. 获取授权码:  GET /oauth2/authorize?client_id=xxx&redirect_uri=xxx&response_type=code
2. 获取令牌:    POST /oauth2/token  {grant_type=authorization_code, code=xxx}
3. 刷新令牌:    POST /oauth2/token  {grant_type=refresh_token, refresh_token=xxx}
4. 调用API:     GET /api/v1/stations  Header: Authorization: Bearer {access_token}
```

#### 3.3.3 核心接口映射

| FusionSolar API | GESS 用途 | 同步频率 |
|----------------|-----------|----------|
| `GET /station/list` | 电站列表同步 | 每日 |
| `GET /station/{id}/devices` | 设备列表同步 | 每日 |
| `GET /device/{id}/realtime` | 实时数据校准 | 每5分钟 |
| `GET /device/{id}/history` | 历史数据回补 | 按需 |
| `GET /station/{id}/kpi` | KPI指标对比 | 每小时 |
| `POST /device/{id}/setting` | 设备参数下发 | 按需 |

#### 3.3.4 数据对账机制

- **实时对账**：每5分钟比较GESS采集数据与FusionSolar API数据，偏差 > 5% 时告警
- **日结对账**：每日凌晨对比日发电量、日用电量，生成对账报告
- **异常回补**：检测到数据缺失时，从FusionSolar API回补历史数据

---

## 4. 技术选型

| 层级 | 技术 | 版本 | 选型理由 |
|------|------|------|----------|
| **Frontend** | Vue 3 + TypeScript | 3.4+ / 5.x | 组合式API性能优异，TS增强可维护性；生态成熟，组件库丰富 |
| | Vite | 5.x | 构建速度较Webpack提升10倍+，HMR即时生效 |
| | Element Plus | 2.x | 企业级组件库，表单/表格/图表开箱即用 |
| | ECharts | 5.x | 百度开源图表库，时序图/仪表盘/地图能力强 |
| | Pinia | 2.x | Vue官方状态管理，TS类型推断完善 |
| **Backend** | Spring Boot | 3.2+ | Java生态成熟，微服务框架完善，企业级稳定性 |
| | Python FastAPI | 0.110+ | AI/数据分析服务；异步高性能，自动OpenAPI文档 |
| | Spring Cloud Gateway | 4.x | API网关；限流/熔断/鉴权一体化 |
| | Drools | 8.x | 规则引擎；EMS策略规则热更新，无需重启 |
| **Database** | PostgreSQL | 15+ | ACID事务，JSONB灵活存储，扩展性强 |
| | TimescaleDB | 2.x | PostgreSQL时序扩展，自动分区压缩，连续聚合 |
| | Redis | 7.x | 缓存/会话/实时数据；发布订阅支持设备状态推送 |
| | MinIO | 2024+ | S3兼容对象存储；报表文件/OTA包存储 |
| **IoT** | EMQX | 5.x | 百万级MQTT连接；规则引擎直接入TimescaleDB |
| | Modbus4j | 3.x | Java Modbus协议库；逆变器/电表数据采集 |
| | Python-can | 4.x | CAN总线协议栈；电池BMS数据采集 |
| **AI/ML** | PyTorch | 2.x | 云端模型训练；负荷预测、发电预测 |
| | TensorFlow Lite | 2.x | 边缘端推理；轻量化模型，延迟 < 10ms |
| | MLflow | 2.x | 模型生命周期管理；实验追踪、模型注册、版本管理 |
| | scikit-learn | 1.x | 异常检测；孤立森林/LOF算法检测设备异常 |
| **DevOps** | Kubernetes | 1.28+ | 容器编排；自动扩缩容、滚动更新、自愈能力 |
| | Docker | 24+ | 容器化；环境一致性、快速部署 |
| | Helm | 3.x | K8s包管理；模板化部署、环境差异化配置 |
| | GitHub Actions | — | CI/CD；代码检查→构建→测试→部署全自动化 |
| **Monitoring** | Prometheus | 2.x | 指标采集；应用/基础设施/自定义业务指标 |
| | Grafana | 10.x | 可视化；运维大盘、业务大盘、告警通知 |
| | Loki | 2.x | 日志聚合；与Grafana无缝集成，成本低于ELK |
| | Jaeger | 1.x | 分布式追踪；微服务调用链排查 |

---

## 5. 安全策略

### 5.1 数据安全

#### 5.1.1 传输安全

| 通信链路 | 加密协议 | 证书管理 | 说明 |
|----------|----------|----------|------|
| 客户端 ↔ API网关 | TLS 1.3 | Let's Encrypt / 企业CA | 前端全站HTTPS |
| 微服务间通信 | mTLS (TLS 1.3) | Service Mesh CA | 零信任网络 |
| 设备 ↔ MQTT Broker | TLS 1.2+ | 设备CA签发 | 双向证书认证 |
| 边缘 ↔ 云端 | TLS 1.3 + VPN | IPSec证书 | 双重加密通道 |

#### 5.1.2 存储安全

| 数据类型 | 加密方式 | 密钥管理 | 说明 |
|----------|----------|----------|------|
| 业务数据 | AES-256-GCM | KMS (阿里云/AWS) | 数据库透明加密 (TDE) |
| 时序数据 | 列级加密 | KMS | 敏感字段加密，常规字段明文（查询性能） |
| 配置密钥 | AES-256 + Vault | HashiCorp Vault | 动态密钥，定期轮换 |
| 备份数据 | AES-256 | KMS | 备份文件加密后存储至OSS |
| 个人信息 | AES-256 + 脱敏 | KMS | 存储加密，展示脱敏 |

#### 5.1.3 认证与授权

```
┌───────────────────────────────────────────────────┐
│                  认证授权架构                       │
│                                                     │
│  ┌──────────┐    ┌──────────────┐    ┌──────────┐ │
│  │  JWT     │    │   OAuth2     │    │  RBAC    │ │
│  │ (用户认证)│    │ (第三方接入)  │    │ (权限控制)│ │
│  └──────────┘    └──────────────┘    └──────────┘ │
│                                                     │
│  Token策略:                                        │
│  - access_token: 30分钟过期, RS256签名             │
│  - refresh_token: 7天过期, 单次使用, 轮换机制       │
│  - 设备token: 长期有效, 定期轮换, 吊销列表          │
│                                                     │
│  RBAC模型:                                         │
│  - 超级管理员 (super_admin): 全部权限               │
│  - 租户管理员 (tenant_admin): 租户内全部权限        │
│  - 运维人员 (operator): 设备管理+数据查看           │
│  - 普通用户 (viewer): 仅数据查看                    │
└───────────────────────────────────────────────────┘
```

### 5.2 设备安全

#### 5.2.1 设备身份认证

| 机制 | 实现方式 | 说明 |
|------|----------|------|
| 设备证书 | X.509 设备证书 (ECC P-256) | 每台设备唯一证书，由设备CA签发 |
| 双向认证 | MQTT mTLS | 设备与Broker双向证书验证 |
| 证书轮换 | 自动续签 (ACME) | 证书有效期90天，到期前7天自动续签 |
| 吊销机制 | CRL + OCSP | 设备丢失/被盗时立即吊销证书 |

#### 5.2.2 固件安全

```
固件签名验证流程:

  云端构建                     边缘执行
  ──────────                  ──────────
  源码编译 → 固件包            收到OTA指令
      │                            │
      ▼                            ▼
  SHA-256 哈希计算              下载固件包
      │                            │
      ▼                            ▼
  RSA-2048 签名                 SHA-256 哈希验证
      │                            │
      ▼                            ▼
  签名 + 固件 → 上传            RSA 公钥验签
      │                            │
      ▼                            ▼
  MinIO 存储                    验证通过 → 应用更新
                                验证失败 → 丢弃 + 告警
```

#### 5.2.3 安全启动

- **EMS控制器**：ARM TrustZone + Secure Boot，从硬件Root of Trust建立信任链
- **启动链验证**：Bootloader → Kernel → RootFS → Application，逐级签名验证
- **防回滚**：固件版本单调递增检查，防止降级攻击

### 5.3 网络安全

#### 5.3.1 网络分区

```
┌─────────────────────────────────────────────────────────┐
│                    网络安全架构                           │
│                                                           │
│  ┌── 互联网 ──┐                                         │
│  │  WAF + CDN │ ← DDoS防护 + SQL注入/XSS过滤           │
│  └─────┬──────┘                                         │
│        │                                                  │
│  ┌─────▼──────────────────────────────────────────────┐  │
│  │  DMZ 区                                             │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │  │
│  │  │ API网关  │  │ 负载均衡 │  │  EMQX    │         │  │
│  │  └──────────┘  └──────────┘  └──────────┘         │  │
│  └─────┬──────────────────────────────────────────────┘  │
│        │                                                  │
│  ┌─────▼──────────────────────────────────────────────┐  │
│  │  应用区 (Business Network)                          │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │  │
│  │  │ 微服务   │  │ 数据库   │  │ 缓存     │         │  │
│  │  └──────────┘  └──────────┘  └──────────┘         │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  IoT 区 (IoT Network)  ← 独立VPC/子网             │  │
│  │  ┌──────────┐  ┌──────────┐                        │  │
│  │  │ MQTT集群 │  │ 协议网关 │                        │  │
│  │  └──────────┘  └──────────┘                        │  │
│  └────────────────────────────────────────────────────┘  │
│                                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  管理区 (Management Network) ← VPN接入              │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │  │
│  │  │ 监控     │  │ 日志     │  │ CI/CD    │         │  │
│  │  └──────────┘  └──────────┘  └──────────┘         │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### 5.3.2 访问控制策略

| 源 | 目的 | 协议 | 端口 | 说明 |
|----|------|------|------|------|
| 互联网 | DMZ | HTTPS | 443 | WAF过滤后进入 |
| 互联网 | DMZ | MQTT/TLS | 8883 | 设备接入 |
| DMZ | 应用区 | HTTP | 8080-8088 | 微服务内部通信 (mTLS) |
| 应用区 | IoT区 | MQTT | 1883 | 设备数据消费 |
| 管理区 | 应用区 | HTTP | 8080-8088 | 运维操作 (VPN) |
| 管理区 | 全部 | SSH | 22 | 紧急运维 (堡垒机) |
| IoT区 | 应用区 | AMQP | 5672 | EMQX→微服务数据桥接 |
| * | 互联网 | * | * | 默认拒绝 |

#### 5.3.3 WAF 规则

- SQL注入、XSS、命令注入检测与拦截
- API 速率限制：普通用户 100次/分钟，设备 1000次/分钟
- IP 黑名单/白名单动态管理
- 异常流量检测：突发流量自动触发DDoS防护

### 5.4 合规性

#### 5.4.1 数据保护合规

| 标准 | 要求 | 实施措施 |
|------|------|----------|
| **GDPR** | 个人数据保护 | 数据最小化采集、用户同意管理、数据删除权、数据可携带权、DPO指定 |
| **个人信息保护法** | 中国个人信息保护 | 隐私影响评估(PIA)、个人信息分类分级、跨境传输安全评估 |
| **等保2.0 二级** | 信息系统安全保护 | 身份鉴别、访问控制、安全审计、入侵防范、数据完整性 |

#### 5.4.2 电力行业合规

| 标准 | 编号 | 要求 | 实施措施 |
|------|------|------|----------|
| 光伏电站接入 | GB/T 19964 | 光伏电站接入电网技术规定 | 并网电能质量监测、防孤岛保护、低电压穿越 |
| 电能质量 | GB/T 14549 | 电能质量 公用电网谐波 | 谐波监测与治理、THD < 5% |
| 储能系统 | GB/T 36558 | 电力系统电化学储能系统通用技术条件 | 电池BMS安全保护、热失控预警、消防联动 |
| 逆变器并网 | GB/T 37408 | 光伏逆变器并网技术要求 | 频率/电压响应、功率控制、安全保护功能 |
| 通信安全 | GB/T 22239 | 信息安全技术 网络安全等级保护 | 网络分区、访问控制、安全审计 |

#### 5.4.3 安全审计

| 审计项 | 记录内容 | 保留期限 | 存储方式 |
|--------|----------|----------|----------|
| 用户操作 | 登录/登出/配置变更/模式切换 | 180天 | Loki日志 |
| 设备通信 | 连接/断开/指令/响应 | 90天 | TimescaleDB |
| 数据访问 | 查询/导出/删除 | 365天 | PostgreSQL |
| 系统事件 | 启停/扩缩容/异常 | 365天 | Loki日志 |
| 安全事件 | 认证失败/权限拒绝/入侵 | 3年 | 独立安全日志库 |

---

> **文档维护说明**：本文档随项目演进持续更新，重大架构变更需经技术委员会评审。  
> **变更记录**：

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| V1.0 | 2026-06-27 | 初始版本 | 项目组 |
