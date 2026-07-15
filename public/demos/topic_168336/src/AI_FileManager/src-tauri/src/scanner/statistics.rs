//! 文件统计信息模块
//! 查询文件总数、总大小、重复文件数、可节省空间等统计指标

use crate::db::Database;
use anyhow::Result;

/// 文件统计信息
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct FileStatistics {
    pub total_files: i64,
    pub total_size: i64,
    pub duplicate_files: i64,
    pub duplicate_groups: i64,
    pub space_saved: i64,
}

/// 获取文件统计信息
pub fn get_statistics(db: &Database) -> Result<FileStatistics> {
    let conn = db.conn.lock().unwrap();

    let total_files: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM file_metadata WHERE is_deleted = 0",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let total_size: i64 = conn
        .query_row(
            "SELECT COALESCE(SUM(file_size), 0) FROM file_metadata WHERE is_deleted = 0",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let duplicate_groups: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM (SELECT md5_hash FROM file_metadata WHERE is_deleted = 0 GROUP BY md5_hash HAVING COUNT(*) > 1)",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let duplicate_files: i64 = conn
        .query_row(
            "SELECT COALESCE(SUM(cnt - 1), 0) FROM (SELECT COUNT(*) as cnt FROM file_metadata WHERE is_deleted = 0 GROUP BY md5_hash HAVING cnt > 1)",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    let space_saved: i64 = conn
        .query_row(
            "SELECT COALESCE(SUM((cnt - 1) * file_size), 0) FROM (SELECT md5_hash, file_size, COUNT(*) as cnt FROM file_metadata WHERE is_deleted = 0 GROUP BY md5_hash, file_size HAVING cnt > 1)",
            [],
            |row| row.get(0),
        )
        .unwrap_or(0);

    drop(conn);

    Ok(FileStatistics {
        total_files,
        total_size,
        duplicate_files,
        duplicate_groups,
        space_saved,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::Database;
    use crate::scanner::FileScanner;

    #[test]
    fn test_statistics() {
        let db = Database::open_in_memory().unwrap();
        let dir = std::env::temp_dir().join("ai_filemanager_test_stats");
        std::fs::create_dir_all(&dir).unwrap();

        let f1 = dir.join("a.txt");
        std::fs::write(&f1, b"content").unwrap();

        let scanner = FileScanner::new();
        scanner
            .scan_directory(&dir, &db, None::<&dyn Fn(&crate::scanner::ScanProgress)>)
            .unwrap();

        let stats = get_statistics(&db).unwrap();
        assert!(stats.total_files > 0);
        assert!(stats.total_size > 0);

        std::fs::remove_dir_all(&dir).unwrap();
    }
}