import sys
sys.path.insert(0, '.')

try:
    from app.main import app
    print("App imported successfully")
    
    import uvicorn
    print("Starting server...")
    
    config = uvicorn.Config(app, host="0.0.0.0", port=8080, log_level="info")
    server = uvicorn.Server(config)
    server.run()
    
except Exception as e:
    print(f"Error: {e}", flush=True)
    import traceback
    traceback.print_exc(file=sys.stdout)
