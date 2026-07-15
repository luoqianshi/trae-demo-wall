"""
AI 文件智能分类器
基于 TF-IDF + DBSCAN 聚类算法对文件进行自动分类

用法:
  python ai_classifier.py --input <input.json> --output <output.json>

输入 JSON 格式:
  [{"id": 1, "path": "/path/to/file.txt", "mime_type": "text/plain", "file_size": 1024}, ...]

输出 JSON 格式:
  {"categories": [{"name": "文档", "files": [1, 5, 8]}, {"name": "图片", "files": [2, 3]}, ...]}
"""

import argparse
import json
import os
import sys
from pathlib import Path

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.cluster import DBSCAN
    import numpy as np
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


def extract_features(file_info):
    """从文件元数据中提取特征文本"""
    path = file_info.get("path", "")
    mime_type = file_info.get("mime_type", "") or ""
    name = os.path.basename(path)
    ext = os.path.splitext(name)[1].lower() if "." in name else ""

    # 特征：文件名 + 扩展名 + 目录名 + MIME 类型
    dir_name = os.path.basename(os.path.dirname(path))
    name_without_ext = os.path.splitext(name)[0]

    # 将扩展名映射到类别关键词
    ext_map = {
        ".txt": "text document",
        ".md": "text document markdown",
        ".doc": "word document",
        ".docx": "word document",
        ".xls": "excel spreadsheet",
        ".xlsx": "excel spreadsheet",
        ".ppt": "presentation slides",
        ".pptx": "presentation slides",
        ".pdf": "pdf document",
        ".jpg": "image photo",
        ".jpeg": "image photo",
        ".png": "image photo",
        ".gif": "image gif animation",
        ".svg": "image vector",
        ".mp3": "audio music",
        ".wav": "audio",
        ".mp4": "video movie",
        ".avi": "video",
        ".mkv": "video",
        ".zip": "archive compressed",
        ".rar": "archive compressed",
        ".7z": "archive compressed",
        ".tar": "archive",
        ".gz": "compressed",
        ".exe": "executable program",
        ".dll": "library dynamic",
        ".so": "library shared",
        ".py": "python script code",
        ".js": "javascript script code",
        ".ts": "typescript code",
        ".rs": "rust code",
        ".go": "golang code",
        ".java": "java code",
        ".cpp": "cpp code",
        ".c": "c code",
        ".h": "header code",
        ".json": "json data",
        ".xml": "xml data",
        ".yaml": "yaml config",
        ".yml": "yaml config",
        ".toml": "toml config",
        ".ini": "ini config",
        ".cfg": "config",
        ".css": "css style",
        ".scss": "scss style",
        ".html": "html markup",
        ".htm": "html markup",
    }

    ext_keywords = ext_map.get(ext, f"file {ext}")
    features = f"{name_without_ext} {ext_keywords} {dir_name} {mime_type}"
    return features


def generate_category_name(files, all_files):
    """根据文件列表生成有意义的类别名称"""
    exts = {}
    for fid in files:
        info = all_files.get(fid, {})
        ext = os.path.splitext(info.get("path", ""))[1].lower()
        exts[ext] = exts.get(ext, 0) + 1

    if not exts:
        return "未分类"

    # 找到最常见的扩展名
    dominant_ext = max(exts, key=exts.get)

    ext_category = {
        ".txt": "文本文件", ".md": "Markdown 文档", ".doc": "Word 文档",
        ".docx": "Word 文档", ".xls": "Excel 表格", ".xlsx": "Excel 表格",
        ".ppt": "PPT 演示", ".pptx": "PPT 演示", ".pdf": "PDF 文档",
        ".jpg": "图片", ".jpeg": "图片", ".png": "图片", ".gif": "图片",
        ".svg": "矢量图", ".mp3": "音频", ".wav": "音频",
        ".mp4": "视频", ".avi": "视频", ".mkv": "视频",
        ".zip": "压缩包", ".rar": "压缩包", ".7z": "压缩包",
        ".exe": "可执行文件", ".dll": "动态库",
        ".py": "Python 代码", ".js": "JavaScript 代码", ".ts": "TypeScript 代码",
        ".rs": "Rust 代码", ".go": "Go 代码", ".java": "Java 代码",
        ".cpp": "C++ 代码", ".c": "C 代码", ".h": "头文件",
        ".json": "JSON 数据", ".xml": "XML 数据", ".yaml": "YAML 配置",
        ".css": "CSS 样式", ".html": "HTML 页面",
    }

    return ext_category.get(dominant_ext, f"{dominant_ext[1:].upper()} 文件")


def classify_files(files, eps=0.3, min_samples=2):
    """
    对文件列表进行聚类分类

    参数:
        files: 文件元数据列表 [{id, path, mime_type, file_size}, ...]
        eps: DBSCAN 邻域半径
        min_samples: DBSCAN 最小样本数

    返回:
        {"categories": [{"name": str, "files": [int]}, ...]}
    """
    if not files:
        return {"categories": []}

    # 提取特征
    features = [extract_features(f) for f in files]
    file_map = {f["id"]: f for f in files}

    if not SKLEARN_AVAILABLE:
        # 降级方案：按扩展名分组
        return classify_by_extension(files, file_map)

    # TF-IDF 向量化
    vectorizer = TfidfVectorizer(
        analyzer="char_wb",
        ngram_range=(2, 4),
        max_features=500,
        min_df=1,
    )
    X = vectorizer.fit_transform(features)

    # DBSCAN 聚类
    clusterer = DBSCAN(eps=eps, min_samples=min_samples, metric="cosine")
    labels = clusterer.fit_predict(X)

    # 按聚类结果分组
    clusters = {}
    for i, label in enumerate(labels):
        label_key = int(label)
        if label_key not in clusters:
            clusters[label_key] = []
        clusters[label_key].append(files[i]["id"])

    # 生成类别
    categories = []
    for label_key, file_ids in clusters.items():
        if label_key == -1:
            # -1 表示噪声点（未聚类），分散到已有类别或跳过
            continue
        name = generate_category_name(file_ids, file_map)
        categories.append({"name": name, "files": file_ids})

    # 如果没有聚类结果，降级为按扩展名分组
    if not categories:
        return classify_by_extension(files, file_map)

    return {"categories": categories}


def classify_by_extension(files, file_map):
    """降级方案：按扩展名分组分类"""
    ext_groups = {}
    for f in files:
        ext = os.path.splitext(f.get("path", ""))[1].lower() or "unknown"
        if ext not in ext_groups:
            ext_groups[ext] = []
        ext_groups[ext].append(f["id"])

    categories = []
    for ext, file_ids in ext_groups.items():
        name = generate_category_name(file_ids, file_map)
        categories.append({"name": name, "files": file_ids})

    return {"categories": categories}


def main():
    parser = argparse.ArgumentParser(description="AI 文件智能分类器")
    parser.add_argument("--input", "-i", required=True, help="输入 JSON 文件路径")
    parser.add_argument("--output", "-o", required=True, help="输出 JSON 文件路径")
    parser.add_argument("--eps", type=float, default=0.3, help="DBSCAN 邻域半径")
    parser.add_argument("--min-samples", type=int, default=2, help="DBSCAN 最小样本数")
    args = parser.parse_args()

    # 读取输入
    with open(args.input, "r", encoding="utf-8") as f:
        files = json.load(f)

    # 分类
    result = classify_files(files, eps=args.eps, min_samples=args.min_samples)

    # 写入输出
    os.makedirs(os.path.dirname(args.output) or ".", exist_ok=True)
    with open(args.output, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"分类完成: {len(result['categories'])} 个类别", file=sys.stderr)


if __name__ == "__main__":
    main()