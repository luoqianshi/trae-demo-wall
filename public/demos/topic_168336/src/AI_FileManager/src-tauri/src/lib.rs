//! AI FileManager 主库
//! 声明核心模块与 Tauri 应用入口

mod classifier;
mod commands;
mod db;
mod hash;
mod integration;
mod monitor;
mod scanner;

use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use tauri::Manager;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{TrayIconBuilder, TrayIconEvent, MouseButton, MouseButtonState};

/// 扫描取消标记（全局共享状态）
pub struct ScanCancelFlag(pub Arc<AtomicBool>);

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(ScanCancelFlag(Arc::new(AtomicBool::new(false))))
        .manage(commands::monitor::MonitorState::new())
        .setup(|app| {
            // 设置系统托盘
            setup_tray(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::hash::calculate_hashes,
            commands::database::init_database,
            commands::database::get_db_path,
            commands::scanner::scan_directory,
            commands::scanner::scan_directory_with_progress,
            commands::scanner::cancel_scan,
            commands::scanner::get_duplicates,
            commands::scanner::get_statistics,
            commands::virtual_dir::create_virtual_dir,
            commands::virtual_dir::get_virtual_dirs,
            commands::virtual_dir::add_file_to_virtual_dir,
            commands::virtual_dir::get_virtual_dir_files,
            commands::deletion::delete_file,
            commands::deletion::get_deletion_records,
            commands::deletion::get_delete_queue,
            commands::deletion::process_delete_queue,
            commands::deletion::restore_file,
            commands::classifier::classify_files,
            commands::classifier::get_classification_results,
            commands::integration::check_integration,
            commands::integration::install_integration,
            commands::integration::uninstall_integration,
            commands::file_ops::search_files,
            commands::file_ops::advanced_search_files,
            commands::file_ops::open_file_location,
            commands::file_ops::export_duplicates_csv,
            commands::file_ops::get_files_sorted,
            commands::file_ops::get_files_paginated,
            commands::file_ops::get_files_sorted_paginated,
            commands::monitor::start_monitoring,
            commands::monitor::stop_monitoring,
            commands::tags::create_tag,
            commands::tags::get_all_tags,
            commands::tags::update_tag,
            commands::tags::delete_tag,
            commands::tags::add_tag_to_file,
            commands::tags::remove_tag_from_file,
            commands::tags::get_file_tags,
            commands::tags::get_files_by_tag,
            commands::recent_files::record_file_access,
            commands::recent_files::get_recent_files,
            commands::batch::batch_delete_files,
            commands::batch::batch_move_files,
            commands::file_edit::rename_file,
            commands::file_edit::copy_file,
            commands::file_edit::create_file,
            commands::file_edit::create_directory,
            commands::file_edit::get_all_files,
            commands::data_io::export_files_csv,
            commands::data_io::export_files_json,
            commands::data_io::import_files_csv,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

/// 设置系统托盘图标和菜单
fn setup_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let show_hide = MenuItem::with_id(app, "show_hide", "显示/隐藏", true, None::<&str>)?;
    let separator = PredefinedMenuItem::separator(app)?;
    let quit = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;
    let menu = Menu::with_items(app, &[&show_hide, &separator, &quit])?;

    let icon = app.default_window_icon().cloned()
        .ok_or("未找到默认窗口图标")?;

    TrayIconBuilder::new()
        .icon(icon)
        .menu(&menu)
        .on_menu_event(|app, event| {
            match event.id.as_ref() {
                "show_hide" => {
                    if let Some(window) = app.get_webview_window("main") {
                        if window.is_visible().unwrap_or(false) {
                            let _ = window.hide();
                        } else {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up, ..
            } = event {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    if window.is_visible().unwrap_or(false) {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
            }
        })
        .build(app)?;

    Ok(())
}