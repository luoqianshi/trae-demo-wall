//! AI 智能分类命令

use crate::classifier;
use crate::db;
use tauri::State;

/// 对数据库中的文件进行 AI 智能分类
#[tauri::command]
pub fn classify_files(
    db: State<'_, db::Database>,
    eps: Option<f64>,
    min_samples: Option<usize>,
) -> Result<Vec<classifier::Category>, String> {
    let files = db.get_all_files().map_err(|e| e.to_string())?;

    let file_values: Vec<serde_json::Value> = files
        .iter()
        .map(|f| {
            serde_json::json!({
                "id": f.id,
                "path": f.path,
                "mime_type": f.mime_type,
                "file_size": f.file_size,
            })
        })
        .collect();

    if file_values.is_empty() {
        return Ok(Vec::new());
    }

    let classifier = classifier::FileClassifier::new();
    let result = classifier.classify(
        &file_values,
        eps.unwrap_or(0.3),
        min_samples.unwrap_or(2),
    )?;

    // 自动创建虚拟目录并关联文件
    for category in &result.categories {
        let dir_id = db.create_virtual_dir(&category.name, None, true)
            .map_err(|e| e.to_string())?;
        for file_id in &category.files {
            let _ = db.add_file_to_virtual_dir(dir_id, *file_id);
        }
    }

    Ok(result.categories)
}

/// 获取分类结果（不执行分类，只查询已存在的 AI 虚拟目录）
#[tauri::command]
pub fn get_classification_results(
    db: State<'_, db::Database>,
) -> Result<Vec<db::VirtualDirectory>, String> {
    let all = db.get_virtual_dirs().map_err(|e| e.to_string())?;
    Ok(all.into_iter().filter(|d| d.ai_generated).collect())
}