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

def fix_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    script_pattern = r'<script>\s*const MENU_MAP\s*=\s*\{[^}]+\};\s*function switchTopMenu[^<]+</script>'
    matches = list(re.finditer(script_pattern, content, re.DOTALL))
    
    if len(matches) > 1:
        for match in matches[1:]:
            content = content[:match.start()] + content[match.end():]
        print(f'Removed {len(matches) - 1} duplicate script(s) from {os.path.basename(filepath)}')
    
    domcontentloaded_pattern = r'document\.addEventListener\s*\(\s*[\'"]DOMContentLoaded[\'"]\s*,\s*function\s*\(\s*\)\s*\{[^}]+\}\s*\)\s*;'
    dom_matches = list(re.finditer(domcontentloaded_pattern, content))
    
    if len(dom_matches) > 1:
        for match in dom_matches[1:]:
            content = content[:match.start()] + content[match.end():]
        print(f'Removed {len(dom_matches) - 1} duplicate DOMContentLoaded listener(s) from {os.path.basename(filepath)}')

    tailwind_pattern = r'tailwind\.config\s*=\s*\{[^}]+\};'
    tailwind_matches = list(re.finditer(tailwind_pattern, content, re.DOTALL))
    
    if len(tailwind_matches) > 1:
        for match in tailwind_matches[1:]:
            content = content[:match.start()] + content[match.end():]
        print(f'Removed {len(tailwind_matches) - 1} duplicate tailwind.config(s) from {os.path.basename(filepath)}')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return True

def main():
    print(f'Cleaning up duplicate scripts in {len(FILES_TO_FIX)} files\n')

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
