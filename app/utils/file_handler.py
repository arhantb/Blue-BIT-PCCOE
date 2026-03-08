import os
import json
from app.core.config import settings

def save_data(filename: str, data: dict):
    filepath = os.path.join(settings.DATA_DIR, filename)
    os.makedirs(settings.DATA_DIR, exist_ok=True)
    
    if os.path.exists(filepath):
        with open(filepath, "r") as f:
            try:
                items = json.load(f)
            except json.JSONDecodeError:
                items = []
    else:
        items = []
    
    items.append(data)
    with open(filepath, "w") as f:
        json.dump(items, f, indent=4)

def load_data(filename: str):
    filepath = os.path.join(settings.DATA_DIR, filename)
    if os.path.exists(filepath):
        with open(filepath, "r") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return []
    return []
