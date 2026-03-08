import logging
import requests
from app.core.config import settings

logger = logging.getLogger("MapplsService")

def get_mappls_token():
    url = "https://outpost.mappls.com/api/security/oauth/token"
    payload = {
        "grant_type": "client_credentials",
        "client_id": settings.MAPPLS_CLIENT_ID,
        "client_secret": settings.MAPPLS_CLIENT_SECRET,
    }
    headers = {"Content-Type": "application/x-www-form-urlencoded"}

    try:
        response = requests.post(url, data=payload, headers=headers, timeout=10)
        data = response.json()
        return data.get("access_token")
    except Exception as e:
        logger.error(f"Token request exception: {str(e)}")
        return None

def fetch_mappls_traffic(lat: float, lon: float):
    token = get_mappls_token()
    if not token:
        logger.warning("Missing Mappls token.")
        return None

    dest_lat, dest_lon = lat + 0.02, lon + 0.02
    url = f"https://apis.mappls.com/advancedmaps/v1/{token}/route_adv/driving/{lon},{lat};{dest_lon},{dest_lat}"
    params = {"traffic": "true", "steps": "false", "resource": "route_eta"}

    try:
        response = requests.get(url, params=params, timeout=10)
        data = response.json()
        if response.status_code != 200 or not data.get("routes"):
            return None

        route = data["routes"][0]
        distance_km = route.get("distance", 0) / 1000
        duration_min = route.get("duration", 0) / 60
        duration_no_traffic = route.get("duration_without_traffic", route.get("duration", 0)) / 60
        delay_min = max(0, duration_min - duration_no_traffic)
        avg_speed = distance_km / (duration_min / 60) if duration_min else 0

        congestion = "LOW"
        if delay_min > 10: congestion = "CRITICAL"
        elif delay_min > 5: congestion = "HIGH"
        elif delay_min > 2: congestion = "MODERATE"

        return {
            "distance_km": round(distance_km, 2),
            "travel_time_min": round(duration_min, 1),
            "traffic_delay_min": round(delay_min, 1),
            "average_speed_kmh": round(avg_speed, 1),
            "congestion_level": congestion
        }
    except Exception as e:
        logger.error(f"Traffic fetch exception: {str(e)}")
        return {"error": str(e), "congestion_level": "UNKNOWN"}
