//! 数据库初始化命令

use crate::db;
use tauri::Manager;
use tauri::State;

/// 初始化数据库
#[tauri::command]
pub fn init_database(app_handle: tauri::AppHandle) -> Result<String, String> {
    let app_dir = app_handle.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;
    let db_path = app_dir.join("ai_filemanager.db");
    let database = db::Database::open(&db_path).map_err(|e| e.to_string())?;
    app_handle.manage(database);
    Ok(db_path.to_string_lossy().to_string())
}

/// 获取数据库路径
#[tauri::command]
pub fn get_db_path(db: State<'_, db::Database>) -> Result<String, String> {
    Ok(db.db_path.clone())
}