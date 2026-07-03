-- 冰箱魔法数据库初始化脚本
CREATE DATABASE IF NOT EXISTS fridge_magic DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE fridge_magic;

-- 用户表
CREATE TABLE IF NOT EXISTS user (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(200) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20) DEFAULT 'USER',
    daily_calorie_goal INT DEFAULT 2000,
    daily_protein_goal INT DEFAULT 60,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 菜谱记录表
CREATE TABLE IF NOT EXISTS recipe (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    difficulty VARCHAR(10) NOT NULL,
    cook_time VARCHAR(20) NOT NULL,
    steps TEXT NOT NULL,
    nutrition TEXT NOT NULL,
    extra_ingredients TEXT,
    ingredients_input VARCHAR(500) NOT NULL,
    preference VARCHAR(50) DEFAULT '',
    is_favorite TINYINT(1) DEFAULT 0,
    rating INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 收藏表
CREATE TABLE IF NOT EXISTS favorite_recipe (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    recipe_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 菜谱评分表
CREATE TABLE IF NOT EXISTS recipe_rating (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    recipe_id BIGINT NOT NULL,
    rating INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    FOREIGN KEY (recipe_id) REFERENCES recipe(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_recipe (user_id, recipe_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 自定义食材库
CREATE TABLE IF NOT EXISTS custom_ingredient (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    emoji VARCHAR(10) DEFAULT '🥬',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_ingredient (user_id, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 食材临期表
CREATE TABLE IF NOT EXISTS ingredient_expiry (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    purchase_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    notified TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 周计划表
CREATE TABLE IF NOT EXISTS weekly_plan (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    week_start DATE NOT NULL,
    day_of_week INT NOT NULL,
    meal_type VARCHAR(10) NOT NULL,
    recipe_id BIGINT,
    recipe_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 操作日志表
CREATE TABLE IF NOT EXISTS audit_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    username VARCHAR(50),
    action VARCHAR(50) NOT NULL,
    detail VARCHAR(500),
    ip VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 密码重置表
CREATE TABLE IF NOT EXISTS password_reset (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    token VARCHAR(100) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    used TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 插入测试用户（admin/123456）
INSERT INTO user (username, password, email, role) VALUES
('admin', '$2a$10$i99iXmZ1q7q3tGSITY5V3.o09IZXwtP3a078.CwkAmdhwBDbMPqMO', 'admin@fridgemagic.com', 'ADMIN')
ON DUPLICATE KEY UPDATE password=VALUES(password);

-- 插入预置常用食材
INSERT INTO custom_ingredient (user_id, name, emoji) VALUES
(1, '鸡蛋', '🥚'),(1, '番茄', '🍅'),(1, '土豆', '🥔'),(1, '青椒', '🫑'),
(1, '猪肉', '🥩'),(1, '鸡胸肉', '🍗'),(1, '豆腐', '🧈'),(1, '西兰花', '🥦'),
(1, '白菜', '🥬'),(1, '胡萝卜', '🥕'),(1, '洋葱', '🧅'),(1, '蘑菇', '🍄'),
(1, '虾仁', '🦐'),(1, '大蒜', '🧄'),(1, '辣椒', '🌶️'),(1, '大葱', '🧅')
ON DUPLICATE KEY UPDATE name=name;