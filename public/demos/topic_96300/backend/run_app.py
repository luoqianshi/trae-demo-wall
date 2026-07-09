import sys
sys.path.insert(0, '.')

try:
    from app.main import app
    print("App imported successfully", flush=True)
    
    import uvicorn
    print("Starting server...", flush=True)
    uvicorn.run(app, host="0.0.0.0", port=8001, reload=False)
except Exception as e:
    print(f"Error: {e}", flush=True)
    import traceback
    traceback.print_exc(file=sys.stdout)
