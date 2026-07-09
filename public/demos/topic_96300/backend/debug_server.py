import sys
sys.path.insert(0, '.')

try:
    print("Importing uvicorn...")
    import uvicorn
    print("Importing app...")
    from app.main import app
    print("App imported successfully!")
    
    print("Starting server...")
    uvicorn.run("app.main:app", host="0.0.0.0", port=8080, log_level="info")
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    input("Press Enter to exit...")
