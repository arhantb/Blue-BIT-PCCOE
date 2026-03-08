import os
import logging
from typing import Tuple, Dict, Any

import httpx

logger = logging.getLogger(__name__)


class MapplsService:
	"""Routing helper with MapPLS (MapMyIndia) best-effort support and OSRM
	fallback.

	`get_directions(origin, dest)` returns a normalized dictionary with keys:
	- `distance_m`, `duration_s`, `geometry` (geojson), `raw` (original response)
	"""

	OSRM_URL = "http://router.project-osrm.org/route/v1/driving"

	def __init__(self, api_key: str = None):
		self.api_key = api_key or os.getenv("MAPPLS_API_KEY")

	def _normalize_osrm(self, resp_json: Dict[str, Any]) -> Dict[str, Any]:
		routes = resp_json.get("routes") or []
		if not routes:
			return {"distance_m": 0, "duration_s": 0, "geometry": None, "raw": resp_json}
		r = routes[0]
		return {"distance_m": r.get("distance"), "duration_s": r.get("duration"), "geometry": r.get("geometry"), "raw": resp_json}

	def _osrm_route(self, origin: Tuple[float, float], dest: Tuple[float, float]) -> Dict[str, Any]:
		lon1, lat1 = origin[1], origin[0]
		lon2, lat2 = dest[1], dest[0]
		url = f"{self.OSRM_URL}/{lon1},{lat1};{lon2},{lat2}"
		params = {"overview": "full", "geometries": "geojson", "steps": "true"}
		resp = httpx.get(url, params=params, timeout=10.0)
		resp.raise_for_status()
		return self._normalize_osrm(resp.json())

	def get_directions(self, origin: Tuple[float, float], dest: Tuple[float, float]) -> Dict[str, Any]:
		if self.api_key:
			try:
				lon1, lat1 = origin[1], origin[0]
				lon2, lat2 = dest[1], dest[0]
				url = f"https://apis.mappls.com/advancedmaps/v1/{self.api_key}/route"
				params = {"start": f"{lat1},{lon1}", "end": f"{lat2},{lon2}", "return": "geojson"}
				resp = httpx.get(url, params=params, timeout=12.0)
				resp.raise_for_status()
				data = resp.json()
				# Attempt to normalize vendor response if it follows common shapes
				if isinstance(data, dict) and "routes" in data:
					return self._normalize_osrm(data)
				return {"distance_m": None, "duration_s": None, "geometry": data, "raw": data}
			except Exception:
				logger.exception("MapPLS request failed; falling back to OSRM")

		return self._osrm_route(origin, dest)


__all__ = ["MapplsService"]
