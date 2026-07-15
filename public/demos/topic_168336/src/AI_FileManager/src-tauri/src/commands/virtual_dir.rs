//! 虚拟目录管理命令

use crate::db;
use tauri::State;

/// 创建虚拟目录
#[tauri::command]
pub fn create_virtual_dir(name: String, parent_id: Option<i64>, db: State<'_, db::Database>) -> Result<i64, String> {
    db.create_virtual_dir(&name, parent_id, false).map_err(|e| e.to_string())
}

/// 获取所有虚拟目录
#[tauri::command]
pub fn get_virtual_dirs(db: State<'_, db::Database>) -> Result<Vec<db::VirtualDirectory>, String> {
    db.get_virtual_dirs().map_err(|e| e.to_string())
}

/// 将文件添加到虚拟目录
#[tauri::command]
pub fn add_file_to_virtual_dir(dir_id: i64, file_id: i64, db: State<'_, db::Database>) -> Result<(), String> {
    db.add_file_to_virtual_dir(dir_id, file_id).map_err(|e| e.to_string())
}

/// 获取虚拟目录中的文件
#[tauri::command]
pub fn get_virtual_dir_files(dir_id: i64, db: State<'_, db::Database>) -> Result<Vec<db::FileMetadata>, String> {
    db.get_virtual_dir_files(dir_id).map_err(|e| e.to_string())
}