//! 文件扫描与重复检测命令

use crate::db;
use crate::scanner;
use crate::ScanCancelFlag;
use std::path::Path;
use std::sync::atomic::Ordering;
use tauri::{Emitter, State};

/// 扫描目录
#[tauri::command]
pub fn scan_directory(path: String, db: State<'_, db::Database>) -> Result<scanner::ScanResult, String> {
    let scanner = scanner::FileScanner::new();
    scanner.scan_directory(Path::new(&path), &db, None::<&dyn Fn(&scanner::ScanProgress)>)
        .map_err(|e| e.to_string())
}

/// 扫描目录（带进度上报）
#[tauri::command]
pub fn scan_directory_with_progress(
    path: String,
    app: tauri::AppHandle,
    db: State<'_, db::Database>,
    cancel_flag: State<'_, ScanCancelFlag>,
) -> Result<scanner::ScanResult, String> {
    // 重置取消标记
    cancel_flag.0.store(false, Ordering::Relaxed);

    let scanner = scanner::FileScanner::new()
        .with_cancel(cancel_flag.0.clone());
    scanner.scan_directory(
        Path::new(&path),
        &db,
        Some(&|progress: &scanner::ScanProgress| {
            let _ = app.emit("scan-progress", progress);
        }),
    )
    .map_err(|e| e.to_string())
}

/// 取消扫描
#[tauri::command]
pub fn cancel_scan(cancel_flag: State<'_, ScanCancelFlag>) -> Result<(), String> {
    cancel_flag.0.store(true, Ordering::Relaxed);
    Ok(())
}

/// 获取重复文件
#[tauri::command]
pub fn get_duplicates(db: State<'_, db::Database>) -> Result<Vec<scanner::DuplicateGroup>, String> {
    scanner::duplicate::find_duplicates(&db).map_err(|e| e.to_string())
}

/// 获取文件统计信息
#[tauri::command]
pub fn get_statistics(db: State<'_, db::Database>) -> Result<scanner::FileStatistics, String> {
    scanner::statistics::get_statistics(&db).map_err(|e| e.to_string())
}