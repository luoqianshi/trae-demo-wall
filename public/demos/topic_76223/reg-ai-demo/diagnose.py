"""
诊断脚本：直接测试 PDF 上传处理流程，跳过 Streamlit
"""
import os
import sys
import traceback

# 确保在正确的目录
os.chdir(os.path.dirname(os.path.abspath(__file__)))

print("=" * 50)
print("Reg AI 诊断脚本")
print("=" * 50)

# 第一步：测试 config
print("\n[1/5] 加载配置...")
try:
    import config
    print(f"  LLM: {config.LLM_PROVIDER}")
    print(f"  Embedding: {config.EMBEDDING_PROVIDER} ({config.EMBEDDING_MODEL})")
    print("  ✓ 配置加载成功")
except Exception as e:
    print(f"  ✗ 配置失败: {e}")
    traceback.print_exc()
    sys.exit(1)

# 第二步：测试 Embedding API
print("\n[2/5] 测试 Embedding API...")
try:
    from rag_engine import embed_texts, embed_query
    result = embed_texts(["测试文本"])
    print(f"  ✓ Embedding 成功，向量维度: {len(result[0])}")
except Exception as e:
    print(f"  ✗ Embedding 失败: {e}")
    traceback.print_exc()
    sys.exit(1)

# 第三步：测试 LLM API
print("\n[3/5] 测试 LLM API...")
try:
    from rag_engine import _call_llm
    answer = _call_llm("请用一句话回答：1+1等于几")
    print(f"  ✓ LLM 成功: {answer[:50]}")
except Exception as e:
    print(f"  ✗ LLM 失败: {e}")
    traceback.print_exc()
    sys.exit(1)

# 第四步：测试 PDF 解析
print("\n[4/5] 测试 PDF 解析...")
upload_dir = config.UPLOAD_DIR
pdf_files = [f for f in os.listdir(upload_dir) if f.endswith('.pdf')]
if pdf_files:
    test_file = os.path.join(upload_dir, pdf_files[0])
    print(f"  找到测试文件: {pdf_files[0]}")
    try:
        from pdf_processor import extract_text_from_pdf, get_pdf_metadata
        meta = get_pdf_metadata(test_file)
        print(f"  页数: {meta['total_pages']}, 大小: {meta['file_size_mb']}MB")
        pages = extract_text_from_pdf(test_file)
        text_count = sum(1 for p in pages if len(p["text"].strip()) > 0)
        print(f"  ✓ PDF 解析成功: {len(pages)} 页, {text_count} 页有文本")
    except Exception as e:
        print(f"  ✗ PDF 解析失败: {e}")
        traceback.print_exc()
        sys.exit(1)
else:
    print("  ⚠ 没有找到已上传的 PDF 文件，跳过此步")
    print("  请先手动放一个 PDF 文件到 D:\\reg-ai-demo\\data\\uploads\\ 目录下")

# 第五步：测试完整流程（如果上面有 PDF 的话）
if pdf_files:
    print("\n[5/5] 测试完整处理流程（分块+向量化）...")
    try:
        from rag_engine import chunk_and_embed
        result = chunk_and_embed(pages, "FDA", "TestDrug", pdf_files[0], auto_translate=False)
        print(f"  ✓ 处理完成: {result['chunk_count']} 个文本块入库")
        print(f"  原始语言: {result['original_lang']}")
    except Exception as e:
        print(f"  ✗ 处理失败: {e}")
        traceback.print_exc()
        sys.exit(1)
else:
    print("\n[5/5] 跳过（需要先有 PDF 文件）")

print("\n" + "=" * 50)
print("诊断完成！如果所有步骤都 ✓，说明核心功能正常。")
print("问题可能出在 Streamlit 上传组件的兼容性。")
print("=" * 50)

input("\n按回车键退出...")
