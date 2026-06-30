-- ============================================================
-- 情感树洞 AI 数据库初始化脚本
-- 数据库：MySQL 8.0+
-- 字符集：utf8mb4
-- 创建日期：2026-06-26
-- 说明：执行前请先创建数据库 emotee
-- ============================================================

CREATE DATABASE IF NOT EXISTS emotree DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE emotree;

-- ============================================================
-- 1. 用户表 users
-- ============================================================
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL COMMENT '登录用户名',
  `nickname` VARCHAR(50) NOT NULL COMMENT '用户昵称',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  `password_hash` VARCHAR(255) DEFAULT NULL COMMENT '密码哈希（Demo阶段允许为空，表示免密登录）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '注册时间',
  `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ============================================================
-- 2. AI 场景表 ai_scenes
-- 存储12个情绪场景及其匹配优先级
-- ============================================================
DROP TABLE IF EXISTS `ai_scenes`;
CREATE TABLE `ai_scenes` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '场景ID',
  `scene_key` VARCHAR(50) NOT NULL COMMENT '场景标识（如 study_pressure / family_relation）',
  `scene_name` VARCHAR(50) NOT NULL COMMENT '场景中文名（如 学习压力大）',
  `priority` INT NOT NULL DEFAULT 0 COMMENT '匹配优先级（数字越大越优先，安全场景优先级最高）',
  `keywords` TEXT NOT NULL COMMENT '匹配关键词JSON数组（如 ["学习","考试","成绩"]）',
  `exclude_keywords` TEXT DEFAULT NULL COMMENT '排除关键词JSON数组（为空表示不排除）',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '场景描述',
  `is_active` TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用：1是 0否',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_scene_key` (`scene_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI对话场景表';

-- ============================================================
-- 3. AI 回复表 ai_responses
-- 每个场景对应多条回复，支持避免重复机制
-- ============================================================
DROP TABLE IF EXISTS `ai_responses`;
CREATE TABLE `ai_responses` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '回复ID',
  `scene_id` BIGINT UNSIGNED NOT NULL COMMENT '关联场景ID',
  `content` TEXT NOT NULL COMMENT '回复内容（支持HTML）',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  `is_active` TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用：1是 0否',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_scene_id` (`scene_id`),
  CONSTRAINT `fk_responses_scene` FOREIGN KEY (`scene_id`) REFERENCES `ai_scenes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI回复库表';

-- ============================================================
-- 4. 追问话术表 ai_followups
-- 对话上下文达到一定轮数后追加的追问句
-- ============================================================
DROP TABLE IF EXISTS `ai_followups`;
CREATE TABLE `ai_followups` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '追问ID',
  `content` VARCHAR(255) NOT NULL COMMENT '追问内容',
  `trigger_rounds` INT NOT NULL DEFAULT 4 COMMENT '触发所需的最小对话轮数',
  `probability` DECIMAL(3,2) NOT NULL DEFAULT 0.50 COMMENT '触发概率（0.00-1.00）',
  `is_active` TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用：1是 0否',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='AI追问话术表';

-- ============================================================
-- 5. 对话记录表 chat_messages
-- ============================================================
DROP TABLE IF EXISTS `chat_messages`;
CREATE TABLE `chat_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `session_id` VARCHAR(64) NOT NULL COMMENT '会话ID（同一次对话会话标识）',
  `sender` ENUM('user','ai') NOT NULL COMMENT '发送方：user用户 ai人工智能',
  `content` TEXT NOT NULL COMMENT '消息内容',
  `matched_scene` VARCHAR(50) DEFAULT NULL COMMENT 'AI回复匹配的场景标识（仅AI消息）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '发送时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_session_id` (`session_id`),
  CONSTRAINT `fk_messages_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='对话记录表';

-- ============================================================
-- 6. 情绪记录表 mood_records
-- ============================================================
DROP TABLE IF EXISTS `mood_records`;
CREATE TABLE `mood_records` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '记录ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `mood_type` VARCHAR(20) NOT NULL COMMENT '情绪类型：happy/calm/anxious/sad/angry/tired',
  `mood_score` INT NOT NULL DEFAULT 50 COMMENT '情绪指数（0-100，越高越好）',
  `note` VARCHAR(500) DEFAULT NULL COMMENT '情绪备注',
  `record_date` DATE NOT NULL COMMENT '记录日期',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_date` (`user_id`, `record_date`),
  CONSTRAINT `fk_mood_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='情绪记录表';

-- ============================================================
-- 7. 画作模板表 art_templates
-- 替代前端硬编码的 artImageMap，存储6种情绪类别+默认类别
-- ============================================================
DROP TABLE IF EXISTS `art_templates`;
CREATE TABLE `art_templates` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '模板ID',
  `category` VARCHAR(30) NOT NULL COMMENT '情绪类别：positive/lonely/calm/anxious/sad/default',
  `image_url` VARCHAR(255) NOT NULL COMMENT '图片路径',
  `title` VARCHAR(100) NOT NULL COMMENT '画作标题',
  `description` TEXT NOT NULL COMMENT '画作解读',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  `is_active` TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用：1是 0否',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='画作模板表';

-- ============================================================
-- 8. 画作关键词表 art_keywords
-- 每个画作类别对应多个匹配关键词
-- ============================================================
DROP TABLE IF EXISTS `art_keywords`;
CREATE TABLE `art_keywords` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '关键词ID',
  `category` VARCHAR(30) NOT NULL COMMENT '关联画作类别',
  `keyword` VARCHAR(30) NOT NULL COMMENT '关键词',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='画作关键词匹配表';

-- ============================================================
-- 9. 用户画作表 artworks
-- 用户生成的画作记录
-- ============================================================
DROP TABLE IF EXISTS `artworks`;
CREATE TABLE `artworks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '画作ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `prompt` VARCHAR(500) NOT NULL COMMENT '用户输入的情绪描述',
  `image_url` VARCHAR(255) NOT NULL COMMENT '生成的图片路径',
  `title` VARCHAR(100) DEFAULT NULL COMMENT '画作标题',
  `description` TEXT DEFAULT NULL COMMENT '画作解读',
  `category` VARCHAR(30) DEFAULT NULL COMMENT '匹配的情绪类别',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_art_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户画作表';

-- ============================================================
-- 10. 成就表 achievements
-- ============================================================
DROP TABLE IF EXISTS `achievements`;
CREATE TABLE `achievements` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '成就ID',
  `code` VARCHAR(50) NOT NULL COMMENT '成就标识（如 talker / artist / recorder）',
  `name` VARCHAR(50) NOT NULL COMMENT '成就名称',
  `description` VARCHAR(255) NOT NULL COMMENT '达成条件描述',
  `icon` VARCHAR(20) NOT NULL COMMENT '成就图标（emoji）',
  `condition_type` VARCHAR(30) NOT NULL COMMENT '条件类型：chat_count/art_count/mood_streak',
  `condition_value` INT NOT NULL COMMENT '达成所需数值',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  `is_active` TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用：1是 0否',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='成就表';

-- ============================================================
-- 11. 用户成就关联表 user_achievements
-- ============================================================
DROP TABLE IF EXISTS `user_achievements`;
CREATE TABLE `user_achievements` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `achievement_id` BIGINT UNSIGNED NOT NULL COMMENT '成就ID',
  `status` ENUM('locked','in_progress','unlocked') NOT NULL DEFAULT 'locked' COMMENT '状态',
  `progress` INT NOT NULL DEFAULT 0 COMMENT '当前进度',
  `unlocked_at` DATETIME DEFAULT NULL COMMENT '解锁时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_achievement` (`user_id`, `achievement_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_ua_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_ua_achievement` FOREIGN KEY (`achievement_id`) REFERENCES `achievements` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户成就关联表';

-- ============================================================
-- 12. 用户见证表 testimonials
-- 产品介绍页展示的用户真实反馈
-- ============================================================
DROP TABLE IF EXISTS `testimonials`;
CREATE TABLE `testimonials` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '见证ID',
  `user_name` VARCHAR(50) NOT NULL COMMENT '用户名（脱敏）',
  `user_role` VARCHAR(50) NOT NULL COMMENT '用户身份（如 高一学生）',
  `avatar_emoji` VARCHAR(20) NOT NULL COMMENT '头像emoji',
  `content` TEXT NOT NULL COMMENT '见证内容',
  `rating` INT NOT NULL DEFAULT 5 COMMENT '评分（1-5星）',
  `usage_duration` VARCHAR(50) DEFAULT NULL COMMENT '使用时长（如 使用2周）',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  `is_active` TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用：1是 0否',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户见证表';

-- ============================================================
-- 13. 统计汇总表 statistics
-- 存储产品级统计数据（用于介绍页展示）
-- ============================================================
DROP TABLE IF EXISTS `statistics`;
CREATE TABLE `statistics` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `metric_key` VARCHAR(50) NOT NULL COMMENT '指标标识（如 satisfaction/users/conversations/artworks）',
  `metric_name` VARCHAR(50) NOT NULL COMMENT '指标名称',
  `metric_value` VARCHAR(50) NOT NULL COMMENT '指标数值（字符串支持百分比等）',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  `is_active` TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用：1是 0否',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_metric_key` (`metric_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='统计指标表';


-- ============================================================
-- ==================== 初始化数据 ============================
-- ============================================================

-- ---------- AI 场景初始化（按优先级排序，安全场景优先） ----------
INSERT INTO `ai_scenes` (`scene_key`, `scene_name`, `priority`, `keywords`, `exclude_keywords`, `description`) VALUES
('depression', '情绪低落', 100, '["难过","伤心","痛苦","绝望","活着没意思","想死","自杀","抑郁","不开心","高兴不起来","提不起劲","没意思","空虚","不想活"]', NULL, '高安全风险场景，涉及自伤倾向，优先匹配并提供心理援助热线'),
('study_pressure', '学习压力大', 90, '["学习","考试","成绩","作业","复习","备考","升学","高考","中考","挂科","不及格","学霸","学渣","做题","题目","分数","排名"]', NULL, '学习相关压力场景'),
('family_relation', '家庭关系', 80, '["父母","爸爸","妈妈","爸","妈","家人","家里","吵架","争吵","代沟","管我","唠叨","逼我","强制","被打","被骂"]', NULL, '家庭矛盾场景'),
('lonely', '孤独', 70, '["孤独","孤单","没人","寂寞","一个人","没朋友","被孤立","不合群","社恐","社交恐惧"]', NULL, '孤独感场景'),
('insomnia', '失眠', 60, '["失眠","睡不着","睡眠","做梦","噩梦","早醒","熬夜","困","累","疲惫","精神不振","没精神"]', NULL, '睡眠问题场景'),
('relationship', '人际关系', 50, '["同学","同事","朋友","室友","舍友","闺蜜","兄弟","矛盾","误会","冷战","绝交","背叛","讨厌","烦","吵架"]', '["父母","爸爸","妈妈","家人","家里"]', '人际关系场景，排除家庭场景关键词'),
('self_doubt', '自我怀疑', 40, '["自卑","没用","废物","差劲","不行","比别人差","失败者","我不行","我不配","不值得","丑","胖","矮","不好看"]', NULL, '自我怀疑与自卑场景'),
('anxiety', '焦虑', 30, '["焦虑","紧张","害怕","担心","恐慌","心跳快","手抖","出汗","坐立不安","忐忑","不安","慌"]', NULL, '焦虑紧张场景'),
('anger', '愤怒', 20, '["生气","愤怒","火大","烦死","气死","讨厌死","想打人","想摔东西","忍无可忍","气"]', NULL, '愤怒烦躁场景'),
('confusion', '迷茫', 10, '["迷茫","不知道","没目标","没方向","未来","前途","人生意义","活着的意义","怎么办","何去何从"]', NULL, '迷茫无目标场景'),
('love', '感情', 5, '["喜欢","爱","恋","暧昧","表白","约会","男朋友","女朋友","对象","前任","分手","失恋","暗恋","心动","crush"]', NULL, '恋爱感情场景'),
('positive', '积极情绪', 1, '["开心","高兴","快乐","太好了","棒极了","成功","顺利","满意","感谢","谢谢","哈哈","嘻嘻"]', NULL, '积极感恩情绪场景'),
('default', '默认', 0, '[]', NULL, '无法匹配任何场景时的默认回复');

-- ---------- AI 回复初始化（每个场景多条回复） ----------
-- 场景1：学习压力大（6条）
INSERT INTO `ai_responses` (`scene_id`, `content`, `sort_order`) VALUES
((SELECT id FROM ai_scenes WHERE scene_key='study_pressure'), '学习压力大是很多同学都会遇到的困扰，你愿意说出来已经是很勇敢的一步了 &#128170;<br><br>试试这样做：<br>1. 把大任务拆分成小目标，每完成一个就给自己一个小奖励<br>2. 每天留出15分钟做自己喜欢的事，让大脑休息一下<br>3. 深呼吸练习：吸气4秒，屏息4秒，呼气4秒<br><br>记住，你的价值不只是一张成绩单。', 1),
((SELECT id FROM ai_scenes WHERE scene_key='study_pressure'), '听起来你最近真的很辛苦 &#128524; 学习压力确实会让人喘不过气。<br><br>我想了解一下：这种压力主要来自哪方面？是任务太多做不完，还是担心成绩达不到期望？<br><br>有时候把具体的担忧写下来，会发现其实没有想象中那么可怕。', 2),
((SELECT id FROM ai_scenes WHERE scene_key='study_pressure'), '我能感受到你现在的焦虑 &#127775; 其实适当的压力是正常的，它说明你在乎自己的未来。<br><br>不过，当压力影响到睡眠或食欲时，就需要重视了。<br><br>你最近有好好吃饭吗？有没有试过和朋友聊聊这些压力？', 3),
((SELECT id FROM ai_scenes WHERE scene_key='study_pressure'), '考试和学习确实会带来很大压力，这很正常 &#128522;<br><br>我想分享一个小技巧：每天睡前写下三件今天完成的小事，不管多小都可以。这能帮助你看到自己的进步，而不是只盯着还没做完的事情。<br><br>你现在最担心的科目是什么？', 4),
((SELECT id FROM ai_scenes WHERE scene_key='study_pressure'), '学习不是短跑，而是马拉松 &#127939;&#127995; 现在的困难只是途中的一个小坡。<br><br>如果你愿意，我们可以一起制定一个小计划：<br>- 先找出让你最有压力的那件事<br>- 把它拆成3个小步骤<br>- 今天就完成第一步<br><br>你觉得怎么样？', 5),
((SELECT id FROM ai_scenes WHERE scene_key='study_pressure'), '听到你说学习压力大，我想给你一个虚拟的拥抱 &#129303;<br><br>你知道吗？很多看似轻松的同学，私下也在默默努力。你不是一个人在面对这些。<br><br>如果现在有一个魔法棒可以解决一个问题，你最希望解决什么？', 6);

-- 场景2：家庭关系（5条）
INSERT INTO `ai_responses` (`scene_id`, `content`, `sort_order`) VALUES
((SELECT id FROM ai_scenes WHERE scene_key='family_relation'), '和家人产生矛盾真的很难受，特别是和最亲近的人 &#128546;<br><br>吵架后双方可能都在气头上，这时候强行沟通反而容易激化矛盾。<br><br>建议：<br>1. 先给自己一些冷静的时间<br>2. 试着用''我''开头表达感受，比如''我感到...''而不是''你总是...''<br>3. 找一个双方都放松的时机再聊<br><br>你愿意说说吵架的起因吗？', 1),
((SELECT id FROM ai_scenes WHERE scene_key='family_relation'), '和父母吵架后感到委屈或生气都是正常的反应 &#128528;<br><br>很多时候，父母和我们之间的冲突源于''关心''但用错了表达方式。<br><br>一个小建议：试着写一封信（不一定要真的给出去），把你想说但没说出口的话写下来。这能帮助你整理情绪。<br><br>现在感觉好点了吗？', 2),
((SELECT id FROM ai_scenes WHERE scene_key='family_relation'), '家庭矛盾往往是因为双方都在用自己的方式表达爱 &#128154;<br><br>父母的唠叨可能是担心，你的反抗可能是渴望独立。<br><br>下次对话时，试试这样开头：''我知道你们是为我好，但是...'' <br><br>这能让他们感受到你的理解，也更愿意听你的想法。', 3),
((SELECT id FROM ai_scenes WHERE scene_key='family_relation'), '我理解你和家人之间的紧张 &#128522; 这种情况在很多家庭都会出现。<br><br>关键是要找到一个双方都能接受的沟通节奏。<br><br>也许你可以试试：每周固定一个时间和父母聊聊这一周的感受？不用很长，15分钟就够。', 4),
((SELECT id FROM ai_scenes WHERE scene_key='family_relation'), '和家庭的关系是需要经营的，就像友谊一样 &#127793;<br><br>有时候我们会对陌生人更有耐心，却把最坏的情绪留给最亲近的人。<br><br>下次快要发火时，试试在心里数到10，然后问自己：这件事一年后还重要吗？', 5);

-- 场景3：孤独（4条）
INSERT INTO `ai_responses` (`scene_id`, `content`, `sort_order`) VALUES
((SELECT id FROM ai_scenes WHERE scene_key='lonely'), '孤独是一种很真实的感受，谢谢你愿意和我分享 &#128149;<br><br>想让你知道：感到孤独不代表你不好，也不代表没有人关心你。有时候我们只是需要找到合适的方式连接。<br><br>你可以试试：<br>1. 参加一个感兴趣的社团或线上社群<br>2. 主动给老朋友发一条消息<br>3. 养一盆植物，照顾生命能带来陪伴感<br><br>我会一直在这里陪着你。', 1),
((SELECT id FROM ai_scenes WHERE scene_key='lonely'), '听到你说感到孤独，我的心也跟着沉了一下 &#128524;<br><br>在这个看似连接紧密的时代，很多人都有类似的感受。这不是你的错。<br><br>有时候，孤独是在提醒我们：需要更深入、更真实的连接，而不是更多的社交。<br><br>今天有没有一件小事，可以让你感到一点点温暖？', 2),
((SELECT id FROM ai_scenes WHERE scene_key='lonely'), '孤独感就像一场心灵的重感冒 &#127783;&#65039; 它会来，也会走。<br><br>在这段时间里，最重要的是对自己温柔一点。<br><br>你最近有什么感兴趣的事情吗？有时候投入到自己喜欢的事情中，孤独感会减轻很多。', 3),
((SELECT id FROM ai_scenes WHERE scene_key='lonely'), '我理解那种即使周围有人却依然感到孤独的感觉 &#127769;<br><br>这可能意味着你需要的是被理解，而不仅仅是陪伴。<br><br>如果你想聊，我在这里；如果你想安静一会儿，那也很好。怎么做让自己舒服就怎么做。', 4);

-- 场景4：失眠（4条）
INSERT INTO `ai_responses` (`scene_id`, `content`, `sort_order`) VALUES
((SELECT id FROM ai_scenes WHERE scene_key='insomnia'), '失眠真的很折磨人，尤其是第二天还要早起的时候 &#128555;<br><br>试试这些助眠小技巧：<br>1. 睡前1小时远离手机屏幕<br>2. 用温水泡脚或洗个热水澡<br>3. 听白噪音或轻音乐<br>4. 尝试''4-7-8呼吸法''：吸气4秒，屏息7秒，呼气8秒<br><br>如果失眠持续超过两周，建议和家长商量看看医生哦。', 1),
((SELECT id FROM ai_scenes WHERE scene_key='insomnia'), '失眠往往和白天积累的压力有关 &#128173; 你的大脑可能在晚上还在''加班''处理白天的情绪。<br><br>一个小方法：睡前花5分钟做''大脑清空''——把脑子里想的事情全部写在纸上，告诉自己''明天再处理''。<br><br>另外，规律的运动也能帮助改善睡眠质量。', 2),
((SELECT id FROM ai_scenes WHERE scene_key='insomnia'), '睡不着的时候越着急越睡不着，这是个恶性循环 &#128564;<br><br>不如试试接受它：就算今晚睡不好，明天也能撑过去。<br><br>你可以听听播客、有声书，或者干脆起来写写日记。不要强迫自己入睡，反而更容易放松下来。', 3),
((SELECT id FROM ai_scenes WHERE scene_key='insomnia'), '睡眠问题会影响情绪，情绪不好又影响睡眠，这确实很难缠 &#128260;<br><br>但如果能打破其中一个环节，整个循环就会改善。<br><br>我建议从白天开始调整：减少午睡时间、增加日照接触、傍晚后少喝咖啡因饮料。<br><br>今晚要不要试试早点上床，但不强迫自己马上睡着？', 4);

-- 场景5：人际关系（3条）
INSERT INTO `ai_responses` (`scene_id`, `content`, `sort_order`) VALUES
((SELECT id FROM ai_scenes WHERE scene_key='relationship'), '人际关系确实是最让人头疼的事情之一 &#128580;<br><br>无论是朋友间的误会，还是和同学的摩擦，都需要勇气去面对。<br><br>你能跟我说说具体发生了什么吗？是某件具体的事，还是一种长期的感觉？', 1),
((SELECT id FROM ai_scenes WHERE scene_key='relationship'), '和他人相处时感到不舒服是很正常的 &#127807; 每个人都有自己的边界和触发点。<br><br>关键是要分清楚：哪些是可以改变的，哪些是需要接受的。<br><br>你觉得这段关系对你来说重要吗？值得去修复吗？', 2),
((SELECT id FROM ai_scenes WHERE scene_key='relationship'), '社交有时候真的很累人，尤其是对于敏感的人来说 &#127917;<br><br>如果你觉得某个圈子让你不舒服，也许这不是你的问题，而是你不属于那里。<br><br>真正的朋友会让你感到被接纳，而不是时刻紧绷。', 3);

-- 场景6：自我怀疑（3条）
INSERT INTO `ai_responses` (`scene_id`, `content`, `sort_order`) VALUES
((SELECT id FROM ai_scenes WHERE scene_key='self_doubt'), '自我怀疑就像是心里的一个小声音 &#129432; 它会在你最脆弱的时候出现。<br><br>但我要告诉你：你的感受是真实的，但它不一定是事实。<br><br>能说说是什么让你开始怀疑自己的吗？', 1),
((SELECT id FROM ai_scenes WHERE scene_key='self_doubt'), '每个人都有自我怀疑的时刻，即使是那些看起来很自信的人 &#128522;<br><br>重要的是不要让这些怀疑定义了你。<br><br>你最近在哪方面感到不够好？学习？交友？还是外貌？', 2),
((SELECT id FROM ai_scenes WHERE scene_key='self_doubt'), '觉得自己不够好，这种感觉很沉重 &#128640; 但它也说明你在乎自己想成为什么样的人。<br><br>与其纠结于''我不够好''，不如想想''我可以变得更好的一点是什么''。<br><br>今天有没有什么小事是你做得不错的？', 3);

-- 场景7：情绪低落（3条，含心理援助热线）
INSERT INTO `ai_responses` (`scene_id`, `content`, `sort_order`) VALUES
((SELECT id FROM ai_scenes WHERE scene_key='depression'), '听起来你最近情绪不太好 &#127783;&#65039; 我想先确认一下：这种感觉持续多久了？<br><br>如果超过两周，并且影响到了日常生活（比如不想起床、没胃口、对以前喜欢的事情失去兴趣），那我强烈建议你和信任的人聊聊，或者寻求专业帮助。<br><br>心理援助热线：400-161-9995（24小时）', 1),
((SELECT id FROM ai_scenes WHERE scene_key='depression'), '情绪像天气一样，有晴天也有阴天 &#9729;&#65039; 低落的时期会过去的。<br><br>在这段期间，允许自己不那么开心，但也不要独自承受太久。<br><br>你身边有可以信任的人吗？家人、朋友、老师？', 2),
((SELECT id FROM ai_scenes WHERE scene_key='depression'), '感到难过的时候，哭出来其实是一种释放 &#128167; 不要压抑它。<br><br>同时，也要注意观察：如果这种低落感越来越强，或者出现了''什么都不想做了''的想法，请一定寻求帮助。<br><br>我会一直在这里陪你，但你也需要现实中的支持系统。', 3);

-- 场景8：焦虑（3条）
INSERT INTO `ai_responses` (`scene_id`, `content`, `sort_order`) VALUES
((SELECT id FROM ai_scenes WHERE scene_key='anxiety'), '焦虑其实是身体在提醒你：有些事情需要关注 &#9889;<br><br>适度的焦虑是有帮助的，它能让我们更专注。但当焦虑过度时，就会变成负担。<br><br>你现在最焦虑的是什么？是即将到来的某件事，还是一种弥漫性的不安？', 1),
((SELECT id FROM ai_scenes WHERE scene_key='anxiety'), '焦虑的时候，呼吸会变浅，心跳会加快 &#128560; 这时候最重要的是告诉身体''我是安全的''。<br><br>试试这个：把手放在肚子上，慢慢吸气让肚子鼓起，然后慢慢呼气。重复5-10次。<br><br>现在感觉怎么样？', 2),
((SELECT id FROM ai_scenes WHERE scene_key='anxiety'), '对未来感到焦虑是很常见的 &#127744; 尤其是在面临选择或变化的时候。<br><br>焦虑往往源于''控制欲''——我们想要确定的结果，但生活充满不确定性。<br><br>也许可以试试：专注于当下能控制的这一小步，而不是遥远的未来。', 3);

-- 场景9：愤怒（3条）
INSERT INTO `ai_responses` (`scene_id`, `content`, `sort_order`) VALUES
((SELECT id FROM ai_scenes WHERE scene_key='anger'), '愤怒是一种正常的情绪，它告诉我们某些边界被侵犯了 &#128293;<br><br>关键是如何健康地表达它，而不是伤害自己或他人。<br><br>你现在是因为什么事情生气？', 1),
((SELECT id FROM ai_scenes WHERE scene_key='anger'), '感到愤怒时，身体会进入''战斗或逃跑''模式 &#128165; 这时候做决定往往后悔。<br><br>建议：先离开现场（如果可能），深呼吸10次，等理智回归后再处理。<br><br>你已经做得很好了，至少你来这里表达了它。', 2),
((SELECT id FROM ai_scenes WHERE scene_key='anger'), '有时候愤怒背后隐藏的是其他情绪：受伤、失望、恐惧 &#128520;<br><br>如果你愿意，可以试着问问自己：我真正感到的是什么？<br><br>愤怒是一层保护壳，剥开它可能会发现更柔软的部分。', 3);

-- 场景10：迷茫（3条）
INSERT INTO `ai_responses` (`scene_id`, `content`, `sort_order`) VALUES
((SELECT id FROM ai_scenes WHERE scene_key='confusion'), '迷茫其实是成长的一部分 &#129517; 它意味着旧的地图不再适用，新的还没有画出来。<br><br>这不代表你走错了路，而是你站在了一个十字路口。<br><br>你对未来的哪个方面感到最迷茫？学业？职业？还是人生方向？', 1),
((SELECT id FROM ai_scenes WHERE scene_key='confusion'), '不知道自己想要什么是很多人的常态 &#127783;&#65039; 社会给了我们太多''应该''，却很少问我们''想要''。<br><br>也许可以试试：列出3件你纯粹因为喜欢而做的事情（不是为了成绩、不是为了钱）。这能帮你找到一些线索。', 2),
((SELECT id FROM ai_scenes WHERE scene_key='confusion'), '迷茫的时候，最好的策略是''小步快跑'' &#129692; 不需要看清整条路，只需要看清脚下的这一步。<br><br>今天可以做的一件小事是什么？哪怕只是读一本书、学一道菜、散一次步。', 3);

-- 场景11：感情（3条）
INSERT INTO `ai_responses` (`scene_id`, `content`, `sort_order`) VALUES
((SELECT id FROM ai_scenes WHERE scene_key='love'), '青春期的情感萌动是很美好也很复杂的事情 &#128154; 无论结果是喜是忧，都是成长的经历。<br><br>你是想分享开心的故事，还是在烦恼某些事情？', 1),
((SELECT id FROM ai_scenes WHERE scene_key='love'), '喜欢一个人或陷入一段感情，会让我们的情绪像过山车 &#127906; 这是正常的。<br><br>无论你现在处于什么阶段（暗恋、表白、在一起、分手），我都愿意倾听。<br><br>记住：你的价值不取决于任何人是否喜欢你。', 2),
((SELECT id FROM ai_scenes WHERE scene_key='love'), '感情的事没有标准答案 &#128522; 每个人的经历和感受都不同。<br><br>但有一点是共通的：健康的感情应该让你感到被接纳和成长，而不是消耗和自我怀疑。<br><br>你现在的感觉是怎样的？', 3);

-- 场景12：积极情绪（3条）
INSERT INTO `ai_responses` (`scene_id`, `content`, `sort_order`) VALUES
((SELECT id FROM ai_scenes WHERE scene_key='positive'), '太好了！听到你分享开心的事情，我也为你感到高兴 &#127881;<br><br>积极的情绪值得我们好好珍惜和延长。<br><br>是什么让你这么开心？可以多说一点吗？我想和你一起感受这份喜悦！', 1),
((SELECT id FROM ai_scenes WHERE scene_key='positive'), '能够感知并表达快乐，这是一种很珍贵的能力 &#10024; 很多人忙于追逐下一个目标，却忘了享受当下的幸福。<br><br>你今天发生的好事是什么？把它记录下来，以后回想起来会很温暖。', 2),
((SELECT id FROM ai_scenes WHERE scene_key='positive'), '你的正能量很有感染力 &#9728;&#65039; 谢谢你分享这份美好！<br><br>希望你能把这份快乐延续下去，也传递给身边的人。<br><br>对了，你有什么保持好心情的秘诀吗？可以分享给其他可能需要的人~', 3);

-- 默认场景（6条）
INSERT INTO `ai_responses` (`scene_id`, `content`, `sort_order`) VALUES
((SELECT id FROM ai_scenes WHERE scene_key='default'), '谢谢你愿意和我分享这些 &#128522; 我在这里认真听着呢。<br><br>能多说一点吗？比如这种情况是从什么时候开始的，最近有什么特别的事情发生？<br><br>了解得越多，我越能给你更有针对性的回应。', 1),
((SELECT id FROM ai_scenes WHERE scene_key='default'), '我理解你的感受 &#127775; 每个人都会有这样的时候。<br><br>你愿意说说，如果现在有一个魔法可以解决一个问题，你最希望解决什么？<br><br>有时候聚焦在最关键的那个点上，会让我们找到突破口。', 2),
((SELECT id FROM ai_scenes WHERE scene_key='default'), '听到你这么说，我想给你一个虚拟的拥抱 &#129303;<br><br>你已经很努力了，不要对自己太苛刻。<br><br>我想邀请你做一个练习：说出三件今天发生的好事，无论多小都可以。比如''今天天气很好''、''喝到了喜欢的饮料''...<br><br>开始训练大脑关注积极的事物，会慢慢改变我们的情绪状态。', 3),
((SELECT id FROM ai_scenes WHERE scene_key='default'), '我在这里陪着你 &#128172; 不管你想聊什么，或者只是静静地待一会儿，都可以。<br><br>有时候，被倾听本身就是一种疗愈。', 4),
((SELECT id FROM ai_scenes WHERE scene_key='default'), '每个人的人生都有起起伏伏，你现在可能正处于一个低谷期 &#9968; 但请相信，这只是暂时的。<br><br>你之前是怎么度过困难时期的？那些经验现在或许还能帮到你。', 5),
((SELECT id FROM ai_scenes WHERE scene_key='default'), '你的感受很重要，不要忽视它们 &#127800; 即使是负面情绪，也在试图告诉你一些信息。<br><br>你愿意尝试理解这些情绪背后的信息吗？', 6);

-- ---------- 追问话术初始化 ----------
INSERT INTO `ai_followups` (`content`, `trigger_rounds`, `probability`) VALUES
('<br><br>顺便问一下，这种情况持续多久了？', 4, 0.50),
('<br><br>你之前有尝试过什么方法来缓解吗？', 4, 0.50),
('<br><br>除了这件事，最近还有其他让你困扰的吗？', 4, 0.50);

-- ---------- 画作模板初始化 ----------
INSERT INTO `art_templates` (`category`, `image_url`, `title`, `description`, `sort_order`) VALUES
('positive', 'assets/art_example2_512x512.jpg', '《希望的曙光》', '画面中温暖的阳光穿透云层，洒向一片盛开的花海，色彩明亮温暖，象征着希望与新生的力量。', 1),
('positive', 'assets/art_example2_512x512.jpg', '《阳光下的绽放》', '金色的光芒铺满画面，花朵在阳光下舒展绽放，整体氛围充满生机与可能性。', 2),
('lonely', 'assets/art_example1_512x512.jpg', '《月下独白》', '月光下的湖面倒映着星空，远处有一棵孤树静静伫立，画面宁静而深邃，诉说着内心的独处时光。', 1),
('lonely', 'assets/art_example1_512x512.jpg', '《星夜的沉思》', '夜空中繁星点点，柔和的蓝紫色调，既孤独又浪漫，仿佛能听到内心的回响。', 2),
('calm', 'assets/feature_art_1024x576.jpg', '《林的呼吸》', '清晨的森林被薄雾笼罩，阳光透过树叶洒下斑驳光影，一条小溪蜿蜒流过，仿佛能听到鸟鸣与水声。', 1),
('calm', 'assets/feature_art_1024x576.jpg', '《晨曦微光》', '柔和的绿色与金色交织，画面传递出宁静与治愈的力量，让人不自觉地放慢呼吸。', 2),
('anxious', 'assets/pain_point_1024x576.jpg', '《风暴前的宁静》', '暴风雨前的天空乌云密布，但远处的闪电划破黑暗，象征着内心风暴终将过去，力量正在积蓄。', 1),
('anxious', 'assets/pain_point_1024x576.jpg', '《思绪的漩涡》', '抽象的线条交织缠绕，色彩浓烈而复杂，如同思绪万千的大脑，但在混乱中隐约可见秩序的美感。', 2),
('sad', 'assets/value_guardian_1024x576.jpg', '《雨后的守护》', '细雨中的城市街灯散发着暖黄色的光，一个模糊的身影撑伞独行，画面既有忧伤也有关怀的温度。', 1),
('sad', 'assets/value_guardian_1024x576.jpg', '《温柔的泪水》', '蓝色的雨滴与暖色的灯光交织，泪水般的画面中藏着温柔的守护，悲伤中也有被爱着的痕迹。', 2),
('default', 'assets/art_example1_512x512.jpg', '《心灵的镜像》', '根据您的情绪描述，AI为您创作了这幅独特的作品。画面融合了您当下的心境与治愈系美学风格。', 1),
('default', 'assets/art_example2_512x512.jpg', '《情绪的色彩》', '这幅作品捕捉了您文字中流露的情感色彩，以艺术的方式将其具象化呈现。', 2),
('default', 'assets/feature_art_1024x576.jpg', '《内心的风景》', '每一笔色彩都是对您情绪的回应，这幅画作是专属于您的情绪镜像。', 3);

-- ---------- 画作关键词初始化 ----------
INSERT INTO `art_keywords` (`category`, `keyword`) VALUES
('positive', '开心'), ('positive', '快乐'), ('positive', '高兴'), ('positive', '幸福'), ('positive', '满足'),
('positive', '阳光'), ('positive', '温暖'), ('positive', '希望'), ('positive', '美好'), ('positive', '感激'),
('positive', '幸运'), ('positive', '喜悦'), ('positive', '兴奋'),
('lonely', '孤独'), ('lonely', '孤单'), ('lonely', '寂寞'), ('lonely', '一个人'), ('lonely', '冷清'),
('lonely', '凄凉'), ('lonely', '无人'), ('lonely', '被遗忘'), ('lonely', '疏离'), ('lonely', '想念'),
('calm', '平静'), ('calm', '安宁'), ('calm', '放松'), ('calm', '舒适'), ('calm', '宁静'),
('calm', '治愈'), ('calm', '释怀'), ('calm', '放下'), ('calm', '轻松'), ('calm', '自在'), ('calm', '舒服'),
('anxious', '焦虑'), ('anxious', '紧张'), ('anxious', '担心'), ('anxious', '害怕'), ('anxious', '慌乱'),
('anxious', '不安'), ('anxious', '压力'), ('anxious', '窒息'), ('anxious', '混乱'), ('anxious', '崩溃'), ('anxious', '恐惧'),
('sad', '难过'), ('sad', '伤心'), ('sad', '悲伤'), ('sad', '失落'), ('sad', '沮丧'),
('sad', '低落'), ('sad', '想哭'), ('sad', '痛苦'), ('sad', '委屈');

-- ---------- 成就初始化 ----------
INSERT INTO `achievements` (`code`, `name`, `description`, `icon`, `condition_type`, `condition_value`, `sort_order`) VALUES
('talker', '倾诉达人', '完成 5 次 AI 对话', '&#128172;', 'chat_count', 5, 1),
('artist', '艺术疗愈师', '生成 3 幅情绪画作', '&#127912;', 'art_count', 3, 2),
('recorder', '情绪记录者', '连续 7 天记录情绪', '&#128221;', 'mood_streak', 7, 3);

-- ---------- 用户见证初始化 ----------
INSERT INTO `testimonials` (`user_name`, `user_role`, `avatar_emoji`, `content`, `rating`, `usage_duration`, `sort_order`) VALUES
('小雨', '高一学生', '&#128103;', '以前遇到烦心事只能憋在心里，现在有了小洞，每天晚上都能跟它聊聊。它不会评判我，只是安静地听，偶尔给我一些建议。感觉心里轻松多了。', 5, '使用2周', 1),
('阿明', '初三学生', '&#128102;', '中考压力很大，经常失眠。小洞教了我一些放松技巧，还陪我做了几次呼吸练习。虽然它不是真人医生，但在最难熬的那些夜晚，它的陪伴真的很重要。', 5, '使用1个月', 2),
('小雯', '高二学生', '&#128105;', 'AI绘画功能真的很治愈，我把我孤独的感觉画出来，看到那幅画的时候突然就哭了。原来我的情绪是可以被看见的，这让我觉得自己不再孤单。', 5, '使用3周', 3),
('陈老师', '中学心理教师', '&#128104;', '作为心理老师，我推荐了好几个学生使用。它不能替代专业咨询，但能在学生最需要的时候提供及时回应，弥补了我们无法24小时陪伴的遗憾。', 5, '推荐使用', 4);

-- ---------- 统计指标初始化 ----------
INSERT INTO `statistics` (`metric_key`, `metric_name`, `metric_value`, `sort_order`) VALUES
('satisfaction', '用户满意度', '98%', 1),
('users', '内测用户', '5,200+', 2),
('conversations', '倾诉对话', '12,000+', 3),
('artworks', '治愈画作', '3,500+', 4);

-- ---------- 默认用户初始化（Demo测试用户） ----------
INSERT INTO `users` (`username`, `nickname`, `avatar`) VALUES
('demo', 'Demo用户', '&#127795;');

-- ============================================================
-- SQL 执行完毕
-- ============================================================
