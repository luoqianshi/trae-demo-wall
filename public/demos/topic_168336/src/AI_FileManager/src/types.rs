//! 前端数据模型定义
//! 与后端 Tauri 命令共享的数据结构

use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct FileStatistics {
    pub total_files: i64,
    pub total_size: i64,
    pub duplicate_files: i64,
    pub duplicate_groups: i64,
    pub space_saved: i64,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct ScanResult {
    pub total_files: usize,
    pub total_size: i64,
    pub scanned_path: String,
    pub duration_ms: u64,
    pub new_files: usize,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ScanProgress {
    pub scanned_path: String,
    pub files_found: usize,
    pub files_processed: usize,
    pub total_size: i64,
    pub current_file: String,
    pub is_finished: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DuplicateGroup {
    pub md5_hash: String,
    pub sha256_hash: String,
    pub file_size: i64,
    pub files: Vec<FileMetadata>,
    pub group_id: usize,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
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

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VirtualDirectory {
    pub id: i64,
    pub name: String,
    pub parent_id: Option<i64>,
    pub ai_generated: bool,
    pub created_at: String,
}

#[derive(Serialize, Deserialize)]
pub struct PathArg<'a> {
    pub path: &'a str,
}

#[derive(Serialize, Deserialize)]
pub struct CreateDirArg<'a> {
    pub name: &'a str,
    pub parent_id: Option<i64>,
}

#[derive(Serialize, Deserialize)]
pub struct AddFileArg {
    pub dir_id: i64,
    pub file_id: i64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
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

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct DeleteQueueItem {
    pub id: i64,
    pub record_id: i64,
    pub status: String,
    pub created_at: String,
    pub processed_at: Option<String>,
}

/// 分类结果中的类别
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ClassificationCategory {
    pub name: String,
    pub files: Vec<i64>,
}

/// 系统集成状态
#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct IntegrationStatus {
    pub integrated: bool,
    pub shell_extension: bool,
    pub file_monitor: bool,
    pub context_menu: bool,
    pub platform: String,
}

/// 标签数据
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Tag {
    pub id: i64,
    pub name: String,
    pub color: String,
    pub created_at: String,
    pub file_count: i64,
}

/// 最近文件条目
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct RecentFileEntry {
    pub id: i64,
    pub file_id: i64,
    pub accessed_at: String,
    pub action_type: String,
    pub file_path: String,
    pub file_size: i64,
    pub mime_type: Option<String>,
}

/// 页面枚举
#[derive(Clone, PartialEq)]
pub enum Page {
    Dashboard,
    Scanner,
    Duplicates,
    VirtualDirs,
    Deletion,
    Classification,
    Integration,
    Search,
    Settings,
    Tags,
    RecentFiles,
    BatchOps,
    SortFilter,
    FileOps,
    DataIO,
}

#[derive(Serialize, Deserialize)]
pub struct CreateTagArg<'a> {
    pub name: &'a str,
    pub color: &'a str,
}

#[derive(Serialize, Deserialize)]
pub struct BatchDeleteArg {
    pub file_ids: Vec<i64>,
}

#[derive(Serialize, Deserialize)]
pub struct BatchMoveArg {
    pub file_ids: Vec<i64>,
    pub target_dir: String,
}

#[derive(Serialize, Deserialize)]
pub struct SortFilterArgs {
    pub sort_by: String,
    pub sort_order: String,
    pub filter_ext: Option<String>,
    pub filter_min_size: Option<i64>,
    pub filter_max_size: Option<i64>,
}

#[derive(Serialize, Deserialize)]
pub struct RenameArg {
    pub file_id: i64,
    pub new_name: String,
}

#[derive(Serialize, Deserialize)]
pub struct CopyFileArg {
    pub file_id: i64,
    pub dest_dir: String,
}

#[derive(Serialize, Deserialize)]
pub struct CreateFileArg {
    pub parent_dir: String,
    pub name: String,
}

#[derive(Serialize, Deserialize)]
pub struct CreateDirArg2 {
    pub parent_dir: String,
    pub name: String,
}

#[derive(Serialize, Deserialize)]
pub struct ImportCsvArg {
    pub csv_content: String,
}

#[derive(Serialize, Deserialize)]
pub struct AdvancedSearchArg {
    pub query: Option<String>,
    pub ext: Option<String>,
    pub min_size: Option<i64>,
    pub max_size: Option<i64>,
    pub created_after: Option<String>,
    pub created_before: Option<String>,
    pub modified_after: Option<String>,
    pub modified_before: Option<String>,
    pub hash: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default, PartialEq)]
pub struct PaginatedFiles {
    pub files: Vec<FileMetadata>,
    pub total: i64,
    pub page: i64,
    pub page_size: i64,
    pub total_pages: i64,
}

#[derive(Serialize, Deserialize)]
pub struct PaginationArg {
    pub page: i64,
    pub page_size: i64,
}