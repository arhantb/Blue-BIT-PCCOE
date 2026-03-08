import requests
from math import radians, sin, cos, sqrt, atan2
from app.core.config import settings

def fetch_nearest_metro(lat: float, lon: float) -> dict:
    try:
        overpass_query = f'[out:json][timeout:25];(node["railway"="station"]["station"="subway"](around:5000,{lat},{lon});node["railway"="subway_entrance"](around:5000,{lat},{lon});node["station"="subway"](around:5000,{lat},{lon}););out body;'
        response = requests.post(settings.OVERPASS_URL, data={"data": overpass_query}, timeout=25)
        data = response.json()
        elements = data.get("elements", [])
        if not elements: return {"station_name": "None", "distance_km": None}
        
        def haversine(lat1, lon1, lat2, lon2):
            R = 6371
            dlat = radians(lat2 - lat1)
            dlon = radians(lon2 - lon1)
            a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
            return R * 2 * atan2(sqrt(a), sqrt(1 - a))
            
        nearest = min(elements, key=lambda e: haversine(lat, lon, e["lat"], e["lon"]))
        distance = haversine(lat, lon, nearest["lat"], nearest["lon"])
        return {"station_name": nearest.get("tags", {}).get("name", "Unknown"), "distance_km": round(distance, 2)}
    except Exception: return {"station_name": "Error", "distance_km": None}
