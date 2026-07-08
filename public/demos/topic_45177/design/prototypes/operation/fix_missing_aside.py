import os
import re

OPERATION_DIR = r'e:\近期重点任务\智慧赛事服务系统\AI_project\design\prototypes\operation'

FILES_TO_FIX = [
    'team_dashboard.html',
    'closed_runners.html',
    'result_review.html',
    'certificate_generate.html',
    'crowd_risk_report.html',
    'resource_location.html'
]

LEFT_SIDEBAR = r'''        <aside class="sidebar w-56 bg-white border-r border-light-border flex flex-col">
            <div class="h-16 flex items-center px-4 border-b border-light-border">
                <div class="flex items-center">
                    <i class="fa fa-trophy text-accent text-xl mr-2"></i>
                    <span class="font-semibold text-primary">赛事运营管理</span>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto p-3">
                <div id="menu-event-project" class="menu-panel">
                    <div class="mb-3">
                        <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">赛事信息管理</div>
                        <a href="event_management.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-calendar w-4 text-center mr-2"></i>赛事管理
                        </a>
                        <a href="event_project.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-tasks w-4 text-center mr-2"></i>项目（组别）管理
                        </a>
                        <a href="result_certificate_config.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-certificate w-4 text-center mr-2"></i>成绩证书配置
                        </a>
                    </div>
                </div>

                <div id="menu-event-rule" class="menu-panel">
                    <div class="mb-3">
                        <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">计时规则配置</div>
                        <a href="timing_point.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-map-marker w-4 text-center mr-2"></i>计时点网络规划
                        </a>
                        <a href="start_batch.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-clock-o w-4 text-center mr-2"></i>出发批次管理
                        </a>
                        <a href="timing_clock.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-clock-o w-4 text-center mr-2"></i>计时钟同步管理
                        </a>
                    </div>
                    <div class="mb-3">
                        <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">成绩规则配置</div>
                        <a href="result_template.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-file-text-o w-4 text-center mr-2"></i>成绩模板与算法
                        </a>
                    </div>
                </div>

                <div id="menu-personnel-team" class="menu-panel">
                    <div class="mb-3">
                        <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">选手信息管理</div>
                        <a href="runner_management.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-user w-4 text-center mr-2"></i>选手信息维护
                        </a>
                    </div>
                    <div class="mb-3">
                        <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">智能手环绑定</div>
                        <a href="batch_bind.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-link w-4 text-center mr-2"></i>批量绑定管理
                        </a>
                        <a href="bind_status.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-search w-4 text-center mr-2"></i>绑定状态查询与解绑
                        </a>
                    </div>
                    <div class="mb-3">
                        <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">分组与团队管理</div>
                        <a href="group_management.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-object-group w-4 text-center mr-2"></i>分组管理
                        </a>
                        <a href="team_management.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-users w-4 text-center mr-2"></i>团队管理
                        </a>
                        <a href="team_pk_rule.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-trophy w-4 text-center mr-2"></i>跑团PK规则配置
                        </a>
                    </div>
                    <div class="mb-3">
                        <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">现场核验与服务</div>
                        <a href="pickup_sign.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-gift w-4 text-center mr-2"></i>领物与签名管理
                        </a>
                        <a href="onsite_bind.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-qrcode w-4 text-center mr-2"></i>手环绑定（现场）
                        </a>
                        <a href="shuttle_checkin.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-bus w-4 text-center mr-2"></i>接驳点签到管理
                        </a>
                    </div>
                </div>

                <div id="menu-result-mgmt" class="menu-panel">
                    <div class="mb-3">
                        <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">原始数据管理</div>
                        <a href="raw_data_management.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-database w-4 text-center mr-2"></i>原始过线数据看板
                        </a>
                        <a href="abnormal_data.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-exclamation-triangle w-4 text-center mr-2"></i>异常数据处理
                        </a>
                        <a href="manual_correction.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-edit w-4 text-center mr-2"></i>手动补录与修正
                        </a>
                    </div>
                    <div class="mb-3">
                        <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">成绩管理（完赛与未完赛）</div>
                        <a href="completed_results.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-check-circle w-4 text-center mr-2"></i>完赛成绩管理
                        </a>
                        <a href="incomplete_results.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-times-circle w-4 text-center mr-2"></i>未完赛成绩管理
                        </a>
                    </div>
                    <div class="mb-3">
                        <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">实时成绩处理</div>
                        <a href="realtime_result.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-bar-chart w-4 text-center mr-2"></i>个人实时成绩看板
                        </a>
                        <a href="team_dashboard.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-line-chart w-4 text-center mr-2"></i>团队实时数据看板
                        </a>
                        <a href="closed_runners.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-ban w-4 text-center mr-2"></i>被关门名单管理
                        </a>
                    </div>
                    <div class="mb-3">
                        <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">官方成绩发布</div>
                        <a href="result_review.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-trophy w-4 text-center mr-2"></i>成绩审核与锁定
                        </a>
                        <a href="certificate_generate.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-certificate w-4 text-center mr-2"></i>成绩证书生成
                        </a>
                    </div>
                </div>

                <div id="menu-data-ai" class="menu-panel">
                    <div class="mb-3">
                        <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">信息触达服务</div>
                        <a href="notification_service.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-bell w-4 text-center mr-2"></i>短信平台管理
                        </a>
                    </div>
                    <div class="mb-3">
                        <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">综合数据驾驶舱（二期）</div>
                        <a href="data_ai_analysis.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-line-chart w-4 text-center mr-2"></i>运营数据仪表盘
                        </a>
                    </div>
                    <div class="mb-3">
                        <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">AI智能分析后台（三期）</div>
                        <a href="ai_analysis_backend.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-user-circle-o w-4 text-center mr-2"></i>选手个人画像生成
                        </a>
                        <a href="crowd_risk_report.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-exclamation-circle w-4 text-center mr-2"></i>群体聚集风险报告
                        </a>
                    </div>
                </div>

                <div id="menu-resource-mgmt" class="menu-panel">
                    <div class="mb-3">
                        <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">资源类型配置</div>
                        <a href="resource_type_config.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-cubes w-4 text-center mr-2"></i>资源类型维护
                        </a>
                    </div>
                    <div class="mb-3">
                        <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-2">资源基础信息管理</div>
                        <a href="resource_info_management.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-cube w-4 text-center mr-2"></i>资源录入与维护
                        </a>
                        <a href="resource_location.html" class="menu-item flex items-center p-2 rounded-md text-sm">
                            <i class="fa fa-map-marker w-4 text-center mr-2"></i>资源位置标记
                        </a>
                    </div>
                </div>
            </div>
        </aside>'''

TOP_MENU_BAR = r'''                <div class="flex items-center space-x-1">
                    <button class="top-menu-item px-4 py-2 text-sm" data-menu="event-project" onclick="switchTopMenu('event-project')">
                        <i class="fa fa-trophy mr-2"></i>赛事项目管理
                    </button>
                    <button class="top-menu-item px-4 py-2 text-sm" data-menu="event-rule" onclick="switchTopMenu('event-rule')">
                        <i class="fa fa-cog mr-2"></i>赛事规则配置
                    </button>
                    <button class="top-menu-item px-4 py-2 text-sm" data-menu="personnel-team" onclick="switchTopMenu('personnel-team')">
                        <i class="fa fa-users mr-2"></i>人员与团队管理
                    </button>
                    <button class="top-menu-item px-4 py-2 text-sm" data-menu="result-mgmt" onclick="switchTopMenu('result-mgmt')">
                        <i class="fa fa-bar-chart mr-2"></i>成绩管理
                    </button>
                    <button class="top-menu-item px-4 py-2 text-sm" data-menu="data-ai" onclick="switchTopMenu('data-ai')">
                        <i class="fa fa-line-chart mr-2"></i>数据服务与AI分析
                    </button>
                    <button class="top-menu-item px-4 py-2 text-sm" data-menu="resource-mgmt" onclick="switchTopMenu('resource-mgmt')">
                        <i class="fa fa-cubes mr-2"></i>资源管理
                    </button>
                </div>'''

HEADER_RIGHT = r'''                <div class="flex items-center space-x-4">
                    <div class="relative">
                        <button class="flex items-center text-sm text-gray-600 hover:text-gray-900" onclick="toggleSystemMenu()">
                            <i class="fa fa-th-large mr-2"></i>
                            <span>系统切换</span>
                            <i class="fa fa-chevron-down ml-1 text-xs"></i>
                        </button>
                        <div class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-light-border hidden" id="systemMenu">
                            <a href="../applet/applet_home.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-light-lighter">选手服务小程序</a>
                            <a href="../command/dashboard.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-light-lighter">赛事指挥中心</a>
                            <a href="../device/device_platform_index.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-light-lighter">设备管理平台</a>
                            <a href="../live/dashboard.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-light-lighter">赛事直播平台</a>
                            <a href="#" class="block px-4 py-2 text-sm text-accent bg-accent/10 font-medium">赛事运营管理</a>
                        </div>
                    </div>

                    <div class="h-6 w-px bg-gray-300"></div>

                    <div class="flex items-center">
                        <div class="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-white text-sm font-medium">
                            管
                        </div>
                        <span class="ml-2 text-sm text-gray-700">管理员</span>
                    </div>
                </div>'''

NEW_HEADER = '<header class="h-16 bg-white border-b border-light-border flex items-center justify-between px-6">\n' + TOP_MENU_BAR + '\n\n' + HEADER_RIGHT + '\n            </header>'


def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content

    aside_pattern = r'<aside[^>]*>.*?(?=</aside>|<div class="flex-1 flex flex-col|<header)'
    aside_match = re.search(aside_pattern, content, re.DOTALL)
    
    if aside_match:
        end_pos = aside_match.end()
        remaining = content[end_pos:]
        
        if remaining.strip().startswith('</aside>'):
            end_pos += len('</aside>')
        
        content = content[:aside_match.start()] + LEFT_SIDEBAR + '\n        \n        <div class="flex-1 flex flex-col overflow-hidden">\n' + NEW_HEADER + '\n\n            ' + content[end_pos:]

    leftover_pattern = r'<div class="flex-1 overflow[^"]*"[^>]*>\s*<div class="mb-\d">\s*<div class="text-xs font-medium[^"]*">'
    if re.search(leftover_pattern, content):
        leftover_end_pattern = r'<div class="flex-1 overflow[^"]*"[^>]*>.*?(?=<div class="flex-1 flex flex-col|<div class="flex-1 overflow-auto p-6|<main|<header)'
        leftover_match = re.search(leftover_end_pattern, content, re.DOTALL)
        if leftover_match:
            content = content[:leftover_match.start()] + content[leftover_match.end():]

    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed: {os.path.basename(filepath)}')
    else:
        print(f'No changes: {os.path.basename(filepath)}')


def main():
    print(f'Fixing {len(FILES_TO_FIX)} files with missing </aside> tag\n')
    
    for filename in FILES_TO_FIX:
        filepath = os.path.join(OPERATION_DIR, filename)
        if os.path.exists(filepath):
            try:
                fix_file(filepath)
            except Exception as e:
                print(f'Error fixing {filename}: {e}')
        else:
            print(f'File not found: {filename}')


if __name__ == '__main__':
    main()
