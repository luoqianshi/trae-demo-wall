//! 文件操作页面
//! 支持重命名、复制、创建文件/目录

use crate::types::FileMetadata;
use crate::utils::format_size;
use yew::prelude::*;

/// 渲染文件操作页面
pub fn render_file_ops(
    files: &UseStateHandle<Vec<FileMetadata>>,
    rename_file_id: &UseStateHandle<Option<i64>>,
    rename_new_name: &UseStateHandle<String>,
    copy_file_id: &UseStateHandle<Option<i64>>,
    copy_dest_dir: &UseStateHandle<String>,
    create_parent_dir: &UseStateHandle<String>,
    create_file_name: &UseStateHandle<String>,
    create_dir_name: &UseStateHandle<String>,
    on_refresh: &Callback<()>,
    on_rename: &Callback<()>,
    on_start_rename: &Callback<i64>,
    on_cancel_rename: &Callback<()>,
    on_copy: &Callback<()>,
    on_start_copy: &Callback<i64>,
    on_cancel_copy: &Callback<()>,
    on_create_file: &Callback<()>,
    on_create_dir: &Callback<()>,
    on_preview: &Callback<FileMetadata>,
) -> Html {
    let file_list = &*files;

    html! {
        <div class="page">
            <h1 class="page-title">{"文件操作"}</h1>

            <div class="classification-toolbar">
                <button class="btn-primary" onclick={let r = on_refresh.clone(); move |_| r.emit(())}>
                    {"刷新文件列表"}
                </button>
            </div>

            <div class="info-card" style="margin-bottom: 20px;">
                <h3>{"创建文件/目录"}</h3>
                <div class="create-dir-form" style="margin-bottom: 8px;">
                    <input
                        class="scan-input" type="text"
                        placeholder="父目录路径"
                        value={create_parent_dir.to_string()}
                        oninput={let c = create_parent_dir.clone(); move |e: InputEvent| {
                            let input = e.target_unchecked_into::<web_sys::HtmlInputElement>();
                            c.set(input.value());
                        }}
                    />
                    <input
                        class="scan-input" type="text" style="max-width: 160px;"
                        placeholder="文件名"
                        value={create_file_name.to_string()}
                        oninput={let c = create_file_name.clone(); move |e: InputEvent| {
                            let input = e.target_unchecked_into::<web_sys::HtmlInputElement>();
                            c.set(input.value());
                        }}
                    />
                    <button class="btn-primary" onclick={let c = on_create_file.clone(); move |_| c.emit(())}>
                        {"创建文件"}
                    </button>
                </div>
                <div class="create-dir-form">
                    <input
                        class="scan-input" type="text"
                        placeholder="父目录路径"
                        value={create_parent_dir.to_string()}
                        oninput={let c = create_parent_dir.clone(); move |e: InputEvent| {
                            let input = e.target_unchecked_into::<web_sys::HtmlInputElement>();
                            c.set(input.value());
                        }}
                    />
                    <input
                        class="scan-input" type="text" style="max-width: 160px;"
                        placeholder="目录名"
                        value={create_dir_name.to_string()}
                        oninput={let c = create_dir_name.clone(); move |e: InputEvent| {
                            let input = e.target_unchecked_into::<web_sys::HtmlInputElement>();
                            c.set(input.value());
                        }}
                    />
                    <button class="btn-primary" onclick={let c = on_create_dir.clone(); move |_| c.emit(())}>
                        {"创建目录"}
                    </button>
                </div>
            </div>

            <div class="info-card" style="margin-bottom: 20px;">
                <h3>{"复制文件"}</h3>
                <div class="create-dir-form">
                    <input
                        class="scan-input" type="text" style="max-width: 200px;"
                        placeholder="文件 ID（点击文件选择）"
                        value={if let Some(id) = **copy_file_id { id.to_string() } else { String::new() }}
                        readonly=true
                    />
                    <input
                        class="scan-input" type="text"
                        placeholder="目标目录路径"
                        value={copy_dest_dir.to_string()}
                        oninput={let c = copy_dest_dir.clone(); move |e: InputEvent| {
                            let input = e.target_unchecked_into::<web_sys::HtmlInputElement>();
                            c.set(input.value());
                        }}
                    />
                    <button class="btn-primary" disabled={copy_file_id.is_none()}
                        onclick={let c = on_copy.clone(); move |_| c.emit(())}>
                        {"复制"}
                    </button>
                    <button class="btn-secondary" onclick={let c = on_cancel_copy.clone(); move |_| c.emit(())}>
                        {"取消"}
                    </button>
                </div>
            </div>

            { if file_list.is_empty() {
                html! { <p class="empty-hint">{"暂无文件记录。请先扫描目录。"}</p> }
            } else {
                html! {
                    <div class="search-results">
                        <div class="file-row" style="font-weight: 600; color: var(--accent); border-bottom: 2px solid var(--border); padding-bottom: 8px; margin-bottom: 4px;">
                            <span class="file-path">{"文件路径"}</span>
                            <span class="file-size">{"大小"}</span>
                            <span style="flex: none; width: 160px; text-align: right;">{"操作"}</span>
                        </div>
                        { for file_list.iter().map(|file| {
                            let file_id = file.id;
                            let is_renaming = **rename_file_id == Some(file_id);
                            let on_preview = on_preview.clone();
                            let preview_file = file.clone();
                            let on_start_rename = on_start_rename.clone();
                            let on_start_copy = on_start_copy.clone();
                            html! {
                                <div class="file-row">
                                    <span class="file-path" title={file.path.clone()}>
                                        {&file.path}
                                    </span>
                                    <span class="file-size">{format_size(file.file_size)}</span>
                                    <span style="display: flex; gap: 4px; flex: none; width: 160px; justify-content: flex-end;">
                                        <button class="btn-small"
                                            onclick={let p = on_preview.clone(); let f = preview_file.clone(); move |e: MouseEvent| { e.stop_propagation(); p.emit(f.clone()); }}>
                                            {"👁️"}
                                        </button>
                                        <button class="btn-small"
                                            onclick={let s = on_start_rename.clone(); move |e: MouseEvent| { e.stop_propagation(); s.emit(file_id); }}>
                                            {"重命名"}
                                        </button>
                                        <button class="btn-small"
                                            onclick={let s = on_start_copy.clone(); move |e: MouseEvent| { e.stop_propagation(); s.emit(file_id); }}>
                                            {"复制"}
                                        </button>
                                    </span>
                                    { if is_renaming {
                                        html! {
                                            <div style="display: flex; gap: 4px; align-items: center; flex: none; width: 100%; margin-top: 4px; padding: 4px 0;">
                                                <input class="scan-input" type="text" style="flex: 1;"
                                                    placeholder="新文件名"
                                                    oninput={let r = rename_new_name.clone(); move |e: InputEvent| {
                                                        let input = e.target_unchecked_into::<web_sys::HtmlInputElement>();
                                                        r.set(input.value());
                                                    }}
                                                />
                                                <button class="btn-small" style="color: var(--success);"
                                                    onclick={let r = on_rename.clone(); move |e: MouseEvent| { e.stop_propagation(); r.emit(()); }}>
                                                    {"确认"}
                                                </button>
                                                <button class="btn-small btn-danger"
                                                    onclick={let c = on_cancel_rename.clone(); move |e: MouseEvent| { e.stop_propagation(); c.emit(()); }}>
                                                    {"取消"}
                                                </button>
                                            </div>
                                        }
                                    } else {
                                        html! {}
                                    }}
                                </div>
                            }
                        })}
                    </div>
                }
            }}
        </div>
    }
}