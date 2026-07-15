//! 最近文件 Tauri 命令
//! 记录和查询最近访问的文件

use crate::db;
use tauri::State;

/// 记录文件访问
#[tauri::command]
pub fn record_file_access(
    db: State<'_, db::Database>,
    file_id: i64,
    action_type: String,
) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| format!("数据库锁获取失败: {}", e))?;
    db::recent_files::record_access(&conn, file_id, &action_type)
}

/// 获取最近文件列表
#[tauri::command]
pub fn get_recent_files(
    db: State<'_, db::Database>,
    limit: usize,
) -> Result<Vec<db::recent_files::RecentFileEntry>, String> {
    let conn = db.conn.lock().map_err(|e| format!("数据库锁获取失败: {}", e))?;
    db::recent_files::get_recent_files(&conn, limit)
}