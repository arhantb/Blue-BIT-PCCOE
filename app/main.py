import logging
from typing import Optional, Tuple

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app.services.ai_service import AIService
from app.services.geo_service import GeoService
from app.services.mappls_service import MapplsService
from app.services.metro_service import MetroService
from app.services.weather_service import WeatherService
from app.services.ddg_service import DuckDuckGoService

logger = logging.getLogger("tram.api")
app = FastAPI(title="Tram.AI - Services API")

load_dotenv()  # load environment variables from .env if present

# instantiate shared service objects (singleton-like)
ai_svc = AIService()
geo_svc = GeoService()
map_svc = MapplsService()
metro_svc = MetroService()
weather_svc = WeatherService()
ddg_svc = DuckDuckGoService()


class TextRequest(BaseModel):
	prompt: str = Field(..., example="What is the fastest route from A to B?")


class GeocodeRequest(BaseModel):
	query: str


class ReverseRequest(BaseModel):
	lat: float
	lon: float


class RouteRequest(BaseModel):
	origin: Tuple[float, float]  # (lat, lon)
	dest: Tuple[float, float]


class SearchRequest(BaseModel):
	query: str
	max_results: int = 10


@app.get("/health")
def health():
	return {"status": "ok"}


@app.post("/ai/generate")
def ai_generate(req: TextRequest):
	try:
		return {"result": ai_svc.chat(req.prompt)}
	except Exception as e:
		logger.exception("AI generate failed")
		raise HTTPException(status_code=500, detail=str(e))


@app.post("/geo/geocode")
def geocode(req: GeocodeRequest):
	try:
		res = geo_svc.geocode(req.query)
		if not res:
			raise HTTPException(status_code=404, detail="No result")
		return res
	except HTTPException:
		raise
	except Exception as e:
		logger.exception("geocode failed")
		raise HTTPException(status_code=500, detail=str(e))


@app.post("/geo/reverse")
def reverse(req: ReverseRequest):
	try:
		return geo_svc.reverse(req.lat, req.lon)
	except Exception as e:
		logger.exception("reverse geocode failed")
		raise HTTPException(status_code=500, detail=str(e))


@app.post("/map/route")
def route(req: RouteRequest):
	try:
		return map_svc.get_directions(req.origin, req.dest)
	except Exception as e:
		logger.exception("route failed")
		raise HTTPException(status_code=500, detail=str(e))


@app.post("/search")
def search(req: SearchRequest):
	try:
		return {"results": ddg_svc.search(req.query, max_results=req.max_results)}
	except Exception as e:
		logger.exception("search failed")
		raise HTTPException(status_code=500, detail=str(e))


@app.post("/metro/nearby")
def metro_nearby(req: ReverseRequest):
	try:
		return {"stations": metro_svc.get_nearby_stations(req.lat, req.lon)}
	except Exception as e:
		logger.exception("metro nearby failed")
		raise HTTPException(status_code=500, detail=str(e))


@app.post("/weather/current")
def weather_current(req: ReverseRequest):
	try:
		return weather_svc.get_current_weather(req.lat, req.lon)
	except Exception as e:
		logger.exception("weather current failed")
		raise HTTPException(status_code=500, detail=str(e))


@app.post("/weather/hourly")
def weather_hourly(req: ReverseRequest):
	try:
		return weather_svc.get_hourly_forecast(req.lat, req.lon)
	except Exception as e:
		logger.exception("weather hourly failed")
		raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
	import uvicorn

	uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
