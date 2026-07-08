import os
import re

OPERATION_DIR = r'e:\近期重点任务\智慧赛事服务系统\AI_project\design\prototypes\operation'

DRAWER_FUNCTIONS = r'''
        function openDrawer() {
            var drawer = document.getElementById('drawer') || document.querySelector('.drawer');
            var overlay = document.getElementById('drawerOverlay') || document.getElementById('overlay') || document.querySelector('.overlay');
            if (drawer) drawer.classList.add('open');
            if (overlay) overlay.classList.add('open');
        }

        function closeDrawer() {
            var drawer = document.getElementById('drawer') || document.querySelector('.drawer');
            var overlay = document.getElementById('drawerOverlay') || document.getElementById('overlay') || document.querySelector('.overlay');
            if (drawer) drawer.classList.remove('open');
            if (overlay) overlay.classList.remove('open');
        }'''

PAGE_SPECIFIC_FUNCTIONS = r'''
        function selectTimingPoint(el) {
            document.querySelectorAll('.timing-point-item').forEach(function(item) {
                item.classList.remove('selected');
                item.style.background = '';
            });
            el.classList.add('selected');
            el.style.background = '#F0F9FF';
        }

        function syncDevice(id) {
            alert('正在同步设备: ' + id);
        }

        function viewDevice(id) {
            var drawer = document.getElementById('drawer') || document.querySelector('.drawer');
            var overlay = document.getElementById('drawerOverlay') || document.getElementById('overlay') || document.querySelector('.overlay');
            if (drawer) drawer.classList.add('open');
            if (overlay) overlay.classList.add('open');
        }

        function troubleshoot(id) {
            alert('正在排查设备故障: ' + id);
        }

        function switchTab(tabId) {
            document.querySelectorAll('.tab-item, [class*="tab-active"]').forEach(function(tab) {
                tab.classList.remove('active', 'tab-active');
                tab.classList.add('text-gray-500');
            });
            event.target.classList.add('active', 'tab-active');
            event.target.classList.remove('text-gray-500');
        }

        function toggleTeamMembers(teamId) {
            var members = document.getElementById(teamId + '-members');
            if (members) {
                members.classList.toggle('hidden');
            }
        }

        function showResourceInfo(name) {
            alert('资源详情: ' + name);
        }

        function exportData() {
            alert('正在导出数据...');
        }

        function exportResults() {
            alert('正在导出成绩数据...');
        }

        function confirmLock() {
            if (confirm('确认锁定成绩？锁定后不可修改。')) {
                alert('成绩已锁定');
            }
        }

        function confirmPublish() {
            if (confirm('确认发布成绩？')) {
                alert('成绩已发布');
            }
        }

        function openBatchImport() {
            var drawer = document.getElementById('drawer') || document.querySelector('.drawer');
            var overlay = document.getElementById('drawerOverlay') || document.getElementById('overlay') || document.querySelector('.overlay');
            if (drawer) drawer.classList.add('open');
            if (overlay) overlay.classList.add('open');
        }

        function confirmEdit() {
            alert('修改已保存');
            closeDrawer();
        }

        function exportReport() {
            alert('正在导出报告...');
        }

        function batchNotify() {
            if (confirm('确认批量通知？')) {
                alert('通知已发送');
            }
        }

        function confirmStatus(id) {
            if (confirm('确认该选手状态？')) {
                alert('状态已确认: ' + id);
            }
        }

        function toggleTimingPointDropdown() {
            var dropdown = document.getElementById('timingPointDropdown');
            if (dropdown) {
                dropdown.classList.toggle('hidden');
            }
        }

        function toggleRefresh() {
            var btn = document.getElementById('pauseBtn');
            if (btn) {
                if (btn.textContent.includes('暂停')) {
                    btn.innerHTML = '<i class="fa fa-play mr-1"></i>恢复刷新';
                } else {
                    btn.innerHTML = '<i class="fa fa-pause mr-1"></i>暂停刷新';
                }
            }
        }'''

NEW_MENU_MAP = r"""        const MENU_MAP = {
            'event_management.html': 'event-mgmt',
            'event_project.html': 'event-mgmt',
            'result_certificate_config.html': 'event-mgmt',
            'timing_point.html': 'event-mgmt',
            'start_batch.html': 'event-mgmt',
            'timing_clock.html': 'event-mgmt',
            'result_template.html': 'event-mgmt',
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
            'incomplete_statistics.html': 'result-mgmt',
            'realtime_result.html': 'result-mgmt',
            'team_dashboard.html': 'result-mgmt',
            'closed_runners.html': 'result-mgmt',
            'result_review.html': 'result-mgmt',
            'result_statistics.html': 'result-mgmt',
            'result_query.html': 'result-mgmt',
            'result_publish.html': 'result-mgmt',
            'result_export.html': 'result-mgmt',
            'result_appeal.html': 'result-mgmt',
            'certificate_generate.html': 'result-mgmt',
            'notification_service.html': 'data-ai',
            'data_ai_analysis.html': 'data-ai',
            'data_sync.html': 'data-ai',
            'data_api.html': 'data-ai',
            'ai_analysis_backend.html': 'data-ai',
            'ai_analysis.html': 'data-ai',
            'ai_prediction.html': 'data-ai',
            'crowd_risk_report.html': 'data-ai',
            'resource_type_config.html': 'resource-mgmt',
            'resource_info_management.html': 'resource-mgmt',
            'resource_location.html': 'resource-mgmt',
            'material_management.html': 'resource-mgmt',
            'volunteer_management.html': 'resource-mgmt',
            'vehicle_management.html': 'resource-mgmt'
        };"""

NEW_LEFT_SIDEBAR = r'''        <aside class="sidebar w-56 bg-white border-r border-light-border flex flex-col">
            <div class="h-16 flex items-center px-4 border-b border-light-border">
                <div class="flex items-center">
                    <i class="fa fa-trophy text-accent text-xl mr-2"></i>
                    <span class="font-semibold text-primary">赛事运营管理</span>
                </div>
            </div>

            <div class="flex-1 overflow-y-auto p-3">
                <div id="menu-event-mgmt" class="menu-panel">
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

NEW_TOP_MENU = r'''                <div class="flex items-center space-x-1">
                    <button class="top-menu-item px-4 py-2 text-sm" data-menu="event-mgmt" onclick="switchTopMenu('event-mgmt')">
                        <i class="fa fa-trophy mr-2"></i>赛事管理
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

NEW_MENU_SCRIPT = NEW_MENU_MAP + r"""

        function switchTopMenu(menuId) {
            document.querySelectorAll('.top-menu-item').forEach(function(item) {
                item.classList.remove('active');
            });
            var activeBtn = document.querySelector('.top-menu-item[data-menu="' + menuId + '"]');
            if (activeBtn) activeBtn.classList.add('active');

            document.querySelectorAll('.menu-panel').forEach(function(panel) {
                panel.classList.remove('active');
            });
            var activePanel = document.getElementById('menu-' + menuId);
            if (activePanel) activePanel.classList.add('active');
        }

        function initMenu() {
            var currentPath = window.location.pathname.split('/').pop();
            var menuId = MENU_MAP[currentPath] || 'event-mgmt';
            switchTopMenu(menuId);

            document.querySelectorAll('.menu-panel a').forEach(function(link) {
                if (link.getAttribute('href') === currentPath) {
                    link.classList.add('active');
                }
            });
        }

        function toggleSystemMenu() {
            var menu = document.getElementById('systemMenu');
            if (menu) {
                menu.classList.toggle('hidden');
            }
        }

        document.addEventListener('DOMContentLoaded', function() {
            initMenu();
        });"""


def get_needed_functions(content):
    functions_needed = []
    if 'openDrawer()' in content or 'closeDrawer()' in content:
        functions_needed.append('drawer')
    if 'selectTimingPoint(' in content:
        functions_needed.append('selectTimingPoint')
    if 'syncDevice(' in content:
        functions_needed.append('syncDevice')
    if 'viewDevice(' in content:
        functions_needed.append('viewDevice')
    if 'troubleshoot(' in content:
        functions_needed.append('troubleshoot')
    if 'switchTab(' in content:
        functions_needed.append('switchTab')
    if 'toggleTeamMembers(' in content:
        functions_needed.append('toggleTeamMembers')
    if 'showResourceInfo(' in content:
        functions_needed.append('showResourceInfo')
    if 'exportData()' in content:
        functions_needed.append('exportData')
    if 'exportResults()' in content:
        functions_needed.append('exportResults')
    if 'confirmLock()' in content:
        functions_needed.append('confirmLock')
    if 'confirmPublish()' in content:
        functions_needed.append('confirmPublish')
    if 'openBatchImport()' in content:
        functions_needed.append('openBatchImport')
    if 'confirmEdit()' in content:
        functions_needed.append('confirmEdit')
    if 'exportReport()' in content:
        functions_needed.append('exportReport')
    if 'batchNotify()' in content:
        functions_needed.append('batchNotify')
    if 'confirmStatus(' in content:
        functions_needed.append('confirmStatus')
    if 'toggleTimingPointDropdown()' in content:
        functions_needed.append('toggleTimingPointDropdown')
    if 'toggleRefresh()' in content:
        functions_needed.append('toggleRefresh')
    return functions_needed


def build_functions_code(needed):
    parts = []
    if 'drawer' in needed:
        parts.append(DRAWER_FUNCTIONS)
    page_funcs = [f for f in needed if f != 'drawer']
    if page_funcs:
        parts.append(PAGE_SPECIFIC_FUNCTIONS)
    return '\n'.join(parts)


def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    original = content
    filename = os.path.basename(filepath)

    if filename in ('menu_template.html', 'menu_template_new.html', 'quick_guide.html'):
        return False

    needed = get_needed_functions(content)
    if not needed and 'event-project' not in content and 'event-rule' not in content:
        return False

    changed = False

    if 'event-project' in content or 'event-rule' in content:
        aside_pattern = r'<aside[^>]*>.*?</aside>'
        aside_match = re.search(aside_pattern, content, re.DOTALL)
        if aside_match:
            content = content[:aside_match.start()] + NEW_LEFT_SIDEBAR + content[aside_match.end():]
            changed = True

        top_menu_pattern = r'<div class="flex items-center space-x-1">.*?</div>\s*(?=<div class="flex items-center space-x-4">|<div class="h-6)'
        top_menu_match = re.search(top_menu_pattern, content, re.DOTALL)
        if top_menu_match:
            content = content[:top_menu_match.start()] + NEW_TOP_MENU + '\n\n' + content[top_menu_match.end():]
            changed = True

        menu_map_pattern = r"const MENU_MAP\s*=\s*\{[^}]+\};"
        menu_map_match = re.search(menu_map_pattern, content)
        if menu_map_match:
            content = content[:menu_map_match.start()] + NEW_MENU_MAP + content[menu_map_match.end():]
            changed = True

        old_menu_items = [
            (r"data-menu=\"event-project\"", r"data-menu=\"event-mgmt\""),
            (r"data-menu=\"event-rule\"", r"data-menu=\"event-mgmt\""),
        ]
        for old, new in old_menu_items:
            if re.search(old, content):
                content = re.sub(old, new, content)
                changed = True

    if needed:
        existing_funcs = set()
        for func_match in re.finditer(r'function\s+(\w+)\s*\(', content):
            existing_funcs.add(func_match.group(1))

        func_code = ''
        if 'drawer' in needed and 'openDrawer' not in existing_funcs:
            func_code += DRAWER_FUNCTIONS
        page_funcs = [f for f in needed if f != 'drawer']
        missing_page_funcs = [f for f in page_funcs if f not in existing_funcs]
        if missing_page_funcs:
            func_code += PAGE_SPECIFIC_FUNCTIONS

        if func_code:
            script_end_pattern = r'(</script>)'
            last_script = list(re.finditer(script_end_pattern, content))
            if last_script:
                pos = last_script[-1].start()
                insert_code = '\n' + func_code + '\n    '
                content = content[:pos] + insert_code + content[pos:]
                changed = True

    if changed and content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True

    return False


def main():
    html_files = [f for f in os.listdir(OPERATION_DIR) if f.endswith('.html')]
    skip_files = {'menu_template.html', 'menu_template_new.html', 'quick_guide.html'}
    html_files = [f for f in html_files if f not in skip_files]

    fixed_count = 0
    for filename in sorted(html_files):
        filepath = os.path.join(OPERATION_DIR, filename)
        try:
            if fix_file(filepath):
                print(f'Fixed: {filename}')
                fixed_count += 1
        except Exception as e:
            print(f'Error: {filename} - {e}')

    print(f'\nTotal fixed: {fixed_count}/{len(html_files)} files')


if __name__ == '__main__':
    main()
