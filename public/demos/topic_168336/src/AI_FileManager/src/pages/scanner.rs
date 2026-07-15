//! 文件扫描页面
//! 输入路径执行扫描，显示扫描结果和进度

use crate::types::ScanResult;
use crate::utils::{format_duration, format_size};
use yew::prelude::*;

/// 渲染文件扫描页面
pub fn render_scanner(
    scan_path: &UseStateHandle<String>,
    scan_result: &UseStateHandle<Option<ScanResult>>,
    scan_progress: &UseStateHandle<Option<f64>>,
    on_scan: &Callback<()>,
    on_cancel: &Callback<()>,
) -> Html {
    let progress_pct = **scan_progress;
    html! {
        <div class="page">
            <h1 class="page-title">{"文件扫描"}</h1>
            <div class="scan-form">
                <input
                    class="scan-input"
                    type="text"
                    placeholder="输入要扫描的目录路径，例如 C:\\Users\\YourName\\Documents"
                    value={scan_path.to_string()}
                    oninput={let p = scan_path.clone(); move |e: InputEvent| {
                        let input = e.target_unchecked_into::<web_sys::HtmlInputElement>();
                        p.set(input.value());
                    }}
                />
                <button class="btn-primary" onclick={let c = on_scan.clone(); move |_| c.emit(())}>
                    {"开始扫描"}
                </button>
                { if progress_pct.is_some() {
                    html! {
                        <button class="btn-danger" style="margin-left: 8px;"
                            onclick={let c = on_cancel.clone(); move |_| c.emit(())}>
                            {"取消扫描"}
                        </button>
                    }
                } else {
                    html! {}
                }}
            </div>
            // 进度条
            { if let Some(pct) = progress_pct {
                html! {
                    <div class="progress-bar" style="margin: 16px 0;">
                        <div class="progress-row">
                            <span>{"扫描中..."}</span>
                            <span class="pct">{format!("{:.0}%", pct * 100.0)}</span>
                        </div>
                        <div class="bar">
                            <div class="fill" style={format!("width: {}%", pct * 100.0)}></div>
                        </div>
                    </div>
                }
            } else {
                html! {}
            }}
            // 扫描结果
            { if let Some(result) = &**scan_result {
                html! {
                    <div class="result-card">
                        <h3>{"扫描结果"}</h3>
                        <div class="result-grid">
                            <div class="result-item">
                                <span class="result-label">{"扫描路径"}</span>
                                <span class="result-value">{&result.scanned_path}</span>
                            </div>
                            <div class="result-item">
                                <span class="result-label">{"总文件数"}</span>
                                <span class="result-value">{result.total_files}</span>
                            </div>
                            <div class="result-item">
                                <span class="result-label">{"总大小"}</span>
                                <span class="result-value">{format_size(result.total_size)}</span>
                            </div>
                            <div class="result-item">
                                <span class="result-label">{"新增文件"}</span>
                                <span class="result-value">{result.new_files}</span>
                            </div>
                            <div class="result-item">
                                <span class="result-label">{"耗时"}</span>
                                <span class="result-value">{format_duration(result.duration_ms)}</span>
                            </div>
                        </div>
                    </div>
                }
            } else {
                html! {}
            }}
        </div>
    }
}