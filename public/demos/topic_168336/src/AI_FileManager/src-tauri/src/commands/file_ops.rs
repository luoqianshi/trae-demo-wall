//! 文件操作命令（搜索、打开位置、导出）

use crate::db;
use crate::scanner;
use serde::Deserialize;
use tauri::State;

/// 排序过滤参数
#[derive(Deserialize)]
pub struct SortFilterArgs {
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
    pub filter_ext: Option<String>,
    pub filter_min_size: Option<i64>,
    pub filter_max_size: Option<i64>,
}

/// 搜索文件（按路径模糊匹配）
#[tauri::command]
pub fn search_files(query: String, db: State<'_, db::Database>) -> Result<Vec<db::FileMetadata>, String> {
    db.search_files(&query).map_err(|e| e.to_string())
}

/// 高级搜索文件参数
#[derive(Deserialize)]
pub struct AdvancedSearchArgs {
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

/// 高级搜索文件
#[tauri::command]
pub fn advanced_search_files(
    args: AdvancedSearchArgs,
    db: State<'_, db::Database>,
) -> Result<Vec<db::FileMetadata>, String> {
    db.advanced_search(
        args.query.as_deref(),
        args.ext.as_deref(),
        args.min_size,
        args.max_size,
        args.created_after.as_deref(),
        args.created_before.as_deref(),
        args.modified_after.as_deref(),
        args.modified_before.as_deref(),
        args.hash.as_deref(),
    )
    .map_err(|e| e.to_string())
}

/// 打开文件所在位置（系统文件管理器）
#[tauri::command]
pub fn open_file_location(path: String) -> Result<String, String> {
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg("/select,")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("打开文件位置失败: {}", e))?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg("-R")
            .arg(&path)
            .spawn()
            .map_err(|e| format!("打开文件位置失败: {}", e))?;
    }
    #[cfg(target_os = "linux")]
    {
        let parent = std::path::Path::new(&path).parent()
            .ok_or_else(|| "无法获取文件父目录".to_string())?;
        std::process::Command::new("xdg-open")
            .arg(parent)
            .spawn()
            .map_err(|e| format!("打开文件位置失败: {}", e))?;
    }

    Ok("已打开文件位置".to_string())
}

/// 获取排序过滤后的文件列表
#[tauri::command]
pub fn get_files_sorted(
    args: SortFilterArgs,
    db: State<'_, db::Database>,
) -> Result<Vec<db::FileMetadata>, String> {
    db.get_files_sorted(
        args.sort_by.as_deref().unwrap_or("path"),
        args.sort_order.as_deref().unwrap_or("asc"),
        args.filter_ext.as_deref(),
        args.filter_min_size.unwrap_or(0),
        args.filter_max_size.unwrap_or(0),
    )
    .map_err(|e| e.to_string())
}

/// 分页参数
#[derive(Deserialize)]
pub struct PaginationArgs {
    pub page: i64,
    pub page_size: i64,
}

/// 排序过滤分页参数
#[derive(Deserialize)]
pub struct SortFilterPaginationArgs {
    pub sort_by: Option<String>,
    pub sort_order: Option<String>,
    pub filter_ext: Option<String>,
    pub filter_min_size: Option<i64>,
    pub filter_max_size: Option<i64>,
    pub page: i64,
    pub page_size: i64,
}

/// 获取分页文件列表
#[tauri::command]
pub fn get_files_paginated(
    args: PaginationArgs,
    db: State<'_, db::Database>,
) -> Result<db::PaginatedFiles, String> {
    db.get_files_paginated(args.page, args.page_size)
        .map_err(|e| e.to_string())
}

/// 获取排序过滤后的分页文件列表
#[tauri::command]
pub fn get_files_sorted_paginated(
    args: SortFilterPaginationArgs,
    db: State<'_, db::Database>,
) -> Result<db::PaginatedFiles, String> {
    db.get_files_sorted_paginated(
        args.sort_by.as_deref().unwrap_or("path"),
        args.sort_order.as_deref().unwrap_or("asc"),
        args.filter_ext.as_deref(),
        args.filter_min_size.unwrap_or(0),
        args.filter_max_size.unwrap_or(0),
        args.page,
        args.page_size,
    )
    .map_err(|e| e.to_string())
}

/// 导出重复文件列表到 CSV
#[tauri::command]
pub fn export_duplicates_csv(db: State<'_, db::Database>) -> Result<String, String> {
    let groups = scanner::duplicate::find_duplicates(&db).map_err(|e| e.to_string())?;
    if groups.is_empty() {
        return Err("没有重复文件可导出".to_string());
    }

    let mut csv = String::from("组ID,文件路径,文件大小,SHA256,MD5\n");
    for group in &groups {
        for file in &group.files {
            // CSV 转义：路径中的逗号需用引号包裹
            let path = if file.path.contains(',') {
                format!("\"{}\"", file.path)
            } else {
                file.path.clone()
            };
            csv.push_str(&format!(
                "{},{},{},{},{}\n",
                group.group_id,
                path,
                file.file_size,
                file.sha256_hash,
                file.md5_hash,
            ));
        }
    }

    // 保存到桌面
    let desktop = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .map(|p| std::path::PathBuf::from(p).join("Desktop"))
        .map_err(|_| "无法获取桌面路径".to_string())?;
    let output_path = desktop.join("duplicates_export.csv");
    std::fs::write(&output_path, &csv).map_err(|e| format!("导出失败: {}", e))?;

    Ok(output_path.to_string_lossy().to_string())
}