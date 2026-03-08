import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
    OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")
    OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
    OVERPASS_URL = "https://overpass-api.de/api/interpreter"
    MAPPLS_CLIENT_ID = os.getenv("MAPPLS_CLIENT_ID")
    MAPPLS_CLIENT_SECRET = os.getenv("MAPPLS_CLIENT_SECRET")
    TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
    DATA_DIR = "data"
    
settings = Settings()
