//! 高级文件搜索页面
//! 支持按关键字、扩展名、大小范围、哈希值组合搜索

use crate::types::FileMetadata;
use crate::utils::{format_size, invoke};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;
use yew::prelude::*;

/// 渲染高级文件搜索页面
pub fn render_search(
    search_results: &UseStateHandle<Vec<FileMetadata>>,
    search_query: &UseStateHandle<String>,
    on_search: &Callback<()>,
    search_loading: &UseStateHandle<bool>,
    error_msg: &UseStateHandle<String>,
    on_preview: &Callback<FileMetadata>,
    search_ext: &UseStateHandle<String>,
    search_min_size: &UseStateHandle<String>,
    search_max_size: &UseStateHandle<String>,
    search_hash: &UseStateHandle<String>,
    show_advanced: &UseStateHandle<bool>,
    toggle_advanced: &Callback<()>,
) -> Html {
    let results = &*search_results;
    let loading = **search_loading;
    let advanced_open = **show_advanced;

    html! {
        <div class="page">
            <h1 class="page-title">{"文件搜索"}</h1>

            <div class="info-card" style="margin-bottom: 16px;">
                <div class="search-form">
                    <input
                        class="scan-input"
                        type="text"
                        placeholder="输入文件名或路径关键字..."
                        value={search_query.to_string()}
                        oninput={let q = search_query.clone(); move |e: InputEvent| {
                            let input = e.target_unchecked_into::<web_sys::HtmlInputElement>();
                            q.set(input.value());
                        }}
                        onkeydown={let s = on_search.clone(); move |e: web_sys::KeyboardEvent| {
                            if e.key() == "Enter" { s.emit(()); }
                        }}
                    />
                    <button class="btn-primary" onclick={let s = on_search.clone(); move |_| s.emit(())} disabled={loading}>
                        { if loading { "搜索中..." } else { "搜索" } }
                    </button>
                    <button class="btn-secondary" onclick={let t = toggle_advanced.clone(); move |_| t.emit(())}>
                        { if advanced_open { "收起高级选项 ▲" } else { "高级选项 ▼" } }
                    </button>
                </div>

                { if advanced_open {
                    html! {
                        <div class="advanced-search-panel" style="margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border);">
                            <div class="sort-filter-row">
                                <div class="filter-group">
                                    <label class="filter-label">{"扩展名"}</label>
                                    <input class="scan-input filter-input"
                                        type="text"
                                        placeholder="如 txt, pdf"
                                        value={search_ext.to_string()}
                                        oninput={let e = search_ext.clone(); move |ev: InputEvent| {
                                            let input = ev.target_unchecked_into::<web_sys::HtmlInputElement>();
                                            e.set(input.value());
                                        }}
                                    />
                                </div>
                                <div class="filter-group">
                                    <label class="filter-label">{"最小大小(KB)"}</label>
                                    <input class="scan-input filter-input"
                                        type="number" min="0"
                                        placeholder="0"
                                        value={search_min_size.to_string()}
                                        oninput={let s = search_min_size.clone(); move |ev: InputEvent| {
                                            let input = ev.target_unchecked_into::<web_sys::HtmlInputElement>();
                                            s.set(input.value());
                                        }}
                                    />
                                </div>
                                <div class="filter-group">
                                    <label class="filter-label">{"最大大小(KB)"}</label>
                                    <input class="scan-input filter-input"
                                        type="number" min="0"
                                        placeholder="0"
                                        value={search_max_size.to_string()}
                                        oninput={let s = search_max_size.clone(); move |ev: InputEvent| {
                                            let input = ev.target_unchecked_into::<web_sys::HtmlInputElement>();
                                            s.set(input.value());
                                        }}
                                    />
                                </div>
                            </div>
                            <div class="sort-filter-row" style="margin-top: 8px;">
                                <div class="filter-group" style="flex: 1;">
                                    <label class="filter-label">{"哈希值(MD5/SHA256)"}</label>
                                    <input class="scan-input filter-input"
                                        type="text"
                                        placeholder="输入 MD5 或 SHA256 前缀..."
                                        value={search_hash.to_string()}
                                        oninput={let h = search_hash.clone(); move |ev: InputEvent| {
                                            let input = ev.target_unchecked_into::<web_sys::HtmlInputElement>();
                                            h.set(input.value());
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    }
                } else {
                    html! {}
                }}
            </div>

            { if !error_msg.is_empty() {
                html! { <div class="error-bar">{ &**error_msg }</div> }
            } else if results.is_empty() && !search_query.is_empty() {
                html! { <p class="empty-hint">{"未找到匹配的文件。"}</p> }
            } else if results.is_empty() {
                html! { <p class="empty-hint">{"输入关键字后点击搜索或按 Enter 键。"}</p> }
            } else {
                html! {
                    <div class="search-results">
                        <p class="summary">{"共找到 "}{results.len()}{" 个文件"}</p>
                        <div class="file-list">
                            { for results.iter().map(|f| {
                                let path = f.path.clone();
                                let hash_len = std::cmp::min(8, f.md5_hash.len());
                                let hash_preview = format!("{}..", &f.md5_hash[..hash_len]);
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
                                let mime_str = f.mime_type.as_deref().unwrap_or("-").to_string();
                                html! {
                                    <div class="file-row">
                                        <span class="file-path" title={f.path.clone()}>{&f.path}</span>
                                        <span class="file-size">{format_size(f.file_size)}</span>
                                        <span class="file-mime" title={mime_str.clone()}>{mime_str}</span>
                                        <span class="file-hash" title={format!("MD5: {}\nSHA256: {}", f.md5_hash, f.sha256_hash)}>
                                            {hash_preview}
                                        </span>
                                        <button class="btn-small" onclick={on_preview_click}>{"👁️"}</button>
                                        <button class="btn-small" onclick={on_open}>{"📂"}</button>
                                    </div>
                                }
                            })}
                        </div>
                    </div>
                }
            }}
        </div>
    }
}