//! 删除管理命令

use crate::db;
use tauri::State;

/// 删除文件：标记为已删除并创建删除记录
#[tauri::command]
pub fn delete_file(file_id: i64, reason: Option<String>, db: State<'_, db::Database>) -> Result<i64, String> {
    // 获取文件信息
    let file = db.get_file_by_id(file_id).map_err(|e| e.to_string())?
        .ok_or_else(|| "文件不存在".to_string())?;

    let record = db::DeletionRecord {
        id: 0,
        file_id: file.id,
        file_path: file.path.clone(),
        md5_hash: file.md5_hash.clone(),
        sha256_hash: file.sha256_hash.clone(),
        file_size: file.file_size,
        deleted_at: chrono::Utc::now().to_rfc3339(),
        reason,
        is_physical_deleted: false,
        physical_deleted_at: None,
    };

    let record_id = db.insert_deletion_record(&record).map_err(|e| e.to_string())?;
    db.mark_file_deleted(file_id).map_err(|e| e.to_string())?;

    // 自动加入删除队列
    let queue_id = db.add_to_delete_queue(record_id).map_err(|e| e.to_string())?;
    Ok(queue_id)
}

/// 获取删除记录列表
#[tauri::command]
pub fn get_deletion_records(db: State<'_, db::Database>) -> Result<Vec<db::DeletionRecord>, String> {
    db.get_deletion_records().map_err(|e| e.to_string())
}

/// 获取删除队列
#[tauri::command]
pub fn get_delete_queue(status: Option<String>, db: State<'_, db::Database>) -> Result<Vec<db::DeleteQueueItem>, String> {
    db.get_delete_queue(status.as_deref()).map_err(|e| e.to_string())
}

/// 物理删除队列中的文件
#[tauri::command]
pub fn process_delete_queue(db: State<'_, db::Database>) -> Result<usize, String> {
    let queue = db.get_delete_queue(Some("pending")).map_err(|e| e.to_string())?;
    let mut processed = 0usize;

    for item in &queue {
        // 获取删除记录
        let record = db.get_deletion_record_by_id(item.record_id).map_err(|e| e.to_string())?;
        if let Some(record) = record {
            // 物理删除文件
            match std::fs::remove_file(&record.file_path) {
                Ok(_) => {
                    db.mark_physical_deleted(record.id).map_err(|e| e.to_string())?;
                    db.update_queue_status(item.id, "processed").map_err(|e| e.to_string())?;
                    processed += 1;
                }
                Err(e) => {
                    // 文件可能已被手动删除，仍标记为已处理
                    if e.kind() == std::io::ErrorKind::NotFound {
                        db.mark_physical_deleted(record.id).map_err(|e| e.to_string())?;
                        db.update_queue_status(item.id, "processed").map_err(|e| e.to_string())?;
                        processed += 1;
                    }
                    // 其他错误跳过
                }
            }
        }
    }
    Ok(processed)
}

/// 恢复已删除的文件标记
#[tauri::command]
pub fn restore_file(file_id: i64, db: State<'_, db::Database>) -> Result<(), String> {
    db.restore_file(file_id).map_err(|e| e.to_string())
}