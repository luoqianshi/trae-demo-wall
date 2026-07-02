"""
历史对话模拟器 - 构建脚本
解析 backup-md 文件夹中的 MD 会话文档，生成 chat-viewer.html
"""
import os
import re
import json
import base64
import datetime

# 项目根目录（脚本在 .trae/skills/历史对话模拟器/ 下，需要上溯3级）
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
SKILL_DIR = SCRIPT_DIR  # .trae/skills/历史对话模拟器/
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(SKILL_DIR)))  # 项目根目录
BACKUP_MD_DIR = os.path.join(PROJECT_ROOT, 'backup-md')
TEMPLATE_PATH = os.path.join(SKILL_DIR, 'assets', 'chat-viewer-template.html')
OUTPUT_PATH = os.path.join(PROJECT_ROOT, 'chat-viewer.html')


def img_to_b64(path):
    """将图片文件转换为 base64 data URI"""
    if not os.path.exists(path):
        return None
    with open(path, 'rb') as f:
        data = f.read()
    ext = os.path.splitext(path)[1].lower()
    mime_map = {'.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml'}
    mime = mime_map.get(ext, 'image/png')
    return f'data:{mime};base64,' + base64.b64encode(data).decode()


def parse_md_file(filepath):
    """解析单个 MD 文件，提取会话数据"""
    filename = os.path.basename(filepath)
    mtime = os.path.getmtime(filepath)
    dt = datetime.datetime.fromtimestamp(mtime)
    time_str = dt.strftime('%m月%d日 %H:%M')

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 提取标题（第一行 # 开头）
    title = filename.replace('.md', '')
    workspace = ''
    if content.startswith('# '):
        lines = content.split('\n')
        title = lines[0].replace('# ', '').strip()
        # 尝试提取 workspace
        for line in lines[1:10]:
            m = re.search(r'\*\*Workspace:\*\*\s*(.+)', line)
            if m:
                workspace = m.group(1).strip()
                break

    # 查找对话内容起始位置（--- 之后）
    parts = re.split(r'\n---\s*\n', content, maxsplit=1)
    if len(parts) < 2:
        # 没有 --- 分隔符，尝试直接解析
        body = content
    else:
        body = parts[1]

    # 按 ## User / ## Assistant 分割消息
    messages = []
    # 使用正则匹配 ## User 或 ## Assistant 作为分隔
    # 前置 \n 确保 body 开头直接是 ## User 时也能正确分割
    segments = re.split(r'\n## (User|Assistant)\s*\n', '\n' + body)

    # segments[0] 是第一个 ## 之前的内容（可能是空的）
    # 之后每两个一组：[role, content]
    i = 0
    if segments and not re.match(r'^(User|Assistant)$', segments[0].strip()):
        i = 1  # 跳过开头非角色内容

    while i + 1 < len(segments):
        role = segments[i].strip()
        msg_content = segments[i + 1].strip()
        if role in ('User', 'Assistant'):
            role_map = {'User': 'user', 'Assistant': 'assistant'}
            messages.append({
                'role': role_map[role],
                'content': msg_content
            })
        i += 2

    # 判断状态
    status = 'completed'
    if messages and '任务中断' in messages[-1].get('content', ''):
        status = 'interrupted'

    return {
        'title': title,
        'workspace': workspace,
        'timestamp': int(mtime),
        'time_str': time_str,
        'status': status,
        'messages': messages
    }


def scan_backup_md():
    """扫描 backup-md 文件夹，返回所有 MD 文件路径"""
    if not os.path.isdir(BACKUP_MD_DIR):
        print(f'[警告] backup-md 文件夹不存在: {BACKUP_MD_DIR}')
        return []

    md_files = []
    for f in sorted(os.listdir(BACKUP_MD_DIR)):
        if f.endswith('.md'):
            md_files.append(os.path.join(BACKUP_MD_DIR, f))
    return md_files


def scan_images():
    """扫描 backup-md 文件夹中的图片资源"""
    if not os.path.isdir(BACKUP_MD_DIR):
        return {}

    images = {}
    for f in os.listdir(BACKUP_MD_DIR):
        ext = os.path.splitext(f)[1].lower()
        if ext in ('.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'):
            name = os.path.splitext(f)[0]
            images[name] = os.path.join(BACKUP_MD_DIR, f)
    return images


def find_icon_by_name(images, keywords):
    """根据关键词匹配图片"""
    for name, path in images.items():
        for kw in keywords:
            if kw in name:
                return img_to_b64(path)
    return None


def build():
    """主构建流程"""
    print('=' * 50)
    print('  历史对话模拟器 - 构建 chat-viewer.html')
    print('=' * 50)

    # 1. 扫描 MD 文件
    md_files = scan_backup_md()
    if not md_files:
        print('[错误] backup-md 文件夹中没有找到 MD 文件！')
        print(f'请将 MD 会话文档放入: {BACKUP_MD_DIR}')
        # 生成空列表
        conversations = []
    else:
        print(f'\n[1/4] 找到 {len(md_files)} 个 MD 文件:')
        for f in md_files:
            print(f'  - {os.path.basename(f)}')

        # 2. 解析 MD 文件
        print(f'\n[2/4] 解析 MD 文件...')
        conversations = []
        for i, f in enumerate(md_files):
            conv = parse_md_file(f)
            conv['id'] = f'conv_{i + 1}'
            conversations.append(conv)
            msg_count = len(conv['messages'])
            print(f'  [{conv["title"]}] {msg_count} 条消息, 状态: {conv["status"]}')

    # 3. 扫描图片资源
    print(f'\n[3/4] 扫描图片资源...')
    images = scan_images()
    print(f'  找到 {len(images)} 个图片文件')

    # 匹配图标
    icon_b64 = find_icon_by_name(images, ['icon', '头像', 'avatar'])
    solo_icon_b64 = find_icon_by_name(images, ['SOLO图标', 'SOLO'])
    agent_icon_b64 = find_icon_by_name(images, ['Agent图标', 'Agent'])
    solo_agent_empty_b64 = find_icon_by_name(images, ['SOLO Agent空白', '空白图标'])
    task_icon_b64 = find_icon_by_name(images, ['任务图标', '任务'])
    check_icon_b64 = find_icon_by_name(images, ['check', '绿勾', '对勾'])

    # 默认使用内联 SVG（如果找不到图片）
    default_icon = 'data:image/svg+xml;base64,' + base64.b64encode(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="#32c391"/><text x="16" y="22" text-anchor="middle" font-size="18" fill="white" font-family="Arial">U</text></svg>'.encode()
    ).decode()
    default_solo = 'data:image/svg+xml;base64,' + base64.b64encode(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 40"><text x="0" y="32" font-size="28" fill="#32c391" font-family="Arial" font-weight="bold">SOLO</text></svg>'.encode()
    ).decode()
    default_agent = 'data:image/svg+xml;base64,' + base64.b64encode(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="2" y="2" width="28" height="28" rx="6" fill="#32c391"/><text x="16" y="22" text-anchor="middle" font-size="16" fill="white" font-family="Arial">AI</text></svg>'.encode()
    ).decode()

    if not icon_b64:
        icon_b64 = default_icon
        print('  [默认] 使用内置用户图标')
    if not solo_icon_b64:
        solo_icon_b64 = default_solo
        print('  [默认] 使用内置 SOLO 图标')
    if not agent_icon_b64:
        agent_icon_b64 = default_agent
        print('  [默认] 使用内置 Agent 图标')
    if not solo_agent_empty_b64:
        solo_agent_empty_b64 = default_agent
    if not task_icon_b64:
        task_icon_b64 = check_icon_b64 or default_agent
    if not check_icon_b64:
        check_icon_b64 = default_agent

    print(f'  SOLO图标: {"已找到" if "default" not in (solo_icon_b64 or "") else "使用默认"}')
    print(f'  Agent图标: {"已找到" if "default" not in (agent_icon_b64 or "") else "使用默认"}')
    print(f'  用户图标: {"已找到" if "default" not in (icon_b64 or "") else "使用默认"}')

    # 4. 读取模板并替换
    print(f'\n[4/4] 生成 chat-viewer.html...')
    if not os.path.exists(TEMPLATE_PATH):
        print(f'[错误] 模板文件不存在: {TEMPLATE_PATH}')
        return

    with open(TEMPLATE_PATH, 'r', encoding='utf-8') as f:
        template = f.read()

    # 构建 JSON 数据
    data = {'conversations': conversations}
    json_str = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    safe_json = json_str.replace('</script>', '<\\/script>')

    # 替换占位符
    html = template.replace('__DATA_PLACEHOLDER__', safe_json)
    html = html.replace('ICON_B64_PLACEHOLDER', icon_b64)
    html = html.replace('SOLO_ICON_B64', solo_icon_b64)
    html = html.replace('CHECK_ICON_B64', check_icon_b64)
    html = html.replace('AGENT_ICON_B64', agent_icon_b64)
    html = html.replace('SOLO_AGENT_EMPTY_B64', solo_agent_empty_b64)
    html = html.replace('TASK_ICON_B64', task_icon_b64)

    # 保存
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        f.write(html)

    file_size = os.path.getsize(OUTPUT_PATH)
    print(f'\n  输出文件: {OUTPUT_PATH}')
    print(f'  文件大小: {file_size} bytes ({file_size / 1024:.1f} KB)')
    print(f'  会话数量: {len(conversations)}')
    total_msgs = sum(len(c['messages']) for c in conversations)
    print(f'  消息总数: {total_msgs}')
    print(f'\n  访问地址: http://localhost:8000/chat-viewer.html')
    print('=' * 50)
    print('  构建完成！')
    print('=' * 50)


if __name__ == '__main__':
    build()