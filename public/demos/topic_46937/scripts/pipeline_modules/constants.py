# v2.4.0-stable Shared Constants
IMAGE_EXTS = {'.png','.jpg','.jpeg','.gif','.webp','.bmp','.tiff'}
TEXT_EXTS = {'.txt','.md'}
SPREADSHEET_EXTS = {'.xlsx','.xls','.csv'}
DOC_EXTS = {'.pdf','.docx','.doc'}
VIDEO_EXTS = {'.mp4','.mov','.avi','.mkv','.wmv'}

KEYWORDS = [
    '产品名称','SKU','面料成分','面料克重','版型','弹力','颜色',
    '尺码范围','洗护说明','核心卖点','适用场景','检测机构',
    '报告编号','试穿报告','身高体重推荐','工艺','功能点',
    '腰型','裤长','袖长','领型'
]

ALLOWED_PARTS = [
    'part_01_intro_selling_points.md',
    'part_02_audience_scene_emotion.md',
    'part_03_product_gallery.md',
    'part_04_marketing_livestream.md',
    'part_05_qualification_size_index.md',
]

FORBIDDEN_INDEX_HEADINGS = [
    '## 十、相关素材文件索引',
    '### 10.1 图片素材',
    '### 10.2 文本/表格/文档素材',
    '### 10.3 视频素材',
]

EXCLUDE_INDEX_DEFAULT = True

def is_mock_image(filepath):
    import os
    if not filepath or not os.path.exists(filepath):
        return False
    if '_MOCK' in os.path.basename(filepath):
        return True
    try:
        from PIL import Image
        with Image.open(filepath) as img:
            if img.info.get("pdh_mock") == "true":
                return True
            pixels = img.load()
            if pixels[0, 0] == (123, 234, 123):
                return True

            # 升级防御：基于独特颜色总数的物理特征多维融合防线
            # 极低颜色数过滤：极度单调的合成 Mock 图颜色数往往少于 150 种
            rgb_img = img.convert('RGB')
            colors = rgb_img.getcolors(maxcolors=2000)
            if colors is not None:
                color_count = len(colors)
                # 1. 强力低颜色数过滤（少于150）
                if color_count < 150:
                    return True
                # 2. 如果颜色数在 150-1000 之间，进行多维复合判定
                if color_count < 1000:
                    abs_path = os.path.abspath(filepath).replace('\\', '/')
                    # 特殊物理路径放行：5.1 颜色图、8.1 实拍素材可能是色卡或扫描报告极简底图，不作为 mock 判罚
                    if '5.1 颜色展示' in abs_path or '8.1 实拍素材' in abs_path or 'excel_images' in abs_path:
                        return False
                    # 如果不是 5.1/8.1 且属于大图规格 (600x800) 或搭配目录，判定为 Mock
                    if img.size == (600, 800) or '5.4' in abs_path or 'ai_generated_outfits' in abs_path:
                        return True
    except Exception:
        pass
    return False
