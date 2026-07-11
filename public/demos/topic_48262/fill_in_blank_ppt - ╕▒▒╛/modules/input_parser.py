"""输入解析模块 - 解析输入文档为主题和段落，检测手动标记"""
import re
import json
import os
from dataclasses import dataclass, field, asdict
from typing import List


@dataclass
class Paragraph:
    text: str
    manual_blanks: List[str] = field(default_factory=list)
    blanks: List[str] = field(default_factory=list)  # 合并后的完整挖空词列表

    def clean_text(self) -> str:
        """移除 {{}} 标记，返回纯文本"""
        return re.sub(r'\{\{([^}]+)\}\}', r'\1', self.text)


@dataclass
class Topic:
    name: str
    paragraphs: List[Paragraph] = field(default_factory=list)


def detect_encoding(filepath: str) -> str:
    """尝试检测文件编码"""
    encodings = ['utf-8', 'utf-8-sig', 'gbk', 'gb2312', 'gb18030']
    for enc in encodings:
        try:
            with open(filepath, 'r', encoding=enc) as f:
                f.read()
            return enc
        except (UnicodeDecodeError, UnicodeError):
            continue
    return 'utf-8'


def extract_manual_blanks(text: str) -> List[str]:
    """从文本中提取 {{}} 手动标记的挖空词"""
    matches = re.findall(r'\{\{([^}]+)\}\}', text)
    return matches


def _strip_incomplete_markers(text: str) -> str:
    """移除不完整的 {{}} 标记（只有 {{ 或只有 }} 的残留）"""
    # 先找出所有配对的 {{...}}，保护它们
    # 然后移除剩余的 {{ 或 }}
    # 方法：用正则提取所有配对标记，记录位置，然后只保留配对区域内的文本
    
    # 简单方法：先移除所有配对的 {{...}}（暂时替换为占位符），
    # 然后移除剩余的 {{ 和 }}，再恢复占位符
    import re
    
    # 提取所有配对的标记，替换为占位符
    placeholders = []
    def replace_paired(m):
        placeholders.append(m.group(0))
        return f'\x00BLANK{len(placeholders)-1}\x00'
    
    text = re.sub(r'\{\{[^}]+\}\}', replace_paired, text)
    
    # 移除剩余的 {{ 和 }}
    text = text.replace('{{', '').replace('}}', '')
    
    # 恢复占位符
    for i, original in enumerate(placeholders):
        text = text.replace(f'\x00BLANK{i}\x00', original)
    
    return text


def parse_input(filepath: str) -> List[Topic]:
    """
    解析输入文档：
    - 按 %主题名 分割主题（% 后必须紧跟非空白文字）
    - 每个主题下提取段落
    - 检测 {{}} 手动标记，清理不完整标记

    返回 List[Topic]
    """
    encoding = detect_encoding(filepath)
    with open(filepath, 'r', encoding=encoding) as f:
        content = f.read()

    topics: List[Topic] = []
    current_topic: Topic = None
    current_paragraph_lines: List[str] = []

    def flush_paragraph():
        """将累积的行合并为一个段落"""
        nonlocal current_paragraph_lines
        if current_paragraph_lines and current_topic:
            text = '\n'.join(current_paragraph_lines).strip()
            if text:
                # 清理不完整的 {{}} 标记
                text = _strip_incomplete_markers(text)
                manual_blanks = extract_manual_blanks(text)
                para = Paragraph(text=text, manual_blanks=manual_blanks)
                current_topic.paragraphs.append(para)
            current_paragraph_lines = []

    lines = content.split('\n')
    for line in lines:
        stripped = line.strip()

        # 检测主题标记 %主题名（% 后必须紧跟非空白文字，且不是 % 后直接空格/数字等情况）
        if stripped.startswith('%') and len(stripped) > 1 and not stripped[1].isspace():
            # 排除 % 后跟数字的情况（如 "50%折扣" 在行首）
            if not stripped[1].isdigit():
                flush_paragraph()
                topic_name = stripped[1:].strip()
                if topic_name:
                    current_topic = Topic(name=topic_name)
                    topics.append(current_topic)
                continue

        # 空行作为段落分隔
        if not stripped:
            flush_paragraph()
            continue

        current_paragraph_lines.append(stripped)

    flush_paragraph()

    # 检查空主题并警告
    for t in topics:
        if not t.paragraphs:
            print(f"[WARN] 主题 '{t.name}' 没有内容段落，将被忽略")

    # 过滤掉没有段落的空主题
    topics = [t for t in topics if t.paragraphs]

    return topics


def save_memory(topics: List[Topic], memory_dir: str):
    """将解析结果保存到 Memory 文件"""
    os.makedirs(memory_dir, exist_ok=True)
    path = os.path.join(memory_dir, '01_parsed.json')
    data = [asdict(t) for t in topics]
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return path


def load_memory(memory_dir: str) -> List[Topic]:
    """从 Memory 文件加载解析结果"""
    path = os.path.join(memory_dir, '01_parsed.json')
    if not os.path.exists(path):
        raise FileNotFoundError(f"Memory file not found: {path}")
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    topics = []
    for t in data:
        paras = [Paragraph(**p) for p in t['paragraphs']]
        topics.append(Topic(name=t['name'], paragraphs=paras))
    return topics


if __name__ == '__main__':
    import sys
    filepath = sys.argv[1] if len(sys.argv) > 1 else 'test_data/sample_input.txt'
    topics = parse_input(filepath)
    print(f"Parsed {len(topics)} topics:")
    for t in topics:
        print(f"\n  Topic: {t.name} ({len(t.paragraphs)} paragraphs)")
        for i, p in enumerate(t.paragraphs):
            print(f"    Para {i}: {p.clean_text()[:60]}...")
            if p.manual_blanks:
                print(f"      Manual blanks: {p.manual_blanks}")
