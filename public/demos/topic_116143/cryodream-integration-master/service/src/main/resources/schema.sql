-- 模型配置表
CREATE TABLE IF NOT EXISTS model_config (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    model_type VARCHAR(32) NOT NULL DEFAULT 'llm',
    provider VARCHAR(64) NOT NULL,
    provider_name VARCHAR(128),
    model_name VARCHAR(128) NOT NULL,
    base_url VARCHAR(512),
    api_key VARCHAR(512),
    temperature DOUBLE PRECISION DEFAULT 0.1,
    max_tokens INT DEFAULT 1000,
    enabled SMALLINT DEFAULT 1,
    description VARCHAR(1024),
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_delete SMALLINT DEFAULT 0
);

-- 添加 model_type 列（如果表已存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'model_config' AND column_name = 'model_type'
    ) THEN
        ALTER TABLE model_config ADD COLUMN model_type VARCHAR(32) NOT NULL DEFAULT 'llm';
    END IF;
END $$;

COMMENT ON COLUMN model_config.model_type IS '模型类型: llm=大语言模型, embedding=嵌入模型';

-- 项目表
CREATE TABLE IF NOT EXISTS flow_project (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    description VARCHAR(1024),
    icon VARCHAR(64),
    color VARCHAR(64),
    scenario VARCHAR(128),
    status VARCHAR(32) DEFAULT 'active',
    sort_order INT DEFAULT 0,
    last_workflow_id VARCHAR(36),
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_delete SMALLINT DEFAULT 0
);

-- 工作流表
CREATE TABLE IF NOT EXISTS workflow (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    name VARCHAR(128) NOT NULL,
    description VARCHAR(1024),
    status VARCHAR(32) DEFAULT 'draft',
    version INT DEFAULT 1,
    source_template_id VARCHAR(36),
    graph_json TEXT,
    node_count INT DEFAULT 0,
    edge_count INT DEFAULT 0,
    last_run_status VARCHAR(32),
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_delete SMALLINT DEFAULT 0
);

-- 工作流模板表
CREATE TABLE IF NOT EXISTS workflow_template (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    description VARCHAR(1024),
    category VARCHAR(64),
    tags VARCHAR(512),
    cover_color VARCHAR(64),
    graph_json TEXT,
    system_template SMALLINT DEFAULT 1,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_delete SMALLINT DEFAULT 0
);

-- 启用 pgvector 扩展（支持向量存储和相似度搜索）
CREATE EXTENSION IF NOT EXISTS vector;

-- 向量知识库表（使用 pgvector）
CREATE TABLE IF NOT EXISTS knowledge_base (
    id VARCHAR(36) PRIMARY KEY,
    project_id VARCHAR(36) NOT NULL,
    name VARCHAR(128) NOT NULL,
    description VARCHAR(1024),
    domain VARCHAR(128),
    embedding_model_id VARCHAR(36),
    chunk_count INT DEFAULT 0,
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_delete SMALLINT DEFAULT 0
);

-- 向量文档表
CREATE TABLE IF NOT EXISTS knowledge_document (
    id VARCHAR(36) PRIMARY KEY,
    kb_id VARCHAR(36) NOT NULL,
    title VARCHAR(256) NOT NULL,
    file_type VARCHAR(20),
    file_path VARCHAR(500),
    file_size BIGINT DEFAULT 0,
    raw_text TEXT,
    global_metadata JSONB,
    status VARCHAR(20) DEFAULT 'pending',
    ingestion_mode VARCHAR(20) DEFAULT 'auto',
    resolved_ingestion_mode VARCHAR(20),
    chunk_count INT DEFAULT 0,
    error_message VARCHAR(1024),
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_delete SMALLINT DEFAULT 0
);

-- 向量片段表（使用 pgvector 存储 embedding，全息元数据背包）
CREATE TABLE IF NOT EXISTS knowledge_chunk (
    id VARCHAR(36) PRIMARY KEY,
    doc_id VARCHAR(36) NOT NULL,
    kb_id VARCHAR(36) NOT NULL,
    chunk_index INT DEFAULT 0,
    chunk_text TEXT NOT NULL,
    raw_text TEXT,
    metadata JSONB,
    embedding vector(1024),
    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_delete SMALLINT DEFAULT 0
);

-- 创建向量索引（使用 HNSW 索引，适合中等规模数据）
CREATE INDEX IF NOT EXISTS idx_chunk_embedding ON knowledge_chunk USING hnsw (embedding vector_cosine_ops);

-- 创建文档关联索引
CREATE INDEX IF NOT EXISTS idx_kb_project_id ON knowledge_base(project_id);
CREATE INDEX IF NOT EXISTS idx_document_kb_id ON knowledge_document(kb_id);
CREATE INDEX IF NOT EXISTS idx_document_status ON knowledge_document(status);
CREATE INDEX IF NOT EXISTS idx_chunk_kb_id ON knowledge_chunk(kb_id);
CREATE INDEX IF NOT EXISTS idx_chunk_doc_id ON knowledge_chunk(doc_id);

-- 初始数据
INSERT INTO model_config (id, name, model_type, provider, provider_name, model_name, base_url, api_key, temperature, max_tokens, enabled, description, is_delete)
SELECT 'model-config-001', '默认 OpenAI 小模型', 'llm', 'openai', 'OpenAI', 'gpt-4o-mini', 'https://api.openai.com/v1', '', 0.1, 1000, 1, '适合常规对话和轻量任务', 0
WHERE NOT EXISTS (SELECT 1 FROM model_config WHERE id = 'model-config-001');

INSERT INTO model_config (id, name, model_type, provider, provider_name, model_name, base_url, api_key, temperature, max_tokens, enabled, description, is_delete)
SELECT 'model-config-002', '默认 Claude Sonnet', 'llm', 'anthropic', 'Anthropic', 'claude-3-5-sonnet-latest', 'https://api.anthropic.com', '', 0.1, 1024, 1, '适合复杂推理和长文本任务', 0
WHERE NOT EXISTS (SELECT 1 FROM model_config WHERE id = 'model-config-002');

INSERT INTO model_config (id, name, model_type, provider, provider_name, model_name, base_url, api_key, temperature, max_tokens, enabled, description, is_delete)
SELECT 'model-config-003', '本地 Ollama', 'llm', 'ollama', 'Ollama', 'llama3.1', 'http://localhost:11434', '', 0.1, 1000, 1, '适合本地模型调试', 0
WHERE NOT EXISTS (SELECT 1 FROM model_config WHERE id = 'model-config-003');

INSERT INTO model_config (id, name, model_type, provider, provider_name, model_name, base_url, api_key, temperature, max_tokens, enabled, description, is_delete)
SELECT 'model-config-004', 'SiliconFlow Qwen3 向量模型', 'embedding', 'siliconflow', 'SiliconFlow', 'Qwen/Qwen3-Embedding-4B', 'https://api.siliconflow.cn/v1', '', 0.1, 512, 1, 'Qwen3 中文语义嵌入模型，用于 RAG 向量检索', 0
WHERE NOT EXISTS (SELECT 1 FROM model_config WHERE id = 'model-config-004');

INSERT INTO flow_project (id, name, description, icon, color, scenario, status, sort_order, is_delete)
SELECT 'project-default-001', '默认项目', '个人工作流的默认收纳空间，可直接创建和调试工作流。', 'FolderKanban', 'blue', '通用工作流', 'active', 0, 0
WHERE NOT EXISTS (SELECT 1 FROM flow_project WHERE id = 'project-default-001');

INSERT INTO workflow_template (id, name, description, category, tags, cover_color, graph_json, system_template, is_delete)
SELECT 'template-001', '基础问答助手', '最小可用的 ChatInput → LanguageModel → ChatOutput 工作流。', 'chat', '问答,入门,LLM', 'blue', '{"nodes":[],"edges":[]}', 1, 0
WHERE NOT EXISTS (SELECT 1 FROM workflow_template WHERE id = 'template-001');

INSERT INTO workflow_template (id, name, description, category, tags, cover_color, graph_json, system_template, is_delete)
SELECT 'template-002', '提示词加工器', '通过 PromptTemplate 统一整理用户输入，再交给模型输出。', 'prompt', '提示词,文本处理', 'violet', '{"nodes":[],"edges":[]}', 1, 0
WHERE NOT EXISTS (SELECT 1 FROM workflow_template WHERE id = 'template-002');

INSERT INTO workflow_template (id, name, description, category, tags, cover_color, graph_json, system_template, is_delete)
SELECT 'template-003', '智能体草稿', '预留 Agent 节点，适合后续扩展工具调用和复杂任务。', 'agent', 'Agent,工具调用,规划', 'emerald', '{"nodes":[],"edges":[]}', 1, 0
WHERE NOT EXISTS (SELECT 1 FROM workflow_template WHERE id = 'template-003');

-- 为 knowledge_base 表添加缺失字段（幂等）
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS domain VARCHAR(128);
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS embedding_model_id VARCHAR(36);
ALTER TABLE knowledge_base ADD COLUMN IF NOT EXISTS chunk_count INT DEFAULT 0;

-- 为 knowledge_chunk 表添加缺失字段（幂等）
ALTER TABLE knowledge_chunk ADD COLUMN IF NOT EXISTS chunk_index INT DEFAULT 0;
ALTER TABLE knowledge_chunk ADD COLUMN IF NOT EXISTS chunk_text TEXT;
ALTER TABLE knowledge_chunk ADD COLUMN IF NOT EXISTS raw_text TEXT;
-- 父子块（Parent-Child Chunking）与 SPO 事件三元组（轻量 GraphRAG）
ALTER TABLE knowledge_chunk ADD COLUMN IF NOT EXISTS parent_id VARCHAR(36);
ALTER TABLE knowledge_chunk ADD COLUMN IF NOT EXISTS chunk_level VARCHAR(16) DEFAULT 'child';
ALTER TABLE knowledge_chunk ADD COLUMN IF NOT EXISTS events JSONB;
CREATE INDEX IF NOT EXISTS idx_chunk_parent_id ON knowledge_chunk(parent_id);
CREATE INDEX IF NOT EXISTS idx_chunk_level ON knowledge_chunk(chunk_level);

-- 为 knowledge_document 表添加缺失字段（幂等）
ALTER TABLE knowledge_document ADD COLUMN IF NOT EXISTS file_type VARCHAR(20);
ALTER TABLE knowledge_document ADD COLUMN IF NOT EXISTS file_path VARCHAR(500);
ALTER TABLE knowledge_document ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT 0;
ALTER TABLE knowledge_document ADD COLUMN IF NOT EXISTS raw_text TEXT;
ALTER TABLE knowledge_document ADD COLUMN IF NOT EXISTS global_metadata JSONB;
ALTER TABLE knowledge_document ADD COLUMN IF NOT EXISTS error_message VARCHAR(1024);
ALTER TABLE knowledge_document ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE knowledge_document ADD COLUMN IF NOT EXISTS ingestion_mode VARCHAR(20) DEFAULT 'auto';
ALTER TABLE knowledge_document ADD COLUMN IF NOT EXISTS resolved_ingestion_mode VARCHAR(20);
ALTER TABLE knowledge_document ADD COLUMN IF NOT EXISTS chunk_count INT DEFAULT 0;

-- 为 workflow 表添加 is_template 字段（幂等，PostgreSQL 支持 ADD COLUMN IF NOT EXISTS）
ALTER TABLE workflow ADD COLUMN IF NOT EXISTS is_template SMALLINT DEFAULT 0;

-- 为 workflow 表添加 category 和 tags 字段（用于工作流分类和标签管理）
ALTER TABLE workflow ADD COLUMN IF NOT EXISTS category VARCHAR(64);
ALTER TABLE workflow ADD COLUMN IF NOT EXISTS tags VARCHAR(512);

-- 将提示词加工器工作流标记为模板
UPDATE workflow SET is_template = 1 WHERE id = '2deb82eaae132f2a00d450e001a30d5e' AND is_template = 0;
