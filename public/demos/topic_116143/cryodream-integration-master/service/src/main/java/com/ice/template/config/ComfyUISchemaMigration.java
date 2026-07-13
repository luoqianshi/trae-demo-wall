package com.ice.template.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * ComfyUI 模块建表迁移：应用启动时幂等创建 comfyui_workflow 表。
 */
@Slf4j
@Component
@Order(30)
public class ComfyUISchemaMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public ComfyUISchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS comfyui_workflow (
                        id VARCHAR(36) PRIMARY KEY,
                        name VARCHAR(256) NOT NULL,
                        description VARCHAR(1024),
                        source_path VARCHAR(1024),
                        output_type VARCHAR(20) DEFAULT 'image',
                        output_slots TEXT,
                        graph_json TEXT,
                        param_schema TEXT,
                        param_values TEXT,
                        create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        is_delete SMALLINT DEFAULT 0
                    )
                    """);
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_comfyui_workflow_name ON comfyui_workflow(name)");
            // 增量兼容：老库没有 output_slots 列时补上（H2 支持 IF NOT EXISTS，其它库 catch 忽略）
            try {
                jdbcTemplate.execute("ALTER TABLE comfyui_workflow ADD COLUMN IF NOT EXISTS output_slots TEXT");
            } catch (Exception ignore) {
                try {
                    jdbcTemplate.execute("ALTER TABLE comfyui_workflow ADD COLUMN output_slots TEXT");
                } catch (Exception ignore2) {
                    // 列已存在，跳过
                }
            }
            log.info("[ComfyUISchemaMigration] comfyui_workflow 表已就绪");

            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS comfyui_project (
                        id VARCHAR(36) PRIMARY KEY,
                        name VARCHAR(256) NOT NULL,
                        description VARCHAR(1024),
                        graph_json TEXT,
                        create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        is_delete SMALLINT DEFAULT 0
                    )
                    """);
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_comfyui_project_name ON comfyui_project(name)");
            log.info("[ComfyUISchemaMigration] comfyui_project 表已就绪");
        } catch (Exception e) {
            log.warn("[ComfyUISchemaMigration] comfyui 建表跳过: {}", e.getMessage());
        }
    }
}
