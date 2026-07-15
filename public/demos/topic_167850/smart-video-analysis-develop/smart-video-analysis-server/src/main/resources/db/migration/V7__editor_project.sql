CREATE TABLE IF NOT EXISTS t_editor_project (
    id BIGINT PRIMARY KEY COMMENT '剪辑项目ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    project_id BIGINT COMMENT '关联项目ID',
    name VARCHAR(255) NOT NULL COMMENT '项目名称',
    description TEXT COMMENT '项目描述',
    timeline_data LONGTEXT COMMENT '时间轴数据(JSON)',
    duration BIGINT DEFAULT 0 COMMENT '总时长(毫秒)',
    resolution VARCHAR(50) DEFAULT '1920x1080' COMMENT '分辨率',
    fps INT DEFAULT 30 COMMENT '帧率',
    status TINYINT DEFAULT 0 COMMENT '状态: 0-编辑中 1-已完成 2-导出中',
    export_progress INT DEFAULT 0 COMMENT '导出进度(0-100)',
    export_result_path VARCHAR(500) COMMENT '导出结果路径',
    is_deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_id (user_id),
    INDEX idx_project_id (project_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='剪辑项目表';

CREATE TABLE IF NOT EXISTS t_timeline_track (
    id BIGINT PRIMARY KEY COMMENT '轨道ID',
    editor_project_id BIGINT NOT NULL COMMENT '剪辑项目ID',
    track_type VARCHAR(20) NOT NULL COMMENT '轨道类型: video/audio/text',
    track_name VARCHAR(100) COMMENT '轨道名称',
    track_index INT NOT NULL COMMENT '轨道索引(0开始)',
    volume INT DEFAULT 100 COMMENT '音量(0-100)',
    is_muted TINYINT DEFAULT 0 COMMENT '是否静音',
    is_locked TINYINT DEFAULT 0 COMMENT '是否锁定',
    is_deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_editor_project_id (editor_project_id),
    INDEX idx_track_type (track_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='时间轴轨道表';

CREATE TABLE IF NOT EXISTS t_timeline_clip (
    id BIGINT PRIMARY KEY COMMENT '片段ID',
    track_id BIGINT NOT NULL COMMENT '轨道ID',
    source_type VARCHAR(20) NOT NULL COMMENT '源类型: video/audio/image/text',
    source_id VARCHAR(100) COMMENT '源素材ID',
    source_path VARCHAR(500) COMMENT '源文件路径',
    bucket_name VARCHAR(100) COMMENT '存储桶名称',
    clip_name VARCHAR(255) COMMENT '片段名称',
    start_position BIGINT NOT NULL COMMENT '在轨道上的起始位置(毫秒)',
    duration BIGINT NOT NULL COMMENT '片段时长(毫秒)',
    source_start BIGINT DEFAULT 0 COMMENT '源素材起始偏移(毫秒)',
    source_duration BIGINT COMMENT '源素材原始时长(毫秒)',
    volume INT DEFAULT 100 COMMENT '音量(0-100)',
    opacity INT DEFAULT 100 COMMENT '透明度(0-100)',
    speed DOUBLE DEFAULT 1.0 COMMENT '播放速度',
    in_transition VARCHAR(50) COMMENT '入转场效果',
    out_transition VARCHAR(50) COMMENT '出转场效果',
    transition_duration INT DEFAULT 500 COMMENT '转场时长(毫秒)',
    effects TEXT COMMENT '特效参数(JSON)',
    is_deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_track_id (track_id),
    INDEX idx_source_type (source_type),
    INDEX idx_source_id (source_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='时间轴片段表';

CREATE TABLE IF NOT EXISTS t_editor_analysis (
    id BIGINT PRIMARY KEY COMMENT '分析记录ID',
    editor_project_id BIGINT NOT NULL COMMENT '剪辑项目ID',
    scene_detection TEXT COMMENT '场景检测结果(JSON)',
    audio_quality INT DEFAULT 0 COMMENT '音频质量评分(0-100)',
    audio_issues TEXT COMMENT '音频问题列表(JSON)',
    suggestions TEXT COMMENT '优化建议(JSON)',
    analysis_time DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '分析时间',
    is_deleted TINYINT DEFAULT 0 COMMENT '逻辑删除',
    INDEX idx_editor_project_id (editor_project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='编辑器分析记录表';