//! 删除记录模型与数据库操作

use rusqlite::params;
use serde::{Deserialize, Serialize};

use crate::db::Database;

/// 删除记录
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeletionRecord {
    pub id: i64,
    pub file_id: i64,
    pub file_path: String,
    pub md5_hash: String,
    pub sha256_hash: String,
    pub file_size: i64,
    pub deleted_at: String,
    pub reason: Option<String>,
    pub is_physical_deleted: bool,
    pub physical_deleted_at: Option<String>,
}

/// 删除队列项
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DeleteQueueItem {
    pub id: i64,
    pub record_id: i64,
    pub status: String,
    pub created_at: String,
    pub processed_at: Option<String>,
}

impl Database {
    /// 插入删除记录
    pub fn insert_deletion_record(&self, record: &DeletionRecord) -> Result<i64, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO deletion_records (file_id, file_path, md5_hash, sha256_hash, file_size, deleted_at, reason)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                record.file_id,
                record.file_path,
                record.md5_hash,
                record.sha256_hash,
                record.file_size,
                record.deleted_at,
                record.reason,
            ],
        )?;
        Ok(conn.last_insert_rowid())
    }

    /// 根据哈希查询删除记录
    #[allow(dead_code)]
    pub fn find_deleted_by_hash(&self, md5: &str, sha256: &str) -> Result<Vec<DeletionRecord>, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, file_id, file_path, md5_hash, sha256_hash, file_size, deleted_at, reason, is_physical_deleted, physical_deleted_at
             FROM deletion_records WHERE md5_hash = ?1 OR sha256_hash = ?2",
        )?;
        let rows = stmt.query_map(params![md5, sha256], |row| {
            Ok(DeletionRecord {
                id: row.get(0)?,
                file_id: row.get(1)?,
                file_path: row.get(2)?,
                md5_hash: row.get(3)?,
                sha256_hash: row.get(4)?,
                file_size: row.get(5)?,
                deleted_at: row.get(6)?,
                reason: row.get(7)?,
                is_physical_deleted: row.get::<_, i32>(8)? != 0,
                physical_deleted_at: row.get(9)?,
            })
        })?;
        let mut results = Vec::new();
        for row in rows {
            results.push(row?);
        }
        Ok(results)
    }

    /// 根据 ID 获取删除记录
    pub fn get_deletion_record_by_id(&self, record_id: i64) -> Result<Option<DeletionRecord>, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, file_id, file_path, md5_hash, sha256_hash, file_size, deleted_at, reason, is_physical_deleted, physical_deleted_at
             FROM deletion_records WHERE id = ?1",
        )?;
        let mut rows = stmt.query_map(params![record_id], |row| {
            Ok(DeletionRecord {
                id: row.get(0)?,
                file_id: row.get(1)?,
                file_path: row.get(2)?,
                md5_hash: row.get(3)?,
                sha256_hash: row.get(4)?,
                file_size: row.get(5)?,
                deleted_at: row.get(6)?,
                reason: row.get(7)?,
                is_physical_deleted: row.get::<_, i32>(8)? != 0,
                physical_deleted_at: row.get(9)?,
            })
        })?;
        match rows.next() {
            Some(Ok(record)) => Ok(Some(record)),
            _ => Ok(None),
        }
    }

    /// 获取所有删除记录
    pub fn get_deletion_records(&self) -> Result<Vec<DeletionRecord>, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, file_id, file_path, md5_hash, sha256_hash, file_size, deleted_at, reason, is_physical_deleted, physical_deleted_at
             FROM deletion_records ORDER BY deleted_at DESC",
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(DeletionRecord {
                id: row.get(0)?,
                file_id: row.get(1)?,
                file_path: row.get(2)?,
                md5_hash: row.get(3)?,
                sha256_hash: row.get(4)?,
                file_size: row.get(5)?,
                deleted_at: row.get(6)?,
                reason: row.get(7)?,
                is_physical_deleted: row.get::<_, i32>(8)? != 0,
                physical_deleted_at: row.get(9)?,
            })
        })?;
        let mut results = Vec::new();
        for row in rows {
            results.push(row?);
        }
        Ok(results)
    }

    /// 添加到删除队列
    pub fn add_to_delete_queue(&self, record_id: i64) -> Result<i64, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO delete_queue (record_id) VALUES (?1)",
            params![record_id],
        )?;
        Ok(conn.last_insert_rowid())
    }

    /// 获取删除队列
    pub fn get_delete_queue(&self, status: Option<&str>) -> Result<Vec<DeleteQueueItem>, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        let (sql, params_vec): (String, Vec<Box<dyn rusqlite::types::ToSql>>) = match status {
            Some(s) => (
                "SELECT id, record_id, status, created_at, processed_at FROM delete_queue WHERE status = ?1 ORDER BY created_at ASC".to_string(),
                vec![Box::new(s.to_string())],
            ),
            None => (
                "SELECT id, record_id, status, created_at, processed_at FROM delete_queue ORDER BY created_at ASC".to_string(),
                vec![],
            ),
        };
        let mut stmt = conn.prepare(&sql)?;
        let params_refs: Vec<&dyn rusqlite::types::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
        let rows = stmt.query_map(params_refs.as_slice(), |row| {
            Ok(DeleteQueueItem {
                id: row.get(0)?,
                record_id: row.get(1)?,
                status: row.get(2)?,
                created_at: row.get(3)?,
                processed_at: row.get(4)?,
            })
        })?;
        let mut results = Vec::new();
        for row in rows {
            results.push(row?);
        }
        Ok(results)
    }

    /// 更新删除队列状态
    pub fn update_queue_status(&self, queue_id: i64, status: &str) -> Result<(), rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE delete_queue SET status = ?1, processed_at = CASE WHEN ?1 = 'processed' THEN datetime('now') ELSE processed_at END WHERE id = ?2",
            params![status, queue_id],
        )?;
        Ok(())
    }

    /// 标记删除记录为已物理删除
    pub fn mark_physical_deleted(&self, record_id: i64) -> Result<(), rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE deletion_records SET is_physical_deleted = 1, physical_deleted_at = datetime('now') WHERE id = ?1",
            params![record_id],
        )?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::Database;

    #[test]
    fn test_deletion_record() {
        let db = Database::open_in_memory().unwrap();

        // 先插入一个文件
        let file_meta = crate::db::file_metadata::FileMetadata {
            id: 0,
            path: "/test/old.txt".to_string(),
            md5_hash: "abc123".to_string(),
            sha256_hash: "def456".to_string(),
            file_size: 1024,
            mime_type: None,
            created_at: "2026-01-01T00:00:00Z".to_string(),
            modified_at: "2026-01-01T00:00:00Z".to_string(),
            is_deleted: false,
            deleted_at: None,
        };
        let file_id = db.insert_file(&file_meta).unwrap();

        let record = DeletionRecord {
            id: 0,
            file_id,
            file_path: "/test/old.txt".to_string(),
            md5_hash: "abc123".to_string(),
            sha256_hash: "def456".to_string(),
            file_size: 1024,
            deleted_at: "2026-01-01T00:00:00Z".to_string(),
            reason: Some("重复文件".to_string()),
            is_physical_deleted: false,
            physical_deleted_at: None,
        };
        let record_id = db.insert_deletion_record(&record).unwrap();
        assert!(record_id > 0);

        // 查询删除记录
        let found = db.find_deleted_by_hash("abc123", "def456").unwrap();
        assert_eq!(found.len(), 1);

        // 添加到删除队列
        let queue_id = db.add_to_delete_queue(record_id).unwrap();
        assert!(queue_id > 0);

        // 查询队列
        let queue = db.get_delete_queue(Some("pending")).unwrap();
        assert_eq!(queue.len(), 1);
        assert_eq!(queue[0].status, "pending");
    }

    #[test]
    fn test_get_deletion_record_by_id() {
        let db = Database::open_in_memory().unwrap();
        let file_meta = crate::db::file_metadata::FileMetadata {
            id: 0,
            path: "/test/by_record_id.txt".to_string(),
            md5_hash: "rec_md5".to_string(),
            sha256_hash: "rec_sha256".to_string(),
            file_size: 200,
            mime_type: None,
            created_at: "2026-01-01T00:00:00Z".to_string(),
            modified_at: "2026-01-01T00:00:00Z".to_string(),
            is_deleted: false,
            deleted_at: None,
        };
        let file_id = db.insert_file(&file_meta).unwrap();
        let record = DeletionRecord {
            id: 0,
            file_id,
            file_path: "/test/by_record_id.txt".to_string(),
            md5_hash: "rec_md5".to_string(),
            sha256_hash: "rec_sha256".to_string(),
            file_size: 200,
            deleted_at: "2026-01-01T00:00:00Z".to_string(),
            reason: Some("测试".to_string()),
            is_physical_deleted: false,
            physical_deleted_at: None,
        };
        let record_id = db.insert_deletion_record(&record).unwrap();
        let found = db.get_deletion_record_by_id(record_id).unwrap().expect("should find record");
        assert_eq!(found.file_path, "/test/by_record_id.txt");
        // 不存在的 ID 返回 None
        assert!(db.get_deletion_record_by_id(9999).unwrap().is_none());
    }

    #[test]
    fn test_get_deletion_records() {
        let db = Database::open_in_memory().unwrap();
        let file_meta = crate::db::file_metadata::FileMetadata {
            id: 0,
            path: "/test/list_records.txt".to_string(),
            md5_hash: "list_md5".to_string(),
            sha256_hash: "list_sha256".to_string(),
            file_size: 300,
            mime_type: None,
            created_at: "2026-01-01T00:00:00Z".to_string(),
            modified_at: "2026-01-01T00:00:00Z".to_string(),
            is_deleted: false,
            deleted_at: None,
        };
        let file_id = db.insert_file(&file_meta).unwrap();
        for i in 0..3 {
            let record = DeletionRecord {
                id: 0,
                file_id,
                file_path: format!("/test/file_{}.txt", i),
                md5_hash: format!("md5_{}", i),
                sha256_hash: format!("sha256_{}", i),
                file_size: 100 * i,
                deleted_at: "2026-01-01T00:00:00Z".to_string(),
                reason: None,
                is_physical_deleted: false,
                physical_deleted_at: None,
            };
            db.insert_deletion_record(&record).unwrap();
        }
        let records = db.get_deletion_records().unwrap();
        assert_eq!(records.len(), 3);
    }

    #[test]
    fn test_update_queue_status_and_mark_physical_deleted() {
        let db = Database::open_in_memory().unwrap();
        let file_meta = crate::db::file_metadata::FileMetadata {
            id: 0,
            path: "/test/queue_ops.txt".to_string(),
            md5_hash: "queue_md5".to_string(),
            sha256_hash: "queue_sha256".to_string(),
            file_size: 400,
            mime_type: None,
            created_at: "2026-01-01T00:00:00Z".to_string(),
            modified_at: "2026-01-01T00:00:00Z".to_string(),
            is_deleted: false,
            deleted_at: None,
        };
        let file_id = db.insert_file(&file_meta).unwrap();
        let record = DeletionRecord {
            id: 0,
            file_id,
            file_path: "/test/queue_ops.txt".to_string(),
            md5_hash: "queue_md5".to_string(),
            sha256_hash: "queue_sha256".to_string(),
            file_size: 400,
            deleted_at: "2026-01-01T00:00:00Z".to_string(),
            reason: None,
            is_physical_deleted: false,
            physical_deleted_at: None,
        };
        let record_id = db.insert_deletion_record(&record).unwrap();
        let queue_id = db.add_to_delete_queue(record_id).unwrap();
        // 更新队列状态为 processed
        db.update_queue_status(queue_id, "processed").unwrap();
        let queue = db.get_delete_queue(Some("processed")).unwrap();
        assert_eq!(queue.len(), 1);
        // 标记物理删除
        db.mark_physical_deleted(record_id).unwrap();
        let updated = db.get_deletion_record_by_id(record_id).unwrap().unwrap();
        assert!(updated.is_physical_deleted);
    }
}