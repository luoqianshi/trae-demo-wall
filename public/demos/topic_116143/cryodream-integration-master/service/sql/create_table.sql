-- ============================================
-- 数据库初始化脚本
-- 默认管理员账号: admin / admin123
-- ============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS my_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 切换数据库
USE my_db;

-- ============================================
-- 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS user_info
(
    id            BIGINT AUTO_INCREMENT COMMENT '主键 ID' PRIMARY KEY,
    user_account  VARCHAR(256)                           NOT NULL COMMENT '账号',
    user_password VARCHAR(512)                           NOT NULL COMMENT '密码',
    user_name     VARCHAR(256)                           NULL COMMENT '用户昵称',
    user_avatar   VARCHAR(1024)                          NULL COMMENT '用户头像',
    user_profile  VARCHAR(512)                           NULL COMMENT '用户简介',
    user_phone    VARCHAR(20)                            NULL COMMENT '手机号',
    user_email    VARCHAR(256)                           NULL COMMENT '邮箱',
    user_birthday DATE                                   NULL COMMENT '出生日期',
    union_id      VARCHAR(256)                           NULL COMMENT '微信开放平台 ID',
    mp_open_id    VARCHAR(256)                           NULL COMMENT '公众号 OpenID',
    user_role     VARCHAR(256) DEFAULT 'user'            NOT NULL COMMENT '用户角色：user/admin/ban',
    create_time   DATETIME     DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    update_time   DATETIME     DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    is_delete     TINYINT      DEFAULT 0                 NOT NULL COMMENT '是否删除（0-未删除，1-已删除）',
    INDEX idx_union_id (union_id),
    INDEX idx_user_phone (user_phone),
    INDEX idx_user_email (user_email),
    UNIQUE INDEX idx_user_account (user_account)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 插入默认管理员账号（密码: admin123）
-- 密码加密方式：MD5(SALT + 密码)，SALT = "ice"（定义在 UserServiceImpl 中）
-- 使用 MySQL MD5 函数生成：MD5(CONCAT('ice', 'admin123'))
INSERT IGNORE INTO user_info (user_account, user_password, user_name, user_role)
VALUES ('admin', MD5(CONCAT('ice', 'admin123')), '管理员', 'admin');

-- ============================================
-- 帖子表
-- ============================================
CREATE TABLE IF NOT EXISTS post
(
    id          BIGINT AUTO_INCREMENT COMMENT '主键 ID' PRIMARY KEY,
    title       VARCHAR(512)                       NULL COMMENT '标题',
    content     TEXT                               NULL COMMENT '内容',
    tags        VARCHAR(1024)                      NULL COMMENT '标签列表（JSON 数组）',
    thumb_num   INT      DEFAULT 0                 NOT NULL COMMENT '点赞数',
    favour_num  INT      DEFAULT 0                 NOT NULL COMMENT '收藏数',
    user_id     BIGINT                             NOT NULL COMMENT '创建用户 ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    is_delete   TINYINT  DEFAULT 0                 NOT NULL COMMENT '是否删除（0-未删除，1-已删除）',
    INDEX idx_user_id (user_id),
    INDEX idx_create_time (create_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子表';

-- ============================================
-- 帖子点赞表（硬删除）
-- ============================================
CREATE TABLE IF NOT EXISTS post_thumb
(
    id          BIGINT AUTO_INCREMENT COMMENT '主键 ID' PRIMARY KEY,
    post_id     BIGINT                             NOT NULL COMMENT '帖子 ID',
    user_id     BIGINT                             NOT NULL COMMENT '用户 ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id),
    UNIQUE INDEX idx_post_user (post_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子点赞表';

-- ============================================
-- 帖子收藏表（硬删除）
-- ============================================
CREATE TABLE IF NOT EXISTS post_favour
(
    id          BIGINT AUTO_INCREMENT COMMENT '主键 ID' PRIMARY KEY,
    post_id     BIGINT                             NOT NULL COMMENT '帖子 ID',
    user_id     BIGINT                             NOT NULL COMMENT '用户 ID',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_post_id (post_id),
    INDEX idx_user_id (user_id),
    UNIQUE INDEX idx_post_user (post_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帖子收藏表';
