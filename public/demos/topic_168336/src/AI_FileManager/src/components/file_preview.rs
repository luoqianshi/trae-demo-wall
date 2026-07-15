//! 文件预览弹窗组件
//! 显示文件详细信息：路径、大小、哈希、MIME 类型、时间戳

use crate::types::FileMetadata;
use crate::utils::{format_size, invoke};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;
use yew::prelude::*;

/// 文件预览弹窗属性
#[derive(Properties, Clone, PartialEq)]
pub struct FilePreviewProps {
    /// 是否显示
    pub show: bool,
    /// 要预览的文件
    pub file: Option<FileMetadata>,
    /// 关闭回调
    pub on_close: Callback<()>,
}

/// 文件预览弹窗组件
#[function_component(FilePreview)]
pub fn file_preview(props: &FilePreviewProps) -> Html {
    let FilePreviewProps { show, file, on_close } = props;

    if !*show || file.is_none() {
        return html! {};
    }

    let file = match file.as_ref() {
        Some(f) => f,
        None => return html! {},
    };
    let path = file.path.clone();
    let on_open = {
        Callback::from(move |_| {
            let path = path.clone();
            spawn_local(async move {
                let args = serde_wasm_bindgen::to_value(&path).unwrap_or(JsValue::NULL);
                let _ = invoke("open_file_location", args).await;
            });
        })
    };

    let mime_display = file.mime_type.as_deref().unwrap_or("未知");
    let created_display = if file.created_at.is_empty() { "未知" } else { &file.created_at };
    let modified_display = if file.modified_at.is_empty() { "未知" } else { &file.modified_at };

    html! {
        <div class="modal-overlay" onclick={let c = on_close.clone(); move |e: MouseEvent| {
            if e.target() == e.current_target() { c.emit(()); }
        }}>
            <div class="modal-content file-preview-modal">
                <div class="modal-header">
                    <h3>{"文件详情"}</h3>
                    <button class="modal-close" onclick={let c = on_close.clone(); move |_| c.emit(())}>{"×"}</button>
                </div>
                <div class="modal-body">
                    <div class="preview-field">
                        <span class="preview-label">{"路径"}</span>
                        <span class="preview-value" title={file.path.clone()}>{&file.path}</span>
                    </div>
                    <div class="preview-field">
                        <span class="preview-label">{"大小"}</span>
                        <span class="preview-value">{format_size(file.file_size)}</span>
                    </div>
                    <div class="preview-field">
                        <span class="preview-label">{"MIME 类型"}</span>
                        <span class="preview-value">{mime_display}</span>
                    </div>
                    <div class="preview-field">
                        <span class="preview-label">{"MD5"}</span>
                        <span class="preview-value mono">{&file.md5_hash}</span>
                    </div>
                    <div class="preview-field">
                        <span class="preview-label">{"SHA256"}</span>
                        <span class="preview-value mono">{&file.sha256_hash}</span>
                    </div>
                    <div class="preview-field">
                        <span class="preview-label">{"创建时间"}</span>
                        <span class="preview-value">{created_display}</span>
                    </div>
                    <div class="preview-field">
                        <span class="preview-label">{"修改时间"}</span>
                        <span class="preview-value">{modified_display}</span>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" onclick={on_open}>{"📂 打开文件位置"}</button>
                    <button class="btn-secondary" onclick={let c = on_close.clone(); move |_| c.emit(())}>{"关闭"}</button>
                </div>
            </div>
        </div>
    }
}