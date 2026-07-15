//! 重复文件检测页面
//! 显示重复文件分组列表

use crate::types::{DuplicateGroup, FileMetadata};
use crate::utils::{format_size, invoke};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;
use yew::prelude::*;

/// 渲染重复文件检测页面
pub fn render_duplicates(
    duplicates: &UseStateHandle<Vec<DuplicateGroup>>,
    export_msg: &UseStateHandle<Option<String>>,
    on_preview: &Callback<FileMetadata>,
) -> Html {
    let groups = &*duplicates;
    let on_export_duplicates = {
        let export_msg = export_msg.clone();
        Callback::from(move |_| {
            let export_msg = export_msg.clone();
            spawn_local(async move {
                match invoke("export_duplicates_csv", JsValue::NULL).await.as_string() {
                    Some(path) => {
                        export_msg.set(Some(format!("已导出到: {}", path)));
                    }
                    None => {
                        export_msg.set(Some("导出失败：没有重复文件数据".to_string()));
                    }
                }
            });
        })
    };
    html! {
        <div class="page">
            <h1 class="page-title">{"重复文件检测"}</h1>
            { if !groups.is_empty() {
                html! {
                    <div class="duplicates-toolbar">
                        <button class="btn-primary" onclick={on_export_duplicates}>{"📥 导出CSV"}</button>
                        { if let Some(msg) = export_msg.as_ref() {
                            html! { <span class="info-bar" style="display:inline-block;margin:0;">{msg}</span> }
                        } else { html! {} }}
                    </div>
                }
            } else { html! {} }}
            { if groups.is_empty() {
                html! { <p class="empty-hint">{"暂无重复文件数据，请先扫描目录。"}</p> }
            } else {
                html! {
                    <div class="duplicate-list">
                        <p class="summary">{"共发现 "}{groups.len()}{" 组重复文件"}</p>
                        { for groups.iter().map(|group| {
                            let file_count = group.files.len();
                            html! {
                                <div class="duplicate-group">
                                    <div class="group-header">
                                        <span class="group-id">{"#"}{group.group_id}</span>
                                        <span class="group-info">
                                            {file_count}{" 个文件 · "}{format_size(group.file_size)}
                                        </span>
                                        <span class="group-hash" title={group.md5_hash.clone()}>
                                            {"MD5: "}{&group.md5_hash[..std::cmp::min(16, group.md5_hash.len())]}{"..."}
                                        </span>
                                    </div>
                                    <div class="group-files">
                                        { for group.files.iter().map(|f| {
                                            let path = f.path.clone();
                                            let on_preview = on_preview.clone();
                                            let file_for_preview = f.clone();
                                            let on_open = Callback::from(move |_| {
                                                let path = path.clone();
                                                spawn_local(async move {
                                                    let args = serde_wasm_bindgen::to_value(&path).unwrap_or(JsValue::NULL);
                                                    let _ = invoke("open_file_location", args).await;
                                                });
                                            });
                                            let on_preview_click = {
                                                let on_preview = on_preview.clone();
                                                let file = file_for_preview.clone();
                                                Callback::from(move |_| on_preview.emit(file.clone()))
                                            };
                                            html! {
                                                <div class="file-row">
                                                    <span class="file-path">{&f.path}</span>
                                                    <span class="file-size">{format_size(f.file_size)}</span>
                                                    <button class="btn-small" onclick={on_preview_click}>{"👁️"}</button>
                                                    <button class="btn-small" onclick={on_open}>{"📂"}</button>
                                                </div>
                                            }
                                        })}
                                    </div>
                                </div>
                            }
                        })}
                    </div>
                }
            }}
        </div>
    }
}