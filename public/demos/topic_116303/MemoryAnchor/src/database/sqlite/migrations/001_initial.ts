// Initial Database Schema Migration
// Creates the initial database schema based on technical design document chapter 3

import Database from 'better-sqlite3';
import type { Migration } from './index';

/**
 * 初始迁移：创建所有基础表和索引
 */
export const initialMigration: Migration = {
  version: '001',
  name: 'initial_schema',

  /**
   * 向上迁移：创建表和索引
   */
  up: (db: Database.Database) => {
    // 创建 collections 表
    db.exec(`
      CREATE TABLE IF NOT EXISTS collections (
        id TEXT PRIMARY KEY,                    -- UUID
        url TEXT NOT NULL,                      -- 原始 URL
        title TEXT NOT NULL,                    -- 文章标题
        content TEXT,                           -- 正文内容 (HTML)
        content_text TEXT,                      -- 正文内容 (纯文本)
        summary TEXT,                           -- AI 生成的摘要
        key_points TEXT,                        -- 关键要点 (JSON 数组)
        keywords TEXT,                          -- 关键词 (JSON 数组)
        tags TEXT,                              -- 标签 (JSON 数组)
        source_type TEXT NOT NULL DEFAULT 'web',-- 来源类型
        language TEXT,                          -- 语言
        author TEXT,                            -- 作者
        published_at DATETIME,                  -- 原文发布时间
        word_count INTEGER,                     -- 字数统计
        reading_time INTEGER,                   -- 阅读时间（分钟）
        status TEXT NOT NULL DEFAULT 'completed', -- 状态
        error_message TEXT,                     -- 错误信息
        scraper_engine TEXT,                    -- 使用的抓取引擎
        version_count INTEGER DEFAULT 1,        -- 版本数量
        is_read BOOLEAN DEFAULT 0,              -- 是否已读
        is_favorite BOOLEAN DEFAULT 0,          -- 是否收藏
        is_deleted BOOLEAN DEFAULT 0,           -- 是否已删除（软删除）
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        deleted_at DATETIME                     -- 删除时间
      )
    `);

    // 创建 collections 表索引
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_collections_url ON collections(url);
      CREATE INDEX IF NOT EXISTS idx_collections_source_type ON collections(source_type);
      CREATE INDEX IF NOT EXISTS idx_collections_status ON collections(status);
      CREATE INDEX IF NOT EXISTS idx_collections_created_at ON collections(created_at);
      CREATE INDEX IF NOT EXISTS idx_collections_updated_at ON collections(updated_at);
      CREATE INDEX IF NOT EXISTS idx_collections_is_deleted ON collections(is_deleted);
      CREATE INDEX IF NOT EXISTS idx_collections_is_favorite ON collections(is_favorite);
    `);

    // 创建 versions 表
    db.exec(`
      CREATE TABLE IF NOT EXISTS versions (
        id TEXT PRIMARY KEY,                    -- UUID
        collection_id TEXT NOT NULL,            -- 外键关联收藏
        version_number INTEGER NOT NULL,        -- 版本号
        title TEXT,                             -- 该版本的标题
        content TEXT,                           -- 该版本的正文内容 (HTML)
        content_text TEXT,                      -- 纯文本版本
        word_count INTEGER,                     -- 字数
        change_summary TEXT,                    -- 变化摘要
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
      )
    `);

    // 创建 versions 表索引
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_versions_collection_id ON versions(collection_id);
      CREATE INDEX IF NOT EXISTS idx_versions_version_number ON versions(collection_id, version_number);
      CREATE INDEX IF NOT EXISTS idx_versions_created_at ON versions(created_at);
    `);

    // 创建 tags 表
    db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id TEXT PRIMARY KEY,                    -- UUID
        name TEXT NOT NULL UNIQUE,              -- 标签名称
        color TEXT,                             -- 标签颜色
        collection_count INTEGER DEFAULT 0,     -- 关联收藏数量
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建 tags 表索引
    db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
    `);

    // 创建 collection_tags 表（收藏标签关联）
    db.exec(`
      CREATE TABLE IF NOT EXISTS collection_tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        collection_id TEXT NOT NULL,
        tag_id TEXT NOT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE,
        UNIQUE(collection_id, tag_id)
      )
    `);

    // 创建 collection_tags 表索引
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_collection_tags_collection_id ON collection_tags(collection_id);
      CREATE INDEX IF NOT EXISTS idx_collection_tags_tag_id ON collection_tags(tag_id);
    `);

    // 创建 scrape_tasks 表
    db.exec(`
      CREATE TABLE IF NOT EXISTS scrape_tasks (
        id TEXT PRIMARY KEY,                    -- UUID
        url TEXT NOT NULL,                      -- 目标 URL
        source_type TEXT NOT NULL DEFAULT 'web',-- 来源类型
        status TEXT NOT NULL DEFAULT 'pending', -- 状态
        priority INTEGER DEFAULT 0,             -- 优先级
        engine TEXT,                            -- 使用的抓取引擎
        retry_count INTEGER DEFAULT 0,          -- 重试次数
        max_retries INTEGER DEFAULT 3,          -- 最大重试次数
        error_message TEXT,                     -- 错误信息
        collection_id TEXT,                     -- 关联的收藏 ID
        started_at DATETIME,                    -- 开始时间
        completed_at DATETIME,                  -- 完成时间
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE SET NULL
      )
    `);

    // 创建 scrape_tasks 表索引
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_scrape_tasks_status ON scrape_tasks(status);
      CREATE INDEX IF NOT EXISTS idx_scrape_tasks_priority ON scrape_tasks(priority, created_at);
    `);

    // 创建 activity_logs 表
    db.exec(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,                   -- 操作类型
        entity_type TEXT NOT NULL,              -- 实体类型
        entity_id TEXT NOT NULL,                -- 实体 ID
        details TEXT,                           -- 操作详情 (JSON)
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建 activity_logs 表索引
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
      CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at);
    `);

    // 创建全文索引虚拟表（FTS5）
    // 索引字段：title, content_text, summary
    // 使用 unicode61 分词器支持中文
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS collections_fts USING fts5(
        title,
        content_text,
        summary,
        content='collections',
        content_rowid='rowid',
        tokenize='unicode61 remove_diacritics 2'
      )
    `);

    // 配置 FTS5 的 prefix 参数（支持前缀搜索）
    // 例如：支持搜索 "互联*" 来匹配 "互联网"
    // 注意：某些 SQLite 版本不支持此命令，作为可选优化跳过
    try {
      db.exec(`INSERT INTO collections_fts(collections_fts, rank) VALUES('prefix', 2)`);
      db.exec(`INSERT INTO collections_fts(collections_fts, rank) VALUES('prefix', 3)`);
      db.exec(`INSERT INTO collections_fts(collections_fts, rank) VALUES('prefix', 4)`);
      db.exec(`INSERT INTO collections_fts(collections_fts, rank) VALUES('prefix', 5)`);
    } catch {
      // 前缀索引配置失败时静默跳过（非关键功能）
    }

    // 创建触发器：在 collections 表插入时同步 FTS
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS collections_ai AFTER INSERT ON collections BEGIN
        INSERT INTO collections_fts(rowid, title, content_text, summary)
        VALUES(new.rowid, new.title, new.content_text, new.summary);
      END
    `);

    // 创建触发器：在 collections 表删除时同步 FTS
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS collections_ad AFTER DELETE ON collections BEGIN
        INSERT INTO collections_fts(collections_fts, rowid, title, content_text, summary)
        VALUES('delete', old.rowid, old.title, old.content_text, old.summary);
      END
    `);

    // 创建触发器：在 collections 表更新时同步 FTS
    db.exec(`
      CREATE TRIGGER IF NOT EXISTS collections_au AFTER UPDATE ON collections BEGIN
        INSERT INTO collections_fts(collections_fts, rowid, title, content_text, summary)
        VALUES('delete', old.rowid, old.title, old.content_text, old.summary);
        INSERT INTO collections_fts(rowid, title, content_text, summary)
        VALUES(new.rowid, new.title, new.content_text, new.summary);
      END
    `);
  },

  /**
   * 向下迁移：删除所有表和索引
   */
  down: (db: Database.Database) => {
    // 删除 FTS 触发器
    db.exec(`
      DROP TRIGGER IF EXISTS collections_ai;
      DROP TRIGGER IF EXISTS collections_ad;
      DROP TRIGGER IF EXISTS collections_au;
    `);

    // 删除全文索引虚拟表
    db.exec(`
      DROP TABLE IF EXISTS collections_fts;
    `);

    // 删除所有表（注意顺序，先删除有外键依赖的表）
    db.exec(`
      DROP TABLE IF EXISTS activity_logs;
      DROP TABLE IF EXISTS scrape_tasks;
      DROP TABLE IF EXISTS collection_tags;
      DROP TABLE IF EXISTS tags;
      DROP TABLE IF EXISTS versions;
      DROP TABLE IF EXISTS collections;
    `);
  },
};

export default initialMigration;