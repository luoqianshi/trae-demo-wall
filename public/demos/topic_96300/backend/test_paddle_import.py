try:
    from paddleocr import PaddleOCR
    print("Import OK")
except Exception as e:
    print(f"Import failed: {e}")
