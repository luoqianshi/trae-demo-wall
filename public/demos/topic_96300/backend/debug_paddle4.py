import sys

log_file = open('../paddle_debug_log3.txt', 'w', encoding='utf-8')

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
    log_file.close()
    sys.exit(1)

log("\nStep 2: Checking paddle availability...")
try:
    paddle.utils.run_check()
    log("SUCCESS: PaddlePaddle is properly installed")
except Exception as e:
    log(f"FAILED: {e}")
    log_file.close()
    sys.exit(1)

log("\nStep 3: Done!")
log_file.close()
