print("Testing RapidOCR init...")
try:
    from rapidocr_onnxruntime import RapidOCR
    print("Import OK")
    
    ocr = RapidOCR()
    print("Init OK")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
