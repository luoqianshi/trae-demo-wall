//! 系统集成页面
//! 显示和管理系统集成状态

use crate::types::IntegrationStatus;
use yew::prelude::*;

/// 渲染系统集成页面
pub fn render_integration(
    status: &UseStateHandle<Option<IntegrationStatus>>,
    on_check: &Callback<()>,
    on_install: &Callback<()>,
    on_uninstall: &Callback<()>,
    loading: &UseStateHandle<bool>,
    msg: &UseStateHandle<Option<String>>,
) -> Html {
    let is_loading = **loading;

    html! {
        <div class="page">
            <h1 class="page-title">{"系统集成"}</h1>
            <div class="integration-toolbar">
                <button class="btn-primary" onclick={let c = on_check.clone(); move |_| c.emit(())} disabled={is_loading}>
                    {"检查状态"}
                </button>
                <button class="btn-success" onclick={let c = on_install.clone(); move |_| c.emit(())} disabled={is_loading}>
                    {"安装集成"}
                </button>
                <button class="btn-danger" onclick={let c = on_uninstall.clone(); move |_| c.emit(())} disabled={is_loading}>
                    {"卸载集成"}
                </button>
                { if is_loading {
                    html! { <span class="loading-text">{"处理中..."}</span> }
                } else {
                    html! {}
                }}
            </div>

            { if let Some(m) = msg.as_ref() {
                html! { <div class="info-bar">{ m }</div> }
            } else {
                html! {}
            }}

            { match status.as_ref() {
                None => html! { <p class="empty-hint">{"点击「检查状态」查看系统集成情况。"}</p> },
                Some(s) => html! {
                    <div class="integration-status">
                        <div class="status-card">
                            <h3>{"平台信息"}</h3>
                            <p><strong>{"平台："}</strong>{&s.platform}</p>
                            <p>
                                <strong>{"集成状态："}</strong>
                                { if s.integrated {
                                    html! { <span class="tag tag-success">{"已集成"}</span> }
                                } else {
                                    html! { <span class="tag tag-warning">{"未集成"}</span> }
                                }}
                            </p>
                        </div>
                        <div class="status-card">
                            <h3>{"支持特性"}</h3>
                            <ul class="feature-list">
                                <li class={if s.shell_extension { "feature-supported" } else { "feature-unsupported" }}>
                                    {"Shell Extension"} { if s.shell_extension { " ✓" } else { " ✗" } }
                                </li>
                                <li class={if s.file_monitor { "feature-supported" } else { "feature-unsupported" }}>
                                    {"文件监控"} { if s.file_monitor { " ✓" } else { " ✗" } }
                                </li>
                                <li class={if s.context_menu { "feature-supported" } else { "feature-unsupported" }}>
                                    {"右键菜单"} { if s.context_menu { " ✓" } else { " ✗" } }
                                </li>
                            </ul>
                        </div>
                    </div>
                },
            }}
        </div>
    }
}