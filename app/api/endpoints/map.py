from fastapi import APIRouter
from fastapi.responses import FileResponse

router = APIRouter()

@router.get("/map")
def get_map():
    return FileResponse("static/index.html")

@router.get("/")
def root():
    return {"status": "ok", "map_dashboard": "/map"}
