//! 虚拟目录模型与数据库操作

use rusqlite::params;
use serde::{Deserialize, Serialize};

use crate::db::Database;
use crate::db::file_metadata::FileMetadata;

/// 虚拟目录
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VirtualDirectory {
    pub id: i64,
    pub name: String,
    pub parent_id: Option<i64>,
    pub ai_generated: bool,
    pub created_at: String,
}

impl Database {
    /// 创建虚拟目录
    pub fn create_virtual_dir(&self, name: &str, parent_id: Option<i64>, ai_generated: bool) -> Result<i64, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT INTO virtual_directories (name, parent_id, ai_generated) VALUES (?1, ?2, ?3)",
            params![name, parent_id, ai_generated as i32],
        )?;
        Ok(conn.last_insert_rowid())
    }

    /// 获取所有虚拟目录
    pub fn get_virtual_dirs(&self) -> Result<Vec<VirtualDirectory>, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, parent_id, ai_generated, created_at FROM virtual_directories",
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(VirtualDirectory {
                id: row.get(0)?,
                name: row.get(1)?,
                parent_id: row.get(2)?,
                ai_generated: row.get::<_, i32>(3)? != 0,
                created_at: row.get(4)?,
            })
        })?;
        let mut results = Vec::new();
        for row in rows {
            results.push(row?);
        }
        Ok(results)
    }

    /// 将文件添加到虚拟目录
    pub fn add_file_to_virtual_dir(&self, dir_id: i64, file_id: i64) -> Result<(), rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "INSERT OR IGNORE INTO virtual_dir_files (virtual_dir_id, file_id) VALUES (?1, ?2)",
            params![dir_id, file_id],
        )?;
        Ok(())
    }

    /// 从虚拟目录移除文件
    #[allow(dead_code)]
    pub fn remove_file_from_virtual_dir(&self, dir_id: i64, file_id: i64) -> Result<(), rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "DELETE FROM virtual_dir_files WHERE virtual_dir_id = ?1 AND file_id = ?2",
            params![dir_id, file_id],
        )?;
        Ok(())
    }

    /// 获取虚拟目录中的文件列表
    pub fn get_virtual_dir_files(&self, dir_id: i64) -> Result<Vec<FileMetadata>, rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT fm.id, fm.path, fm.md5_hash, fm.sha256_hash, fm.file_size, fm.mime_type, fm.created_at, fm.modified_at, fm.is_deleted, fm.deleted_at
             FROM file_metadata fm
             JOIN virtual_dir_files vdf ON fm.id = vdf.file_id
             WHERE vdf.virtual_dir_id = ?1",
        )?;
        let rows = stmt.query_map(params![dir_id], |row| {
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
        })?;
        let mut results = Vec::new();
        for row in rows {
            results.push(row?);
        }
        Ok(results)
    }

    /// 删除虚拟目录
    #[allow(dead_code)]
    pub fn delete_virtual_dir(&self, dir_id: i64) -> Result<(), rusqlite::Error> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM virtual_dir_files WHERE virtual_dir_id = ?1", params![dir_id])?;
        conn.execute("DELETE FROM virtual_directories WHERE id = ?1", params![dir_id])?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::Database;

    #[test]
    fn test_virtual_directory() {
        let db = Database::open_in_memory().unwrap();

        // 创建虚拟目录
        let dir_id = db.create_virtual_dir("我的文档", None, false).unwrap();
        assert!(dir_id > 0);

        // 添加文件
        let meta = FileMetadata {
            id: 0,
            path: "/test/doc.txt".to_string(),
            md5_hash: "abc".to_string(),
            sha256_hash: "def".to_string(),
            file_size: 100,
            mime_type: None,
            created_at: "2026-01-01T00:00:00Z".to_string(),
            modified_at: "2026-01-01T00:00:00Z".to_string(),
            is_deleted: false,
            deleted_at: None,
        };
        let file_id = db.insert_file(&meta).unwrap();
        db.add_file_to_virtual_dir(dir_id, file_id).unwrap();

        // 查询文件
        let files = db.get_virtual_dir_files(dir_id).unwrap();
        assert_eq!(files.len(), 1);
        assert_eq!(files[0].path, "/test/doc.txt");

        // 删除虚拟目录
        db.delete_virtual_dir(dir_id).unwrap();
        let dirs = db.get_virtual_dirs().unwrap();
        assert_eq!(dirs.len(), 0);
    }
}