//! 标签管理 Tauri 命令
//! 标签 CRUD、文件标签关联操作

use crate::db;
use tauri::State;

/// 创建标签
#[tauri::command]
pub fn create_tag(db: State<'_, db::Database>, name: String, color: String) -> Result<db::Tag, String> {
    let conn = db.conn.lock().map_err(|e| format!("数据库锁获取失败: {}", e))?;
    db::tags::create_tag(&conn, &name, &color)
}

/// 获取所有标签
#[tauri::command]
pub fn get_all_tags(db: State<'_, db::Database>) -> Result<Vec<db::Tag>, String> {
    let conn = db.conn.lock().map_err(|e| format!("数据库锁获取失败: {}", e))?;
    db::tags::get_all_tags(&conn)
}

/// 更新标签
#[tauri::command]
pub fn update_tag(db: State<'_, db::Database>, id: i64, name: String, color: String) -> Result<db::Tag, String> {
    let conn = db.conn.lock().map_err(|e| format!("数据库锁获取失败: {}", e))?;
    db::tags::update_tag(&conn, id, &name, &color)
}

/// 删除标签
#[tauri::command]
pub fn delete_tag(db: State<'_, db::Database>, id: i64) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| format!("数据库锁获取失败: {}", e))?;
    db::tags::delete_tag(&conn, id)
}

/// 给文件添加标签
#[tauri::command]
pub fn add_tag_to_file(db: State<'_, db::Database>, file_id: i64, tag_id: i64) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| format!("数据库锁获取失败: {}", e))?;
    db::tags::add_tag_to_file(&conn, file_id, tag_id)
}

/// 移除文件标签
#[tauri::command]
pub fn remove_tag_from_file(db: State<'_, db::Database>, file_id: i64, tag_id: i64) -> Result<(), String> {
    let conn = db.conn.lock().map_err(|e| format!("数据库锁获取失败: {}", e))?;
    db::tags::remove_tag_from_file(&conn, file_id, tag_id)
}

/// 获取文件的标签列表
#[tauri::command]
pub fn get_file_tags(db: State<'_, db::Database>, file_id: i64) -> Result<Vec<db::Tag>, String> {
    let conn = db.conn.lock().map_err(|e| format!("数据库锁获取失败: {}", e))?;
    db::tags::get_file_tags(&conn, file_id)
}

/// 按标签查询文件 ID 列表
#[tauri::command]
pub fn get_files_by_tag(db: State<'_, db::Database>, tag_id: i64) -> Result<Vec<i64>, String> {
    let conn = db.conn.lock().map_err(|e| format!("数据库锁获取失败: {}", e))?;
    db::tags::get_files_by_tag(&conn, tag_id)
}