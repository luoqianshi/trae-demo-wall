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
public class DocumentSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DocumentSchemaMigration.class);

    @Resource
    private DataSource dataSource;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
            stmt.execute("CREATE TABLE IF NOT EXISTS document ("
                    + "id VARCHAR(64) PRIMARY KEY, "
                    + "project_id VARCHAR(64) NOT NULL, "
                    + "title VARCHAR(200) NOT NULL, "
                    + "content TEXT, "
                    + "format VARCHAR(20) DEFAULT 'markdown', "
                    + "tags VARCHAR(500), "
                    + "status VARCHAR(20) DEFAULT 'draft', "
                    + "is_delete INT DEFAULT 0, "
                    + "create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "
                    + "update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                    + ")");
            log.info("[DocumentSchemaMigration] document 表已就绪");
        } catch (Exception e) {
            log.warn("[DocumentSchemaMigration] 建表失败（可能已存在）：{}", e.getMessage());
        }
    }
}
