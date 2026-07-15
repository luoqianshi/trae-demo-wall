//! AI 智能分类页面
//! 对文件进行自动分类，展示分类结果

use crate::types::ClassificationCategory;
use yew::prelude::*;

/// 渲染分类页面
pub fn render_classification(
    categories: &UseStateHandle<Vec<ClassificationCategory>>,
    on_classify: &Callback<()>,
    class_loading: &UseStateHandle<bool>,
    error_msg: &UseStateHandle<String>,
) -> Html {
    let cats = &*categories;
    let loading = **class_loading;

    html! {
        <div class="page">
            <h1 class="page-title">{"AI 智能分类"}</h1>
            <div class="classification-toolbar">
                <button
                    class="btn-primary"
                    onclick={let c = on_classify.clone(); move |_| c.emit(())}
                    disabled={loading}
                >
                    { if loading { "分类中..." } else { "开始分类" } }
                </button>
                { if loading {
                    html! { <span class="loading-text">{"正在分析文件特征并聚类..."}</span> }
                } else {
                    html! {}
                }}
            </div>

            { if !error_msg.is_empty() {
                html! { <div class="error-bar">{ &**error_msg }</div> }
            } else if cats.is_empty() {
                html! { <p class="empty-hint">{"暂无分类结果，请点击「开始分类」按钮对文件进行智能分类。"}</p> }
            } else {
                html! {
                    <div class="classification-results">
                        <p class="summary">{"共 "}{cats.len()}{" 个分类"}</p>
                        <div class="category-grid">
                            { for cats.iter().map(|cat| {
                                let file_count = cat.files.len();
                                html! {
                                    <div class="category-card">
                                        <div class="category-header">
                                            <span class="category-icon">{"📂"}</span>
                                            <span class="category-name">{&cat.name}</span>
                                            <span class="category-count">{file_count}{" 个文件"}</span>
                                        </div>
                                        <div class="category-files">
                                            { for cat.files.iter().map(|_file_id| {
                                                // 文件 ID 展示为文件条目占位
                                                html! {
                                                    <div class="file-row">
                                                        <span class="file-id">{"#"}<code>{_file_id}</code></span>
                                                    </div>
                                                }
                                            })}
                                        </div>
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