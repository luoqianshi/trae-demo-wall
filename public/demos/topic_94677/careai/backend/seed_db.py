import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "app"))

from app.core.database import SessionLocal
from app.services.seed import seed_data

db = SessionLocal()
seed_data(db)
print("Database seeded successfully!")
