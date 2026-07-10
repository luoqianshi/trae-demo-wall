import sys
with open('env_check.txt', 'w', encoding='utf-8') as f:
    f.write(f"Python: {sys.version}\n")
    try:
        import requests
        f.write(f"requests: {requests.__version__}\n")
    except ImportError as e:
        f.write(f"requests ImportError: {e}\n")
    f.write("OK\n")
