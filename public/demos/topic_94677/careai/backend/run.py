#!/usr/bin/env python3
"""
CareAI Backend Launcher
Usage: python run.py
"""
import sys
import os

# Add app to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "app"))

from app.main import app
import uvicorn

if __name__ == "__main__":
    print("Starting CareAI Backend on http://localhost:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000)
