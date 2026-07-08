import os
import re
from pathlib import Path

menu_template = '''<nav class="flex-1 overflow-y-auto p-4">
    <div class="mb-4">
        <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">赛事项目管理</div>
        
        <div class="mb-2">
            <button class="menu-item w-full flex items-center justify-between p-2.5 rounded-md" onclick="toggleSubmenu('event-info')">
                <span class="text-sm text-gray-700">赛事信息管理</span>
                <i class="fa fa-chevron-down text-xs text-gray-400 transition-transform" id="event-info-icon"></i>
            </button>
            <div class="submenu pl-4" id="event-info">
                <a href="event_management.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-calendar w-4 text-center mr-2"></i>
                    <span>赛事管理</span>
                </a>
                <a href="event_project.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-tasks w-4 text-center mr-2"></i>
                    <span>项目（组别）管理</span>
                </a>
                <a href="result_certificate_config.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-certificate w-4 text-center mr-2"></i>
                    <span>成绩证书配置</span>
                </a>
            </div>
        </div>
        
        <div class="mb-2">
            <button class="menu-item w-full flex items-center justify-between p-2.5 rounded-md" onclick="toggleSubmenu('event-rules')">
                <span class="text-sm text-gray-700">赛事规则配置</span>
                <i class="fa fa-chevron-down text-xs text-gray-400 transition-transform" id="event-rules-icon"></i>
            </button>
            <div class="submenu pl-4" id="event-rules">
                <a href="timing_point.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-map-marker w-4 text-center mr-2"></i>
                    <span>计时点网络规划</span>
                </a>
                <a href="start_batch.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-clock-o w-4 text-center mr-2"></i>
                    <span>出发批次管理</span>
                </a>
                <a href="timing_clock.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-clock-o w-4 text-center mr-2"></i>
                    <span>计时钟同步管理</span>
                </a>
                <a href="result_template.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-file-text-o w-4 text-center mr-2"></i>
                    <span>成绩模板与算法</span>
                </a>
            </div>
        </div>
    </div>
    
    <div class="mb-4">
        <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">人员与团队管理</div>
        
        <div class="mb-2">
            <button class="menu-item w-full flex items-center justify-between p-2.5 rounded-md" onclick="toggleSubmenu('participant-info')">
                <span class="text-sm text-gray-700">选手信息管理</span>
                <i class="fa fa-chevron-down text-xs text-gray-400 transition-transform" id="participant-info-icon"></i>
            </button>
            <div class="submenu pl-4" id="participant-info">
                <a href="runner_management.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-users w-4 text-center mr-2"></i>
                    <span>选手信息维护</span>
                </a>
            </div>
        </div>
        
        <div class="mb-2">
            <button class="menu-item w-full flex items-center justify-between p-2.5 rounded-md" onclick="toggleSubmenu('bracelet-bind')">
                <span class="text-sm text-gray-700">智能手环绑定</span>
                <i class="fa fa-chevron-down text-xs text-gray-400 transition-transform" id="bracelet-bind-icon"></i>
            </button>
            <div class="submenu pl-4" id="bracelet-bind">
                <a href="batch_bind.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-link w-4 text-center mr-2"></i>
                    <span>批量绑定管理</span>
                </a>
                <a href="bind_status.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-search w-4 text-center mr-2"></i>
                    <span>绑定状态查询与解绑</span>
                </a>
            </div>
        </div>
        
        <div class="mb-2">
            <button class="menu-item w-full flex items-center justify-between p-2.5 rounded-md" onclick="toggleSubmenu('group-team')">
                <span class="text-sm text-gray-700">分组与团队管理</span>
                <i class="fa fa-chevron-down text-xs text-gray-400 transition-transform" id="group-team-icon"></i>
            </button>
            <div class="submenu pl-4" id="group-team">
                <a href="group_management.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-object-group w-4 text-center mr-2"></i>
                    <span>分组管理</span>
                </a>
                <a href="team_management.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-users w-4 text-center mr-2"></i>
                    <span>团队管理</span>
                </a>
                <a href="team_pk_rule.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-trophy w-4 text-center mr-2"></i>
                    <span>跑团PK规则配置</span>
                </a>
            </div>
        </div>
        
        <div class="mb-2">
            <button class="menu-item w-full flex items-center justify-between p-2.5 rounded-md" onclick="toggleSubmenu('onsite-service')">
                <span class="text-sm text-gray-700">现场核验与服务</span>
                <i class="fa fa-chevron-down text-xs text-gray-400 transition-transform" id="onsite-service-icon"></i>
            </button>
            <div class="submenu pl-4" id="onsite-service">
                <a href="pickup_sign.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-gift w-4 text-center mr-2"></i>
                    <span>领物与签名管理</span>
                </a>
                <a href="onsite_bind.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-qrcode w-4 text-center mr-2"></i>
                    <span>手环绑定（现场）</span>
                </a>
                <a href="shuttle_checkin.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-bus w-4 text-center mr-2"></i>
                    <span>接驳点签到管理</span>
                </a>
            </div>
        </div>
    </div>
    
    <div class="mb-4">
        <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">成绩管理</div>
        
        <div class="mb-2">
            <button class="menu-item w-full flex items-center justify-between p-2.5 rounded-md" onclick="toggleSubmenu('raw-data')">
                <span class="text-sm text-gray-700">原始数据管理</span>
                <i class="fa fa-chevron-down text-xs text-gray-400 transition-transform" id="raw-data-icon"></i>
            </button>
            <div class="submenu pl-4" id="raw-data">
                <a href="raw_data_management.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-database w-4 text-center mr-2"></i>
                    <span>原始过线数据看板</span>
                </a>
                <a href="abnormal_data.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-exclamation-triangle w-4 text-center mr-2"></i>
                    <span>异常数据处理</span>
                </a>
                <a href="manual_correction.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-edit w-4 text-center mr-2"></i>
                    <span>手动补录与修正</span>
                </a>
            </div>
        </div>
        
        <div class="mb-2">
            <button class="menu-item w-full flex items-center justify-between p-2.5 rounded-md" onclick="toggleSubmenu('results-mgmt')">
                <span class="text-sm text-gray-700">成绩管理（完赛与未完赛）</span>
                <i class="fa fa-chevron-down text-xs text-gray-400 transition-transform" id="results-mgmt-icon"></i>
            </button>
            <div class="submenu pl-4" id="results-mgmt">
                <a href="completed_results.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-check-circle w-4 text-center mr-2"></i>
                    <span>完赛成绩管理</span>
                </a>
                <a href="incomplete_results.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-times-circle w-4 text-center mr-2"></i>
                    <span>未完赛成绩管理</span>
                </a>
            </div>
        </div>
        
        <div class="mb-2">
            <button class="menu-item w-full flex items-center justify-between p-2.5 rounded-md" onclick="toggleSubmenu('realtime-results')">
                <span class="text-sm text-gray-700">实时成绩处理</span>
                <i class="fa fa-chevron-down text-xs text-gray-400 transition-transform" id="realtime-results-icon"></i>
            </button>
            <div class="submenu pl-4" id="realtime-results">
                <a href="realtime_result.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-bar-chart w-4 text-center mr-2"></i>
                    <span>个人实时成绩看板</span>
                </a>
                <a href="team_dashboard.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-line-chart w-4 text-center mr-2"></i>
                    <span>团队实时数据看板</span>
                </a>
                <a href="closed_runners.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-ban w-4 text-center mr-2"></i>
                    <span>被关门名单管理</span>
                </a>
            </div>
        </div>
        
        <div class="mb-2">
            <button class="menu-item w-full flex items-center justify-between p-2.5 rounded-md" onclick="toggleSubmenu('official-results')">
                <span class="text-sm text-gray-700">官方成绩发布</span>
                <i class="fa fa-chevron-down text-xs text-gray-400 transition-transform" id="official-results-icon"></i>
            </button>
            <div class="submenu pl-4" id="official-results">
                <a href="result_review.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-trophy w-4 text-center mr-2"></i>
                    <span>成绩审核与锁定</span>
                </a>
                <a href="certificate_generate.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-certificate w-4 text-center mr-2"></i>
                    <span>成绩证书生成</span>
                </a>
            </div>
        </div>
    </div>
    
    <div class="mb-4">
        <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">数据服务与AI分析</div>
        
        <div class="mb-2">
            <button class="menu-item w-full flex items-center justify-between p-2.5 rounded-md" onclick="toggleSubmenu('notification-service')">
                <span class="text-sm text-gray-700">信息触达服务</span>
                <i class="fa fa-chevron-down text-xs text-gray-400 transition-transform" id="notification-service-icon"></i>
            </button>
            <div class="submenu pl-4" id="notification-service">
                <a href="notification_service.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-bell w-4 text-center mr-2"></i>
                    <span>短信平台管理</span>
                </a>
            </div>
        </div>
        
        <div class="mb-2">
            <button class="menu-item w-full flex items-center justify-between p-2.5 rounded-md" onclick="toggleSubmenu('data-dashboard')">
                <span class="text-sm text-gray-700">综合数据驾驶舱（二期）</span>
                <i class="fa fa-chevron-down text-xs text-gray-400 transition-transform" id="data-dashboard-icon"></i>
            </button>
            <div class="submenu pl-4" id="data-dashboard">
                <a href="data_ai_analysis.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-line-chart w-4 text-center mr-2"></i>
                    <span>运营数据仪表盘</span>
                </a>
            </div>
        </div>
        
        <div class="mb-2">
            <button class="menu-item w-full flex items-center justify-between p-2.5 rounded-md" onclick="toggleSubmenu('ai-analysis')">
                <span class="text-sm text-gray-700">AI智能分析后台（三期）</span>
                <i class="fa fa-chevron-down text-xs text-gray-400 transition-transform" id="ai-analysis-icon"></i>
            </button>
            <div class="submenu pl-4" id="ai-analysis">
                <a href="ai_analysis_backend.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-user-circle-o w-4 text-center mr-2"></i>
                    <span>选手个人画像生成</span>
                </a>
                <a href="crowd_risk_report.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-exclamation-circle w-4 text-center mr-2"></i>
                    <span>群体聚集风险报告</span>
                </a>
            </div>
        </div>
    </div>
    
    <div class="mb-4">
        <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">资源管理</div>
        
        <div class="mb-2">
            <button class="menu-item w-full flex items-center justify-between p-2.5 rounded-md" onclick="toggleSubmenu('resource-type')">
                <span class="text-sm text-gray-700">资源类型配置</span>
                <i class="fa fa-chevron-down text-xs text-gray-400 transition-transform" id="resource-type-icon"></i>
            </button>
            <div class="submenu pl-4" id="resource-type">
                <a href="resource_type_config.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-cubes w-4 text-center mr-2"></i>
                    <span>资源类型维护</span>
                </a>
            </div>
        </div>
        
        <div class="mb-2">
            <button class="menu-item w-full flex items-center justify-between p-2.5 rounded-md" onclick="toggleSubmenu('resource-info')">
                <span class="text-sm text-gray-700">资源基础信息管理</span>
                <i class="fa fa-chevron-down text-xs text-gray-400 transition-transform" id="resource-info-icon"></i>
            </button>
            <div class="submenu pl-4" id="resource-info">
                <a href="resource_info_management.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-cube w-4 text-center mr-2"></i>
                    <span>资源录入与维护</span>
                </a>
                <a href="resource_location.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                    <i class="fa fa-map-marker w-4 text-center mr-2"></i>
                    <span>资源位置标记</span>
                </a>
            </div>
        </div>
    </div>
</nav>'''

def update_menu_in_file(file_path, current_file):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        pattern = r'<nav class="flex-1 overflow-y-auto p-4">.*?</nav>'
        match = re.search(pattern, content, re.DOTALL)
        
        if match:
            new_menu = menu_template
            
            current_file_pattern = f'href="{current_file}"'
            if current_file_pattern in new_menu:
                new_menu = new_menu.replace(
                    f'{current_file_pattern}" class="menu-item',
                    f'{current_file_pattern}" class="menu-item active'
                )
            
            new_content = content[:match.start()] + new_menu + content[match.end():]
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            return True
        else:
            print(f"未找到菜单部分: {file_path}")
            return False
    except Exception as e:
        print(f"处理文件 {file_path} 时出错: {str(e)}")
        return False

def main():
    directory = r"e:\近期重点任务\智慧赛事服务系统\AI_project\design\prototypes\operation"
    
    html_files = [
        "event_project.html",
        "timing_point.html",
        "start_batch.html",
        "timing_clock.html",
        "result_template.html",
        "runner_management.html",
        "batch_bind.html",
        "bind_status.html",
        "group_management.html",
        "team_management.html",
        "team_pk_rule.html",
        "pickup_sign.html",
        "onsite_bind.html",
        "shuttle_checkin.html",
        "result_certificate_config.html",
        "realtime_result.html",
        "result_review.html",
        "result_statistics.html",
        "incomplete_statistics.html",
        "result_publish.html",
        "result_export.html",
        "certificate_generate.html",
        "result_query.html",
        "result_appeal.html"
    ]
    
    success_count = 0
    fail_count = 0
    
    for html_file in html_files:
        file_path = os.path.join(directory, html_file)
        if os.path.exists(file_path):
            if update_menu_in_file(file_path, html_file):
                print(f"✓ 更新成功: {html_file}")
                success_count += 1
            else:
                print(f"✗ 更新失败: {html_file}")
                fail_count += 1
        else:
            print(f"文件不存在: {html_file}")
    
    print(f"\n总计: 成功 {success_count} 个, 失败 {fail_count} 个")

if __name__ == "__main__":
    main()