//! 分页控件组件
//! 提供页面导航和页码显示

use yew::prelude::*;

/// 分页控件属性
#[derive(Properties, PartialEq)]
pub struct PaginationProps {
    pub page: i64,
    pub total_pages: i64,
    pub total: i64,
    pub on_prev: Callback<()>,
    pub on_next: Callback<()>,
    pub on_go_to: Callback<i64>,
}

/// 分页控件组件
#[function_component(Pagination)]
pub fn pagination(props: &PaginationProps) -> Html {
    let page = props.page;
    let total_pages = props.total_pages;

    if total_pages <= 1 {
        return html! {};
    }

    // 生成页码列表（最多显示 7 页）
    let mut page_numbers = Vec::new();
    let start = (page - 3).max(1);
    let end = (page + 3).min(total_pages);
    for p in start..=end {
        page_numbers.push(p);
    }

    let on_prev = props.on_prev.clone();
    let on_next = props.on_next.clone();
    let on_go_to = props.on_go_to.clone();

    html! {
        <div class="pagination">
            <button class="pagination-btn"
                disabled={page <= 1}
                onclick={move |_| on_prev.emit(())}>
                {"‹ 上一页"}
            </button>
            { for page_numbers.iter().map(|&p| {
                let on_go_to = on_go_to.clone();
                let is_active = p == page;
                html! {
                    <button class={classes!("pagination-btn", if is_active { "pagination-active" } else { "" })}
                        onclick={move |_| on_go_to.emit(p)}>
                        {p}
                    </button>
                }
            })}
            <button class="pagination-btn"
                disabled={page >= total_pages}
                onclick={move |_| on_next.emit(())}>
                {"下一页 ›"}
            </button>
            <span class="pagination-info">
                {format!("第 {}/{} 页（共 {} 条）", page, total_pages, props.total)}
            </span>
        </div>
    }
}