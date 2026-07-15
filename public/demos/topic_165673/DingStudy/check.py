import re

with open('e:/DingStudy/app-v2/index.html', encoding='utf-8') as f:
    html = f.read()

with open('e:/DingStudy/app-v2/app.js', encoding='utf-8') as f:
    js = f.read()

with open('e:/DingStudy/app-v2/data/data.js', encoding='utf-8') as f:
    data_js = f.read()

# HTML 中的 view-* ID
views = re.findall(r'id="view-([a-z-]+)"', html)
print('=== View IDs in HTML ===')
print('Total:', len(set(views)))
print(sorted(set(views)))

# HTML 中所有 ID
html_ids = re.findall(r'id="([a-zA-Z][a-zA-Z0-9_-]+)"', html)
print('\n=== HTML 总 ID 数: ===', len(set(html_ids)))

# app.js 中 #$ ID
js_ids = re.findall(r"\$\('#([a-zA-Z][a-zA-Z0-9_-]+)'\)", js)
js_ids += re.findall(r"getElementById\('([a-zA-Z][a-zA-Z0-9_-]+)'\)", js)
js_ids_uniq = sorted(set(js_ids))
print('\n=== app.js 引用 ID 数: ===', len(js_ids_uniq))

# 缺失检查
missing = []
for i in js_ids_uniq:
    if 'id="' + i + '"' not in html:
        missing.append(i)
print('=== app.js 引用但 HTML 缺失的 ID: ===')
print(missing if missing else '无')

# view-* 动态
views_referenced = re.findall(r"'view-' \+ (\w+)", js)
print('\n=== view- 动态生成来源: ===', views_referenced)

# ROUTES
routes = re.findall(r"'([a-z-]+)':\s*\{\s*auth", js)
print('\n=== ROUTES 中定义的 view: ===')
print(routes)

# 检查 app.js 中所有 data-icon 引用
data_icons = re.findall(r'data-icon="([a-z-]+)"', js)
print('\n=== app.js 中引用的 data-icon: ===', sorted(set(data_icons)))

# 检查 HTML 中 data-icon
html_icons = re.findall(r'data-icon="([a-z-]+)"', html)
print('\n=== HTML 中 data-icon: ===', sorted(set(html_icons)))

# 检查 icons.js 中定义的图标
with open('e:/DingStudy/app-v2/assets/icons.js', encoding='utf-8') as f:
    icons_js = f.read()
defined_icons = re.findall(r"'([a-z-]+)':\s*'\<", icons_js)
print('\n=== icons.js 中定义的图标数: ===', len(defined_icons))

# 检查 app.js+html 中所有用到的图标是否在 icons.js
all_used = set(data_icons) | set(html_icons)
undefined = [i for i in all_used if i not in defined_icons]
print('=== 使用了但 icons.js 未定义的图标: ===', undefined)

# 检查 app.js 字符串/括号匹配
print('\n=== 语法粗略检查 ===')
# 计数
for name, content in [('app.js', js), ('data.js', data_js), ('icons.js', icons_js)]:
    o = content.count('{')
    c = content.count('}')
    op = content.count('(')
    cp = content.count(')')
    print(f'{name}: { "{" }={o} { "}" }={c}  ({op}) {cp})')

# 模板字符串
single = js.count("'")
double = js.count('"')
backtick = js.count('`')
print(f'app.js 引号: 单引号={single} 双引号={double} 反引号={backtick}')
