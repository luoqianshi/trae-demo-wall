//! 数据导出/导入命令
//! 支持导出文件列表为 CSV/JSON，从 CSV 导入文件记录

use crate::db;
use serde::Deserialize;
use tauri::State;

/// CSV 导入参数
#[derive(Deserialize)]
pub struct ImportCsvArg {
    pub csv_content: String,
}

/// 导出文件列表为 CSV
#[tauri::command]
pub fn export_files_csv(db: State<'_, db::Database>) -> Result<String, String> {
    let files = db.get_all_files().map_err(|e| e.to_string())?;
    if files.is_empty() {
        return Err("没有文件可导出".to_string());
    }

    let mut csv = String::from("id,path,file_size,mime_type,md5_hash,sha256_hash,created_at,modified_at\n");
    for f in &files {
        let path = if f.path.contains(',') || f.path.contains('"') {
            format!("\"{}\"", f.path.replace('"', "\"\""))
        } else {
            f.path.clone()
        };
        let mime = f.mime_type.as_deref().unwrap_or("");
        csv.push_str(&format!(
            "{},{},{},{},{},{},{},{}\n",
            f.id, path, f.file_size, mime, f.md5_hash, f.sha256_hash, f.created_at, f.modified_at
        ));
    }

    let desktop = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .map(|p| std::path::PathBuf::from(p).join("Desktop"))
        .map_err(|_| "无法获取桌面路径".to_string())?;
    let output_path = desktop.join("files_export.csv");
    std::fs::write(&output_path, &csv).map_err(|e| format!("导出失败: {}", e))?;

    Ok(output_path.to_string_lossy().to_string())
}

/// 导出文件列表为 JSON
#[tauri::command]
pub fn export_files_json(db: State<'_, db::Database>) -> Result<String, String> {
    let files = db.get_all_files().map_err(|e| e.to_string())?;
    if files.is_empty() {
        return Err("没有文件可导出".to_string());
    }

    let json = serde_json::to_string_pretty(&files).map_err(|e| format!("JSON 序列化失败: {}", e))?;

    let desktop = std::env::var("USERPROFILE")
        .or_else(|_| std::env::var("HOME"))
        .map(|p| std::path::PathBuf::from(p).join("Desktop"))
        .map_err(|_| "无法获取桌面路径".to_string())?;
    let output_path = desktop.join("files_export.json");
    std::fs::write(&output_path, &json).map_err(|e| format!("导出失败: {}", e))?;

    Ok(output_path.to_string_lossy().to_string())
}

/// 从 CSV 内容导入文件记录
/// CSV 格式：path,file_size,mime_type,md5_hash,sha256_hash,created_at,modified_at
#[tauri::command]
pub fn import_files_csv(args: ImportCsvArg, db: State<'_, db::Database>) -> Result<usize, String> {
    let mut reader = csv::ReaderBuilder::new()
        .has_headers(true)
        .from_reader(args.csv_content.as_bytes());

    let mut count = 0usize;
    let now = chrono::Utc::now().to_rfc3339();

    for result in reader.records() {
        let record = result.map_err(|e| format!("CSV 解析错误: {}", e))?;
        if record.len() < 7 {
            continue;
        }

        let path = record.get(0).unwrap_or("").to_string();
        let file_size: i64 = record.get(1).unwrap_or("0").parse().unwrap_or(0);
        let mime_type = record.get(2).unwrap_or("").to_string();
        let md5_hash = record.get(3).unwrap_or("").to_string();
        let sha256_hash = record.get(4).unwrap_or("").to_string();
        let created_at = record.get(5).unwrap_or(&now).to_string();
        let modified_at = record.get(6).unwrap_or(&now).to_string();

        let meta = db::FileMetadata {
            id: 0,
            path,
            md5_hash,
            sha256_hash,
            file_size,
            mime_type: if mime_type.is_empty() { None } else { Some(mime_type) },
            created_at,
            modified_at,
            is_deleted: false,
            deleted_at: None,
        };

        db.insert_file(&meta).map_err(|e| e.to_string())?;
        count += 1;
    }

    if count == 0 {
        return Err("没有导入任何记录，请检查 CSV 格式".to_string());
    }
    Ok(count)
}