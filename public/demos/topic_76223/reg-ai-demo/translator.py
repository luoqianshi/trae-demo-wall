"""
翻译模块：自动语言检测 + 中英日互译（使用国内 LLM，不需要翻墙）
"""
import re
import config


def detect_language(text):
    """简易语言检测：基于字符分布判断。"""
    text = text[:2000]
    zh_chars = len(re.findall(r'[\u4e00-\u9fff]', text))
    ja_kana = len(re.findall(r'[\u3040-\u309f\u30a0-\u30ff]', text))
    en_words = len(re.findall(r'[a-zA-Z]{2,}', text))

    if ja_kana > 10:
        return "ja"
    if zh_chars > en_words * 0.5:
        return "zh"
    elif en_words > 3:
        return "en"
    elif zh_chars > 0:
        return "zh"
    return "en"


def translate_text(text, source_lang, target_lang="zh"):
    if source_lang == target_lang:
        return text
    lang_names = {"zh": "中文", "en": "英文", "ja": "日文"}

    if source_lang == "ja":
        prompt = f"""请将以下日文内容准确翻译为中文。
要求：医药专业术语翻译准确；保留数字、单位、缩写（mg, mL, %）；药品通用名在括号中附上英文。
直接输出翻译结果。

【日文原文】
{text}"""
    elif source_lang == "en":
        prompt = f"""请将以下英文内容准确翻译为中文。
要求：医药专业术语翻译准确（adverse event→不良事件，efficacy→有效性）；保留数字、单位、缩写；
药品名保留英文原名，首次出现可括号标注中文通用名。
直接输出翻译结果。

【英文原文】
{text}"""
    else:
        prompt = f"""请将以下{lang_names.get(source_lang)}内容翻译为{lang_names.get(target_lang)}。保持医药术语准确。

【原文】
{text}"""

    from rag_engine import _call_llm
    return _call_llm(prompt)


def translate_chunk_list(chunks, target_lang="zh"):
    """批量翻译文本块，每 3 个块合并为一次请求。"""
    from rag_engine import _call_llm
    lang_names = {"zh": "中文", "en": "英文", "ja": "日文"}

    sample_text = " ".join(c["text"][:500] for c in chunks if c["text"].strip())
    if not sample_text.strip():
        return chunks

    source_lang = detect_language(sample_text)
    if source_lang == target_lang:
        return chunks

    translated = []
    batch = []
    batch_pages = []

    for chunk in chunks:
        text = chunk["text"].strip()
        if not text:
            translated.append(chunk)
            continue
        batch.append(text)
        batch_pages.append(chunk["page"])

        if len(batch) >= 3:
            combined = "\n\n---[分页标记]---\n\n".join(batch)
            prompt = f"""请将以下{lang_names.get(source_lang)}审评报告摘录翻译为{lang_names.get(target_lang)}。
要求：医药术语准确，保留数字单位缩写，各摘录间用"---[分页标记]---"分隔。

【原文】
{combined}"""
            result = _call_llm(prompt)
            parts = result.split("---[分页标记]---")
            for i, part in enumerate(parts):
                translated.append({"page": batch_pages[i] if i < len(batch_pages) else 0, "text": part.strip()})
            batch, batch_pages = [], []

    if batch:
        combined = "\n\n---[分页标记]---\n\n".join(batch)
        prompt = f"""请将以下{lang_names.get(source_lang)}审评报告摘录翻译为{lang_names.get(target_lang)}。
要求：医药术语准确，保留数字单位缩写，各摘录间用"---[分页标记]---"分隔。

【原文】
{combined}"""
        result = _call_llm(prompt)
        parts = result.split("---[分页标记]---")
        for i, part in enumerate(parts):
            translated.append({"page": batch_pages[i] if i < len(batch_pages) else 0, "text": part.strip()})

    return translated
