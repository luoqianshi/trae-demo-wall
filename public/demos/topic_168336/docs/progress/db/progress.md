# 数据库模块 - 进度跟踪

## 功能描述
- SQLite 数据库存储文件元数据
- 虚拟目录管理
- 删除记录审计

## 进度状态：✅ 已完成

### 已完成功能
- [x] 8 张核心表：file_metadata、virtual_directories、virtual_dir_files、deletion_records、delete_queue、tags、file_tags、recent_files
- [x] 索引优化（MD5、SHA256、路径、标签、最近文件）
- [x] 模块化重构（db/ 目录，拆分 schema、file_metadata、virtual_dir、deletion、tags、recent_files）
- [x] 文件元数据 CRUD
- [x] 虚拟目录 CRUD
- [x] 删除记录与队列管理
- [x] 物理删除流程
- [x] 文件按路径模糊搜索（search_files）
- [x] 高级搜索（关键字+扩展名+大小范围+哈希值组合搜索）
- [x] 数据库路径存储（db_path 字段）
- [x] get_db_path 命令接口
- [x] 标签 CRUD（创建、获取、更新、删除）
- [x] 文件-标签关联管理（添加/移除标签、按标签查文件）
- [x] 最近文件记录（自动清理旧记录，保留最近 100 条）
- [x] 文件排序查询（按名称/大小/创建时间/修改时间排序）
- [x] 文件过滤查询（按扩展名、大小范围过滤）
- [x] 分页查询（LIMIT/OFFSET + 总数统计）
- [x] 排序+过滤+分页组合查询
- [x] 文件路径更新（批量移动后更新）
- [x] 获取所有未删除文件列表

### 测试用例
- db/mod.rs: 数据库初始化测试
- db/file_metadata.rs: 哈希查询、分页查询、排序过滤测试
- db/virtual_dir.rs: 虚拟目录操作测试
- db/deletion.rs: 删除记录与队列测试
- db/tags.rs: 标签 CRUD、文件关联测试
- db/recent_files.rs: 记录访问、获取列表、自动清理测试