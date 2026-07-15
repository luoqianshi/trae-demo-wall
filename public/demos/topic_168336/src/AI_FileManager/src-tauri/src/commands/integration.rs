//! 系统集成命令

use crate::integration;

/// 检查系统集成状态
#[tauri::command]
pub fn check_integration() -> Result<integration::IntegrationStatus, String> {
    let manager = integration::IntegrationManager::new();
    Ok(manager.check_integration())
}

/// 安装系统集成
#[tauri::command]
pub fn install_integration() -> Result<String, String> {
    let manager = integration::IntegrationManager::new();
    manager.install()?;
    Ok("系统集成安装完成".to_string())
}

/// 卸载系统集成
#[tauri::command]
pub fn uninstall_integration() -> Result<String, String> {
    let manager = integration::IntegrationManager::new();
    manager.uninstall()?;
    Ok("系统集成卸载完成".to_string())
}