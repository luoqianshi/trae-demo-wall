//! 文件排序过滤页面
//! 支持按名称、大小、时间排序，按扩展名和大小范围过滤

use crate::types::FileMetadata;
use crate::utils::format_size;
use yew::prelude::*;

/// 渲染排序过滤页面
pub fn render_sort_filter(
    files: &UseStateHandle<Vec<FileMetadata>>,
    sort_by: &UseStateHandle<String>,
    sort_order: &UseStateHandle<String>,
    filter_ext: &UseStateHandle<String>,
    filter_min_size: &UseStateHandle<String>,
    filter_max_size: &UseStateHandle<String>,
    loading: &UseStateHandle<bool>,
    on_refresh: &Callback<()>,
    on_preview: &Callback<FileMetadata>,
) -> Html {
    let file_list = &*files;

    html! {
        <div class="page">
            <h1 class="page-title">{"文件排序与过滤"}</h1>

            <div class="create-dir-form" style="flex-wrap: wrap;">
                <select class="scan-input" style="max-width: 140px;"
                    value={sort_by.to_string()}
                    oninput={let s = sort_by.clone(); let r = on_refresh.clone(); move |e: InputEvent| {
                        let input = e.target_unchecked_into::<web_sys::HtmlSelectElement>();
                        s.set(input.value());
                        r.emit(());
                    }}>
                    <option value="path">{"按名称"}</option>
                    <option value="file_size">{"按大小"}</option>
                    <option value="created_at">{"按创建时间"}</option>
                    <option value="modified_at">{"按修改时间"}</option>
                </select>
                <select class="scan-input" style="max-width: 100px;"
                    value={sort_order.to_string()}
                    oninput={let s = sort_order.clone(); let r = on_refresh.clone(); move |e: InputEvent| {
                        let input = e.target_unchecked_into::<web_sys::HtmlSelectElement>();
                        s.set(input.value());
                        r.emit(());
                    }}>
                    <option value="asc">{"升序"}</option>
                    <option value="desc">{"降序"}</option>
                </select>
                <input
                    class="scan-input" style="max-width: 120px;"
                    type="text"
                    placeholder="扩展名过滤"
                    value={filter_ext.to_string()}
                    oninput={let f = filter_ext.clone(); let r = on_refresh.clone(); move |e: InputEvent| {
                        let input = e.target_unchecked_into::<web_sys::HtmlInputElement>();
                        f.set(input.value());
                        r.emit(());
                    }}
                />
                <input
                    class="scan-input" style="max-width: 100px;"
                    type="number" min="0"
                    placeholder="最小(KB)"
                    value={filter_min_size.to_string()}
                    oninput={let f = filter_min_size.clone(); let r = on_refresh.clone(); move |e: InputEvent| {
                        let input = e.target_unchecked_into::<web_sys::HtmlInputElement>();
                        f.set(input.value());
                        r.emit(());
                    }}
                />
                <input
                    class="scan-input" style="max-width: 100px;"
                    type="number" min="0"
                    placeholder="最大(KB)"
                    value={filter_max_size.to_string()}
                    oninput={let f = filter_max_size.clone(); let r = on_refresh.clone(); move |e: InputEvent| {
                        let input = e.target_unchecked_into::<web_sys::HtmlInputElement>();
                        f.set(input.value());
                        r.emit(());
                    }}
                />
            </div>

            <div class="summary">
                {format!("共 {} 个文件", file_list.len())}
            </div>

            { if file_list.is_empty() {
                html! { <p class="empty-hint">{"暂无匹配文件。请先扫描目录或调整过滤条件。"}</p> }
            } else {
                html! {
                    <div class="search-results">
                        <div class="file-row" style="font-weight: 600; color: var(--accent); border-bottom: 2px solid var(--border); padding-bottom: 8px; margin-bottom: 4px;">
                            <span class="file-path">{"文件路径"}</span>
                            <span class="file-size">{"大小"}</span>
                            <span class="file-hash" style="font-size: 11px;">{"修改时间"}</span>
                            <span style="flex: none; width: 40px;">{"操作"}</span>
                        </div>
                        { for file_list.iter().map(|file| {
                            let on_preview = on_preview.clone();
                            let preview_file = file.clone();
                            let modified = if file.modified_at.len() >= 19 {
                                &file.modified_at[..19]
                            } else {
                                &file.modified_at
                            };
                            html! {
                                <div class="file-row">
                                    <span class="file-path" title={file.path.clone()}>
                                        {&file.path}
                                    </span>
                                    <span class="file-size">{format_size(file.file_size)}</span>
                                    <span class="file-hash" style="font-size: 11px;">{modified}</span>
                                    <span style="flex: none; width: 40px;">
                                        <button class="btn-small"
                                            onclick={let p = on_preview.clone(); let f = preview_file.clone(); move |e: MouseEvent| { e.stop_propagation(); p.emit(f.clone()); }}>
                                            {"👁️"}
                                        </button>
                                    </span>
                                </div>
                            }
                        })}
                    </div>
                }
            }}

            { if **loading {
                html! { <div class="loading-overlay"><div class="spinner"></div><p>{"加载中..."}</p></div> }
            } else {
                html! {}
            }}
        </div>
    }
}