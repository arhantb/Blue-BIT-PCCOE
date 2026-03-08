import requests
from app.core.config import settings

def fetch_weather(lat: float, lon: float) -> dict:
    try:
        if not settings.OPENWEATHER_API_KEY: return {"error": "No key"}
        
        response = requests.get("https://api.openweathermap.org/data/2.5/weather",
            params={"lat": lat, "lon": lon, "appid": settings.OPENWEATHER_API_KEY, "units": "metric"}, timeout=10)
        data = response.json()
        if data.get("cod") != 200: return {"error": "API error"}
        weather = data["weather"][0]
        return {"condition": weather["description"].title(), "temperature_c": data["main"]["temp"]}
    except Exception as e: return {"error": str(e)}
