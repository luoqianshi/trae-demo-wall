package com.ice.template.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class KnowledgeSchemaMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public KnowledgeSchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        ensureColumn("ingestion_mode", "VARCHAR(20) DEFAULT 'auto'");
        ensureColumn("resolved_ingestion_mode", "VARCHAR(20)");
        ensureSystemSettingTable();
        ensureChunkColumns();
        ensureStandardIngestionTemplate();
        ensureTieredIngestionTemplate();
        ensureCognitiveIngestionTemplate();
        ensureWebIngestionTemplate();
        ensureFileIngestionTemplate();
        ensureVideoIngestionTemplate();
        ensureDouyinIngestionTemplate();
        ensureThinkingModelTable();
        ensureThinkingModelIngestionTemplate();
        ensureKnowledgeEventsTable();
        ensureEventIngestionTemplate();
        ensureKnowledgeCasesTable();
        ensureCaseIngestionTemplateNew();
        ensureKnowledgeEntitiesTable();
        ensureKnowledgeOpinionsTable();
        ensureOpinionIngestionTemplate();
        ensureDiaryAnalysisTemplate();
    }

    private void ensureDiaryAnalysisTemplate() {
        String graphJson = """
                {
                  "nodes": [
                    {"id":"node-input","type":"genericNode","position":{"x":-320,"y":0},"data":{"id":"node-input","type":"ChatInput","node":{"type":"ChatInput","display_name":"日记正文输入","description":"输入日记正文内容，供 AI 分析。","icon":"MessageSquare","base_classes":["Data"],"category":"inputs","template":{"input":{"name":"input","display_name":"日记正文","type":"str","input_types":["Text"],"value":"","required":true}},"outputs":[{"name":"text","display_name":"文本","types":["Text"]}]}}},
                    {"id":"node-prompt","type":"genericNode","position":{"x":0,"y":0},"data":{"id":"node-prompt","type":"PromptTemplate","node":{"type":"PromptTemplate","display_name":"分析提示词","description":"构建日记分析的结构化提示词。","icon":"FileText","base_classes":["Data"],"category":"prompts","template":{"template":{"name":"template","display_name":"提示词模板","type":"str","input_types":[],"value":"你是一位日记助手，请对以下日记正文做结构化分析。\\n\\n分类池：工作 / 学习 / 生活 / 情感 / 健康 / 灵感 / 复盘\\n情绪枚举：joy(喜悦) / calm(平静) / anxious(焦虑) / sad(低落) / angry(愤怒) / confused(困惑)\\n情绪打分：-2(极负) ~ +2(极正)\\n\\n请仅返回 JSON（不要 Markdown 代码块）：\\n{\\\"category\\\":\\\"从分类池中选一个\\\",\\\"mood\\\":\\\"情绪枚举之一\\\",\\\"moodScore\\\":-2到2的整数,\\\"shortSummary\\\":\\\"20字以内的一句话总结\\\",\\\"summary\\\":\\\"60字以内摘要\\\",\\\"tags\\\":[\\\"3-5个关键词标签\\\"]}","required":true}},"outputs":[{"name":"prompt","display_name":"提示词","types":["Text"]}]}}},
                    {"id":"node-llm","type":"genericNode","position":{"x":320,"y":0},"data":{"id":"node-llm","type":"LanguageModel","node":{"type":"LanguageModel","display_name":"LLM 分析","description":"调用大语言模型对日记做分析。","icon":"BrainCircuit","base_classes":["Data"],"category":"models","template":{"prompt":{"name":"prompt","display_name":"提示词","type":"str","input_types":["Text"],"value":"","required":true},"model_config_id":{"name":"model_config_id","display_name":"模型配置","type":"model_config","input_types":[],"value":"","required":false},"temperature":{"name":"temperature","display_name":"温度","type":"float","input_types":[],"value":0.3,"required":false}},"outputs":[{"name":"response","display_name":"AI 响应","types":["Text"]}]}}},
                    {"id":"node-output","type":"genericNode","position":{"x":640,"y":0},"data":{"id":"node-output","type":"ChatOutput","node":{"type":"ChatOutput","display_name":"分析结果","description":"输出 AI 分析的 JSON 结果。","icon":"SquareArrowOut","base_classes":["Data"],"category":"outputs","template":{"input":{"name":"input","display_name":"AI 响应","type":"str","input_types":["Text"],"value":"","required":true}},"outputs":[{"name":"result","display_name":"结果","types":["Text"]}]}}}
                  ],
                  "edges": [
                    {"id":"edge-input-prompt","source":"node-input","target":"node-prompt","sourceHandle":"text","targetHandle":"template"},
                    {"id":"edge-prompt-llm","source":"node-prompt","target":"node-llm","sourceHandle":"prompt","targetHandle":"prompt"},
                    {"id":"edge-llm-output","source":"node-llm","target":"node-output","sourceHandle":"response","targetHandle":"input"}
                  ]
                }
                """;
        try {
            jdbcTemplate.update("""
                    INSERT INTO workflow_template (id, name, description, category, tags, cover_color, graph_json, system_template, is_delete)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)
                    ON CONFLICT (id) DO UPDATE SET
                      name = EXCLUDED.name,
                      description = EXCLUDED.description,
                      category = EXCLUDED.category,
                      tags = EXCLUDED.tags,
                      cover_color = EXCLUDED.cover_color,
                      graph_json = EXCLUDED.graph_json,
                      system_template = 1,
                      is_delete = 0,
                      update_time = CURRENT_TIMESTAMP
                    WHERE workflow_template.graph_json IS NULL OR workflow_template.id = 'tpl-diary-analysis'
                    """,
                    "tpl-diary-analysis",
                    "日记 AI 分析",
                    "对日记正文做 AI 结构化分析：自动分类、情绪识别、20字短摘要、关键词标签提取。可在调试器中输入日记正文运行。",
                    "analysis",
                    "日记,AI分析,分类,情绪,摘要,标签",
                    "rose",
                    graphJson);
            log.info("日记AI分析工作流模板初始化完成");
        } catch (Exception e) {
            log.warn("diary analysis workflow template migration skipped: {}", e.getMessage());
        }
    }

    private void ensureColumn(String columnName, String definition) {
        try {
            jdbcTemplate.execute("ALTER TABLE knowledge_document ADD COLUMN IF NOT EXISTS " + columnName + " " + definition);
        } catch (Exception e) {
            log.warn("knowledge_document column migration skipped: {}", e.getMessage());
        }
    }

    private void ensureSystemSettingTable() {
        try {
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS system_setting (
                      id VARCHAR(64) PRIMARY KEY,
                      setting_key VARCHAR(128) NOT NULL UNIQUE,
                      setting_value TEXT,
                      description VARCHAR(512),
                      create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                      is_delete INTEGER DEFAULT 0
                    )
                    """);
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_system_setting_key ON system_setting(setting_key)");
        } catch (Exception e) {
            log.warn("system_setting table migration skipped: {}", e.getMessage());
        }
    }

    /** 父子块（Parent-Child Chunking）+ SPO 事件三元组所需的 chunk 表字段（幂等）。 */
    private void ensureChunkColumns() {
        String[] ddls = {
            "ALTER TABLE knowledge_chunk ADD COLUMN IF NOT EXISTS parent_id VARCHAR(36)",
            "ALTER TABLE knowledge_chunk ADD COLUMN IF NOT EXISTS chunk_level VARCHAR(16) DEFAULT 'child'",
            "ALTER TABLE knowledge_chunk ADD COLUMN IF NOT EXISTS events JSONB",
            "ALTER TABLE knowledge_chunk ADD COLUMN IF NOT EXISTS child_ids JSONB",
            "CREATE INDEX IF NOT EXISTS idx_chunk_parent_id ON knowledge_chunk(parent_id)",
            "CREATE INDEX IF NOT EXISTS idx_chunk_level ON knowledge_chunk(chunk_level)"
        };
        for (String ddl : ddls) {
            try {
                jdbcTemplate.execute(ddl);
            } catch (Exception e) {
                log.warn("knowledge_chunk column migration skipped [{}]: {}", ddl, e.getMessage());
            }
        }
    }

    private void ensureStandardIngestionTemplate() {
        String graphJson = """
                {
                  "nodes": [
                    {"id":"node-document-loader","type":"genericNode","position":{"x":-320,"y":0},"data":{"id":"node-document-loader","type":"DocumentLoader","node":{"type":"DocumentLoader","display_name":"文档加载器","description":"加载文档并解析为纯文本。","icon":"Paperclip","base_classes":["Data"],"category":"files_and_knowledge","template":{"document_id":{"name":"document_id","display_name":"选择文档","type":"document","input_types":[],"value":"","required":false},"content":{"name":"content","display_name":"文本内容","type":"str","input_types":["Text"],"value":"","required":false},"file_type":{"name":"file_type","display_name":"文件类型","type":"str","input_types":[],"value":"txt","required":false}},"outputs":[{"name":"text","display_name":"文本","types":["Text"]}]}}},
                    {"id":"node-intelligent-chunker","type":"genericNode","position":{"x":120,"y":0},"data":{"id":"node-intelligent-chunker","type":"IntelligentSemanticChunker","node":{"type":"IntelligentSemanticChunker","display_name":"LLM 语义分块","description":"优先使用 LLM 识别语义边界进行分块，模型不可用时后端自动回退规则分块。","icon":"BrainCircuit","base_classes":["Data"],"category":"files_and_knowledge","template":{"input":{"name":"input","display_name":"输入文本","type":"str","input_types":["Text","Data"],"value":"","required":true},"model_config_id":{"name":"model_config_id","display_name":"模型配置","type":"model_config","input_types":[],"value":"","required":false},"chunk_size":{"name":"chunk_size","display_name":"兜底分块大小","type":"int","input_types":[],"value":500,"required":false},"overlap_size":{"name":"overlap_size","display_name":"兜底重叠大小","type":"int","input_types":[],"value":50,"required":false}},"outputs":[{"name":"chunks","display_name":"文本块","types":["Data"]},{"name":"chunkCount","display_name":"块数量","types":["Number"]}]}}},
                    {"id":"node-writer","type":"genericNode","position":{"x":560,"y":0},"data":{"id":"node-writer","type":"KnowledgeBaseWriter","node":{"type":"KnowledgeBaseWriter","display_name":"知识库写入","description":"将 Chunk 数据写入知识库并向量化存储。","icon":"Save","base_classes":["Data"],"category":"files_and_knowledge","template":{"chunks":{"name":"chunks","display_name":"文本块数据","type":"str","input_types":["Data"],"value":"","required":true},"kb_id":{"name":"kb_id","display_name":"知识库 ID","type":"str","input_types":[],"value":"","required":true},"embedding_model_id":{"name":"embedding_model_id","display_name":"嵌入模型","type":"model_config","input_types":[],"value":"","required":false,"modelType":"embedding"}},"outputs":[{"name":"result","display_name":"结果","types":["Data"]}]}}}
                  ],
                  "edges": [
                    {"id":"edge-loader-chunker","source":"node-document-loader","target":"node-intelligent-chunker","sourceHandle":"text","targetHandle":"input"},
                    {"id":"edge-chunker-writer","source":"node-intelligent-chunker","target":"node-writer","sourceHandle":"chunks","targetHandle":"chunks"}
                  ]
                }
                """;
        try {
            jdbcTemplate.update("""
                    INSERT INTO workflow_template (id, name, description, category, tags, cover_color, graph_json, system_template, is_delete)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)
                    ON CONFLICT (id) DO UPDATE SET
                      name = EXCLUDED.name,
                      description = EXCLUDED.description,
                      category = EXCLUDED.category,
                      tags = EXCLUDED.tags,
                      cover_color = EXCLUDED.cover_color,
                      graph_json = EXCLUDED.graph_json,
                      system_template = 1,
                      is_delete = 0,
                      update_time = CURRENT_TIMESTAMP
                    WHERE workflow_template.graph_json IS NULL OR workflow_template.graph_json LIKE '%"type":"SemanticChunker"%'
                    """,
                    "tpl-standard-rag-ingestion",
                    "普通 RAG 入库",
                    "优先使用 LLM 语义分块、模型不可用时规则分块兜底，并将 Chunk 向量化写入知识库的默认入库工作流。",
                    "rag",
                    "RAG,普通入库,LLM分块,知识库",
                    "slate",
                    graphJson);
        } catch (Exception e) {
            log.warn("standard ingestion workflow template migration skipped: {}", e.getMessage());
        }
    }

    private void ensureTieredIngestionTemplate() {
        String graphJson = """
                {
                  "nodes": [
                    {"id":"node-document-loader","type":"genericNode","position":{"x":-360,"y":0},"data":{"id":"node-document-loader","type":"DocumentLoader","node":{"type":"DocumentLoader","display_name":"文档加载器","description":"加载文档并解析为纯文本，支持从知识库选择或手动输入。","icon":"Paperclip","base_classes":["Data"],"category":"files_and_knowledge","template":{"document_id":{"name":"document_id","display_name":"选择文档","type":"document","input_types":[],"value":"","required":false},"file_path":{"name":"file_path","display_name":"文件路径","type":"str","input_types":["File"],"value":"","required":false},"content":{"name":"content","display_name":"文本内容","type":"str","input_types":["Text"],"value":"","required":false},"file_type":{"name":"file_type","display_name":"文件类型","type":"str","input_types":[],"value":"txt","required":false}},"outputs":[{"name":"text","display_name":"文本","types":["Text"]}]}}},
                    {"id":"node-router","type":"genericNode","position":{"x":40,"y":0},"data":{"id":"node-router","type":"TieredIngestionRouter","node":{"type":"TieredIngestionRouter","display_name":"分级入库路由","description":"根据入库模式、文档类型、长度和语义信号，在普通 RAG 与认知级 RAG 之间分流。","icon":"GitBranch","base_classes":["Logic"],"category":"flow_controls","template":{"input":{"name":"input","display_name":"输入文本","type":"str","input_types":["Text"],"value":"","required":true},"ingestion_mode":{"name":"ingestion_mode","display_name":"入库模式","type":"str","input_types":[],"value":"auto","required":true,"options":["auto","standard","deep"]},"standard_signals":{"name":"standard_signals","display_name":"普通信号","type":"str","input_types":[],"value":"API,接口,说明书,操作手册,菜单,日志,规章,制度","required":false},"deep_signals":{"name":"deep_signals","display_name":"深度信号","type":"str","input_types":[],"value":"观点,认为,吐槽,竞品,趋势,会议纪要,行业分析,风险,机会,情绪,战略,决策","required":false},"deep_length_threshold":{"name":"deep_length_threshold","display_name":"深度长度阈值","type":"int","input_types":[],"value":4000,"required":false}},"outputs":[{"name":"standard","display_name":"普通 RAG","types":["Text"]},{"name":"deep","display_name":"认知级 RAG","types":["Text"]}]}}},
                    {"id":"node-standard-chunker","type":"genericNode","position":{"x":460,"y":-180},"data":{"id":"node-standard-chunker","type":"IntelligentSemanticChunker","node":{"type":"IntelligentSemanticChunker","display_name":"普通路径 LLM 语义分块","description":"自动分级的普通路径也优先使用 LLM 识别语义边界，模型不可用时后端自动回退规则分块。","icon":"BrainCircuit","base_classes":["Data"],"category":"files_and_knowledge","template":{"input":{"name":"input","display_name":"输入文本","type":"str","input_types":["Text","Data"],"value":"","required":true},"model_config_id":{"name":"model_config_id","display_name":"模型配置","type":"model_config","input_types":[],"value":"","required":false},"chunk_size":{"name":"chunk_size","display_name":"兜底分块大小","type":"int","input_types":[],"value":500,"required":false},"overlap_size":{"name":"overlap_size","display_name":"兜底重叠大小","type":"int","input_types":[],"value":50,"required":false}},"outputs":[{"name":"chunks","display_name":"文本块","types":["Data"]},{"name":"chunkCount","display_name":"块数量","types":["Number"]}]}}},
                    {"id":"node-global-metadata","type":"genericNode","position":{"x":460,"y":120},"data":{"id":"node-global-metadata","type":"GlobalMetadataExtractor","node":{"type":"GlobalMetadataExtractor","display_name":"全局元数据提取","description":"使用 LLM 提取文档的全局元数据，用于后续 Chunk 的新版元数据挂载。","icon":"Metadata","base_classes":["Data"],"category":"files_and_knowledge","template":{"input":{"name":"input","display_name":"输入文本","type":"str","input_types":["Text"],"value":"","required":true},"model_config_id":{"name":"model_config_id","display_name":"模型配置","type":"model_config","input_types":[],"value":"","required":false}},"outputs":[{"name":"metadata","display_name":"完整元数据","types":["Data"]},{"name":"domain","display_name":"领域","types":["Text"]},{"name":"theme","display_name":"主题","types":["Text"]},{"name":"entities","display_name":"实体列表","types":["Data"]},{"name":"concepts","display_name":"概念列表","types":["Data"]}]}}},
                    {"id":"node-deep-chunker","type":"genericNode","position":{"x":840,"y":120},"data":{"id":"node-deep-chunker","type":"IntelligentSemanticChunker","node":{"type":"IntelligentSemanticChunker","display_name":"认知级语义分块","description":"使用 LLM 识别语义边界进行分块，避免因果关系断裂。","icon":"BrainCircuit","base_classes":["Data"],"category":"files_and_knowledge","template":{"input":{"name":"input","display_name":"输入文本","type":"str","input_types":["Text","Data"],"value":"","required":true},"model_config_id":{"name":"model_config_id","display_name":"模型配置","type":"model_config","input_types":[],"value":"","required":true,"info":"选择 LLM 模型用于语义边界识别"}},"outputs":[{"name":"chunks","display_name":"文本块","types":["Data"]},{"name":"chunkCount","display_name":"块数量","types":["Number"]}]}}},
                    {"id":"node-writer","type":"genericNode","position":{"x":1240,"y":0},"data":{"id":"node-writer","type":"KnowledgeBaseWriter","node":{"type":"KnowledgeBaseWriter","display_name":"知识库写入","description":"将 Chunk 数据连同元数据一起写入知识库，支持向量化存储。","icon":"Save","base_classes":["Data"],"category":"files_and_knowledge","template":{"chunks":{"name":"chunks","display_name":"文本块数据","type":"str","input_types":["Data"],"value":"","required":true},"kb_id":{"name":"kb_id","display_name":"知识库 ID","type":"str","input_types":[],"value":"","required":true},"embedding_model_id":{"name":"embedding_model_id","display_name":"嵌入模型","type":"model_config","input_types":[],"value":"","required":false,"info":"选择已配置的 embedding 类型模型，用于将文本块向量化","placeholder":"请先在「模型设置」中添加嵌入模型","modelType":"embedding"},"metadata_json":{"name":"metadata_json","display_name":"元数据 JSON","type":"str","input_types":[],"value":"{\\n  \\\"1_Domain_Scope\\\": {\\n    \\\"domain\\\": \\\"\\\",\\n    \\\"theme\\\": \\\"\\\"\\n  },\\n  \\\"2_Ontology_Routing\\\": {\\n    \\\"events\\\": [],\\n    \\\"entities\\\": [],\\n    \\\"concepts\\\": []\\n  },\\n  \\\"3_Epistemology_Tag\\\": {\\n    \\\"time_stamp\\\": \\\"\\\",\\n    \\\"claim_type\\\": \\\"事实陈述\\\",\\n    \\\"source\\\": \\\"\\\",\\n    \\\"confidence\\\": 0.8\\n  }\\n}","required":false,"info":"每个 Chunk 必须背着新版元数据：领域范围 + 本体路由 + 认识论标签","placeholder":"元数据 JSON"}},"outputs":[{"name":"result","display_name":"结果","types":["Data"]}]}}}
                  ],
                  "edges": [
                    {"id":"edge-loader-router","source":"node-document-loader","target":"node-router","sourceHandle":"text","targetHandle":"input"},
                    {"id":"edge-router-standard","source":"node-router","target":"node-standard-chunker","sourceHandle":"standard","targetHandle":"input"},
                    {"id":"edge-router-deep-meta","source":"node-router","target":"node-global-metadata","sourceHandle":"deep","targetHandle":"input"},
                    {"id":"edge-router-deep-chunker","source":"node-router","target":"node-deep-chunker","sourceHandle":"deep","targetHandle":"input"},
                    {"id":"edge-standard-writer","source":"node-standard-chunker","target":"node-writer","sourceHandle":"chunks","targetHandle":"chunks"},
                    {"id":"edge-deep-writer","source":"node-deep-chunker","target":"node-writer","sourceHandle":"chunks","targetHandle":"chunks"}
                  ]
                }
                """;
        try {
            jdbcTemplate.update("""
                    INSERT INTO workflow_template (id, name, description, category, tags, cover_color, graph_json, system_template, is_delete)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)
                    ON CONFLICT (id) DO UPDATE SET
                      name = EXCLUDED.name,
                      description = EXCLUDED.description,
                      category = EXCLUDED.category,
                      tags = EXCLUDED.tags,
                      cover_color = EXCLUDED.cover_color,
                      graph_json = EXCLUDED.graph_json,
                      system_template = 1,
                      is_delete = 0,
                      update_time = CURRENT_TIMESTAMP
                    WHERE workflow_template.graph_json IS NULL OR workflow_template.graph_json NOT LIKE '%"outputs"%' OR workflow_template.graph_json LIKE '%"type":"SemanticChunker"%'
                    """,
                    "tpl-tiered-rag-ingestion",
                    "分级 RAG 入库",
                    "自动分流普通 RAG 与认知级 RAG 的默认入库工作流。普通文档直接切块向量化，高价值文档提取新版元数据元数据。",
                    "rag",
                    "RAG,分级入库,自动分流,知识库",
                    "indigo",
                    graphJson);
        } catch (Exception e) {
            log.warn("tiered ingestion workflow template migration skipped: {}", e.getMessage());
        }
    }

    private void ensureCognitiveIngestionTemplate() {
        String graphJson = """
                {
                  "nodes": [
                    {"id":"node-document-loader","type":"genericNode","position":{"x":-360,"y":0},"data":{"id":"node-document-loader","type":"DocumentLoader","node":{"type":"DocumentLoader","display_name":"文档加载器","description":"加载文档并解析为纯文本，支持从知识库选择已有文档，或调试时直接输入文本、Markdown、链接正文。","icon":"Paperclip","base_classes":["Data"],"category":"files_and_knowledge","template":{"document_id":{"name":"document_id","display_name":"选择文档","type":"document","input_types":[],"value":"","required":false},"file_path":{"name":"file_path","display_name":"文件路径","type":"str","input_types":["File"],"value":"","required":false},"content":{"name":"content","display_name":"文本内容","type":"str","input_types":["Text"],"value":"","required":false,"info":"调试时可直接粘贴文本或 Markdown 正文"},"file_type":{"name":"file_type","display_name":"文件类型","type":"str","input_types":[],"value":"md","required":false}},"outputs":[{"name":"text","display_name":"文本","types":["Text"]}]}}},
                    {"id":"node-global-metadata","type":"genericNode","position":{"x":40,"y":-160},"data":{"id":"node-global-metadata","type":"GlobalMetadataExtractor","node":{"type":"GlobalMetadataExtractor","display_name":"全局元数据提取","description":"使用 LLM 提取文档的全局元数据（领域/主题/实体/概念），用于后续 Chunk 的新版元数据挂载。","icon":"Metadata","base_classes":["Data"],"category":"files_and_knowledge","template":{"input":{"name":"input","display_name":"输入文本","type":"str","input_types":["Text"],"value":"","required":true},"model_config_id":{"name":"model_config_id","display_name":"模型配置","type":"model_config","input_types":[],"value":"","required":true,"info":"选择 LLM 模型用于元数据提取"}},"outputs":[{"name":"metadata","display_name":"完整元数据","types":["Data"]},{"name":"domain","display_name":"领域","types":["Text"]},{"name":"theme","display_name":"主题","types":["Text"]},{"name":"entities","display_name":"实体列表","types":["Data"]},{"name":"concepts","display_name":"概念列表","types":["Data"]}]}}},
                    {"id":"node-deep-chunker","type":"genericNode","position":{"x":440,"y":0},"data":{"id":"node-deep-chunker","type":"IntelligentSemanticChunker","node":{"type":"IntelligentSemanticChunker","display_name":"认知级语义分块","description":"使用 LLM 识别语义边界进行分块，并为每个 Chunk 挂载新版元数据元数据，避免因果关系断裂。","icon":"BrainCircuit","base_classes":["Data"],"category":"files_and_knowledge","template":{"input":{"name":"input","display_name":"输入文本","type":"str","input_types":["Text","Data"],"value":"","required":true},"model_config_id":{"name":"model_config_id","display_name":"模型配置","type":"model_config","input_types":[],"value":"","required":true,"info":"选择 LLM 模型用于语义边界识别"}},"outputs":[{"name":"chunks","display_name":"文本块","types":["Data"]},{"name":"chunkCount","display_name":"块数量","types":["Number"]}]}}},
                    {"id":"node-writer","type":"genericNode","position":{"x":840,"y":0},"data":{"id":"node-writer","type":"KnowledgeBaseWriter","node":{"type":"KnowledgeBaseWriter","display_name":"知识库写入","description":"将 Chunk 数据连同三维元数据一起写入知识库，并向量化存储。","icon":"Save","base_classes":["Data"],"category":"files_and_knowledge","template":{"chunks":{"name":"chunks","display_name":"文本块数据","type":"str","input_types":["Data"],"value":"","required":true},"kb_id":{"name":"kb_id","display_name":"目标知识库","type":"knowledge_base","input_types":[],"value":"","required":true,"info":"选择文档解析入库后写入的目标知识库","placeholder":"请选择知识库"},"embedding_model_id":{"name":"embedding_model_id","display_name":"嵌入模型","type":"model_config","input_types":[],"value":"","required":false,"info":"选择已配置的 embedding 类型模型，用于将文本块向量化","placeholder":"请先在「模型设置」中添加嵌入模型","modelType":"embedding"}},"outputs":[{"name":"result","display_name":"结果","types":["Data"]}]}}}
                  ],
                  "edges": [
                    {"id":"edge-loader-meta","source":"node-document-loader","target":"node-global-metadata","sourceHandle":"text","targetHandle":"input"},
                    {"id":"edge-loader-chunker","source":"node-document-loader","target":"node-deep-chunker","sourceHandle":"text","targetHandle":"input"},
                    {"id":"edge-meta-chunker","source":"node-global-metadata","target":"node-deep-chunker","sourceHandle":"metadata","targetHandle":"metadata"},
                    {"id":"edge-chunker-writer","source":"node-deep-chunker","target":"node-writer","sourceHandle":"chunks","targetHandle":"chunks"}
                  ]
                }
                """;
        try {
            jdbcTemplate.update("""
                    INSERT INTO workflow_template (id, name, description, category, tags, cover_color, graph_json, system_template, is_delete)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)
                    ON CONFLICT (id) DO UPDATE SET
                      name = EXCLUDED.name,
                      description = EXCLUDED.description,
                      category = EXCLUDED.category,
                      tags = EXCLUDED.tags,
                      cover_color = EXCLUDED.cover_color,
                      graph_json = EXCLUDED.graph_json,
                      system_template = 1,
                      is_delete = 0,
                      update_time = CURRENT_TIMESTAMP
                    WHERE workflow_template.graph_json IS NULL
                       OR workflow_template.graph_json NOT LIKE '%"type":"DocumentLoader"%'
                       OR workflow_template.graph_json LIKE '%ChatInput%'
                       OR workflow_template.graph_json NOT LIKE '%"type":"knowledge_base"%'
                    """,
                    "tpl-cognitive-rag-ingestion",
                    "认知级 RAG 入库",
                    "提取全局元数据 + LLM 语义分块 + 新版元数据挂载的认知级入库工作流，适合高价值、需深度理解的文档。",
                    "rag",
                    "RAG,认知级入库,新版元数据,LLM分块,知识库",
                    "violet",
                    graphJson);
        } catch (Exception e) {
            log.warn("cognitive ingestion workflow template migration skipped: {}", e.getMessage());
        }
    }

    private void ensureWebIngestionTemplate() {
        String graphJson = """
                {
                  "nodes": [
                    {"id":"node-url-input","type":"genericNode","position":{"x":-560,"y":40},"data":{"id":"node-url-input","type":"URLInput","node":{"type":"URLInput","display_name":"网页地址输入","description":"网页工作流的统一入口，输出 url 给下游网页提取方案。运行时由入库入口注入实际 URL。","icon":"Link","base_classes":["Text"],"category":"files_and_knowledge","template":{"url":{"name":"url","display_name":"网页地址","type":"str","input_types":["Text"],"value":"","required":false,"info":"调试时填写目标网页 URL；正式入库时由运行时注入"}},"outputs":[{"name":"url","display_name":"网页地址","types":["Text"]}]}}},
                    {"id":"node-web-jsoup","type":"genericNode","position":{"x":-200,"y":40},"data":{"id":"node-web-jsoup","type":"WebFetchJsoup","node":{"type":"WebFetchJsoup","display_name":"网页提取·jsoup","description":"方案一（首选）：本地 jsoup + readability 提取。免费最快，适合静态/正文规整的网页。成功则后续方案自动短路跳过；失败则降级到 Jina。","icon":"Globe","base_classes":["Data"],"category":"files_and_knowledge","template":{"url":{"name":"url","display_name":"网页地址","type":"str","input_types":["Text"],"value":"","required":false,"info":"由 URL 输入节点注入；也可单独填写用于调试"}},"outputs":[{"name":"text","display_name":"正文","types":["Text"]},{"name":"success","display_name":"是否成功","types":["Data"]},{"name":"title","display_name":"标题","types":["Text"]}]}}},
                    {"id":"node-web-jina","type":"genericNode","position":{"x":160,"y":40},"data":{"id":"node-web-jina","type":"WebFetchJina","node":{"type":"WebFetchJina","display_name":"网页提取·Jina","description":"方案二（降级）：上游成功则短路透传、不调用；上游失败才用 Jina Reader 提取，可处理公众号、知乎等 JS 动态渲染页面。","icon":"Globe","base_classes":["Data"],"category":"files_and_knowledge","template":{"url":{"name":"url","display_name":"网页地址","type":"str","input_types":["Text"],"value":"","required":false},"input":{"name":"input","display_name":"上游正文","type":"str","input_types":["Text"],"value":"","required":false,"info":"上游提取的正文"},"upstream_success":{"name":"upstream_success","display_name":"上游是否成功","type":"str","input_types":["Data"],"value":"","required":false,"info":"上游提取成功标志；为 true 则短路跳过本级"}},"outputs":[{"name":"text","display_name":"正文","types":["Text"]},{"name":"success","display_name":"是否成功","types":["Data"]},{"name":"title","display_name":"标题","types":["Text"]}]}}},
                    {"id":"node-web-scrapling","type":"genericNode","position":{"x":520,"y":40},"data":{"id":"node-web-scrapling","type":"WebFetchScrapling","node":{"type":"WebFetchScrapling","display_name":"网页提取·Scrapling","description":"方案三（兜底）：上游成功则短路透传、不调用；上游均失败才用 Scrapling 爬虫微服务提取，具备反爬绕过能力。需开启 scrapling 配置。本节点输出即网页最终 markdown 正文。","icon":"Globe","base_classes":["Data"],"category":"files_and_knowledge","template":{"url":{"name":"url","display_name":"网页地址","type":"str","input_types":["Text"],"value":"","required":false},"input":{"name":"input","display_name":"上游正文","type":"str","input_types":["Text"],"value":"","required":false,"info":"上游提取的正文"},"upstream_success":{"name":"upstream_success","display_name":"上游是否成功","type":"str","input_types":["Data"],"value":"","required":false,"info":"上游提取成功标志；为 true 则短路跳过本级"}},"outputs":[{"name":"text","display_name":"markdown 正文","types":["Text"]},{"name":"success","display_name":"是否成功","types":["Data"]},{"name":"title","display_name":"标题","types":["Text"]}]}}},
                    {"id":"node-web-translate","type":"genericNode","position":{"x":880,"y":40},"data":{"id":"node-web-translate","type":"Translate","node":{"type":"Translate","display_name":"翻译·非中文转中文","description":"针对非中文网页：本地检测中文占比，已是中文则短路透传、不调大模型；外文且配置了翻译模型才译为中文。放在提取后、存库前，保证存进知识库的正文为中文，便于中文检索。未配置模型时默认不翻、直接透传。","icon":"Languages","base_classes":["Text"],"category":"files_and_knowledge","template":{"input":{"name":"input","display_name":"上游正文","type":"str","input_types":["Text"],"value":"","required":false,"info":"上游提取的网页正文"},"model_config_id":{"name":"model_config_id","display_name":"翻译模型","type":"model_config","input_types":[],"value":"","required":false,"info":"选择用于翻译的大模型；留空则不翻译、直接透传","placeholder":"留空则不翻译"},"chunk_size":{"name":"chunk_size","display_name":"分段长度","type":"int","input_types":[],"value":3000,"required":false,"info":"超长正文按此字符数分段翻译再拼接，避免撞模型上下文上限"}},"outputs":[{"name":"text","display_name":"中文正文","types":["Text"]},{"name":"translated","display_name":"是否翻译","types":["Data"]}]}}},
                    {"id":"node-save-kb","type":"genericNode","position":{"x":1240,"y":40},"data":{"id":"node-save-kb","type":"SaveToKnowledgeBase","node":{"type":"SaveToKnowledgeBase","display_name":"存入知识库","description":"把解析得到的 markdown 存为知识库里的一篇文档（status=parsed）。这是「入知识库」而非「入 RAG」——只做文档级存储，不做分块/向量化；分块向量化在点「入库」时走认知级工作流。","icon":"Database","base_classes":["Data"],"category":"files_and_knowledge","template":{"text":{"name":"text","display_name":"markdown 正文","type":"str","input_types":["Text"],"value":"","required":true,"info":"上游提取的网页正文"},"kb_id":{"name":"kb_id","display_name":"目标知识库","type":"knowledge_base","input_types":[],"value":"","required":true,"info":"选择文档存入的目标知识库","placeholder":"请选择知识库"},"title":{"name":"title","display_name":"文档标题","type":"str","input_types":["Text"],"value":"","required":false,"info":"留空则使用网页标题"}},"outputs":[{"name":"documentId","display_name":"文档ID","types":["Data"]},{"name":"title","display_name":"标题","types":["Text"]}]}}}
                  ],
                  "edges": [
                    {"id":"edge-url-jsoup","source":"node-url-input","target":"node-web-jsoup","sourceHandle":"url","targetHandle":"url"},
                    {"id":"edge-url-jina","source":"node-url-input","target":"node-web-jina","sourceHandle":"url","targetHandle":"url"},
                    {"id":"edge-url-scrapling","source":"node-url-input","target":"node-web-scrapling","sourceHandle":"url","targetHandle":"url"},
                    {"id":"edge-jsoup-jina","source":"node-web-jsoup","target":"node-web-jina","sourceHandle":"text","targetHandle":"input"},
                    {"id":"edge-jsoup-jina-ok","source":"node-web-jsoup","target":"node-web-jina","sourceHandle":"success","targetHandle":"upstream_success"},
                    {"id":"edge-jina-scrapling","source":"node-web-jina","target":"node-web-scrapling","sourceHandle":"text","targetHandle":"input"},
                    {"id":"edge-jina-scrapling-ok","source":"node-web-jina","target":"node-web-scrapling","sourceHandle":"success","targetHandle":"upstream_success"},
                    {"id":"edge-scrapling-translate","source":"node-web-scrapling","target":"node-web-translate","sourceHandle":"text","targetHandle":"input"},
                    {"id":"edge-translate-save","source":"node-web-translate","target":"node-save-kb","sourceHandle":"text","targetHandle":"text"}
                  ]
                }
                """;
        try {
            // 历史命名 tpl-web-rag-ingestion 概念不准（它是解析类、非 RAG 类），迁移为 tpl-web-parse-ingestion
            jdbcTemplate.update("DELETE FROM workflow_template WHERE id = 'tpl-web-rag-ingestion'");
            jdbcTemplate.update("""
                    INSERT INTO workflow_template (id, name, description, category, tags, cover_color, graph_json, system_template, is_delete)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)
                    ON CONFLICT (id) DO UPDATE SET
                      name = EXCLUDED.name,
                      description = EXCLUDED.description,
                      category = EXCLUDED.category,
                      tags = EXCLUDED.tags,
                      cover_color = EXCLUDED.cover_color,
                      graph_json = EXCLUDED.graph_json,
                      system_template = 1,
                      is_delete = 0,
                      update_time = CURRENT_TIMESTAMP
                    WHERE workflow_template.graph_json IS NULL
                       OR workflow_template.graph_json NOT LIKE '%node-web-translate%'
                       OR workflow_template.graph_json NOT LIKE '%chunk_size%'
                    """,
                    "tpl-web-parse-ingestion",
                    "网页解析入库",
                    "URL → jsoup → Jina → Scrapling 条件短路降级提取正文（前一方案成功则后续自动跳过、失败才降级），最终经「存入知识库」节点存为知识库文档。仅负责「网页解析为 markdown 并入知识库」，不做分块向量化；分块向量化在点「入库」时走认知级工作流。每个环节均可视、可调。",
                    "parse",
                    "解析,网页,正文提取,降级,知识库",
                    "sky",
                    graphJson);
        } catch (Exception e) {
            log.warn("web parse workflow template migration skipped: {}", e.getMessage());
        }
    }

    private void ensureFileIngestionTemplate() {
        String graphJson = """
                {
                  "nodes": [
                    {"id":"node-file-loader","type":"genericNode","position":{"x":-280,"y":40},"data":{"id":"node-file-loader","type":"FileLoader","node":{"type":"FileLoader","display_name":"文件解析","description":"读取上传的文件（txt/md/pdf 等），解析为 markdown 正文。运行时由入库入口注入文件路径，也支持调试时手填路径。","icon":"FileText","base_classes":["Text"],"category":"files_and_knowledge","template":{"file_path":{"name":"file_path","display_name":"文件路径","type":"str","input_types":["Text"],"value":"","required":false,"info":"调试时填写本地文件路径；正式入库时由运行时注入"}},"outputs":[{"name":"text","display_name":"markdown 正文","types":["Text"]},{"name":"success","display_name":"是否成功","types":["Data"]},{"name":"title","display_name":"标题","types":["Text"]},{"name":"fileType","display_name":"文件类型","types":["Text"]}]}}},
                    {"id":"node-file-translate","type":"genericNode","position":{"x":160,"y":40},"data":{"id":"node-file-translate","type":"Translate","node":{"type":"Translate","display_name":"翻译·非中文转中文","description":"针对非中文文件：本地检测中文占比，已是中文则短路透传、不调大模型；外文且配置了翻译模型才译为中文。超长正文自动分段翻译。放在解析后、存库前。未配置模型时默认不翻、直接透传。","icon":"Languages","base_classes":["Text"],"category":"files_and_knowledge","template":{"input":{"name":"input","display_name":"上游正文","type":"str","input_types":["Text"],"value":"","required":false,"info":"上游解析的文件正文"},"model_config_id":{"name":"model_config_id","display_name":"翻译模型","type":"model_config","input_types":[],"value":"","required":false,"info":"选择用于翻译的大模型；留空则不翻译、直接透传","placeholder":"留空则不翻译"},"chunk_size":{"name":"chunk_size","display_name":"分段长度","type":"int","input_types":[],"value":3000,"required":false,"info":"超长正文按此字符数分段翻译再拼接，避免撞模型上下文上限"}},"outputs":[{"name":"text","display_name":"中文正文","types":["Text"]},{"name":"translated","display_name":"是否翻译","types":["Data"]}]}}},
                    {"id":"node-save-kb","type":"genericNode","position":{"x":520,"y":40},"data":{"id":"node-save-kb","type":"SaveToKnowledgeBase","node":{"type":"SaveToKnowledgeBase","display_name":"存入知识库","description":"把解析得到的 markdown 存为知识库里的一篇文档（status=parsed）。这是「入知识库」而非「入 RAG」——只做文档级存储，不做分块/向量化；分块向量化在点「入库」时走认知级工作流。","icon":"Database","base_classes":["Data"],"category":"files_and_knowledge","template":{"text":{"name":"text","display_name":"markdown 正文","type":"str","input_types":["Text"],"value":"","required":true,"info":"上游解析的文件正文"},"kb_id":{"name":"kb_id","display_name":"目标知识库","type":"knowledge_base","input_types":[],"value":"","required":true,"info":"选择文档存入的目标知识库","placeholder":"请选择知识库"},"title":{"name":"title","display_name":"文档标题","type":"str","input_types":["Text"],"value":"","required":false,"info":"留空则使用文件名"}},"outputs":[{"name":"documentId","display_name":"文档ID","types":["Data"]},{"name":"title","display_name":"标题","types":["Text"]}]}}}
                  ],
                  "edges": [
                    {"id":"edge-file-translate","source":"node-file-loader","target":"node-file-translate","sourceHandle":"text","targetHandle":"input"},
                    {"id":"edge-translate-save","source":"node-file-translate","target":"node-save-kb","sourceHandle":"text","targetHandle":"text"}
                  ]
                }
                """;
        try {
            jdbcTemplate.update("""
                    INSERT INTO workflow_template (id, name, description, category, tags, cover_color, graph_json, system_template, is_delete)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)
                    ON CONFLICT (id) DO UPDATE SET
                      name = EXCLUDED.name,
                      description = EXCLUDED.description,
                      category = EXCLUDED.category,
                      tags = EXCLUDED.tags,
                      cover_color = EXCLUDED.cover_color,
                      graph_json = EXCLUDED.graph_json,
                      system_template = 1,
                      is_delete = 0,
                      update_time = CURRENT_TIMESTAMP
                    WHERE workflow_template.graph_json IS NULL
                       OR workflow_template.graph_json NOT LIKE '%node-file-translate%'
                    """,
                    "tpl-file-parse-ingestion",
                    "文件解析入库",
                    "上传文件 → 文件解析（txt/md/pdf → markdown）→ 经「存入知识库」节点存为知识库文档。仅负责「文件解析为 markdown 并入知识库」，不做分块向量化；分块向量化在点「入库」时走认知级工作流。",
                    "parse",
                    "解析,文件,markdown,知识库",
                    "emerald",
                    graphJson);
        } catch (Exception e) {
            log.warn("file parse workflow template migration skipped: {}", e.getMessage());
        }
    }

    private void ensureVideoIngestionTemplate() {
        String graphJson = """
                {
                  "nodes": [
                    {"id":"node-video-transcriber","type":"genericNode","position":{"x":-720,"y":40},"data":{"id":"node-video-transcriber","type":"VideoAudioTranscriber","node":{"type":"VideoAudioTranscriber","display_name":"视频音频转录","description":"从视频或音频文件中提取语音，使用 FFmpeg Whisper 转录为文字，输出 SRT 字幕和 Markdown 文本。支持 mp4/mkv/avi/wav/mp3 等格式。运行时由入库入口注入文件路径。","icon":"Video","base_classes":["Text"],"category":"files_and_knowledge","template":{"file_path":{"name":"file_path","display_name":"文件路径","type":"str","input_types":["Text"],"value":"","required":false,"info":"调试时填写本地文件路径；正式入库时由运行时注入"},"language":{"name":"language","display_name":"语言","type":"str","input_types":[],"value":"zh","required":false,"info":"Whisper 转录语言，zh=中文，en=英文，auto=自动检测","placeholder":"zh","options":["zh","auto","en"]},"script":{"name":"script","display_name":"中文字形","type":"str","input_types":[],"value":"simplified","required":false,"info":"转录后的中文输出字形：simplified=简体，traditional=繁体，none=不转换","placeholder":"simplified","options":["simplified","traditional","none"]},"output_format":{"name":"output_format","display_name":"输出格式","type":"str","input_types":[],"value":"srt","required":false,"info":"Whisper 输出格式：srt（字幕）/ text（纯文本）/ json","placeholder":"srt","options":["srt","text","json"]}},"outputs":[{"name":"text","display_name":"转录正文","types":["Text"]},{"name":"srt","display_name":"SRT 字幕","types":["Data"]},{"name":"title","display_name":"标题","types":["Text"]},{"name":"duration","display_name":"时长","types":["Data"]}]}}},
                    {"id":"node-markdown-prompt","type":"genericNode","position":{"x":-360,"y":-160},"data":{"id":"node-markdown-prompt","type":"PromptTemplate","node":{"type":"PromptTemplate","display_name":"Markdown 结构化提示词","description":"约束 LLM 将视频转录稿整理为适合知识库沉淀的结构化 Markdown。","icon":"Braces","base_classes":["Prompt"],"category":"models_and_agents","template":{"template":{"name":"template","display_name":"模板","type":"str","input_types":[],"value":"你是专业的知识库文档编辑。请把用户提供的视频转录稿整理为结构化 Markdown。要求：\\n1. 只输出 Markdown 正文，不要解释你的处理过程。\\n2. 保留原意，不编造转录稿中没有的信息。\\n3. 开头使用一个 # 标题；正文必须使用 ## 二级标题组织主题，必要时使用 ### 三级标题。\\n4. 优先输出：## 核心摘要、## 关键观点、## 详细内容、## 可提取的知识点。\\n5. 对口语化、重复、停顿词进行清理，但不要过度改写事实。\\n6. 使用列表、引用、加粗关键词提升可读性。\\n7. 如果原文信息不足，保留可确定内容，不要补充臆测。\\n8. 输出简体中文。","required":true}},"outputs":[{"name":"prompt","display_name":"提示词","types":["Prompt","Text"]}]}}},
                    {"id":"node-markdown-llm","type":"genericNode","position":{"x":20,"y":40},"data":{"id":"node-markdown-llm","type":"LanguageModel","node":{"type":"LanguageModel","display_name":"LLM 转 Markdown","description":"调用已配置的大语言模型，将视频转录正文整理为 H2/H3 标题、摘要、要点和知识点组成的标准 Markdown。未选择模型时后端自动选择一个已启用的对话模型。","icon":"BrainCog","base_classes":["LanguageModel"],"category":"models_and_agents","template":{"model_config_id":{"name":"model_config_id","display_name":"选择模型","type":"model_config","input_types":[],"value":"","required":false,"info":"留空时后端自动选择一个已启用的对话模型","modelType":"chat"},"input_value":{"name":"input_value","display_name":"输入","type":"str","input_types":["Message","Text","Data"],"value":"","required":true},"system_message":{"name":"system_message","display_name":"系统消息输入","type":"str","input_types":["Prompt","Text"],"value":"你是一个专业的 Markdown 文档编辑。","required":false},"temperature":{"name":"temperature","display_name":"温度覆盖","type":"float","input_types":[],"value":0.1,"required":false,"advanced":true},"max_tokens":{"name":"max_tokens","display_name":"最大令牌数覆盖（留空=模型最大）","type":"int","input_types":[],"value":"","required":false,"advanced":true}},"outputs":[{"name":"response","display_name":"结构化 Markdown","types":["Message","Text"]},{"name":"model","display_name":"语言模型","types":["LanguageModel"]}]}}},
                    {"id":"node-save-kb","type":"genericNode","position":{"x":420,"y":40},"data":{"id":"node-save-kb","type":"SaveToKnowledgeBase","node":{"type":"SaveToKnowledgeBase","display_name":"存入知识库","description":"把 LLM 结构化后的 markdown 存为知识库里的一篇文档（status=parsed）。这是「入知识库」而非「入 RAG」——只做文档级存储，不做分块/向量化；分块向量化在点「入库」时走认知级工作流。","icon":"Database","base_classes":["Data"],"category":"files_and_knowledge","template":{"text":{"name":"text","display_name":"markdown 正文","type":"str","input_types":["Text"],"value":"","required":true,"info":"上游 LLM 结构化后的 Markdown 正文"},"kb_id":{"name":"kb_id","display_name":"目标知识库","type":"knowledge_base","input_types":[],"value":"","required":true,"info":"选择文档存入的目标知识库","placeholder":"请选择知识库"},"title":{"name":"title","display_name":"文档标题","type":"str","input_types":["Text"],"value":"","required":false,"info":"留空则使用视频文件名"}},"outputs":[{"name":"documentId","display_name":"文档ID","types":["Data"]},{"name":"title","display_name":"标题","types":["Text"]}]}}}
                  ],
                  "edges": [
                    {"id":"edge-transcriber-llm-text","source":"node-video-transcriber","target":"node-markdown-llm","sourceHandle":"text","targetHandle":"input_value"},
                    {"id":"edge-prompt-llm-system","source":"node-markdown-prompt","target":"node-markdown-llm","sourceHandle":"prompt","targetHandle":"system_message"},
                    {"id":"edge-llm-save-text","source":"node-markdown-llm","target":"node-save-kb","sourceHandle":"response","targetHandle":"text"},
                    {"id":"edge-transcriber-save-title","source":"node-video-transcriber","target":"node-save-kb","sourceHandle":"title","targetHandle":"title"}
                  ]
                }
                """;
        try {
            jdbcTemplate.update("""
                    INSERT INTO workflow_template (id, name, description, category, tags, cover_color, graph_json, system_template, is_delete)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)
                    ON CONFLICT (id) DO UPDATE SET
                      name = EXCLUDED.name,
                      description = EXCLUDED.description,
                      category = EXCLUDED.category,
                      tags = EXCLUDED.tags,
                      cover_color = EXCLUDED.cover_color,
                      graph_json = EXCLUDED.graph_json,
                      system_template = 1,
                      is_delete = 0,
                      update_time = CURRENT_TIMESTAMP
                    WHERE workflow_template.graph_json IS NULL
                       OR workflow_template.graph_json NOT LIKE '%VideoAudioTranscriber%'
                       OR workflow_template.graph_json NOT LIKE '%node-markdown-llm%'
                       OR workflow_template.graph_json LIKE '%edge-transcriber-save-title%'
                    """,
                    "tpl-video-parse-ingestion",
                    "视频转录入库",
                    "视频/音频文件 → FFmpeg Whisper 本地转录 → LLM 结构化 Markdown → 存入知识库。仅负责「视频转录为 markdown 并入知识库」，不做分块向量化；分块向量化在点「入库」时走认知级工作流。依赖 FFmpeg 8.x+（--enable-whisper）、ggml 模型文件和一个可用对话模型。",
                    "parse",
                    "解析,视频,音频,转录,Whisper,LLM,Markdown,知识库",
                    "orange",
                    graphJson);
        } catch (Exception e) {
            log.warn("video parse workflow template migration skipped: {}", e.getMessage());
        }
    }

    private void ensureDouyinIngestionTemplate() {
        String graphJson = """
                {
                  "nodes": [
                    {"id":"node-douyin-downloader","type":"genericNode","position":{"x":-1080,"y":40},"data":{"id":"node-douyin-downloader","type":"DouyinVideoDownloader","node":{"type":"DouyinVideoDownloader","display_name":"抖音链接解析下载","description":"解析抖音分享链接/分享文本，携带服务端配置的 Cookie 请求抖音详情接口，将视频下载到宿主机本地媒体库，并输出本地视频路径。","icon":"Link","base_classes":["Text"],"category":"files_and_knowledge","template":{"url":{"name":"url","display_name":"抖音链接/分享文本","type":"str","input_types":["Text"],"value":"","required":false,"info":"正式入库时由上传抽屉注入；调试时可粘贴完整抖音分享文本"},"kb_id":{"name":"kb_id","display_name":"目标知识库","type":"knowledge_base","input_types":[],"value":"","required":false,"info":"正式入库时由运行时注入"}},"outputs":[{"name":"file_path","display_name":"本地视频路径","types":["Text"]},{"name":"relative_path","display_name":"媒体库相对路径","types":["Text"]},{"name":"title","display_name":"视频标题","types":["Text"]},{"name":"metadata","display_name":"抖音元数据","types":["Data"]}]}}},
                    {"id":"node-video-transcriber","type":"genericNode","position":{"x":-720,"y":40},"data":{"id":"node-video-transcriber","type":"VideoAudioTranscriber","node":{"type":"VideoAudioTranscriber","display_name":"视频音频转录","description":"对抖音下载得到的本地视频文件进行 FFmpeg Whisper 转录。","icon":"Video","base_classes":["Text"],"category":"files_and_knowledge","template":{"file_path":{"name":"file_path","display_name":"文件路径","type":"str","input_types":["Text"],"value":"","required":false,"info":"由抖音链接解析下载节点输出"},"language":{"name":"language","display_name":"语言","type":"str","input_types":[],"value":"zh","required":false,"info":"Whisper 转录语言，zh=中文，en=英文，auto=自动检测","placeholder":"zh","options":["zh","auto","en"]},"script":{"name":"script","display_name":"中文字形","type":"str","input_types":[],"value":"simplified","required":false,"info":"转录后的中文输出字形：simplified=简体，traditional=繁体，none=不转换","placeholder":"simplified","options":["simplified","traditional","none"]},"output_format":{"name":"output_format","display_name":"输出格式","type":"str","input_types":[],"value":"srt","required":false,"info":"Whisper 输出格式：srt（字幕）/ text（纯文本）/ json","placeholder":"srt","options":["srt","text","json"]}},"outputs":[{"name":"text","display_name":"转录正文","types":["Text"]},{"name":"srt","display_name":"SRT 字幕","types":["Data"]},{"name":"title","display_name":"标题","types":["Text"]},{"name":"duration","display_name":"时长","types":["Data"]}]}}},
                    {"id":"node-markdown-prompt","type":"genericNode","position":{"x":-360,"y":-160},"data":{"id":"node-markdown-prompt","type":"PromptTemplate","node":{"type":"PromptTemplate","display_name":"Markdown 结构化提示词","description":"约束 LLM 将抖音视频转录稿整理为适合知识库沉淀的结构化 Markdown。","icon":"Braces","base_classes":["Prompt"],"category":"models_and_agents","template":{"template":{"name":"template","display_name":"模板","type":"str","input_types":[],"value":"你是专业的知识库文档编辑。请把用户提供的抖音视频转录稿整理为结构化 Markdown。要求：\\n1. 只输出 Markdown 正文，不要解释你的处理过程。\\n2. 保留原意，不编造转录稿中没有的信息。\\n3. 开头使用一个 # 标题；正文必须使用 ## 二级标题组织主题，必要时使用 ### 三级标题。\\n4. 优先输出：## 核心摘要、## 关键观点、## 详细内容、## 可提取的知识点。\\n5. 对口语化、重复、停顿词进行清理，但不要过度改写事实。\\n6. 使用列表、引用、加粗关键词提升可读性。\\n7. 如果原文信息不足，保留可确定内容，不要补充臆测。\\n8. 输出简体中文。","required":true}},"outputs":[{"name":"prompt","display_name":"提示词","types":["Prompt","Text"]}]}}},
                    {"id":"node-markdown-llm","type":"genericNode","position":{"x":20,"y":40},"data":{"id":"node-markdown-llm","type":"LanguageModel","node":{"type":"LanguageModel","display_name":"LLM 转 Markdown","description":"调用已配置的大语言模型，将抖音视频转录正文整理为 H2/H3 标题、摘要、要点和知识点组成的标准 Markdown。未选择模型时后端自动选择一个已启用的对话模型。","icon":"BrainCog","base_classes":["LanguageModel"],"category":"models_and_agents","template":{"model_config_id":{"name":"model_config_id","display_name":"选择模型","type":"model_config","input_types":[],"value":"","required":false,"info":"留空时后端自动选择一个已启用的对话模型","modelType":"chat"},"input_value":{"name":"input_value","display_name":"输入","type":"str","input_types":["Message","Text","Data"],"value":"","required":true},"system_message":{"name":"system_message","display_name":"系统消息输入","type":"str","input_types":["Prompt","Text"],"value":"你是一个专业的 Markdown 文档编辑。","required":false},"temperature":{"name":"temperature","display_name":"温度覆盖","type":"float","input_types":[],"value":0.1,"required":false,"advanced":true},"max_tokens":{"name":"max_tokens","display_name":"最大令牌数覆盖（留空=模型最大）","type":"int","input_types":[],"value":"","required":false,"advanced":true}},"outputs":[{"name":"response","display_name":"结构化 Markdown","types":["Message","Text"]},{"name":"model","display_name":"语言模型","types":["LanguageModel"]}]}}},
                    {"id":"node-save-kb","type":"genericNode","position":{"x":420,"y":40},"data":{"id":"node-save-kb","type":"SaveToKnowledgeBase","node":{"type":"SaveToKnowledgeBase","display_name":"存入知识库","description":"把 LLM 结构化后的 markdown 存为知识库里的一篇文档（status=parsed），并保留抖音来源元数据和本地媒体库相对路径。","icon":"Database","base_classes":["Data"],"category":"files_and_knowledge","template":{"text":{"name":"text","display_name":"markdown 正文","type":"str","input_types":["Text"],"value":"","required":true,"info":"上游 LLM 结构化后的 Markdown 正文"},"kb_id":{"name":"kb_id","display_name":"目标知识库","type":"knowledge_base","input_types":[],"value":"","required":true,"info":"选择文档存入的目标知识库","placeholder":"请选择知识库"},"title":{"name":"title","display_name":"文档标题","type":"str","input_types":["Text"],"value":"","required":false,"info":"留空则使用抖音视频标题"}},"outputs":[{"name":"documentId","display_name":"文档ID","types":["Data"]},{"name":"title","display_name":"标题","types":["Text"]}]}}}
                  ],
                  "edges": [
                    {"id":"edge-douyin-video","source":"node-douyin-downloader","target":"node-video-transcriber","sourceHandle":"file_path","targetHandle":"file_path"},
                    {"id":"edge-transcriber-llm-text","source":"node-video-transcriber","target":"node-markdown-llm","sourceHandle":"text","targetHandle":"input_value"},
                    {"id":"edge-prompt-llm-system","source":"node-markdown-prompt","target":"node-markdown-llm","sourceHandle":"prompt","targetHandle":"system_message"},
                    {"id":"edge-llm-save-text","source":"node-markdown-llm","target":"node-save-kb","sourceHandle":"response","targetHandle":"text"}
                  ]
                }
                """;
        try {
            jdbcTemplate.update("""
                    INSERT INTO workflow_template (id, name, description, category, tags, cover_color, graph_json, system_template, is_delete)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)
                    ON CONFLICT (id) DO UPDATE SET
                      name = EXCLUDED.name,
                      description = EXCLUDED.description,
                      category = EXCLUDED.category,
                      tags = EXCLUDED.tags,
                      cover_color = EXCLUDED.cover_color,
                      graph_json = EXCLUDED.graph_json,
                      system_template = 1,
                      is_delete = 0,
                      update_time = CURRENT_TIMESTAMP
                    WHERE workflow_template.graph_json IS NULL
                       OR workflow_template.graph_json NOT LIKE '%DouyinVideoDownloader%'
                    """,
                    "tpl-douyin-parse-ingestion",
                    "抖音链接入库",
                    "抖音分享链接/分享文本 → 携带 Cookie 解析视频详情 → 下载视频到宿主机本地媒体库 → Whisper 转录 → LLM 结构化 Markdown → 存入知识库。仅保存 Markdown 文档和媒体路径，不自动做 RAG 分块向量化。",
                    "parse",
                    "解析,抖音,视频,下载,转录,Whisper,LLM,Markdown,知识库",
                    "rose",
                    graphJson);
        } catch (Exception e) {
            log.warn("douyin parse workflow template migration skipped: {}", e.getMessage());
        }
    }

    private void ensureThinkingModelTable() {
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS thinking_model (
                  id VARCHAR(64) PRIMARY KEY,
                  kb_id VARCHAR(64),
                  model_id VARCHAR(128) NOT NULL,
                  model_name VARCHAR(256),
                  is_active BOOLEAN DEFAULT TRUE,
                  routing_category VARCHAR(64),
                  tags JSONB,
                  tool_schema JSONB,
                  execution_prompt TEXT,
                  raw_text TEXT,
                  description VARCHAR(512),
                  create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  is_delete INTEGER DEFAULT 0
                )
                """);
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_thinking_model_id ON thinking_model(model_id)");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_thinking_model_category ON thinking_model(routing_category)");
            jdbcTemplate.execute("ALTER TABLE thinking_model ADD COLUMN IF NOT EXISTS kb_id VARCHAR(64)");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_thinking_model_kb_id ON thinking_model(kb_id)");
        } catch (Exception e) {
            log.warn("thinking_model table migration skipped: {}", e.getMessage());
        }
    }

    private void ensureThinkingModelIngestionTemplate() {
        String graphJson = """
                {
                  "nodes": [
                    {"id":"node-document-loader","type":"genericNode","position":{"x":-400,"y":0},"data":{"id":"node-document-loader","type":"DocumentLoader","node":{"type":"DocumentLoader","display_name":"文档加载器","description":"加载文档并解析为纯文本。运行时由入库入口注入文档 ID。","icon":"Paperclip","base_classes":["Data"],"category":"files_and_knowledge","template":{"document_id":{"name":"document_id","display_name":"选择文档","type":"document","input_types":[],"value":"","required":false},"content":{"name":"content","display_name":"文本内容","type":"str","input_types":["Text"],"value":"","required":false},"file_type":{"name":"file_type","display_name":"文件类型","type":"str","input_types":[],"value":"md","required":false}},"outputs":[{"name":"text","display_name":"文本","types":["Text"]}]}}},
                    {"id":"node-prompt","type":"genericNode","position":{"x":-40,"y":-120},"data":{"id":"node-prompt","type":"PromptTemplate","node":{"type":"PromptTemplate","display_name":"提取提示词","description":"约束 LLM 将文章转化为标准化 Function Calling 工具定义。","icon":"Braces","base_classes":["Prompt"],"category":"models_and_agents","template":{"template":{"name":"template","display_name":"模板","type":"str","input_types":[],"value":"# Role\\n你是一个顶级的 AI 架构师与业务咨询专家。你的任务是将用户输入的「非结构化思维模型文章」，转化为大模型可调用的「标准化 Function Calling 工具」。\\n\\n# Workflow\\n请阅读用户输入的文本，提取核心逻辑，并严格输出为以下 JSON 格式。\\n\\n# JSON Schema 要求\\n{\\n  \\"model_id\\": \\"根据模型英文名生成，如 tool_swot_001\\",\\n  \\"model_name\\": \\"模型中文名\\",\\n  \\"is_active\\": true,\\n  \\"routing_category\\": \\"必须从以下四个中选一个：[战略与商业, 诊断与分析, 流程与执行, 表达与沟通]\\",\\n  \\"tags\\": [\\"提取3-5个触发该模型的业务场景关键词\\"],\\n  \\"tool_schema\\": {\\n    \\"name\\": \\"纯英文，下划线命名法\\",\\n    \\"description\\": \\"用大白话描述：当用户遇到什么具体困难、需要做什么事时，调用此模型。必须精准，这是路由的核心依据。\\",\\n    \\"parameters\\": {\\n      \\"type\\": \\"object\\",\\n      \\"properties\\": {\\n        \\"变量名1\\": {\\"type\\": \\"string\\", \\"description\\": \\"变量含义说明\\"}\\n      },\\n      \\"required\\": [\\"必须由用户提供的核心变量名\\"]\\n    }\\n  },\\n  \\"execution_prompt\\": \\"你现在是该领域的顶级专家。请基于用户提供的参数，严格按照以下步骤执行：\\\\n1. [步骤1名称]: [步骤1具体做法]\\\\n2. [步骤2名称]: [步骤2具体做法]...\\"\\n}\\n\\n# Constraint\\n- 不要输出任何解释性废话，只输出合法的 JSON。\\n- execution_prompt 必须具有极强的指令性和实操性，确保大模型拿到后能直接干活。\\n- tool_schema.name 必须是纯英文、下划线命名法。\\n- tags 提取3-5个业务场景关键词。\\n- routing_category 只能是：战略与商业、诊断与分析、流程与执行、表达与沟通。","required":true}},"outputs":[{"name":"prompt","display_name":"提示词","types":["Prompt","Text"]}]}}},
                    {"id":"node-llm","type":"genericNode","position":{"x":320,"y":0},"data":{"id":"node-llm","type":"LanguageModel","node":{"type":"LanguageModel","display_name":"LLM 提取","description":"调用大语言模型，将思维模型文章转化为标准化工具 JSON。","icon":"BrainCog","base_classes":["LanguageModel"],"category":"models_and_agents","template":{"model_config_id":{"name":"model_config_id","display_name":"选择模型","type":"model_config","input_types":[],"value":"","required":false,"info":"留空时后端自动选择一个已启用的对话模型","modelType":"chat"},"input_value":{"name":"input_value","display_name":"输入","type":"str","input_types":["Message","Text","Data"],"value":"","required":true},"system_message":{"name":"system_message","display_name":"系统消息输入","type":"str","input_types":["Prompt","Text"],"value":"你是一个专业的工具定义提取器。","required":false},"temperature":{"name":"temperature","display_name":"温度覆盖","type":"float","input_types":[],"value":0.1,"required":false,"advanced":true},"max_tokens":{"name":"max_tokens","display_name":"最大令牌数覆盖（留空=模型最大）","type":"int","input_types":[],"value":"","required":false,"advanced":true}},"outputs":[{"name":"response","display_name":"工具 JSON","types":["Message","Text"]},{"name":"model","display_name":"语言模型","types":["LanguageModel"]}]}}},
                    {"id":"node-validator","type":"genericNode","position":{"x":680,"y":0},"data":{"id":"node-validator","type":"FormatValidator","node":{"type":"FormatValidator","display_name":"格式校验","description":"校验 LLM 输出为合法 JSON 对象，修复常见格式问题。","icon":"CheckCircle","base_classes":["Data"],"category":"output","template":{"input":{"name":"input","display_name":"输入","type":"str","input_types":["Text","Message"],"value":"","required":true},"expected_format":{"name":"expected_format","display_name":"期望格式","type":"str","input_types":[],"value":"json_object","required":true,"info":"思维模型提取使用 json_object 格式","options":["json_candidates","json_object","json_array","plain_list"]}},"outputs":[{"name":"output","display_name":"校验后 JSON","types":["Data"]}]}}},
                    {"id":"node-writer","type":"genericNode","position":{"x":1040,"y":0},"data":{"id":"node-writer","type":"ThinkingModelWriter","node":{"type":"ThinkingModelWriter","display_name":"思维模型落库","description":"将标准化工具 JSON 写入 thinking_model 表，完成入库。","icon":"Save","base_classes":["Data"],"category":"files_and_knowledge","template":{"input":{"name":"input","display_name":"工具 JSON","type":"str","input_types":["Data","Text"],"value":"","required":true},"raw_text":{"name":"raw_text","display_name":"原始文本","type":"str","input_types":[],"value":"","required":false,"info":"原始输入的文章文本（自动注入）"}},"outputs":[{"name":"result","display_name":"入库结果","types":["Data"]}]}}}
                  ],
                  "edges": [
                    {"id":"edge-loader-llm","source":"node-document-loader","target":"node-llm","sourceHandle":"text","targetHandle":"input_value"},
                    {"id":"edge-prompt-llm","source":"node-prompt","target":"node-llm","sourceHandle":"prompt","targetHandle":"system_message"},
                    {"id":"edge-llm-validator","source":"node-llm","target":"node-validator","sourceHandle":"response","targetHandle":"input"},
                    {"id":"edge-validator-writer","source":"node-validator","target":"node-writer","sourceHandle":"output","targetHandle":"input"}
                  ]
                }
                """;
        try {
            // 删除旧记录后重新插入，确保修复后的 graphJson 生效
            jdbcTemplate.update("DELETE FROM workflow_template WHERE id = 'tpl-thinking-model-ingestion'");
            jdbcTemplate.update("""
                    INSERT INTO workflow_template (id, name, description, category, tags, cover_color, graph_json, system_template, is_delete)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)
                    ON CONFLICT (id) DO UPDATE SET
                      name = EXCLUDED.name,
                      description = EXCLUDED.description,
                      category = EXCLUDED.category,
                      tags = EXCLUDED.tags,
                      cover_color = EXCLUDED.cover_color,
                      graph_json = EXCLUDED.graph_json,
                      system_template = 1,
                      is_delete = 0,
                      update_time = CURRENT_TIMESTAMP
                    """,
                    "tpl-thinking-model-ingestion",
                    "思维模型入库",
                    "文章 → LLM 提取 → FormatValidator 校验 → 标准化工具 JSON 落库。跳过分块和向量化，直接生成 Agent 可调用的 Function Calling 工具定义。",
                    "tool",
                    "思维模型,Text-to-Tool,工具,入库",
                    "amber",
                    graphJson);
        } catch (Exception e) {
            log.warn("thinking model ingestion workflow template migration skipped: {}", e.getMessage());
        }
    }

    /**
     * 新版事件追踪表（PRD: OPC 知识库事件模块）
     * 设计理念：事件为中心、自包含（实体内嵌）、可信度评估、影响推演、双写检索
     */
    private void ensureKnowledgeEventsTable() {
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS knowledge_events (
                    id VARCHAR(64) PRIMARY KEY,
                    kb_id VARCHAR(36) NOT NULL,
                    doc_id VARCHAR(36),
                    event_date DATE,
                    time_granularity VARCHAR(10) DEFAULT 'exact',
                    search_index TEXT,
                    entities JSONB DEFAULT '[]',
                    action TEXT NOT NULL,
                    source_type VARCHAR(20) DEFAULT 'news',
                    confidence_score INT DEFAULT 5,
                    verification_status VARCHAR(20) DEFAULT 'unverified',
                    impact_inference TEXT,
                    source_url TEXT,
                    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_delete INT DEFAULT 0
                )
                """);
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_ke_kb ON knowledge_events(kb_id)");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_ke_doc ON knowledge_events(doc_id)");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_ke_date ON knowledge_events(event_date)");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_ke_confidence ON knowledge_events(confidence_score)");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_ke_source_type ON knowledge_events(source_type)");
        } catch (Exception e) {
            log.warn("knowledge_events table migration skipped: {}", e.getMessage());
        }
    }

    /**
     * 事件入库工作流模板
     * 流程：DocumentLoader → PromptTemplate → LanguageModel → FormatValidator → EventWriter
     */
    private void ensureEventIngestionTemplate() {
        String graphJson = """
            {
              "nodes": [
                {"id":"node-document-loader","type":"genericNode","position":{"x":-400,"y":0},"data":{"id":"node-document-loader","type":"DocumentLoader","node":{"type":"DocumentLoader","display_name":"文档加载器","description":"加载文档并解析为纯文本。运行时由入库入口注入文档 ID。","icon":"Paperclip","base_classes":["Data"],"category":"files_and_knowledge","template":{"document_id":{"name":"document_id","display_name":"选择文档","type":"document","input_types":[],"value":"","required":false},"content":{"name":"content","display_name":"文本内容","type":"str","input_types":["Text"],"value":"","required":false},"file_type":{"name":"file_type","display_name":"文件类型","type":"str","input_types":[],"value":"md","required":false}},"outputs":[{"name":"text","display_name":"文本","types":["Text"]}]}}},
                {"id":"node-prompt","type":"genericNode","position":{"x":-40,"y":-120},"data":{"id":"node-prompt","type":"PromptTemplate","node":{"type":"PromptTemplate","display_name":"事件提取提示词","description":"约束 LLM 从文本中提取标准化事件 JSON，包含时间锚点、可信度评估、影响推演、搜索索引。","icon":"Braces","base_classes":["Prompt"],"category":"models_and_agents","template":{"template":{"name":"template","display_name":"模板","type":"str","input_types":[],"value":"# Role\\n你是一个专业的事件情报分析专家。你的任务是从非结构化文本中提取**核心事件**，输出标准化的 JSON 结构，用于构建事件追踪知识库。\\n\\n# 核心原则\\n1. 每个事件必须有**明确的时间锚点**（至少年份，精确到日最佳）\\n2. 每个事件必须有**可信度评估**（官方公告9-10分，主流媒体7-8分，自媒体/社交网络4-6分，传闻1-3分）\\n3. 每个事件必须有**影响推演**（对行业/独立开发者/一人公司的潜在影响）\\n4. 每个事件必须生成高密度的**搜索关键词**（包含同义词和行业黑话，专供语义检索使用）\\n\\n# 什么算核心事件\\n- 产品发布/重大更新、定价调整、公司收购/合并\\n- 政策法规变化、技术突破、行业趋势转变\\n- 关键人物变动、融资/上市、市场份额变化\\n- 有实质影响的事件（不只是声明，要有后续影响）\\n\\n# 什么不算核心事件\\n- 纯描述性数据（市值X亿不是事件）\\n- 没有时间锚点的泛泛而谈\\n- 同一事件的不同角度应合并为一条\\n\\n# 事件结构定义\\n每个事件必须包含以下字段：\\n- **time_anchor**: 时间锚点（⚠️ 必须如实反映原文的时间精度，不要瞎编精确日期！）\\n  - date: YYYY-MM-DD 格式（精确到日用实际日期，精确到月用该月1号，精确到年用1月1日）\\n  - granularity: exact（精确到日）/ month（精确到月）/ year（精确到年）\\n- **entities**: 参与主体数组（人物/组织/产品名称）\\n- **action**: 事件核心动作（一句话总结）\\n- **credibility**: 可信度评估\\n  - source_type: official / news / social_media\\n  - confidence_score: 1-10 整数\\n  - verification_status: verified / unverified\\n- **impact_inference**: LLM 推演的商业影响（30-80字）\\n- **search_index**: 高密度搜索关键词（逗号分隔，3-8个）\\n\\n# JSON Schema\\n严格输出以下 JSON 格式：\\n{\\n  \\"events\\": [\\n    {\\n      \\"time_anchor\\": { \\"date\\": \\"2024-01-01\\", \\"granularity\\": \\"exact\\" },\\n      \\"entities\\": [\\"OpenAI\\", \\"GPT-4\\"],\\n      \\"action\\": \\"事件核心动作\\",\\n      \\"credibility\\": { \\"source_type\\": \\"official\\", \\"confidence_score\\": 9, \\"verification_status\\": \\"verified\\" },\\n      \\"impact_inference\\": \\"商业影响推演\\",\\n      \\"search_index\\": \\"关键词1,关键词2,关键词3\\"\\n    }\\n  ]\\n}\\n\\n# Constraint\\n- 只输出合法 JSON，不要输出任何解释性文字\\n- time_anchor.date 必须是 YYYY-MM-DD 格式\\n- confidence_score 必须是 1-10 的整数\\n- source_type 只能是 official / news / social_media\\n- verification_status 只能是 verified / unverified\\n- search_index 必须高密度，包含3-8个关键词\\n- 如果文本中没有明确时间，根据上下文推断最可能的时间，granularity 设为 year 或 month","required":true}},"outputs":[{"name":"prompt","display_name":"提示词","types":["Prompt","Text"]}]}}},
                {"id":"node-llm","type":"genericNode","position":{"x":320,"y":0},"data":{"id":"node-llm","type":"LanguageModel","node":{"type":"LanguageModel","display_name":"LLM 事件提取","description":"调用大语言模型，将文本转化为标准化事件 JSON。","icon":"BrainCog","base_classes":["LanguageModel"],"category":"models_and_agents","template":{"model_config_id":{"name":"model_config_id","display_name":"选择模型","type":"model_config","input_types":[],"value":"","required":false,"info":"留空时后端自动选择一个已启用的对话模型","modelType":"chat"},"input_value":{"name":"input_value","display_name":"输入","type":"str","input_types":["Message","Text","Data"],"value":"","required":true},"system_message":{"name":"system_message","display_name":"系统消息输入","type":"str","input_types":["Prompt","Text"],"value":"","required":false},"temperature":{"name":"temperature","display_name":"温度覆盖","type":"float","input_types":[],"value":0.1,"required":false,"advanced":true},"max_tokens":{"name":"max_tokens","display_name":"最大令牌数覆盖","type":"int","input_types":[],"value":4096,"required":false,"advanced":true}},"outputs":[{"name":"response","display_name":"事件 JSON","types":["Message","Text"]},{"name":"model","display_name":"语言模型","types":["LanguageModel"]}]}}},
                {"id":"node-validator","type":"genericNode","position":{"x":680,"y":0},"data":{"id":"node-validator","type":"FormatValidator","node":{"type":"FormatValidator","display_name":"格式校验","description":"校验 LLM 输出为合法 JSON 对象，修复常见格式问题。","icon":"CheckCircle","base_classes":["Data"],"category":"output","template":{"input":{"name":"input","display_name":"输入","type":"str","input_types":["Text","Message"],"value":"","required":true},"expected_format":{"name":"expected_format","display_name":"期望格式","type":"str","input_types":[],"value":"json_object","required":true,"info":"事件提取使用 json_object 格式","options":["json_candidates","json_object","json_array","plain_list"]}},"outputs":[{"name":"output","display_name":"校验后 JSON","types":["Data"]}]}}},
                {"id":"node-event-writer","type":"genericNode","position":{"x":1040,"y":0},"data":{"id":"node-event-writer","type":"EventWriter","node":{"type":"EventWriter","display_name":"事件落库","description":"将标准化事件 JSON 写入 knowledge_events 表+向量双写。","icon":"Save","base_classes":["Data"],"category":"files_and_knowledge","template":{"input":{"name":"input","display_name":"事件 JSON","type":"str","input_types":["Data","Text"],"value":"","required":true},"kb_id":{"name":"kb_id","display_name":"知识库ID","type":"str","input_types":[],"value":"","required":false,"info":"运行时自动注入"},"embedding_model_config_id":{"name":"embedding_model_config_id","display_name":"向量模型","type":"model_config","input_types":[],"value":"","required":false,"info":"留空时自动选择可用向量模型","modelType":"embedding"}},"outputs":[{"name":"result","display_name":"入库结果","types":["Data"]}]}}},
                {"id":"node-entity-aligner","type":"genericNode","position":{"x":1400,"y":0},"data":{"id":"node-entity-aligner","type":"EntityAligner","node":{"type":"EntityAligner","display_name":"实体对齐","description":"从落库的 JSON 中按路径提取实体名，命中 knowledge_entities 则关联，未命中则异步建档。","icon":"Network","base_classes":["Data"],"category":"files_and_knowledge","template":{"input_json":{"name":"input_json","display_name":"输入 JSON","type":"str","input_types":["Data","Text"],"value":"","required":false,"info":"留空时自动读取上游 Writer 传递的 events_json"},"items_root":{"name":"items_root","display_name":"数据数组字段","type":"str","input_types":[],"value":"events","required":false,"info":"JSON 中的数组根键，如 events / cases / opinions"},"entity_paths":{"name":"entity_paths","display_name":"实体路径","type":"str","input_types":[],"value":"[\\"entities[].name\\",\\"entities[]\\"]","required":false,"info":"JSON 路径数组，支持 a.b、a.b[]、a.b[].c；[] 表示遍历数组"}},"outputs":[{"name":"aligned","display_name":"对齐结果","types":["Data"]}]}}}
              ],
              "edges": [
                {"id":"edge-loader-llm","source":"node-document-loader","target":"node-llm","sourceHandle":"text","targetHandle":"input_value"},
                {"id":"edge-prompt-llm","source":"node-prompt","target":"node-llm","sourceHandle":"prompt","targetHandle":"system_message"},
                {"id":"edge-llm-validator","source":"node-llm","target":"node-validator","sourceHandle":"response","targetHandle":"input"},
                {"id":"edge-validator-writer","source":"node-validator","target":"node-event-writer","sourceHandle":"output","targetHandle":"input"},
                {"id":"edge-writer-aligner","source":"node-event-writer","target":"node-entity-aligner","sourceHandle":"result","targetHandle":"input_json"}
              ]
            }
            """;
        try {
            jdbcTemplate.update("DELETE FROM workflow_template WHERE id = 'tpl-event-ingestion'");
            jdbcTemplate.update("""
                    INSERT INTO workflow_template (id, name, description, category, tags, cover_color, graph_json, system_template, is_delete)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)
                    ON CONFLICT (id) DO UPDATE SET
                      name = EXCLUDED.name,
                      description = EXCLUDED.description,
                      category = EXCLUDED.category,
                      tags = EXCLUDED.tags,
                      cover_color = EXCLUDED.cover_color,
                      graph_json = EXCLUDED.graph_json,
                      system_template = 1,
                      is_delete = 0,
                      update_time = CURRENT_TIMESTAMP
                    """,
                    "tpl-event-ingestion",
                    "事件入库",
                    "文档加载 → LLM事件提取 → 格式校验 → 标准化事件落库。提取时间锚点、可信度评估、影响推演、搜索索引，支持模糊时间标准化。",
                    "rag",
                    "RAG,事件追踪,可信度,影响推演",
                    "rose",
                    graphJson);
        } catch (Exception e) {
            log.warn("event ingestion workflow template migration skipped: {}", e.getMessage());
        }
    }

    private void ensureKnowledgeCasesTable() {
        try {
            jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS knowledge_cases (
                id VARCHAR(64) PRIMARY KEY,
                kb_id VARCHAR(64) NOT NULL,
                source_doc_id VARCHAR(64),
                case_data JSONB,
                search_index TEXT,
                create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                is_delete INT DEFAULT 0
            )
        """);

            // GIN 索引：支持 @> 操作符进行毫秒级 JSONB 数组包含查询
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_cases_kb_id ON knowledge_cases(kb_id)");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_cases_source_doc_id ON knowledge_cases(source_doc_id)");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_cases_data_context_industry ON knowledge_cases USING GIN ((case_data->'context'->'industry'))");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_cases_data_context_biz_model ON knowledge_cases USING GIN ((case_data->'context'->'business_model'))");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_cases_data_context_stage ON knowledge_cases USING GIN ((case_data->'context'->'company_stage'))");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_cases_data_context_audience ON knowledge_cases USING GIN ((case_data->'context'->'target_audience'))");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_cases_data_credibility ON knowledge_cases ((case_data->'credibility'->>'authenticity_score'))");

            log.info("知识库案例表(knowledge_cases)初始化完成");
        } catch (Exception e) {
            log.warn("知识库案例表初始化异常: {}", e.getMessage());
        }
    }

    private void ensureCaseIngestionTemplateNew() {
        try {
            jdbcTemplate.update("DELETE FROM workflow_template WHERE id = 'tpl-case-ingestion'");
            String graphJson = """
                {
                  "nodes": [
                    {"id":"node-document-loader","type":"genericNode","position":{"x":-400,"y":0},"data":{"id":"node-document-loader","type":"DocumentLoader","node":{"type":"DocumentLoader","display_name":"文档加载器","description":"加载文档并解析为纯文本。运行时由入库入口注入文档 ID。","icon":"Paperclip","base_classes":["Data"],"category":"files_and_knowledge","template":{"document_id":{"name":"document_id","display_name":"选择文档","type":"document","input_types":[],"value":"","required":false},"content":{"name":"content","display_name":"文本内容","type":"str","input_types":["Text"],"value":"","required":false},"file_type":{"name":"file_type","display_name":"文件类型","type":"str","input_types":[],"value":"md","required":false}},"outputs":[{"name":"text","display_name":"文本","types":["Text"]}]}}},
                    {"id":"node-prompt","type":"genericNode","position":{"x":-40,"y":-120},"data":{"id":"node-prompt","type":"PromptTemplate","node":{"type":"PromptTemplate","display_name":"案例提取提示词","description":"约束 LLM 从文本中提取标准化商业案例 JSON，包含多维标签、防伪可信度、附属物挂载。","icon":"Braces","base_classes":["Prompt"],"category":"models_and_agents","template":{"template":{"name":"template","display_name":"模板","type":"str","input_types":[],"value":"# Role\\n你是一个极其挑剔的商业咨询顾问。你的任务是从非结构化文本中提取**可实操的商业案例**，输出标准化的 JSON 结构。\\n\\n# 核心原则\\n1. **剥离公关废话**：只提取客观动作和可验证的事实，过滤掉自吹自擂的形容词\\n2. **防伪存真**：必须填写 survivorship_bias_warning，指出该案例中未明说的隐性门槛（资金、人脉、时代红利）\\n3. **多维标签**：context 下的每个字段必须为纯字符串数组，用于后续精准筛选\\n4. **附属物提取**：原文中提到的具体工具链接、报表截图、代码库，必须提取到 attachments 数组\\n5. **症状而非病因**：problem.symptom_summary 要描述表现，root_causes 要描述根因\\n\\n# 什么算商业案例\\n- 有明确的业务困境和解决方案\\n- 有可量化的结果或可验证的进展\\n- 有可复刻的执行步骤\\n- 包含行业、商业模式等多维特征\\n\\n# JSON Schema\\n严格输出以下 JSON 格式：\\n{\\n  \\"cases\\": [\\n    {\\n      \\"title\\": \\"一句话概括案例核心\\",\\n      \\"context\\": {\\n        \\"industry\\": [\\"SaaS\\", \\"内容变现\\"],\\n        \\"business_model\\": [\\"数字商品\\", \\"买断制\\"],\\n        \\"company_stage\\": [\\"种子期\\", \\"冷启动\\"],\\n        \\"target_audience\\": [\\"ToC\\", \\"创作者\\"]\\n      },\\n      \\"problem\\": {\\n        \\"symptom_summary\\": \\"业务困境表现（30-80字）\\",\\n        \\"root_causes\\": [\\"根因1\\", \\"根因2\\"]\\n      },\\n      \\"solution\\": {\\n        \\"strategy_type\\": [\\"SEO优化\\", \\"社区营销\\"],\\n        \\"execution_steps\\": [\\"1. 具体步骤...\\"]\\n      },\\n      \\"outcome\\": {\\n        \\"result_summary\\": \\"可量化结果（30-80字）\\",\\n        \\"key_success_factors\\": [\\"关键成功因素1\\"]\\n      },\\n      \\"credibility\\": {\\n        \\"source_nature\\": \\"first_hand_review\\",\\n        \\"authenticity_score\\": 7,\\n        \\"survivorship_bias_warning\\": \\"必须指出未明说的隐性门槛\\"\\n      },\\n      \\"attachments\\": [],\\n      \\"search_index\\": \\"高密度搜索关键词（逗号分隔，3-8个）\\"\\n    }\\n  ]\\n}\\n\\n# 字段约束\\n- credibility.source_nature: 枚举 official_report / first_hand_review / third_party_analysis / PR_article\\n- credibility.authenticity_score: 1-10整数（官方报告8-10，一手复盘6-8，三方分析4-6，PR稿1-3）\\n- credibility.survivorship_bias_warning: 必填，必须指出隐性门槛\\n- context: 必填，每个子字段必须为非空字符串数组\\n- attachments: 可为空数组\\n- search_index: 必填，3-8个关键词\\n\\n# Constraint\\n- 只输出合法 JSON，不要输出任何解释性文字\\n- 如果文本中不包含可提取的商业案例，返回 {\\"cases\\": []}","required":true}},"outputs":[{"name":"prompt","display_name":"提示词","types":["Prompt","Text"]}]}}},
                    {"id":"node-llm","type":"genericNode","position":{"x":320,"y":0},"data":{"id":"node-llm","type":"LanguageModel","node":{"type":"LanguageModel","display_name":"LLM 案例提取","description":"调用大语言模型，将文本转化为标准化案例 JSON。","icon":"BrainCog","base_classes":["LanguageModel"],"category":"models_and_agents","template":{"model_config_id":{"name":"model_config_id","display_name":"选择模型","type":"model_config","input_types":[],"value":"","required":false,"info":"留空时后端自动选择一个已启用的对话模型","modelType":"chat"},"input_value":{"name":"input_value","display_name":"输入","type":"str","input_types":["Message","Text","Data"],"value":"","required":true},"system_message":{"name":"system_message","display_name":"系统消息输入","type":"str","input_types":["Prompt","Text"],"value":"","required":false},"temperature":{"name":"temperature","display_name":"温度覆盖","type":"float","input_types":[],"value":0.1,"required":false,"advanced":true},"max_tokens":{"name":"max_tokens","display_name":"最大令牌数覆盖","type":"int","input_types":[],"value":4096,"required":false,"advanced":true}},"outputs":[{"name":"response","display_name":"案例 JSON","types":["Message","Text"]},{"name":"model","display_name":"语言模型","types":["LanguageModel"]}]}}},
                    {"id":"node-validator","type":"genericNode","position":{"x":680,"y":0},"data":{"id":"node-validator","type":"FormatValidator","node":{"type":"FormatValidator","display_name":"格式校验","description":"校验 LLM 输出为合法 JSON，修复常见格式问题。","icon":"CheckCircle","base_classes":["Data"],"category":"output","template":{"input":{"name":"input","display_name":"输入","type":"str","input_types":["Text","Message"],"value":"","required":true},"expected_format":{"name":"expected_format","display_name":"期望格式","type":"str","input_types":[],"value":"json_object","required":true,"info":"案例提取使用 json_object 格式","options":["json_candidates","json_object","json_array","plain_list"]}},"outputs":[{"name":"output","display_name":"校验后 JSON","types":["Data"]}]}}},
                    {"id":"node-case-writer","type":"genericNode","position":{"x":1040,"y":0},"data":{"id":"node-case-writer","type":"CaseWriter","node":{"type":"CaseWriter","display_name":"案例落库","description":"将标准化案例 JSON 写入 knowledge_cases 表+向量双写。","icon":"Save","base_classes":["Data"],"category":"files_and_knowledge","template":{"input":{"name":"input","display_name":"案例 JSON","type":"str","input_types":["Data","Text"],"value":"","required":true},"kb_id":{"name":"kb_id","display_name":"知识库ID","type":"str","input_types":[],"value":"","required":false,"info":"运行时自动注入"},"embedding_model_config_id":{"name":"embedding_model_config_id","display_name":"向量模型","type":"model_config","input_types":[],"value":"","required":false,"info":"留空时自动选择可用向量模型","modelType":"embedding"}},"outputs":[{"name":"result","display_name":"入库结果","types":["Data"]}]}}},
                    {"id":"node-entity-aligner","type":"genericNode","position":{"x":1400,"y":0},"data":{"id":"node-entity-aligner","type":"EntityAligner","node":{"type":"EntityAligner","display_name":"实体对齐","description":"从落库的 JSON 中按路径提取实体名，命中 knowledge_entities 则关联，未命中则异步建档。","icon":"Network","base_classes":["Data"],"category":"files_and_knowledge","template":{"input_json":{"name":"input_json","display_name":"输入 JSON","type":"str","input_types":["Data","Text"],"value":"","required":false,"info":"留空时自动读取上游 Writer 传递的 cases_json"},"items_root":{"name":"items_root","display_name":"数据数组字段","type":"str","input_types":[],"value":"cases","required":false},"entity_paths":{"name":"entity_paths","display_name":"实体路径","type":"str","input_types":[],"value":"[\\"context.company\\",\\"context.brand\\",\\"entities[]\\",\\"entities[].name\\"]","required":false,"info":"JSON 路径数组，支持 a.b、a.b[]、a.b[].c；[] 表示遍历数组"}},"outputs":[{"name":"aligned","display_name":"对齐结果","types":["Data"]}]}}}
                  ],
                  "edges": [
                    {"id":"edge-loader-llm","source":"node-document-loader","target":"node-llm","sourceHandle":"text","targetHandle":"input_value"},
                    {"id":"edge-prompt-llm","source":"node-prompt","target":"node-llm","sourceHandle":"prompt","targetHandle":"system_message"},
                    {"id":"edge-llm-validator","source":"node-llm","target":"node-validator","sourceHandle":"response","targetHandle":"input"},
                    {"id":"edge-validator-writer","source":"node-validator","target":"node-case-writer","sourceHandle":"output","targetHandle":"input"},
                    {"id":"edge-writer-aligner","source":"node-case-writer","target":"node-entity-aligner","sourceHandle":"result","targetHandle":"input_json"}
                  ]
                }
                """;
            jdbcTemplate.update("""
                    INSERT INTO workflow_template (id, name, description, category, tags, cover_color, graph_json, system_template, is_delete)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)
                    ON CONFLICT (id) DO UPDATE SET
                      name = EXCLUDED.name,
                      description = EXCLUDED.description,
                      category = EXCLUDED.category,
                      tags = EXCLUDED.tags,
                      cover_color = EXCLUDED.cover_color,
                      graph_json = EXCLUDED.graph_json,
                      system_template = 1,
                      is_delete = 0,
                      update_time = CURRENT_TIMESTAMP
                    """,
                    "tpl-case-ingestion",
                    "案例入库",
                    "文档加载 → LLM案例提取 → 格式校验 → 标准化案例落库+向量双写。提取多维标签、防伪可信度、附属物挂载。",
                    "rag",
                    "RAG,案例,商业案例,可信度",
                    "violet",
                    graphJson);
            log.info("案例入库工作流模板初始化完成");
        } catch (Exception e) {
            log.warn("案例入库工作流模板初始化异常: {}", e.getMessage());
        }
    }

    /**
     * 全局实体表（knowledge_entities）
     * 设计理念：统一命名规范（消歧义）+ 存储实体背景（提供上下文）+ 别名检索
     * 实体类型：Person 人物 / Company 公司 / Product 产品 / Concept 概念
     */
    private void ensureKnowledgeEntitiesTable() {
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS knowledge_entities (
                    id VARCHAR(64) PRIMARY KEY,
                    kb_id VARCHAR(36) NOT NULL,
                    name VARCHAR(256) NOT NULL,
                    type VARCHAR(20) NOT NULL,
                    aliases JSONB DEFAULT '[]',
                    description TEXT,
                    metadata JSONB DEFAULT '{}',
                    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_delete INT DEFAULT 0
                )
                """);
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_ke_kb_id ON knowledge_entities(kb_id)");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_ke_type ON knowledge_entities(type)");
            // GIN 索引支撑 aliases 数组包含查询
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_ke_aliases ON knowledge_entities USING GIN (aliases)");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_ke_name ON knowledge_entities(name)");
            log.info("knowledge_entities 表已就绪");
        } catch (Exception e) {
            log.warn("knowledge_entities table migration skipped: {}", e.getMessage());
        }
    }

    /**
     * 观点表（knowledge_opinions）
     * 设计理念：实体关系驱动（Entity-Relational）—— 观点是"主体实体 → 看法 → 客体实体"的关系
     * 核心字段：relations（实体关系层 JSONB）+ context（业务上下文 JSONB）+ core_thesis + supporting_logic + credibility
     */
    private void ensureKnowledgeOpinionsTable() {
        try {
            jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS knowledge_opinions (
                    id VARCHAR(64) PRIMARY KEY,
                    kb_id VARCHAR(36) NOT NULL,
                    doc_id VARCHAR(36),
                    relations JSONB DEFAULT '{}',
                    context JSONB DEFAULT '{}',
                    core_thesis TEXT,
                    supporting_logic JSONB DEFAULT '[]',
                    credibility JSONB DEFAULT '{}',
                    search_index TEXT,
                    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    is_delete INT DEFAULT 0
                )
                """);
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_ko_kb_id ON knowledge_opinions(kb_id)");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_ko_doc_id ON knowledge_opinions(doc_id)");
            // GIN 索引：支撑 relations->'source_entity' 和 relations->'target_entities' 的 JSONB 查询
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_ko_relations_source ON knowledge_opinions ((relations->>'source_entity'))");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_ko_relations_target ON knowledge_opinions USING GIN ((relations->'target_entities'))");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_ko_context_stance ON knowledge_opinions USING GIN ((context->'stance'))");
            log.info("knowledge_opinions 表已就绪");
        } catch (Exception e) {
            log.warn("knowledge_opinions table migration skipped: {}", e.getMessage());
        }
    }

    /**
     * 观点入库工作流模板
     * 流程：DocumentLoader → PromptTemplate → LanguageModel → FormatValidator → OpinionWriter
     */
    private void ensureOpinionIngestionTemplate() {
        String graphJson = """
            {
              "nodes": [
                {"id":"node-document-loader","type":"genericNode","position":{"x":-400,"y":0},"data":{"id":"node-document-loader","type":"DocumentLoader","node":{"type":"DocumentLoader","display_name":"文档加载器","description":"加载文档并解析为纯文本。运行时由入库入口注入文档 ID。","icon":"Paperclip","base_classes":["Data"],"category":"files_and_knowledge","template":{"document_id":{"name":"document_id","display_name":"选择文档","type":"document","input_types":[],"value":"","required":false},"content":{"name":"content","display_name":"文本内容","type":"str","input_types":["Text"],"value":"","required":false},"file_type":{"name":"file_type","display_name":"文件类型","type":"str","input_types":[],"value":"md","required":false}},"outputs":[{"name":"text","display_name":"文本","types":["Text"]}]}}},
                {"id":"node-prompt","type":"genericNode","position":{"x":-40,"y":-120},"data":{"id":"node-prompt","type":"PromptTemplate","node":{"type":"PromptTemplate","display_name":"观点提取提示词","description":"约束 LLM 从文本中提取标准化观点 JSON，包含实体关系层、业务上下文、核心论点、支撑逻辑、防伪机制。","icon":"Braces","base_classes":["Prompt"],"category":"models_and_agents","template":{"template":{"name":"template","display_name":"模板","type":"str","input_types":[],"value":"# Role\\n你是一个极其挑剔的商业情报分析师。你的任务是从非结构化文本中提取**核心观点**，输出标准化的 JSON 结构，用于构建实体关系驱动的观点知识库。\\n\\n# 核心认知\\n观点本质上是『实体与实体之间的关系』：[主体实体 (Who)] → 产生了某种看法 → [客体实体 (What)]\\n\\n# 核心原则\\n1. **实体标准化（死命令）**：在提取 source_entity 和 target_entities 时，必须使用标准化的全称。例如：遇到『马总』、『Elon』，必须统一输出为『Elon Musk』；遇到『企鹅厂』，必须统一输出为『腾讯』。不要带任何修饰词。\\n2. **利益相关性判断**：必须标注观点持有者与客体的利益关系（利益相关/利益无关/竞争抹黑）\\n3. **逻辑严密性评分**：1-10分，评估论证的严密程度\\n4. **防伪与失效机制**：必须给出观点的失效触发条件\\n\\n# 什么算核心观点\\n- 有明确主体（谁说的）\\n- 有明确客体（在评价什么）\\n- 有独特见解（不是常识）\\n- 有支撑逻辑（有论据）\\n\\n# 什么不算核心观点\\n- 纯事实陈述（应该是事件）\\n- 没有主体的泛泛而谈\\n- 重复性常识\\n\\n# 观点结构定义\\n每个观点必须包含以下字段：\\n- **relations**: 实体关系层\\n  - source_entity: 主体实体（谁提出的观点？必须是标准化全称）\\n  - target_entities: 客体实体数组（这个观点在评价什么？纯字符串数组）\\n  - interest_alignment: 利益相关性枚举（利益相关/利益无关/竞争抹黑）\\n- **context**: 业务上下文\\n  - stance: 观点立场数组（如反共识/长期主义/保守/激进）\\n  - applicable_stage: 适用的商业阶段数组（如种子期/冷启动/增长期/成熟期）\\n- **core_thesis**: 核心论点（一句话总结核心观点）\\n- **supporting_logic**: 支撑逻辑数组（每个论据一个元素）\\n- **credibility**: 防伪与失效机制\\n  - logic_rigor: 逻辑严密程度 1-10 整数\\n  - expiration_trigger: 观点失效的触发条件\\n- **search_index**: 高密度搜索关键词（逗号分隔，3-8个）\\n\\n# JSON Schema\\n严格输出以下 JSON 格式：\\n{\\n  \\"opinions\\": [\\n    {\\n      \\"relations\\": {\\n        \\"source_entity\\": \\"Naval Ravikant\\",\\n        \\"target_entities\\": [\\"SaaS\\", \\"创作者经济\\"],\\n        \\"interest_alignment\\": \\"利益无关\\"\\n      },\\n      \\"context\\": {\\n        \\"stance\\": [\\"反共识\\", \\"长期主义\\"],\\n        \\"applicable_stage\\": [\\"种子期\\", \\"冷启动\\"]\\n      },\\n      \\"core_thesis\\": \\"核心论点一句话总结\\",\\n      \\"supporting_logic\\": [\\"论据1\\", \\"论据2\\"],\\n      \\"credibility\\": {\\n        \\"logic_rigor\\": 9,\\n        \\"expiration_trigger\\": \\"当AI能够完全替代基础代码编写和内容生成时，该观点可能失效\\"\\n      },\\n      \\"search_index\\": \\"Naval,SaaS,创作者经济,零边际成本\\"\\n    }\\n  ]\\n}\\n\\n# Constraint\\n- 只输出合法 JSON，不要输出任何解释性文字\\n- source_entity 和 target_entities 必须使用标准化全称\\n- interest_alignment 只能是 利益相关 / 利益无关 / 竞争抹黑\\n- logic_rigor 必须是 1-10 的整数\\n- search_index 必须高密度，包含3-8个关键词\\n- 如果文本中没有明确观点，返回空数组 {\\"opinions\\":[]}","required":true}},"outputs":[{"name":"prompt","display_name":"提示词","types":["Prompt","Text"]}]}}},
                {"id":"node-llm","type":"genericNode","position":{"x":320,"y":0},"data":{"id":"node-llm","type":"LanguageModel","node":{"type":"LanguageModel","display_name":"LLM 观点提取","description":"调用大语言模型，将文本转化为标准化观点 JSON。","icon":"BrainCog","base_classes":["LanguageModel"],"category":"models_and_agents","template":{"model_config_id":{"name":"model_config_id","display_name":"选择模型","type":"model_config","input_types":[],"value":"","required":false,"info":"留空时后端自动选择一个已启用的对话模型","modelType":"chat"},"input_value":{"name":"input_value","display_name":"输入","type":"str","input_types":["Message","Text","Data"],"value":"","required":true},"system_message":{"name":"system_message","display_name":"系统消息输入","type":"str","input_types":["Prompt","Text"],"value":"","required":false},"temperature":{"name":"temperature","display_name":"温度覆盖","type":"float","input_types":[],"value":0.1,"required":false,"advanced":true},"max_tokens":{"name":"max_tokens","display_name":"最大令牌数覆盖","type":"int","input_types":[],"value":4096,"required":false,"advanced":true}},"outputs":[{"name":"response","display_name":"观点 JSON","types":["Message","Text"]},{"name":"model","display_name":"语言模型","types":["LanguageModel"]}]}}},
                {"id":"node-validator","type":"genericNode","position":{"x":680,"y":0},"data":{"id":"node-validator","type":"FormatValidator","node":{"type":"FormatValidator","display_name":"格式校验","description":"校验 LLM 输出为合法 JSON 对象，修复常见格式问题。","icon":"CheckCircle","base_classes":["Data"],"category":"output","template":{"input":{"name":"input","display_name":"输入","type":"str","input_types":["Text","Message"],"value":"","required":true},"expected_format":{"name":"expected_format","display_name":"期望格式","type":"str","input_types":[],"value":"json_object","required":true,"info":"观点提取使用 json_object 格式","options":["json_candidates","json_object","json_array","plain_list"]}},"outputs":[{"name":"output","display_name":"校验后 JSON","types":["Data"]}]}}},
                {"id":"node-opinion-writer","type":"genericNode","position":{"x":1040,"y":0},"data":{"id":"node-opinion-writer","type":"OpinionWriter","node":{"type":"OpinionWriter","display_name":"观点落库","description":"将标准化观点 JSON 写入 knowledge_opinions 表+向量双写。","icon":"Save","base_classes":["Data"],"category":"files_and_knowledge","template":{"input":{"name":"input","display_name":"观点 JSON","type":"str","input_types":["Data","Text"],"value":"","required":true},"kb_id":{"name":"kb_id","display_name":"知识库ID","type":"str","input_types":[],"value":"","required":false,"info":"运行时自动注入"},"embedding_model_config_id":{"name":"embedding_model_config_id","display_name":"向量模型","type":"model_config","input_types":[],"value":"","required":false,"info":"留空时自动选择可用向量模型","modelType":"embedding"}},"outputs":[{"name":"result","display_name":"入库结果","types":["Data"]}]}}},
                {"id":"node-entity-aligner","type":"genericNode","position":{"x":1400,"y":0},"data":{"id":"node-entity-aligner","type":"EntityAligner","node":{"type":"EntityAligner","display_name":"实体对齐","description":"从落库的 JSON 中按路径提取实体名，命中 knowledge_entities 则关联，未命中则异步建档。","icon":"Network","base_classes":["Data"],"category":"files_and_knowledge","template":{"input_json":{"name":"input_json","display_name":"输入 JSON","type":"str","input_types":["Data","Text"],"value":"","required":false,"info":"留空时自动读取上游 Writer 传递的 opinions_json"},"items_root":{"name":"items_root","display_name":"数据数组字段","type":"str","input_types":[],"value":"opinions","required":false},"entity_paths":{"name":"entity_paths","display_name":"实体路径","type":"str","input_types":[],"value":"[\\"relations.source_entity\\",\\"relations.target_entities[]\\"]","required":false,"info":"JSON 路径数组，支持 a.b、a.b[]、a.b[].c；[] 表示遍历数组"}},"outputs":[{"name":"aligned","display_name":"对齐结果","types":["Data"]}]}}}
              ],
              "edges": [
                {"id":"edge-loader-llm","source":"node-document-loader","target":"node-llm","sourceHandle":"text","targetHandle":"input_value"},
                {"id":"edge-prompt-llm","source":"node-prompt","target":"node-llm","sourceHandle":"prompt","targetHandle":"system_message"},
                {"id":"edge-llm-validator","source":"node-llm","target":"node-validator","sourceHandle":"response","targetHandle":"input"},
                {"id":"edge-validator-writer","source":"node-validator","target":"node-opinion-writer","sourceHandle":"output","targetHandle":"input"},
                {"id":"edge-writer-aligner","source":"node-opinion-writer","target":"node-entity-aligner","sourceHandle":"result","targetHandle":"input_json"}
              ]
            }
            """;
        try {
            jdbcTemplate.update("DELETE FROM workflow_template WHERE id = 'tpl-opinion-ingestion'");
            jdbcTemplate.update("""
                    INSERT INTO workflow_template (id, name, description, category, tags, cover_color, graph_json, system_template, is_delete)
                    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0)
                    ON CONFLICT (id) DO UPDATE SET
                      name = EXCLUDED.name,
                      description = EXCLUDED.description,
                      category = EXCLUDED.category,
                      tags = EXCLUDED.tags,
                      cover_color = EXCLUDED.cover_color,
                      graph_json = EXCLUDED.graph_json,
                      system_template = 1,
                      is_delete = 0
                    """, "tpl-opinion-ingestion", "观点入库工作流", "实体关系驱动的观点提取与落库", "knowledge", "opinion,ingestion,entity", "fuchsia", graphJson);
            log.info("观点入库工作流模板初始化完成");
        } catch (Exception e) {
            log.warn("观点入库工作流模板初始化异常: {}", e.getMessage());
        }
    }
}


