#!/usr/bin/env python3
"""
PaddleOCR 模型下载工具
运行此脚本下载模型文件，然后打包成exe即可离线使用
"""

import os
import sys

def download_models():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    model_dir = os.path.join(base_dir, 'models')
    
    os.makedirs(model_dir, exist_ok=True)
    
    det_dir = os.path.join(model_dir, 'det')
    rec_dir = os.path.join(model_dir, 'rec')
    cls_dir = os.path.join(model_dir, 'cls')
    
    os.makedirs(det_dir, exist_ok=True)
    os.makedirs(rec_dir, exist_ok=True)
    os.makedirs(cls_dir, exist_ok=True)
    
    print("=" * 60)
    print("PaddleOCR 模型下载工具")
    print("=" * 60)
    print(f"\n模型将保存到: {model_dir}")
    print(f"预计下载大小: 约 100MB")
    print("\n正在下载模型...")
    
    try:
        from paddleocr import PaddleOCR
        
        print("\n[1/3] 下载检测模型（det）...")
        ocr = PaddleOCR(
            use_angle_cls=True, 
            lang='ch', 
            show_log=True,
            det_model_dir=det_dir,
            rec_model_dir=rec_dir,
            cls_model_dir=cls_dir
        )
        
        print("\n[2/3] 初始化OCR（验证模型）...")
        test_result = ocr.ocr(__file__, cls=True)
        
        print("\n[3/3] 模型验证完成！")
        
        total_size = 0
        for root, dirs, files in os.walk(model_dir):
            for f in files:
                fp = os.path.join(root, f)
                total_size += os.path.getsize(fp)
        
        print(f"\n模型总大小: {total_size / 1024 / 1024:.2f} MB")
        print(f"模型位置: {model_dir}")
        
        print("\n" + "=" * 60)
        print("模型下载完成！")
        print("=" * 60)
        print("\n下一步:")
        print("  1. 运行 start.bat 启动程序")
        print("  2. 整个文件夹可复制到其他Windows电脑使用")
        
    except ImportError as e:
        print(f"\n错误: 缺少依赖库 - {e}")
        print("\n请先安装依赖:")
        print("  pip install paddlepaddle paddleocr")
        return False
    except Exception as e:
        print(f"\n错误: {e}")
        return False
    
    return True

if __name__ == "__main__":
    success = download_models()
    sys.exit(0 if success else 1)