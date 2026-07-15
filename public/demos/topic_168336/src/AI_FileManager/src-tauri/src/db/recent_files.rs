//! 最近文件管理模块
//! 记录和查询最近访问的文件

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

/// 最近文件记录
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentFileEntry {
    pub id: i64,
    pub file_id: i64,
    pub accessed_at: String,
    pub action_type: String,
    pub file_path: String,
    pub file_size: i64,
    pub mime_type: Option<String>,
}

/// 记录文件访问
pub fn record_access(
    conn: &Connection,
    file_id: i64,
    action_type: &str,
) -> Result<(), String> {
    // 删除旧记录（只保留最近 100 条）
    conn.execute(
        "DELETE FROM recent_files WHERE id NOT IN (
            SELECT id FROM recent_files ORDER BY accessed_at DESC LIMIT 100
        )",
        [],
    )
    .map_err(|e| format!("清理旧记录失败: {}", e))?;

    conn.execute(
        "INSERT INTO recent_files (file_id, action_type) VALUES (?1, ?2)",
        params![file_id, action_type],
    )
    .map_err(|e| format!("记录访问失败: {}", e))?;

    Ok(())
}

/// 获取最近文件列表
pub fn get_recent_files(conn: &Connection, limit: usize) -> Result<Vec<RecentFileEntry>, String> {
    let limit = limit.min(100);
    let mut stmt = conn
        .prepare(
            "SELECT r.id, r.file_id, r.accessed_at, r.action_type,
                    f.path, f.file_size, f.mime_type
             FROM recent_files r
             INNER JOIN file_metadata f ON r.file_id = f.id
             WHERE f.is_deleted = 0
             ORDER BY r.accessed_at DESC
             LIMIT ?1",
        )
        .map_err(|e| format!("查询最近文件失败: {}", e))?;

    let entries = stmt
        .query_map(params![limit as i64], |row| {
            Ok(RecentFileEntry {
                id: row.get(0)?,
                file_id: row.get(1)?,
                accessed_at: row.get(2)?,
                action_type: row.get(3)?,
                file_path: row.get(4)?,
                file_size: row.get(5)?,
                mime_type: row.get(6)?,
            })
        })
        .map_err(|e| format!("查询最近文件失败: {}", e))?
        .filter_map(|r| r.ok())
        .collect();

    Ok(entries)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::schema;
    use rusqlite::Connection;

    fn setup_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        schema::create_tables(&conn).unwrap();
        conn
    }

    fn insert_test_file(conn: &Connection, path: &str) -> i64 {
        conn.execute(
            "INSERT INTO file_metadata (path, md5_hash, sha256_hash, file_size, mime_type, created_at, modified_at)
             VALUES (?1, 'md5_test', 'sha256_test', 1024, 'text/plain', datetime('now'), datetime('now'))",
            params![path],
        )
        .unwrap();
        conn.last_insert_rowid()
    }

    #[test]
    fn test_record_and_get_recent_files() {
        let conn = setup_db();
        let file_id = insert_test_file(&conn, "/test/file1.txt");

        record_access(&conn, file_id, "preview").unwrap();
        let files = get_recent_files(&conn, 10).unwrap();
        assert_eq!(files.len(), 1);
        assert_eq!(files[0].file_path, "/test/file1.txt");
        assert_eq!(files[0].action_type, "preview");
    }

    #[test]
    fn test_recent_files_returns_all() {
        let conn = setup_db();
        let f1 = insert_test_file(&conn, "/test/a.txt");
        let f2 = insert_test_file(&conn, "/test/b.txt");

        record_access(&conn, f1, "preview").unwrap();
        record_access(&conn, f2, "scan").unwrap();

        let files = get_recent_files(&conn, 10).unwrap();
        assert_eq!(files.len(), 2);
        let ids: Vec<i64> = files.iter().map(|f| f.file_id).collect();
        assert!(ids.contains(&f1));
        assert!(ids.contains(&f2));
    }

    #[test]
    fn test_recent_files_limit() {
        let conn = setup_db();
        for i in 0..5 {
            let fid = insert_test_file(&conn, &format!("/test/{}.txt", i));
            record_access(&conn, fid, "preview").unwrap();
        }
        let files = get_recent_files(&conn, 3).unwrap();
        assert_eq!(files.len(), 3);
    }
}