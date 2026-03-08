import time
import logging
from functools import lru_cache
from typing import Optional, Dict

import httpx

logger = logging.getLogger(__name__)


class GeoService:
	"""Geocoding helper using Nominatim with simple caching and retries.

	- `geocode(query)` returns the first match or None.
	- `reverse(lat, lon)` returns the Nominatim reverse lookup result.
	"""

	BASE = "https://nominatim.openstreetmap.org"

	def __init__(self, user_agent: str = "tram.ai/1.0", retries: int = 2, backoff: float = 0.4):
		self.headers = {"User-Agent": user_agent}
		self.retries = retries
		self.backoff = backoff

	@lru_cache(maxsize=256)
	def geocode(self, query: str, limit: int = 1) -> Optional[Dict]:
		params = {"q": query, "format": "json", "limit": limit}
		last_err = None
		for attempt in range(self.retries + 1):
			try:
				resp = httpx.get(f"{self.BASE}/search", params=params, headers=self.headers, timeout=10.0)
				resp.raise_for_status()
				data = resp.json()
				if not data:
					return None
				first = data[0]
				return {"lat": float(first["lat"]), "lon": float(first["lon"]), "display_name": first.get("display_name")}
			except Exception as e:
				last_err = e
				logger.debug("geocode attempt %s failed: %s", attempt + 1, e)
				time.sleep(self.backoff * (2 ** attempt))
		logger.exception("geocode failed for %s", query)
		raise last_err

	def reverse(self, lat: float, lon: float) -> Dict:
		params = {"lat": lat, "lon": lon, "format": "json"}
		resp = httpx.get(f"{self.BASE}/reverse", params=params, headers=self.headers, timeout=10.0)
		resp.raise_for_status()
		return resp.json()


__all__ = ["GeoService"]
