# 数据库建表规范

> MySQL 建表、字段约定与索引规范。

---

## 一、建表模板

```sql
CREATE TABLE IF NOT EXISTS `module_name` (
    `id` BIGINT NOT NULL COMMENT '主键',
    `field_name` VARCHAR(256) NOT NULL COMMENT '字段说明',
    `user_id` BIGINT NOT NULL COMMENT '关联用户 id',
    `status` TINYINT NOT NULL DEFAULT 0 COMMENT '状态（0 草稿 1 已发布）',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `is_delete` TINYINT NOT NULL DEFAULT 0 COMMENT '是否删除（0 未删 1 已删）',
    PRIMARY KEY (`id`),
    INDEX `idx_user_id` (`user_id`)
) ENGINE InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '模块说明';
```

---

## 二、关系表模板

```sql
CREATE TABLE IF NOT EXISTS `module_favour` (
    `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
    `module_id` BIGINT NOT NULL COMMENT '模块 id',
    `user_id` BIGINT NOT NULL COMMENT '用户 id',
    `create_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `update_time` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE INDEX `uk_module_user` (`module_id`, `user_id`)
) ENGINE InnoDB CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci COMMENT '模块收藏关系';
```

---

## 三、核心约定

| 约定 | 主业务表 | 关系表 |
|------|----------|--------|
| 主键 | `BIGINT NOT NULL`，雪花 ID | `BIGINT AUTO_INCREMENT` |
| 逻辑删除 | ✅ `is_delete` | ❌ 硬删除 |
| 防重 | — | 联合唯一索引 |

### 字段规范

| 规范 | 说明 |
|------|------|
| 命名 | `snake_case`，Java 侧 `camelCase` |
| 注释 | **每个表/字段必须有 COMMENT** |
| 时间 | `create_time` / `update_time` 数据库维护 |
| 字符集 | `utf8mb4` + `utf8mb4_unicode_ci` |
| 引擎 | `InnoDB` |
| 字段顺序 | `id` → 业务字段 → `create_time` → `update_time` → `is_delete` |

---

## 四、Entity 对应

```java
// 主业务表
@TableId(type = IdType.ASSIGN_ID)  // 雪花 ID
@TableLogic                        // 逻辑删除
@TableField("is_delete")
private Integer isDelete;

// 关系表
@TableId(type = IdType.AUTO)       // 自增
// 无 @TableLogic                  // 硬删除
```