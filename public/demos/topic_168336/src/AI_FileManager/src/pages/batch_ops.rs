//! 批量操作页面
//! 支持多选文件后批量删除或批量移动，支持分页浏览

use crate::components::pagination::Pagination;
use crate::types::FileMetadata;
use crate::types::PaginatedFiles;
use crate::utils::format_size;
use yew::prelude::*;

/// 渲染批量操作页面
pub fn render_batch_ops(
    files: &UseStateHandle<Vec<FileMetadata>>,
    selected_ids: &UseStateHandle<Vec<i64>>,
    target_dir: &UseStateHandle<String>,
    on_refresh: &Callback<()>,
    on_toggle_select: &Callback<i64>,
    on_select_all: &Callback<()>,
    on_clear_selection: &Callback<()>,
    on_batch_delete: &Callback<()>,
    on_batch_move: &Callback<()>,
    on_preview: &Callback<FileMetadata>,
    paginated: &UseStateHandle<PaginatedFiles>,
    on_prev_page: &Callback<()>,
    on_next_page: &Callback<()>,
    on_go_to_page: &Callback<i64>,
) -> Html {
    let file_list = &*files;
    let sel = &*selected_ids;
    let count = sel.len();
    let pg = &**paginated;

    html! {
        <div class="page">
            <h1 class="page-title">{"批量操作"}</h1>

            <div class="classification-toolbar">
                <button class="btn-primary" onclick={let r = on_refresh.clone(); move |_| r.emit(())}>
                    {"刷新文件列表"}
                </button>
                <button class="btn-secondary" onclick={let s = on_select_all.clone(); move |_| s.emit(())}>
                    {"全选"}
                </button>
                <button class="btn-secondary" onclick={let c = on_clear_selection.clone(); move |_| c.emit(())}>
                    {"取消选择"}
                </button>
            </div>

            { if count > 0 {
                html! {
                    <div class="info-bar">
                        {format!("已选择 {} 个文件", count)}
                        <button class="btn-danger" style="margin-left: 12px;"
                            onclick={let d = on_batch_delete.clone(); move |_| d.emit(())}>
                            {"批量删除"}
                        </button>
                    </div>
                }
            } else {
                html! {}
            }}

            <div class="create-dir-form">
                <input
                    class="scan-input"
                    type="text"
                    placeholder="目标目录路径（用于批量移动）"
                    value={target_dir.to_string()}
                    oninput={let t = target_dir.clone(); move |e: InputEvent| {
                        let input = e.target_unchecked_into::<web_sys::HtmlInputElement>();
                        t.set(input.value());
                    }}
                />
                <button class="btn-primary"
                    disabled={count == 0}
                    onclick={let m = on_batch_move.clone(); move |_| m.emit(())}>
                    {"批量移动"}
                </button>
            </div>

            { if file_list.is_empty() {
                html! { <p class="empty-hint">{"暂无文件记录。请先扫描目录。"}</p> }
            } else {
                html! {
                    <div class="search-results">
                        <div class="file-row" style="font-weight: 600; color: var(--accent); border-bottom: 2px solid var(--border); padding-bottom: 8px; margin-bottom: 4px;">
                            <span style="width: 40px; flex: none;">{"选择"}</span>
                            <span class="file-path">{"文件路径"}</span>
                            <span class="file-size">{"大小"}</span>
                            <span class="file-hash" style="font-size: 11px;">{"操作"}</span>
                        </div>
                        { for file_list.iter().map(|file| {
                            let is_selected = sel.contains(&file.id);
                            let row_class = if is_selected {
                                "file-row selected"
                            } else {
                                "file-row"
                            };
                            let file_id = file.id;
                            let on_toggle = on_toggle_select.clone();
                            let on_preview = on_preview.clone();
                            let preview_file = file.clone();
                            html! {
                                <div class={row_class}
                                    onclick={move |_| on_toggle.emit(file_id)}
                                    style="cursor: pointer;">
                                    <span style="width: 40px; flex: none; text-align: center;">
                                        {if is_selected { "☑" } else { "☐" }}
                                    </span>
                                    <span class="file-path" title={file.path.clone()}>
                                        {&file.path}
                                    </span>
                                    <span class="file-size">{format_size(file.file_size)}</span>
                                    <span style="display: flex; gap: 4px;">
                                        <button class="btn-small"
                                            onclick={let p = on_preview.clone(); let f = preview_file.clone(); move |e: MouseEvent| { e.stop_propagation(); p.emit(f.clone()); }}>
                                            {"👁️"}
                                        </button>
                                    </span>
                                </div>
                            }
                        })}
                        <Pagination
                            page={pg.page}
                            total_pages={pg.total_pages}
                            total={pg.total}
                            on_prev={on_prev_page.clone()}
                            on_next={on_next_page.clone()}
                            on_go_to={on_go_to_page.clone()}
                        />
                    </div>
                }
            }}
        </div>
    }
}