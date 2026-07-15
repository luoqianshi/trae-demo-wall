//! 仪表盘页面
//! 显示文件统计信息概览

use crate::types::FileStatistics;
use crate::utils::format_size;
use yew::prelude::*;

/// 渲染仪表盘页面
pub fn render_dashboard(stats: &UseStateHandle<FileStatistics>) -> Html {
    let s = &*stats;
    html! {
        <div class="page">
            <h1 class="page-title">{"仪表盘"}</h1>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">{s.total_files}</div>
                    <div class="stat-label">{"总文件数"}</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">{format_size(s.total_size)}</div>
                    <div class="stat-label">{"总大小"}</div>
                </div>
                <div class="stat-card warning">
                    <div class="stat-value">{s.duplicate_files}</div>
                    <div class="stat-label">{"重复文件"}</div>
                </div>
                <div class="stat-card success">
                    <div class="stat-value">{format_size(s.space_saved)}</div>
                    <div class="stat-label">{"可节省空间"}</div>
                </div>
            </div>
            <div class="info-card">
                <h3>{"快速开始"}</h3>
                <ol>
                    <li>{"前往「文件扫描」页面，输入目录路径开始扫描"}</li>
                    <li>{"扫描完成后，在「重复文件」页面查看结果"}</li>
                    <li>{"在「虚拟目录」页面创建分类整理文件"}</li>
                </ol>
            </div>
        </div>
    }
}