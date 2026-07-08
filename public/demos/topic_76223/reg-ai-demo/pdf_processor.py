"""
PDF 处理模块：解析 PDF 文本 + OCR 扫描件
"""
import os
import tempfile
import fitz  # PyMuPDF
import pdfplumber
import config

_ocr = None
_ocr_available = None


def _check_ocr_available():
    global _ocr_available
    if _ocr_available is None:
        try:
            from paddleocr import PaddleOCR
            _ocr_available = True
        except ImportError:
            _ocr_available = False
    return _ocr_available


def get_ocr():
    global _ocr
    if _ocr is None:
        from paddleocr import PaddleOCR
        _ocr = PaddleOCR(use_angle_cls=True, lang='ch', show_log=False, use_gpu=False)
    return _ocr


def ocr_page(ocr_engine, image_path):
    result = ocr_engine.ocr(image_path, cls=True)
    if result and result[0]:
        lines = [line[1][0] for line in result[0] if line and line[1]]
        return "\n".join(lines)
    return ""


def extract_text_from_pdf(file_path):
    """提取 PDF 全文，自动判断是否需要 OCR。"""
    pages_text = []
    doc = fitz.open(file_path)

    for page_num in range(len(doc)):
        text = ""
        is_scanned = False

        try:
            with pdfplumber.open(file_path) as pdf:
                if page_num < len(pdf.pages):
                    text = pdf.pages[page_num].extract_text() or ""
        except Exception:
            text = ""

        if len(text.strip()) < 100:
            try:
                page_fitz = doc[page_num]
                fitz_text = page_fitz.get_text()
                if len(fitz_text.strip()) > len(text.strip()):
                    text = fitz_text
            except Exception:
                pass

        if len(text.strip()) < 100:
            is_scanned = True
            if _check_ocr_available():
                try:
                    ocr_engine = get_ocr()
                    page_img = doc[page_num].get_pixmap(dpi=300)
                    with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                        tmp_path = tmp.name
                        page_img.save(tmp_path)
                    try:
                        text = ocr_page(ocr_engine, tmp_path)
                    finally:
                        if os.path.exists(tmp_path):
                            os.remove(tmp_path)
                except Exception as e:
                    text = f"[OCR 失败: 第{page_num + 1}页 - {str(e)}]"
            else:
                text = f"[需要 OCR - 第{page_num + 1}页为扫描件，PaddleOCR 未安装]"

        pages_text.append({"page": page_num + 1, "text": text, "is_scanned": is_scanned})

    doc.close()
    return pages_text


def detect_pdf_language(file_path):
    """检测 PDF 文本的主要语言。"""
    from translator import detect_language
    pages = extract_text_from_pdf(file_path)
    sample = " ".join(p["text"][:500] for p in pages if p["text"].strip())
    lang = detect_language(sample)
    lang_names = {"zh": "中文", "en": "英文", "ja": "日文"}
    return {"lang": lang, "lang_name": lang_names.get(lang, "未知")}


def get_pdf_metadata(file_path):
    doc = fitz.open(file_path)
    metadata = {
        "total_pages": len(doc),
        "file_size_mb": round(os.path.getsize(file_path) / 1024 / 1024, 2),
        "title": doc.metadata.get("title", "") or os.path.basename(file_path),
    }
    doc.close()
    return metadata


def save_uploaded_file(uploaded_file):
    save_path = os.path.join(config.UPLOAD_DIR, uploaded_file.name)
    with open(save_path, "wb") as f:
        f.write(uploaded_file.read())
    return save_path
