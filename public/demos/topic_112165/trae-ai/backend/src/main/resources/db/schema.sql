-- ============================================================
-- 个人身体状况监控系统 数据库建表脚本
-- 数据库: MySQL 8.0
-- 字符集: utf8mb4
-- ============================================================

CREATE DATABASE IF NOT EXISTS health_monitor DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE health_monitor;

-- ============================================================
-- 1. 系统用户表（sys_user）
-- ============================================================
DROP TABLE IF EXISTS `sys_user`;
CREATE TABLE `sys_user` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `phone`       VARCHAR(20)  NOT NULL COMMENT '手机号（登录账号）',
    `password`    VARCHAR(100) NOT NULL DEFAULT '' COMMENT '密码（BCrypt加密）',
    `name`        VARCHAR(50)  NOT NULL DEFAULT '' COMMENT '姓名',
    `gender`      VARCHAR(10)  NOT NULL DEFAULT 'MALE' COMMENT '性别 MALE/FEMALE',
    `birth_date`  DATE         NULL COMMENT '出生日期',
    `height`      DECIMAL(5,1) NULL COMMENT '身高(cm)',
    `weight`      DECIMAL(5,1) NULL COMMENT '体重(kg)',
    `role`        VARCHAR(10)  NOT NULL DEFAULT 'USER' COMMENT '角色 USER/DOCTOR/ADMIN',
    `status`      TINYINT      NOT NULL DEFAULT 1 COMMENT '状态 1启用 0禁用',
    `deleted`     TINYINT      NOT NULL DEFAULT 0 COMMENT '逻辑删除 0未删 1已删',
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统用户表';

-- ============================================================
-- 2. 用户健康档案表（user_profile）
-- ============================================================
DROP TABLE IF EXISTS `user_profile`;
CREATE TABLE `user_profile` (
    `id`                 BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id`            BIGINT       NOT NULL COMMENT '用户ID',
    `medical_history`    TEXT         NULL COMMENT '既往病史',
    `allergy`            VARCHAR(500) NULL COMMENT '过敏史',
    `medication`         VARCHAR(500) NULL COMMENT '用药情况',
    `emergency_contact`  VARCHAR(100) NULL COMMENT '紧急联系人及电话',
    `created_at`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户健康档案表';

-- ============================================================
-- 3. 医生信息表（doctor_info）
-- ============================================================
DROP TABLE IF EXISTS `doctor_info`;
CREATE TABLE `doctor_info` (
    `id`            BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id`       BIGINT       NOT NULL COMMENT '用户ID（关联sys_user）',
    `title`         VARCHAR(50)  NULL COMMENT '职称',
    `department`    VARCHAR(50)  NULL COMMENT '科室',
    `specialties`   VARCHAR(500) NULL COMMENT '擅长领域',
    `license_no`    VARCHAR(50)  NULL COMMENT '执业证书编号',
    `license_img`   VARCHAR(255) NULL COMMENT '执业证书图片URL',
    `audit_status`  VARCHAR(20)  NOT NULL DEFAULT 'PENDING' COMMENT '审核状态 PENDING/APPROVED/REJECTED',
    `rating`        DECIMAL(3,1) NOT NULL DEFAULT 5.0 COMMENT '评分',
    `created_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='医生信息表';

-- ============================================================
-- 4. 健康指标大类表（health_category）
-- ============================================================
DROP TABLE IF EXISTS `health_category`;
CREATE TABLE `health_category` (
    `id`         BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `name`       VARCHAR(50) NOT NULL COMMENT '大类名称',
    `icon`       VARCHAR(50) NOT NULL DEFAULT '' COMMENT '图标（emoji）',
    `color`      VARCHAR(20) NOT NULL DEFAULT '' COMMENT '主题色',
    `sort_order` INT         NOT NULL DEFAULT 0 COMMENT '排序',
    `enabled`    TINYINT     NOT NULL DEFAULT 1 COMMENT '是否启用',
    `created_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='健康指标大类表';

-- ============================================================
-- 5. 健康指标项表（health_metric）
-- ============================================================
DROP TABLE IF EXISTS `health_metric`;
CREATE TABLE `health_metric` (
    `id`                  BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `category_id`         BIGINT       NOT NULL COMMENT '所属大类ID',
    `name`                VARCHAR(50)  NOT NULL COMMENT '指标名称',
    `unit`                VARCHAR(20)  NOT NULL DEFAULT '' COMMENT '计量单位',
    `normal_min`          DECIMAL(10,2) NULL COMMENT '正常范围下限',
    `normal_max`          DECIMAL(10,2) NULL COMMENT '正常范围上限',
    `warning_min`         DECIMAL(10,2) NULL COMMENT '预警阈值下限',
    `warning_max`         DECIMAL(10,2) NULL COMMENT '预警阈值上限',
    `danger_min`          DECIMAL(10,2) NULL COMMENT '危险阈值下限',
    `danger_max`          DECIMAL(10,2) NULL COMMENT '危险阈值上限',
    `applicable_gender`   VARCHAR(10)  NOT NULL DEFAULT 'ALL' COMMENT '适用性别 ALL/MALE/FEMALE',
    `age_min`             INT          NULL COMMENT '适用年龄下限',
    `age_max`             INT          NULL COMMENT '适用年龄上限',
    `enabled`             TINYINT      NOT NULL DEFAULT 1 COMMENT '是否启用',
    `sort_order`          INT          NOT NULL DEFAULT 0 COMMENT '排序',
    `created_at`          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_category_id` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='健康指标项表';

-- ============================================================
-- 6. 健康指标记录表（health_record）
-- ============================================================
DROP TABLE IF EXISTS `health_record`;
CREATE TABLE `health_record` (
    `id`          BIGINT        NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id`     BIGINT        NOT NULL COMMENT '用户ID',
    `metric_id`   BIGINT        NOT NULL COMMENT '指标项ID',
    `value`       VARCHAR(50)   NOT NULL COMMENT '指标值（字符串兼容文本型指标）',
    `unit`        VARCHAR(20)   NOT NULL DEFAULT '' COMMENT '计量单位（冗余）',
    `source`      VARCHAR(20)   NOT NULL DEFAULT 'MANUAL' COMMENT '数据来源 MANUAL/DEVICE/IMPORT',
    `device_id`   BIGINT        NULL COMMENT '设备ID（来源为DEVICE时）',
    `recorded_at` DATETIME      NOT NULL COMMENT '采集时间',
    `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_metric_time` (`user_id`, `metric_id`, `recorded_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='健康指标记录表';

-- ============================================================
-- 7. 告警记录表（alert_record）
-- ============================================================
DROP TABLE IF EXISTS `alert_record`;
CREATE TABLE `alert_record` (
    `id`         BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id`    BIGINT      NOT NULL COMMENT '用户ID',
    `metric_id`  BIGINT      NOT NULL COMMENT '指标项ID',
    `level`      VARCHAR(10) NOT NULL DEFAULT 'NORMAL' COMMENT '告警等级 NORMAL/WARNING/DANGER',
    `value`      VARCHAR(50) NOT NULL COMMENT '触发告警的值',
    `status`     VARCHAR(20) NOT NULL DEFAULT 'NEW' COMMENT '状态 NEW/ACKNOWLEDGED',
    `created_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_level_status` (`level`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='告警记录表';

-- ============================================================
-- 8. 健康建议模板表（advice_template）
-- ============================================================
DROP TABLE IF EXISTS `advice_template`;
CREATE TABLE `advice_template` (
    `id`         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `metric_id`  BIGINT       NULL COMMENT '关联指标项ID（NULL表示通用建议）',
    `level`      VARCHAR(10)  NOT NULL DEFAULT 'WARNING' COMMENT '告警等级 WARNING/DANGER',
    `title`      VARCHAR(100) NOT NULL COMMENT '建议标题',
    `content`    LONGTEXT     NOT NULL COMMENT '建议内容（富文本HTML）',
    `version`    INT          NOT NULL DEFAULT 1 COMMENT '版本号',
    `enabled`    TINYINT      NOT NULL DEFAULT 1 COMMENT '是否启用',
    `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_metric_level` (`metric_id`, `level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='健康建议模板表';

-- ============================================================
-- 9. 问诊会话表（consultation）
-- ============================================================
DROP TABLE IF EXISTS `consultation`;
CREATE TABLE `consultation` (
    `id`              BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id`         BIGINT       NOT NULL COMMENT '用户（患者）ID',
    `doctor_id`       BIGINT       NOT NULL COMMENT '医生ID',
    `type`            VARCHAR(10)  NOT NULL DEFAULT 'REALTIME' COMMENT '问诊类型 REALTIME/ASYNC',
    `status`          VARCHAR(20)  NOT NULL DEFAULT 'WAITING' COMMENT '状态 WAITING/IN_PROGRESS/CLOSED',
    `chief_complaint` TEXT         NULL COMMENT '主诉（异步问诊）',
    `symptom_desc`    TEXT         NULL COMMENT '症状描述',
    `duration`        VARCHAR(100) NULL COMMENT '持续时间',
    `accompanying`    VARCHAR(500) NULL COMMENT '伴随症状',
    `images`          VARCHAR(1000) NULL COMMENT '相关图片URL（JSON数组）',
    `reply_count`     INT          NOT NULL DEFAULT 0 COMMENT '追问次数（异步问诊）',
    `rating`          TINYINT      NULL COMMENT '用户评分 1-5',
    `rating_comment`  VARCHAR(500) NULL COMMENT '评价内容',
    `created_at`      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `closed_at`       DATETIME     NULL COMMENT '关闭时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_doctor_id` (`doctor_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='问诊会话表';

-- ============================================================
-- 10. 问诊消息表（consultation_message）
-- ============================================================
DROP TABLE IF EXISTS `consultation_message`;
CREATE TABLE `consultation_message` (
    `id`              BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `consultation_id` BIGINT       NOT NULL COMMENT '问诊会话ID',
    `sender_type`     VARCHAR(10)  NOT NULL COMMENT '发送者类型 USER/DOCTOR',
    `content_type`    VARCHAR(10)  NOT NULL DEFAULT 'TEXT' COMMENT '内容类型 TEXT/IMAGE/VOICE',
    `content`         TEXT         NOT NULL COMMENT '消息内容（文本/URL）',
    `sent_at`         DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
    `read_status`     TINYINT      NOT NULL DEFAULT 0 COMMENT '已读状态 0未读 1已读',
    PRIMARY KEY (`id`),
    KEY `idx_consultation_id` (`consultation_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='问诊消息表';

-- ============================================================
-- 11. 设备表（device）
-- ============================================================
DROP TABLE IF EXISTS `device`;
CREATE TABLE `device` (
    `id`           BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id`      BIGINT       NOT NULL COMMENT '绑定用户ID',
    `device_type`  VARCHAR(50)  NOT NULL COMMENT '设备类型（血压计/血糖仪等）',
    `model`        VARCHAR(100) NULL COMMENT '设备型号',
    `token`        VARCHAR(100) NOT NULL COMMENT '设备鉴权Token',
    `status`       VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE' COMMENT '状态 ACTIVE/INACTIVE',
    `bound_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '绑定时间',
    `last_sync_at` DATETIME     NULL COMMENT '最近同步时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_token` (`token`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='设备表';

-- ============================================================
-- 12. 健康报告表（health_report）
-- ============================================================
DROP TABLE IF EXISTS `health_report`;
CREATE TABLE `health_report` (
    `id`           BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id`      BIGINT      NOT NULL COMMENT '用户ID',
    `period_start` DATE        NOT NULL COMMENT '报告周期开始',
    `period_end`   DATE        NOT NULL COMMENT '报告周期结束',
    `report_type`  VARCHAR(20) NOT NULL DEFAULT 'MONTHLY' COMMENT '报告类型 WEEKLY/MONTHLY/CUSTOM',
    `content`      LONGTEXT    NULL COMMENT '报告内容（JSON）',
    `file_url`     VARCHAR(255) NULL COMMENT 'PDF文件URL',
    `created_at`   DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='健康报告表';

-- ============================================================
-- 13. 家庭组表（family_group）
-- ============================================================
DROP TABLE IF EXISTS `family_group`;
CREATE TABLE `family_group` (
    `id`         BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `owner_id`   BIGINT       NOT NULL COMMENT '创建者用户ID',
    `name`       VARCHAR(50)  NOT NULL COMMENT '家庭组名称',
    `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_owner_id` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='家庭组表';

-- ============================================================
-- 14. 家庭成员表（family_member）
-- ============================================================
DROP TABLE IF EXISTS `family_member`;
CREATE TABLE `family_member` (
    `id`              BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `group_id`        BIGINT      NOT NULL COMMENT '家庭组ID',
    `user_id`         BIGINT      NOT NULL COMMENT '成员用户ID',
    `role`            VARCHAR(10) NOT NULL DEFAULT 'MEMBER' COMMENT '角色 OWNER/MEMBER',
    `authorized_view` TINYINT     NOT NULL DEFAULT 0 COMMENT '是否授权查看指标 0否 1是',
    `created_at`      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_group_user` (`group_id`, `user_id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='家庭成员表';

-- ============================================================
-- 15. 健康计划表（health_plan）
-- ============================================================
DROP TABLE IF EXISTS `health_plan`;
CREATE TABLE `health_plan` (
    `id`           BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id`      BIGINT       NOT NULL COMMENT '用户ID',
    `type`         VARCHAR(50)  NOT NULL COMMENT '计划类型（WEIGHT_LOSS/BLOOD_PRESSURE等）',
    `goal`         VARCHAR(200) NOT NULL COMMENT '目标描述',
    `tasks`        TEXT         NULL COMMENT '每日任务（JSON数组）',
    `period_start` DATE         NOT NULL COMMENT '周期开始',
    `period_end`   DATE         NOT NULL COMMENT '周期结束',
    `progress`     INT          NOT NULL DEFAULT 0 COMMENT '进度百分比 0-100',
    `status`       VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE' COMMENT '状态 ACTIVE/COMPLETED/ABANDONED',
    `created_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='健康计划表';

-- ============================================================
-- 16. 计划打卡表（plan_checkin）
-- ============================================================
DROP TABLE IF EXISTS `plan_checkin`;
CREATE TABLE `plan_checkin` (
    `id`         BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `plan_id`    BIGINT      NOT NULL COMMENT '计划ID',
    `user_id`    BIGINT      NOT NULL COMMENT '用户ID',
    `task_date`  DATE        NOT NULL COMMENT '打卡日期',
    `completed`  TINYINT     NOT NULL DEFAULT 0 COMMENT '是否完成 0否 1是',
    `created_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_plan_date` (`plan_id`, `task_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='计划打卡表';

-- ============================================================
-- 17. 积分记录表（points_record）
-- ============================================================
DROP TABLE IF EXISTS `points_record`;
CREATE TABLE `points_record` (
    `id`         BIGINT      NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id`    BIGINT      NOT NULL COMMENT '用户ID',
    `points`     INT         NOT NULL COMMENT '积分数量（正数获得，负数消耗）',
    `type`       VARCHAR(10) NOT NULL COMMENT '类型 EARN/SPEND',
    `source`     VARCHAR(50) NOT NULL COMMENT '来源（CHECKIN/EXCHANGE/IMPROVE等）',
    `ref_id`     BIGINT      NULL COMMENT '关联ID（计划ID/兑换项ID等）',
    `created_at` DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分记录表';

-- ============================================================
-- 18. 积分余额表（points_balance）
-- ============================================================
DROP TABLE IF EXISTS `points_balance`;
CREATE TABLE `points_balance` (
    `id`         BIGINT   NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `user_id`    BIGINT   NOT NULL COMMENT '用户ID',
    `balance`    INT      NOT NULL DEFAULT 0 COMMENT '积分余额',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分余额表';

-- ============================================================
-- 19. 积分兑换商品表（points_exchange）
-- ============================================================
DROP TABLE IF EXISTS `points_exchange`;
CREATE TABLE `points_exchange` (
    `id`          BIGINT       NOT NULL AUTO_INCREMENT COMMENT '主键ID',
    `item_name`   VARCHAR(100) NOT NULL COMMENT '商品名称',
    `description` VARCHAR(500) NULL COMMENT '商品描述',
    `points_cost` INT          NOT NULL COMMENT '兑换所需积分',
    `stock`       INT          NOT NULL DEFAULT 0 COMMENT '库存',
    `image_url`   VARCHAR(255) NULL COMMENT '商品图片URL',
    `enabled`     TINYINT      NOT NULL DEFAULT 1 COMMENT '是否上架',
    `created_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分兑换商品表';
