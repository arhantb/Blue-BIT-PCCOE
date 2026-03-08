import requests

def geocode_venue(venue_name: str) -> tuple[float, float] | None:
    try:
        search = f"{venue_name}, India"
        response = requests.get("https://nominatim.openstreetmap.org/search",
            params={"q": search, "format": "json", "limit": 1},
            headers={"User-Agent": "SmartVenueTrafficAI/1.0"}, timeout=10)
        data = response.json()
        if data: return float(data[0]["lat"]), float(data[0]["lon"])
        return None
    except Exception: return None
