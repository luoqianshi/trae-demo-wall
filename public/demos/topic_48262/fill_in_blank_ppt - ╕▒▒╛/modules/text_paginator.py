"""文本分页模块 - 基于 EMU 精确计算 PowerPoint 文本渲染宽度

不再依赖 PIL 字体测量（不同字体渲染宽度不同），
而是直接用 PowerPoint 的单位体系计算：
  - 1 inch = 914400 EMU = 72 pt = 96 px (96dpi)
  - 32pt 全角中文字符宽度 ≈ 32pt（字号即宽度）
  - 文本框可用宽度 = EMU 宽度 - 左右边距 EMU
"""
import os
import json
import re
import math
from typing import List, Tuple

from .input_parser import Topic, Paragraph


# PowerPoint 单位换算常量
EMU_PER_INCH = 914400
EMU_PER_PT = 12700       # 914400 / 72
PT_PER_INCH = 72
PX_PER_INCH_96DPI = 96


class TextMeasurer:
    """基于 PowerPoint 单位体系的文本度量器

    核心原理：
    - 全角字符（中文、全角标点）宽度 ≈ 字号 pt
    - 半角字符（ASCII、半角标点）宽度 ≈ 字号 pt * 0.5
    - 行高 = 字高 * 行距百分比，字高 ≈ 字号 pt
    """

    def __init__(self, config: dict):
        self.config = config
        self.font_size_pt = config.get("font_size_pt", 32)
        self.line_spacing_pct = config.get("line_spacing_pct", 130) / 100.0
        self.space_after_pt = config.get("space_after_pt", 1)

        # 文本框尺寸（从 config 的 inch 值转为 EMU）
        tb = config["content_textbox"]
        self.box_w_emu = int(tb["width"] * EMU_PER_INCH)
        self.box_h_emu = int(tb["height"] * EMU_PER_INCH)
        self.margin_l_emu = int(tb["margin_left"] * EMU_PER_INCH)
        self.margin_r_emu = int(tb["margin_right"] * EMU_PER_INCH)
        self.margin_t_emu = int(tb["margin_top"] * EMU_PER_INCH)
        self.margin_b_emu = int(tb["margin_bottom"] * EMU_PER_INCH)

        # 可用区域
        self.usable_w_emu = self.box_w_emu - self.margin_l_emu - self.margin_r_emu
        self.usable_h_emu = self.box_h_emu - self.margin_t_emu - self.margin_b_emu

        # 字符宽度（EMU）
        # 全角字符宽度 = 字号 pt * EMU_PER_PT
        # 应用 1.05 安全系数（PPT 渲染有时略宽于理论值）
        self.full_char_w_emu = int(self.font_size_pt * EMU_PER_PT * 1.05)
        self.half_char_w_emu = int(self.font_size_pt * EMU_PER_PT * 0.55)

        # 行高（EMU）
        # PowerPoint 实际行高 = 字高 * 行距百分比 + 额外 leading
        # 额外 leading 约为字号的 15-20%（PowerPoint 客户端渲染特性）
        # 安全系数 1.15 补偿客户端与理论计算的差异
        char_h_emu = int(self.font_size_pt * EMU_PER_PT)
        leading_emu = int(char_h_emu * 0.15)  # 额外 leading
        self.line_h_emu = int((char_h_emu + leading_emu) * self.line_spacing_pct * 1.05)
        # 段后间距
        self.space_after_emu = int(self.space_after_pt * EMU_PER_PT)

        # 每行字符数和每页行数
        # 全角字符数 = 可用宽度 / 全角字符宽度
        self.chars_per_line = max(1, int(self.usable_w_emu / self.full_char_w_emu))
        # 每页行数 = 可用高度 / (行高 + 段后)
        # 注意：最后一行不需要段后间距，保守起见不减
        # 额外减 1 行作为安全余量，防止 PPT 渲染时溢出
        raw_lines = int(self.usable_h_emu / (self.line_h_emu + self.space_after_emu))
        self.lines_per_page = max(1, raw_lines - 1)  # 减 1 行安全余量

        # 每页字符数（按全角字符计算）
        self.chars_per_page = self.chars_per_line * self.lines_per_page

    def _char_width_emu(self, char: str) -> int:
        """获取单个字符的渲染宽度（EMU）

        全角字符（中日韩、全角标点）≈ 字号宽度
        半角字符（ASCII）≈ 字号宽度 * 0.5
        """
        # 判断全角/半角
        # 全角范围：CJK 统一汉字、全角标点等
        code = ord(char)
        if (0x4E00 <= code <= 0x9FFF or      # CJK 统一汉字
            0x3000 <= code <= 0x303F or       # CJK 标点
            0xFF00 <= code <= 0xFFEF or       # 全角形式
            0x3400 <= code <= 0x4DBF):        # CJK 扩展A
            return self.full_char_w_emu
        else:
            return self.half_char_w_emu

    def measure_text_width_emu(self, text: str) -> int:
        """度量文本宽度（EMU）"""
        total = 0
        for ch in text:
            total += self._char_width_emu(ch)
        return total

    def count_lines(self, text: str) -> int:
        """计算文本在给定宽度下占多少行"""
        if not text:
            return 1  # 空段落仍占据一行高度

        total_lines = 0
        for segment in text.split('\n'):
            if not segment:
                total_lines += 1
                continue

            line_width = 0
            lines_in_segment = 1
            for char in segment:
                char_w = self._char_width_emu(char)
                if line_width + char_w > self.usable_w_emu and line_width > 0:
                    lines_in_segment += 1
                    line_width = char_w
                else:
                    line_width += char_w
            total_lines += lines_in_segment

        return total_lines

    def estimate_page_capacity(self) -> int:
        """估算每页可容纳的字符数"""
        return self.chars_per_page


def paginate_paragraphs(
    paragraphs: List[Paragraph],
    measurer: TextMeasurer,
    max_chars: int = None,
) -> List[List[Paragraph]]:
    """将段落列表分页：按容量切分，优先在段落边界断开"""
    if max_chars is None:
        max_chars = measurer.estimate_page_capacity()

    pages: List[List[Paragraph]] = []
    current_page: List[Paragraph] = []
    current_lines = 0
    max_lines = measurer.lines_per_page

    for para in paragraphs:
        clean_text = para.clean_text()
        para_lines = measurer.count_lines(clean_text)

        # 如果段落本身超过一页容量，需要硬切
        if para_lines > max_lines:
            # 先把当前页收尾
            if current_page:
                pages.append(current_page)
                current_page = []
                current_lines = 0

            # 在句子边界切分超长段落
            sub_paras = split_long_paragraph(para, max_chars, measurer)
            for sub_para in sub_paras:
                sub_lines = measurer.count_lines(sub_para.clean_text())
                if current_lines + sub_lines > max_lines and current_page:
                    pages.append(current_page)
                    current_page = []
                    current_lines = 0
                current_page.append(sub_para)
                current_lines += sub_lines
        else:
            if current_lines + para_lines > max_lines and current_page:
                pages.append(current_page)
                current_page = [para]
                current_lines = para_lines
            else:
                current_page.append(para)
                current_lines += para_lines

    if current_page:
        pages.append(current_page)

    return pages


def split_long_paragraph(para: Paragraph, max_chars: int, measurer: TextMeasurer = None) -> List[Paragraph]:
    """在句子边界切分超长段落（保留 {{}} 标记）

    多级分隔符切分策略：
    1. 优先在 。；！？ 处切分（句号级）
    2. 若片段仍超长，在 、，处切分（逗号级）
    3. 若仍超长，硬切（避免在 {{}} 标记中间切割）
    """
    text = para.text  # 使用含 {{}} 标记的原始文本

    # 第一级：按句末标点切分（。；！？;）
    sentences = _split_by_delimiters(text, r'[。；！？;]')

    # 计算 clean 文本（保留标记内容，去掉 {{}}）
    def to_clean(s):
        return re.sub(r'\{\{([^}]+)\}\}', r'\1', s)

    def clean_len(s):
        return len(to_clean(s))

    max_lines = measurer.lines_per_page if measurer else None

    result: List[Paragraph] = []
    current_text = ""
    current_lines = 0

    for sent in sentences:
        sent_clean = clean_len(sent)
        if measurer:
            sent_lines = measurer.count_lines(to_clean(sent))
        else:
            sent_lines = max(1, sent_clean // max_chars + (1 if sent_clean % max_chars else 0))

        # 如果当前片段 + 已有内容超过容量，先收尾当前页
        if current_lines + sent_lines > (max_lines or 999) and current_text:
            result.append(_make_sub_paragraph(current_text, para))
            current_text = ""
            current_lines = 0

        # 如果单个片段仍超长，尝试用第二级分隔符切分
        sent_lines = measurer.count_lines(to_clean(sent)) if measurer else max(1, clean_len(sent) // max_chars + (1 if clean_len(sent) % max_chars else 0))
        if (max_lines and sent_lines > max_lines) or (not max_lines and clean_len(sent) > max_chars):
            # 第二级：按逗号、顿号切分
            sub_parts = _split_by_delimiters(sent, r'[、，,]')
            for sub in sub_parts:
                sub_lines = measurer.count_lines(to_clean(sub)) if measurer else max(1, clean_len(sub) // max_chars + (1 if clean_len(sub) % max_chars else 0))
                if current_lines + sub_lines > (max_lines or 999) and current_text:
                    result.append(_make_sub_paragraph(current_text, para))
                    current_text = ""
                    current_lines = 0

                # 如果子片段仍超长，硬切
                sub_lines = measurer.count_lines(to_clean(sub)) if measurer else max(1, clean_len(sub) // max_chars + (1 if clean_len(sub) % max_chars else 0))
                while (max_lines and sub_lines > max_lines) or (not max_lines and clean_len(sub) > max_chars):
                    effective_max = max_chars
                    cut = _safe_cut_position(sub, effective_max)
                    if cut == 0:
                        cut = len(sub)  # 防止死循环
                    result.append(_make_sub_paragraph(sub[:cut], para))
                    sub = sub[cut:]
                    if not sub:
                        break
                    sub_lines = measurer.count_lines(to_clean(sub)) if measurer else max(1, clean_len(sub) // max_chars + (1 if clean_len(sub) % max_chars else 0))

                if sub:
                    current_text += sub
                    current_lines = measurer.count_lines(to_clean(current_text)) if measurer else max(1, clean_len(current_text) // max_chars + (1 if clean_len(current_text) % max_chars else 0))
        else:
            if sent:
                current_text += sent
                current_lines = measurer.count_lines(to_clean(current_text)) if measurer else max(1, clean_len(current_text) // max_chars + (1 if clean_len(current_text) % max_chars else 0))

    if current_text:
        result.append(_make_sub_paragraph(current_text, para))

    return result if result else [para]


def _split_by_delimiters(text: str, delimiter_pattern: str) -> list:
    """按分隔符切分文本，保留分隔符在前一个片段末尾"""
    sentences = re.split(f'({delimiter_pattern})', text)
    combined = []
    i = 0
    while i < len(sentences):
        s = sentences[i]
        if i + 1 < len(sentences):
            s += sentences[i + 1]
            i += 2
        else:
            i += 1
        if s:
            combined.append(s)
    return combined


def _safe_cut_position(text: str, max_clean_len: int) -> int:
    """在标记文本中找到安全的切割位置，避免在 {{}} 标记中间切割"""
    clean_count = 0
    i = 0
    while i < len(text):
        if text[i:i+2] == '{{':
            close = text.find('}}', i)
            if close >= 0:
                clean_count += close - i - 2
                if clean_count > max_clean_len:
                    return i
                i = close + 2
                continue
        clean_count += 1
        if clean_count > max_clean_len:
            return i
        i += 1
    return len(text)


def _make_sub_paragraph(text: str, original: Paragraph) -> Paragraph:
    """创建子段落，保留 {{}} 标记，从子文本中提取挖空词

    只从子文本中用正则提取 {{}} 标记作为 manual_blanks 和 blanks。
    不从 original.blanks 中筛选——因为 AI 挖空词在分页后可能出现在
    非挖空位置（如"印度洋和太平洋"既是挖空词也是普通文字），
    盲目筛选会导致非挖空文字被误标为挖空词。
    """
    # 从子文本中提取 {{}} 标记
    sub_manual = re.findall(r'\{\{([^}]+)\}\}', text)
    sub_blanks = list(sub_manual)
    return Paragraph(text=text, manual_blanks=sub_manual, blanks=sub_blanks)


def paginate_topics(topics: List[Topic], config: dict) -> List[Tuple[str, List[Paragraph]]]:
    """对所有主题进行分页"""
    measurer = TextMeasurer(config)
    max_chars = config.get("chars_per_page", measurer.estimate_page_capacity())

    all_pages: List[Tuple[str, List[Paragraph]]] = []

    for topic in topics:
        pages = paginate_paragraphs(topic.paragraphs, measurer, max_chars)
        for page in pages:
            all_pages.append((topic.name, page))

    return all_pages


def save_memory(pages: List[Tuple[str, List[Paragraph]]], memory_dir: str):
    """保存分页结果到 Memory"""
    os.makedirs(memory_dir, exist_ok=True)
    path = os.path.join(memory_dir, '03_pages.json')
    data = []
    for topic_name, paras in pages:
        data.append({
            "topic": topic_name,
            "paragraphs": [
                {"text": p.text, "manual_blanks": p.manual_blanks, "blanks": p.blanks}
                for p in paras
            ]
        })
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return path


if __name__ == '__main__':
    import sys
    sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    from config import CONFIG
    from input_parser import parse_input

    topics = parse_input(CONFIG["input_doc"])
    pages = paginate_topics(topics, CONFIG)

    measurer = TextMeasurer(CONFIG)
    print(f"Font size: {measurer.font_size_pt}pt")
    print(f"Full char width: {measurer.full_char_w_emu} EMU ({measurer.full_char_w_emu / EMU_PER_PT:.1f}pt)")
    print(f"Usable width: {measurer.usable_w_emu} EMU ({measurer.usable_w_emu / EMU_PER_INCH:.2f} inch)")
    print(f"Usable height: {measurer.usable_h_emu} EMU ({measurer.usable_h_emu / EMU_PER_INCH:.2f} inch)")
    print(f"Line height: {measurer.line_h_emu} EMU ({measurer.line_h_emu / EMU_PER_PT:.1f}pt)")
    print(f"Chars per line: {measurer.chars_per_line}")
    print(f"Lines per page: {measurer.lines_per_page}")
    print(f"Chars per page: {measurer.chars_per_page}")
    print(f"\nTotal pages: {len(pages)}")
    for i, (topic, paras) in enumerate(pages):
        total_chars = sum(len(p.clean_text()) for p in paras)
        total_lines = sum(measurer.count_lines(p.clean_text()) for p in paras)
        print(f"  Page {i+1}: topic='{topic}', {len(paras)} paras, {total_chars} chars, {total_lines} lines")
