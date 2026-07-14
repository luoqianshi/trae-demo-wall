# Spring Boot数据库同步项目

## 项目介绍

这是一个基于Spring Boot的数据库同步项目，支持多组源-目标数据库的表结构和数据同步。项目具有以下特点：

- 支持多种数据库类型：MySQL、PostgreSQL、SQL Server
- 可配置的同步策略：全量同步和增量同步
- 自动化的表结构同步
- 高效的数据传输机制
- 支持简繁转换功能
- 完善的API接口
- 易于扩展和维护

## 技术栈

- Spring Boot 3.2.0
- Spring Web
- Spring JDBC
- HikariCP（连接池）
- 支持的数据库驱动：MySQL、PostgreSQL、SQL Server

## 安装步骤

1. **克隆项目**
   ```bash
   git clone https://github.com/your-repo/database-sync.git
   cd database-sync
   ```

2. **配置数据库连接**
   修改 `src/main/resources/application.yml` 文件中的数据库连接信息：
   ```yaml
   database-sync:
     sync-pairs:
       - name: "pair1"
         source:
           type: "mysql"
           url: "jdbc:mysql://localhost:3306/source_db"
           username: "root"
           password: "password"
         target:
           type: "postgresql"
           url: "jdbc:postgresql://localhost:5432/target_db"
           username: "postgres"
           password: "password"
         tables:
           - source-table: "users"
             target-table: "users"
             sync-mode: "full"
             zh-converter-config:
               enabled: true
               direction: "s2t"  # s2t: 简体到繁体, t2s: 繁体到简体
   ```

3. **构建项目**
   ```bash
   mvn clean package
   ```

4. **运行项目**
   ```bash
   java -jar target/database-sync-0.0.1-SNAPSHOT.jar
   ```

## 配置说明

### 同步配置结构

```yaml
database-sync:
  sync-pairs:
    - name: "同步对名称"
      source:
        type: "源数据库类型"  # mysql, postgresql, sqlserver
        url: "源数据库连接URL"
        username: "源数据库用户名"
        password: "源数据库密码"
      target:
        type: "目标数据库类型"  # mysql, postgresql, sqlserver
        url: "目标数据库连接URL"
        username: "目标数据库用户名"
        password: "目标数据库密码"
      tables:
        - source-table: "源表名"
          target-table: "目标表名"
          sync-mode: "同步模式"  # full（全量）或 incremental（增量）
          incremental-config:
            identifier-columns: ["id", "create_time"]  # 增量同步的标识符列
            identifier-expression: "ifnull(update_time, create_time)"  # 增量同步的表达式
          zh-converter-config:
            enabled: true  # 是否启用简繁转换
            direction: "s2t"  # s2t: 简体到繁体, t2s: 繁体到简体
  # 定时同步配置
  scheduler:
    tasks:
      - name: "hourly-sync"
        enabled: true  # 是否启用该任务
        cron: "0 0 * * * ?"  # 每小时执行一次
        sync-pairs: ["pair1", "pair2"]  # 要同步的配置对列表
      - name: "daily-sync"
        enabled: true  # 是否启用该任务
        cron: "0 0 0 * * ?"  # 每天凌晨执行一次
        sync-pairs: ["pair1"]  # 只同步pair1
```

### 同步模式说明

- **full（全量同步）**：先清空目标表，然后插入所有数据
- **incremental（增量同步）**：只同步新增或修改的数据，基于标识符列或表达式

### 简繁转换功能

项目支持对字符串类型字段进行简繁转换，可在表配置中启用：

```yaml
zh-converter-config:
  enabled: true  # 是否启用简繁转换
  direction: "s2t"  # s2t: 简体到繁体, t2s: 繁体到简体
```

- 只对字符串类型的字段进行转换
- 转换过程中会记录详细的日志
- 转换失败时会使用原始值，不影响同步流程

### SQL Server SSL连接配置

对于SQL Server数据库，项目已经内置了SSL连接处理：

- 自动添加 `encrypt=false` 参数禁用SSL加密
- 自动添加 `trustServerCertificate=true` 参数信任服务器证书
- 自动添加 `hostNameInCertificate=*` 参数禁用主机名验证

如果需要自定义SQL Server连接参数，可以在URL中直接指定：

```yaml
url: "jdbc:sqlserver://localhost:1433;database=testdb;encrypt=false;trustServerCertificate=true"
```

### 定时同步配置说明

#### 任务配置项

- **name**：任务名称，用于标识不同的定时任务
- **enabled**：是否启用该任务，默认为true
- **cron**：cron表达式，用于定义同步间隔，默认为每小时执行一次
- **sync-pairs**：要定时同步的配置对列表，为空时同步所有配置对

#### 多任务配置示例

```yaml
scheduler:
  tasks:
    - name: "task1"
      enabled: true
      cron: "0 0 * * * ?"  # 每小时执行
      sync-pairs: ["pair1"]
    - name: "task2"
      enabled: true
      cron: "0 0 0 * * ?"  # 每天执行
      sync-pairs: ["pair2"]
```

### Cron表达式示例

- `0 0 * * * ?` - 每小时执行一次
- `0 0 0 * * ?` - 每天凌晨执行一次
- `0 0 0 * * 1` - 每周一凌晨执行一次
- `0 0/30 * * * ?` - 每30分钟执行一次

## API接口

### 1. 获取所有同步配置
- **URL**: `/api/sync/configs`
- **Method**: `GET`
- **Response**: 所有同步配置列表

### 2. 触发所有同步任务
- **URL**: `/api/sync/all`
- **Method**: `POST`
- **Response**: 同步结果消息

### 3. 触发指定同步任务
- **URL**: `/api/sync/{pairName}`
- **Method**: `POST`
- **Path Variable**: `pairName` - 同步对名称
- **Response**: 同步结果消息

### 4. 清除连接池缓存
- **URL**: `/api/sync/clear-cache`
- **Method**: `POST`
- **Response**: 缓存清除结果消息

## 运行示例

### 1. 启动应用

运行项目后，应用会在 `http://localhost:8080` 上启动。

### 2. 触发同步

使用 curl 命令触发同步：

```bash
# 触发所有同步任务
curl -X POST http://localhost:8080/api/sync/all

# 触发指定同步任务
curl -X POST http://localhost:8080/api/sync/pair1
```

### 3. 查看同步状态

查看所有同步配置：

```bash
curl http://localhost:8080/api/sync/configs
```

## 注意事项

1. **数据库权限**：确保源数据库用户有SELECT权限，目标数据库用户有CREATE、INSERT、UPDATE、DELETE权限
2. **表结构兼容性**：不同数据库类型之间的表结构可能存在差异，需要确保字段类型兼容
3. **性能考虑**：对于大型表的同步，建议使用增量同步模式，或在低峰期进行全量同步
4. **SQL Server连接**：如果遇到SSL连接问题，项目会自动处理，无需手动配置
5. **简繁转换**：只对字符串类型字段进行转换，其他类型保持不变
6. **错误处理**：项目包含完善的错误处理，确保同步过程的稳定性

## 功能特性

1. **多数据库支持**：MySQL、PostgreSQL、SQL Server
2. **灵活的同步策略**：全量同步和增量同步
3. **智能的表结构同步**：自动处理表结构差异
4. **高效的数据传输**：使用批处理和连接池优化性能
5. **强大的简繁转换**：支持字符串字段的简繁转换
6. **完善的日志系统**：详细的同步过程记录
7. **友好的API接口**：方便集成和调用
8. **可靠的定时任务**：支持多任务配置

## 许可证

本项目采用 MIT 许可证，详情请参阅 LICENSE 文件。
