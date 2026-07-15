//! 虚拟目录页面
//! 创建和管理虚拟目录，支持拖拽文件到目录

use crate::types::{FileMetadata, VirtualDirectory};
use crate::utils::format_size;
use std::collections::HashMap;
use wasm_bindgen::JsCast;
use web_sys::{DragEvent, HtmlElement};
use yew::prelude::*;

/// 渲染虚拟目录页面
pub fn render_virtual_dirs(
    virtual_dirs: &UseStateHandle<Vec<VirtualDirectory>>,
    new_dir_name: &UseStateHandle<String>,
    on_create: &Callback<()>,
    dir_files_map: &UseStateHandle<HashMap<i64, Vec<FileMetadata>>>,
    expanded_dir: &UseStateHandle<Option<i64>>,
    on_toggle_dir: &Callback<i64>,
    on_add_file_to_dir: &Callback<(i64, i64)>,
) -> Html {
    let dirs = &*virtual_dirs;
    html! {
        <div class="page">
            <h1 class="page-title">{"虚拟目录"}</h1>
            <div class="create-dir-form">
                <input
                    class="scan-input"
                    type="text"
                    placeholder="输入新目录名称"
                    value={new_dir_name.to_string()}
                    oninput={let n = new_dir_name.clone(); move |e: InputEvent| {
                        let input = e.target_unchecked_into::<web_sys::HtmlInputElement>();
                        n.set(input.value());
                    }}
                />
                <button class="btn-primary" onclick={let c = on_create.clone(); move |_| c.emit(())}>
                    {"创建目录"}
                </button>
            </div>
            { if dirs.is_empty() {
                html! { <p class="empty-hint">{"暂无虚拟目录，请创建一个。"}</p> }
            } else {
                html! {
                    <div class="dir-list">
                        { for dirs.iter().map(|dir| {
                            let dir_id = dir.id;
                            let is_expanded = **expanded_dir == Some(dir_id);
                            let files = dir_files_map.get(&dir_id).cloned().unwrap_or_default();
                            render_dir_card(dir, is_expanded, &files, on_toggle_dir, on_add_file_to_dir)
                        })}
                    </div>
                }
            }}
        </div>
    }
}

/// 渲染单个目录卡片
fn render_dir_card(
    dir: &VirtualDirectory,
    is_expanded: bool,
    files: &[FileMetadata],
    on_toggle_dir: &Callback<i64>,
    on_add_file_to_dir: &Callback<(i64, i64)>,
) -> Html {
    let dir_id = dir.id;
    let toggle = on_toggle_dir.clone();
    let add_file = on_add_file_to_dir.clone();

    // 拖拽事件处理
    let dir_id_clone = dir_id;

    let ondragover = Callback::from(move |e: DragEvent| {
        e.prevent_default();
        if let Some(target) = e.target() {
            if let Some(el) = target.dyn_ref::<HtmlElement>() {
                let _ = el.set_attribute("data-drag-over", "true");
            }
        }
    });

    let ondragleave = Callback::from(move |e: DragEvent| {
        e.prevent_default();
        if let Some(target) = e.target() {
            if let Some(el) = target.dyn_ref::<HtmlElement>() {
                let _ = el.remove_attribute("data-drag-over");
            }
        }
    });

    let ondrop = Callback::from(move |e: DragEvent| {
        e.prevent_default();
        if let Some(target) = e.target() {
            if let Some(el) = target.dyn_ref::<HtmlElement>() {
                let _ = el.remove_attribute("data-drag-over");
            }
        }
        if let Some(transfer) = e.data_transfer() {
            if let Ok(file_id_str) = transfer.get_data("text/plain") {
                if let Ok(file_id) = file_id_str.parse::<i64>() {
                    add_file.emit((dir_id_clone, file_id));
                }
            }
        }
    });

    html! {
        <div class="dir-card"
            ondragover={ondragover}
            ondragleave={ondragleave}
            ondrop={ondrop}
        >
            <div class="dir-card-header" onclick={let t = toggle.clone(); move |_| t.emit(dir_id)}>
                <div class="dir-icon">{ if is_expanded { "📂" } else { "📁" } }</div>
                <div class="dir-info">
                    <div class="dir-name">{&dir.name}</div>
                    <div class="dir-meta">
                        {"创建于 "}{&dir.created_at[..std::cmp::min(10, dir.created_at.len())]}
                        { if dir.ai_generated { " · AI 生成" } else { "" } }
                        { " · " }{files.len()}{" 个文件" }
                    </div>
                </div>
                <span class="dir-expand-icon">{ if is_expanded { "▼" } else { "▶" } }</span>
            </div>
            { if is_expanded {
                html! {
                    <div class="dir-files">
                        { if files.is_empty() {
                            html! { <p class="dir-files-empty">{"拖拽文件到此处添加到目录"}</p> }
                        } else {
                            html! {
                                <>
                                    { for files.iter().map(|f| {
                                        render_file_row(f, dir_id, on_add_file_to_dir)
                                    })}
                                </>
                            }
                        }}
                    </div>
                }
            } else {
                html! {}
            }}
        </div>
    }
}

/// 渲染单个文件行（可拖拽）
fn render_file_row(
    file: &FileMetadata,
    _dir_id: i64,
    _on_add_file_to_dir: &Callback<(i64, i64)>,
) -> Html {
    let file_id = file.id;
    let path = file.path.clone();

    // 拖拽开始
    let ondragstart = Callback::from(move |e: DragEvent| {
        if let Some(transfer) = e.data_transfer() {
            let _ = transfer.set_data("text/plain", &file_id.to_string());
        }
        if let Some(target) = e.target() {
            if let Ok(el) = target.dyn_into::<HtmlElement>() {
                let _ = el.set_attribute("data-file-id", &file_id.to_string());
            }
        }
    });

    html! {
        <div class="file-row" draggable="true" {ondragstart}>
            <span class="file-path" title={path.clone()}>{&path}</span>
            <span class="file-size">{format_size(file.file_size)}</span>
        </div>
    }
}