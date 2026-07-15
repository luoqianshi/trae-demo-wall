//! 标签管理页面
//! 创建、编辑、删除标签，查看标签下的文件

use crate::types::Tag;
use yew::prelude::*;

/// 渲染标签管理页面
pub fn render_tags(
    tags: &UseStateHandle<Vec<Tag>>,
    new_tag_name: &UseStateHandle<String>,
    new_tag_color: &UseStateHandle<String>,
    on_create_tag: &Callback<()>,
    on_delete_tag: &Callback<i64>,
    on_refresh_tags: &Callback<()>,
) -> Html {
    let tag_list = &*tags;
    html! {
        <div class="page">
            <h1 class="page-title">{"标签管理"}</h1>
            <div class="create-dir-form">
                <input
                    class="scan-input"
                    type="text"
                    placeholder="标签名称"
                    value={new_tag_name.to_string()}
                    oninput={let n = new_tag_name.clone(); move |e: InputEvent| {
                        let input = e.target_unchecked_into::<web_sys::HtmlInputElement>();
                        n.set(input.value());
                    }}
                />
                <input
                    class="scan-input color-input"
                    type="text"
                    placeholder="颜色代码（如 #ff0000）"
                    value={new_tag_color.to_string()}
                    oninput={let c = new_tag_color.clone(); move |e: InputEvent| {
                        let input = e.target_unchecked_into::<web_sys::HtmlInputElement>();
                        c.set(input.value());
                    }}
                    style="max-width: 160px;"
                />
                <button class="btn-primary" onclick={let c = on_create_tag.clone(); move |_| c.emit(())}>
                    {"创建标签"}
                </button>
                <button class="btn-secondary" onclick={let r = on_refresh_tags.clone(); move |_| r.emit(())}>
                    {"刷新"}
                </button>
            </div>
            { if tag_list.is_empty() {
                html! { <p class="empty-hint">{"暂无标签，请创建一个。"}</p> }
            } else {
                html! {
                    <div class="tags-grid">
                        { for tag_list.iter().map(|tag| {
                            let tag_id = tag.id;
                            let on_delete = on_delete_tag.clone();
                            let color_style = format!("border-left: 4px solid {}", tag.color);
                            html! {
                                <div class="tag-card" style={color_style}>
                                    <div class="tag-card-header">
                                        <span class="tag-name" style={format!("color: {}", tag.color)}>
                                            {&tag.name}
                                        </span>
                                        <span class="tag-count">{tag.file_count}{" 个文件"}</span>
                                    </div>
                                    <div class="tag-card-meta">
                                        <span>{"创建于 "}{&tag.created_at[..std::cmp::min(10, tag.created_at.len())]}</span>
                                    </div>
                                    <div class="tag-card-actions">
                                        <button class="btn-small btn-danger"
                                            onclick={move |_| on_delete.emit(tag_id)}>
                                            {"删除"}
                                        </button>
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