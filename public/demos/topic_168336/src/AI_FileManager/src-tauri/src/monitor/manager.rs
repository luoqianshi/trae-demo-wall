//! 文件监控管理器
//! 对 FileWatcher 的高层封装，提供更简洁的启动/停止/状态查询接口

use crate::monitor::{FileEvent, FileWatcher, FileWatcherConfig, FileWatcherStatus};
use anyhow::Result;
use tokio::sync::mpsc;

/// 文件监控管理器（高层封装）
pub struct FileMonitorManager {
    watcher: Option<FileWatcher>,
    config: FileWatcherConfig,
}

impl FileMonitorManager {
    pub fn new(config: FileWatcherConfig) -> Self {
        Self {
            watcher: None,
            config,
        }
    }

    /// 启动监控
    pub async fn start(&mut self) -> Result<mpsc::UnboundedReceiver<FileEvent>> {
        let mut watcher = FileWatcher::new(self.config.clone());
        watcher.start().await?;
        let rx = watcher
            .take_event_rx()
            .ok_or_else(|| anyhow::anyhow!("无法获取事件接收器"))?;
        self.watcher = Some(watcher);
        Ok(rx)
    }

    /// 停止监控
    #[allow(dead_code)]
    pub async fn stop(&mut self) -> Result<()> {
        if let Some(mut watcher) = self.watcher.take() {
            watcher.stop().await?;
        }
        Ok(())
    }

    /// 获取状态
    #[allow(dead_code)]
    pub async fn status(&self) -> Option<FileWatcherStatus> {
        match self.watcher.as_ref() {
            Some(watcher) => Some(watcher.status().await),
            None => None,
        }
    }
}