import os
import re

OPERATION_DIR = r'e:\近期重点任务\智慧赛事服务系统\AI_project\design\prototypes\operation'

MENU_SCRIPT = '''        const MENU_MAP = {
            'event_management.html': 'event-project',
            'event_project.html': 'event-project',
            'result_certificate_config.html': 'event-project',
            'timing_point.html': 'event-rule',
            'start_batch.html': 'event-rule',
            'timing_clock.html': 'event-rule',
            'result_template.html': 'event-rule',
            'runner_management.html': 'personnel-team',
            'batch_bind.html': 'personnel-team',
            'bind_status.html': 'personnel-team',
            'group_management.html': 'personnel-team',
            'team_management.html': 'personnel-team',
            'team_pk_rule.html': 'personnel-team',
            'pickup_sign.html': 'personnel-team',
            'onsite_bind.html': 'personnel-team',
            'shuttle_checkin.html': 'personnel-team',
            'raw_data_management.html': 'result-mgmt',
            'abnormal_data.html': 'result-mgmt',
            'manual_correction.html': 'result-mgmt',
            'completed_results.html': 'result-mgmt',
            'incomplete_results.html': 'result-mgmt',
            'realtime_result.html': 'result-mgmt',
            'team_dashboard.html': 'result-mgmt',
            'closed_runners.html': 'result-mgmt',
            'result_review.html': 'result-mgmt',
            'certificate_generate.html': 'result-mgmt',
            'notification_service.html': 'data-ai',
            'data_ai_analysis.html': 'data-ai',
            'ai_analysis_backend.html': 'data-ai',
            'crowd_risk_report.html': 'data-ai',
            'resource_type_config.html': 'resource-mgmt',
            'resource_info_management.html': 'resource-mgmt',
            'resource_location.html': 'resource-mgmt'
        };
        
        function switchTopMenu(menuId) {
            document.querySelectorAll('.top-menu-item').forEach(item => {
                item.classList.remove('active');
            });
            document.querySelector(`.top-menu-item[data-menu="${menuId}"]`).classList.add('active');
            
            document.querySelectorAll('.menu-panel').forEach(panel => {
                panel.classList.remove('active');
            });
            document.getElementById('menu-' + menuId).classList.add('active');
        }
        
        function initMenu() {
            const currentPath = window.location.pathname.split('/').pop();
            const menuId = MENU_MAP[currentPath] || 'event-project';
            switchTopMenu(menuId);
            
            document.querySelectorAll('.menu-panel a').forEach(link => {
                if (link.getAttribute('href') === currentPath) {
                    link.classList.add('active');
                }
            });
        }
'''

MENU_STYLES = '''
        .top-menu-item {
            color: #475569;
            border-radius: 8px;
        }
        
        .top-menu-item:hover {
            background-color: #F1F5F9;
        }
        
        .top-menu-item.active {
            background-color: rgba(3, 105, 161, 0.1);
            color: #0369A1;
            font-weight: 500;
        }
        
        .menu-panel {
            display: none;
        }
        
        .menu-panel.active {
            display: block;
        }
'''

LEFT_SIDEBAR = '''        <aside class="sidebar w-56 bg-white border-r border-light-border flex flex-col">
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

TOP_MENU_BAR = '''                <div class="flex items-center space-x-1">
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

def fix_html_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    external_scripts = re.findall(r'<script src="[^"]*"></script>', content)
    
    tailwind_config = ''
    other_functions = []
    
    all_inline_scripts = re.findall(r'<script>(.*?)</script>', content, re.DOTALL)
    for script_content in all_inline_scripts:
        tailwind_match = re.search(r'tailwind\.config\s*=\s*\{.*?\};', script_content, re.DOTALL)
        if tailwind_match:
            tailwind_config = '\n\n        ' + tailwind_match.group(0)
        
        dom_ready_match = re.search(r"document\.addEventListener\('DOMContentLoaded'.*?\}\s*\)", script_content, re.DOTALL)
        if dom_ready_match:
            dom_content = dom_ready_match.group(0)
            if 'initMenu()' not in dom_content:
                dom_content = dom_content.rstrip('}') + '\n            initMenu();\n        }'
            other_functions.append(dom_content)
        
        function_matches = re.findall(r'function\s+\w+\s*\([^)]*\)\s*\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}', script_content, re.DOTALL)
        for func in function_matches:
            if 'switchTopMenu' not in func and 'initMenu' not in func and 'toggleSubmenu' not in func and 'toggleSystemMenu' not in func:
                if func not in other_functions:
                    other_functions.append(func)
    
    content = re.sub(r'<script>.*?</script>', '', content, flags=re.DOTALL)
    
    other_functions_str = '\n\n        '.join(other_functions) if other_functions else ''
    new_script = '<script>\n' + MENU_SCRIPT + tailwind_config
    if other_functions_str:
        new_script += '\n\n        ' + other_functions_str
    new_script += '\n    </script>'
    
    content = re.sub(r'</body>', new_script + '\n</body>', content)
    
    if '<script src="https://cdn.tailwindcss.com"></script>' not in content:
        content = re.sub(r'</title>', '</title>\n    <script src="https://cdn.tailwindcss.com"></script>', content)
    
    style_section = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
    if style_section:
        style_content = style_section.group(1)
        style_content = re.sub(r'\.top-menu-item\s*\{[^}]*\}', '', style_content)
        style_content = re.sub(r'\.top-menu-item:hover\s*\{[^}]*\}', '', style_content)
        style_content = re.sub(r'\.top-menu-item\.active\s*\{[^}]*\}', '', style_content)
        style_content = re.sub(r'\.menu-panel\s*\{[^}]*\}', '', style_content)
        style_content = re.sub(r'\.menu-panel\.active\s*\{[^}]*\}', '', style_content)
        
        style_content = re.sub(r'\n\s*\n\s*\n', '\n\n', style_content)
        
        body_match = re.search(r'body\s*\{[^}]*\}', style_content)
        if body_match:
            insert_pos = body_match.end()
            style_content = style_content[:insert_pos] + MENU_STYLES + style_content[insert_pos:]
        
        content = re.sub(r'<style>.*?</style>', '<style>' + style_content + '</style>', content, flags=re.DOTALL)
    
    aside_pattern = r'<aside class="sidebar[^>]*>.*?</aside>'
    aside_match = re.search(aside_pattern, content, re.DOTALL)
    if aside_match:
        content = content[:aside_match.start()] + LEFT_SIDEBAR + content[aside_match.end():]
    
    header_pattern = r'(<header class="h-16[^>]*>)(.*?)(</header>)'
    header_match = re.search(header_pattern, content, re.DOTALL)
    if header_match:
        header_content = header_match.group(2)
        title_pattern = r'<div class="flex items-center">\s*<h1[^>]*>.*?</h1>\s*</div>'
        top_menu_pattern = r'<div class="flex items-center space-x-1">.*?</div>\s*<div class="flex items-center space-x-4">'
        
        if re.search(title_pattern, header_content):
            new_header_content = re.sub(title_pattern, TOP_MENU_BAR, header_content)
            content = content[:header_match.start()] + '<header class="h-16 bg-white border-b border-light-border flex items-center justify-between px-6">' + new_header_content + '</header>' + content[header_match.end():]
        elif re.search(top_menu_pattern, header_content, re.DOTALL):
            new_header_content = re.sub(top_menu_pattern, TOP_MENU_BAR + '\n                \n                <div class="flex items-center space-x-4">', header_content, flags=re.DOTALL)
            content = content[:header_match.start()] + '<header class="h-16 bg-white border-b border-light-border flex items-center justify-between px-6">' + new_header_content + '</header>' + content[header_match.end():]
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed: {os.path.basename(filepath)}')
    else:
        print(f'No changes: {os.path.basename(filepath)}')

def main():
    html_files = [f for f in os.listdir(OPERATION_DIR) 
                  if f.endswith('.html') and f not in ['menu_template.html', 'menu_template_new.html']]
    
    print(f'Found {len(html_files)} HTML files to fix\n')
    
    for html_file in sorted(html_files):
        filepath = os.path.join(OPERATION_DIR, html_file)
        try:
            fix_html_file(filepath)
        except Exception as e:
            print(f'Error fixing {html_file}: {e}')

if __name__ == '__main__':
    main()
