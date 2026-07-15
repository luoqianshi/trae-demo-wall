//! 文件监控命令

use crate::monitor;
use std::sync::{Arc, Mutex};

/// 文件监控管理器状态（全局共享）
pub struct MonitorState(pub Arc<Mutex<Option<monitor::FileMonitorManager>>>);

impl MonitorState {
    pub fn new() -> Self {
        Self(Arc::new(Mutex::new(None)))
    }
}

/// 启动文件监控
#[tauri::command]
pub async fn start_monitoring(
    paths: Vec<String>,
    state: tauri::State<'_, MonitorState>,
) -> Result<String, String> {
    let watch_paths: Vec<std::path::PathBuf> = paths.iter().map(std::path::PathBuf::from).collect();
    let config = monitor::FileWatcherConfig {
        watch_paths,
        ..monitor::FileWatcherConfig::default()
    };
    let mut manager = monitor::FileMonitorManager::new(config);
    let _rx = manager.start().await.map_err(|e| e.to_string())?;

    // 将 manager 存入全局状态，防止被丢弃
    {
        let mut guard = state.0.lock().map_err(|e| format!("锁获取失败: {}", e))?;
        *guard = Some(manager);
    }

    Ok("监控已启动".to_string())
}

/// 停止文件监控
#[tauri::command]
pub async fn stop_monitoring(
    state: tauri::State<'_, MonitorState>,
) -> Result<String, String> {
    let manager = {
        let mut guard = state.0.lock().map_err(|e| format!("锁获取失败: {}", e))?;
        guard.take()
    };
    match manager {
        Some(mut m) => {
            m.stop().await.map_err(|e| e.to_string())?;
            Ok("监控已停止".to_string())
        }
        None => Err("监控未启动".to_string()),
    }
}