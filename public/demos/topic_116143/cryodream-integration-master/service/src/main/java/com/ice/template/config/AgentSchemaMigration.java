package com.ice.template.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Slf4j
public class AgentSchemaMigration implements CommandLineRunner {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        try {
            String createTableSql = """
                CREATE TABLE IF NOT EXISTS agent (
                    id VARCHAR(64) PRIMARY KEY,
                    name VARCHAR(128) NOT NULL,
                    description TEXT,
                    avatar VARCHAR(512),
                    status VARCHAR(32) DEFAULT 'active',
                    project_id VARCHAR(64),
                    workflow_id VARCHAR(64),
                    knowledge_base_id VARCHAR(64),
                    model_config_id VARCHAR(64),
                    core_memory TEXT,
                    create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_used_time TIMESTAMP,
                    is_delete INTEGER DEFAULT 0
                )
                """;
            jdbcTemplate.execute(createTableSql);
            
            // 添加 project_id 字段（如果不存在）
            try {
                jdbcTemplate.execute("ALTER TABLE agent ADD COLUMN IF NOT EXISTS project_id VARCHAR(64)");
            } catch (Exception e) {
                // 字段可能已存在，忽略错误
            }
            
            log.info("[AgentSchemaMigration] agent 表已就绪");
            
            insertDefaultAgents();
        } catch (Exception e) {
            log.error("[AgentSchemaMigration] 创建 agent 表失败", e);
        }
    }
    
    private void insertDefaultAgents() {
        try {
            // 清空旧数据（用于更新默认智能体）
            jdbcTemplate.execute("DELETE FROM agent");
            
            String coreMemory1 = "{\"name\":\"数据分析助手\",\"description\":\"专业的数据分析师，擅长处理和分析各类数据\",\"role\":\"数据分析专家\",\"instructions\":\"你是一个专业的数据分析助手，能够帮助用户分析数据、生成报告和提供洞察。\",\"personality\":\"严谨、专业、耐心\",\"constraints\":[\"只分析提供的数据\",\"保持客观中立\",\"保护数据隐私\"]}";
            String insertSql1 = "INSERT INTO agent (id, name, description, status, core_memory) VALUES (?, ?, ?, ?, ?)";
            jdbcTemplate.update(insertSql1, UUID.randomUUID().toString(), "数据分析助手", "基于工作流的数据分析智能体，帮助用户分析和处理数据", "active", coreMemory1);
            
            String coreMemory2 = "{\"name\":\"文案创作专家\",\"description\":\"资深文案策划师，擅长创作各类文案内容\",\"role\":\"文案策划专家\",\"instructions\":\"你是一个专业的文案创作专家，能够帮助用户撰写营销文案、产品描述和创意内容。\",\"personality\":\"创意丰富、语言优美、善于沟通\",\"constraints\":[\"保持原创性\",\"遵守广告法规\",\"符合品牌调性\"]}";
            String insertSql2 = "INSERT INTO agent (id, name, description, status, core_memory) VALUES (?, ?, ?, ?, ?)";
            jdbcTemplate.update(insertSql2, UUID.randomUUID().toString(), "文案创作专家", "智能文案生成助手，支持多种文案类型创作", "active", coreMemory2);
            
            String coreMemory3 = "{\"name\":\"z-image 文生图提示词大师\",\"description\":\"专业的AI绘画提示词专家，精通各种绘画风格和技巧描述\",\"role\":\"文生图提示词专家\",\"instructions\":\"你是一个专业的AI绘画提示词大师，擅长帮助用户创作高质量的文生图提示词。你的任务是根据用户的描述，生成详细、专业的AI绘画提示词，包括：主体描述、风格和艺术流派、光线和氛围、构图和视角、色彩和质感、细节和特效。\",\"personality\":\"创意无限、专业细致、善于表达\",\"constraints\":[\"生成的提示词要具体详细\",\"使用专业的艺术术语\",\"保持提示词的多样性\",\"避免使用模糊描述\"]}";
            String insertSql3 = "INSERT INTO agent (id, name, description, status, core_memory) VALUES (?, ?, ?, ?, ?)";
            jdbcTemplate.update(insertSql3, UUID.randomUUID().toString(), "z-image 文生图提示词大师", "专业的AI绘画提示词生成助手，帮助你创作出高质量的文生图提示词", "active", coreMemory3);
            
            log.info("[AgentSchemaMigration] 默认智能体数据已插入");
        } catch (Exception e) {
            log.error("[AgentSchemaMigration] 插入默认智能体数据失败", e);
        }
    }
}