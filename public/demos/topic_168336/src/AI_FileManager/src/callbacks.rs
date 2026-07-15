//! 回调工厂函数
//! 将 app.rs 中的回调逻辑提取为独立模块，降低主组件复杂度

use crate::types::*;
use crate::utils::*;
use std::collections::HashMap;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;
use yew::prelude::*;

/// 创建导航回调
pub fn make_go_to(
    current_page: UseStateHandle<Page>,
    stats: UseStateHandle<FileStatistics>,
    duplicates: UseStateHandle<Vec<DuplicateGroup>>,
    virtual_dirs: UseStateHandle<Vec<VirtualDirectory>>,
    deletion_records: UseStateHandle<Vec<DeletionRecord>>,
    delete_queue: UseStateHandle<Vec<DeleteQueueItem>>,
    scan_result: UseStateHandle<Option<ScanResult>>,
    error_msg: UseStateHandle<String>,
    loading: UseStateHandle<bool>,
) -> Callback<Page> {
    Callback::from(move |page: Page| {
        current_page.set(page.clone());
        scan_result.set(None);
        match page {
            Page::Dashboard => {
                call_tauri("get_statistics", JsValue::NULL, stats.clone(), duplicates.clone(), virtual_dirs.clone(), deletion_records.clone(), delete_queue.clone(), error_msg.clone(), loading.clone());
            }
            Page::Duplicates => {
                call_tauri("get_duplicates", JsValue::NULL, stats.clone(), duplicates.clone(), virtual_dirs.clone(), deletion_records.clone(), delete_queue.clone(), error_msg.clone(), loading.clone());
            }
            Page::VirtualDirs => {
                call_tauri("get_virtual_dirs", JsValue::NULL, stats.clone(), duplicates.clone(), virtual_dirs.clone(), deletion_records.clone(), delete_queue.clone(), error_msg.clone(), loading.clone());
            }
            Page::Deletion => {
                call_tauri("get_deletion_records", JsValue::NULL, stats.clone(), duplicates.clone(), virtual_dirs.clone(), deletion_records.clone(), delete_queue.clone(), error_msg.clone(), loading.clone());
                call_tauri("get_delete_queue", JsValue::NULL, stats.clone(), duplicates.clone(), virtual_dirs.clone(), deletion_records.clone(), delete_queue.clone(), error_msg.clone(), loading.clone());
            }
            _ => {}
        }
    })
}

/// 创建扫描回调
pub fn make_on_scan(
    scan_path: UseStateHandle<String>,
    scan_result: UseStateHandle<Option<ScanResult>>,
    scan_progress: UseStateHandle<Option<f64>>,
    error_msg: UseStateHandle<String>,
) -> Callback<()> {
    Callback::from(move |_| {
        let path = scan_path.to_string();
        if path.is_empty() {
            error_msg.set("请输入扫描路径".to_string());
            return;
        }
        let scan_result = scan_result.clone();
        let scan_progress = scan_progress.clone();
        let error_msg = error_msg.clone();
        let path2 = path.clone();
        spawn_local(async move {
            let args = serde_wasm_bindgen::to_value(&PathArg { path: &path2 }).unwrap_or(JsValue::NULL);
            match invoke("scan_directory_with_progress", args).await {
                val if !val.is_null() && !val.is_undefined() => {
                    let result: ScanResult =
                        serde_wasm_bindgen::from_value(val).unwrap_or_default();
                    scan_result.set(Some(result));
                    scan_progress.set(None);
                }
                _ => {
                    error_msg.set("扫描失败".to_string());
                    scan_progress.set(None);
                }
            }
        });
    })
}

/// 创建取消扫描回调
pub fn make_on_cancel(
    scan_progress: UseStateHandle<Option<f64>>,
) -> Callback<()> {
    Callback::from(move |_| {
        let scan_progress = scan_progress.clone();
        spawn_local(async move {
            let _ = invoke("cancel_scan", JsValue::NULL).await;
        });
        scan_progress.set(None);
    })
}

/// 创建虚拟目录回调
pub fn make_on_create_dir(
    new_dir_name: UseStateHandle<String>,
    virtual_dirs: UseStateHandle<Vec<VirtualDirectory>>,
    error_msg: UseStateHandle<String>,
) -> Callback<()> {
    let new_dir_name2 = new_dir_name.clone();
    Callback::from(move |_| {
        let name = new_dir_name.to_string();
        if name.is_empty() {
            error_msg.set("请输入目录名称".to_string());
            return;
        }
        let virtual_dirs = virtual_dirs.clone();
        let error_msg = error_msg.clone();
        let name2 = name.clone();
        let new_dir_name = new_dir_name2.clone();
        spawn_local(async move {
            let args = serde_wasm_bindgen::to_value(&CreateDirArg {
                name: &name2,
                parent_id: None,
            }).unwrap_or(JsValue::NULL);
            match invoke("create_virtual_dir", args).await {
                val if !val.is_null() && !val.is_undefined() => {
                    new_dir_name.set(String::new());
                    let args = JsValue::NULL;
                    match invoke("get_virtual_dirs", args).await {
                        val if !val.is_null() => {
                            let dirs: Vec<VirtualDirectory> =
                                serde_wasm_bindgen::from_value(val).unwrap_or_default();
                            virtual_dirs.set(dirs);
                        }
                        _ => {}
                    }
                }
                _ => {
                    error_msg.set("创建目录失败".to_string());
                }
            }
        });
    })
}

/// 创建 AI 分类回调
pub fn make_on_classify(
    classification_results: UseStateHandle<Vec<ClassificationCategory>>,
    class_loading: UseStateHandle<bool>,
    error_msg: UseStateHandle<String>,
) -> Callback<()> {
    Callback::from(move |_| {
        if *class_loading {
            return;
        }
        let classification_results = classification_results.clone();
        let class_loading = class_loading.clone();
        let error_msg = error_msg.clone();
        spawn_local(async move {
            class_loading.set(true);
            error_msg.set(String::new());
            match invoke("classify_files", JsValue::NULL).await {
                val if !val.is_null() && !val.is_undefined() => {
                    let cats: Vec<ClassificationCategory> =
                        serde_wasm_bindgen::from_value(val).unwrap_or_default();
                    classification_results.set(cats);
                }
                _ => {
                    error_msg.set("分类失败，请确保已扫描文件且 Python 环境可用".to_string());
                }
            }
            class_loading.set(false);
        });
    })
}

/// 创建系统集成检查回调
pub fn make_on_check_integration(
    integration_status: UseStateHandle<Option<IntegrationStatus>>,
    integration_loading: UseStateHandle<bool>,
    integration_msg: UseStateHandle<Option<String>>,
) -> Callback<()> {
    Callback::from(move |_| {
        let integration_status = integration_status.clone();
        let integration_loading = integration_loading.clone();
        let integration_msg = integration_msg.clone();
        spawn_local(async move {
            integration_loading.set(true);
            integration_msg.set(None);
            match invoke("check_integration", JsValue::NULL).await {
                val if !val.is_null() && !val.is_undefined() => {
                    let status: IntegrationStatus =
                        serde_wasm_bindgen::from_value(val).unwrap_or_default();
                    integration_status.set(Some(status));
                }
                _ => {
                    integration_msg.set(Some("无法获取集成状态".to_string()));
                }
            }
            integration_loading.set(false);
        });
    })
}

/// 创建系统集成安装回调
pub fn make_on_install_integration(
    integration_status: UseStateHandle<Option<IntegrationStatus>>,
    integration_loading: UseStateHandle<bool>,
    integration_msg: UseStateHandle<Option<String>>,
) -> Callback<()> {
    Callback::from(move |_| {
        let integration_status = integration_status.clone();
        let integration_loading = integration_loading.clone();
        let integration_msg = integration_msg.clone();
        spawn_local(async move {
            integration_loading.set(true);
            integration_msg.set(None);
            match invoke("install_integration", JsValue::NULL).await {
                val if !val.is_null() && !val.is_undefined() => {
                    let msg: String = serde_wasm_bindgen::from_value(val).unwrap_or_default();
                    integration_msg.set(Some(msg));
                    let val2 = invoke("check_integration", JsValue::NULL).await;
                    if !val2.is_null() {
                        if let Ok(s) = serde_wasm_bindgen::from_value::<IntegrationStatus>(val2) {
                            integration_status.set(Some(s));
                        }
                    }
                }
                _ => {
                    integration_msg.set(Some("安装失败".to_string()));
                }
            }
            integration_loading.set(false);
        });
    })
}

/// 创建系统集成卸载回调
pub fn make_on_uninstall_integration(
    integration_status: UseStateHandle<Option<IntegrationStatus>>,
    integration_loading: UseStateHandle<bool>,
    integration_msg: UseStateHandle<Option<String>>,
) -> Callback<()> {
    Callback::from(move |_| {
        let integration_status = integration_status.clone();
        let integration_loading = integration_loading.clone();
        let integration_msg = integration_msg.clone();
        spawn_local(async move {
            integration_loading.set(true);
            integration_msg.set(None);
            match invoke("uninstall_integration", JsValue::NULL).await {
                val if !val.is_null() && !val.is_undefined() => {
                    let msg: String = serde_wasm_bindgen::from_value(val).unwrap_or_default();
                    integration_msg.set(Some(msg));
                    let val2 = invoke("check_integration", JsValue::NULL).await;
                    if !val2.is_null() {
                        if let Ok(s) = serde_wasm_bindgen::from_value::<IntegrationStatus>(val2) {
                            integration_status.set(Some(s));
                        }
                    }
                }
                _ => {
                    integration_msg.set(Some("卸载失败".to_string()));
                }
            }
            integration_loading.set(false);
        });
    })
}

/// 创建虚拟目录展开/收起回调
pub fn make_on_toggle_dir(
    expanded_dir: UseStateHandle<Option<i64>>,
    dir_files_map: UseStateHandle<HashMap<i64, Vec<FileMetadata>>>,
    error_msg: UseStateHandle<String>,
    loading: UseStateHandle<bool>,
) -> Callback<i64> {
    Callback::from(move |dir_id: i64| {
        if *expanded_dir == Some(dir_id) {
            expanded_dir.set(None);
            return;
        }
        expanded_dir.set(Some(dir_id));
        if !dir_files_map.contains_key(&dir_id) {
            let dir_files_map = dir_files_map.clone();
            let error_msg = error_msg.clone();
            let loading = loading.clone();
            let args = serde_wasm_bindgen::to_value(&dir_id).unwrap_or(JsValue::NULL);
            spawn_local(async move {
                loading.set(true);
                match invoke("get_virtual_dir_files", args).await {
                    val if !val.is_null() && !val.is_undefined() => {
                        let files: Vec<FileMetadata> =
                            serde_wasm_bindgen::from_value(val).unwrap_or_default();
                        let mut map = (*dir_files_map).clone();
                        map.insert(dir_id, files);
                        dir_files_map.set(map);
                    }
                    _ => {
                        error_msg.set("获取目录文件失败".to_string());
                    }
                }
                loading.set(false);
            });
        }
    })
}

/// 创建拖拽文件到目录回调
pub fn make_on_add_file_to_dir(
    dir_files_map: UseStateHandle<HashMap<i64, Vec<FileMetadata>>>,
    error_msg: UseStateHandle<String>,
    loading: UseStateHandle<bool>,
) -> Callback<(i64, i64)> {
    Callback::from(move |(dir_id, file_id): (i64, i64)| {
        let dir_files_map = dir_files_map.clone();
        let error_msg = error_msg.clone();
        let loading = loading.clone();
        spawn_local(async move {
            loading.set(true);
            let args = serde_wasm_bindgen::to_value(&AddFileArg { dir_id, file_id }).unwrap_or(JsValue::NULL);
            match invoke("add_file_to_virtual_dir", args).await {
                val if !val.is_null() && !val.is_undefined() => {
                    let args2 = serde_wasm_bindgen::to_value(&dir_id).unwrap_or(JsValue::NULL);
                    match invoke("get_virtual_dir_files", args2).await {
                        val if !val.is_null() && !val.is_undefined() => {
                            let files: Vec<FileMetadata> =
                                serde_wasm_bindgen::from_value(val).unwrap_or_default();
                            let mut map = (*dir_files_map).clone();
                            map.insert(dir_id, files);
                            dir_files_map.set(map);
                        }
                        _ => {}
                    }
                }
                _ => {
                    error_msg.set("添加文件到目录失败".to_string());
                }
            }
            loading.set(false);
        });
    })
}

/// 创建标签回调
pub fn make_on_create_tag(
    new_tag_name: UseStateHandle<String>,
    new_tag_color: UseStateHandle<String>,
    tags: UseStateHandle<Vec<Tag>>,
    error_msg: UseStateHandle<String>,
) -> Callback<()> {
    Callback::from(move |_| {
        let name = new_tag_name.to_string();
        if name.is_empty() {
            error_msg.set("请输入标签名称".to_string());
            return;
        }
        let new_tag_name = new_tag_name.clone();
        let new_tag_color = new_tag_color.clone();
        let tags = tags.clone();
        let error_msg = error_msg.clone();
        let color = new_tag_color.to_string();
        spawn_local(async move {
            let args = serde_wasm_bindgen::to_value(&CreateTagArg {
                name: &name,
                color: &color,
            }).unwrap_or(JsValue::NULL);
            match invoke("create_tag", args).await {
                val if !val.is_null() && !val.is_undefined() => {
                    new_tag_name.set(String::new());
                    // 刷新标签列表
                    let args = JsValue::NULL;
                    match invoke("get_all_tags", args).await {
                        val if !val.is_null() => {
                            let list: Vec<Tag> =
                                serde_wasm_bindgen::from_value(val).unwrap_or_default();
                            tags.set(list);
                        }
                        _ => {}
                    }
                }
                _ => {
                    error_msg.set("创建标签失败".to_string());
                }
            }
        });
    })
}

/// 删除标签回调
pub fn make_on_delete_tag(
    tags: UseStateHandle<Vec<Tag>>,
    error_msg: UseStateHandle<String>,
) -> Callback<i64> {
    Callback::from(move |tag_id: i64| {
        let tags = tags.clone();
        let error_msg = error_msg.clone();
        spawn_local(async move {
            let args = serde_wasm_bindgen::to_value(&tag_id).unwrap_or(JsValue::NULL);
            match invoke("delete_tag", args).await {
                val if !val.is_null() && !val.is_undefined() => {
                    let args = JsValue::NULL;
                    match invoke("get_all_tags", args).await {
                        val if !val.is_null() => {
                            let list: Vec<Tag> =
                                serde_wasm_bindgen::from_value(val).unwrap_or_default();
                            tags.set(list);
                        }
                        _ => {}
                    }
                }
                _ => {
                    error_msg.set("删除标签失败".to_string());
                }
            }
        });
    })
}

/// 刷新标签列表回调
pub fn make_on_refresh_tags(
    tags: UseStateHandle<Vec<Tag>>,
    error_msg: UseStateHandle<String>,
) -> Callback<()> {
    Callback::from(move |_| {
        let tags = tags.clone();
        let error_msg = error_msg.clone();
        spawn_local(async move {
            match invoke("get_all_tags", JsValue::NULL).await {
                val if !val.is_null() => {
                    let list: Vec<Tag> =
                        serde_wasm_bindgen::from_value(val).unwrap_or_default();
                    tags.set(list);
                }
                _ => {
                    error_msg.set("获取标签列表失败".to_string());
                }
            }
        });
    })
}

/// 批量操作：全选/取消选择回调
pub fn make_on_select_all(
    batch_files: UseStateHandle<Vec<FileMetadata>>,
    selected_ids: UseStateHandle<Vec<i64>>,
) -> Callback<()> {
    Callback::from(move |_| {
        let files = &*batch_files;
        if selected_ids.len() == files.len() {
            selected_ids.set(Vec::new());
        } else {
            let ids: Vec<i64> = files.iter().map(|f| f.id).collect();
            selected_ids.set(ids);
        }
    })
}

/// 批量操作：切换单个文件选择
pub fn make_on_toggle_select(
    selected_ids: UseStateHandle<Vec<i64>>,
) -> Callback<i64> {
    Callback::from(move |file_id: i64| {
        let mut ids = (*selected_ids).clone();
        if let Some(pos) = ids.iter().position(|id| *id == file_id) {
            ids.remove(pos);
        } else {
            ids.push(file_id);
        }
        selected_ids.set(ids);
    })
}

/// 批量操作：清除选择
pub fn make_on_clear_selection(
    selected_ids: UseStateHandle<Vec<i64>>,
) -> Callback<()> {
    Callback::from(move |_| {
        selected_ids.set(Vec::new());
    })
}

/// 批量操作：批量删除回调
pub fn make_on_batch_delete(
    selected_ids: UseStateHandle<Vec<i64>>,
    batch_files: UseStateHandle<Vec<FileMetadata>>,
    error_msg: UseStateHandle<String>,
    loading: UseStateHandle<bool>,
) -> Callback<()> {
    Callback::from(move |_| {
        let ids = (*selected_ids).clone();
        if ids.is_empty() {
            error_msg.set("请先选择文件".to_string());
            return;
        }
        let selected_ids = selected_ids.clone();
        let batch_files = batch_files.clone();
        let error_msg = error_msg.clone();
        let loading = loading.clone();
        spawn_local(async move {
            loading.set(true);
            let args = serde_wasm_bindgen::to_value(&BatchDeleteArg { file_ids: ids }).unwrap_or(JsValue::NULL);
            match invoke("batch_delete_files", args).await {
                val if !val.is_null() && !val.is_undefined() => {
                    selected_ids.set(Vec::new());
                    let args2 = JsValue::NULL;
                    match invoke("get_all_files", args2).await {
                        val if !val.is_null() => {
                            let files: Vec<FileMetadata> =
                                serde_wasm_bindgen::from_value(val).unwrap_or_default();
                            batch_files.set(files);
                        }
                        _ => {}
                    }
                    // 也刷新统计信息
                    let _ = invoke("get_statistics", JsValue::NULL).await;
                }
                _ => {
                    error_msg.set("批量删除失败".to_string());
                }
            }
            loading.set(false);
        });
    })
}

/// 批量操作：批量移动回调
pub fn make_on_batch_move(
    selected_ids: UseStateHandle<Vec<i64>>,
    target_dir: UseStateHandle<String>,
    batch_files: UseStateHandle<Vec<FileMetadata>>,
    error_msg: UseStateHandle<String>,
    loading: UseStateHandle<bool>,
) -> Callback<()> {
    Callback::from(move |_| {
        let ids = (*selected_ids).clone();
        if ids.is_empty() {
            error_msg.set("请先选择文件".to_string());
            return;
        }
        let dir = target_dir.to_string();
        if dir.trim().is_empty() {
            error_msg.set("请输入目标目录路径".to_string());
            return;
        }
        let selected_ids = selected_ids.clone();
        let target_dir = target_dir.clone();
        let batch_files = batch_files.clone();
        let error_msg = error_msg.clone();
        let loading = loading.clone();
        spawn_local(async move {
            loading.set(true);
            let args = serde_wasm_bindgen::to_value(&BatchMoveArg {
                file_ids: ids,
                target_dir: dir,
            }).unwrap_or(JsValue::NULL);
            match invoke("batch_move_files", args).await {
                val if !val.is_null() && !val.is_undefined() => {
                    selected_ids.set(Vec::new());
                    target_dir.set(String::new());
                    let args2 = JsValue::NULL;
                    match invoke("get_all_files", args2).await {
                        val if !val.is_null() => {
                            let files: Vec<FileMetadata> =
                                serde_wasm_bindgen::from_value(val).unwrap_or_default();
                            batch_files.set(files);
                        }
                        _ => {}
                    }
                }
                _ => {
                    error_msg.set("批量移动失败，请检查目标目录是否存在".to_string());
                }
            }
            loading.set(false);
        });
    })
}

/// 排序过滤：刷新文件列表回调
pub fn make_on_refresh_sorted(
    sort_filter_files: UseStateHandle<Vec<FileMetadata>>,
    sort_by: UseStateHandle<String>,
    sort_order: UseStateHandle<String>,
    filter_ext: UseStateHandle<String>,
    filter_min_size: UseStateHandle<String>,
    filter_max_size: UseStateHandle<String>,
    loading: UseStateHandle<bool>,
    error_msg: UseStateHandle<String>,
) -> Callback<()> {
    Callback::from(move |_| {
        let sort_filter_files = sort_filter_files.clone();
        let sort_by = sort_by.clone();
        let sort_order = sort_order.clone();
        let filter_ext = filter_ext.clone();
        let filter_min_size = filter_min_size.clone();
        let filter_max_size = filter_max_size.clone();
        let loading = loading.clone();
        let error_msg = error_msg.clone();
        spawn_local(async move {
            loading.set(true);
            let sb = sort_by.to_string();
            let so = sort_order.to_string();
            let fe = filter_ext.to_string();
            let fe_opt = if fe.is_empty() { None } else { Some(fe) };
            let min_s = filter_min_size.parse::<i64>().unwrap_or(0) * 1024;
            let max_s = filter_max_size.parse::<i64>().unwrap_or(0) * 1024;
            let args = serde_wasm_bindgen::to_value(&SortFilterArgs {
                sort_by: sb,
                sort_order: so,
                filter_ext: fe_opt,
                filter_min_size: if min_s > 0 { Some(min_s) } else { None },
                filter_max_size: if max_s > 0 { Some(max_s) } else { None },
            }).unwrap_or(JsValue::NULL);
            match invoke("get_files_sorted", args).await {
                val if !val.is_null() => {
                    let files: Vec<FileMetadata> =
                        serde_wasm_bindgen::from_value(val).unwrap_or_default();
                    sort_filter_files.set(files);
                }
                _ => {
                    error_msg.set("获取文件列表失败".to_string());
                }
            }
            loading.set(false);
        });
    })
}

/// 文件操作：刷新文件列表回调
pub fn make_on_refresh_file_ops(
    file_ops_files: UseStateHandle<Vec<FileMetadata>>,
    error_msg: UseStateHandle<String>,
) -> Callback<()> {
    Callback::from(move |_| {
        let file_ops_files = file_ops_files.clone();
        let error_msg = error_msg.clone();
        spawn_local(async move {
            match invoke("get_all_files", JsValue::NULL).await {
                val if !val.is_null() => {
                    let files: Vec<FileMetadata> =
                        serde_wasm_bindgen::from_value(val).unwrap_or_default();
                    file_ops_files.set(files);
                }
                _ => {
                    error_msg.set("获取文件列表失败".to_string());
                }
            }
        });
    })
}

/// 文件操作：开始重命名
pub fn make_on_start_rename(
    rename_file_id: UseStateHandle<Option<i64>>,
    rename_new_name: UseStateHandle<String>,
) -> Callback<i64> {
    Callback::from(move |file_id: i64| {
        rename_file_id.set(Some(file_id));
        rename_new_name.set(String::new());
    })
}

/// 文件操作：取消重命名
pub fn make_on_cancel_rename(
    rename_file_id: UseStateHandle<Option<i64>>,
) -> Callback<()> {
    Callback::from(move |_| {
        rename_file_id.set(None);
    })
}

/// 文件操作：执行重命名
pub fn make_on_rename(
    rename_file_id: UseStateHandle<Option<i64>>,
    rename_new_name: UseStateHandle<String>,
    file_ops_files: UseStateHandle<Vec<FileMetadata>>,
    error_msg: UseStateHandle<String>,
) -> Callback<()> {
    Callback::from(move |_| {
        let file_id = match *rename_file_id {
            Some(id) => id,
            None => {
                error_msg.set("请选择要重命名的文件".to_string());
                return;
            }
        };
        let new_name = rename_new_name.to_string();
        if new_name.trim().is_empty() {
            error_msg.set("请输入新文件名".to_string());
            return;
        }
        let rename_file_id = rename_file_id.clone();
        let rename_new_name = rename_new_name.clone();
        let file_ops_files = file_ops_files.clone();
        let error_msg = error_msg.clone();
        spawn_local(async move {
            let args = serde_wasm_bindgen::to_value(&RenameArg {
                file_id,
                new_name: new_name.trim().to_string(),
            }).unwrap_or(JsValue::NULL);
            match invoke("rename_file", args).await {
                val if !val.is_null() && !val.is_undefined() => {
                    rename_file_id.set(None);
                    rename_new_name.set(String::new());
                    // 刷新列表
                    match invoke("get_all_files", JsValue::NULL).await {
                        val if !val.is_null() => {
                            let files: Vec<FileMetadata> =
                                serde_wasm_bindgen::from_value(val).unwrap_or_default();
                            file_ops_files.set(files);
                        }
                        _ => {}
                    }
                }
                _ => {
                    error_msg.set("重命名失败".to_string());
                }
            }
        });
    })
}

/// 文件操作：开始复制选择
pub fn make_on_start_copy(
    copy_file_id: UseStateHandle<Option<i64>>,
) -> Callback<i64> {
    Callback::from(move |file_id: i64| {
        copy_file_id.set(Some(file_id));
    })
}

/// 文件操作：取消复制
pub fn make_on_cancel_copy(
    copy_file_id: UseStateHandle<Option<i64>>,
    copy_dest_dir: UseStateHandle<String>,
) -> Callback<()> {
    Callback::from(move |_| {
        copy_file_id.set(None);
        copy_dest_dir.set(String::new());
    })
}

/// 文件操作：执行复制
pub fn make_on_copy(
    copy_file_id: UseStateHandle<Option<i64>>,
    copy_dest_dir: UseStateHandle<String>,
    file_ops_files: UseStateHandle<Vec<FileMetadata>>,
    error_msg: UseStateHandle<String>,
) -> Callback<()> {
    Callback::from(move |_| {
        let file_id = match *copy_file_id {
            Some(id) => id,
            None => {
                error_msg.set("请选择要复制的文件".to_string());
                return;
            }
        };
        let dest_dir = copy_dest_dir.to_string();
        if dest_dir.trim().is_empty() {
            error_msg.set("请输入目标目录路径".to_string());
            return;
        }
        let copy_file_id = copy_file_id.clone();
        let copy_dest_dir = copy_dest_dir.clone();
        let file_ops_files = file_ops_files.clone();
        let error_msg = error_msg.clone();
        spawn_local(async move {
            let args = serde_wasm_bindgen::to_value(&CopyFileArg {
                file_id,
                dest_dir: dest_dir.trim().to_string(),
            }).unwrap_or(JsValue::NULL);
            match invoke("copy_file", args).await {
                val if !val.is_null() && !val.is_undefined() => {
                    copy_file_id.set(None);
                    copy_dest_dir.set(String::new());
                    match invoke("get_all_files", JsValue::NULL).await {
                        val if !val.is_null() => {
                            let files: Vec<FileMetadata> =
                                serde_wasm_bindgen::from_value(val).unwrap_or_default();
                            file_ops_files.set(files);
                        }
                        _ => {}
                    }
                }
                _ => {
                    error_msg.set("复制失败，请检查目标目录是否存在".to_string());
                }
            }
        });
    })
}

/// 文件操作：创建文件
pub fn make_on_create_file(
    create_parent_dir: UseStateHandle<String>,
    create_file_name: UseStateHandle<String>,
    file_ops_files: UseStateHandle<Vec<FileMetadata>>,
    error_msg: UseStateHandle<String>,
) -> Callback<()> {
    Callback::from(move |_| {
        let parent_dir = create_parent_dir.to_string();
        if parent_dir.trim().is_empty() {
            error_msg.set("请输入父目录路径".to_string());
            return;
        }
        let name = create_file_name.to_string();
        if name.trim().is_empty() {
            error_msg.set("请输入文件名".to_string());
            return;
        }
        let create_file_name = create_file_name.clone();
        let file_ops_files = file_ops_files.clone();
        let error_msg = error_msg.clone();
        spawn_local(async move {
            let args = serde_wasm_bindgen::to_value(&CreateFileArg {
                parent_dir: parent_dir.trim().to_string(),
                name: name.trim().to_string(),
            }).unwrap_or(JsValue::NULL);
            match invoke("create_file", args).await {
                val if !val.is_null() && !val.is_undefined() => {
                    create_file_name.set(String::new());
                    match invoke("get_all_files", JsValue::NULL).await {
                        val if !val.is_null() => {
                            let files: Vec<FileMetadata> =
                                serde_wasm_bindgen::from_value(val).unwrap_or_default();
                            file_ops_files.set(files);
                        }
                        _ => {}
                    }
                }
                _ => {
                    error_msg.set("创建文件失败".to_string());
                }
            }
        });
    })
}

/// 文件操作：创建目录
pub fn make_on_create_dir2(
    create_parent_dir: UseStateHandle<String>,
    create_dir_name: UseStateHandle<String>,
    error_msg: UseStateHandle<String>,
) -> Callback<()> {
    Callback::from(move |_| {
        let parent_dir = create_parent_dir.to_string();
        if parent_dir.trim().is_empty() {
            error_msg.set("请输入父目录路径".to_string());
            return;
        }
        let name = create_dir_name.to_string();
        if name.trim().is_empty() {
            error_msg.set("请输入目录名".to_string());
            return;
        }
        let create_dir_name = create_dir_name.clone();
        let error_msg = error_msg.clone();
        spawn_local(async move {
            let args = serde_wasm_bindgen::to_value(&CreateDirArg2 {
                parent_dir: parent_dir.trim().to_string(),
                name: name.trim().to_string(),
            }).unwrap_or(JsValue::NULL);
            match invoke("create_directory", args).await {
                val if !val.is_null() && !val.is_undefined() => {
                    create_dir_name.set(String::new());
                }
                _ => {
                    error_msg.set("创建目录失败".to_string());
                }
            }
        });
    })
}

/// 数据导出/导入：导出 CSV 回调
pub fn make_on_export_csv(
    export_msg: UseStateHandle<Option<String>>,
) -> Callback<()> {
    Callback::from(move |_| {
        let export_msg = export_msg.clone();
        spawn_local(async move {
            match invoke("export_files_csv", JsValue::NULL).await {
                val if !val.is_null() && !val.is_undefined() => {
                    let path: String = serde_wasm_bindgen::from_value(val).unwrap_or_default();
                    export_msg.set(Some(format!("CSV 已导出到: {}", path)));
                }
                _ => {
                    export_msg.set(Some("导出 CSV 失败".to_string()));
                }
            }
        });
    })
}

/// 高级搜索回调
pub fn make_on_advanced_search(
    search_query: UseStateHandle<String>,
    search_ext: UseStateHandle<String>,
    search_min_size: UseStateHandle<String>,
    search_max_size: UseStateHandle<String>,
    search_hash: UseStateHandle<String>,
    search_results: UseStateHandle<Vec<FileMetadata>>,
    search_loading: UseStateHandle<bool>,
    error_msg: UseStateHandle<String>,
) -> Callback<()> {
    Callback::from(move |_| {
        let query = search_query.to_string();
        let query_opt = if query.trim().is_empty() { None } else { Some(query.trim().to_string()) };
        let ext = search_ext.to_string();
        let ext_opt = if ext.trim().is_empty() { None } else { Some(ext.trim().to_string()) };
        let min_s = search_min_size.parse::<i64>().ok().filter(|&v| v > 0);
        let max_s = search_max_size.parse::<i64>().ok().filter(|&v| v > 0);
        let h = search_hash.to_string();
        let hash_opt = if h.trim().is_empty() { None } else { Some(h.trim().to_string()) };

        if query_opt.is_none() && ext_opt.is_none() && min_s.is_none() && max_s.is_none() && hash_opt.is_none() {
            error_msg.set("请输入至少一个搜索条件".to_string());
            return;
        }

        let search_results = search_results.clone();
        let search_loading = search_loading.clone();
        let error_msg = error_msg.clone();
        spawn_local(async move {
            search_loading.set(true);
            error_msg.set(String::new());
            let args = serde_wasm_bindgen::to_value(&AdvancedSearchArg {
                query: query_opt,
                ext: ext_opt,
                min_size: min_s,
                max_size: max_s,
                created_after: None,
                created_before: None,
                modified_after: None,
                modified_before: None,
                hash: hash_opt,
            }).unwrap_or(JsValue::NULL);
            match invoke("advanced_search_files", args).await {
                val if !val.is_null() && !val.is_undefined() => {
                    let files: Vec<FileMetadata> =
                        serde_wasm_bindgen::from_value(val).unwrap_or_default();
                    search_results.set(files);
                }
                _ => {
                    error_msg.set("搜索失败".to_string());
                }
            }
            search_loading.set(false);
        });
    })
}

/// 数据导出/导入：导出 JSON 回调
pub fn make_on_export_json(
    export_msg: UseStateHandle<Option<String>>,
) -> Callback<()> {
    Callback::from(move |_| {
        let export_msg = export_msg.clone();
        spawn_local(async move {
            match invoke("export_files_json", JsValue::NULL).await {
                val if !val.is_null() && !val.is_undefined() => {
                    let path: String = serde_wasm_bindgen::from_value(val).unwrap_or_default();
                    export_msg.set(Some(format!("JSON 已导出到: {}", path)));
                }
                _ => {
                    export_msg.set(Some("导出 JSON 失败".to_string()));
                }
            }
        });
    })
}

/// 数据导出/导入：导入 CSV 回调
pub fn make_on_import_csv(
    import_csv_content: UseStateHandle<String>,
    export_msg: UseStateHandle<Option<String>>,
    loading: UseStateHandle<bool>,
    error_msg: UseStateHandle<String>,
) -> Callback<()> {
    Callback::from(move |_| {
        let content = import_csv_content.to_string();
        if content.trim().is_empty() {
            error_msg.set("请输入 CSV 内容".to_string());
            return;
        }
        let import_csv_content = import_csv_content.clone();
        let export_msg = export_msg.clone();
        let loading = loading.clone();
        let error_msg = error_msg.clone();
        spawn_local(async move {
            loading.set(true);
            error_msg.set(String::new());
            let args = serde_wasm_bindgen::to_value(&ImportCsvArg {
                csv_content: content,
            }).unwrap_or(JsValue::NULL);
            match invoke("import_files_csv", args).await {
                val if !val.is_null() && !val.is_undefined() => {
                    let count: usize = serde_wasm_bindgen::from_value(val).unwrap_or(0);
                    import_csv_content.set(String::new());
                    export_msg.set(Some(format!("成功导入 {} 条记录", count)));
                }
                _ => {
                    error_msg.set("导入 CSV 失败".to_string());
                }
            }
            loading.set(false);
        });
    })
}

/// 刷新最近文件列表回调
pub fn make_on_refresh_recent(
    recent_files: UseStateHandle<Vec<RecentFileEntry>>,
    error_msg: UseStateHandle<String>,
) -> Callback<()> {
    Callback::from(move |_| {
        let recent_files = recent_files.clone();
        let error_msg = error_msg.clone();
        spawn_local(async move {
            let args = serde_wasm_bindgen::to_value(&20).unwrap_or(JsValue::NULL);
            match invoke("get_recent_files", args).await {
                val if !val.is_null() => {
                    let list: Vec<RecentFileEntry> =
                        serde_wasm_bindgen::from_value(val).unwrap_or_default();
                    recent_files.set(list);
                }
                _ => {
                    error_msg.set("获取最近文件失败".to_string());
                }
            }
        });
    })
}

/// 分页查询回调
pub fn make_on_refresh_paginated(
    paginated_files: UseStateHandle<PaginatedFiles>,
    current_page: UseStateHandle<i64>,
    page_size: UseStateHandle<i64>,
    error_msg: UseStateHandle<String>,
    loading: UseStateHandle<bool>,
) -> Callback<()> {
    Callback::from(move |_| {
        let paginated_files = paginated_files.clone();
        let current_page = current_page.clone();
        let page_size = page_size.clone();
        let error_msg = error_msg.clone();
        let loading = loading.clone();
        spawn_local(async move {
            loading.set(true);
            error_msg.set(String::new());
            let page = *current_page;
            let ps = *page_size;
            let args = serde_wasm_bindgen::to_value(&PaginationArg {
                page,
                page_size: ps,
            }).unwrap_or(JsValue::NULL);
            match invoke("get_files_paginated", args).await {
                val if !val.is_null() && !val.is_undefined() => {
                    let result: PaginatedFiles =
                        serde_wasm_bindgen::from_value(val).unwrap_or_default();
                    paginated_files.set(result);
                }
                _ => {
                    error_msg.set("获取文件列表失败".to_string());
                }
            }
            loading.set(false);
        });
    })
}

/// 分页导航：上一页回调
pub fn make_on_prev_page(
    current_page: UseStateHandle<i64>,
) -> Callback<()> {
    Callback::from(move |_| {
        let page = *current_page;
        if page > 1 {
            current_page.set(page - 1);
        }
    })
}

/// 分页导航：下一页回调
pub fn make_on_next_page(
    current_page: UseStateHandle<i64>,
    total_pages: UseStateHandle<i64>,
) -> Callback<()> {
    Callback::from(move |_| {
        let page = *current_page;
        let total = *total_pages;
        if page < total {
            current_page.set(page + 1);
        }
    })
}

/// 分页导航：跳转到指定页回调
pub fn make_on_go_to_page(
    current_page: UseStateHandle<i64>,
) -> Callback<i64> {
    Callback::from(move |page: i64| {
        current_page.set(page);
    })
}