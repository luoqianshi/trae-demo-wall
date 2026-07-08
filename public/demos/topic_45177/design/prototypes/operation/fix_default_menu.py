import os

OPERATION_DIR = r'e:\近期重点任务\智慧赛事服务系统\AI_project\design\prototypes\operation'

skip_files = {'menu_template.html', 'menu_template_new.html', 'quick_guide.html'}

count = 0
for filename in os.listdir(OPERATION_DIR):
    if not filename.endswith('.html') or filename in skip_files:
        continue
    
    filepath = os.path.join(OPERATION_DIR, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "|| 'event-project'" in content:
        content = content.replace("|| 'event-project'", "|| 'event-mgmt'")
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        count += 1
        print(f'Fixed: {filename}')

print(f'\nTotal: {count} files')
