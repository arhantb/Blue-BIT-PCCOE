import os
import re
import json
import logging
import requests
from bs4 import BeautifulSoup
from datetime import datetime
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
from openai import OpenAI
from generate_token import fetch_mappls_traffic
from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

# --- LOGGING CONFIGURATION ---
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler("data/app_debug.log", encoding="utf-8")
    ]
)
logger = logging.getLogger("SmartVenueTrafficAI")

# --- INITIALIZATION ---
os.makedirs("data", exist_ok=True)
logger.info("Initializing Smart Venue Traffic Intelligence API...")

# ── Key resolution: Groq (primary, free) → OpenRouter → OpenAI ──────────────
groq_api_key   = os.getenv("GROQ_API_KEY")
openai_api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")

if not groq_api_key and not openai_api_key:
    if os.path.exists(".env.example"):
        load_dotenv(".env.example")
        groq_api_key   = os.getenv("GROQ_API_KEY")
        openai_api_key = os.getenv("OPENROUTER_API_KEY") or os.getenv("OPENAI_API_KEY")
        if groq_api_key or openai_api_key:
            logger.warning("Loaded API key from .env.example — replace with a secure .env for production")

if not groq_api_key and not openai_api_key:
    logger.error("Missing API key: set GROQ_API_KEY, OPENROUTER_API_KEY, or OPENAI_API_KEY")
    raise RuntimeError("Missing API key: set GROQ_API_KEY in your .env (free at console.groq.com)")

# SDK client — points to Groq (OpenAI-compatible) as primary, OpenRouter as fallback
if groq_api_key:
    client = OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=groq_api_key,
    )
    logger.info("✅ AI client: Groq (llama-3.3-70b-versatile) as primary")
else:
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=openai_api_key,
    )
    logger.warning("⚠️ AI client: OpenRouter fallback (Groq key missing)")

OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY")

# --- STARTUP ENVIRONMENT CHECKS ---
required_envs = {
    "GROQ_API_KEY": bool(groq_api_key),
    "MAPPLS_CLIENT_ID": bool(os.getenv("MAPPLS_CLIENT_ID")),
    "MAPPLS_CLIENT_SECRET": bool(os.getenv("MAPPLS_CLIENT_SECRET")),
    "OPENWEATHER_API_KEY": bool(OPENWEATHER_API_KEY),
}
missing = [k for k, v in required_envs.items() if not v]
if missing:
    logger.warning("Missing environment variables: %s", ", ".join(missing))
else:
    logger.info("All required environment variables appear set.")



def _make_compat_response(text: str) -> dict:
    """Wrap plain text into OpenAI-compatible response shape."""
    return {"choices": [{"message": {"content": text}}]}


def call_openrouter_chat(messages, model="google/gemini-2.0-flash-001", temperature=0.2):
    """
    AI call chain — tries providers in order until one succeeds:
      1. Groq  (free, fast — llama-3.3-70b)
      2. Gemini REST API direct (GEMINI_API_KEY)
      3. OpenRouter (fallback)
    Returns an OpenAI-compatible dict: {"choices":[{"message":{"content":"..."}}]}
    """

    # ── 1. GROQ (primary — completely free, generous limits) ─────────────────
    groq_key = os.getenv("GROQ_API_KEY")
    if groq_key:
        try:
            resp = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {groq_key}", "Content-Type": "application/json"},
                json={
                    "model": "llama-3.3-70b-versatile",
                    "temperature": temperature,
                    "messages": messages,
                    "max_tokens": 2048,
                },
                timeout=30,
            )
            if resp.status_code == 200:
                logger.info("✅ Groq API responded OK")
                return resp.json()
            else:
                logger.warning(f"Groq returned {resp.status_code}: {resp.text[:150]} — trying Gemini")
        except Exception as e:
            logger.warning(f"Groq exception: {e} — trying Gemini")

    # ── 2. GEMINI direct REST API ────────────────────────────────────────────
    gemini_key = os.getenv("GEMINI_API_KEY")
    if gemini_key:
        try:
            # Convert OpenAI messages → Gemini contents format
            gemini_contents = []
            system_text = ""
            for m in messages:
                if m["role"] == "system":
                    system_text = m["content"]
                elif m["role"] == "user":
                    text = (system_text + "\n\n" + m["content"]) if system_text else m["content"]
                    gemini_contents.append({"role": "user", "parts": [{"text": text}]})
                    system_text = ""
                elif m["role"] == "assistant":
                    gemini_contents.append({"role": "model", "parts": [{"text": m["content"]}]})

            resp = requests.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={gemini_key}",
                json={"contents": gemini_contents, "generationConfig": {"temperature": temperature}},
                timeout=30,
            )
            if resp.status_code == 200:
                text_out = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
                logger.info("✅ Gemini direct API responded OK")
                return _make_compat_response(text_out)
            else:
                logger.warning(f"Gemini returned {resp.status_code}: {resp.text[:150]} — trying OpenRouter")
        except Exception as e:
            logger.warning(f"Gemini exception: {e} — trying OpenRouter")

    # ── 3. OpenRouter (last resort) ──────────────────────────────────────────
    resp = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={"Authorization": f"Bearer {openai_api_key}", "Content-Type": "application/json"},
        json={"model": model, "temperature": temperature, "messages": messages},
        timeout=30,
    )
    try:
        data = resp.json()
    except Exception:
        resp.raise_for_status()
    if resp.status_code != 200:
        raise Exception(f"OpenRouter error {resp.status_code}: {data}")
    return data



OVERPASS_URL = "https://overpass-api.de/api/interpreter"

app = FastAPI(title="Smart Venue Traffic Intelligence API")

# --- CORS CONFIGURATION ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DECISION SYSTEM CONSTANTS ---
SYSTEM_PROMPT_DECISION = """
You are a Government-grade AI Traffic Control System for Pune, India.
Your task is to analyze structured traffic state data and produce actionable traffic management decisions.
STRICT RULES:
- Output ONLY valid JSON
- No explanation
- No markdown
- No extra text
- Prioritize safety and congestion reduction
- Use realistic traffic engineering actions
"""

OUTPUT_SCHEMA_DECISION = """
Return JSON in EXACT format:
{
  "decision_summary": "short explanation",
  "priority_level": "low | medium | high | critical",
  "signal_actions": [
    {
      "junction_area": "name",
      "east_west_green_time_sec": number,
      "north_south_green_time_sec": number,
      "reason": "why"
    }
  ],
  "traffic_management_actions": ["action1", "action2"],
  "public_advisories": ["message1", "message2"],
  "suggested_reroute_waypoints": [
    {"name": "Location Name", "lat": 18.524, "lon": 73.847}
  ],
  "risk_assessment": {
    "choke_probability": 0.0,
    "crash_risk": 0.0,
    "pedestrian_density": "low | moderate | high"
  },
  "map_visualization_flags": {
    "highlight_event_zone": true,
    "highlight_congestion": true,
    "show_metro_option": true,
    "alert_level": "green | orange | red"
  },
  "next_review_in_minutes": number,
  "confidence": 0.0
}
"""

class VenueRequest(BaseModel):
    venue: str

class CoordsRequest(BaseModel):
    lat: float
    lon: float
    label: str = ""   # optional human-readable label from caller

def get_today_date():
    return datetime.now().strftime("%d %B %Y")

def scrape_webpage_text(url: str, timeout: int = 10) -> str:
    """Fetches a URL and extracts clean text content."""
    try:
        if not url.startswith("http"): return ""
        # Avoid huge files or PDFs
        if url.endswith(".pdf") or url.endswith(".jpg") or url.endswith(".png"): return ""
        
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"}
        response = requests.get(url, headers=headers, timeout=timeout)
        if response.status_code != 200: return ""
        
        soup = BeautifulSoup(response.text, "html.parser")
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer", "header"]):
            script.decompose()
        
        # Get text and clean it
        text = soup.get_text(separator=" ", strip=True)
        # return first 3000 chars to avoid prompt bloat and capture more details
        return text[:3000]
    except Exception as e:
        logger.warning(f"Failed to scrape {url}: {e}")
        return ""

def fetch_live_data(venue_name: str) -> str:
    """Robust DuckDuckGo scraper that combines multiple queries and deep-scrapes top links."""
    combined_results = []
    seen_urls = set()
    
    # Multiple targeted queries for 'minute details'
    queries = [
        f"{venue_name} Pune event OR gathering OR seminar OR fest today",
        f"{venue_name} Pune traffic OR crowd current status",
        f"{venue_name} Pune hackathons and events"
        f"{venue_name} Pune College events"
        f"{venue_name} Pune latest news updates 2026"
    ]
    
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"}
    
    for query in queries:
        try:
            url = f"https://html.duckduckgo.com/html/?q={requests.utils.quote(query)}"
            response = requests.get(url, headers=headers, timeout=12)
            if response.status_code != 200: continue
            
            soup = BeautifulSoup(response.text, "html.parser")
            for i, el in enumerate(soup.select(".result")):
                if i >= 5: break # top 5 per query
                
                title = el.select_one(".result__title")
                snippet = el.select_one(".result__snippet")
                link_el = el.select_one(".result__url")
                
                title_text = title.get_text(strip=True) if title else ""
                snippet_text = snippet.get_text(strip=True) if snippet else ""
                link_url = link_el.get_text(strip=True) if link_el else ""
                if not link_url.startswith("http"):
                    link_url = "https://" + link_url
                
                if link_url not in seen_urls:
                    seen_urls.add(link_url)
                    result_entry = {
                        "title": title_text,
                        "snippet": snippet_text,
                        "url": link_url,
                        "deep_content": ""
                    }
                    
                    # Deep scrape the top 1-2 most relevant looking links for 'minute details'
                    # Priority keywords: 'fest', 'event', '2026', 'traffic', 'pune', 'gathering', 'seminar'
                    if any(kw in title_text.lower() or kw in snippet_text.lower() for kw in ["fest", "event", "2026", "news", "official", "gathering", "seminar", "today", "crowd", "imcc"]):
                        if len(combined_results) < 3: # Limit deep scraping to avoid slowing down API too much
                            logger.info(f"🔗 Deep scraping: {link_url}")
                            result_entry["deep_content"] = scrape_webpage_text(link_url)
                    
                    combined_results.append(result_entry)
        except Exception as e:
            logger.error(f"Search error for query '{query}': {e}")

    # Format the results for the AI
    output = "LIVE WEB DATA (PUNE TRAFFIC & EVENTS):\n"
    if not combined_results:
        return "No specific live data found via DuckDuckGo. Defaulting to general patterns."
    
    for res in combined_results:
        output += f"SOURCE: {res['url']}\nTITLE: {res['title']}\nSUMMARY: {res['snippet']}\n"
        if res['deep_content']:
            output += f"EXTRACTED DETAILS: {res['deep_content']}\n"
        output += "---\n"
        
    return output

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


@app.get("/geocode")
def debug_geocode(q: str):
    """Debug endpoint: returns raw Nominatim results for a given query.
    Useful for verifying why a venue fails to geocode.
    """
    try:
        response = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": q, "format": "json", "limit": 5},
            headers={"User-Agent": "SmartVenueTrafficAI/1.0"},
            timeout=10,
        )
        data = response.json()
        return {"query": q, "count": len(data), "results": data}
    except Exception as e:
        logger.error("Geocode debug error: %s", str(e))
        raise HTTPException(status_code=500, detail=str(e))


# ── PUNE METRO STATIONS (hardcoded — OSM tags for Pune Metro are unreliable) ──
# Line 1 — Purple Line: PCMC ↔ Swargate
# Line 2 — Aqua Line  : Vanaz ↔ Ramwadi
PUNE_METRO_STATIONS = [
    # Purple Line (Line 1) — North to South
    {"name": "Pimpri",                  "line": "Purple", "lat": 18.6279,  "lon": 73.7997},
    {"name": "Sant Tukaramnagar",       "line": "Purple", "lat": 18.6214,  "lon": 73.8008},
    {"name": "Nashik Phata",            "line": "Purple", "lat": 18.6133,  "lon": 73.8002},
    {"name": "Kasarwadi",               "line": "Purple", "lat": 18.6031,  "lon": 73.8022},
    {"name": "Fugewadi",                "line": "Purple", "lat": 18.5946,  "lon": 73.8040},
    {"name": "Dapodi",                  "line": "Purple", "lat": 18.5869,  "lon": 73.8060},
    {"name": "Bopodi",                  "line": "Purple", "lat": 18.5795,  "lon": 73.8344},
    {"name": "Khadki",                  "line": "Purple", "lat": 18.5718,  "lon": 73.8418},
    {"name": "Range Hills",             "line": "Purple", "lat": 18.5633,  "lon": 73.8468},
    {"name": "Shivaji Nagar",           "line": "Purple", "lat": 18.5308,  "lon": 73.8474},
    {"name": "Civil Court",             "line": "Purple", "lat": 18.5195,  "lon": 73.8557},
    {"name": "Budhwar Peth",            "line": "Purple", "lat": 18.5143,  "lon": 73.8565},
    {"name": "Mandai",                  "line": "Purple", "lat": 18.5082,  "lon": 73.8571},
    {"name": "Swargate",                "line": "Purple", "lat": 18.5000,  "lon": 73.8578},
    # Aqua Line (Line 2) — West to East
    {"name": "Vanaz",                   "line": "Aqua",   "lat": 18.5076,  "lon": 73.8076},
    {"name": "Ideal Colony",            "line": "Aqua",   "lat": 18.5088,  "lon": 73.8148},
    {"name": "Nal Stop",                "line": "Aqua",   "lat": 18.5101,  "lon": 73.8250},
    {"name": "Garware College",         "line": "Aqua",   "lat": 18.5136,  "lon": 73.8305},
    {"name": "Deccan Gymkhana",         "line": "Aqua",   "lat": 18.5157,  "lon": 73.8394},
    {"name": "Chhatrapati Sambhaji Udyan","line":"Aqua",  "lat": 18.5173,  "lon": 73.8432},
    {"name": "PMC",                     "line": "Aqua",   "lat": 18.5193,  "lon": 73.8553},
    {"name": "Pune Railway Station",    "line": "Aqua",   "lat": 18.5203,  "lon": 73.8686},
    {"name": "Ruby Hall Clinic",        "line": "Aqua",   "lat": 18.5270,  "lon": 73.8793},
    {"name": "Bund Garden",             "line": "Aqua",   "lat": 18.5368,  "lon": 73.8870},
    {"name": "Yerwada",                 "line": "Aqua",   "lat": 18.5500,  "lon": 73.8953},
    {"name": "Kalyani Nagar",           "line": "Aqua",   "lat": 18.5481,  "lon": 73.9042},
    {"name": "Ramwadi",                 "line": "Aqua",   "lat": 18.5488,  "lon": 73.9150},
]

def fetch_nearest_metro(lat: float, lon: float) -> dict:
    """Find nearest Pune Metro station from hardcoded station list (accurate, no external API)."""
    from math import radians, sin, cos, sqrt, atan2
    def haversine(lat1, lon1, lat2, lon2):
        R = 6371
        dlat = radians(lat2 - lat1)
        dlon = radians(lon2 - lon1)
        a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
        return R * 2 * atan2(sqrt(a), sqrt(1 - a))

    try:
        nearest = min(PUNE_METRO_STATIONS, key=lambda s: haversine(lat, lon, s["lat"], s["lon"]))
        distance = haversine(lat, lon, nearest["lat"], nearest["lon"])
        return {
            "station_name": f"{nearest['name']} ({nearest['line']} Line)",
            "distance_km": round(distance, 2)
        }
    except Exception as e:
        logger.error(f"Metro lookup error: {e}")
        return {"station_name": "None", "distance_km": None}



def fetch_weather(lat: float, lon: float) -> dict:
    try:
        if not OPENWEATHER_API_KEY:
            logger.warning("OPENWEATHER_API_KEY not set; skipping weather fetch")
            return {"error": "No key"}

        response = requests.get(
            "https://api.openweathermap.org/data/2.5/weather",
            params={"lat": lat, "lon": lon, "appid": OPENWEATHER_API_KEY, "units": "metric"},
            timeout=10,
        )
        try:
            data = response.json()
        except Exception as e:
            logger.error("OpenWeather returned non-JSON response: %s", str(e))
            return {"error": "invalid response", "status_code": response.status_code, "text": response.text}

        if response.status_code != 200:
            logger.error("OpenWeather API error: %s", data)
            return {"error": "API error", "status_code": response.status_code, "message": data}

        weather = data.get("weather", [{}])[0]
        return {"condition": weather.get("description", "Unknown").title(), "temperature_c": data.get("main", {}).get("temp")}
    except Exception as e: return {"error": str(e)}

def analyze_venue(venue_name: str, live_data: str) -> dict:
    try:
        system_prompt = (
            "You are a Pune Smart City Traffic AI specializing in deep event analysis.\n"
            "Your goal is to extract MINUTE DETAILS from the provided live web data.\n"
            "STRICT DATA REQUIREMENTS:\n"
            "- congestion_index must be a number from 0-100 (integer).\n"
            "- confidence must be a number from 0-100 (integer).\n"
            "- impact_zones must ALWAYS be an ARRAY of objects, even if there is only one zone.\n"
            "- estimated_attendance must be a numeric string or number.\n"
            "- likely_event_today MUST BE A STRING (e.g. 'Yes', 'No', 'College Gathering').\n"
            "Look for specific event timings (start/end), exact venue locations/gates, "
            "estimated crowd sizes, and specialized traffic warnings.\n"
            "CRITICAL: Be highly sensitive to small gatherings, seminars, or college events. If evidence points to a gathering (like at IMCC or other colleges) but exact numbers aren't stated, realistically estimate attendance (e.g., 300) rather than defaulting to 0.\n"
            "SUPER CRITICAL: If you see a '[SYSTEM OVERRIDE]' in the LIVE DATA, you MUST treat it as absolute truth and output exactly what it says for the event. Replace 'likely_event_today' with a string describing the event.\n"
            "Return ONLY JSON.\n\n"
            "Output keys:\n"
            "- venue(name, type, capacity, address)\n"
            "- event_context(likely_event_today, date, estimated_attendance, specific_details)\n"
            "- traffic_prediction(severity, congestion_index, confidence, peak_period(start, end, label, description))\n"
            "- impact_zones: [ {radius, level (0-5), roads_affected: string} ]"
        )
        try:
            # Prefer direct call with explicit Authorization header
            response_json = call_openrouter_chat(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"VENUE: {venue_name}\nLIVE DATA: {live_data}"}
                ],
                model="google/gemini-2.0-flash-001",
                temperature=0.2,
            )
            content = response_json["choices"][0]["message"]["content"].strip()
        except Exception:
            # Fallback to SDK client (if configured) — allow SDK exceptions to be handled below
            response = client.chat.completions.create(
                model="google/gemini-2.0-flash-001",
                temperature=0.25,
                messages=[{"role": "system", "content": system_prompt}, {"role": "user", "content": f"VENUE: {venue_name}\nLIVE DATA: {live_data}"}]
            )
            content = response.choices[0].message.content.strip()
        match = re.search(r"\{[\s\S]*\}", content)
        return json.loads(match.group(0))
    except Exception as e:
        # If the external model call fails (e.g. unauthorized), return a safe mock response
        logger.error("analyze_venue: external model call failed — returning mock response: %s", str(e))
        # Include the original exception text so the frontend can show an explanatory message
        err_text = str(e)
        mock_response = {
            "success": True,
            "venue_query": venue_name,
            "venue": {
                "name": venue_name,
                "city": "Pune, Maharashtra",
                "type": "stadium",
                "capacity": "Unknown",
                "description": "Mocked venue response due to external API error."
            },
            "event_context": {
                "likely_event_today": "No major events detected (mock)",
                "day_of_week": get_today_date(),
                "estimated_attendance": "0",
                "weather_note": "No live weather available"
            },
            "traffic_prediction": {
                "severity": "UNKNOWN",
                "congestion_index": 10,
                "confidence": 20,
                "summary": "Mocked prediction due to external API failure",
                "peak_period": {"start": "00:00", "end": "00:00", "label": "N/A", "description": "N/A"},
                "pre_surge_starts": "N/A",
                "post_surge_clears": "N/A"
            },
            "impact_zones": [],
            "alerts": [],
            "recommendations": {
                "best_arrival_window": "N/A",
                "avoid_roads": [],
                "transit_options": []
            }
        }
        mock_response["mock_reason"] = err_text
        mock_response["model_error"] = True
        return mock_response

@app.post("/analyze")
def analyze(request: VenueRequest):
    venue_name = request.venue.strip()
    logger.info(f"🔍 Analyzing venue: {venue_name}")
    coords = geocode_venue(venue_name)
    if not coords:
        logger.error(f"❌ Geocoding failed for: {venue_name}")
        raise HTTPException(status_code=404, detail="Geocoding failed. Please try a more specific address or venue name.")
    
    lat, lon = coords
    live_data = fetch_live_data(venue_name)
    traffic_result = analyze_venue(venue_name, live_data)
    metro_result = fetch_nearest_metro(lat, lon)
    weather_result = fetch_weather(lat, lon)
    mappls_traffic = fetch_mappls_traffic(lat, lon)
    
    result = {
        **traffic_result,
        "location": {"latitude": lat, "longitude": lon},
        "nearest_metro_station": metro_result,
        "weather": weather_result,
        "mappls_live_traffic": mappls_traffic,
        "timestamp": datetime.now().isoformat()
    }
    
    # Save to input.json
    try:
        inputs = []
        if os.path.exists("data/input.json"):
            with open("data/input.json", "r", encoding="utf-8") as f:
                inputs = json.load(f)
        inputs.append(result)
        with open("data/input.json", "w", encoding="utf-8") as f:
            json.dump(inputs, f, indent=4)
    except Exception as e:
        logger.error(f"Error saving to input.json: {e}")

    # Generate Decision immediately for real-time pipeline
    logger.info("🧠 Generating real-time traffic decision with RAG context...")
    
    # Load historical context for RAG
    historical_context = ""
    try:
        if os.path.exists("data/input.json"):
            with open("data/input.json", "r", encoding="utf-8") as f:
                recent_inputs = json.load(f)[-5:] # Last 5 inputs
                historical_context += "RECENT TRAFFIC STATES (HISTORICAL):\n" + json.dumps(recent_inputs, indent=2) + "\n\n"
        if os.path.exists("data/output.json"):
            with open("data/output.json", "r", encoding="utf-8") as f:
                recent_outputs = json.load(f)[-5:] # Last 5 decisions
                historical_context += "RECENT AI DECISIONS (HISTORICAL):\n" + json.dumps(recent_outputs, indent=2) + "\n\n"
    except Exception as e:
        logger.warning(f"Could not load historical context for RAG: {e}")

    decision = None
    try:
        prompt_content = f"CURRENT INPUT STATE:\n{json.dumps(result)}\n\n"
        if historical_context:
            prompt_content = f"HISTORICAL CONTEXT (for continuity):\n{historical_context}\n\n" + prompt_content
        
        prompt_content += f"SCHEMA:\n{OUTPUT_SCHEMA_DECISION}"

        response_json = call_openrouter_chat(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_DECISION},
                {"role": "user", "content": prompt_content}
            ],
            model="google/gemini-2.0-flash-001",
            temperature=0.2,
        )
        raw_decision = response_json["choices"][0]["message"]["content"]
        match = re.search(r"\{[\s\S]*\}", raw_decision)
        if match:
            decision = json.loads(match.group(0))
            
            # Save to output.json
            outputs = []
            if os.path.exists("data/output.json"):
                with open("data/output.json", "r", encoding="utf-8") as f:
                    outputs = json.load(f)
            outputs.append(decision)
            with open("data/output.json", "w", encoding="utf-8") as f:
                json.dump(outputs, f, indent=4)
    except Exception as e:
        logger.error(f"Failed to generate decision: {e}")
        # Return a basic decision if AI fails
        decision = {
            "decision_summary": "Standard traffic protocols in effect.",
            "priority_level": "low",
            "signal_actions": [],
            "traffic_management_actions": ["Monitor area for congestion."],
            "public_advisories": ["No major advisories."],
            "risk_assessment": {"choke_probability": 0.1, "crash_risk": 0.05, "pedestrian_density": "low"},
            "map_visualization_flags": {"highlight_event_zone": False, "highlight_congestion": False, "show_metro_option": True, "alert_level": "green"},
            "next_review_in_minutes": 30,
            "confidence": 0.5
        }

    return {"analysis": result, "decision": decision}

@app.post("/analyze-coords")
def analyze_by_coords(request: CoordsRequest):
    """
    Accepts raw lat/lon coordinates directly — no geocoding step.
    Used by the WhatsApp bot and any caller that already has coordinates.
    An optional `label` string is used as the venue name for the web scraper.
    """
    lat, lon = request.lat, request.lon

    # Build a clean short venue label for the AI web scraper
    venue_name = request.label.strip() if request.label.strip() else f"{lat},{lon}"
    # If label is too long (full reverse-geocode dump), shorten it
    if len(venue_name) > 80:
        venue_name = venue_name[:80]

    logger.info(f"📍 Analyzing by coords: ({lat}, {lon}) label='{venue_name}'")

    live_data = fetch_live_data(venue_name)
    traffic_result = analyze_venue(venue_name, live_data)
    metro_result = fetch_nearest_metro(lat, lon)
    weather_result = fetch_weather(lat, lon)
    mappls_traffic = fetch_mappls_traffic(lat, lon)

    result = {
        **traffic_result,
        "location": {"latitude": lat, "longitude": lon},
        "nearest_metro_station": metro_result,
        "weather": weather_result,
        "mappls_live_traffic": mappls_traffic,
        "timestamp": datetime.now().isoformat()
    }

    # Save to input.json
    try:
        inputs = []
        if os.path.exists("data/input.json"):
            with open("data/input.json", "r", encoding="utf-8") as f:
                inputs = json.load(f)
        inputs.append(result)
        with open("data/input.json", "w", encoding="utf-8") as f:
            json.dump(inputs, f, indent=4)
    except Exception as e:
        logger.error(f"Error saving to input.json: {e}")

    # Generate decision
    decision = None
    try:
        historical_context = ""
        if os.path.exists("data/input.json"):
            with open("data/input.json", "r", encoding="utf-8") as f:
                historical_context += "RECENT TRAFFIC STATES:\n" + json.dumps(json.load(f)[-5:], indent=2) + "\n\n"
        if os.path.exists("data/output.json"):
            with open("data/output.json", "r", encoding="utf-8") as f:
                historical_context += "RECENT DECISIONS:\n" + json.dumps(json.load(f)[-5:], indent=2) + "\n\n"

        prompt_content = f"CURRENT INPUT STATE:\n{json.dumps(result)}\n\n"
        if historical_context:
            prompt_content = f"HISTORICAL CONTEXT:\n{historical_context}\n\n" + prompt_content
        prompt_content += f"SCHEMA:\n{OUTPUT_SCHEMA_DECISION}"

        response_json = call_openrouter_chat(
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT_DECISION},
                {"role": "user", "content": prompt_content}
            ],
            model="google/gemini-2.0-flash-001",
            temperature=0.2,
        )
        raw_decision = response_json["choices"][0]["message"]["content"]
        match = re.search(r"\{[\s\S]*\}", raw_decision)
        if match:
            decision = json.loads(match.group(0))
            outputs = []
            if os.path.exists("data/output.json"):
                with open("data/output.json", "r", encoding="utf-8") as f:
                    outputs = json.load(f)
            outputs.append(decision)
            with open("data/output.json", "w", encoding="utf-8") as f:
                json.dump(outputs, f, indent=4)
    except Exception as e:
        logger.error(f"Failed to generate decision for coords: {e}")
        decision = {
            "decision_summary": "Standard traffic protocols in effect.",
            "priority_level": "low",
            "signal_actions": [],
            "traffic_management_actions": ["Monitor area for congestion."],
            "public_advisories": ["No major advisories."],
            "risk_assessment": {"choke_probability": 0.1, "crash_risk": 0.05, "pedestrian_density": "low"},
            "map_visualization_flags": {"highlight_event_zone": False, "highlight_congestion": False, "show_metro_option": True, "alert_level": "green"},
            "next_review_in_minutes": 30,
            "confidence": 0.5
        }

    return {"analysis": result, "decision": decision}

@app.post("/output")
def generate_output_decision():
    input_path = "data/input.json"
    output_path = "data/output.json"
    if not os.path.exists(input_path): raise HTTPException(status_code=404, detail="No input")
    with open(input_path, "r") as f: input_data = json.load(f)[-1]
    try:
        response_json = call_openrouter_chat(
            messages=[{"role": "system", "content": SYSTEM_PROMPT_DECISION}, {"role": "user", "content": f"INPUT:\n{json.dumps(input_data)}\n\nSCHEMA:\n{OUTPUT_SCHEMA_DECISION}"}],
            model="google/gemini-2.0-flash-001",
            temperature=0.2,
        )
        raw = response_json["choices"][0]["message"]["content"]
    except Exception:
        response = client.chat.completions.create(
            model="google/gemini-2.0-flash-001",
            temperature=0.2,
            messages=[{"role": "system", "content": SYSTEM_PROMPT_DECISION}, {"role": "user", "content": f"INPUT:\n{json.dumps(input_data)}\n\nSCHEMA:\n{OUTPUT_SCHEMA_DECISION}"}]
        )
        raw = response.choices[0].message.content

    decision = json.loads(re.search(r"\{[\s\S]*\}", raw).group(0))
    if os.path.exists(output_path):
        with open(output_path, "r") as f: outputs = json.load(f)
    else: outputs = []
    outputs.append(decision)
    with open(output_path, "w") as f: json.dump(outputs, f, indent=4)
    return decision

@app.get("/inputs")
def get_inputs():
    if os.path.exists("data/input.json"):
        with open("data/input.json", "r") as f: return json.load(f)
    return []

@app.get("/outputs")
def get_outputs():
    if os.path.exists("data/output.json"):
        with open("data/output.json", "r") as f: return json.load(f)
    return []

@app.get("/data")
def get_all_data():
    inputs = []
    outputs = []
    if os.path.exists("data/input.json"):
        with open("data/input.json", "r") as f:
            inputs = json.load(f)
    if os.path.exists("data/output.json"):
        with open("data/output.json", "r") as f:
            outputs = json.load(f)
    return {"inputs": inputs, "outputs": outputs}

@app.get("/map")
def get_map():
    return FileResponse("index.html")

@app.get("/output.json")
def get_output_json():
    if os.path.exists("data/output.json"):
        return FileResponse("data/output.json")
    return {"error": "not found"}

@app.get("/")
def root():
    return {"status": "ok", "map_dashboard": "/map"}
