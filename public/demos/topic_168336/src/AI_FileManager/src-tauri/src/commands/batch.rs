//! 批量操作命令
//! 支持批量删除、批量移动文件

use crate::db;
use tauri::State;

/// 批量删除文件（逻辑删除）
/// 接收文件 ID 列表，逐个标记为已删除并创建删除记录
#[tauri::command]
pub fn batch_delete_files(file_ids: Vec<i64>, db: State<'_, db::Database>) -> Result<usize, String> {
    let mut count = 0usize;
    for file_id in &file_ids {
        let file = db.get_file_by_id(*file_id).map_err(|e| e.to_string())?
            .ok_or_else(|| format!("文件 {} 不存在", file_id))?;

        let record = db::DeletionRecord {
            id: 0,
            file_id: file.id,
            file_path: file.path.clone(),
            md5_hash: file.md5_hash.clone(),
            sha256_hash: file.sha256_hash.clone(),
            file_size: file.file_size,
            deleted_at: chrono::Utc::now().to_rfc3339(),
            reason: Some("批量删除".to_string()),
            is_physical_deleted: false,
            physical_deleted_at: None,
        };

        let record_id = db.insert_deletion_record(&record).map_err(|e| e.to_string())?;
        db.mark_file_deleted(*file_id).map_err(|e| e.to_string())?;
        db.add_to_delete_queue(record_id).map_err(|e| e.to_string())?;
        count += 1;
    }
    Ok(count)
}

/// 批量移动文件到指定目录
/// 接收文件 ID 列表和目标目录路径，更新文件路径
#[tauri::command]
pub fn batch_move_files(file_ids: Vec<i64>, target_dir: String, db: State<'_, db::Database>) -> Result<usize, String> {
    let target = std::path::Path::new(&target_dir);
    if !target.exists() {
        return Err(format!("目标目录不存在: {}", target_dir));
    }
    if !target.is_dir() {
        return Err(format!("目标路径不是目录: {}", target_dir));
    }

    let mut count = 0usize;
    for file_id in &file_ids {
        let file = db.get_file_by_id(*file_id).map_err(|e| e.to_string())?
            .ok_or_else(|| format!("文件 {} 不存在", file_id))?;

        let source_path = std::path::Path::new(&file.path);
        let file_name = source_path.file_name()
            .ok_or_else(|| format!("无法获取文件名: {}", file.path))?;
        let dest_path = target.join(file_name);

        // 执行文件移动
        std::fs::rename(&file.path, &dest_path)
            .map_err(|e| format!("移动文件失败: {} -> {:?}: {}", file.path, dest_path, e))?;

        // 更新数据库中的路径
        let new_path = dest_path.to_string_lossy().to_string();
        db.update_file_path(*file_id, &new_path).map_err(|e| e.to_string())?;
        count += 1;
    }
    Ok(count)
}