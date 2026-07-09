import sys

log_file = open('../paddle_debug_log2.txt', 'w', encoding='utf-8')

def log(msg):
    log_file.write(msg + '\n')
    log_file.flush()

log("Starting debug...")

log("\nStep 1: Importing paddle...")
try:
    import paddle
    log(f"SUCCESS: paddle imported, version={paddle.__version__}")
except Exception as e:
    log(f"FAILED: {e}")
    import traceback
    traceback.print_exc(file=log_file)
    log_file.close()
    sys.exit(1)

log("\nStep 2: Checking paddle availability...")
try:
    paddle.utils.run_check()
    log("SUCCESS: PaddlePaddle is properly installed")
except Exception as e:
    log(f"FAILED: {e}")
    import traceback
    traceback.print_exc(file=log_file)
    log_file.close()
    sys.exit(1)

log("\nStep 3: Importing paddleocr...")
try:
    from paddleocr import PaddleOCR
    log("SUCCESS: paddleocr imported")
except Exception as e:
    log(f"FAILED: {e}")
    import traceback
    traceback.print_exc(file=log_file)
    log_file.close()
    sys.exit(1)

log("\nAll imports successful!")
log_file.close()
