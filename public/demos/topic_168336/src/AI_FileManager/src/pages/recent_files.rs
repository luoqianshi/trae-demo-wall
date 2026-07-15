//! 最近文件页面
//! 显示最近扫描、预览的文件列表

use crate::types::{FileMetadata, RecentFileEntry};
use crate::utils::format_size;
use yew::prelude::*;

/// 渲染最近文件页面
pub fn render_recent_files(
    recent_files: &UseStateHandle<Vec<RecentFileEntry>>,
    on_refresh: &Callback<()>,
    on_preview: &Callback<FileMetadata>,
) -> Html {
    let files = &*recent_files;
    html! {
        <div class="page">
            <h1 class="page-title">{"最近文件"}</h1>
            <div class="classification-toolbar">
                <button class="btn-primary" onclick={let r = on_refresh.clone(); move |_| r.emit(())}>
                    {"刷新"}
                </button>
            </div>
            { if files.is_empty() {
                html! { <p class="empty-hint">{"暂无最近文件记录。扫描文件后，预览或操作的文件将显示在此处。"}</p> }
            } else {
                html! {
                    <div class="search-results">
                        { for files.iter().map(|entry| {
                            let action_label = match entry.action_type.as_str() {
                                "preview" => "预览",
                                "scan" => "扫描",
                                "open_location" => "打开位置",
                                _ => &entry.action_type,
                            };
                            let preview_file = FileMetadata {
                                id: entry.file_id,
                                path: entry.file_path.clone(),
                                file_size: entry.file_size,
                                mime_type: entry.mime_type.clone(),
                                md5_hash: String::new(),
                                sha256_hash: String::new(),
                                created_at: String::new(),
                                modified_at: String::new(),
                                is_deleted: false,
                                deleted_at: None,
                            };
                            let on_preview_clone = on_preview.clone();
                            html! {
                                <div class="file-row">
                                    <span class="file-path" title={entry.file_path.clone()}>
                                        {&entry.file_path}
                                    </span>
                                    <span class="file-size">{format_size(entry.file_size)}</span>
                                    <span class="deletion-status pending">{action_label}</span>
                                    <span class="file-hash" style="font-size: 11px;">
                                        {&entry.accessed_at[..std::cmp::min(19, entry.accessed_at.len())]}
                                    </span>
                                    <button class="btn-small"
                                        onclick={let p = on_preview_clone.clone(); move |_| p.emit(preview_file.clone())}>
                                        {"👁️"}
                                    </button>
                                </div>
                            }
                        })}
                    </div>
                }
            }}
        </div>
    }
}