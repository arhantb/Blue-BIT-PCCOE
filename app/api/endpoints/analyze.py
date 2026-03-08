from fastapi import APIRouter, HTTPException
from app.models.venue import VenueRequest
from app.services.geo_service import geocode_venue
from app.services.ai_service import fetch_live_data, analyze_venue, generate_decision
from app.services.metro_service import fetch_nearest_metro
from app.services.weather_service import fetch_weather
from app.services.mappls_service import fetch_mappls_traffic
from app.utils.file_handler import save_data, load_data

router = APIRouter()

@router.post("/analyze")
def analyze(request: VenueRequest):
    venue_name = request.venue.strip()
    coords = geocode_venue(venue_name)
    if not coords:
        raise HTTPException(status_code=404, detail="Geocoding failed")
    
    lat, lon = coords
    live_data = fetch_live_data(venue_name)
    traffic_prediction = analyze_venue(venue_name, live_data)
    metro_result = fetch_nearest_metro(lat, lon)
    weather_result = fetch_weather(lat, lon)
    mappls_traffic = fetch_mappls_traffic(lat, lon)
    
    result = {
        **traffic_prediction,
        "location": {"latitude": lat, "longitude": lon},
        "nearest_metro_station": metro_result,
        "weather": weather_result,
        "mappls_live_traffic": mappls_traffic
    }
    
    save_data("input.json", result)
    return result

@router.post("/output")
def generate_output_decision():
    inputs = load_data("input.json")
    if not inputs:
        raise HTTPException(status_code=404, detail="No input data available to process")
    
    last_input = inputs[-1]
    decision = generate_decision(last_input)
    
    save_data("output.json", decision)
    return decision
