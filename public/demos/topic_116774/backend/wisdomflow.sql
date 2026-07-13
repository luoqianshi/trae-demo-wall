-- =====================================================
-- 智萃 WisdomFlow 数据库初始化脚本
-- 可直接在 Navicat 中运行
-- 默认账号密码: admin / admin123
-- =====================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `wisdomflow`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE `wisdomflow`;

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. 用户表
-- =====================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `real_name` VARCHAR(50) DEFAULT NULL,
  `phone` VARCHAR(20) DEFAULT NULL,
  `role` ENUM('admin','expert','employee') NOT NULL DEFAULT 'employee',
  `department` VARCHAR(100) DEFAULT NULL,
  `position` VARCHAR(50) DEFAULT NULL,
  `expertise_tags` TEXT DEFAULT NULL,
  `bio` TEXT DEFAULT NULL,
  `contribution_points` INT DEFAULT 0,
  `status` ENUM('active','inactive') DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`),
  UNIQUE KEY `uk_phone` (`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- =====================================================
-- 2. 访谈记录表
-- =====================================================
DROP TABLE IF EXISTS `interview_records`;
CREATE TABLE `interview_records` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `expert_id` INT NOT NULL,
  `topic` VARCHAR(200) NOT NULL,
  `status` ENUM('draft','in_progress','completed') NOT NULL DEFAULT 'draft',
  `mode` ENUM('text','voice','video') NOT NULL DEFAULT 'text',
  `duration` INT DEFAULT NULL COMMENT '访谈时长(秒)',
  `transcript` LONGTEXT DEFAULT NULL COMMENT '访谈记录全文',
  `summary` TEXT DEFAULT NULL COMMENT 'AI摘要',
  `confidence_score` DECIMAL(3,2) DEFAULT NULL COMMENT '置信度',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `completed_at` DATETIME DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_expert_id` (`expert_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_interview_expert` FOREIGN KEY (`expert_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='访谈记录表';

-- =====================================================
-- 3. 知识条目表
-- =====================================================
DROP TABLE IF EXISTS `knowledge_items`;
CREATE TABLE `knowledge_items` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `interview_id` INT DEFAULT NULL,
  `title` VARCHAR(200) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `type` ENUM('sop','checklist','decision_tree','article') NOT NULL DEFAULT 'article',
  `tags` TEXT DEFAULT NULL COMMENT '标签(逗号分隔)',
  `confidence_score` DECIMAL(3,2) DEFAULT 0.80,
  `status` ENUM('draft','pending','verified','rejected') DEFAULT 'draft',
  `is_verified` TINYINT(1) DEFAULT 0,
  `view_count` INT DEFAULT 0,
  `usage_count` INT DEFAULT 0,
  `created_by` INT DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_interview_id` (`interview_id`),
  KEY `idx_created_by` (`created_by`),
  KEY `idx_status` (`status`),
  KEY `idx_type` (`type`),
  CONSTRAINT `fk_knowledge_interview` FOREIGN KEY (`interview_id`) REFERENCES `interview_records` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_knowledge_creator` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识条目表';

-- =====================================================
-- 4. SOP文档表
-- =====================================================
DROP TABLE IF EXISTS `sop_documents`;
CREATE TABLE `sop_documents` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `knowledge_id` INT DEFAULT NULL,
  `title` VARCHAR(200) NOT NULL,
  `steps` TEXT NOT NULL COMMENT 'SOP步骤(JSON格式)',
  `flowchart_data` TEXT DEFAULT NULL COMMENT '流程图数据(JSON格式)',
  `version` VARCHAR(20) DEFAULT 'v1.0',
  `usage_count` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_knowledge_id` (`knowledge_id`),
  CONSTRAINT `fk_sop_knowledge` FOREIGN KEY (`knowledge_id`) REFERENCES `knowledge_items` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='SOP标准作业文档表';

-- =====================================================
-- 5. 标签表
-- =====================================================
DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(50) NOT NULL,
  `category` VARCHAR(50) DEFAULT NULL,
  `color` VARCHAR(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tag_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='标签表';

-- =====================================================
-- 6. 知识-标签关联表
-- =====================================================
DROP TABLE IF EXISTS `knowledge_tags`;
CREATE TABLE `knowledge_tags` (
  `knowledge_id` INT NOT NULL,
  `tag_id` INT NOT NULL,
  PRIMARY KEY (`knowledge_id`, `tag_id`),
  KEY `idx_tag_id` (`tag_id`),
  CONSTRAINT `fk_kt_knowledge` FOREIGN KEY (`knowledge_id`) REFERENCES `knowledge_items` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_kt_tag` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='知识-标签多对多关联表';

-- =====================================================
-- 7. 贡献记录表
-- =====================================================
DROP TABLE IF EXISTS `contributions`;
CREATE TABLE `contributions` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `type` ENUM('interview','verify','use') NOT NULL,
  `target_id` INT DEFAULT NULL,
  `points` INT NOT NULL,
  `description` VARCHAR(200) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_contribution_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户贡献记录表';


-- =====================================================
-- 种子数据
-- =====================================================

-- 用户数据 (密码统一为 admin123)
-- bcrypt hash: $2b$10$5pdpywYY1v88ZtsHfoszk.3G0iDOz7k3U8FB6hXxpDo/z6sBZ8rle
INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `real_name`, `phone`, `role`, `department`, `position`, `expertise_tags`, `bio`, `contribution_points`, `status`) VALUES
(1, 'admin', 'admin@wisdomflow.com', '$2b$10$5pdpywYY1v88ZtsHfoszk.3G0iDOz7k3U8FB6hXxpDo/z6sBZ8rle', '系统管理员', '13800138000', 'admin', '技术部', '技术总监', '管理,架构', '负责系统整体架构设计和运维管理，拥有10年技术管理经验。', 500, 'active'),
(2, 'zhangwei', 'zhangwei@wisdomflow.com', '$2b$10$5pdpywYY1v88ZtsHfoszk.3G0iDOz7k3U8FB6hXxpDo/z6sBZ8rle', '张伟', '13800138001', 'expert', '研发中心', '高级工程师', 'Java,微服务,架构设计', '专注于微服务架构和分布式系统设计，在高并发场景有丰富经验。', 320, 'active'),
(3, 'lina', 'lina@wisdomflow.com', '$2b$10$5pdpywYY1v88ZtsHfoszk.3G0iDOz7k3U8FB6hXxpDo/z6sBZ8rle', '李娜', '13800138002', 'expert', '产品部', '产品经理', '产品设计,用户研究', '擅长用户研究和产品设计方法论，主导过多款产品从0到1的设计。', 280, 'active'),
(4, 'wangfang', 'wangfang@wisdomflow.com', '$2b$10$5pdpywYY1v88ZtsHfoszk.3G0iDOz7k3U8FB6hXxpDo/z6sBZ8rle', '王芳', '13800138003', 'employee', '运营部', '运营专员', '内容运营,数据分析', '负责内容运营和数据分析工作，对用户增长有深入研究。', 150, 'active'),
(5, 'liuyang', 'liuyang@wisdomflow.com', '$2b$10$5pdpywYY1v88ZtsHfoszk.3G0iDOz7k3U8FB6hXxpDo/z6sBZ8rle', '刘洋', '13800138004', 'employee', '客服部', '客服主管', '客户服务,流程管理', '客服团队负责人，致力于提升客户服务体验和流程标准化。', 120, 'active'),
(6, 'expert_zhang', 'zhang@wisdomflow.com', '$2b$10$5pdpywYY1v88ZtsHfoszk.3G0iDOz7k3U8FB6hXxpDo/z6sBZ8rle', '张明', '13800138005', 'expert', '研发部', '高级工程师', 'Java,Spring Boot,微服务,架构设计', '资深后端架构师，在微服务和云原生领域有丰富经验。', 580, 'active'),
(7, 'expert_li', 'li@wisdomflow.com', '$2b$10$5pdpywYY1v88ZtsHfoszk.3G0iDOz7k3U8FB6hXxpDo/z6sBZ8rle', '李华', '13800138006', 'expert', '产品部', '产品总监', '产品设计,用户体验,需求分析', '产品总监，专注于用户体验和数据驱动的产品决策。', 420, 'active'),
(8, 'employee_wang', 'wang@wisdomflow.com', '$2b$10$5pdpywYY1v88ZtsHfoszk.3G0iDOz7k3U8FB6hXxpDo/z6sBZ8rle', '王芳', '13800138007', 'employee', '研发部', '前端工程师', 'Vue,React,TypeScript', '前端开发工程师，擅长Vue和React生态，关注性能优化。', 150, 'active'),
(9, 'employee_chen', 'chen@wisdomflow.com', '$2b$10$5pdpywYY1v88ZtsHfoszk.3G0iDOz7k3U8FB6hXxpDo/z6sBZ8rle', '陈强', '13800138008', 'employee', '运维部', '运维工程师', 'Linux,Docker,Kubernetes', '运维工程师，负责系统部署和云原生运维，熟悉Kubernetes。', 80, 'active'),
(10, 'employee_liu', 'liu@wisdomflow.com', '$2b$10$5pdpywYY1v88ZtsHfoszk.3G0iDOz7k3U8FB6hXxpDo/z6sBZ8rle', '刘洋', '13800138009', 'employee', '市场部', '市场专员', '数据分析,市场调研', '市场专员，负责数据分析和市场调研工作。', 45, 'active'),
(11, 'user', 'user@wisdomflow.com', '$2b$10$ujG77pMxutckKwdXTnXyz.w341NCA5hqSkqNMVcpJg70XfUBrbzLa', '普通用户', '13800138010', 'employee', '综合部', '职员', '文档处理', '公司职员，负责文档处理和日常办公工作。', 20, 'active');

-- 访谈记录数据
INSERT INTO `interview_records` (`id`, `expert_id`, `topic`, `status`, `mode`, `duration`, `transcript`, `summary`, `confidence_score`, `created_at`, `completed_at`) VALUES
(1, 2, '微服务架构设计最佳实践', 'completed', 'voice', 3600, '访谈记录：张伟分享了微服务架构设计的核心原则，包括服务拆分粒度、数据一致性、服务治理等方面的经验...', '本次访谈围绕微服务架构设计展开，重点讨论了服务拆分策略、数据一致性保障、服务治理框架选型等关键话题。专家分享了在实际项目中的踩坑经验和解决方案。', 0.92, '2026-07-01 10:00:00', '2026-07-01 11:00:00'),
(2, 3, '用户研究与产品需求分析方法', 'completed', 'video', 2700, '访谈记录：李娜详细介绍了用户研究的全流程，从用户画像到需求优先级排序...', '访谈涵盖了用户研究的完整方法论，包括定性研究、定量研究、用户画像构建、需求分析与优先级评估等核心内容。', 0.88, '2026-07-03 14:00:00', '2026-07-03 14:45:00'),
(3, 2, '高并发系统性能优化策略', 'in_progress', 'text', 1800, '正在进行的文字访谈，讨论高并发场景下的性能优化方案...', NULL, NULL, '2026-07-08 09:00:00', NULL),
(4, 5, '客户服务标准化流程建设', 'completed', 'voice', 3000, '访谈记录：刘洋分享了客服团队从非标准化到标准化的转型过程...', '本次访谈总结了客服标准化流程建设的三个阶段：流程梳理、标准制定、持续优化，以及每个阶段的关键成功因素。', 0.85, '2026-07-05 13:00:00', '2026-07-05 13:50:00'),
(5, 3, '数据驱动的产品迭代决策', 'completed', 'text', 2400, '访谈记录：李娜分享了如何通过数据分析驱动产品的迭代方向和功能优先级排序...', '探讨如何通过数据分析驱动产品的迭代方向和功能优先级排序，分享实战中的数据指标体系建设经验。', 0.85, '2026-07-01 10:15:00', '2026-07-01 10:55:00'),
(6, 6, '需求优先级评估决策树', 'completed', 'text', 3000, '访谈记录：张明分享了需求优先级评估的方法论和决策框架...', '讲解需求优先级评估的决策维度，包括用户价值、商业价值、实现成本和紧急程度，以及评估流程和决策树模型。', 0.87, '2026-06-25 09:00:00', '2026-06-25 09:50:00'),
(7, 7, '客户服务标准化流程建设', 'completed', 'voice', 2700, '访谈记录：李华分享了客户服务流程标准化建设的方法论...', '分享客户服务流程标准化建设的方法论，包括服务SLA制定、质量监控体系和持续改进机制。', 0.78, '2026-06-18 14:00:00', '2026-06-18 14:45:00'),
(8, 6, '微服务架构设计最佳实践', 'draft', 'video', NULL, NULL, NULL, NULL, '2026-07-10 11:00:00', NULL);

-- 知识条目数据
INSERT INTO `knowledge_items` (`id`, `interview_id`, `title`, `content`, `type`, `category`, `tags`, `confidence_score`, `status`, `is_verified`, `view_count`, `usage_count`, `created_by`, `created_at`) VALUES
(1, 1, '微服务架构拆分原则与最佳实践', '## 微服务架构拆分原则\n\n### 1. 单一职责原则\n每个微服务应该只负责一个业务功能领域...\n\n### 2. 服务自治\n每个服务应该独立部署、独立扩展、独立数据存储...\n\n### 3. 合理的拆分粒度\n过粗无法发挥微服务优势，过细增加运维成本...', 'sop', 'SOP文档', '微服务,架构设计,后端', 0.92, 'verified', 1, 156, 43, 1, '2026-07-02 09:00:00'),
(2, 1, '微服务数据一致性保障方案', '## 数据一致性保障\n\n### 最终一致性\n采用Saga模式实现跨服务事务...\n\n### 事件驱动\n通过消息队列实现服务间异步通信...\n\n### 补偿机制\n设计完善的补偿事务处理失败场景...', 'article', '文章', '微服务,数据一致性,分布式', 0.88, 'verified', 1, 98, 27, 1, '2026-07-02 10:30:00'),
(3, 2, '用户研究方法论完整指南', '## 用户研究全流程\n\n### 1. 研究目标定义\n明确研究要解决的核心问题...\n\n### 2. 研究方法选择\n定性研究：深度访谈、焦点小组\n定量研究：问卷调查、数据分析...\n\n### 3. 用户画像构建\n基于研究数据构建典型用户画像...', 'checklist', '检查清单', '用户研究,产品设计,方法论', 0.90, 'verified', 1, 203, 67, 1, '2026-07-04 09:00:00'),
(4, 4, '客服标准化流程SOP', '## 客服标准作业流程\n\n### 步骤1：客户问题分类\n- 技术类问题 → 转技术支持\n- 业务类问题 → 按业务流程处理\n- 投诉类问题 → 升级主管处理\n\n### 步骤2：标准应答话术\n使用统一的开场白和结束语...\n\n### 步骤3：工单记录规范\n所有交互必须记录在工单系统中...', 'sop', 'SOP文档', '客服,流程管理,标准化', 0.85, 'verified', 1, 312, 89, 1, '2026-07-06 10:00:00'),
(5, 2, '需求优先级评估决策树', '## 需求优先级评估\n\n### 决策维度\n1. 用户价值：影响多少用户？\n2. 商业价值：对营收的影响？\n3. 实现成本：需要多少开发资源？\n4. 紧急程度：是否有时间窗口约束？\n\n### 评估流程\n高价值+低成本 → 立即排期\n高价值+高成本 → 规划排期\n低价值+低成本 → 放入待办池\n低价值+高成本 → 暂不考虑', 'decision_tree', '决策树', '需求管理,产品决策,优先级', 0.87, 'pending', 0, 45, 12, 1, '2026-07-09 11:00:00'),
(6, 3, '高并发性能优化检查清单', '## 性能优化检查清单\n\n### 数据库层\n- [ ] 索引是否合理\n- [ ] 是否存在慢查询\n- [ ] 是否需要读写分离\n- [ ] 是否需要分库分表\n\n### 应用层\n- [ ] 是否引入缓存\n- [ ] 是否存在N+1查询\n- [ ] 异步处理是否完善\n- [ ] 连接池配置是否合理\n\n### 基础设施\n- [ ] CDN是否配置\n- [ ] 负载均衡是否就绪\n- [ ] 监控告警是否覆盖', 'checklist', '检查清单', '性能优化,高并发,后端', 0.80, 'draft', 0, 12, 3, 1, '2026-07-10 09:00:00');

-- SOP文档数据
INSERT INTO `sop_documents` (`id`, `knowledge_id`, `title`, `category`, `steps`, `flowchart_data`, `version`, `usage_count`, `created_at`) VALUES
(1, 1, '微服务拆分标准作业流程', '标准流程', '[{"step":1,"title":"业务域识别","desc":"分析业务流程，识别核心业务域"},{"step":2,"title":"服务边界定义","desc":"根据业务域定义服务边界和职责"},{"step":3,"title":"API设计","desc":"设计服务间通信API和契约"},{"step":4,"title":"数据存储规划","desc":"为每个服务规划独立的数据存储"},{"step":5,"title":"服务治理配置","desc":"配置服务注册发现、负载均衡、熔断降级"}]', '{"nodes":[{"id":"start","label":"开始"},{"id":"step1","label":"业务域识别"},{"id":"step2","label":"服务边界定义"},{"id":"step3","label":"API设计"},{"id":"step4","label":"数据存储规划"},{"id":"step5","label":"服务治理配置"},{"id":"end","label":"完成"}],"edges":[{"from":"start","to":"step1"},{"from":"step1","to":"step2"},{"from":"step2","to":"step3"},{"from":"step3","to":"step4"},{"from":"step4","to":"step5"},{"from":"step5","to":"end"}]}', 'v1.2', 43, '2026-07-02 14:00:00'),
(2, 4, '客服工单处理标准流程', '标准流程', '[{"step":1,"title":"接收工单","desc":"接收并确认客户问题"},{"step":2,"title":"问题分类","desc":"按类型将工单分类"},{"step":3,"title":"标准应答","desc":"使用标准话术初步回复"},{"step":4,"title":"处理或转交","desc":"自行处理或转交对应团队"},{"step":5,"title":"记录与关闭","desc":"记录处理结果并关闭工单"}]', '{"nodes":[{"id":"start","label":"接收工单"},{"id":"classify","label":"问题分类"},{"id":"tech","label":"技术问题→技术支持"},{"id":"biz","label":"业务问题→业务处理"},{"id":"complaint","label":"投诉问题→升级主管"},{"id":"end","label":"记录关闭"}],"edges":[{"from":"start","to":"classify"},{"from":"classify","to":"tech"},{"from":"classify","to":"biz"},{"from":"classify","to":"complaint"},{"from":"tech","to":"end"},{"from":"biz","to":"end"},{"from":"complaint","to":"end"}]}', 'v2.0', 89, '2026-07-06 14:00:00'),
(3, 3, '用户研究执行SOP', '标准流程', '[{"step":1,"title":"研究目标定义","desc":"明确研究要解决的核心问题"},{"step":2,"title":"研究方案设计","desc":"选择研究方法并设计方案"},{"step":3,"title":"执行研究","desc":"按照方案执行访谈或问卷"},{"step":4,"title":"数据分析","desc":"整理和分析研究数据"},{"step":5,"title":"输出报告","desc":"撰写研究报告并分享结论"}]', NULL, 'v1.0', 67, '2026-07-04 15:00:00');

-- 标签数据
INSERT INTO `tags` (`id`, `name`, `category`, `color`) VALUES
(1, '微服务', '技术', '#4096ff'),
(2, '架构设计', '技术', '#667eea'),
(3, '后端', '技术', '#52c41a'),
(4, '用户研究', '产品', '#faad14'),
(5, '产品设计', '产品', '#eb2f96'),
(6, '方法论', '通用', '#722ed1'),
(7, '客服', '运营', '#13c2c2'),
(8, '流程管理', '管理', '#fa8c16'),
(9, '标准化', '管理', '#f5222d'),
(10, '数据一致性', '技术', '#2f54eb'),
(11, '分布式', '技术', '#08979c'),
(12, '需求管理', '产品', '#c41d7f'),
(13, '产品决策', '产品', '#d4380d'),
(14, '优先级', '通用', '#5b8c00'),
(15, '性能优化', '技术', '#096dd9'),
(16, '高并发', '技术', '#fa541c');

-- 知识-标签关联数据
INSERT INTO `knowledge_tags` (`knowledge_id`, `tag_id`) VALUES
(1, 1), (1, 2), (1, 3),
(2, 1), (2, 10), (2, 11),
(3, 4), (3, 5), (3, 6),
(4, 7), (4, 8), (4, 9),
(5, 12), (5, 13), (5, 14),
(6, 15), (6, 16), (6, 3);

-- 贡献记录数据
INSERT INTO `contributions` (`id`, `user_id`, `type`, `target_id`, `points`, `description`, `created_at`) VALUES
(1, 2, 'interview', 1, 50, '完成微服务架构设计访谈', '2026-07-01 11:00:00'),
(2, 1, 'verify', 1, 20, '验证微服务架构拆分知识条目', '2026-07-02 09:30:00'),
(3, 1, 'verify', 2, 20, '验证微服务数据一致性知识条目', '2026-07-02 11:00:00'),
(4, 3, 'interview', 2, 50, '完成用户研究方法论访谈', '2026-07-03 14:45:00'),
(5, 1, 'verify', 3, 20, '验证用户研究方法论知识条目', '2026-07-04 09:30:00'),
(6, 5, 'interview', 4, 50, '完成客服标准化流程访谈', '2026-07-05 13:50:00'),
(7, 1, 'verify', 4, 20, '验证客服标准化SOP知识条目', '2026-07-06 10:30:00'),
(8, 2, 'interview', 3, 30, '进行高并发性能优化访谈（进行中）', '2026-07-08 09:30:00'),
(9, 4, 'use', 4, 10, '使用客服SOP处理工单', '2026-07-07 10:00:00'),
(10, 4, 'use', 3, 10, '参考用户研究方法论', '2026-07-08 14:00:00'),
(11, 5, 'use', 4, 10, '使用客服SOP培训新员工', '2026-07-09 09:00:00'),
(12, 1, 'verify', 5, 20, '审核需求优先级评估知识条目', '2026-07-09 14:00:00');

-- =====================================================
-- 8. 收藏表
-- =====================================================
DROP TABLE IF EXISTS `favorites`;
CREATE TABLE `favorites` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `target_type` ENUM('knowledge','sop','interview') NOT NULL,
  `target_id` INT NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_target` (`target_type`, `target_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏表';

INSERT INTO `favorites` (`user_id`, `target_type`, `target_id`, `created_at`) VALUES
(2, 'knowledge', 1, '2026-07-02 10:00:00'),
(2, 'sop', 1, '2026-07-03 14:00:00'),
(3, 'knowledge', 3, '2026-07-04 09:00:00'),
(4, 'knowledge', 4, '2026-07-05 11:00:00'),
(4, 'sop', 2, '2026-07-06 15:00:00'),
(5, 'knowledge', 5, '2026-07-07 10:30:00');

-- =====================================================
-- 9. 任务表
-- =====================================================
DROP TABLE IF EXISTS `tasks`;
CREATE TABLE `tasks` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `priority` ENUM('high','medium','low') DEFAULT 'medium',
  `deadline` DATETIME DEFAULT NULL,
  `completed` TINYINT(1) DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='任务表';

INSERT INTO `tasks` (`user_id`, `title`, `priority`, `deadline`, `completed`, `created_at`) VALUES
(2, '完成微服务架构设计文档', 'high', '2026-07-15 18:00:00', 0, '2026-07-10 09:00:00'),
(2, '代码审查：订单服务', 'medium', '2026-07-13 18:00:00', 1, '2026-07-11 10:00:00'),
(3, '用户调研报告整理', 'high', '2026-07-14 18:00:00', 0, '2026-07-10 14:00:00'),
(3, '产品需求评审', 'medium', '2026-07-12 18:00:00', 0, '2026-07-11 09:00:00'),
(4, '客服流程优化方案', 'medium', '2026-07-16 18:00:00', 0, '2026-07-10 11:00:00'),
(5, '培训新员工', 'low', '2026-07-18 18:00:00', 0, '2026-07-11 14:00:00');

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- 完成
-- =====================================================
