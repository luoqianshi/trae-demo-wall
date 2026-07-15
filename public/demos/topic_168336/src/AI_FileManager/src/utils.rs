//! 工具函数模块
//! 格式化函数和 Tauri 调用封装

use crate::types::*;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;
use yew::prelude::*;

/// Tauri invoke 绑定
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = ["window", "__TAURI__", "core"])]
    pub async fn invoke(cmd: &str, args: JsValue) -> JsValue;
}

/// 格式化文件大小
pub fn format_size(bytes: i64) -> String {
    if bytes == 0 {
        return "0 B".to_string();
    }
    let units = ["B", "KB", "MB", "GB", "TB"];
    let mut size = bytes as f64;
    let mut unit_idx = 0;
    while size >= 1024.0 && unit_idx < units.len() - 1 {
        size /= 1024.0;
        unit_idx += 1;
    }
    format!("{:.1} {}", size, units[unit_idx])
}

/// 格式化耗时
pub fn format_duration(ms: u64) -> String {
    if ms < 1000 {
        format!("{} ms", ms)
    } else {
        format!("{:.1} s", ms as f64 / 1000.0)
    }
}

/// 刷新所有数据（统计、重复文件、虚拟目录、删除记录、删除队列）
pub async fn refresh_all_data(
    stats: &UseStateHandle<FileStatistics>,
    _duplicates: &UseStateHandle<Vec<DuplicateGroup>>,
    _virtual_dirs: &UseStateHandle<Vec<VirtualDirectory>>,
    deletion_records: &UseStateHandle<Vec<DeletionRecord>>,
    delete_queue: &UseStateHandle<Vec<DeleteQueueItem>>,
    _error_msg: &UseStateHandle<String>,
) {
    let val = invoke("get_statistics", JsValue::NULL).await;
    if !val.is_null() {
        if let Ok(s) = serde_wasm_bindgen::from_value::<FileStatistics>(val) {
            stats.set(s);
        }
    }
    let val = invoke("get_deletion_records", JsValue::NULL).await;
    if !val.is_null() {
        if let Ok(d) = serde_wasm_bindgen::from_value::<Vec<DeletionRecord>>(val) {
            deletion_records.set(d);
        }
    }
    let val = invoke("get_delete_queue", JsValue::NULL).await;
    if !val.is_null() {
        if let Ok(q) = serde_wasm_bindgen::from_value::<Vec<DeleteQueueItem>>(val) {
            delete_queue.set(q);
        }
    }
}

/// 通用 Tauri 调用封装
pub fn call_tauri(
    cmd: &str,
    args: JsValue,
    stats: UseStateHandle<FileStatistics>,
    duplicates: UseStateHandle<Vec<DuplicateGroup>>,
    virtual_dirs: UseStateHandle<Vec<VirtualDirectory>>,
    deletion_records: UseStateHandle<Vec<DeletionRecord>>,
    delete_queue: UseStateHandle<Vec<DeleteQueueItem>>,
    error_msg: UseStateHandle<String>,
    loading: UseStateHandle<bool>,
) {
    let cmd = cmd.to_string();
    spawn_local(async move {
        loading.set(true);
        error_msg.set(String::new());
        match invoke(&cmd, args).await {
            val if val.is_undefined() || val.is_null() => {
                refresh_all_data(&stats, &duplicates, &virtual_dirs, &deletion_records, &delete_queue, &error_msg).await;
            }
            val => {
                match cmd.as_str() {
                    "scan_directory" => {
                        let _result: ScanResult =
                            serde_wasm_bindgen::from_value(val).unwrap_or_default();
                        refresh_all_data(&stats, &duplicates, &virtual_dirs, &deletion_records, &delete_queue, &error_msg).await;
                    }
                    "get_statistics" => {
                        let s: FileStatistics =
                            serde_wasm_bindgen::from_value(val).unwrap_or_default();
                        stats.set(s);
                    }
                    "get_duplicates" => {
                        let d: Vec<DuplicateGroup> =
                            serde_wasm_bindgen::from_value(val).unwrap_or_default();
                        duplicates.set(d);
                    }
                    "get_virtual_dirs" => {
                        let d: Vec<VirtualDirectory> =
                            serde_wasm_bindgen::from_value(val).unwrap_or_default();
                        virtual_dirs.set(d);
                    }
                    "get_deletion_records" => {
                        let d: Vec<DeletionRecord> =
                            serde_wasm_bindgen::from_value(val).unwrap_or_default();
                        deletion_records.set(d);
                    }
                    "get_delete_queue" => {
                        let d: Vec<DeleteQueueItem> =
                            serde_wasm_bindgen::from_value(val).unwrap_or_default();
                        delete_queue.set(d);
                    }
                    "process_delete_queue" => {
                        let _n: usize = serde_wasm_bindgen::from_value(val).unwrap_or(0);
                        refresh_all_data(&stats, &duplicates, &virtual_dirs, &deletion_records, &delete_queue, &error_msg).await;
                    }
                    _ => {}
                }
            }
        }
        loading.set(false);
    });
}