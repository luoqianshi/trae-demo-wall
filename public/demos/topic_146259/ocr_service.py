import re
import os
import base64
import io
import tempfile
from pathlib import Path

import config

_reader = None


def _get_reader():
    global _reader
    if _reader is None:
        import easyocr
        print('[ocr_service] 正在初始化 EasyOCR，首次使用需下载模型，请稍候...')
        _reader = easyocr.Reader(['ch_sim', 'en'], gpu=False, verbose=False)
        print('[ocr_service] EasyOCR 初始化完成')
    return _reader


def _recognize_easyocr(base64_image):
    """使用 EasyOCR 识别 base64 图片中的文字"""
    match = re.match(r'data:image/(\w+);base64,(.+)', base64_image)
    if not match:
        return {'text': '', 'confidence': 0.0, 'error': '图片格式不正确'}

    _, b64data = match.groups()
    image_bytes = base64.b64decode(b64data)

    from PIL import Image
    import numpy as np

    img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
    arr = np.array(img)

    reader = _get_reader()
    results = reader.readtext(arr, detail=1)

    if not results:
        return {'text': '', 'confidence': 0.0, 'error': ''}

    # 按 y 坐标排序，模拟阅读顺序
    results.sort(key=lambda r: (r[0][0][1], r[0][0][0]))
    texts = []
    confidences = []
    for (_, text, conf) in results:
        texts.append(text)
        confidences.append(conf)

    avg_conf = round(sum(confidences) / len(confidences), 3) if confidences else 0.0
    full_text = '\n'.join(texts)
    return {'text': full_text, 'confidence': avg_conf, 'error': ''}


def _save_base64_to_temp(base64_image):
    """将 base64 图片保存为临时文件，返回文件路径"""
    match = re.match(r'data:image/(\w+);base64,(.+)', base64_image)
    if not match:
        raise ValueError('图片格式不正确')

    ext, b64data = match.groups()
    ext = ext.lower()
    if ext == 'jpeg':
        ext = 'jpg'
    image_bytes = base64.b64decode(b64data)

    fd, path = tempfile.mkstemp(suffix=f'.{ext}', prefix='mineru_')
    try:
        with os.fdopen(fd, 'wb') as f:
            f.write(image_bytes)
        return path
    except Exception:
        os.close(fd)
        raise


def _extract_markdown_from_mineru_result(result):
    """从 mineru-python-client 返回结果中提取 markdown 文本"""
    if not result:
        return ''

    # 处理 list 的情况（precision_parse_local_files 返回列表）
    if isinstance(result, list):
        if len(result) == 0:
            return ''
        result = result[0]

    # 如果结果对象有 markdown_text / markdown 属性
    for attr in ('markdown_text', 'markdown', 'md'):
        val = getattr(result, attr, None)
        if val:
            return str(val).strip()

    # 如果是 dict
    if isinstance(result, dict):
        for key in ('markdown_text', 'markdown', 'md', 'text'):
            if key in result and result[key]:
                return str(result[key]).strip()

        # 某些版本返回 data -> full_md / markdown
        data = result.get('data', {})
        for key in ('full_md', 'markdown', 'md', 'text'):
            if key in data and data[key]:
                return str(data[key]).strip()

    # 兜底：返回字符串形式
    text = str(result).strip()
    return text


def _recognize_mineru(base64_image):
    """使用 MinerU 官方 API 识别图片"""
    if not config.MINERU_TOKEN:
        return {'text': '', 'confidence': 0.0, 'error': '未配置 MinerU API Token，请在 .env 中设置 MINERU_TOKEN 或 MINERU_ACCESS_KEY'}

    temp_path = None
    output_dir = tempfile.mkdtemp(prefix='mineru_bundle_')
    try:
        temp_path = _save_base64_to_temp(base64_image)

        try:
            from mineru_client import MinerUClient
        except ImportError as e:
            return {'text': '', 'confidence': 0.0, 'error': f'缺少 mineru-python-client 依赖: {e}'}

        client = MinerUClient(
            token=config.MINERU_TOKEN,
            base_url=config.MINERU_BASE_URL,
            poll_interval=3,
            timeout=120,
            request_timeout=30
        )

        bundle = client.precision_parse_local_bundle(
            temp_path,
            output_dir=output_dir,
            is_ocr=True,
            enable_formula=True,
            enable_table=True,
            language='ch',
            extra_formats=[]
        )

        markdown = ''
        if bundle.markdown_path and bundle.markdown_path.exists():
            markdown = bundle.markdown_path.read_text(encoding='utf-8').strip()

        if not markdown:
            # 兜底：尝试从结果对象提取
            markdown = _extract_markdown_from_mineru_result(bundle.task)

        if not markdown:
            return {'text': '', 'confidence': 0.0, 'error': 'MinerU 未识别到文本内容'}

        return {'text': markdown, 'confidence': 1.0, 'error': ''}
    except Exception as e:
        print(f'[ocr_service] MinerU recognize failed: {e}')
        return {'text': '', 'confidence': 0.0, 'error': f'MinerU 识别失败: {str(e)}'}
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass
        if os.path.exists(output_dir):
            try:
                import shutil
                shutil.rmtree(output_dir)
            except OSError:
                pass


def recognize(base64_image):
    """识别 base64 图片中的文字，返回 {"text": "...", "confidence": 0.0, "error": ""}"""
    try:
        if config.OCR_BACKEND == 'mineru':
            print('[ocr_service] 使用 MinerU 官方 API 进行识别')
            return _recognize_mineru(base64_image)
        else:
            return _recognize_easyocr(base64_image)
    except Exception as e:
        print(f'[ocr_service] recognize failed: {e}')
        return {'text': '', 'confidence': 0.0, 'error': f'OCR 识别失败: {str(e)}'}
