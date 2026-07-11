"""AI挖空模块 - 对无手动标记的段落调用LLM提取核心关键词"""
import os
import json
from typing import List

from .input_parser import Topic, Paragraph


def extract_blanks_with_ai(text: str, config: dict) -> List[str]:
    """调用AI提取文本中的核心关键词作为挖空词"""
    api_key = config.get("ai_api_key", "")
    if not api_key:
        print("[WARN] No AI API key configured, skipping AI extraction")
        return []

    provider = config.get("ai_provider", "openai")
    model = config.get("ai_model", "gpt-4o-mini")
    max_blanks = config.get("max_blanks_per_paragraph", 3)

    if provider == "openai":
        return _extract_with_openai(text, api_key, model, max_blanks)
    else:
        print(f"[WARN] Unsupported AI provider: {provider}")
        return []


def _extract_with_openai(text: str, api_key: str, model: str, max_blanks: int) -> List[str]:
    """使用 OpenAI API 提取关键词"""
    try:
        from openai import OpenAI
    except ImportError:
        print("[WARN] openai package not installed, skipping AI extraction")
        return []

    try:
        client = OpenAI(api_key=api_key)

        prompt = f"""请从以下文本中提取 {max_blanks} 个最核心的关键词，用于制作填空题。

要求：
1. 优先选择专有名词、核心概念、关键数据
2. 每个关键词2-12个字
3. 关键词必须是文本中出现的完整词语
4. 只返回关键词列表，用JSON数组格式

文本：
{text}

请返回JSON格式，例如：["关键词1", "关键词2", "关键词3"]"""

        response = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "你是一个专业的教学内容设计助手，擅长提取关键知识点用于填空题制作。"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=200,
        )

        result = response.choices[0].message.content.strip()

        # 解析JSON
        # 移除可能的 markdown 代码块标记
        result = result.replace('```json', '').replace('```', '').strip()

        blanks = json.loads(result)

        # 验证：关键词必须在文本中出现
        valid_blanks = []
        for blank in blanks:
            if isinstance(blank, str) and blank in text:
                valid_blanks.append(blank)

        return valid_blanks[:max_blanks]

    except json.JSONDecodeError as e:
        print(f"[WARN] AI response not valid JSON: {e}")
        return []
    except Exception as e:
        print(f"[WARN] AI extraction failed: {e}")
        return []


def process_topics(topics: List[Topic], config: dict) -> List[Topic]:
    """
    处理所有主题的挖空词

    混合模式逻辑：
    - manual模式：只用手动标记
    - ai模式：只用AI提取
    - mixed模式：优先手动标记，无标记时用AI补充
    """
    ai_mode = config.get("ai_mode", "mixed")

    for topic in topics:
        for para in topic.paragraphs:
            blanks = []

            if ai_mode in ("manual", "mixed"):
                blanks.extend(para.manual_blanks)

            if ai_mode in ("ai", "mixed"):
                clean_text = para.clean_text()
                # mixed模式下，如果已有手动标记，不额外AI提取
                if ai_mode == "mixed" and para.manual_blanks:
                    pass
                elif ai_mode == "ai" or (ai_mode == "mixed" and not para.manual_blanks):
                    ai_blanks = extract_blanks_with_ai(clean_text, config)
                    blanks.extend(ai_blanks)

            # 去重，保持顺序
            seen = set()
            unique_blanks = []
            for b in blanks:
                if b not in seen:
                    seen.add(b)
                    unique_blanks.append(b)

            para.blanks = unique_blanks

    return topics


def save_memory(topics: List[Topic], memory_dir: str):
    """保存挖空结果到 Memory"""
    os.makedirs(memory_dir, exist_ok=True)
    path = os.path.join(memory_dir, '02_blanks.json')
    data = []
    for t in topics:
        data.append({
            "name": t.name,
            "paragraphs": [
                {
                    "text": p.text,
                    "manual_blanks": p.manual_blanks,
                    "blanks": p.blanks,
                }
                for p in t.paragraphs
            ]
        })
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    return path


def load_memory(memory_dir: str) -> List[Topic]:
    """从 Memory 加载挖空结果"""
    path = os.path.join(memory_dir, '02_blanks.json')
    if not os.path.exists(path):
        raise FileNotFoundError(f"Memory file not found: {path}")
    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    topics = []
    for t in data:
        paras = [Paragraph(**p) for p in t['paragraphs']]
        topics.append(Topic(name=t['name'], paragraphs=paras))
    return topics
