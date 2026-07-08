"""
Reg AI Demo — 审评报告智能检索与对比系统（超轻量版）
Streamlit 主应用
"""
import os
import streamlit as st
from pdf_processor import extract_text_from_pdf, get_pdf_metadata, save_uploaded_file, detect_pdf_language
from rag_engine import chunk_and_embed, search, generate_answer, compare_reports, get_all_metadata, get_uploaded_sources
import config

st.set_page_config(page_title="Reg AI — 审评报告智能检索与对比", page_icon="📋", layout="wide", initial_sidebar_state="expanded")

st.markdown("""
<style>
    .main-header h1 { font-size: 1.8rem; font-weight: 700; margin-bottom: 0.3rem; }
    .main-header p { color: #888; font-size: 0.9rem; }
    .answer-box { padding: 1.25rem; background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px; margin-bottom: 1rem; }
    .compare-box { padding: 1.25rem; background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 8px; margin-bottom: 1rem; }
</style>
""", unsafe_allow_html=True)


def render_source_list(sources):
    for i, src in enumerate(sources, 1):
        with st.expander(f"📎 来源 {i}：{src['filename']} — 第 {src['page']} 页", expanded=False):
            st.caption(f"机构: {src.get('agency', '未知')}")
            st.text(src["snippet"])


def render_upload_tab():
    st.header("📤 上传审评报告")
    uploaded_files = st.file_uploader("选择 PDF 文件（支持多文件上传）", type=["pdf"], accept_multiple_files=True, key="file_uploader")

    if uploaded_files:
        col1, col2 = st.columns(2)
        with col1:
            agency = st.selectbox("机构来源", ["FDA", "PMDA", "EMA", "NMPA (中国)", "其他"])
        with col2:
            drug_name = st.text_input("药品名称（可选）", placeholder="如：Keytruda")

        auto_translate = st.toggle(
            "🌐 自动翻译为中文", value=True,
            help="自动检测报告语言（英文/日文），翻译为中文后再存储。推荐对 FDA/EMA/PMDA 报告开启。",
        )

        if st.button("🚀 开始处理", type="primary", use_container_width=True):
            for f in uploaded_files:
                save_path = save_uploaded_file(f)
                meta = get_pdf_metadata(save_path)

                with st.status(f"正在处理 {f.name} ...", expanded=True) as status:
                    status.write("📄 解析 PDF 页面...")
                    try:
                        pages = extract_text_from_pdf(save_path)
                        scanned_count = sum(1 for p in pages if p["is_scanned"])
                        status.write(f"✅ 解析完成: {len(pages)} 页 (扫描件 {scanned_count} 页)")
                    except Exception as e:
                        status.error(f"解析失败: {e}")
                        continue

                    if auto_translate:
                        lang_info = detect_pdf_language(save_path)
                        if lang_info["lang"] != "zh":
                            status.write(f"🌐 检测到{lang_info['lang_name']}，正在翻译为中文...")
                        else:
                            status.write(f"📝 报告语言为{lang_info['lang_name']}，无需翻译")

                    status.write("🔍 分块 & 存储...")
                    try:
                        result = chunk_and_embed(pages, agency, drug_name, f.name, auto_translate=auto_translate)
                        chunk_count = result["chunk_count"]
                        if result["translated"]:
                            status.write(f"✅ 翻译完成: 原文 {result['original_lang']} → 中文")
                        status.write(f"✅ 存储完成: {chunk_count} 个文本块已入库")
                    except ValueError as e:
                        status.error(f"配置错误: {e}")
                        continue
                    except Exception as e:
                        status.error(f"处理失败: {e}")
                        continue

                if result.get("translated"):
                    st.success(f"**{f.name}** 处理完成: {meta['total_pages']} 页, 已翻译为中文, {chunk_count} 个文本块入库")
                else:
                    st.success(f"**{f.name}** 处理完成: {meta['total_pages']} 页, {chunk_count} 个文本块入库")

    st.divider()
    st.subheader("📚 已上传的报告")
    docs_info = get_all_metadata()
    if docs_info:
        for doc in docs_info:
            col1, col2, col3, col4 = st.columns([3, 1.5, 1.5, 1])
            with col1:
                label = doc["filename"]
                if doc.get("translated"):
                    label += " 🌐(已翻译)"
                st.text(label)
            with col2:
                st.caption(f"机构: {doc['agency']}")
            with col3:
                st.caption(f"药品: {doc['drug_name']}")
            with col4:
                st.caption(f"{doc['total_chunks']} 块")
    else:
        st.info("暂无已上传的报告。请先上传 PDF 文件。")


def render_search_tab():
    st.header("🔍 智能检索")
    sources = get_uploaded_sources()
    if not sources:
        st.warning("请先在「上传报告」Tab 中上传审评报告。")
        return

    query = st.text_input("输入问题", placeholder="例如: 该药物的主要适应症是什么？安全性结论如何？", label_visibility="collapsed")

    col1, col2 = st.columns(2)
    with col1:
        selected_sources = st.multiselect("检索范围（留空 = 全部报告）", options=sources, default=[], format_func=lambda x: os.path.basename(x))

    if query and st.button("🔍 检索", type="primary", use_container_width=True):
        with st.spinner("正在检索与生成答案..."):
            try:
                docs = search(query, sources=selected_sources if selected_sources else None)
                result = generate_answer(query, docs)
            except ValueError as e:
                st.error(f"配置错误: {e}")
                return
            except Exception as e:
                st.error(f"检索失败: {e}")
                return

        st.subheader("💬 AI 分析结果")
        st.markdown(f'<div class="answer-box">{result["answer"]}</div>', unsafe_allow_html=True)

        if result["sources"]:
            st.subheader("📎 引用来源")
            render_source_list(result["sources"])


def render_compare_tab():
    st.header("⚖️ 跨报告对比")
    sources = get_uploaded_sources()
    if not sources:
        st.warning("请先在「上传报告」Tab 中上传审评报告。")
        return
    if len(sources) < 2:
        st.warning("跨报告对比需要至少上传 2 份报告。")
        return

    selected = st.multiselect("选择要对比的报告（至少选 2 份）", options=sources, default=sources[:2], format_func=lambda x: os.path.basename(x))
    query = st.text_input("输入对比问题", placeholder="例如: 各报告对安全性风险的评估有何差异？", key="compare_query")

    if selected and len(selected) >= 2 and query:
        if st.button("⚖️ 开始对比分析", type="primary", use_container_width=True):
            with st.spinner("正在逐报告检索并生成对比分析..."):
                try:
                    result = compare_reports(query, selected)
                except ValueError as e:
                    st.error(f"配置错误: {e}")
                    return
                except Exception as e:
                    st.error(f"对比失败: {e}")
                    return

            st.subheader("📋 各报告独立分析结果")
            cols = st.columns(len(result["individual"]))
            for i, item in enumerate(result["individual"]):
                with cols[i]:
                    st.markdown(f"**{os.path.basename(item['filename'])}**")
                    st.markdown(item["answer"])

            if result["summary"]:
                st.divider()
                st.subheader("📊 跨报告差异对比分析")
                st.markdown(f'<div class="compare-box">{result["summary"]}</div>', unsafe_allow_html=True)

                export_text = f"对比问题: {query}\n\n"
                for item in result["individual"]:
                    export_text += f"=== {item['filename']} ===\n{item['answer']}\n\n"
                export_text += f"\n=== 差异对比分析 ===\n{result['summary']}"

                st.download_button("📥 导出对比结果 (TXT)", data=export_text.encode("utf-8"), file_name="reg_ai_comparison.txt", mime="text/plain")


def main():
    st.markdown('<div class="main-header"><h1>📋 Reg AI</h1><p>多机构审评报告智能检索与对比系统 — 超轻量版</p></div>', unsafe_allow_html=True)

    provider = config.LLM_PROVIDER
    model_names = {"bailian": config.BAILIAN_MODEL, "volcengine": config.VOLCENGINE_MODEL, "ollama": config.OLLAMA_MODEL, "deepseek": config.DEEPSEEK_MODEL, "openai": config.OPENAI_MODEL}
    provider_labels = {"bailian": "阿里云百炼 Qwen", "volcengine": "火山引擎豆包", "ollama": "Ollama", "deepseek": "DeepSeek", "openai": "OpenAI"}
    st.caption(f"LLM: {provider_labels.get(provider, provider)} ({model_names.get(provider, '?')}) | 存储: SQLite | 全部国内服务")

    tabs = st.tabs(["📤 上传报告", "🔍 智能检索", "⚖️ 跨报告对比"])
    with tabs[0]:
        render_upload_tab()
    with tabs[1]:
        render_search_tab()
    with tabs[2]:
        render_compare_tab()

    st.divider()
    st.caption("Reg AI Demo — 超轻量版，适配低内存环境")


if __name__ == "__main__":
    main()
