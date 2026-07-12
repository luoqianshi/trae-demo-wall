import os
import re
import random
from docx import Document
from docx.shared import RGBColor


def is_red_color(rgb):
    if rgb is None:
        return False
    r, g, b = rgb
    return r > 150 and g < 100 and b < 100


def is_blue_color(rgb):
    if rgb is None:
        return False
    r, g, b = rgb
    return r < 100 and g < 150 and b > 150


def parse_docx(file_path):
    document = Document(file_path)
    blanks = []
    current_group = 0

    for paragraph in document.paragraphs:
        text_parts = []
        for run in paragraph.runs:
            text = run.text
            font_color = run.font.color.rgb
            is_red = font_color and is_red_color(font_color)
            is_blue = font_color and is_blue_color(font_color)
            text_parts.append((text, is_red, is_blue))

        for part in text_parts:
            text, is_red, is_blue = part
            if is_blue:
                match = re.search(r'(\d+)', text)
                if match:
                    current_group = int(match.group(1))
                break

        i = 0
        while i < len(text_parts):
            text, is_red, is_blue = text_parts[i]
            if is_red:
                before = ""
                j = i - 1
                while j >= 0 and not text_parts[j][1] and not text_parts[j][2]:
                    before = text_parts[j][0] + before
                    j -= 1

                answer = text
                k = i + 1
                while k < len(text_parts) and text_parts[k][1]:
                    answer += text_parts[k][0]
                    k += 1

                after = ""
                l = k
                while l < len(text_parts) and not text_parts[l][1] and not text_parts[l][2]:
                    after += text_parts[l][0]
                    l += 1

                answer = answer.strip()
                if answer:
                    blanks.append({
                        "before": before.strip(),
                        "answer": answer,
                        "after": after.strip(),
                        "group": current_group
                    })
                i = k
            else:
                i += 1

    return blanks


def parse_txt(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    lines = content.split('\n')
    blanks = []
    current_group = 0

    for line in lines:
        line = line.strip()
        if not line:
            continue

        group_match = re.search(r'\{(\d+)\}', line)
        if group_match:
            current_group = int(group_match.group(1))
            line = re.sub(r'\{\d+\}', '', line).strip()

        pattern = r"【([^】]+)】"
        matches = list(re.finditer(pattern, line))

        if not matches:
            continue

        for match in matches:
            answer = match.group(1).strip()
            if not answer:
                continue

            start = match.start()
            end = match.end()

            before = line[:start].strip()
            after = line[end:].strip()

            blanks.append({
                "before": before,
                "answer": answer,
                "after": after,
                "group": current_group
            })

    return blanks


def parse_document(file_path):
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".docx":
        return parse_docx(file_path)
    elif ext == ".txt":
        return parse_txt(file_path)
    return []


def select_random_blanks(blanks, count=None):
    if not blanks:
        return []

    selected = []
    selected_groups = set()

    all_blanks = blanks.copy()
    random.shuffle(all_blanks)

    for blank in all_blanks:
        g = blank.get("group", 0)
        if g == 0 or g not in selected_groups:
            selected.append(blank)
            if g != 0:
                selected_groups.add(g)
        if count is not None and len(selected) >= count:
            break

    for i, blank in enumerate(selected):
        blank["id"] = i + 1

    return selected