//! 文件元数据模型与数据库操作

use rusqlite::params;
use serde::{Deserialize, Serialize};

use crate::db::Database;

/// 文件元数据
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileMetadata {
    pub id: i64,
    pub path: String,
    pub md5_hash: String,
    pub sha256_hash: String,
    pub file_size: i64,
    pub mime_type: Option<String>,
    pub created_at: String,
    pub modified_at: String,
    pub is_deleted: bool,
    pub deleted_at: Option<String>,
}

/// 分页文件列表
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PaginatedFiles {
    pub files: Vec<FileMetadata>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
    pub total_pages: i64,
}

impl Database {
    /// 插入文件元数据
    pub fn insert_file(&self, meta: &FileMetadata) -> Result<i64, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO file_metadata (path, md5_hash, sha256_hash, file_size, mime_type, created_at, modified_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                meta.path,
                meta.md5_hash,
                meta.sha256_hash,
                meta.file_size,
                meta.mime_type,
                meta.created_at,
                meta.modified_at,
            ],
        )?;
        Ok(conn.last_insert_rowid())
    }

    /// 根据哈希查找文件（OR 匹配任一哈希）
    #[allow(dead_code)]
    pub fn find_by_hash(&self, md5: &str, sha256: &str) -> Result<Vec<FileMetadata>, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, path, md5_hash, sha256_hash, file_size, mime_type, created_at, modified_at, is_deleted, deleted_at
             FROM file_metadata WHERE md5_hash = ?1 OR sha256_hash = ?2",
        )?;
        let rows = stmt.query_map(params![md5, sha256], Self::map_file_row)?;
        let mut results = Vec::new();
        for row in rows {
            results.push(row?);
        }
        Ok(results)
    }

    /// 根据哈希精确查找文件（同时匹配 MD5 和 SHA256，且未删除）
    pub fn find_file_by_hash_exact(&self, md5: &str, sha256: &str) -> Result<Vec<FileMetadata>, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, path, md5_hash, sha256_hash, file_size, mime_type, created_at, modified_at, is_deleted, deleted_at
             FROM file_metadata WHERE md5_hash = ?1 AND sha256_hash = ?2 AND is_deleted = 0",
        )?;
        let rows = stmt.query_map(params![md5, sha256], Self::map_file_row)?;
        let mut results = Vec::new();
        for row in rows {
            results.push(row?);
        }
        Ok(results)
    }

    /// 获取所有文件元数据
    pub fn get_all_files(&self) -> Result<Vec<FileMetadata>, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, path, md5_hash, sha256_hash, file_size, mime_type, created_at, modified_at, is_deleted, deleted_at
             FROM file_metadata WHERE is_deleted = 0",
        )?;
        let rows = stmt.query_map([], Self::map_file_row)?;
        let mut results = Vec::new();
        for row in rows {
            results.push(row?);
        }
        Ok(results)
    }

    /// 获取分页文件列表
    pub fn get_files_paginated(&self, page: i64, page_size: i64) -> Result<PaginatedFiles, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        let total: i64 = conn.query_row(
            "SELECT COUNT(*) FROM file_metadata WHERE is_deleted = 0",
            [],
            |row| row.get(0),
        )?;
        let total_pages = if total == 0 { 1 } else { (total + page_size - 1) / page_size };
        let offset = (page - 1).max(0) * page_size;
        let mut stmt = conn.prepare(
            "SELECT id, path, md5_hash, sha256_hash, file_size, mime_type, created_at, modified_at, is_deleted, deleted_at
             FROM file_metadata WHERE is_deleted = 0 ORDER BY path ASC LIMIT ?1 OFFSET ?2",
        )?;
        let rows = stmt.query_map(params![page_size, offset], Self::map_file_row)?;
        let mut files = Vec::new();
        for row in rows {
            files.push(row?);
        }
        Ok(PaginatedFiles {
            files,
            total,
            page: page.max(1),
            page_size,
            total_pages,
        })
    }

    /// 统计文件总数和总大小
    #[allow(dead_code)]
    pub fn get_file_statistics(&self) -> Result<(i64, i64), rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        conn.query_row(
            "SELECT COUNT(*), COALESCE(SUM(file_size), 0) FROM file_metadata WHERE is_deleted = 0",
            [],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
    }

    /// 根据 ID 获取文件
    pub fn get_file_by_id(&self, file_id: i64) -> Result<Option<FileMetadata>, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, path, md5_hash, sha256_hash, file_size, mime_type, created_at, modified_at, is_deleted, deleted_at
             FROM file_metadata WHERE id = ?1",
        )?;
        let mut rows = stmt.query_map(params![file_id], Self::map_file_row)?;
        match rows.next() {
            Some(Ok(file)) => Ok(Some(file)),
            _ => Ok(None),
        }
    }

    /// 获取排序过滤后的文件列表
    /// sort_by: "path" | "file_size" | "created_at" | "modified_at"（默认 "path"）
    /// sort_order: "asc" | "desc"（默认 "asc"）
    /// filter_ext: 可选扩展名过滤（如 "txt"），为空不过滤
    /// filter_min_size: 最小文件大小（字节），0 不过滤
    /// filter_max_size: 最大文件大小（字节），0 不过滤
    pub fn get_files_sorted(
        &self,
        sort_by: &str,
        sort_order: &str,
        filter_ext: Option<&str>,
        filter_min_size: i64,
        filter_max_size: i64,
    ) -> Result<Vec<FileMetadata>, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();

        let sort_column = match sort_by {
            "file_size" => "file_size",
            "created_at" => "created_at",
            "modified_at" => "modified_at",
            _ => "path",
        };
        let order = if sort_order == "desc" { "DESC" } else { "ASC" };

        let mut sql = String::from(
            "SELECT id, path, md5_hash, sha256_hash, file_size, mime_type, created_at, modified_at, is_deleted, deleted_at
             FROM file_metadata WHERE is_deleted = 0"
        );

        let mut params_vec: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

        if let Some(ext) = filter_ext {
            if !ext.is_empty() {
                sql.push_str(&format!(" AND LOWER(path) LIKE ?{}", params_vec.len() + 1));
                params_vec.push(Box::new(format!("%.{}", ext.to_lowercase())));
            }
        }
        if filter_min_size > 0 {
            sql.push_str(&format!(" AND file_size >= ?{}", params_vec.len() + 1));
            params_vec.push(Box::new(filter_min_size));
        }
        if filter_max_size > 0 {
            sql.push_str(&format!(" AND file_size <= ?{}", params_vec.len() + 1));
            params_vec.push(Box::new(filter_max_size));
        }

        sql.push_str(&format!(" ORDER BY {} {} LIMIT 500", sort_column, order));

        let mut stmt = conn.prepare(&sql)?;
        let params_refs: Vec<&dyn rusqlite::types::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
        let rows = stmt.query_map(params_refs.as_slice(), Self::map_file_row)?;
        let mut results = Vec::new();
        for row in rows {
            results.push(row?);
        }
        Ok(results)
    }

    /// 获取排序过滤后的分页文件列表
    pub fn get_files_sorted_paginated(
        &self,
        sort_by: &str,
        sort_order: &str,
        filter_ext: Option<&str>,
        filter_min_size: i64,
        filter_max_size: i64,
        page: i64,
        page_size: i64,
    ) -> Result<PaginatedFiles, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();

        let sort_column = match sort_by {
            "file_size" => "file_size",
            "created_at" => "created_at",
            "modified_at" => "modified_at",
            _ => "path",
        };
        let order = if sort_order == "desc" { "DESC" } else { "ASC" };

        // Count query
        let mut count_sql = String::from(
            "SELECT COUNT(*) FROM file_metadata WHERE is_deleted = 0"
        );
        let mut data_sql = String::from(
            "SELECT id, path, md5_hash, sha256_hash, file_size, mime_type, created_at, modified_at, is_deleted, deleted_at
             FROM file_metadata WHERE is_deleted = 0"
        );

        let mut params_vec: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

        if let Some(ext) = filter_ext {
            if !ext.is_empty() {
                let clause = format!(" AND LOWER(path) LIKE ?{}", params_vec.len() + 1);
                count_sql.push_str(&clause);
                data_sql.push_str(&clause);
                params_vec.push(Box::new(format!("%.{}", ext.to_lowercase())));
            }
        }
        if filter_min_size > 0 {
            let clause = format!(" AND file_size >= ?{}", params_vec.len() + 1);
            count_sql.push_str(&clause);
            data_sql.push_str(&clause);
            params_vec.push(Box::new(filter_min_size));
        }
        if filter_max_size > 0 {
            let clause = format!(" AND file_size <= ?{}", params_vec.len() + 1);
            count_sql.push_str(&clause);
            data_sql.push_str(&clause);
            params_vec.push(Box::new(filter_max_size));
        }

        // Get total count
        let params_refs_count: Vec<&dyn rusqlite::types::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
        let total: i64 = conn.query_row(&count_sql, params_refs_count.as_slice(), |row| row.get(0))?;

        let total_pages = if total == 0 { 1 } else { (total + page_size - 1) / page_size };
        let offset = (page - 1).max(0) * page_size;

        data_sql.push_str(&format!(" ORDER BY {} {} LIMIT ?{} OFFSET ?{}", sort_column, order, params_vec.len() + 1, params_vec.len() + 2));
        params_vec.push(Box::new(page_size));
        params_vec.push(Box::new(offset));

        let mut stmt = conn.prepare(&data_sql)?;
        let params_refs: Vec<&dyn rusqlite::types::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
        let rows = stmt.query_map(params_refs.as_slice(), Self::map_file_row)?;
        let mut files = Vec::new();
        for row in rows {
            files.push(row?);
        }
        Ok(PaginatedFiles {
            files,
            total,
            page: page.max(1),
            page_size,
            total_pages,
        })
    }

    /// 搜索文件（按路径模糊匹配）
    pub fn search_files(&self, query: &str) -> Result<Vec<FileMetadata>, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        let pattern = format!("%{}%", query);
        let mut stmt = conn.prepare(
            "SELECT id, path, md5_hash, sha256_hash, file_size, mime_type, created_at, modified_at, is_deleted, deleted_at
             FROM file_metadata WHERE path LIKE ?1 AND is_deleted = 0 ORDER BY path ASC LIMIT 200",
        )?;
        let rows = stmt.query_map(rusqlite::params![pattern], Self::map_file_row)?;
        let mut results = Vec::new();
        for row in rows {
            results.push(row?);
        }
        Ok(results)
    }

    /// 高级搜索文件
    /// 支持按关键字、扩展名、大小范围、日期范围、哈希值组合搜索
    #[allow(clippy::too_many_arguments)]
    pub fn advanced_search(
        &self,
        query: Option<&str>,
        ext: Option<&str>,
        min_size: Option<i64>,
        max_size: Option<i64>,
        created_after: Option<&str>,
        created_before: Option<&str>,
        modified_after: Option<&str>,
        modified_before: Option<&str>,
        hash: Option<&str>,
    ) -> Result<Vec<FileMetadata>, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();

        let mut sql = String::from(
            "SELECT id, path, md5_hash, sha256_hash, file_size, mime_type, created_at, modified_at, is_deleted, deleted_at
             FROM file_metadata WHERE is_deleted = 0"
        );

        let mut params_vec: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

        if let Some(q) = query {
            if !q.is_empty() {
                sql.push_str(&format!(" AND (LOWER(path) LIKE ?{} OR LOWER(mime_type) LIKE ?{})", params_vec.len() + 1, params_vec.len() + 2));
                let pattern = format!("%{}%", q.to_lowercase());
                params_vec.push(Box::new(pattern.clone()));
                params_vec.push(Box::new(pattern));
            }
        }

        if let Some(e) = ext {
            if !e.is_empty() {
                sql.push_str(&format!(" AND LOWER(path) LIKE ?{}", params_vec.len() + 1));
                params_vec.push(Box::new(format!("%.{}", e.to_lowercase())));
            }
        }

        if let Some(v) = min_size {
            if v > 0 {
                sql.push_str(&format!(" AND file_size >= ?{}", params_vec.len() + 1));
                params_vec.push(Box::new(v));
            }
        }

        if let Some(v) = max_size {
            if v > 0 {
                sql.push_str(&format!(" AND file_size <= ?{}", params_vec.len() + 1));
                params_vec.push(Box::new(v));
            }
        }

        if let Some(d) = created_after {
            if !d.is_empty() {
                sql.push_str(&format!(" AND created_at >= ?{}", params_vec.len() + 1));
                params_vec.push(Box::new(d.to_string()));
            }
        }

        if let Some(d) = created_before {
            if !d.is_empty() {
                sql.push_str(&format!(" AND created_at <= ?{}", params_vec.len() + 1));
                params_vec.push(Box::new(d.to_string()));
            }
        }

        if let Some(d) = modified_after {
            if !d.is_empty() {
                sql.push_str(&format!(" AND modified_at >= ?{}", params_vec.len() + 1));
                params_vec.push(Box::new(d.to_string()));
            }
        }

        if let Some(d) = modified_before {
            if !d.is_empty() {
                sql.push_str(&format!(" AND modified_at <= ?{}", params_vec.len() + 1));
                params_vec.push(Box::new(d.to_string()));
            }
        }

        if let Some(h) = hash {
            if !h.is_empty() {
                sql.push_str(&format!(" AND (md5_hash LIKE ?{} OR sha256_hash LIKE ?{})", params_vec.len() + 1, params_vec.len() + 2));
                let pattern = format!("%{}%", h.to_lowercase());
                params_vec.push(Box::new(pattern.clone()));
                params_vec.push(Box::new(pattern));
            }
        }

        sql.push_str(" ORDER BY path ASC LIMIT 500");

        let mut stmt = conn.prepare(&sql)?;
        let params_refs: Vec<&dyn rusqlite::types::ToSql> = params_vec.iter().map(|p| p.as_ref()).collect();
        let rows = stmt.query_map(params_refs.as_slice(), Self::map_file_row)?;
        let mut results = Vec::new();
        for row in rows {
            results.push(row?);
        }
        Ok(results)
    }

    /// 将文件标记为已删除
    pub fn mark_file_deleted(&self, file_id: i64) -> Result<(), rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE file_metadata SET is_deleted = 1, deleted_at = datetime('now') WHERE id = ?1",
            params![file_id],
        )?;
        Ok(())
    }

    /// 更新文件路径
    pub fn update_file_path(&self, file_id: i64, new_path: &str) -> Result<(), rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE file_metadata SET path = ?1 WHERE id = ?2",
            params![new_path, file_id],
        )?;
        Ok(())
    }

    /// 恢复已删除的文件标记
    pub fn restore_file(&self, file_id: i64) -> Result<(), rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE file_metadata SET is_deleted = 0, deleted_at = NULL WHERE id = ?1",
            params![file_id],
        )?;
        Ok(())
    }

    /// 从数据库行映射 FileMetadata
    fn map_file_row(row: &rusqlite::Row) -> rusqlite::Result<FileMetadata> {
        Ok(FileMetadata {
            id: row.get(0)?,
            path: row.get(1)?,
            md5_hash: row.get(2)?,
            sha256_hash: row.get(3)?,
            file_size: row.get(4)?,
            mime_type: row.get(5)?,
            created_at: row.get(6)?,
            modified_at: row.get(7)?,
            is_deleted: row.get::<_, i32>(8)? != 0,
            deleted_at: row.get(9)?,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::Database;

    #[test]
    fn test_insert_and_find_file() {
        let db = Database::open_in_memory().unwrap();
        let meta = FileMetadata {
            id: 0,
            path: "/test/file.txt".to_string(),
            md5_hash: "d41d8cd98f00b204e9800998ecf8427e".to_string(),
            sha256_hash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855".to_string(),
            file_size: 0,
            mime_type: Some("text/plain".to_string()),
            created_at: "2026-01-01T00:00:00Z".to_string(),
            modified_at: "2026-01-01T00:00:00Z".to_string(),
            is_deleted: false,
            deleted_at: None,
        };
        let id = db.insert_file(&meta).unwrap();
        assert!(id > 0);

        let results = db.find_by_hash("d41d8cd98f00b204e9800998ecf8427e", "nonexistent").unwrap();
        assert_eq!(results.len(), 1);
    }

    #[test]
    fn test_get_all_files() {
        let db = Database::open_in_memory().unwrap();
        let meta = FileMetadata {
            id: 0,
            path: "/test/a.txt".to_string(),
            md5_hash: "aaa".to_string(),
            sha256_hash: "aaa".to_string(),
            file_size: 10,
            mime_type: None,
            created_at: "2026-01-01T00:00:00Z".to_string(),
            modified_at: "2026-01-01T00:00:00Z".to_string(),
            is_deleted: false,
            deleted_at: None,
        };
        db.insert_file(&meta).unwrap();
        assert_eq!(db.get_all_files().unwrap().len(), 1);
    }

    #[test]
    fn test_mark_file_deleted() {
        let db = Database::open_in_memory().unwrap();
        let meta = FileMetadata {
            id: 0,
            path: "/test/del.txt".to_string(),
            md5_hash: "bbb".to_string(),
            sha256_hash: "bbb".to_string(),
            file_size: 10,
            mime_type: None,
            created_at: "2026-01-01T00:00:00Z".to_string(),
            modified_at: "2026-01-01T00:00:00Z".to_string(),
            is_deleted: false,
            deleted_at: None,
        };
        let id = db.insert_file(&meta).unwrap();
        db.mark_file_deleted(id).unwrap();
        let stats = db.get_file_statistics().unwrap();
        assert_eq!(stats.0, 0); // 标记删除后统计不应包含
    }

    #[test]
    fn test_get_file_by_id() {
        let db = Database::open_in_memory().unwrap();
        let meta = FileMetadata {
            id: 0,
            path: "/test/by_id.txt".to_string(),
            md5_hash: "ccc".to_string(),
            sha256_hash: "ccc".to_string(),
            file_size: 42,
            mime_type: Some("text/plain".to_string()),
            created_at: "2026-01-01T00:00:00Z".to_string(),
            modified_at: "2026-01-01T00:00:00Z".to_string(),
            is_deleted: false,
            deleted_at: None,
        };
        let id = db.insert_file(&meta).unwrap();
        let found = db.get_file_by_id(id).unwrap().expect("should find file");
        assert_eq!(found.path, "/test/by_id.txt");
        assert_eq!(found.file_size, 42);
        // 不存在的 ID 返回 None
        let none = db.get_file_by_id(9999).unwrap();
        assert!(none.is_none());
    }

    #[test]
    fn test_search_files() {
        let db = Database::open_in_memory().unwrap();
        for name in &["project/report.pdf", "project/notes.txt", "archive/photo.jpg"] {
            let meta = FileMetadata {
                id: 0,
                path: name.to_string(),
                md5_hash: "hash".to_string(),
                sha256_hash: "hash".to_string(),
                file_size: 100,
                mime_type: None,
                created_at: "2026-01-01T00:00:00Z".to_string(),
                modified_at: "2026-01-01T00:00:00Z".to_string(),
                is_deleted: false,
                deleted_at: None,
            };
            db.insert_file(&meta).unwrap();
        }
        let results = db.search_files("project").unwrap();
        assert_eq!(results.len(), 2);
        // 搜索已删除文件不应返回
        db.mark_file_deleted(1).unwrap();
        let results_after_delete = db.search_files("project").unwrap();
        assert_eq!(results_after_delete.len(), 1);
    }

    #[test]
    fn test_find_file_by_hash_exact() {
        let db = Database::open_in_memory().unwrap();
        let meta = FileMetadata {
            id: 0,
            path: "/test/exact.txt".to_string(),
            md5_hash: "exact_md5".to_string(),
            sha256_hash: "exact_sha256".to_string(),
            file_size: 50,
            mime_type: None,
            created_at: "2026-01-01T00:00:00Z".to_string(),
            modified_at: "2026-01-01T00:00:00Z".to_string(),
            is_deleted: false,
            deleted_at: None,
        };
        db.insert_file(&meta).unwrap();
        // 精确匹配两个哈希
        let found = db.find_file_by_hash_exact("exact_md5", "exact_sha256").unwrap();
        assert_eq!(found.len(), 1);
        // 哈希不匹配应返回空
        let none = db.find_file_by_hash_exact("exact_md5", "wrong_sha256").unwrap();
        assert!(none.is_empty());
    }
}