//! 删除管理页面
//! 显示删除记录和删除队列，支持批量物理删除

use crate::types::{DeleteQueueItem, DeletionRecord};
use crate::utils::{format_size, invoke};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::spawn_local;
use yew::prelude::*;

/// 渲染删除管理页面
pub fn render_deletion(
    records: &UseStateHandle<Vec<DeletionRecord>>,
    queue: &UseStateHandle<Vec<DeleteQueueItem>>,
    error_msg: &UseStateHandle<String>,
) -> Html {
    let records = &*records;
    let queue = &*queue;

    // 处理删除队列
    let on_process = {
        let records = records.clone();
        let queue = queue.clone();
        let error_msg = error_msg.clone();
        Callback::from(move |_| {
            let records = records.clone();
            let queue = queue.clone();
            let error_msg = error_msg.clone();
            spawn_local(async move {
                match invoke("process_delete_queue", JsValue::NULL).await {
                    val if !val.is_null() && !val.is_undefined() => {
                        let _n: usize = serde_wasm_bindgen::from_value(val).unwrap_or(0);
                        let r = invoke("get_deletion_records", JsValue::NULL).await;
                        if !r.is_null() {
                            if let Ok(d) = serde_wasm_bindgen::from_value::<Vec<DeletionRecord>>(r) {
                                records.set(d);
                            }
                        }
                        let q = invoke("get_delete_queue", JsValue::NULL).await;
                        if !q.is_null() {
                            if let Ok(d) = serde_wasm_bindgen::from_value::<Vec<DeleteQueueItem>>(q) {
                                queue.set(d);
                            }
                        }
                    }
                    _ => {
                        error_msg.set("物理删除失败".to_string());
                    }
                }
            });
        })
    };

    let pending_count = queue.iter().filter(|q| q.status == "pending").count();

    html! {
        <div class="page">
            <h1 class="page-title">{"删除管理"}</h1>

            <div class="info-card" style="margin-bottom: 24px;">
                <h3>{"删除队列"}</h3>
                <div class="result-grid">
                    <div class="result-item">
                        <span class="result-label">{"待处理"}</span>
                        <span class="result-value">{pending_count}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">{"已处理"}</span>
                        <span class="result-value">{queue.len() - pending_count}</span>
                    </div>
                    <div class="result-item">
                        <span class="result-label">{"总计"}</span>
                        <span class="result-value">{queue.len()}</span>
                    </div>
                </div>
                { if pending_count > 0 {
                    html! {
                        <button class="btn-primary" style="margin-top: 12px;"
                            onclick={on_process}>
                            {"执行物理删除 ("}{pending_count}{")"}
                        </button>
                    }
                } else {
                    html! {}
                }}
            </div>

            <h3 style="color: var(--text-primary); margin-bottom: 16px; font-size: 16px;">
                {"删除记录 ("}{records.len()}{")"}
            </h3>
            { if records.is_empty() {
                html! { <p class="empty-hint">{"暂无删除记录。"}</p> }
            } else {
                html! {
                    <div class="deletion-list">
                        { for records.iter().map(|record| {
                            let status_class = if record.is_physical_deleted {
                                "deletion-status done"
                            } else {
                                "deletion-status pending"
                            };
                            let status_text = if record.is_physical_deleted {
                                "已物理删除"
                            } else {
                                "待处理"
                            };
                            html! {
                                <div class="deletion-card">
                                    <div class="deletion-header">
                                        <span class="deletion-path">{&record.file_path}</span>
                                        <span class={status_class}>{status_text}</span>
                                    </div>
                                    <div class="deletion-meta">
                                        <span>{"大小: "}{format_size(record.file_size)}</span>
                                        <span>{"删除时间: "}{&record.deleted_at[..19]}</span>
                                        { if let Some(reason) = &record.reason {
                                            html! { <span>{"原因: "}{reason}</span> }
                                        } else {
                                            html! {}
                                        }}
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