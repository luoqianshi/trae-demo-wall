"""
Reg AI 引擎：超轻量版
不使用 ChromaDB / Embedding / 向量搜索
改用 SQLite 全文检索 + LLM，内存占用极低
全部使用国内 API，不需要翻墙
"""
import os
import sqlite3
import json
from openai import OpenAI
import config

_db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "regai.db")


# ═══════════════════════════════════════════
#  SQLite 数据库（超轻量，代替 ChromaDB）
# ═══════════════════════════════════════════

def _get_db():
    os.makedirs(os.path.dirname(_db_path), exist_ok=True)
    conn = sqlite3.connect(_db_path)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT,
            agency TEXT,
            drug_name TEXT,
            page INTEGER,
            original_lang TEXT,
            translated INTEGER DEFAULT 0,
            text TEXT
        )
    """)
    conn.execute("CREATE INDEX IF NOT EXISTS idx_source ON chunks(source)")
    conn.execute("CREATE INDEX IF NOT EXISTS idx_agency ON chunks(agency)")
    conn.commit()
    return conn


def add_chunks(chunks_data):
    """批量添加文本块到数据库
    chunks_data: list of dict, each with keys: source, agency, drug_name, page, original_lang, translated, text
    """
    conn = _get_db()
    for chunk in chunks_data:
        conn.execute(
            "INSERT INTO chunks (source, agency, drug_name, page, original_lang, translated, text) VALUES (?, ?, ?, ?, ?, ?, ?)",
            (chunk["source"], chunk["agency"], chunk["drug_name"], chunk["page"],
             chunk["original_lang"], 1 if chunk["translated"] else 0, chunk["text"])
        )
    conn.commit()
    conn.close()


def delete_chunks(filename):
    conn = _get_db()
    conn.execute("DELETE FROM chunks WHERE source = ?", (filename,))
    conn.commit()
    conn.close()


def search_chunks(query, sources=None, limit=5):
    """关键词搜索：在 SQLite 中搜索包含查询关键词的文本块"""
    conn = _get_db()
    # 将查询拆分为关键词
    keywords = [kw.strip() for kw in query.replace("？", "").replace("?", "").split() if len(kw.strip()) >= 2]
    if not keywords:
        conn.close()
        return []

    # 构建 SQL: 每个关键词都要出现在文本中
    conditions = []
    params = []
    for kw in keywords:
        conditions.append("text LIKE ?")
        params.append(f"%{kw}%")

    where_clause = " AND ".join(conditions)

    if sources:
        placeholders = ",".join(["?"] * len(sources))
        where_clause += f" AND source IN ({placeholders})"
        params.extend(sources)

    sql = f"SELECT id, source, agency, drug_name, page, original_lang, translated, text FROM chunks WHERE {where_clause} LIMIT ?"
    params.append(limit)

    rows = conn.execute(sql, params).fetchall()
    conn.close()

    from langchain_core.documents import Document
    documents = []
    for row in rows:
        documents.append(Document(
            page_content=row[7],
            metadata={
                "source": row[1], "agency": row[2], "drug_name": row[3],
                "page": row[4], "original_lang": row[5], "translated": row[6],
            }
        ))
    return documents


def get_all_metadata():
    conn = _get_db()
    rows = conn.execute("""
        SELECT source, agency, drug_name, original_lang, translated, COUNT(*) as chunk_count
        FROM chunks GROUP BY source
    """).fetchall()
    conn.close()

    docs_info = []
    for row in rows:
        docs_info.append({
            "filename": row[0], "agency": row[1], "drug_name": row[2],
            "original_lang": row[3], "translated": bool(row[4]),
            "total_chunks": row[5],
        })
    return docs_info


def get_uploaded_sources():
    docs = get_all_metadata()
    return list(d["filename"] for d in docs)


# ═══════════════════════════════════════════
#  分块处理（含可选翻译）
# ═══════════════════════════════════════════

def chunk_and_embed(pages_text, agency, drug_name, filename, auto_translate=False, target_lang="zh"):
    from langchain.text_splitter import RecursiveCharacterTextSplitter
    from translator import detect_language, translate_chunk_list

    sample = " ".join(p["text"][:500] for p in pages_text if p["text"].strip())
    original_lang = detect_language(sample)

    translated = False
    working_pages = pages_text
    if auto_translate and original_lang != target_lang:
        working_pages = translate_chunk_list(pages_text, target_lang)
        translated = True

    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=config.CHUNK_SIZE, chunk_overlap=config.CHUNK_OVERLAP,
        separators=["\n\n", "\n", "。", ".", ";", " ", ""],
    )

    chunks_data = []
    for page in working_pages:
        text = page["text"].strip()
        if not text or len(text) < 20:
            continue
        chunks = text_splitter.create_documents([text])
        for chunk in chunks:
            chunks_data.append({
                "source": filename, "agency": agency, "drug_name": drug_name,
                "page": page["page"], "original_lang": original_lang,
                "translated": translated, "text": chunk.page_content,
            })

    if not chunks_data:
        return {"chunk_count": 0, "translated": False, "original_lang": original_lang}

    delete_chunks(filename)
    add_chunks(chunks_data)
    return {"chunk_count": len(chunks_data), "translated": translated, "original_lang": original_lang}


# ═══════════════════════════════════════════
#  LLM 调用（全部国内服务，OpenAI 兼容格式）
# ═══════════════════════════════════════════

def _get_llm_client():
    provider = config.LLM_PROVIDER
    if provider == "bailian":
        if not config.BAILIAN_API_KEY:
            raise ValueError("请设置 BAILIAN_API_KEY")
        return OpenAI(api_key=config.BAILIAN_API_KEY, base_url=config.BAILIAN_BASE_URL)
    elif provider == "volcengine":
        if not config.VOLCENGINE_API_KEY:
            raise ValueError("请设置 VOLCENGINE_API_KEY")
        return OpenAI(api_key=config.VOLCENGINE_API_KEY, base_url=config.VOLCENGINE_BASE_URL)
    elif provider == "ollama":
        return OpenAI(api_key="ollama", base_url=config.OLLAMA_BASE_URL)
    elif provider == "deepseek":
        if not config.DEEPSEEK_API_KEY:
            raise ValueError("请设置 DEEPSEEK_API_KEY")
        return OpenAI(api_key=config.DEEPSEEK_API_KEY, base_url=config.DEEPSEEK_BASE_URL)
    else:
        if not config.OPENAI_API_KEY:
            raise ValueError("请设置 OPENAI_API_KEY")
        return OpenAI(api_key=config.OPENAI_API_KEY)


def _get_llm_model():
    provider = config.LLM_PROVIDER
    models = {
        "bailian": config.BAILIAN_MODEL, "volcengine": config.VOLCENGINE_MODEL,
        "ollama": config.OLLAMA_MODEL, "deepseek": config.DEEPSEEK_MODEL,
        "openai": config.OPENAI_MODEL,
    }
    return models.get(provider, "unknown")


def _call_llm(prompt):
    client = _get_llm_client()
    model = _get_llm_model()
    response = client.chat.completions.create(
        model=model, messages=[{"role": "user", "content": prompt}],
        temperature=0.3, max_tokens=4096,
    )
    return response.choices[0].message.content


# ═══════════════════════════════════════════
#  搜索
# ═══════════════════════════════════════════

def search(query, sources=None, agency=None, drug_name=None):
    return search_chunks(query, sources=sources, limit=config.TOP_K)


# ═══════════════════════════════════════════
#  答案生成
# ═══════════════════════════════════════════

ANSWER_PROMPT = """你是一位专业的药品审评报告分析助手。
请仅基于以下审评报告摘录回答问题。不要编造任何不在摘录中的信息。
每条关键信息必须标注来源页码。

【审评报告摘录】
{context}

【用户问题】
{query}

【回答格式要求】
1. 先给出直接答案
2. 每条关键结论后用 [来源: 文件名, 第X页] 标注
3. 如果摘录中无相关信息，明确说明"提供的审评报告中未找到相关信息"
4. 使用中文回答"""


def generate_answer(query, retrieved_docs):
    if not retrieved_docs:
        return {"answer": "未检索到相关内容。请尝试更换关键词或上传更多审评报告。", "sources": []}

    context_parts = []
    sources_list = []
    for doc in retrieved_docs:
        source_name = doc.metadata.get("source", "未知文件")
        page = doc.metadata.get("page", "?")
        context_parts.append(f"[来源: {source_name}, 第{page}页]\n{doc.page_content}")
        sources_list.append({
            "filename": source_name, "page": page,
            "agency": doc.metadata.get("agency", ""),
            "snippet": doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
        })

    context = "\n\n---\n\n".join(context_parts)
    prompt = ANSWER_PROMPT.format(context=context, query=query)
    answer = _call_llm(prompt)
    return {"answer": answer, "sources": sources_list}


# ═══════════════════════════════════════════
#  跨报告对比
# ═══════════════════════════════════════════

COMPARE_PROMPT = """你是一位药品审评报告对比分析专家。
以下是来自不同审评报告对同一问题的分别回答：

{answers_table}

请完成以下对比分析：
1. 【核心结论对比】用表格呈现各报告的核心结论差异
2. 【关键数据差异】列出数据层面的差异（有效率、不良反应发生率等）
3. 【监管考量差异】总结各机构/报告的监管考量差异
4. 【综合评价】给出整体评估

使用中文回答，条理清晰。"""


def compare_reports(query, report_sources):
    individual_results = []
    answers_parts = []

    for filename in report_sources:
        docs = search(query, sources=[filename])
        result = generate_answer(query, docs)
        individual_results.append({"filename": filename, "answer": result["answer"], "sources": result["sources"]})
        agency = result["sources"][0]["agency"] if result["sources"] else "未知"
        answers_parts.append(f"【报告: {filename} ({agency})】\n{result['answer']}")

    summary = ""
    if len(individual_results) > 1:
        answers_table = "\n\n".join(answers_parts)
        prompt = COMPARE_PROMPT.format(answers_table=answers_table, query=query)
        summary = _call_llm(prompt)

    return {"individual": individual_results, "summary": summary}
