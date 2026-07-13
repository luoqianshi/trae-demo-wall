package com.ice.template.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 研判生成系统建表迁移：应用启动时幂等创建 analysis_history 表。
 */
@Slf4j
@Component
@Order(20)
public class GenerationSchemaMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public GenerationSchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS analysis_history (
                        id VARCHAR(36) PRIMARY KEY,
                        kb_id VARCHAR(36) NOT NULL,
                        user_query TEXT NOT NULL,
                        rewritten_query JSONB,
                        retrieved_count INT DEFAULT 0,
                        analysis_result TEXT,
                        citations JSONB,
                        elapsed_ms BIGINT DEFAULT 0,
                        create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        is_delete SMALLINT DEFAULT 0
                    )
                    """);
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_analysis_history_kb_id ON analysis_history(kb_id)");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_analysis_history_create_time ON analysis_history(create_time)");
            log.info("[GenerationSchemaMigration] analysis_history 表已就绪");
        } catch (Exception e) {
            log.warn("[GenerationSchemaMigration] analysis_history 建表跳过: {}", e.getMessage());
        }
    }
}
