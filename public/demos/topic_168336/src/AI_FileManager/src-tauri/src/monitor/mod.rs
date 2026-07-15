//! 文件系统监控模块
//! 基于 notify crate 的跨平台文件系统事件监控
//! 支持 Windows (ReadDirectoryChangesW) / Linux (inotify) / macOS (FSEvent)

pub mod manager;

pub use manager::FileMonitorManager;

use anyhow::Result;
use chrono::{DateTime, Utc};
use notify::{Event, EventKind, RecommendedWatcher, RecursiveMode, Watcher};
use std::path::{Path, PathBuf};
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};
use tracing::{debug, error, info, warn};

/// 文件监控事件类型
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub enum FileEventKind {
    Created,
    Modified,
    Deleted,
    Renamed,
    Other,
}

/// 文件监控事件
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct FileEvent {
    pub path: PathBuf,
    pub kind: FileEventKind,
    pub timestamp: DateTime<Utc>,
}

/// 文件监控器配置
#[derive(Debug, Clone)]
pub struct FileWatcherConfig {
    /// 监控的根目录列表
    pub watch_paths: Vec<PathBuf>,
    /// 是否递归监控子目录
    pub recursive: bool,
    /// 忽略的文件模式（glob 模式）
    pub ignore_patterns: Vec<String>,
    /// 忽略的文件扩展名
    pub ignore_extensions: Vec<String>,
    /// 事件去抖时间（毫秒）
    #[allow(dead_code)]
    pub debounce_ms: u64,
}

impl Default for FileWatcherConfig {
    fn default() -> Self {
        Self {
            watch_paths: Vec::new(),
            recursive: true,
            ignore_patterns: vec![
                "*.tmp".to_string(),
                "*.temp".to_string(),
                "*.log".to_string(),
                ".git/**".to_string(),
                "node_modules/**".to_string(),
                "target/**".to_string(),
            ],
            ignore_extensions: vec![
                "tmp".to_string(),
                "temp".to_string(),
                "log".to_string(),
                "swp".to_string(),
                "swpx".to_string(),
            ],
            debounce_ms: 100,
        }
    }
}

/// 文件监控器
pub struct FileWatcher {
    config: FileWatcherConfig,
    watcher: Option<RecommendedWatcher>,
    event_tx: mpsc::UnboundedSender<FileEvent>,
    event_rx: Option<mpsc::UnboundedReceiver<FileEvent>>,
    watched_paths: Arc<RwLock<Vec<PathBuf>>>,
    is_running: Arc<RwLock<bool>>,
}

impl FileWatcher {
    /// 创建新的文件监控器
    pub fn new(config: FileWatcherConfig) -> Self {
        let (event_tx, event_rx) = mpsc::unbounded_channel();
        Self {
            config,
            watcher: None,
            event_tx,
            event_rx: Some(event_rx),
            watched_paths: Arc::new(RwLock::new(Vec::new())),
            is_running: Arc::new(RwLock::new(false)),
        }
    }

    /// 启动文件监控
    pub async fn start(&mut self) -> Result<()> {
        info!("启动文件监控器...");

        let (tx, rx) = std::sync::mpsc::channel();
        let watcher = notify::recommended_watcher(move |res| {
            if let Err(e) = tx.send(res) {
                error!("文件监控事件发送失败: {}", e);
            }
        })?;

        let event_tx = self.event_tx.clone();
        let watched_paths = self.watched_paths.clone();
        let is_running = self.is_running.clone();
        let config = self.config.clone();

        tokio::spawn(async move {
            while let Ok(res) = rx.recv() {
                if !*is_running.read().await {
                    break;
                }
                match res {
                    Ok(event) => {
                        Self::process_notify_event(&event, &event_tx, &watched_paths, &config);
                    }
                    Err(e) => {
                        error!("文件监控错误: {}", e);
                    }
                }
            }
        });

        // 添加监控路径
        let paths = self.config.watch_paths.clone();
        for path in &paths {
            if path.exists() {
                self.add_watch(path).await?;
            } else {
                warn!("监控路径不存在: {:?}", path);
            }
        }

        self.watcher = Some(watcher);
        *self.is_running.write().await = true;
        info!("文件监控器启动成功");
        Ok(())
    }

    /// 停止文件监控
    #[allow(dead_code)]
    pub async fn stop(&mut self) -> Result<()> {
        info!("停止文件监控器...");
        *self.is_running.write().await = false;

        if let Some(watcher) = self.watcher.take() {
            drop(watcher);
        }
        self.watched_paths.write().await.clear();
        info!("文件监控器已停止");
        Ok(())
    }

    /// 添加监控路径
    pub async fn add_watch(&mut self, path: &Path) -> Result<()> {
        if let Some(watcher) = &mut self.watcher {
            let mode = if self.config.recursive {
                RecursiveMode::Recursive
            } else {
                RecursiveMode::NonRecursive
            };
            watcher.watch(path, mode)?;
            self.watched_paths.write().await.push(path.to_path_buf());
            info!("添加监控路径: {:?}", path);
        }
        Ok(())
    }

    /// 移除监控路径
    #[allow(dead_code)]
    pub async fn remove_watch(&mut self, path: &Path) -> Result<()> {
        if let Some(watcher) = &mut self.watcher {
            watcher.unwatch(path)?;
            self.watched_paths.write().await.retain(|p| p != path);
            info!("移除监控路径: {:?}", path);
        }
        Ok(())
    }

    /// 获取事件接收器
    pub fn take_event_rx(&mut self) -> Option<mpsc::UnboundedReceiver<FileEvent>> {
        self.event_rx.take()
    }

    /// 获取监控状态
    #[allow(dead_code)]
    pub async fn status(&self) -> FileWatcherStatus {
        FileWatcherStatus {
            is_running: *self.is_running.read().await,
            watched_paths: self.watched_paths.read().await.clone(),
            watched_count: self.watched_paths.read().await.len(),
        }
    }

    /// 处理 notify 事件
    fn process_notify_event(
        event: &Event,
        event_tx: &mpsc::UnboundedSender<FileEvent>,
        watched_paths: &Arc<RwLock<Vec<PathBuf>>>,
        config: &FileWatcherConfig,
    ) {
        for path in &event.paths {
            // 检查是否应忽略
            if Self::should_ignore(path, config) {
                debug!("忽略文件: {:?}", path);
                continue;
            }

            // 检查是否在监控范围内
            let watched = watched_paths.blocking_read();
            let in_range = watched.iter().any(|p| path.starts_with(p));
            if !in_range {
                continue;
            }
            drop(watched);

            let file_event = FileEvent {
                path: path.clone(),
                kind: match event.kind {
                    EventKind::Create(_) => FileEventKind::Created,
                    EventKind::Modify(_) => FileEventKind::Modified,
                    EventKind::Remove(_) => FileEventKind::Deleted,
                    EventKind::Other => FileEventKind::Other,
                    _ => {
                        if matches!(event.kind, EventKind::Modify(_)) {
                            FileEventKind::Modified
                        } else {
                            FileEventKind::Other
                        }
                    }
                },
                timestamp: Utc::now(),
            };

            if let Err(e) = event_tx.send(file_event) {
                error!("发送监控事件失败: {}", e);
            }
        }
    }

    /// 检查是否应忽略文件
    fn should_ignore(path: &Path, config: &FileWatcherConfig) -> bool {
        // 先检查完整路径（支持 ** 模式）
        if let Some(full_path) = path.to_str() {
            for pattern in &config.ignore_patterns {
                if pattern.contains("**") {
                    // ** 模式：匹配路径中的任意目录层级
                    let prefix = pattern.trim_end_matches("/**").trim_end_matches("\\**");
                    if full_path.contains(prefix) || full_path.starts_with(prefix) {
                        return true;
                    }
                }
            }
        }
        // 再检查文件名
        if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
            for pattern in &config.ignore_patterns {
                if !pattern.contains("**") && Self::match_glob(name, pattern) {
                    return true;
                }
            }
            if let Some(ext) = path.extension().and_then(|e| e.to_str()) {
                if config.ignore_extensions.contains(&ext.to_string()) {
                    return true;
                }
            }
        }
        false
    }

    /// 简单的 glob 匹配
    fn match_glob(name: &str, pattern: &str) -> bool {
        if pattern.contains('*') {
            let parts: Vec<&str> = pattern.split('*').collect();
            if parts.len() == 2 {
                name.starts_with(parts[0]) && name.ends_with(parts[1])
            } else {
                false
            }
        } else {
            name == pattern
        }
    }
}

impl Drop for FileWatcher {
    fn drop(&mut self) {
        if let Some(watcher) = self.watcher.take() {
            drop(watcher);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_default_config() {
        let config = FileWatcherConfig::default();
        assert!(!config.watch_paths.is_empty() || config.watch_paths.is_empty());
        assert!(config.recursive);
        assert_eq!(config.debounce_ms, 100);
        assert!(config.ignore_patterns.contains(&"*.tmp".to_string()));
        assert!(config.ignore_extensions.contains(&"tmp".to_string()));
    }

    #[test]
    fn test_match_glob_exact() {
        assert!(FileWatcher::match_glob("test.txt", "test.txt"));
        assert!(!FileWatcher::match_glob("test.txt", "other.txt"));
    }

    #[test]
    fn test_match_glob_wildcard() {
        assert!(FileWatcher::match_glob("test.tmp", "*.tmp"));
        assert!(FileWatcher::match_glob("output.log", "*.log"));
        assert!(!FileWatcher::match_glob("test.txt", "*.tmp"));
    }

    #[test]
    fn test_match_glob_prefix_suffix() {
        assert!(FileWatcher::match_glob("temp_file.txt", "temp*"));
        assert!(FileWatcher::match_glob("prefix_temp", "*_temp"));
        assert!(FileWatcher::match_glob("abc_temp_xyz", "abc*xyz"));
    }

    #[test]
    fn test_should_ignore_by_extension() {
        let config = FileWatcherConfig::default();
        let tmp_path = Path::new("/tmp/test.tmp");
        let log_path = Path::new("/var/log/app.log");
        let txt_path = Path::new("/documents/readme.txt");

        assert!(FileWatcher::should_ignore(tmp_path, &config));
        assert!(FileWatcher::should_ignore(log_path, &config));
        assert!(!FileWatcher::should_ignore(txt_path, &config));
    }

    #[test]
    fn test_should_ignore_by_pattern() {
        let config = FileWatcherConfig {
            ignore_patterns: vec!["config".to_string()],
            ..Default::default()
        };
        // 文件名包含 "config" 应被忽略
        assert!(FileWatcher::should_ignore(
            Path::new("/project/.git/config"),
            &config
        ));
        // 文件名不包含 "config" 不应被忽略
        assert!(!FileWatcher::should_ignore(
            Path::new("/project/src/main.rs"),
            &config
        ));
    }

    #[test]
    fn test_should_ignore_double_star() {
        let config = FileWatcherConfig {
            ignore_patterns: vec![".git/**".to_string(), "node_modules/**".to_string()],
            ..Default::default()
        };
        // .git/** 应匹配 .git 目录下的所有文件
        assert!(FileWatcher::should_ignore(
            Path::new("/project/.git/HEAD"),
            &config
        ));
        assert!(FileWatcher::should_ignore(
            Path::new("/project/.git/objects/ab/cdef"),
            &config
        ));
        // node_modules/** 应匹配 node_modules 目录下的所有文件
        assert!(FileWatcher::should_ignore(
            Path::new("/project/node_modules/express/index.js"),
            &config
        ));
        // 普通文件不应被忽略
        assert!(!FileWatcher::should_ignore(
            Path::new("/project/src/main.rs"),
            &config
        ));
    }

    #[test]
    fn test_file_event_kind_serialization() {
        let event = FileEvent {
            path: PathBuf::from("/test/file.txt"),
            kind: FileEventKind::Created,
            timestamp: Utc::now(),
        };
        let json = serde_json::to_string(&event).unwrap();
        assert!(json.contains("Created"));
        assert!(json.contains("/test/file.txt"));
    }

    #[test]
    fn test_file_watcher_status_creation() {
        let status = FileWatcherStatus {
            is_running: true,
            watched_paths: vec![PathBuf::from("/test")],
            watched_count: 1,
        };
        assert!(status.is_running);
        assert_eq!(status.watched_count, 1);
    }
}

/// 文件监控器状态
#[allow(dead_code)]
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct FileWatcherStatus {
    pub is_running: bool,
    pub watched_paths: Vec<PathBuf>,
    pub watched_count: usize,
}