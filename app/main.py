from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.endpoints import analyze, data, map
from app.utils.logger import setup_logger

logger = setup_logger("SmartVenueTrafficAI")
logger.info("Initializing Smart Venue Traffic Intelligence API...")

app = FastAPI(title="Smart Venue Traffic Intelligence API")

# CORS CONFIGURATION
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(analyze.router)
app.include_router(data.router)
app.include_router(map.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
