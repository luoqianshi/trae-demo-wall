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

/**
 * 小说创作模块 - 建表迁移
 * 包含 7 张表：novel、novel_outline、novel_character、novel_relation、novel_setting、
 * novel_character_snapshot（人物属性快照）、novel_timeline_event（时间线事件）
 */
@Component
public class NovelSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(NovelSchemaMigration.class);

    @Resource
    private DataSource dataSource;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
            // 小说主表
            stmt.execute("CREATE TABLE IF NOT EXISTS novel ("
                    + "id VARCHAR(64) PRIMARY KEY, "
                    + "title VARCHAR(200) NOT NULL, "
                    + "summary TEXT, "
                    + "cover_url VARCHAR(500), "
                    + "genre VARCHAR(100), "
                    + "tags VARCHAR(500), "
                    + "word_count INT DEFAULT 0, "
                    + "status VARCHAR(20) DEFAULT 'writing', "
                    + "is_delete INT DEFAULT 0, "
                    + "create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "
                    + "update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                    + ")");

            // 大纲/章节
            stmt.execute("CREATE TABLE IF NOT EXISTS novel_outline ("
                    + "id VARCHAR(64) PRIMARY KEY, "
                    + "novel_id VARCHAR(64) NOT NULL, "
                    + "parent_id VARCHAR(64), "
                    + "level SMALLINT NOT NULL, "
                    + "title VARCHAR(200) NOT NULL, "
                    + "summary VARCHAR(1000), "
                    + "content TEXT, "
                    + "sort_order INT DEFAULT 0, "
                    + "word_count INT DEFAULT 0, "
                    + "is_delete INT DEFAULT 0, "
                    + "create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "
                    + "update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                    + ")");
            safeExec(stmt, "CREATE INDEX IF NOT EXISTS idx_novel_outline_novel_parent ON novel_outline(novel_id, parent_id, sort_order)");

            // 人物
            stmt.execute("CREATE TABLE IF NOT EXISTS novel_character ("
                    + "id VARCHAR(64) PRIMARY KEY, "
                    + "novel_id VARCHAR(64) NOT NULL, "
                    + "name VARCHAR(100) NOT NULL, "
                    + "alias VARCHAR(200), "
                    + "avatar_url VARCHAR(500), "
                    + "identity VARCHAR(200), "
                    + "personality TEXT, "
                    + "background TEXT, "
                    + "appearance TEXT, "
                    + "catchphrase VARCHAR(500), "
                    + "remark TEXT, "
                    + "chapter_ids TEXT, "
                    + "canvas_pos VARCHAR(50), "
                    + "attributes TEXT, "
                    + "is_delete INT DEFAULT 0, "
                    + "create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "
                    + "update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                    + ")");
            safeExec(stmt, "CREATE INDEX IF NOT EXISTS idx_novel_character_novel ON novel_character(novel_id)");
            // 老表升级：新增 attributes 字段
            safeExec(stmt, "ALTER TABLE novel_character ADD COLUMN IF NOT EXISTS attributes TEXT");

            // 人物关系
            stmt.execute("CREATE TABLE IF NOT EXISTS novel_relation ("
                    + "id VARCHAR(64) PRIMARY KEY, "
                    + "novel_id VARCHAR(64) NOT NULL, "
                    + "source_id VARCHAR(64) NOT NULL, "
                    + "target_id VARCHAR(64) NOT NULL, "
                    + "relation_type VARCHAR(50) NOT NULL, "
                    + "description VARCHAR(500), "
                    + "is_delete INT DEFAULT 0, "
                    + "create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                    + ")");
            safeExec(stmt, "CREATE INDEX IF NOT EXISTS idx_novel_relation_novel_source ON novel_relation(novel_id, source_id)");

            // 世界观设定
            stmt.execute("CREATE TABLE IF NOT EXISTS novel_setting ("
                    + "id VARCHAR(64) PRIMARY KEY, "
                    + "novel_id VARCHAR(64) NOT NULL, "
                    + "category VARCHAR(50) NOT NULL, "
                    + "name VARCHAR(200) NOT NULL, "
                    + "brief VARCHAR(500), "
                    + "content TEXT, "
                    + "is_delete INT DEFAULT 0, "
                    + "create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "
                    + "update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                    + ")");
            safeExec(stmt, "CREATE INDEX IF NOT EXISTS idx_novel_setting_novel_category ON novel_setting(novel_id, category)");

            // 人物属性快照
            stmt.execute("CREATE TABLE IF NOT EXISTS novel_character_snapshot ("
                    + "id VARCHAR(64) PRIMARY KEY, "
                    + "novel_id VARCHAR(64) NOT NULL, "
                    + "character_id VARCHAR(64) NOT NULL, "
                    + "event_id VARCHAR(64), "
                    + "label VARCHAR(200) NOT NULL, "
                    + "attributes TEXT, "
                    + "note VARCHAR(1000), "
                    + "sort_order INT DEFAULT 0, "
                    + "is_delete INT DEFAULT 0, "
                    + "create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "
                    + "update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                    + ")");
            safeExec(stmt, "CREATE INDEX IF NOT EXISTS idx_novel_snapshot_character ON novel_character_snapshot(novel_id, character_id, sort_order)");
            safeExec(stmt, "CREATE INDEX IF NOT EXISTS idx_novel_snapshot_event ON novel_character_snapshot(event_id)");

            // 时间线事件
            stmt.execute("CREATE TABLE IF NOT EXISTS novel_timeline_event ("
                    + "id VARCHAR(64) PRIMARY KEY, "
                    + "novel_id VARCHAR(64) NOT NULL, "
                    + "title VARCHAR(200) NOT NULL, "
                    + "description TEXT, "
                    + "time_label VARCHAR(100), "
                    + "sort_order INT DEFAULT 0, "
                    + "chapter_id VARCHAR(64), "
                    + "character_ids TEXT, "
                    + "importance SMALLINT DEFAULT 1, "
                    + "color VARCHAR(20), "
                    + "is_delete INT DEFAULT 0, "
                    + "create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "
                    + "update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                    + ")");
            safeExec(stmt, "CREATE INDEX IF NOT EXISTS idx_novel_timeline_novel_order ON novel_timeline_event(novel_id, sort_order)");

            log.info("[NovelSchemaMigration] 小说模块 7 张表已就绪");
        } catch (Exception e) {
            log.warn("[NovelSchemaMigration] 建表失败（可能已存在）：{}", e.getMessage());
        }
    }

    private void safeExec(Statement stmt, String sql) {
        try {
            stmt.execute(sql);
        } catch (Exception e) {
            log.debug("[NovelSchemaMigration] {} 已存在或建索引失败：{}", sql, e.getMessage());
        }
    }
}
