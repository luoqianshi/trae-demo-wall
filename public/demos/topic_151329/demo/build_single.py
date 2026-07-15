# -*- coding: utf-8 -*-
"""
构建单HTML文件版本
将所有CSS和JS文件内联到一个HTML文件中，便于分发和分享。
"""
import os

BASE = os.path.dirname(os.path.abspath(__file__))

# 读取文件内容
def read_file(rel_path):
    path = os.path.join(BASE, rel_path)
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

# CSS
css_content = read_file('assets/style.css')

# 引擎层JS
engine_synonym = read_file('engine/synonymExpander.js')
engine_match = read_file('engine/matchEngine.js')

# 数据层JS
data_files = [
    'data/sampleData.js',
    'data/quickRules.js',
    'data/synonymGroups.js',
    'data/disciplines.js',
    'data/combinationRules.js',
    'data/featureRules.js',
    'data/funnelResults.js',
    'data/tableA.js',
    'data/tableB.js',
    'data/abMatchResults.js',
]
data_contents = [read_file(f) for f in data_files]

# 视图层JS
view_quick = read_file('views/quickMode.js')
view_advanced = read_file('views/advancedMode.js')
view_abmatch = read_file('views/abMatchMode.js')

# 组装HTML
html = '''<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SmartTag Engine 智标引擎 - 数据智能打标签系统</title>
    <style>
''' + css_content + '''
    </style>
</head>
<body>
    <!-- 顶部品牌色条 -->
    <div class="brand-bar"></div>

    <!-- 工具栏 -->
    <div class="toolbar">
        <div class="logo">
            <span class="logo-se">SE</span>
            <span class="logo-text">SmartTag Engine</span>
        </div>
        <div class="toolbar-separator"></div>
        <div class="mode-tabs">
            <button class="mode-tab active" data-mode="quick">⚡ 快速模式</button>
            <button class="mode-tab" data-mode="advanced">🎯 高级模式（三层解析）</button>
            <button class="mode-tab" data-mode="abmatch">🚀 AB表智能匹配</button>
        </div>
        <div class="toolbar-separator"></div>
        <div class="toolbar-info">
            <span id="versionInfo">V1.5.0 Demo (单文件版)</span>
        </div>
    </div>

    <!-- 主内容区 -->
    <div id="mainContent" class="main-content">
        <div id="quickModeView" class="mode-view active"></div>
        <div id="advancedModeView" class="mode-view"></div>
        <div id="abMatchModeView" class="mode-view"></div>
    </div>

    <!-- 状态栏 -->
    <div class="status-bar">
        <span id="statusText">就绪 - 请选择模式并操作</span>
        <span id="progressInfo" class="progress-info"></span>
    </div>

    <!-- 弹窗容器 -->
    <div id="modalContainer"></div>

    <!-- ========== 引擎层 ========== -->
    <script>
''' + engine_synonym + '''
    </script>
    <script>
''' + engine_match + '''
    </script>

    <!-- ========== 数据层 ========== -->
'''

for dc in data_contents:
    html += '    <script>\n' + dc + '\n    </script>\n'

html += '''
    <!-- ========== 视图层 ========== -->
    <script>
''' + view_quick + '''
    </script>
    <script>
''' + view_advanced + '''
    </script>
    <script>
''' + view_abmatch + '''
    </script>

    <!-- ========== 主应用 ========== -->
    <script>
        // 模式切换
        document.querySelectorAll('.mode-tab').forEach(function(tab) {
            tab.addEventListener('click', function() {
                var mode = tab.dataset.mode;
                document.querySelectorAll('.mode-tab').forEach(function(t) { t.classList.remove('active'); });
                tab.classList.add('active');
                document.querySelectorAll('.mode-view').forEach(function(v) { v.classList.remove('active'); });
                var viewId = mode === 'abmatch' ? 'abMatchModeView' : mode + 'ModeView';
                var viewEl = document.getElementById(viewId);
                if (viewEl) viewEl.classList.add('active');
                var modeNames = { quick: '快速模式', advanced: '高级模式（三层解析）', abmatch: 'AB表智能匹配' };
                document.getElementById('statusText').textContent = '当前模式：' + modeNames[mode];
            });
        });

        // 初始化各视图
        window.addEventListener('DOMContentLoaded', function() {
            try {
                QuickModeView.init('quickModeView');
                AdvancedModeView.init('advancedModeView');
                ABMatchModeView.init('abMatchModeView');
            } catch(e) {
                console.error('初始化错误:', e);
                document.getElementById('statusText').textContent = '初始化错误: ' + e.message;
            }
        });
    </script>
</body>
</html>
'''

# 写入单HTML文件
output_path = os.path.join(BASE, 'SmartTag-Engine-Demo.html')
with open(output_path, 'w', encoding='utf-8') as f:
    f.write(html)

print(f'单HTML文件已生成: {output_path}')
print(f'文件大小: {os.path.getsize(output_path) / 1024:.1f} KB')
