//! 数据库表结构定义与初始化

use rusqlite::Connection;

/// 创建所有数据库表
pub fn create_tables(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch(
        "
        -- 文件元数据表
        CREATE TABLE IF NOT EXISTS file_metadata (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            path TEXT NOT NULL UNIQUE,
            md5_hash TEXT NOT NULL,
            sha256_hash TEXT NOT NULL,
            file_size BIGINT NOT NULL,
            mime_type TEXT,
            created_at TEXT NOT NULL,
            modified_at TEXT NOT NULL,
            is_deleted INTEGER DEFAULT 0,
            deleted_at TEXT
        );

        -- 虚拟目录表
        CREATE TABLE IF NOT EXISTS virtual_directories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            parent_id INTEGER REFERENCES virtual_directories(id),
            ai_generated INTEGER DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- 虚拟目录-文件映射表
        CREATE TABLE IF NOT EXISTS virtual_dir_files (
            virtual_dir_id INTEGER NOT NULL REFERENCES virtual_directories(id),
            file_id INTEGER NOT NULL REFERENCES file_metadata(id),
            added_at TEXT NOT NULL DEFAULT (datetime('now')),
            PRIMARY KEY (virtual_dir_id, file_id)
        );

        -- 删除记录表
        CREATE TABLE IF NOT EXISTS deletion_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_id INTEGER NOT NULL REFERENCES file_metadata(id),
            file_path TEXT NOT NULL,
            md5_hash TEXT NOT NULL,
            sha256_hash TEXT NOT NULL,
            file_size BIGINT NOT NULL,
            deleted_at TEXT NOT NULL,
            reason TEXT,
            is_physical_deleted INTEGER DEFAULT 0,
            physical_deleted_at TEXT
        );

        -- 删除队列表
        CREATE TABLE IF NOT EXISTS delete_queue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            record_id INTEGER NOT NULL REFERENCES deletion_records(id),
            status TEXT NOT NULL DEFAULT 'pending',
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            processed_at TEXT
        );

        -- 标签表
        CREATE TABLE IF NOT EXISTS tags (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            color TEXT NOT NULL DEFAULT '#4fc3f7',
            created_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        -- 文件-标签关联表
        CREATE TABLE IF NOT EXISTS file_tags (
            file_id INTEGER NOT NULL REFERENCES file_metadata(id) ON DELETE CASCADE,
            tag_id INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
            added_at TEXT NOT NULL DEFAULT (datetime('now')),
            PRIMARY KEY (file_id, tag_id)
        );

        -- 最近文件表
        CREATE TABLE IF NOT EXISTS recent_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_id INTEGER NOT NULL REFERENCES file_metadata(id) ON DELETE CASCADE,
            accessed_at TEXT NOT NULL DEFAULT (datetime('now')),
            action_type TEXT NOT NULL DEFAULT 'preview'
        );

        -- 索引
        CREATE INDEX IF NOT EXISTS idx_file_metadata_md5 ON file_metadata(md5_hash);
        CREATE INDEX IF NOT EXISTS idx_file_metadata_sha256 ON file_metadata(sha256_hash);
        CREATE INDEX IF NOT EXISTS idx_file_metadata_path ON file_metadata(path);
        CREATE INDEX IF NOT EXISTS idx_deletion_records_md5 ON deletion_records(md5_hash);
        CREATE INDEX IF NOT EXISTS idx_deletion_records_sha256 ON deletion_records(sha256_hash);
        CREATE INDEX IF NOT EXISTS idx_virtual_dir_files_dir ON virtual_dir_files(virtual_dir_id);
        CREATE INDEX IF NOT EXISTS idx_file_tags_file ON file_tags(file_id);
        CREATE INDEX IF NOT EXISTS idx_file_tags_tag ON file_tags(tag_id);
        CREATE INDEX IF NOT EXISTS idx_recent_files_time ON recent_files(accessed_at DESC);
        ",
    )?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    #[test]
    fn test_create_tables() {
        let conn = Connection::open_in_memory().unwrap();
        create_tables(&conn).unwrap();

        // 验证表是否存在
        let tables: Vec<String> = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
            .unwrap()
            .query_map([], |row| row.get(0))
            .unwrap()
            .filter_map(|r| r.ok())
            .collect();

        assert!(tables.contains(&"file_metadata".to_string()));
        assert!(tables.contains(&"virtual_directories".to_string()));
        assert!(tables.contains(&"virtual_dir_files".to_string()));
        assert!(tables.contains(&"deletion_records".to_string()));
        assert!(tables.contains(&"delete_queue".to_string()));
    }

    #[test]
    fn test_create_tables_idempotent() {
        let conn = Connection::open_in_memory().unwrap();
        // 多次创建应不会报错
        create_tables(&conn).unwrap();
        create_tables(&conn).unwrap();
        create_tables(&conn).unwrap();

        // 只统计用户自定义表（排除 sqlite_sequence 等系统表）
        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(count, 8);
    }

    #[test]
    fn test_indexes_created() {
        let conn = Connection::open_in_memory().unwrap();
        create_tables(&conn).unwrap();

        let indexes: Vec<String> = conn
            .prepare(
                "SELECT name FROM sqlite_master WHERE type='index' AND name LIKE 'idx_%' ORDER BY name",
            )
            .unwrap()
            .query_map([], |row| row.get(0))
            .unwrap()
            .filter_map(|r| r.ok())
            .collect();

        assert!(indexes.contains(&"idx_file_metadata_md5".to_string()));
        assert!(indexes.contains(&"idx_file_metadata_sha256".to_string()));
        assert!(indexes.contains(&"idx_file_metadata_path".to_string()));
    }
}