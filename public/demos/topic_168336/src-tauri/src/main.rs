#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod file_monitor;
use file_monitor::FileSystemMonitor;

#[tauri::command]
async fn start_file_monitoring(window: tauri::Window, path: String) -> Result<(), String> {
    let monitor = FileSystemMonitor::new(window);
    monitor.start_monitoring(&path)
        .map_err(|e| e.to_string())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![start_file_monitoring])
        .run(tauri::generate_context!())
        .expect("Tauri应用运行错误");
} 