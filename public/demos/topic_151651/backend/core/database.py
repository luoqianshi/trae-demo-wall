import os
import json
from typing import Dict, List, Optional

DATA_STORE = []

def init_chromadb():
    pass

def store_vector_data(ideal_self: str, actual_self: str):
    DATA_STORE.append({
        "ideal_self": ideal_self,
        "actual_self": actual_self,
        "timestamp": os.times()
    })

def get_recent_self_vectors(limit: int = 5) -> Dict[str, List]:
    recent = DATA_STORE[-limit:] if len(DATA_STORE) > 0 else []
    return {
        "ids": [f"entry_{i}" for i in range(len(recent))],
        "documents": [f"{r['ideal_self']} | {r['actual_self']}" for r in recent],
        "metadatas": recent
    }
