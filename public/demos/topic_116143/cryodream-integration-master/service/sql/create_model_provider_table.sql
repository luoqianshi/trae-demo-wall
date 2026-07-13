-- 模型厂商表（PostgreSQL）
CREATE TABLE IF NOT EXISTS model_provider (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    default_base_url VARCHAR(500),
    models TEXT,
    doc_url VARCHAR(500),
    icon VARCHAR(200),
    sort_order INT DEFAULT 0,
    status INT DEFAULT 1,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_delete INT DEFAULT 0
);

COMMENT ON TABLE model_provider IS '模型厂商表';
COMMENT ON COLUMN model_provider.id IS '主键ID';
COMMENT ON COLUMN model_provider.code IS '厂商编码（唯一标识）';
COMMENT ON COLUMN model_provider.name IS '厂商名称';
COMMENT ON COLUMN model_provider.default_base_url IS '默认接口地址';
COMMENT ON COLUMN model_provider.models IS '支持模型列表（JSON 格式）';
COMMENT ON COLUMN model_provider.doc_url IS 'API 文档地址';
COMMENT ON COLUMN model_provider.icon IS '图标';
COMMENT ON COLUMN model_provider.sort_order IS '排序';
COMMENT ON COLUMN model_provider.status IS '状态（0-禁用，1-启用）';
COMMENT ON COLUMN model_provider.create_time IS '创建时间';
COMMENT ON COLUMN model_provider.update_time IS '更新时间';
COMMENT ON COLUMN model_provider.is_delete IS '是否删除（0-未删除，1-已删除）';

-- 插入预置厂商数据（先清空已有数据避免冲突）
DELETE FROM model_provider;

INSERT INTO model_provider (id, code, name, default_base_url, models, doc_url, icon, sort_order, status) VALUES
('provider-001', 'openai', 'OpenAI', 'https://api.openai.com/v1', '["gpt-4o","gpt-4o-mini","gpt-4-turbo","gpt-3.5-turbo"]', 'https://platform.openai.com/docs', 'openai', 1, 1),
('provider-002', 'deepseek', 'DeepSeek', 'https://api.deepseek.com/v1', '["deepseek-v4-flash","deepseek-v4-pro"]', 'https://api-docs.deepseek.com/quick_start/pricing', 'deepseek', 2, 1),
('provider-003', 'qwen', '通义千问', 'https://dashscope.aliyuncs.com/api/v1', '["qwen-plus","qwen-turbo","qwen-max","qwen-long"]', 'https://help.aliyun.com/zh/dashscope/', 'qwen', 3, 1),
('provider-004', 'anthropic', 'Anthropic', 'https://api.anthropic.com', '["claude-3-5-sonnet-20241022","claude-3-opus-20240229","claude-3-sonnet-20240229","claude-3-haiku-20240307"]', 'https://docs.anthropic.com', 'anthropic', 4, 1),
('provider-005', 'ollama', 'Ollama', 'http://localhost:11434', '["llama3.1","llama3","mistral","codellama","phi3"]', 'https://ollama.com/library', 'ollama', 5, 1);
