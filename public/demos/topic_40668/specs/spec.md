# TIA Portal Openness MCP Server 规格说明书

## Why
西门子 TIA Portal 是工业自动化领域广泛使用的编程环境，手动操作效率低且易出错。通过 TIA Portal Openness API 封装为 MCP Server，可以让 AI Agent 自动化执行项目创建、程序块管理、变量表操作、PLC 程序检查与生成等任务，提升开发效率。

## What Changes
- 新增一个基于 Python 的 MCP Server，通过 TIA Portal Openness 接口与 TIA Portal 交互
- 支持 MCP 协议，任意 MCP 兼容 Agent 均可接入
- 提供项目管理、块导入导出、变量表管理、设备结构生成、批量处理、检查与生成 PLC 程序等功能

## Impact
- 新增能力：MCP Server 提供 TIA Portal 自动化能力
- 新增代码：TIA Portal Openness MCP Server

## ADDED Requirements

### Requirement: MCP Server 基础架构
系统 SHALL 提供一个基于 Python 的 MCP Server，通过 stdio 协议通信，支持以下基础能力：
- 健康检查（ping）
- 服务器能力查询
- 错误处理与日志记录

#### Scenario: 服务器启动
- **WHEN** MCP Server 启动并与 Agent 建立连接
- **THEN** 服务器返回协议版本和支持的能力列表

### Requirement: 项目管理
系统 SHALL 提供项目管理能力：
- 创建新 TIA Portal 项目
- 打开/关闭已有项目
- 保存项目
- 获取项目信息（设备列表、PLC 型号等）
- 复制项目

#### Scenario: 创建新项目
- **WHEN** Agent 调用 `project_create` 工具，指定项目路径和名称
- **THEN** 在指定路径创建新的 TIA Portal 项目，并返回项目句柄

#### Scenario: 打开已有项目
- **WHEN** Agent 调用 `project_open` 工具，指定项目文件路径
- **THEN** TIA Portal 启动（如未启动）并打开指定项目，返回项目句柄

### Requirement: 块（Block）导入导出
系统 SHALL 提供块导入导出能力：
- 导出指定块（FB、FC、OB、DB）到文件
- 批量导出所有块
- 导入块从文件
- 块内容读取（支持 XML 格式）

#### Scenario: 导出块
- **WHEN** Agent 调用 `block_export` 工具，指定项目路径、块类型和块名称
- **THEN** 将指定块导出为 XML 文件到指定目录

#### Scenario: 批量导出块
- **WHEN** Agent 调用 `blocks_export_all` 工具，指定项目路径
- **THEN** 导出项目中所有块（FB、FC、OB、DB）到目标目录，结构保持

### Requirement: 变量表管理
系统 SHALL 提供变量表管理能力：
- 读取 PLC 变量表
- 添加/修改/删除 PLC 变量
- 批量添加变量
- 导出变量表到 CSV/JSON

#### Scenario: 修改变量表
- **WHEN** Agent 调用 `variable_modify` 工具，指定变量名、类型、地址
- **THEN** 在 PLC 变量表中添加或更新该变量

### Requirement: 设备结构生成
系统 SHALL 提供设备结构生成能力：
- 扫描项目中的设备
- 生成设备树结构（CPU、模块、分布式 IO）
- 获取设备属性（型号、固件版本、订货号）

#### Scenario: 生成设备结构
- **WHEN** Agent 调用 `device_generate_structure` 工具，指定项目路径
- **THEN** 返回项目的设备树结构，包含所有 PLC 和模块信息

### Requirement: PLC 程序检查
系统 SHALL 提供 PLC 程序检查能力：
- 运行 TIA Portal 程序块编译检查
- 获取编译错误和警告列表
- 检查块一致性
- 验证 PLC 变量引用

#### Scenario: 检查 PLC 程序
- **WHEN** Agent 调用 `plc_check` 工具，指定项目路径和 PLC 名称
- **THEN** 执行编译检查，返回错误列表（如有）和检查状态

### Requirement: 批量处理 PLC 程序
系统 SHALL 提供批量处理能力：
- 批量编译多个块
- 批量复制块
- 批量重命名块
- 批量删除块
- 批量修改块属性

#### Scenario: 批量编译
- **WHEN** Agent 调用 `blocks_batch_compile` 工具，指定块列表
- **THEN** 依次编译指定块，返回每个块的编译结果

### Requirement: 梯形图（LD）程序生成
系统 SHALL 提供梯形图程序生成能力：
- 从 XML 模板或 JSON 描述生成梯形图块
- 支持基本指令（接触器、线圈、计时器、计数器）
- 支持复杂网络结构
- 验证生成的梯形图语法

#### Scenario: 生成梯形图块
- **WHEN** Agent 调用 `ladder_generate` 工具，指定块名称和网络描述
- **THEN** 在项目中创建指定名称的 PLC 块，包含描述的梯形图逻辑

## REMOVED Requirements
无

## 技术约束
- Python 3.8+
- TIA Portal Openness API V16 (Siemens.Engineering.V16)
- MCP Python SDK
- Windows 平台（因为 TIA Portal 仅支持 Windows）

## 配置要求
- TIA Portal V16 及 Openness 组件必须已安装
- 需要有效的 TIA Portal V16 许可证
- 运行用户需要有管理员权限（用于访问 TIA Portal API）
- Openness API 程序集引用：`Siemens.Engineering.Version.dll`（V16 版本）
