-- ============================================
-- V1: 初始化数据库 - 核心表结构
-- ============================================

-- 用户表
CREATE TABLE IF NOT EXISTS t_user (
    id BIGINT NOT NULL COMMENT '用户ID',
    username VARCHAR(50) NOT NULL COMMENT '用户名',
    password_hash VARCHAR(255) NOT NULL COMMENT '密码哈希',
    nickname VARCHAR(50) DEFAULT NULL COMMENT '昵称',
    avatar VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
    email VARCHAR(100) DEFAULT NULL COMMENT '邮箱',
    role VARCHAR(20) NOT NULL DEFAULT 'USER' COMMENT '角色: USER/ADMIN',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
    is_deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-未删除 1-已删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_username (username),
    KEY idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 项目表
CREATE TABLE IF NOT EXISTS t_project (
    id BIGINT NOT NULL COMMENT '项目ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    name VARCHAR(100) NOT NULL COMMENT '项目名称',
    description VARCHAR(500) DEFAULT NULL COMMENT '项目描述',
    cover_image VARCHAR(255) DEFAULT NULL COMMENT '封面图URL',
    status TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 0-归档 1-正常',
    is_deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-未删除 1-已删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='项目表';

-- 视频资源表
CREATE TABLE IF NOT EXISTS t_video (
    id BIGINT NOT NULL COMMENT '视频ID',
    project_id BIGINT NOT NULL COMMENT '项目ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    filename VARCHAR(255) NOT NULL COMMENT '原始文件名',
    storage_path VARCHAR(500) NOT NULL COMMENT 'MinIO存储路径',
    bucket_name VARCHAR(100) NOT NULL COMMENT 'MinIO Bucket',
    file_size BIGINT NOT NULL DEFAULT 0 COMMENT '文件大小(字节)',
    duration INT NOT NULL DEFAULT 0 COMMENT '视频时长(秒)',
    width INT DEFAULT NULL COMMENT '宽度',
    height INT DEFAULT NULL COMMENT '高度',
    fps DECIMAL(5,2) DEFAULT NULL COMMENT '帧率',
    format VARCHAR(20) DEFAULT NULL COMMENT '视频格式',
    status TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0-上传中 1-已上传 2-解析中 3-解析完成 4-解析失败',
    is_deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-未删除 1-已删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_project_id (project_id),
    KEY idx_user_id (user_id),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视频资源表';

-- 视频解析结果表
CREATE TABLE IF NOT EXISTS t_video_analysis (
    id BIGINT NOT NULL COMMENT '解析结果ID',
    video_id BIGINT NOT NULL COMMENT '视频ID',
    transcript_json JSON DEFAULT NULL COMMENT '音频转写结果JSON',
    frames_json JSON DEFAULT NULL COMMENT '关键帧分析结果JSON',
    prompts_json JSON DEFAULT NULL COMMENT '画面提示词JSON',
    summary TEXT DEFAULT NULL COMMENT '视频内容摘要',
    status TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0-待解析 1-解析中 2-成功 3-失败',
    progress INT NOT NULL DEFAULT 0 COMMENT '进度百分比',
    error_msg VARCHAR(500) DEFAULT NULL COMMENT '错误信息',
    is_deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-未删除 1-已删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    UNIQUE KEY uk_video_id (video_id),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='视频解析结果表';

-- 关键帧表
CREATE TABLE IF NOT EXISTS t_video_frame (
    id BIGINT NOT NULL COMMENT '帧ID',
    video_id BIGINT NOT NULL COMMENT '视频ID',
    analysis_id BIGINT DEFAULT NULL COMMENT '解析结果ID',
    frame_index INT NOT NULL COMMENT '帧序号',
    timestamp_ms BIGINT NOT NULL COMMENT '时间戳(毫秒)',
    storage_path VARCHAR(500) NOT NULL COMMENT '图片存储路径',
    bucket_name VARCHAR(100) NOT NULL COMMENT 'MinIO Bucket',
    scene_tags VARCHAR(500) DEFAULT NULL COMMENT '场景标签(逗号分隔)',
    prompt_text TEXT DEFAULT NULL COMMENT '画面提示词',
    is_key_frame TINYINT NOT NULL DEFAULT 1 COMMENT '是否关键帧: 0-否 1-是',
    is_deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-未删除 1-已删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (id),
    KEY idx_video_id (video_id),
    KEY idx_analysis_id (analysis_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='关键帧表';

-- 音频资源表
CREATE TABLE IF NOT EXISTS t_audio (
    id BIGINT NOT NULL COMMENT '音频ID',
    project_id BIGINT NOT NULL COMMENT '项目ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    video_id BIGINT DEFAULT NULL COMMENT '关联视频ID',
    filename VARCHAR(255) NOT NULL COMMENT '文件名',
    storage_path VARCHAR(500) NOT NULL COMMENT 'MinIO存储路径',
    bucket_name VARCHAR(100) NOT NULL COMMENT 'MinIO Bucket',
    file_size BIGINT NOT NULL DEFAULT 0 COMMENT '文件大小(字节)',
    duration INT NOT NULL DEFAULT 0 COMMENT '时长(秒)',
    sample_rate INT DEFAULT NULL COMMENT '采样率',
    channels INT DEFAULT NULL COMMENT '声道数',
    format VARCHAR(20) DEFAULT NULL COMMENT '音频格式',
    source_type VARCHAR(20) NOT NULL DEFAULT 'EXTRACTED' COMMENT '来源: EXTRACTED-视频提取/UPLOADED-用户上传/GENERATED-AI生成',
    is_deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-未删除 1-已删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_project_id (project_id),
    KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='音频资源表';

-- 融合创作任务表
CREATE TABLE IF NOT EXISTS t_fusion_task (
    id BIGINT NOT NULL COMMENT '任务ID',
    project_id BIGINT NOT NULL COMMENT '项目ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    video_ids_json JSON NOT NULL COMMENT '视频ID列表JSON',
    fusion_mode VARCHAR(30) NOT NULL COMMENT '融合模式: SCRIPT_COMPLEMENT/SHOT_STYLE/CONTENT_RESTRUCTURE',
    script_outline TEXT DEFAULT NULL COMMENT '脚本大纲',
    shot_suggestions JSON DEFAULT NULL COMMENT '镜头建议JSON',
    status TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0-待生成 1-生成中 2-成功 3-失败',
    progress INT NOT NULL DEFAULT 0 COMMENT '进度百分比',
    error_msg VARCHAR(500) DEFAULT NULL COMMENT '错误信息',
    is_deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-未删除 1-已删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_project_id (project_id),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='融合创作任务表';

-- 帧级创作任务表
CREATE TABLE IF NOT EXISTS t_frame_task (
    id BIGINT NOT NULL COMMENT '任务ID',
    project_id BIGINT NOT NULL COMMENT '项目ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    video_id BIGINT DEFAULT NULL COMMENT '源视频ID',
    mode VARCHAR(30) NOT NULL COMMENT '生成模式: SINGLE_REDRAW/START_END_FUSION/SEGMENT_REMAKE/MULTI_SEGMENT_FUSION',
    params_json JSON DEFAULT NULL COMMENT '生成参数JSON',
    source_frames_json JSON DEFAULT NULL COMMENT '源帧信息JSON',
    result_paths_json JSON DEFAULT NULL COMMENT '结果文件路径JSON',
    comfyui_task_id VARCHAR(100) DEFAULT NULL COMMENT 'ComfyUI任务ID',
    status TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0-待生成 1-生成中 2-成功 3-失败',
    progress INT NOT NULL DEFAULT 0 COMMENT '进度百分比',
    error_msg VARCHAR(500) DEFAULT NULL COMMENT '错误信息',
    is_deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-未删除 1-已删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_project_id (project_id),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帧级创作任务表';

-- 音频创作任务表
CREATE TABLE IF NOT EXISTS t_audio_task (
    id BIGINT NOT NULL COMMENT '任务ID',
    project_id BIGINT NOT NULL COMMENT '项目ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    source_audio_id BIGINT DEFAULT NULL COMMENT '源音频ID',
    mode VARCHAR(30) NOT NULL COMMENT '生成模式: VOICE_CLONE/TEXT_TO_SPEECH/VOICE_CONVERSION',
    voice_id VARCHAR(100) DEFAULT NULL COMMENT '音色ID',
    voice_name VARCHAR(100) DEFAULT NULL COMMENT '音色名称',
    text_content TEXT DEFAULT NULL COMMENT '文本内容',
    params_json JSON DEFAULT NULL COMMENT '生成参数JSON(语速/语调/情感等)',
    result_path VARCHAR(500) DEFAULT NULL COMMENT '结果文件路径',
    result_bucket VARCHAR(100) DEFAULT NULL COMMENT '结果Bucket',
    status TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0-待生成 1-生成中 2-成功 3-失败',
    progress INT NOT NULL DEFAULT 0 COMMENT '进度百分比',
    error_msg VARCHAR(500) DEFAULT NULL COMMENT '错误信息',
    is_deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-未删除 1-已删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_project_id (project_id),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='音频创作任务表';

-- 音色库表
CREATE TABLE IF NOT EXISTS t_voice_library (
    id BIGINT NOT NULL COMMENT '音色ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    voice_name VARCHAR(100) NOT NULL COMMENT '音色名称',
    description VARCHAR(500) DEFAULT NULL COMMENT '音色描述',
    gender VARCHAR(10) DEFAULT NULL COMMENT '性别',
    language VARCHAR(20) DEFAULT NULL COMMENT '语言',
    feature_path VARCHAR(500) DEFAULT NULL COMMENT '音色特征文件路径',
    source_audio_id BIGINT DEFAULT NULL COMMENT '来源音频ID',
    is_system TINYINT NOT NULL DEFAULT 0 COMMENT '是否系统预设: 0-否 1-是',
    is_deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-未删除 1-已删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='音色库表';

-- 剪辑项目表
CREATE TABLE IF NOT EXISTS t_edit_project (
    id BIGINT NOT NULL COMMENT '剪辑项目ID',
    project_id BIGINT NOT NULL COMMENT '项目ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    name VARCHAR(100) NOT NULL COMMENT '剪辑项目名称',
    timeline_json LONGTEXT DEFAULT NULL COMMENT '时间轴数据JSON',
    assets_json JSON DEFAULT NULL COMMENT '素材库数据JSON',
    settings_json JSON DEFAULT NULL COMMENT '项目设置JSON(分辨率/帧率等)',
    cover_image VARCHAR(255) DEFAULT NULL COMMENT '封面图',
    duration INT NOT NULL DEFAULT 0 COMMENT '总时长(秒)',
    export_path VARCHAR(500) DEFAULT NULL COMMENT '导出文件路径',
    export_bucket VARCHAR(100) DEFAULT NULL COMMENT '导出Bucket',
    status TINYINT NOT NULL DEFAULT 0 COMMENT '状态: 0-草稿 1-编辑中 2-导出中 3-已导出',
    is_deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-未删除 1-已删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_project_id (project_id),
    KEY idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='剪辑项目表';

-- AI 服务配置表
CREATE TABLE IF NOT EXISTS t_ai_service_config (
    id BIGINT NOT NULL COMMENT '配置ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    service_type VARCHAR(30) NOT NULL COMMENT '服务类型: COMFYUI/WHISPER/TTS/RVC',
    endpoint VARCHAR(500) NOT NULL COMMENT '服务地址',
    api_key VARCHAR(255) DEFAULT NULL COMMENT 'API密钥',
    enabled TINYINT NOT NULL DEFAULT 1 COMMENT '是否启用: 0-否 1-是',
    is_default TINYINT NOT NULL DEFAULT 0 COMMENT '是否默认: 0-否 1-是',
    is_deleted TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除: 0-未删除 1-已删除',
    create_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (id),
    KEY idx_user_id (user_id),
    KEY idx_service_type (service_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI服务配置表';
