import os
import re

OPERATION_DIR = r'e:\近期重点任务\智慧赛事服务系统\AI_project\design\prototypes\operation'

TAILWIND_CONFIG = r'''    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#0F172A',
                        secondary: '#334155',
                        accent: '#0369A1',
                        success: '#22C55E',
                        warning: '#F59E0B',
                        danger: '#EF4444',
                        light: {
                            bg: '#F8FAFC',
                            card: '#FFFFFF',
                            border: '#E2E8F0',
                            lighter: '#F1F5F9'
                        }
                    }
                }
            }
        }
    </script>'''

skip_files = {'menu_template.html', 'menu_template_new.html', 'quick_guide.html',
              'fix_default_menu.py', 'comprehensive_fix.py', 'fix_missing_aside.py',
              'fix_menu_duplicates.py', 'fix_menu_v2.py', 'update_menu_structure.py',
              'fix_corrupted_files.py', 'cleanup_duplicate_scripts.py', 'add_toggle_system_menu_v5.py'}

count = 0
for filename in os.listdir(OPERATION_DIR):
    if not filename.endswith('.html') or filename in skip_files:
        continue

    filepath = os.path.join(OPERATION_DIR, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'tailwind.config' in content:
        print(f'SKIP (has config): {filename}')
        continue

    cdn_pattern = r'<script src="https://cdn\.tailwindcss\.com"></script>'
    match = re.search(cdn_pattern, content)
    if not match:
        print(f'SKIP (no CDN): {filename}')
        continue

    content = content[:match.end()] + '\n' + TAILWIND_CONFIG + content[match.end():]

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    count += 1
    print(f'Fixed: {filename}')

print(f'\nTotal: {count} files')
