package com.ice.template.config;

import java.sql.Connection;
import java.sql.Statement;
import javax.annotation.Resource;
import javax.sql.DataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * 日记模块 - 建表迁移
 * 包含 2 张表：diary（日记主表）、diary_category（分类表）
 */
@Component
@Order(20)
public class DiarySchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DiarySchemaMigration.class);

    @Resource
    private DataSource dataSource;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
            // 日记主表
            stmt.execute("CREATE TABLE IF NOT EXISTS diary ("
                    + "id VARCHAR(64) PRIMARY KEY, "
                    + "user_id VARCHAR(64), "
                    + "title VARCHAR(200), "
                    + "content TEXT, "
                    + "summary VARCHAR(500), "
                    + "category VARCHAR(50), "
                    + "mood VARCHAR(20) DEFAULT 'calm', "
                    + "mood_score INT DEFAULT 0, "
                    + "audio_url VARCHAR(500), "
                    + "audio_duration_sec INT DEFAULT 0, "
                    + "word_count INT DEFAULT 0, "
                    + "ai_analysis_status VARCHAR(20) DEFAULT 'pending', "
                    + "ai_raw_response TEXT, "
                    + "diary_date DATE, "
                    + "is_delete INT DEFAULT 0, "
                    + "create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "
                    + "update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                    + ")");
            safeExec(stmt, "CREATE INDEX IF NOT EXISTS idx_diary_user_date ON diary(user_id, diary_date DESC)");
            safeExec(stmt, "CREATE INDEX IF NOT EXISTS idx_diary_user_category ON diary(user_id, category)");
            safeExec(stmt, "CREATE INDEX IF NOT EXISTS idx_diary_user_mood ON diary(user_id, mood)");

            // 日记分类表
            stmt.execute("CREATE TABLE IF NOT EXISTS diary_category ("
                    + "id VARCHAR(64) PRIMARY KEY, "
                    + "user_id VARCHAR(64) DEFAULT 'SYSTEM', "
                    + "name VARCHAR(30) NOT NULL, "
                    + "color VARCHAR(20) DEFAULT 'blue', "
                    + "icon VARCHAR(30) DEFAULT 'Circle', "
                    + "sort INT DEFAULT 0, "
                    + "is_preset INT DEFAULT 0, "
                    + "is_delete INT DEFAULT 0, "
                    + "create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "
                    + "update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                    + ")");

            // 新增 short_summary 列（兼容已有表）
            safeExec(stmt, "ALTER TABLE diary ADD COLUMN IF NOT EXISTS short_summary VARCHAR(60)");

            // 插入 7 条预设分类（仅首次）
            insertPresetCategories(stmt);

            // 里程碑表
            stmt.execute("CREATE TABLE IF NOT EXISTS diary_milestone ("
                    + "id VARCHAR(64) PRIMARY KEY, "
                    + "user_id VARCHAR(64), "
                    + "title VARCHAR(100) NOT NULL, "
                    + "description TEXT, "
                    + "target_date DATE, "
                    + "achieved_date DATE, "
                    + "status VARCHAR(20) DEFAULT 'active', "
                    + "linked_diary_id VARCHAR(64), "
                    + "color VARCHAR(20) DEFAULT 'blue', "
                    + "sort INT DEFAULT 0, "
                    + "is_delete INT DEFAULT 0, "
                    + "create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "
                    + "update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                    + ")");
            safeExec(stmt, "CREATE INDEX IF NOT EXISTS idx_milestone_user_status ON diary_milestone(user_id, status)");

            log.info("[DiarySchemaMigration] 日记模块 3 张表已就绪");
        } catch (Exception e) {
            log.warn("[DiarySchemaMigration] 建表失败（可能已存在）：{}", e.getMessage());
        }
    }

    private void insertPresetCategories(Statement stmt) {
        String[][] presets = {
            {"work", "工作", "blue", "Briefcase"},
            {"study", "学习", "indigo", "GraduationCap"},
            {"life", "生活", "green", "Coffee"},
            {"emotion", "情感", "pink", "Heart"},
            {"health", "健康", "teal", "Activity"},
            {"inspiration", "灵感", "amber", "Lightbulb"},
            {"review", "复盘", "purple", "ClipboardCheck"}
        };
        for (int i = 0; i < presets.length; i++) {
            String id = presets[i][0];
            String name = presets[i][1];
            String color = presets[i][2];
            String icon = presets[i][3];
            safeExec(stmt, "INSERT INTO diary_category (id, user_id, name, color, icon, sort, is_preset) "
                    + "SELECT '" + id + "', 'SYSTEM', '" + name + "', '" + color + "', '" + icon + "', " + i + ", 1 "
                    + "WHERE NOT EXISTS (SELECT 1 FROM diary_category WHERE id = '" + id + "')");
        }
    }

    private void safeExec(Statement stmt, String sql) {
        try {
            stmt.execute(sql);
        } catch (Exception e) {
            log.debug("[DiarySchemaMigration] {} 已存在或执行失败：{}", sql, e.getMessage());
        }
    }
}
