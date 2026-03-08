import math
import logging
from functools import lru_cache
from typing import Tuple, Optional, Dict, List, Any

import httpx

logger = logging.getLogger(__name__)


def _haversine(lat1, lon1, lat2, lon2):
	R = 6371000
	phi1 = math.radians(lat1)
	phi2 = math.radians(lat2)
	dphi = math.radians(lat2 - lat1)
	dlambda = math.radians(lon2 - lon1)
	a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
	return 2 * R * math.asin(math.sqrt(a))


class MetroService:
	"""Find nearby metro/subway stations using the Overpass API.

	Caches recent queries and returns a sorted list of stations including
	`distance_m`. Provides `get_nearest_station` convenience wrapper.
	"""

	OVERPASS = "https://overpass-api.de/api/interpreter"

	def __init__(self, timeout: float = 20.0):
		self.timeout = timeout

	@lru_cache(maxsize=256)
	def get_nearby_stations(self, lat: float, lon: float, radius: int = 2000) -> List[Dict[str, Any]]:
		query = f"[out:json];(node(around:{radius},{lat},{lon})[railway=station];node(around:{radius},{lat},{lon})[public_transport=station];);out center;"
		try:
			resp = httpx.post(self.OVERPASS, data={"data": query}, timeout=self.timeout)
			resp.raise_for_status()
			data = resp.json()
		except Exception:
			logger.exception("Overpass query failed")
			return []

		elements = data.get("elements", [])
		results: List[Dict[str, Any]] = []
		for el in elements:
			el_lat = el.get("lat")
			el_lon = el.get("lon")
			if el_lat is None or el_lon is None:
				continue
			dist = _haversine(lat, lon, el_lat, el_lon)
			results.append({"id": el.get("id"), "name": el.get("tags", {}).get("name"), "lat": el_lat, "lon": el_lon, "distance_m": dist})
		results.sort(key=lambda r: r["distance_m"])
		return results

	def get_nearest_station(self, lat: float, lon: float, radius: int = 2000) -> Optional[Dict[str, Any]]:
		stations = self.get_nearby_stations(lat, lon, radius)
		return stations[0] if stations else None


__all__ = ["MetroService"]
