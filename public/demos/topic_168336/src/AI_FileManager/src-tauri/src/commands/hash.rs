//! 哈希计算命令

use crate::hash;
use std::path::Path;

/// 计算文件哈希
#[tauri::command]
pub fn calculate_hashes(path: String) -> Result<hash::FileHashes, String> {
    let calculator = hash::HashCalculator::new();
    calculator.calculate_hashes(Path::new(&path)).map_err(|e| e.to_string())
}