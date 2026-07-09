import sys

def test_import(module_name):
    try:
        __import__(module_name)
        print(f"OK: {module_name}", flush=True)
        return True
    except Exception as e:
        print(f"FAIL: {module_name} - {e}", flush=True)
        return False

print("Testing imports...", flush=True)

test_import("fastapi")
test_import("uvicorn")
test_import("numpy")
test_import("cv2")
test_import("PIL")
test_import("rapidocr_onnxruntime")

print("Done!", flush=True)
