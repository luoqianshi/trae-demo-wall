"""
AI 分类器测试脚本
不依赖外部库，测试降级分类逻辑
"""

import json
import os
import sys
import tempfile

# 添加父目录到 path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ai_classifier import classify_files, extract_features, generate_category_name, classify_by_extension


def test_extract_features():
    """测试特征提取"""
    file_info = {"id": 1, "path": "/docs/report.docx", "mime_type": "application/msword", "file_size": 1024}
    features = extract_features(file_info)
    assert "report" in features
    assert "word" in features or "document" in features
    print("  ✓ test_extract_features")


def test_classify_by_extension():
    """测试按扩展名分组"""
    files = [
        {"id": 1, "path": "/docs/report.docx", "mime_type": "application/msword", "file_size": 1024},
        {"id": 2, "path": "/docs/letter.docx", "mime_type": "application/msword", "file_size": 512},
        {"id": 3, "path": "/photos/vacation.jpg", "mime_type": "image/jpeg", "file_size": 2048},
        {"id": 4, "path": "/photos/selfie.jpg", "mime_type": "image/jpeg", "file_size": 1024},
        {"id": 5, "path": "/code/main.rs", "mime_type": "text/plain", "file_size": 256},
    ]

    file_map = {f["id"]: f for f in files}
    result = classify_by_extension(files, file_map)

    assert len(result["categories"]) == 3  # docx, jpg, rs
    names = [c["name"] for c in result["categories"]]
    assert "Word 文档" in names
    assert "图片" in names
    print("  ✓ test_classify_by_extension")


def test_classify_empty():
    """测试空列表"""
    result = classify_files([], eps=0.3, min_samples=2)
    assert result["categories"] == []
    print("  ✓ test_classify_empty")


def test_classify_single_file():
    """测试单个文件"""
    files = [
        {"id": 1, "path": "/test/readme.txt", "mime_type": "text/plain", "file_size": 100},
    ]
    result = classify_files(files, eps=0.3, min_samples=2)
    assert len(result["categories"]) == 1
    assert "文本文件" in result["categories"][0]["name"]
    print("  ✓ test_classify_single_file")


def test_generate_category_name():
    """测试类别名称生成"""
    files = {
        1: {"id": 1, "path": "/a.py", "file_size": 100},
        2: {"id": 2, "path": "/b.py", "file_size": 200},
    }
    name = generate_category_name([1, 2], files)
    assert "Python" in name
    print("  ✓ test_generate_category_name")


def test_cli_interface():
    """测试命令行接口"""
    from ai_classifier import main

    # 创建临时输入文件
    with tempfile.NamedTemporaryFile(mode="w", suffix=".json", delete=False, encoding="utf-8") as f:
        json.dump([
            {"id": 1, "path": "/a.txt", "mime_type": "text/plain", "file_size": 10},
            {"id": 2, "path": "/b.txt", "mime_type": "text/plain", "file_size": 20},
        ], f)
        input_path = f.name

    output_path = tempfile.mktemp(suffix=".json")

    # 模拟命令行参数
    old_argv = sys.argv
    try:
        sys.argv = ["ai_classifier.py", "--input", input_path, "--output", output_path]
        main()
    finally:
        sys.argv = old_argv

    # 验证输出
    with open(output_path, "r", encoding="utf-8") as f:
        result = json.load(f)
    assert "categories" in result
    assert len(result["categories"]) > 0

    os.unlink(input_path)
    os.unlink(output_path)
    print("  ✓ test_cli_interface")


if __name__ == "__main__":
    print("测试 AI 分类器:")
    test_extract_features()
    test_classify_by_extension()
    test_classify_empty()
    test_classify_single_file()
    test_generate_category_name()
    test_cli_interface()
    print("\n全部通过!")