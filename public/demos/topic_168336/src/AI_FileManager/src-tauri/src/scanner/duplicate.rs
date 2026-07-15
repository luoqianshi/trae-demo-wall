//! 重复文件检测模块
//! 按 MD5 + SHA256 分组聚合检测重复文件

use crate::db::{Database, FileMetadata};
use anyhow::Result;

/// 重复文件组
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct DuplicateGroup {
    pub md5_hash: String,
    pub sha256_hash: String,
    pub file_size: i64,
    pub files: Vec<FileMetadata>,
    pub group_id: usize,
}

/// 检测重复文件
pub fn find_duplicates(db: &Database) -> Result<Vec<DuplicateGroup>> {
    let conn = db.conn.lock().unwrap();
    let mut stmt = conn.prepare(
        "SELECT md5_hash, sha256_hash, COUNT(*) as cnt, SUM(file_size) as total_size
         FROM file_metadata WHERE is_deleted = 0
         GROUP BY md5_hash, sha256_hash
         HAVING cnt > 1",
    )?;

    let groups: Vec<(String, String, i64, i64)> = stmt
        .query_map([], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, i64>(2)?,
                row.get::<_, i64>(3)?,
            ))
        })?
        .filter_map(|r| r.ok())
        .collect();
    drop(stmt);
    drop(conn);

    let mut result = Vec::new();
    for (i, (md5, sha256, _cnt, file_size)) in groups.iter().enumerate() {
        let files = db.find_file_by_hash_exact(md5, sha256)?;
        result.push(DuplicateGroup {
            md5_hash: md5.clone(),
            sha256_hash: sha256.clone(),
            file_size: *file_size,
            files,
            group_id: i + 1,
        });
    }

    Ok(result)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::Database;
    use crate::scanner::FileScanner;

    #[test]
    fn test_duplicate_detection() {
        let db = Database::open_in_memory().unwrap();
        let dir = std::env::temp_dir().join("ai_filemanager_test_dup");
        std::fs::create_dir_all(&dir).unwrap();

        let f1 = dir.join("file1.txt");
        let f2 = dir.join("file2.txt");
        std::fs::write(&f1, b"duplicate content").unwrap();
        std::fs::write(&f2, b"duplicate content").unwrap();

        let f3 = dir.join("file3.txt");
        std::fs::write(&f3, b"unique content").unwrap();

        let scanner = FileScanner::new();
        scanner
            .scan_directory(&dir, &db, None::<&dyn Fn(&crate::scanner::ScanProgress)>)
            .unwrap();

        let duplicates = find_duplicates(&db).unwrap();
        assert_eq!(duplicates.len(), 1);
        assert_eq!(duplicates[0].files.len(), 2);

        std::fs::remove_dir_all(&dir).unwrap();
    }
}