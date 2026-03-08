import os
from fastapi import APIRouter
from fastapi.responses import FileResponse
from app.utils.file_handler import load_data
from app.core.config import settings

router = APIRouter()

@router.get("/inputs")
def get_inputs():
    return load_data("input.json")

@router.get("/outputs")
def get_outputs():
    return load_data("output.json")

@router.get("/data")
def get_all_data():
    return {
        "inputs": load_data("input.json"),
        "outputs": load_data("output.json")
    }

@router.get("/output.json")
def get_output_json():
    filepath = os.path.join(settings.DATA_DIR, "output.json")
    if os.path.exists(filepath):
        return FileResponse(filepath)
    return {"error": "not found"}
