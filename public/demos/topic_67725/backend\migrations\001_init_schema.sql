-- === 见澄明 H5 数据库初始化迁移 ===
-- 版本: v2.0 + v4.0 扩展
-- 7 个核心数据实体

-- ============================================
-- 1. 用户表 (users)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    user_id VARCHAR(64) PRIMARY KEY,
    openid VARCHAR(128) UNIQUE,
    nickname VARCHAR(64),
    avatar_url TEXT,
    user_type VARCHAR(16) NOT NULL DEFAULT 'anonymous' CHECK (user_type IN ('anonymous', 'registered')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_users_openid ON users(openid);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at);

-- ============================================
-- 2. 评测记录表 (evaluations) - 核心表，v4.0 扩展
-- ============================================
CREATE TABLE IF NOT EXISTS evaluations (
    eval_id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version VARCHAR(16) NOT NULL DEFAULT 'v4.0',
    eval_type VARCHAR(16) NOT NULL CHECK (eval_type IN ('standard', 'fast')),
    total_duration_ms INT NOT NULL,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,

    -- 原始答案 JSON
    answers JSONB NOT NULL DEFAULT '[]',

    -- 归一化分数 JSON
    norm_scores JSONB NOT NULL DEFAULT '{}',

    -- 三轴分数 (原始 + 效度修正后)
    jiancha_raw INT NOT NULL DEFAULT 0,
    jiancha_final INT NOT NULL DEFAULT 0,
    chengxing_raw INT NOT NULL DEFAULT 0,
    chengxing_final INT NOT NULL DEFAULT 0,
    mingding_raw INT NOT NULL DEFAULT 0,
    mingding_final INT NOT NULL DEFAULT 0,

    -- 效度修正
    se_score INT NOT NULL DEFAULT 0,
    se_flagged BOOLEAN NOT NULL DEFAULT FALSE,
    cc_offset_level INT NOT NULL DEFAULT 0,
    cc_flagged BOOLEAN NOT NULL DEFAULT FALSE,

    -- 五指数 (v4.0 扩展: aiManipulation.subMarkers)
    five_indices JSONB NOT NULL DEFAULT '{}',

    -- 遮蔽诊断 (v4.0 扩展: shadowMode, driveShadowAlignment, overlapStatus)
    shadow JSONB NOT NULL DEFAULT '{}',

    -- 交叉判定 (v4.0 新增: 4 维度)
    cross_judgments JSONB NOT NULL DEFAULT '{}',

    -- 画像 (v4.0 扩展: exitType, coreLayer)
    portrait JSONB NOT NULL DEFAULT '{}',

    -- 一致性校验
    consistency JSONB NOT NULL DEFAULT '{}',

    -- 深度诊断
    deep_diagnosis JSONB NOT NULL DEFAULT '{}',

    -- 训练推荐
    training_recommendation JSONB NOT NULL DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_evaluations_user_id ON evaluations(user_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_created_at ON evaluations(created_at);
CREATE INDEX IF NOT EXISTS idx_evaluations_type_version ON evaluations(eval_type, version);

-- ============================================
-- 3. 训练会话表 (training_sessions) - v4.0 扩展
-- ============================================
CREATE TABLE IF NOT EXISTS training_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(64) NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    eval_id VARCHAR(64) REFERENCES evaluations(eval_id) ON DELETE SET NULL,
    mode VARCHAR(16) NOT NULL DEFAULT 'fast' CHECK (mode IN ('fast')),
    status VARCHAR(16) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    current_round INT NOT NULL DEFAULT 1 CHECK (current_round BETWEEN 1 AND 6),

    -- 评测快照 (v4.0 扩展字段)
    profile_snapshot JSONB NOT NULL DEFAULT '{}',

    -- 对话历史
    chat_history JSONB NOT NULL DEFAULT '[]',

    -- 训练总结
    summary JSONB NOT NULL DEFAULT '{}',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_training_sessions_user_id ON training_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_eval_id ON training_sessions(eval_id);
CREATE INDEX IF NOT EXISTS idx_training_sessions_status ON training_sessions(status);

-- ============================================
-- 4. 训练反馈表 (training_feedback)
-- ============================================
CREATE TABLE IF NOT EXISTS training_feedback (
    session_id UUID PRIMARY KEY REFERENCES training_sessions(session_id) ON DELETE CASCADE,
    learning_score INT NOT NULL CHECK (learning_score BETWEEN 1 AND 5),
    awareness_score INT NOT NULL CHECK (awareness_score BETWEEN 1 AND 5),
    nps_score INT NOT NULL CHECK (nps_score BETWEEN 1 AND 5),
    best_finding VARCHAR(512),
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 5. 报告缓存表 (report_cache)
-- ============================================
CREATE TABLE IF NOT EXISTS report_cache (
    report_id VARCHAR(64) PRIMARY KEY,
    eval_id VARCHAR(64) NOT NULL REFERENCES evaluations(eval_id) ON DELETE CASCADE,
    report_json JSONB NOT NULL DEFAULT '{}',
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_report_cache_eval_id ON report_cache(eval_id);
CREATE INDEX IF NOT EXISTS idx_report_cache_expires ON report_cache(expires_at);

-- ============================================
-- 6. API 凭证表 (api_tokens)
-- ============================================
CREATE TABLE IF NOT EXISTS api_tokens (
    id SERIAL PRIMARY KEY,
    service_name VARCHAR(32) NOT NULL UNIQUE,
    token_value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- 7. 题库表 (questions) - 可选，用于动态抽题
-- ============================================
CREATE TABLE IF NOT EXISTS questions (
    question_id VARCHAR(32) PRIMARY KEY,
    version VARCHAR(16) NOT NULL DEFAULT 'v4.0',
    eval_type VARCHAR(16) NOT NULL CHECK (eval_type IN ('standard', 'fast')),
    question_index INT NOT NULL,
    type VARCHAR(32) NOT NULL,
    layout VARCHAR(32) NOT NULL,
    title TEXT NOT NULL,
    subtitle TEXT,
    question TEXT,
    options JSONB NOT NULL DEFAULT '[]',
    cross_note VARCHAR(32),
    design_note TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_version_type ON questions(version, eval_type);

-- ============================================
-- 数据清理函数 (用于定时任务)
-- ============================================

-- 清理过期报告缓存
CREATE OR REPLACE FUNCTION cleanup_expired_reports()
RETURNS INT AS $$
DECLARE
    deleted_count INT;
BEGIN
    DELETE FROM report_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 清理不活跃匿名用户 (90 天)
CREATE OR REPLACE FUNCTION cleanup_inactive_anonymous_users()
RETURNS INT AS $$
DECLARE
    deleted_count INT;
BEGIN
    UPDATE users
    SET is_deleted = TRUE, deleted_at = NOW()
    WHERE user_type = 'anonymous'
      AND last_active_at < NOW() - INTERVAL '90 days'
      AND is_deleted = FALSE;
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
