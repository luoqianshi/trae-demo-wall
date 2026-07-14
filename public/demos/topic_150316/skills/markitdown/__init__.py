"""
MarkItDown Skill - 文档转 Markdown 转换器
将 PDF、DOCX、PPTX、XLSX 等格式统一转换为 Markdown
"""

from markitdown import MarkItDown
import tempfile
import os

_md = MarkItDown()


def convert_file(file_bytes: bytes, filename: str) -> str:
    """将文件字节流转为 Markdown 文本"""
    ext = os.path.splitext(filename)[1].lower()
    supported = {".pdf", ".docx", ".pptx", ".xlsx", ".html", ".htm",
                 ".csv", ".json", ".xml", ".epub", ".txt", ".md"}

    if ext not in supported:
        raise ValueError(f"不支持的格式: {ext}")

    # 写入临时文件
    suffix = ext if ext else ".txt"
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name

    try:
        result = _md.convert(tmp_path)
        return result.text_content
    finally:
        os.unlink(tmp_path)


def get_supported_formats() -> list:
    """返回支持的格式列表"""
    return [".pdf", ".docx", ".pptx", ".xlsx", ".html", ".htm",
            ".csv", ".json", ".xml", ".epub", ".txt", ".md"]