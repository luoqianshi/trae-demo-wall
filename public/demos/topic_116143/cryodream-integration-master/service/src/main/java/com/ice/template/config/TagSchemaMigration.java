package com.ice.template.config;

import java.sql.Connection;
import java.sql.Statement;
import javax.annotation.Resource;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class TagSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(TagSchemaMigration.class);

    @Resource
    private DataSource dataSource;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
            stmt.execute("CREATE TABLE IF NOT EXISTS tag_category ("
                    + "id VARCHAR(64) PRIMARY KEY, "
                    + "name VARCHAR(100) NOT NULL, "
                    + "color VARCHAR(20) DEFAULT 'gray', "
                    + "sort INT DEFAULT 0, "
                    + "description VARCHAR(500), "
                    + "is_delete INT DEFAULT 0, "
                    + "create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "
                    + "update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                    + ")");
            log.info("[TagSchemaMigration] tag_category 表已就绪");

            stmt.execute("CREATE TABLE IF NOT EXISTS tag ("
                    + "id VARCHAR(64) PRIMARY KEY, "
                    + "category_id VARCHAR(64), "
                    + "name VARCHAR(100) NOT NULL, "
                    + "color VARCHAR(20) DEFAULT 'gray', "
                    + "sort INT DEFAULT 0, "
                    + "is_delete INT DEFAULT 0, "
                    + "create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "
                    + "update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                    + ")");
            log.info("[TagSchemaMigration] tag 表已就绪");

            stmt.execute("CREATE TABLE IF NOT EXISTS tag_relation ("
                    + "id VARCHAR(64) PRIMARY KEY, "
                    + "tag_id VARCHAR(64) NOT NULL, "
                    + "target_type VARCHAR(50) NOT NULL, "
                    + "target_id VARCHAR(64) NOT NULL, "
                    + "is_delete INT DEFAULT 0, "
                    + "create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                    + ")");
            log.info("[TagSchemaMigration] tag_relation 表已就绪");

            // 索引
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_tag_category ON tag(category_id)");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_tag_relation_target ON tag_relation(target_type, target_id)");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_tag_relation_tag ON tag_relation(tag_id)");
            log.info("[TagSchemaMigration] 索引已就绪");
        } catch (Exception e) {
            log.warn("[TagSchemaMigration] 建表失败（可能已存在）：{}", e.getMessage());
        }
    }
}
