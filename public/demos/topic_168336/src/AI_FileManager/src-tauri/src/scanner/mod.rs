//! 文件扫描模块
//! 递归扫描目录，计算文件哈希，记录文件元数据到数据库
//! 支持分批扫描与进度上报，支持取消

pub mod duplicate;
pub mod statistics;

pub use duplicate::DuplicateGroup;
pub use statistics::FileStatistics;

use crate::db::{Database, FileMetadata};
use crate::hash::HashCalculator;
use anyhow::Result;
use std::path::Path;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::SystemTime;
use walkdir::WalkDir;

/// 文件扫描结果
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ScanResult {
    pub total_files: usize,
    pub total_size: i64,
    pub scanned_path: String,
    pub duration_ms: u64,
    pub new_files: usize,
}

/// 扫描进度（用于前端进度条）
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ScanProgress {
    pub scanned_path: String,
    pub files_found: usize,
    pub files_processed: usize,
    pub total_size: i64,
    pub current_file: String,
    pub is_finished: bool,
}

/// 文件扫描器
pub struct FileScanner {
    hash_calculator: HashCalculator,
    /// 每批处理的文件数，默认 100
    batch_size: usize,
    /// 取消标记
    cancel_flag: Option<Arc<AtomicBool>>,
}

impl Default for FileScanner {
    fn default() -> Self {
        Self::new()
    }
}

impl FileScanner {
    pub fn new() -> Self {
        Self {
            hash_calculator: HashCalculator::new(),
            batch_size: 100,
            cancel_flag: None,
        }
    }

    /// 设置批次大小
    #[allow(dead_code)]
    pub fn with_batch_size(mut self, batch_size: usize) -> Self {
        self.batch_size = batch_size;
        self
    }

    /// 设置取消标记
    pub fn with_cancel(mut self, cancel: Arc<AtomicBool>) -> Self {
        self.cancel_flag = Some(cancel);
        self
    }

    /// 检查是否被取消
    fn is_cancelled(&self) -> bool {
        self.cancel_flag
            .as_ref()
            .map(|f| f.load(Ordering::Relaxed))
            .unwrap_or(false)
    }

    /// 递归扫描目录，支持进度回调
    /// `on_progress` 可选回调，用于在扫描过程中报告进度
    pub fn scan_directory<F>(&self, path: &Path, db: &Database, on_progress: Option<F>) -> Result<ScanResult>
    where
        F: Fn(&ScanProgress),
    {
        let start = std::time::Instant::now();
        let mut total_files = 0usize;
        let mut total_size = 0i64;
        let mut new_files = 0usize;
        let mut processed_in_batch = 0usize;

        // 收集所有文件条目，先做一次快速遍历获取总数
        let entries: Vec<_> = WalkDir::new(path)
            .follow_links(false)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| e.file_type().is_file())
            .collect();

        let total_found = entries.len();

        for entry in &entries {
            // 检查取消
            if self.is_cancelled() {
                break;
            }

            let file_path = entry.path();
            let file_size = entry.metadata().ok().map(|m| m.len() as i64).unwrap_or(0);
            total_files += 1;
            total_size += file_size;

            // 计算哈希
            let hashes = match self.hash_calculator.calculate_hashes(file_path) {
                Ok(h) => h,
                Err(_) => continue,
            };

            // 格式化时间
            let created_at = entry
                .metadata()
                .ok()
                .and_then(|m| m.created().ok())
                .map(|t| {
                    let duration = t.duration_since(SystemTime::UNIX_EPOCH).unwrap_or_default();
                    let secs = duration.as_secs();
                    chrono::DateTime::from_timestamp(secs as i64, 0)
                        .map(|dt| dt.to_rfc3339())
                        .unwrap_or_default()
                })
                .unwrap_or_default();

            let modified_at = entry
                .metadata()
                .ok()
                .and_then(|m| m.modified().ok())
                .map(|t| {
                    let duration = t.duration_since(SystemTime::UNIX_EPOCH).unwrap_or_default();
                    let secs = duration.as_secs();
                    chrono::DateTime::from_timestamp(secs as i64, 0)
                        .map(|dt| dt.to_rfc3339())
                        .unwrap_or_default()
                })
                .unwrap_or_default();

            // 检测 MIME 类型（通过扩展名简单判断）
            let mime_type = file_path
                .extension()
                .and_then(|e| e.to_str())
                .map(|ext| match ext.to_lowercase().as_str() {
                    "txt" => "text/plain",
                    "html" | "htm" => "text/html",
                    "css" => "text/css",
                    "js" => "application/javascript",
                    "json" => "application/json",
                    "xml" => "application/xml",
                    "png" => "image/png",
                    "jpg" | "jpeg" => "image/jpeg",
                    "gif" => "image/gif",
                    "svg" => "image/svg+xml",
                    "pdf" => "application/pdf",
                    "doc" | "docx" => "application/msword",
                    "xls" | "xlsx" => "application/vnd.ms-excel",
                    "zip" => "application/zip",
                    "rar" => "application/x-rar-compressed",
                    "mp3" => "audio/mpeg",
                    "mp4" => "video/mp4",
                    "exe" => "application/x-msdownload",
                    _ => "application/octet-stream",
                })
                .map(|s| s.to_string());

            let meta = FileMetadata {
                id: 0,
                path: file_path.to_string_lossy().to_string(),
                md5_hash: hashes.md5,
                sha256_hash: hashes.sha256,
                file_size,
                mime_type,
                created_at,
                modified_at,
                is_deleted: false,
                deleted_at: None,
            };

            match db.insert_file(&meta) {
                Ok(_) => new_files += 1,
                Err(e) => {
                    tracing::debug!("文件已存在: {:?}: {}", file_path, e);
                }
            }

            processed_in_batch += 1;

            // 每批处理完成后报告进度
            if let Some(ref progress_fn) = on_progress {
                if processed_in_batch % self.batch_size == 0 || processed_in_batch == total_found {
                    progress_fn(&ScanProgress {
                        scanned_path: path.to_string_lossy().to_string(),
                        files_found: total_found,
                        files_processed: processed_in_batch,
                        total_size,
                        current_file: file_path.to_string_lossy().to_string(),
                        is_finished: processed_in_batch >= total_found || self.is_cancelled(),
                    });
                }
            }
        }

        let duration = start.elapsed();
        Ok(ScanResult {
            total_files,
            total_size,
            scanned_path: path.to_string_lossy().to_string(),
            duration_ms: duration.as_millis() as u64,
            new_files,
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::Database;

    #[test]
    fn test_scan_with_progress() {
        let db = Database::open_in_memory().unwrap();
        let dir = std::env::temp_dir().join("ai_filemanager_test_progress");
        std::fs::create_dir_all(&dir).unwrap();

        std::fs::write(dir.join("a.txt"), b"content a").unwrap();
        std::fs::write(dir.join("b.txt"), b"content b").unwrap();

        let progress = std::sync::Mutex::new(Vec::new());
        let scanner = FileScanner::new().with_batch_size(1);
        let result = scanner
            .scan_directory(&dir, &db, Some(&|p: &ScanProgress| {
                progress.lock().unwrap().push(p.files_processed);
            }))
            .unwrap();

        assert_eq!(result.total_files, 2);
        let steps = progress.lock().unwrap();
        assert!(!steps.is_empty(), "应该有进度更新");

        std::fs::remove_dir_all(&dir).unwrap();
    }
}