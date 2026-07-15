//! 设置页面
//! 显示应用信息、数据库路径等配置

use yew::prelude::*;

/// 渲染设置页面
pub fn render_settings(db_path: &UseStateHandle<String>) -> Html {
    html! {
        <div class="page">
            <h1 class="page-title">{"设置"}</h1>
            <div class="settings-section">
                <div class="info-card">
                    <h3>{"关于应用"}</h3>
                    <div class="settings-field">
                        <span class="preview-label">{"应用名称"}</span>
                        <span class="preview-value">{"AI FileManager"}</span>
                    </div>
                    <div class="settings-field">
                        <span class="preview-label">{"版本"}</span>
                        <span class="preview-value">{"0.1.0"}</span>
                    </div>
                    <div class="settings-field">
                        <span class="preview-label">{"框架"}</span>
                        <span class="preview-value">{"Tauri + Yew (Rust WASM)"}</span>
                    </div>
                </div>
            </div>
            <div class="settings-section" style="margin-top: 16px;">
                <div class="info-card">
                    <h3>{"数据库"}</h3>
                    <div class="settings-field">
                        <span class="preview-label">{"数据库路径"}</span>
                        <span class="preview-value mono">{&**db_path}</span>
                    </div>
                </div>
            </div>
            <div class="settings-section" style="margin-top: 16px;">
                <div class="info-card">
                    <h3>{"功能模块"}</h3>
                    <div class="settings-field">
                        <span class="preview-label">{"文件扫描"}</span>
                        <span class="preview-value">{"已启用"}</span>
                    </div>
                    <div class="settings-field">
                        <span class="preview-label">{"重复文件检测"}</span>
                        <span class="preview-value">{"已启用"}</span>
                    </div>
                    <div class="settings-field">
                        <span class="preview-label">{"虚拟目录管理"}</span>
                        <span class="preview-value">{"已启用"}</span>
                    </div>
                    <div class="settings-field">
                        <span class="preview-label">{"删除管理"}</span>
                        <span class="preview-value">{"已启用"}</span>
                    </div>
                    <div class="settings-field">
                        <span class="preview-label">{"AI 智能分类"}</span>
                        <span class="preview-value">{"已启用"}</span>
                    </div>
                    <div class="settings-field">
                        <span class="preview-label">{"系统集成"}</span>
                        <span class="preview-value">{"已启用"}</span>
                    </div>
                    <div class="settings-field">
                        <span class="preview-label">{"文件搜索"}</span>
                        <span class="preview-value">{"已启用"}</span>
                    </div>
                    <div class="settings-field">
                        <span class="preview-label">{"文件监控"}</span>
                        <span class="preview-value">{"已启用"}</span>
                    </div>
                </div>
            </div>
        </div>
    }
}