"""解析学习通考试详情 MHTML/HTML，提取题库数据"""
import json
import re
import sys
import email
import hashlib
import quopri
from pathlib import Path
from bs4 import BeautifulSoup


def read_mhtml(path: str) -> str:
    """从 MHTML 文件中提取 HTML 内容，解码 quoted-printable"""
    raw = Path(path).read_bytes()
    msg = email.message_from_bytes(raw)
    for part in msg.walk():
        ct = part.get_content_type()
        if ct == "text/html":
            payload = part.get_payload(decode=True)
            charset = part.get_content_charset() or "utf-8"
            return payload.decode(charset, errors="replace")
    # fallback: 尝试直接读文本
    return raw.decode("utf-8", errors="replace")


def extract_html(path: str) -> str:
    """根据文件后缀选择读取方式"""
    p = Path(path)
    if p.suffix.lower() in (".mhtml", ".mht"):
        return read_mhtml(path)
    return p.read_text(encoding="utf-8")


def parse_html(html_content: str) -> list[dict]:
    """从 HTML 内容解析出所有题目"""
    soup = BeautifulSoup(html_content, "html.parser")
    questions = []
    current_type = ""

    for elem in soup.select("h2.type_tit, .questionLi"):
        if elem.name == "h2" and "type_tit" in elem.get("class", []):
            text = elem.get_text(strip=True)
            if "单选" in text:
                current_type = "单选题"
            elif "多选" in text:
                current_type = "多选题"
            elif "判断" in text:
                current_type = "判断题"
            elif "填空" in text:
                current_type = "填空题"
            elif "简答" in text or "问答" in text or "论述" in text:
                current_type = "主观题"
            else:
                current_type = text.split(".")[-1].split("（")[0].strip()
            continue

        if "questionLi" in elem.get("class", []):
            q = parse_question(elem, current_type)
            if q:
                questions.append(q)

    return questions


def parse_question(elem, q_type: str) -> dict | None:
    """解析单道题目"""
    num_el = elem.select_one(".mark_name")
    if not num_el:
        return None

    qt_el = elem.select_one(".qtContent")
    if not qt_el:
        return None

    question_html = str(qt_el)
    question_html = re.sub(r'^<span[^>]*class="qtContent"[^>]*>', "", question_html)
    question_html = re.sub(r"</span>$", "", question_html)
    question_text = qt_el.get_text(strip=True)

    # 处理 MHTML 中的图片：cid: 引用转为空（已内嵌），保留网络图片
    for img in qt_el.find_all("img"):
        src = img.get("src", "")
        if src.startswith("cid:"):
            # MHTML 内嵌图片，保留 src 让浏览器解析
            pass

    # 选项
    options = []
    option_els = elem.select(".qtDetail li")
    for li in option_els:
        letter_match = re.match(r"^\s*([A-Z])\.\s*", li.get_text())
        letter = letter_match.group(1) if letter_match else ""
        opt_inner = str(li)
        opt_inner = re.sub(r"^<li[^>]*>", "", opt_inner)
        opt_inner = re.sub(r"</li>$", "", opt_inner)
        opt_text = li.get_text(strip=True)
        opt_text_clean = re.sub(r"^[A-Z]\.\s*", "", opt_text)
        options.append({
            "letter": letter,
            "text": opt_text_clean,
            "html": opt_inner.strip()
        })

    # 正确答案
    answer_el = elem.select_one(".rightAnswerContent")
    answer = answer_el.get_text(strip=True) if answer_el else ""

    # 是否含图片
    has_image = bool(qt_el.find("img"))
    images = []
    if has_image:
        for img in qt_el.find_all("img"):
            src = img.get("src", "")
            if src:
                images.append(src)

    # 难易度
    diff_el = elem.select_one(".analysis")
    difficulty = ""
    if diff_el:
        diff_text = diff_el.get_text()
        if "难" in diff_text:
            difficulty = "难"
        elif "中" in diff_text:
            difficulty = "中"
        elif "易" in diff_text:
            difficulty = "易"

    return {
        "type": q_type,
        "question": question_text,
        "question_html": question_html.strip(),
        "options": options,
        "answer": answer,
        "has_image": has_image,
        "images": images,
        "difficulty": difficulty,
        "knowledge_point": "",
        "chapter": "",
    }


def main():
    if len(sys.argv) < 2:
        print("用法: python parse_questions.py <mhtml/html文件或目录> [输出文件]")
        print("示例: python parse_questions.py ./exam.mhtml questions.json")
        print("      python parse_questions.py ./mhtml_dir/ questions.json")
        sys.exit(1)

    input_path = Path(sys.argv[1])
    out_path = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).parent / "questions.json"

    if input_path.is_dir():
        files = sorted([p for p in input_path.iterdir() if p.suffix.lower() in (".mhtml", ".mht", ".html", ".htm")])
        if not files:
            print(f"目录 {input_path} 中没有找到 MHTML/HTML 文件")
            sys.exit(1)
    elif input_path.is_file():
        files = [input_path]
    else:
        print(f"文件/目录不存在: {input_path}")
        sys.exit(1)

    all_questions = []
    seen = set()

    for path in files:
        chapter = path.stem
        html_content = extract_html(str(path))
        qs = parse_html(html_content)
        for q in qs:
            q["chapter"] = chapter
            key = hashlib.md5(q["question"].encode("utf-8")).hexdigest()
            if key not in seen:
                seen.add(key)
                all_questions.append(q)
            else:
                print(f"  [WARNING] 跳过重复题目: {q['question'][:50]}...")
        print(f"[OK] {path.name}: 解析出 {len(qs)} 题")

    for i, q in enumerate(all_questions):
        q["id"] = i + 1

    types = {}
    chapters = {}
    for q in all_questions:
        t = q["type"]
        types[t] = types.get(t, 0) + 1
        ch = q.get("chapter", "")
        if ch:
            chapters[ch] = chapters.get(ch, 0) + 1
    img_count = sum(1 for q in all_questions if q["has_image"])

    print(f"\n=== 解析完成 ===")
    print(f"总题数: {len(all_questions)}")
    print(f"含图片题: {img_count}")
    if chapters:
        print(f"\n按章节:")
        for ch, c in chapters.items():
            print(f"  {ch}: {c} 题")
    print(f"\n按题型:")
    for t, c in types.items():
        print(f"  {t}: {c}")

    out_path.write_text(json.dumps(all_questions, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\n已保存到: {out_path}")


if __name__ == "__main__":
    main()
