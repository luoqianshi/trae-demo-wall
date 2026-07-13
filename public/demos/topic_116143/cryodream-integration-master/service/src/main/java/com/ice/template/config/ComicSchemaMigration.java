package com.ice.template.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * 漫画模块建表迁移：应用启动时幂等创建 comic_project 表。
 */
@Slf4j
@Component
@Order(31)
public class ComicSchemaMigration implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    public ComicSchemaMigration(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        try {
            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS comic_project (
                        id VARCHAR(36) PRIMARY KEY,
                        name VARCHAR(256) NOT NULL,
                        description VARCHAR(1024),
                        canvas_width INT DEFAULT 1200,
                        canvas_height INT DEFAULT 1600,
                        comic_data TEXT,
                        thumbnail_url VARCHAR(1024),
                        source_comfyui_project_id VARCHAR(36),
                        create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                        is_delete SMALLINT DEFAULT 0
                    )
                    """);
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_comic_project_name ON comic_project(name)");
            jdbcTemplate.execute("CREATE INDEX IF NOT EXISTS idx_comic_project_source ON comic_project(source_comfyui_project_id)");
            log.info("[ComicSchemaMigration] comic_project 表已就绪");
        } catch (Exception e) {
            log.warn("[ComicSchemaMigration] 建表跳过: {}", e.getMessage());
        }
    }
}
