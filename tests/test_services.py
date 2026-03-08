import json

from app.services.ai_service import AIService
from app.services.geo_service import GeoService
from app.services.mappls_service import MapplsService
from app.services.metro_service import MetroService
from app.services.weather_service import WeatherService


def test_ai_stub():
    svc = AIService(api_key=None)
    r = svc.chat("hello world")
    assert r.startswith("[ai-stub]")


def test_weather_methods():
    svc = WeatherService()
    # cannot call live API in tests here; ensure methods exist
    assert hasattr(svc, "get_current_weather")
    assert hasattr(svc, "get_hourly_forecast")


def test_geo_methods_exist():
    svc = GeoService()
    assert hasattr(svc, "geocode")
    assert hasattr(svc, "reverse")


def test_mappls_exists():
    svc = MapplsService()
    assert hasattr(svc, "get_directions")


def test_metro_exists():
    svc = MetroService()
    assert hasattr(svc, "get_nearby_stations")


def test_ddg_exists():
    from app.services.ddg_service import DuckDuckGoService

    svc = DuckDuckGoService()
    assert hasattr(svc, "search")
