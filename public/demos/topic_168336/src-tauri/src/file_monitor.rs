use notify::{Watcher, RecursiveMode, Event};
use std::path::Path;
use std::sync::mpsc::channel;
use tauri::Window;

#[derive(Clone, serde::Serialize)]
struct FileEvent {
    path: String,
    kind: String,
}

pub struct FileSystemMonitor {
    window: Window,
}

impl FileSystemMonitor {
    pub fn new(window: Window) -> Self {
        Self { window }
    }

    pub fn start_monitoring(&self, path: &str) -> Result<(), Box<dyn std::error::Error>> {
        let window = self.window.clone();
        let (tx, rx) = channel();

        let mut watcher = notify::recommended_watcher(move |res: Result<Event, notify::Error>| {
            match res {
                Ok(event) => {
                    let file_event = FileEvent {
                        path: event.paths.first()
                            .map(|p| p.to_string_lossy().to_string())
                            .unwrap_or_default(),
                        kind: format!("{:?}", event.kind)
                    };

                    // 发送事件到前端
                    window.emit("file-system-event", &file_event).unwrap();
                }
                Err(e) => println!("监控错误: {:?}", e),
            }
        })?;

        // 开始监控目录
        watcher.watch(Path::new(path), RecursiveMode::Recursive)?;

        // 保持watcher活跃
        std::thread::spawn(move || {
            loop {
                match rx.recv() {
                    Ok(_) => (),
                    Err(e) => println!("接收错误: {:?}", e),
                }
            }
        });

        Ok(())
    }

    fn handle_file_event(&self, event: Event) {
        use notify::EventKind::*;
        
        match event.kind {
            Create(create_kind) => {
                // 处理文件创建
                match create_kind {
                    notify::event::CreateKind::File => {
                        // 处理文件创建
                    }
                    notify::event::CreateKind::Folder => {
                        // 处理文件夹创建
                    }
                    _ => {}
                }
            }
            Remove(remove_kind) => {
                // 处理文件删除
                self.handle_file_deletion(&event.paths[0]);
            }
            Modify(modify_kind) => {
                // 处理文件修改
            }
            _ => {}
        }
    }

    fn handle_file_deletion(&self, path: &Path) {
        // 实现文件删除的处理逻辑
        // 例如：更新数据库、发送通知等
    }
} 