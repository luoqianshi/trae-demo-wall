CREATE TABLE IF NOT EXISTS task (
    id VARCHAR(64) PRIMARY KEY,
    type VARCHAR(64) NOT NULL COMMENT '任务类型: cognitive_ingest, basic_ingest, etc',
    category VARCHAR(64) NOT NULL DEFAULT 'knowledge_base' COMMENT '任务分类: knowledge_base, workflow, etc',
    status VARCHAR(32) NOT NULL DEFAULT 'pending' COMMENT 'pending, running, completed, failed',
    progress INT DEFAULT 0 COMMENT '进度 0-100',
    title VARCHAR(256) COMMENT '任务标题',
    params TEXT COMMENT '任务参数 JSON',
    result TEXT COMMENT '任务结果 JSON',
    error_message TEXT COMMENT '错误信息',
    create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_delete INT DEFAULT 0
);
