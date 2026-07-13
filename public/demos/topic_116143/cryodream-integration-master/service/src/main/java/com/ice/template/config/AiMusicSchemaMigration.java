package com.ice.template.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import javax.annotation.Resource;
import javax.sql.DataSource;
import org.apache.commons.lang3.StringUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class AiMusicSchemaMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AiMusicSchemaMigration.class);
    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Resource
    private DataSource dataSource;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        try (Connection conn = dataSource.getConnection(); Statement stmt = conn.createStatement()) {
            stmt.execute("CREATE TABLE IF NOT EXISTS ai_music_project ("
                    + "id VARCHAR(64) PRIMARY KEY, "
                    + "title VARCHAR(128) NOT NULL, "
                    + "description VARCHAR(1024), "
                    + "style VARCHAR(64), "
                    + "mood VARCHAR(64), "
                    + "language VARCHAR(64), "
                    + "status VARCHAR(32) DEFAULT 'draft', "
                    + "lyric_workflow_id VARCHAR(64), "
                    + "music_workflow_id VARCHAR(64), "
                    + "current_lyric TEXT, "
                    + "is_delete INT DEFAULT 0, "
                    + "create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "
                    + "update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                    + ")");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_ai_music_project_status ON ai_music_project(status)");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_ai_music_project_update_time ON ai_music_project(update_time)");
            stmt.execute("ALTER TABLE ai_music_project ADD COLUMN IF NOT EXISTS current_lyric TEXT");
            stmt.execute("ALTER TABLE ai_music_project ADD COLUMN IF NOT EXISTS lyric_workflow_id VARCHAR(64)");
            stmt.execute("ALTER TABLE ai_music_project ADD COLUMN IF NOT EXISTS music_workflow_id VARCHAR(64)");
            stmt.execute("CREATE TABLE IF NOT EXISTS ai_music_lyric_version ("
                    + "id VARCHAR(64) PRIMARY KEY, "
                    + "project_id VARCHAR(64) NOT NULL, "
                    + "name VARCHAR(32) NOT NULL, "
                    + "title VARCHAR(128), "
                    + "color VARCHAR(64), "
                    + "summary VARCHAR(512), "
                    + "content TEXT NOT NULL, "
                    + "version_no VARCHAR(32) NOT NULL, "
                    + "is_delete INT DEFAULT 0, "
                    + "create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "
                    + "update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                    + ")");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_ai_music_lyric_version_project_id ON ai_music_lyric_version(project_id)");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_ai_music_lyric_version_version_no ON ai_music_lyric_version(version_no)");
            try {
                stmt.execute("ALTER TABLE ai_music_lyric_version ALTER COLUMN version_no TYPE VARCHAR(32)");
            } catch (Exception ignored) {
            }

            // 迁移：project.current_lyric 存 JSON 行结构；version.content 存纯文本
            migrateLyricStorage(conn);

            // 音频生成记录表
            stmt.execute("CREATE TABLE IF NOT EXISTS ai_music_audio ("
                    + "id VARCHAR(64) PRIMARY KEY, "
                    + "project_id VARCHAR(64) NOT NULL, "
                    + "audio_url VARCHAR(1024) NOT NULL, "
                    + "title VARCHAR(128), "
                    + "duration_seconds INT, "
                    + "style_tags VARCHAR(512), "
                    + "lyrics_summary VARCHAR(1024), "
                    + "param_snapshot TEXT, "
                    + "is_delete INT DEFAULT 0, "
                    + "create_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "
                    + "update_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP"
                    + ")");
            stmt.execute("CREATE INDEX IF NOT EXISTS idx_ai_music_audio_project_id ON ai_music_audio(project_id)");

            log.info("[AiMusicSchemaMigration] ai_music_project 与 ai_music_lyric_version 表已就绪");
        } catch (Exception e) {
            log.warn("[AiMusicSchemaMigration] 建表失败（可能已存在）：{}", e.getMessage());
        }
    }

    /**
     * 歌词存储格式迁移：
     * - project.current_lyric → JSON 行结构 {"lines":[{"id":1,"text":"..."},...]}（给 LyricCanvas 用）
     * - version.content → 纯文本（给 diff 对比用），若已有 JSON 则转回纯文本
     */
    private void migrateLyricStorage(Connection conn) {
        try (Statement stmt = conn.createStatement()) {
            // 1. project.current_lyric：纯文本 → JSON
            ResultSet rs = stmt.executeQuery("SELECT id, current_lyric FROM ai_music_project WHERE current_lyric IS NOT NULL AND is_delete = 0");
            List<String[]> updates = new ArrayList<>();
            while (rs.next()) {
                String id = rs.getString("id");
                String lyric = rs.getString("current_lyric");
                if (StringUtils.isBlank(lyric) || lyric.trim().startsWith("{")) continue;
                String json = plainTextToLyricJson(lyric);
                updates.add(new String[]{id, json});
            }
            rs.close();
            for (String[] u : updates) {
                try (Statement us = conn.createStatement()) {
                    String escaped = u[1].replace("'", "''");
                    us.execute("UPDATE ai_music_project SET current_lyric = '" + escaped + "' WHERE id = '" + u[0] + "'");
                }
            }
            if (!updates.isEmpty()) {
                log.info("[AiMusicSchemaMigration] 已迁移 {} 条 ai_music_project.current_lyric 到 JSON 格式", updates.size());
            }

            // 2. version.content：JSON → 纯文本（回滚之前的错误迁移）
            rs = stmt.executeQuery("SELECT id, content FROM ai_music_lyric_version WHERE content IS NOT NULL AND is_delete = 0");
            updates.clear();
            while (rs.next()) {
                String id = rs.getString("id");
                String content = rs.getString("content");
                if (StringUtils.isBlank(content) || !content.trim().startsWith("{")) continue;
                String plainText = jsonLyricToPlainText(content);
                if (plainText != null) {
                    updates.add(new String[]{id, plainText});
                }
            }
            rs.close();
            for (String[] u : updates) {
                try (Statement us = conn.createStatement()) {
                    String escaped = u[1].replace("'", "''");
                    us.execute("UPDATE ai_music_lyric_version SET content = '" + escaped + "' WHERE id = '" + u[0] + "'");
                }
            }
            if (!updates.isEmpty()) {
                log.info("[AiMusicSchemaMigration] 已回滚 {} 条 ai_music_lyric_version.content 到纯文本格式", updates.size());
            }
        } catch (Exception e) {
            log.warn("[AiMusicSchemaMigration] 歌词存储迁移失败：{}", e.getMessage());
        }
    }

    /**
     * 将 JSON 行结构 {"lines":[{"id":1,"text":"..."},...]} 转回纯文本
     */
    @SuppressWarnings("unchecked")
    private String jsonLyricToPlainText(String json) {
        try {
            Map<String, Object> data = OBJECT_MAPPER.readValue(json, Map.class);
            List<Map<String, Object>> lines = (List<Map<String, Object>>) data.get("lines");
            if (lines == null) return null;
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < lines.size(); i++) {
                if (i > 0) sb.append("\n");
                sb.append(String.valueOf(lines.get(i).getOrDefault("text", "")));
            }
            return sb.toString();
        } catch (Exception e) {
            return null;
        }
    }

    private String plainTextToLyricJson(String text) throws Exception {
        String[] lines = text.split("\n", -1);
        List<Map<String, Object>> lineList = new ArrayList<>();
        for (int i = 0; i < lines.length; i++) {
            Map<String, Object> line = new LinkedHashMap<>();
            line.put("id", i + 1);
            line.put("text", lines[i]);
            lineList.add(line);
        }
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("lines", lineList);
        return OBJECT_MAPPER.writeValueAsString(data);
    }
}
