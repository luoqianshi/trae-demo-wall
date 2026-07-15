CREATE TABLE IF NOT EXISTS t_user (
    id BIGINT NOT NULL,
    username VARCHAR(50) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(50) DEFAULT NULL,
    avatar VARCHAR(255) DEFAULT NULL,
    email VARCHAR(100) DEFAULT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER',
    status TINYINT NOT NULL DEFAULT 1,
    is_deleted TINYINT NOT NULL DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE (username)
);

CREATE TABLE IF NOT EXISTS t_project (
    id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500) DEFAULT NULL,
    cover_image VARCHAR(255) DEFAULT NULL,
    status TINYINT NOT NULL DEFAULT 1,
    is_deleted TINYINT NOT NULL DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX (user_id),
    INDEX (status)
);

CREATE TABLE IF NOT EXISTS t_video (
    id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    bucket_name VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    duration INT NOT NULL DEFAULT 0,
    width INT DEFAULT NULL,
    height INT DEFAULT NULL,
    fps DECIMAL(5,2) DEFAULT NULL,
    format VARCHAR(20) DEFAULT NULL,
    status TINYINT NOT NULL DEFAULT 0,
    is_deleted TINYINT NOT NULL DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX (project_id),
    INDEX (user_id),
    INDEX (status)
);

CREATE TABLE IF NOT EXISTS t_video_analysis (
    id BIGINT NOT NULL,
    video_id BIGINT NOT NULL,
    transcript_json CLOB DEFAULT NULL,
    frames_json CLOB DEFAULT NULL,
    prompts_json CLOB DEFAULT NULL,
    summary TEXT DEFAULT NULL,
    status TINYINT NOT NULL DEFAULT 0,
    progress INT NOT NULL DEFAULT 0,
    error_msg VARCHAR(500) DEFAULT NULL,
    is_deleted TINYINT NOT NULL DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE (video_id),
    INDEX (status)
);

CREATE TABLE IF NOT EXISTS t_video_frame (
    id BIGINT NOT NULL,
    video_id BIGINT NOT NULL,
    analysis_id BIGINT DEFAULT NULL,
    frame_index INT NOT NULL,
    timestamp_ms BIGINT NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    bucket_name VARCHAR(100) NOT NULL,
    scene_tags VARCHAR(500) DEFAULT NULL,
    prompt_text TEXT DEFAULT NULL,
    is_key_frame TINYINT NOT NULL DEFAULT 1,
    is_deleted TINYINT NOT NULL DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX (video_id),
    INDEX (analysis_id)
);

CREATE TABLE IF NOT EXISTS t_audio (
    id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    video_id BIGINT DEFAULT NULL,
    filename VARCHAR(255) NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    bucket_name VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL DEFAULT 0,
    duration INT NOT NULL DEFAULT 0,
    sample_rate INT DEFAULT NULL,
    channels INT DEFAULT NULL,
    format VARCHAR(20) DEFAULT NULL,
    source_type VARCHAR(20) NOT NULL DEFAULT 'EXTRACTED',
    is_deleted TINYINT NOT NULL DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX (project_id),
    INDEX (user_id)
);

CREATE TABLE IF NOT EXISTS t_fusion_task (
    id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    video_ids_json CLOB NOT NULL,
    fusion_mode VARCHAR(30) NOT NULL,
    script_outline TEXT DEFAULT NULL,
    shot_suggestions CLOB DEFAULT NULL,
    status TINYINT NOT NULL DEFAULT 0,
    progress INT NOT NULL DEFAULT 0,
    error_msg VARCHAR(500) DEFAULT NULL,
    is_deleted TINYINT NOT NULL DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX (project_id),
    INDEX (status)
);

CREATE TABLE IF NOT EXISTS t_frame_task (
    id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    video_id BIGINT DEFAULT NULL,
    mode VARCHAR(30) NOT NULL,
    params_json CLOB DEFAULT NULL,
    source_frames_json CLOB DEFAULT NULL,
    result_paths_json CLOB DEFAULT NULL,
    comfyui_task_id VARCHAR(100) DEFAULT NULL,
    status TINYINT NOT NULL DEFAULT 0,
    progress INT NOT NULL DEFAULT 0,
    error_msg VARCHAR(500) DEFAULT NULL,
    is_deleted TINYINT NOT NULL DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX (project_id),
    INDEX (status)
);

CREATE TABLE IF NOT EXISTS t_audio_task (
    id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    source_audio_id BIGINT DEFAULT NULL,
    mode VARCHAR(30) NOT NULL,
    voice_id VARCHAR(100) DEFAULT NULL,
    voice_name VARCHAR(100) DEFAULT NULL,
    text_content TEXT DEFAULT NULL,
    params_json CLOB DEFAULT NULL,
    result_path VARCHAR(500) DEFAULT NULL,
    result_bucket VARCHAR(100) DEFAULT NULL,
    status TINYINT NOT NULL DEFAULT 0,
    progress INT NOT NULL DEFAULT 0,
    error_msg VARCHAR(500) DEFAULT NULL,
    is_deleted TINYINT NOT NULL DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX (project_id),
    INDEX (status)
);

CREATE TABLE IF NOT EXISTS t_voice_library (
    id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    voice_name VARCHAR(100) NOT NULL,
    description VARCHAR(500) DEFAULT NULL,
    gender VARCHAR(10) DEFAULT NULL,
    language VARCHAR(20) DEFAULT NULL,
    feature_path VARCHAR(500) DEFAULT NULL,
    source_audio_id BIGINT DEFAULT NULL,
    is_system TINYINT NOT NULL DEFAULT 0,
    is_deleted TINYINT NOT NULL DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX (user_id)
);

CREATE TABLE IF NOT EXISTS t_edit_project (
    id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    timeline_json LONGTEXT DEFAULT NULL,
    assets_json CLOB DEFAULT NULL,
    settings_json CLOB DEFAULT NULL,
    cover_image VARCHAR(255) DEFAULT NULL,
    duration INT NOT NULL DEFAULT 0,
    export_path VARCHAR(500) DEFAULT NULL,
    export_bucket VARCHAR(100) DEFAULT NULL,
    status TINYINT NOT NULL DEFAULT 0,
    is_deleted TINYINT NOT NULL DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX (project_id),
    INDEX (user_id)
);

CREATE TABLE IF NOT EXISTS t_ai_service_config (
    id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    service_type VARCHAR(30) NOT NULL,
    endpoint VARCHAR(500) NOT NULL,
    api_key VARCHAR(255) DEFAULT NULL,
    enabled TINYINT NOT NULL DEFAULT 1,
    is_default TINYINT NOT NULL DEFAULT 0,
    is_deleted TINYINT NOT NULL DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX (user_id),
    INDEX (service_type)
);

CREATE TABLE IF NOT EXISTS t_timeline_track (
    id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    edit_project_id BIGINT NOT NULL,
    track_type VARCHAR(20) NOT NULL,
    track_name VARCHAR(100) NOT NULL,
    track_index INT NOT NULL,
    is_deleted TINYINT NOT NULL DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX (project_id),
    INDEX (edit_project_id)
);

CREATE TABLE IF NOT EXISTS t_timeline_clip (
    id BIGINT NOT NULL,
    project_id BIGINT NOT NULL,
    edit_project_id BIGINT NOT NULL,
    track_id BIGINT NOT NULL,
    clip_type VARCHAR(20) NOT NULL,
    source_id BIGINT DEFAULT NULL,
    source_path VARCHAR(500) DEFAULT NULL,
    start_time_ms BIGINT NOT NULL DEFAULT 0,
    end_time_ms BIGINT NOT NULL DEFAULT 0,
    clip_order INT NOT NULL DEFAULT 0,
    params_json CLOB DEFAULT NULL,
    is_deleted TINYINT NOT NULL DEFAULT 0,
    create_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX (project_id),
    INDEX (track_id)
);
