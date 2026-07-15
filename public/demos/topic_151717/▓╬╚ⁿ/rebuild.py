import re

with open(r'c:\Users\Administrator\Desktop\参赛\trae_creativity_lightburn_plate_coach.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract CSS (between <style> and </style>)
css_start = content.find('<style>') + 7
css_end = content.find('</style>')
css = content[css_start:css_end]

# Extract HTML body (between </style> and <script>)
# html_part includes </head><body>...content... (but NOT </body></html>)
html_start = css_end + 8  # after </style>
html_end = content.find('<script>')
html_part = content[html_start:html_end]

# Extract JS (between <script> and </script>)
js_start = content.find('<script>') + 8
js_end = content.find('</script>')
js = content[js_start:js_end]

# Rebuild with clean structure
new_html = f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>轻燃餐盘教练 Pro | TRAE AI 创造力大赛 Demo</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;800;900&family=Noto+Serif+SC:wght@600;700;900&display=swap" rel="stylesheet">
  <style>
{css}  </style>
{html_part}  <script>
{js}  </script>
</body>
</html>'''

with open(r'c:\Users\Administrator\Desktop\参赛\trae_creativity_lightburn_plate_coach.html', 'w', encoding='utf-8') as f:
    f.write(new_html)

print("File rebuilt successfully")
print(f"CSS: {len(css)} chars")
print(f"HTML body: {len(html_part)} chars")
print(f"JS: {len(js)} chars")
print(f"Total: {len(new_html)} chars")