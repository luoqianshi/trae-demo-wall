//! 数据导出/导入页面
//! 支持导出文件列表为 CSV/JSON，从 CSV 导入文件记录

use yew::prelude::*;

/// 渲染数据导出/导入页面
pub fn render_data_io(
    export_msg: &UseStateHandle<Option<String>>,
    import_csv_content: &UseStateHandle<String>,
    loading: &UseStateHandle<bool>,
    on_export_csv: &Callback<()>,
    on_export_json: &Callback<()>,
    on_import_csv: &Callback<()>,
) -> Html {
    html! {
        <div class="page">
            <h1 class="page-title">{"数据导出/导入"}</h1>

            <div class="info-card" style="margin-bottom: 20px;">
                <h3>{"导出文件列表"}</h3>
                <p style="color: var(--text-secondary); margin-bottom: 12px; font-size: 13px;">
                    {"将数据库中的文件列表导出为 CSV 或 JSON 文件，保存到桌面。"}
                </p>
                <div class="classification-toolbar">
                    <button class="btn-primary" onclick={let e = on_export_csv.clone(); move |_| e.emit(())}>
                        {"导出为 CSV"}
                    </button>
                    <button class="btn-primary" onclick={let e = on_export_json.clone(); move |_| e.emit(())}>
                        {"导出为 JSON"}
                    </button>
                </div>
                { if let Some(msg) = &**export_msg {
                    html! {
                        <div class="info-bar" style="margin-top: 12px;">
                            {msg}
                        </div>
                    }
                } else {
                    html! {}
                }}
            </div>

            <div class="info-card">
                <h3>{"从 CSV 导入"}</h3>
                <p style="color: var(--text-secondary); margin-bottom: 12px; font-size: 13px;">
                    {"粘贴 CSV 内容导入文件记录。格式：path,file_size,mime_type,md5_hash,sha256_hash,created_at,modified_at"}
                </p>
                <div class="create-dir-form" style="flex-direction: column; gap: 8px;">
                    <textarea
                        class="scan-input" style="min-height: 120px; resize: vertical; font-family: monospace; font-size: 12px;"
                        placeholder={"path/to/file.txt,1024,text/plain,d41d8cd9...,e3b0c442...,2026-01-01T00:00:00Z,2026-01-01T00:00:00Z"}
                        value={import_csv_content.to_string()}
                        oninput={let c = import_csv_content.clone(); move |e: InputEvent| {
                            let input = e.target_unchecked_into::<web_sys::HtmlTextAreaElement>();
                            c.set(input.value());
                        }}
                    />
                    <button class="btn-primary" disabled={**loading}
                        onclick={let i = on_import_csv.clone(); move |_| i.emit(())}>
                        {"导入 CSV"}
                    </button>
                </div>
            </div>

            { if **loading {
                html! { <div class="loading-overlay"><div class="spinner"></div><p>{"处理中..."}</p></div> }
            } else {
                html! {}
            }}
        </div>
    }
}