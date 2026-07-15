//! 文件操作增强命令
//! 支持重命名、复制、创建文件/目录

use crate::db;
use serde::Deserialize;
use tauri::State;
use std::path::Path;

/// 重命名文件参数
#[derive(Deserialize)]
pub struct RenameArg {
    pub file_id: i64,
    pub new_name: String,
}

/// 复制文件参数
#[derive(Deserialize)]
pub struct CopyFileArg {
    pub file_id: i64,
    pub dest_dir: String,
}

/// 创建文件参数
#[derive(Deserialize)]
pub struct CreateFileArg {
    pub parent_dir: String,
    pub name: String,
}

/// 创建目录参数
#[derive(Deserialize)]
pub struct CreateDirArg {
    pub parent_dir: String,
    pub name: String,
}

/// 重命名文件
#[tauri::command]
pub fn rename_file(args: RenameArg, db: State<'_, db::Database>) -> Result<String, String> {
    let file = db.get_file_by_id(args.file_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("文件 {} 不存在", args.file_id))?;

    let old_path = Path::new(&file.path);
    let parent = old_path.parent()
        .ok_or_else(|| "无法获取文件父目录".to_string())?;
    let new_path = parent.join(&args.new_name);

    // 检查目标是否已存在
    if new_path.exists() {
        return Err(format!("目标文件已存在: {}", new_path.display()));
    }

    std::fs::rename(&file.path, &new_path)
        .map_err(|e| format!("重命名失败: {}", e))?;

    let new_path_str = new_path.to_string_lossy().to_string();
    db.update_file_path(args.file_id, &new_path_str)
        .map_err(|e| e.to_string())?;

    Ok(new_path_str)
}

/// 复制文件到目标目录
#[tauri::command]
pub fn copy_file(args: CopyFileArg, db: State<'_, db::Database>) -> Result<String, String> {
    let file = db.get_file_by_id(args.file_id)
        .map_err(|e| e.to_string())?
        .ok_or_else(|| format!("文件 {} 不存在", args.file_id))?;

    let dest_dir = Path::new(&args.dest_dir);
    if !dest_dir.is_dir() {
        return Err(format!("目标目录不存在: {}", args.dest_dir));
    }

    let source_path = Path::new(&file.path);
    let file_name = source_path.file_name()
        .ok_or_else(|| "无法获取文件名".to_string())?;
    let dest_path = dest_dir.join(file_name);

    if dest_path.exists() {
        return Err(format!("目标文件已存在: {}", dest_path.display()));
    }

    std::fs::copy(&file.path, &dest_path)
        .map_err(|e| format!("复制失败: {}", e))?;

    let new_path_str = dest_path.to_string_lossy().to_string();

    // 插入新文件记录到数据库
    let new_meta = db::FileMetadata {
        id: 0,
        path: new_path_str.clone(),
        md5_hash: file.md5_hash.clone(),
        sha256_hash: file.sha256_hash.clone(),
        file_size: file.file_size,
        mime_type: file.mime_type.clone(),
        created_at: file.created_at.clone(),
        modified_at: chrono::Utc::now().to_rfc3339(),
        is_deleted: false,
        deleted_at: None,
    };
    db.insert_file(&new_meta).map_err(|e| e.to_string())?;

    Ok(new_path_str)
}

/// 创建空文件
#[tauri::command]
pub fn create_file(args: CreateFileArg, db: State<'_, db::Database>) -> Result<String, String> {
    let parent_dir = Path::new(&args.parent_dir);
    if !parent_dir.is_dir() {
        return Err(format!("父目录不存在: {}", args.parent_dir));
    }

    let file_path = parent_dir.join(&args.name);
    if file_path.exists() {
        return Err(format!("文件已存在: {}", file_path.display()));
    }

    std::fs::write(&file_path, "")
        .map_err(|e| format!("创建文件失败: {}", e))?;

    let path_str = file_path.to_string_lossy().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    let meta = db::FileMetadata {
        id: 0,
        path: path_str.clone(),
        md5_hash: String::new(),
        sha256_hash: String::new(),
        file_size: 0,
        mime_type: None,
        created_at: now.clone(),
        modified_at: now,
        is_deleted: false,
        deleted_at: None,
    };
    db.insert_file(&meta).map_err(|e| e.to_string())?;

    Ok(path_str)
}

/// 创建目录
#[tauri::command]
pub fn create_directory(args: CreateDirArg) -> Result<String, String> {
    let parent_dir = Path::new(&args.parent_dir);
    if !parent_dir.is_dir() {
        return Err(format!("父目录不存在: {}", args.parent_dir));
    }

    let dir_path = parent_dir.join(&args.name);
    if dir_path.exists() {
        return Err(format!("目录已存在: {}", dir_path.display()));
    }

    std::fs::create_dir(&dir_path)
        .map_err(|e| format!("创建目录失败: {}", e))?;

    Ok(dir_path.to_string_lossy().to_string())
}

/// 获取所有文件（用于前端批量操作等）
#[tauri::command]
pub fn get_all_files(db: State<'_, db::Database>) -> Result<Vec<db::FileMetadata>, String> {
    db.get_all_files().map_err(|e| e.to_string())
}