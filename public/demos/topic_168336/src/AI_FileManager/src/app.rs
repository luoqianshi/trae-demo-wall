//! 应用主组件
//! 管理页面导航、状态共享和全局事件监听

use crate::callbacks;
use crate::components::file_preview::FilePreview;
use crate::pages::*;
use crate::types::*;
use crate::utils::*;
use std::collections::HashMap;
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;
use yew::prelude::*;

/// 应用主组件
#[function_component(App)]
pub fn app() -> Html {
    let current_page = use_state(|| Page::Dashboard);

    // Data states
    let stats = use_state(FileStatistics::default);
    let scan_result = use_state(|| Option::<ScanResult>::None);
    let scan_progress = use_state(|| Option::<f64>::None);
    let duplicates = use_state(|| Vec::<DuplicateGroup>::new());
    let virtual_dirs = use_state(|| Vec::<VirtualDirectory>::new());
    let deletion_records = use_state(|| Vec::<DeletionRecord>::new());
    let delete_queue = use_state(|| Vec::<DeleteQueueItem>::new());
    let scan_path = use_state(String::new);
    let loading = use_state(|| false);
    let error_msg = use_state(String::new);
    let new_dir_name = use_state(String::new);
    let db_initialized = use_state(|| false);
    let classification_results = use_state(|| Vec::<ClassificationCategory>::new());
    let class_loading = use_state(|| false);
    let integration_status = use_state(|| Option::<IntegrationStatus>::None);
    let integration_loading = use_state(|| false);
    let integration_msg = use_state(|| Option::<String>::None);
    let expanded_dir = use_state(|| Option::<i64>::None);
    let dir_files_map = use_state(|| HashMap::<i64, Vec<FileMetadata>>::new());
    let search_results = use_state(|| Vec::<FileMetadata>::new());
    let search_query = use_state(String::new);
    let search_loading = use_state(|| false);
    let search_ext = use_state(String::new);
    let search_min_size = use_state(String::new);
    let search_max_size = use_state(String::new);
    let search_hash = use_state(String::new);
    let show_advanced = use_state(|| false);
    let export_msg = use_state(|| Option::<String>::None);
    // File preview modal state
    let preview_file = use_state(|| Option::<FileMetadata>::None);
    // Settings page state
    let db_path = use_state(|| "加载中...".to_string());
    // Tags page state
    let tags = use_state(|| Vec::<Tag>::new());
    let new_tag_name = use_state(String::new);
    let new_tag_color = use_state(|| "#4fc3f7".to_string());
    // Recent files page state
    let recent_files = use_state(|| Vec::<RecentFileEntry>::new());
    // Batch ops page state
    let batch_files = use_state(|| Vec::<FileMetadata>::new());
    let selected_ids = use_state(|| Vec::<i64>::new());
    let batch_target_dir = use_state(String::new);
    let batch_paginated = use_state(PaginatedFiles::default);
    let batch_page = use_state(|| 1i64);
    let batch_page_size = use_state(|| 50i64);
    let batch_total_pages = use_state(|| 1i64);
    // Sort/Filter page state
    let sort_filter_files = use_state(|| Vec::<FileMetadata>::new());
    let sort_by = use_state(|| "path".to_string());
    let sort_order = use_state(|| "asc".to_string());
    let filter_ext = use_state(String::new);
    let filter_min_size = use_state(String::new);
    let filter_max_size = use_state(String::new);
    // File ops page state
    let file_ops_files = use_state(|| Vec::<FileMetadata>::new());
    let rename_file_id = use_state(|| Option::<i64>::None);
    let rename_new_name = use_state(String::new);
    let copy_file_id = use_state(|| Option::<i64>::None);
    let copy_dest_dir = use_state(String::new);
    let create_parent_dir = use_state(String::new);
    let create_file_name = use_state(String::new);
    let create_dir_name = use_state(String::new);
    // Data IO page state
    let import_csv_content = use_state(String::new);

    // Initialize database on mount
    {
        let db_initialized = db_initialized.clone();
        let error_msg = error_msg.clone();
        let db_path = db_path.clone();
        use_effect_with((), move |_| {
            if !*db_initialized {
                let db_initialized = db_initialized.clone();
                let error_msg = error_msg.clone();
                let db_path = db_path.clone();
                spawn_local(async move {
                    match invoke("init_database", JsValue::NULL).await.as_string() {
                        Some(path) => {
                            db_initialized.set(true);
                            db_path.set(path);
                        }
                        None => {
                            error_msg.set("数据库初始化失败".to_string());
                        }
                    }
                });
            }
            || {}
        });
    }

    // Listen for scan-progress events
    {
        let scan_progress = scan_progress.clone();
        use_effect_with((), move |_| {
            let handler = Closure::<dyn Fn(JsValue)>::new(move |val| {
                if let Ok(prog) = serde_wasm_bindgen::from_value::<ScanProgress>(val) {
                    let pct = if prog.files_found > 0 {
                        prog.files_processed as f64 / prog.files_found as f64
                    } else {
                        0.0
                    };
                    scan_progress.set(Some(pct));
                    if prog.is_finished {
                        scan_progress.set(None);
                    }
                }
            });
            let js_handler = handler.as_ref().clone();
            handler.forget();
            // Register event listener via Tauri event system
            // In Yew WASM, we use window event listener
            let window = web_sys::window().unwrap();
            let _ = window.add_event_listener_with_callback(
                "scan-progress",
                js_handler.unchecked_ref(),
            );
            || {}
        });
    }

    // Callbacks from factory functions
    let go_to = callbacks::make_go_to(
        current_page.clone(),
        stats.clone(),
        duplicates.clone(),
        virtual_dirs.clone(),
        deletion_records.clone(),
        delete_queue.clone(),
        scan_result.clone(),
        error_msg.clone(),
        loading.clone(),
    );

    let on_scan = callbacks::make_on_scan(
        scan_path.clone(),
        scan_result.clone(),
        scan_progress.clone(),
        error_msg.clone(),
    );

    let on_cancel = callbacks::make_on_cancel(
        scan_progress.clone(),
    );

    let on_create_dir = callbacks::make_on_create_dir(
        new_dir_name.clone(),
        virtual_dirs.clone(),
        error_msg.clone(),
    );

    let on_classify = callbacks::make_on_classify(
        classification_results.clone(),
        class_loading.clone(),
        error_msg.clone(),
    );

    let on_check_integration = callbacks::make_on_check_integration(
        integration_status.clone(),
        integration_loading.clone(),
        integration_msg.clone(),
    );

    let on_install_integration = callbacks::make_on_install_integration(
        integration_status.clone(),
        integration_loading.clone(),
        integration_msg.clone(),
    );

    let on_uninstall_integration = callbacks::make_on_uninstall_integration(
        integration_status.clone(),
        integration_loading.clone(),
        integration_msg.clone(),
    );

    let on_toggle_dir = callbacks::make_on_toggle_dir(
        expanded_dir.clone(),
        dir_files_map.clone(),
        error_msg.clone(),
        loading.clone(),
    );

    let on_add_file_to_dir = callbacks::make_on_add_file_to_dir(
        dir_files_map.clone(),
        error_msg.clone(),
        loading.clone(),
    );

    let on_search = callbacks::make_on_advanced_search(
        search_query.clone(),
        search_ext.clone(),
        search_min_size.clone(),
        search_max_size.clone(),
        search_hash.clone(),
        search_results.clone(),
        search_loading.clone(),
        error_msg.clone(),
    );

    let toggle_advanced = {
        let show_advanced = show_advanced.clone();
        Callback::from(move |_| {
            let new_val = !*show_advanced;
            show_advanced.set(new_val);
        })
    };

    // Tag callbacks
    let on_create_tag = callbacks::make_on_create_tag(
        new_tag_name.clone(),
        new_tag_color.clone(),
        tags.clone(),
        error_msg.clone(),
    );

    let on_delete_tag = callbacks::make_on_delete_tag(
        tags.clone(),
        error_msg.clone(),
    );

    let on_refresh_tags = callbacks::make_on_refresh_tags(
        tags.clone(),
        error_msg.clone(),
    );

    // Recent files callbacks
    let on_refresh_recent = callbacks::make_on_refresh_recent(
        recent_files.clone(),
        error_msg.clone(),
    );

    // Batch ops callbacks
    let on_refresh_batch = callbacks::make_on_refresh_paginated(
        batch_paginated.clone(),
        batch_page.clone(),
        batch_page_size.clone(),
        error_msg.clone(),
        loading.clone(),
    );

    // Auto-refresh when batch page changes
    {
        let on_refresh_batch = on_refresh_batch.clone();
        let batch_page = batch_page.clone();
        use_effect_with(batch_page, move |_| {
            on_refresh_batch.emit(());
            || {}
        });
    }

    // Sync batch_files from batch_paginated
    {
        let batch_files = batch_files.clone();
        let batch_paginated = batch_paginated.clone();
        let batch_total_pages = batch_total_pages.clone();
        use_effect_with(batch_paginated, move |pg| {
            batch_files.set(pg.files.clone());
            batch_total_pages.set(pg.total_pages);
            || {}
        });
    }

    let on_toggle_select = callbacks::make_on_toggle_select(
        selected_ids.clone(),
    );
    let on_select_all = callbacks::make_on_select_all(
        batch_files.clone(),
        selected_ids.clone(),
    );
    let on_clear_selection = callbacks::make_on_clear_selection(
        selected_ids.clone(),
    );
    let on_batch_delete = callbacks::make_on_batch_delete(
        selected_ids.clone(),
        batch_files.clone(),
        error_msg.clone(),
        loading.clone(),
    );
    let on_batch_move = callbacks::make_on_batch_move(
        selected_ids.clone(),
        batch_target_dir.clone(),
        batch_files.clone(),
        error_msg.clone(),
        loading.clone(),
    );

    // Pagination callbacks
    let on_batch_prev = callbacks::make_on_prev_page(
        batch_page.clone(),
    );
    let on_batch_next = callbacks::make_on_next_page(
        batch_page.clone(),
        batch_total_pages.clone(),
    );
    let on_batch_go_to = callbacks::make_on_go_to_page(
        batch_page.clone(),
    );

    // Sort/Filter callbacks
    let on_refresh_sorted = callbacks::make_on_refresh_sorted(
        sort_filter_files.clone(),
        sort_by.clone(),
        sort_order.clone(),
        filter_ext.clone(),
        filter_min_size.clone(),
        filter_max_size.clone(),
        loading.clone(),
        error_msg.clone(),
    );

    // File ops callbacks
    let on_refresh_file_ops = callbacks::make_on_refresh_file_ops(
        file_ops_files.clone(),
        error_msg.clone(),
    );
    let on_start_rename = callbacks::make_on_start_rename(
        rename_file_id.clone(),
        rename_new_name.clone(),
    );
    let on_cancel_rename = callbacks::make_on_cancel_rename(
        rename_file_id.clone(),
    );
    let on_rename = callbacks::make_on_rename(
        rename_file_id.clone(),
        rename_new_name.clone(),
        file_ops_files.clone(),
        error_msg.clone(),
    );
    let on_start_copy = callbacks::make_on_start_copy(
        copy_file_id.clone(),
    );
    let on_cancel_copy = callbacks::make_on_cancel_copy(
        copy_file_id.clone(),
        copy_dest_dir.clone(),
    );
    let on_copy = callbacks::make_on_copy(
        copy_file_id.clone(),
        copy_dest_dir.clone(),
        file_ops_files.clone(),
        error_msg.clone(),
    );
    let on_create_file = callbacks::make_on_create_file(
        create_parent_dir.clone(),
        create_file_name.clone(),
        file_ops_files.clone(),
        error_msg.clone(),
    );
    let on_create_dir2 = callbacks::make_on_create_dir2(
        create_parent_dir.clone(),
        create_dir_name.clone(),
        error_msg.clone(),
    );

    // Data IO callbacks
    let on_export_csv = callbacks::make_on_export_csv(
        export_msg.clone(),
    );
    let on_export_json = callbacks::make_on_export_json(
        export_msg.clone(),
    );
    let on_import_csv = callbacks::make_on_import_csv(
        import_csv_content.clone(),
        export_msg.clone(),
        loading.clone(),
        error_msg.clone(),
    );

    // File preview callbacks
    let on_preview = {
        let preview_file = preview_file.clone();
        Callback::from(move |file: FileMetadata| {
            preview_file.set(Some(file));
        })
    };

    let on_close_preview = {
        let preview_file = preview_file.clone();
        Callback::from(move |_| {
            preview_file.set(None);
        })
    };

    let page_content = match *current_page {
        Page::Dashboard => render_dashboard(&stats),
        Page::Scanner => render_scanner(&scan_path, &scan_result, &scan_progress, &on_scan, &on_cancel),
        Page::Duplicates => render_duplicates(&duplicates, &export_msg, &on_preview),
        Page::VirtualDirs => render_virtual_dirs(&virtual_dirs, &new_dir_name, &on_create_dir, &dir_files_map, &expanded_dir, &on_toggle_dir, &on_add_file_to_dir),
        Page::Deletion => render_deletion(&deletion_records, &delete_queue, &error_msg),
        Page::Classification => render_classification(&classification_results, &on_classify, &class_loading, &error_msg),
        Page::Integration => render_integration(&integration_status, &on_check_integration, &on_install_integration, &on_uninstall_integration, &integration_loading, &integration_msg),
        Page::Search => render_search(&search_results, &search_query, &on_search, &search_loading, &error_msg, &on_preview, &search_ext, &search_min_size, &search_max_size, &search_hash, &show_advanced, &toggle_advanced),
        Page::Settings => render_settings(&db_path),
        Page::Tags => render_tags(&tags, &new_tag_name, &new_tag_color, &on_create_tag, &on_delete_tag, &on_refresh_tags),
        Page::RecentFiles => render_recent_files(&recent_files, &on_refresh_recent, &on_preview),
        Page::BatchOps => render_batch_ops(&batch_files, &selected_ids, &batch_target_dir, &on_refresh_batch, &on_toggle_select, &on_select_all, &on_clear_selection, &on_batch_delete, &on_batch_move, &on_preview, &batch_paginated, &on_batch_prev, &on_batch_next, &on_batch_go_to),
        Page::SortFilter => render_sort_filter(&sort_filter_files, &sort_by, &sort_order, &filter_ext, &filter_min_size, &filter_max_size, &loading, &on_refresh_sorted, &on_preview),
        Page::FileOps => render_file_ops(&file_ops_files, &rename_file_id, &rename_new_name, &copy_file_id, &copy_dest_dir, &create_parent_dir, &create_file_name, &create_dir_name, &on_refresh_file_ops, &on_rename, &on_start_rename, &on_cancel_rename, &on_copy, &on_start_copy, &on_cancel_copy, &on_create_file, &on_create_dir2, &on_preview),
        Page::DataIO => render_data_io(&export_msg, &import_csv_content, &loading, &on_export_csv, &on_export_json, &on_import_csv),
    };

    html! {
        <div class="app">
            <nav class="sidebar">
                <div class="sidebar-header">
                    <h2>{"AI FileManager"}</h2>
                </div>
                <ul class="nav-list">
                    <li class={nav_class(*current_page == Page::Dashboard)}
                        onclick={let g = go_to.clone(); move |_| g.emit(Page::Dashboard)}>
                        <span class="nav-icon">{"📊"}</span>
                        <span>{"仪表盘"}</span>
                    </li>
                    <li class={nav_class(*current_page == Page::Scanner)}
                        onclick={let g = go_to.clone(); move |_| g.emit(Page::Scanner)}>
                        <span class="nav-icon">{"🔍"}</span>
                        <span>{"文件扫描"}</span>
                    </li>
                    <li class={nav_class(*current_page == Page::Duplicates)}
                        onclick={let g = go_to.clone(); move |_| g.emit(Page::Duplicates)}>
                        <span class="nav-icon">{"📋"}</span>
                        <span>{"重复文件"}</span>
                    </li>
                    <li class={nav_class(*current_page == Page::VirtualDirs)}
                        onclick={let g = go_to.clone(); move |_| g.emit(Page::VirtualDirs)}>
                        <span class="nav-icon">{"📁"}</span>
                        <span>{"虚拟目录"}</span>
                    </li>
                    <li class={nav_class(*current_page == Page::Deletion)}
                        onclick={let g = go_to.clone(); move |_| g.emit(Page::Deletion)}>
                        <span class="nav-icon">{"🗑️"}</span>
                        <span>{"删除管理"}</span>
                    </li>
                    <li class={nav_class(*current_page == Page::Classification)}
                        onclick={let g = go_to.clone(); move |_| g.emit(Page::Classification)}>
                        <span class="nav-icon">{"🤖"}</span>
                        <span>{"AI 分类"}</span>
                    </li>
                    <li class={nav_class(*current_page == Page::Integration)}
                        onclick={let g = go_to.clone(); move |_| g.emit(Page::Integration)}>
                        <span class="nav-icon">{"🔌"}</span>
                        <span>{"系统集成"}</span>
                    </li>
                    <li class={nav_class(*current_page == Page::Search)}
                        onclick={let g = go_to.clone(); move |_| g.emit(Page::Search)}>
                        <span class="nav-icon">{"🔎"}</span>
                        <span>{"搜索"}</span>
                    </li>
                    <li class={nav_class(*current_page == Page::Tags)}
                        onclick={let g = go_to.clone(); move |_| g.emit(Page::Tags)}>
                        <span class="nav-icon">{"🏷️"}</span>
                        <span>{"标签管理"}</span>
                    </li>
                    <li class={nav_class(*current_page == Page::RecentFiles)}
                        onclick={let g = go_to.clone(); move |_| g.emit(Page::RecentFiles)}>
                        <span class="nav-icon">{"🕐"}</span>
                        <span>{"最近文件"}</span>
                    </li>
                    <li class={nav_class(*current_page == Page::BatchOps)}
                        onclick={let g = go_to.clone(); move |_| g.emit(Page::BatchOps)}>
                        <span class="nav-icon">{"📦"}</span>
                        <span>{"批量操作"}</span>
                    </li>
                    <li class={nav_class(*current_page == Page::SortFilter)}
                        onclick={let g = go_to.clone(); move |_| g.emit(Page::SortFilter)}>
                        <span class="nav-icon">{"🔀"}</span>
                        <span>{"排序过滤"}</span>
                    </li>
                    <li class={nav_class(*current_page == Page::FileOps)}
                        onclick={let g = go_to.clone(); move |_| g.emit(Page::FileOps)}>
                        <span class="nav-icon">{"✏️"}</span>
                        <span>{"文件操作"}</span>
                    </li>
                    <li class={nav_class(*current_page == Page::DataIO)}
                        onclick={let g = go_to.clone(); move |_| g.emit(Page::DataIO)}>
                        <span class="nav-icon">{"📤"}</span>
                        <span>{"数据导入/导出"}</span>
                    </li>
                </ul>
                <div class="sidebar-footer">
                    <li class={nav_class(*current_page == Page::Settings)}
                        onclick={let g = go_to.clone(); move |_| g.emit(Page::Settings)}>
                        <span class="nav-icon">{"⚙️"}</span>
                        <span>{"设置"}</span>
                    </li>
                </div>
            </nav>
            <main class="main-content">
                { if *loading {
                    html! { <div class="loading-overlay"><div class="spinner"></div><p>{"处理中..."}</p></div> }
                } else {
                    html! {}
                }}
                { if !error_msg.is_empty() {
                    html! { <div class="error-bar">{ &*error_msg }</div> }
                } else {
                    html! {}
                }}
                { page_content }
            </main>
            <FilePreview show={preview_file.is_some()} file={(*preview_file).clone()} on_close={on_close_preview} />
        </div>
    }
}

fn nav_class(active: bool) -> String {
    if active {
        "nav-item active".to_string()
    } else {
        "nav-item".to_string()
    }
}