import logging
from typing import Dict, Optional

import httpx

logger = logging.getLogger(__name__)


class WeatherService:
	"""Weather helper using Open-Meteo.

	Provides `get_current_weather(lat, lon)` and `get_hourly_forecast` helpers.
	"""

	BASE = "https://api.open-meteo.com/v1/forecast"

	def __init__(self, timeout: float = 10.0):
		self.timeout = timeout

	def get_current_weather(self, lat: float, lon: float) -> Dict:
		params = {"latitude": lat, "longitude": lon, "current_weather": "true"}
		try:
			resp = httpx.get(self.BASE, params=params, timeout=self.timeout)
			resp.raise_for_status()
			data = resp.json()
			return data.get("current_weather", {})
		except Exception:
			logger.exception("Failed to fetch current weather")
			return {}

	def get_hourly_forecast(self, lat: float, lon: float, hours: int = 24) -> Optional[Dict]:
		params = {"latitude": lat, "longitude": lon, "hourly": "temperature_2m,precipitation", "forecast_days": 2}
		try:
			resp = httpx.get(self.BASE, params=params, timeout=self.timeout)
			resp.raise_for_status()
			data = resp.json()
			return data.get("hourly", {})
		except Exception:
			logger.exception("Failed to fetch hourly forecast")
			return None


__all__ = ["WeatherService"]
