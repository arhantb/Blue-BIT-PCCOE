"""
Tram.AI WhatsApp Bot — FEATURE-3
Full-featured: commute planning + free-form area queries + metro navigation + itinerary
"""

import os
import re
import requests
from flask import Flask, request
from twilio.twiml.messaging_response import MessagingResponse
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000")
sessions = {}   # { whatsapp_number: { step, data } }

# ──────────────────────────────────────────────────────
# Pune Metro Station Data (both lines, accurate coords)
# ──────────────────────────────────────────────────────
PUNE_METRO = [
    # Purple Line (Line 1) — PCMC ↔ Swargate
    {"name": "Pimpri",                    "line": "Purple", "lat": 18.6279, "lon": 73.7997},
    {"name": "Sant Tukaramnagar",         "line": "Purple", "lat": 18.6214, "lon": 73.8008},
    {"name": "Nashik Phata",              "line": "Purple", "lat": 18.6133, "lon": 73.8002},
    {"name": "Kasarwadi",                 "line": "Purple", "lat": 18.6031, "lon": 73.8022},
    {"name": "Fugewadi",                  "line": "Purple", "lat": 18.5946, "lon": 73.8040},
    {"name": "Dapodi",                    "line": "Purple", "lat": 18.5869, "lon": 73.8060},
    {"name": "Bopodi",                    "line": "Purple", "lat": 18.5795, "lon": 73.8344},
    {"name": "Khadki",                    "line": "Purple", "lat": 18.5718, "lon": 73.8418},
    {"name": "Range Hills",               "line": "Purple", "lat": 18.5633, "lon": 73.8468},
    {"name": "Shivaji Nagar",             "line": "Purple", "lat": 18.5308, "lon": 73.8474},
    {"name": "Civil Court",               "line": "Purple", "lat": 18.5195, "lon": 73.8557},
    {"name": "Budhwar Peth",              "line": "Purple", "lat": 18.5143, "lon": 73.8565},
    {"name": "Mandai",                    "line": "Purple", "lat": 18.5082, "lon": 73.8571},
    {"name": "Swargate",                  "line": "Purple", "lat": 18.5000, "lon": 73.8578},
    # Aqua Line (Line 2) — Vanaz ↔ Ramwadi
    {"name": "Vanaz",                     "line": "Aqua",   "lat": 18.5076, "lon": 73.8076},
    {"name": "Ideal Colony",              "line": "Aqua",   "lat": 18.5088, "lon": 73.8148},
    {"name": "Nal Stop",                  "line": "Aqua",   "lat": 18.5101, "lon": 73.8250},
    {"name": "Garware College",           "line": "Aqua",   "lat": 18.5136, "lon": 73.8305},
    {"name": "Deccan Gymkhana",           "line": "Aqua",   "lat": 18.5157, "lon": 73.8394},
    {"name": "Chhatrapati Sambhaji Udyan","line": "Aqua",   "lat": 18.5173, "lon": 73.8432},
    {"name": "PMC",                       "line": "Aqua",   "lat": 18.5193, "lon": 73.8553},
    {"name": "Pune Railway Station",      "line": "Aqua",   "lat": 18.5203, "lon": 73.8686},
    {"name": "Ruby Hall Clinic",          "line": "Aqua",   "lat": 18.5270, "lon": 73.8793},
    {"name": "Bund Garden",               "line": "Aqua",   "lat": 18.5368, "lon": 73.8870},
    {"name": "Yerwada",                   "line": "Aqua",   "lat": 18.5500, "lon": 73.8953},
    {"name": "Kalyani Nagar",             "line": "Aqua",   "lat": 18.5481, "lon": 73.9042},
    {"name": "Ramwadi",                   "line": "Aqua",   "lat": 18.5488, "lon": 73.9150},
]

# ──────────────────────────────────────────────────────
# Intent keywords
# ──────────────────────────────────────────────────────
EVENT_KW  = ["event", "events", "happening", "going on", "festival", "concert", "show",
             "match", "game", "fair", "mela", "program", "programme", "function"]
METRO_KW  = ["metro", "station", "nearest metro", "metro near", "metro station"]
TRAFFIC_KW= ["traffic", "jam", "congestion", "route", "commute", "travel", "reach",
             "how to go", "how to reach"]
QUERY_KW  = EVENT_KW + METRO_KW + TRAFFIC_KW


def is_free_query(text: str) -> bool:
    t = text.lower()
    return any(kw in t for kw in QUERY_KW)


# ──────────────────────────────────────────────────────
# Math / geo helpers
# ──────────────────────────────────────────────────────
from math import radians, sin, cos, sqrt, atan2

def haversine(lat1, lon1, lat2, lon2):
    R = 6371
    dlat = radians(lat2 - lat1); dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    return R * 2 * atan2(sqrt(a), sqrt(1 - a))

def nearest_metros(lat, lon, n=3):
    ranked = sorted(PUNE_METRO, key=lambda s: haversine(lat, lon, s["lat"], s["lon"]))
    result = []
    for s in ranked[:n]:
        dist = haversine(lat, lon, s["lat"], s["lon"])
        walk_min = int(dist * 1000 / 80)  # ~80 m/min walking
        result.append({**s, "dist_km": round(dist, 2), "walk_min": walk_min})
    return result

def gmaps_link(lat, lon, label=""):
    label_enc = label.replace(" ", "+")
    return f"https://maps.google.com/?q={lat},{lon}({label_enc})"


# ──────────────────────────────────────────────────────
# Geocoding
# ──────────────────────────────────────────────────────
def geocode_place(place_name: str):
    query = place_name.strip()
    if "pune" not in query.lower() and "maharashtra" not in query.lower():
        query += ", Pune, India"
    try:
        resp = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": query, "format": "json", "limit": 1},
            headers={"User-Agent": "TramAI-WhatsApp-Bot/1.0"},
            timeout=8,
        )
        results = resp.json()
        if not results:
            return None
        r = results[0]
        lat, lon = float(r["lat"]), float(r["lon"])
        short = ", ".join(p.strip() for p in r.get("display_name","").split(",")[:2])
        return lat, lon, short
    except Exception:
        return None

def extract_area_from_query(text: str) -> str:
    """Attempt to extract a location from free-form text."""
    # Remove question words and common phrases
    clean = re.sub(
        r"(is there|are there|any|what|events?|happening|going on|near|around|"
        r"in|at|the|tell me about|show me|traffic|metro|station|nearest|how to|reach|travel)",
        " ", text, flags=re.IGNORECASE
    ).strip()
    clean = re.sub(r"\s+", " ", clean).strip()
    return clean if len(clean) > 2 else text


# ──────────────────────────────────────────────────────
# Backend API calls
# ──────────────────────────────────────────────────────
def call_backend_analyze_coords(lat, lon, label) -> dict:
    try:
        resp = requests.post(
            f"{BACKEND_URL}/analyze-coords",
            json={"lat": lat, "lon": lon, "label": label},
            timeout=90,
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        return {"error": str(e)}


# ──────────────────────────────────────────────────────
# Itinerary builder
# ──────────────────────────────────────────────────────
def build_itinerary(orig_lat, orig_lon, orig_label, dest_lat, dest_lon, dest_label, mappls_data=None):
    """Build a step-by-step travel itinerary including metro option."""
    lines = []

    road_dist = None
    road_min  = None
    if mappls_data and isinstance(mappls_data, dict):
        raw = mappls_data.get("distance_km") or mappls_data.get("distance")
        t   = (mappls_data.get("travel_time_min") or mappls_data.get("time_min")
               or mappls_data.get("duration"))
        if raw:
            try: road_dist = float(str(raw).replace("km","").strip())
            except: pass
        if t:
            try: road_min = float(str(t).replace("min","").strip())
            except: pass

    # Independent fallbacks — each resolved separately
    if not road_dist:
        road_dist = round(haversine(orig_lat, orig_lon, dest_lat, dest_lon), 1)
    if not road_min:
        road_min = max(5, round(road_dist / 0.4))  # ~24 km/h urban avg

    # Metro option: nearest metro to origin + nearest metro to destination
    orig_metros = nearest_metros(orig_lat, orig_lon, 1)
    dest_metros = nearest_metros(dest_lat, dest_lon, 1)
    o_metro = orig_metros[0]
    d_metro = dest_metros[0]

    metro_dist_between = haversine(o_metro["lat"], o_metro["lon"], d_metro["lat"], d_metro["lon"])
    metro_ride_min = max(5, int(metro_dist_between / 0.6))  # ~36 km/h metro speed
    metro_total_min = o_metro["walk_min"] + metro_ride_min + d_metro["walk_min"]

    lines.append("━━━━━━━━━━━━━━━━━━━━━━━━")
    lines.append("🗺️ *TRAVEL ITINERARY*")
    lines.append(f"📍 *{orig_label}  →  {dest_label}*")
    lines.append("")

    # Option A — Road
    lines.append("🚗 *Option A: By Road*")
    lines.append(f"  Distance: ~{road_dist} km")
    lines.append(f"  Time: ~{int(road_min)} min")
    lines.append(f"  🔗 Directions: {gmaps_link(dest_lat, dest_lon, dest_label)}")
    lines.append("")

    # Option B — Metro (only if same line or interchange is reasonable)
    same_line = o_metro["line"] == d_metro["line"]
    metro_label = "same line — no interchange" if same_line else f"interchange at PMC / Shivaji Nagar"
    lines.append("🚇 *Option B: By Metro*")
    lines.append(f"  Step 1: Walk to *{o_metro['name']}* ({o_metro['line']} Line)")
    lines.append(f"          ~{o_metro['walk_min']} min walk ({o_metro['dist_km']} km)")
    lines.append(f"          📌 {gmaps_link(o_metro['lat'], o_metro['lon'], o_metro['name'] + ' Metro')}")
    if not same_line:
        lines.append(f"  Step 2: Interchange at Shivaji Nagar / PMC")
        lines.append(f"  Step 3: Board *{d_metro['line']} Line* → *{d_metro['name']}*")
    else:
        lines.append(f"  Step 2: Board → *{d_metro['name']}* ({metro_ride_min} min ride)")
    lines.append(f"  Step 3: Walk to destination")
    lines.append(f"          ~{d_metro['walk_min']} min walk ({d_metro['dist_km']} km)")
    lines.append(f"          📌 {gmaps_link(d_metro['lat'], d_metro['lon'], d_metro['name'] + ' Metro')}")
    lines.append(f"  Total by Metro: ~{metro_total_min} min")
    lines.append("")

    # Recommendation
    if metro_total_min < road_min * 1.2:
        lines.append("💡 *Recommended: Take Metro* — faster and avoids traffic!")
    else:
        lines.append("💡 *Recommended: By Road* — metro adds extra walking time here.")

    return "\n".join(lines)


# ──────────────────────────────────────────────────────
# Area intelligence report (for free queries)
# ──────────────────────────────────────────────────────
def format_area_report(area_label: str, lat: float, lon: float, backend: dict) -> str:
    analysis = backend.get("analysis", {})
    decision = backend.get("decision", {})

    event   = analysis.get("event_context", {})
    traffic = analysis.get("traffic_prediction", {})
    weather = analysis.get("weather", {})
    metros  = nearest_metros(lat, lon, 3)
    advisories = decision.get("public_advisories", [])
    congestion = traffic.get("congestion_index", "N/A")
    severity   = traffic.get("severity", "N/A")
    alert      = decision.get("map_visualization_flags", {}).get("alert_level", "green").upper()

    lines = [
        f"🏙️ *Tram.AI — Area Intel: {area_label}*",
        "━━━━━━━━━━━━━━━━━━━━━━━━",
        "",
    ]

    # Events
    event_today = str(event.get("likely_event_today", ""))
    specific = str(event.get("specific_details", ""))
    attendance = str(event.get("estimated_attendance", "0"))

    # Safely handle the event details
    has_event = event_today and event_today.lower().strip() not in ["", "no", "false", "none", "n/a", "unknown"] and "no " not in event_today.lower()[:3]
    
    if has_event or specific.lower() not in ["", "none", "n/a", "no", "unknown"]:
        lines.append("🎪 *EVENTS TODAY*")
        if event_today:
            lines.append(f"  {event_today}")
        if attendance and attendance != "0" and attendance.lower() != "unknown":
            lines.append(f"  👥 Expected crowd: ~{attendance}")
        if specific and specific.lower() not in ["none", "n/a", "unknown"]:
            lines.append(f"  ℹ️ {specific}")
        lines.append("")
    else:
        lines.append("🎪 *Events:* No major events detected today")
        lines.append("")

    # Weather
    lines.append(f"🌤️ *Weather:* {weather.get('condition','N/A')} | {weather.get('temperature_c','?')}°C")
    lines.append("")

    # Traffic
    lines.append("🚦 *Traffic Status*")
    lines.append(f"  • Congestion: *{congestion}/100* ({severity})")
    lines.append(f"  • Alert: *{alert}*")
    peak = traffic.get("peak_period", {})
    if peak.get("start"):
        lines.append(f"  • Peak: {peak['start']} – {peak['end']} ⚠️ Avoid this window!")
    lines.append("")

    # Nearby Metro Stations
    lines.append("🚇 *NEARBY METRO STATIONS*")
    for i, m in enumerate(metros, 1):
        emoji = ["1️⃣", "2️⃣", "3️⃣"][i-1]
        lines.append(f"  {emoji} *{m['name']}* ({m['line']} Line)")
        lines.append(f"      {m['dist_km']} km • ~{m['walk_min']} min walk")
        lines.append(f"      📌 {gmaps_link(m['lat'], m['lon'], m['name'] + ' Metro Station Pune')}")
    lines.append("")

    # Advisories
    if advisories:
        lines.append("📢 *Advisories*")
        for adv in advisories[:2]:
            lines.append(f"  ℹ️ {adv}")
        lines.append("")

    # Traffic advice
    if isinstance(congestion, (int, float)):
        if congestion > 70:
            lines.append("🔴 *Heavy congestion* — use metro or travel off-peak.")
        elif congestion > 40:
            lines.append("🟡 *Moderate traffic* — plan extra buffer time.")
        else:
            lines.append("🟢 *Clear roads* — good time to travel!")
    lines.append("")
    lines.append(f"_Powered by Tram.AI • {analysis.get('timestamp','')[:16]}_")
    lines.append("_Type *hi* to plan a commute or ask about any area!_")
    return "\n".join(lines)


# ──────────────────────────────────────────────────────
# Commute report formatter
# ──────────────────────────────────────────────────────
def format_commute_report(orig_label, orig_lat, orig_lon,
                           dest_label, dest_lat, dest_lon,
                           time_minutes, backend) -> str:
    if "error" in backend and "analysis" not in backend:
        return f"⚠️ Backend error: {backend['error']}\nPlease try again."

    analysis = backend.get("analysis", {})
    decision = backend.get("decision", {})
    traffic  = analysis.get("traffic_prediction", {})
    weather  = analysis.get("weather", {})
    event    = analysis.get("event_context", {})
    advisories   = decision.get("public_advisories", [])
    mgmt_actions = decision.get("traffic_management_actions", [])
    congestion   = traffic.get("congestion_index", "N/A")
    severity     = traffic.get("severity", "N/A")
    alert        = decision.get("map_visualization_flags", {}).get("alert_level", "green").upper()
    mappls_data  = analysis.get("mappls_live_traffic", {})

    lines = [
        "🚦 *Tram.AI Commute Report*",
        "━━━━━━━━━━━━━━━━━━━━━",
        f"🚩 *From:* {orig_label}",
        f"📍 *To:* {dest_label}",
        f"🕐 *Time available:* {time_minutes} min",
        "",
        f"🌤️ *Weather:* {weather.get('condition','N/A')} | {weather.get('temperature_c','?')}°C",
        "",
        "🚗 *Live Traffic*",
        f"  • Congestion: *{congestion}/100* ({severity})",
        f"  • Alert: *{alert}*",
    ]

    peak = traffic.get("peak_period", {})
    if peak.get("start"):
        lines.append(f"  • Peak: {peak['start']} – {peak['end']} ⚠️")

    event_today = str(event.get("likely_event_today", ""))
    attendance = str(event.get("estimated_attendance", "0"))
    
    has_event = event_today and event_today.lower().strip() not in ["", "no", "false", "none", "n/a", "unknown"] and "no " not in event_today.lower()[:3]
    
    if has_event:
        lines += ["", f"🎪 *Event:* {event_today}"]
        if attendance and attendance != "0" and attendance.lower() != "unknown":
            lines.append(f"  👥 Crowd: ~{attendance}")

    if mgmt_actions:
        lines += ["", "⚡ *Traffic Actions:*"]
        for act in mgmt_actions[:2]:
            lines.append(f"  • {act}")

    if advisories:
        lines += ["", "📢 *Advisories:*"]
        for adv in advisories[:2]:
            lines.append(f"  ℹ️ {adv}")

    # Time warning
    lines.append("")
    if isinstance(congestion, (int, float)):
        if time_minutes < 15 and congestion > 60:
            lines.append("⚠️ *Warning:* Very little time + heavy congestion. Leave *NOW* or take metro!")
        elif congestion > 70:
            lines.append("🔴 Heavy traffic! Add 15-20 min buffer or try metro.")
        elif congestion > 40:
            lines.append("🟡 Moderate traffic. Should make it — stay alert.")
        else:
            lines.append("🟢 Clear roads! You're good to go.")

    # Full itinerary
    lines.append("")
    lines.append(build_itinerary(
        orig_lat, orig_lon, orig_label,
        dest_lat, dest_lon, dest_label,
        mappls_data
    ))

    lines += ["", f"_Powered by Tram.AI • {analysis.get('timestamp','')[:16]}_"]
    return "\n".join(lines)


# ──────────────────────────────────────────────────────
# Main conversation handler
# ──────────────────────────────────────────────────────
def handle_message(sender: str, body: str) -> str:
    body       = body.strip()
    body_lower = body.lower()

    session = sessions.get(sender, {"step": "idle", "data": {}})
    step    = session["step"]
    data    = session["data"]

    # ── RESET ──────────────────────────────────────────
    if body_lower in ("reset", "restart", "new", "menu", "cancel", "start over"):
        sessions[sender] = {"step": "idle", "data": {}}
        return "🔄 Reset! Say *hi* to plan a commute or ask any area question."

    # ── IDLE: detect intent ────────────────────────────
    if step == "idle":
        if any(g in body_lower for g in ("hi", "hello", "hey", "hii", "helo", "namaste")):
            sessions[sender] = {"step": "ask_commute", "data": {}}
            return (
                "👋 *Hey! Welcome to Tram.AI* 🚦\n\n"
                "I can help you with:\n"
                "  🗺️ *Commute planning* — type *go*\n"
                "  🎪 *Area events & traffic* — ask e.g.:\n"
                "       _\"Any events near Swargate?\"_\n"
                "       _\"Traffic at Shivajinagar\"_\n"
                "       _\"Metro near Magarpatta\"_\n\n"
                "What would you like to do?"
            )

        # Free-form query — handle directly (treat anything else as a location/free check)
        return handle_free_query(sender, body)

    # ── ASK COMMUTE ────────────────────────────────────
    if step == "ask_commute":
        # Check if they typed a free-form query here instead
        if is_free_query(body):
            sessions[sender] = {"step": "idle", "data": {}}
            return handle_free_query(sender, body)

        sessions[sender] = {"step": "ask_origin", "data": data}
        return (
            "📍 *Where are you starting from?*\n\n"
            "Type the area or landmark name.\n"
            "_Examples: Deccan Gymkhana, Pune Railway Station, Kothrud_"
        )

    # ── ASK ORIGIN ────────────────────────────────────
    if step == "ask_origin":
        result = geocode_place(body)
        if not result:
            return "❌ Couldn't find that location. Try a more specific name.\n_Example: Shivajinagar, Pune_"
        lat, lon, display = result
        data["origin"] = (lat, lon)
        data["origin_label"] = display
        sessions[sender] = {"step": "ask_destination", "data": data}

        # Show nearest metros to origin
        metros = nearest_metros(lat, lon, 2)
        metro_txt = ""
        for m in metros:
            metro_txt += f"\n  🚇 {m['name']} ({m['line']} Line) — {m['dist_km']} km"

        return (
            f"✅ *Origin:* {display}{metro_txt}\n\n"
            "📍 *Where do you want to go?*\n\n"
            "_Examples: Hinjewadi IT Park, Magarpatta City, Baner_"
        )

    # ── ASK DESTINATION ───────────────────────────────
    if step == "ask_destination":
        result = geocode_place(body)
        if not result:
            return "❌ Couldn't find that. Try again with a clearer name.\n_Example: Wakad, Pune_"
        lat, lon, display = result
        data["destination"] = (lat, lon)
        data["destination_label"] = display
        sessions[sender] = {"step": "ask_time", "data": data}

        metros = nearest_metros(lat, lon, 2)
        metro_txt = ""
        for m in metros:
            metro_txt += f"\n  🚇 {m['name']} ({m['line']} Line) — {m['dist_km']} km"

        return (
            f"✅ *Destination:* {display}{metro_txt}\n\n"
            f"🛣️ Route: *{data['origin_label']}* → *{display}*\n\n"
            "⏱️ *How many minutes do you have to reach?*\n"
            "_Just reply with a number. Example: 30_"
        )

    # ── ASK TIME ──────────────────────────────────────
    if step == "ask_time":
        nums = re.findall(r"\d+", body)
        if not nums:
            return "❌ Please send just the number of minutes.\n_Example: 30_"

        time_minutes = int(nums[0])
        dest_lat, dest_lon = data["destination"]
        orig_lat, orig_lon = data["origin"]
        dest_label = data["destination_label"]
        orig_label = data["origin_label"]

        sessions[sender] = {"step": "idle", "data": {}}

        backend_data = call_backend_analyze_coords(dest_lat, dest_lon, dest_label)
        reply = format_commute_report(
            orig_label, orig_lat, orig_lon,
            dest_label, dest_lat, dest_lon,
            time_minutes, backend_data
        )
        return reply + "\n\n_Type *hi* for another trip or ask any area question!_"

    # Fallback
    sessions[sender] = {"step": "idle", "data": {}}
    return "🤖 Type *hi* to start or ask about any Pune area!"


def handle_free_query(sender: str, body: str) -> str:
    """Handle free-form area queries like 'any events near Swargate?' or 'traffic at Hinjewadi'."""
    # Extract area name
    area_text = extract_area_from_query(body)
    if not area_text.strip():
        area_text = body

    result = geocode_place(area_text)
    if not result:
        # Try the original full body as fallback
        result = geocode_place(body)

    if not result:
        return (
            "❌ Couldn't identify the area from your query.\n\n"
            "Try being more specific:\n"
            "  • _\"Events near Swargate\"_\n"
            "  • _\"Traffic at Hinjewadi Phase 1\"_\n"
            "  • _\"Metro near Magarpatta City\"_"
        )

    lat, lon, area_label = result

    # If specifically asking for metro only — skip backend call
    if any(kw in body.lower() for kw in ["metro", "station"]) and \
       not any(kw in body.lower() for kw in ["event", "traffic", "how to", "reach"]):
        metros = nearest_metros(lat, lon, 3)
        lines = [
            f"🚇 *Metro Stations near {area_label}*",
            "━━━━━━━━━━━━━━━━━━━━━━━━",
            "",
        ]
        for i, m in enumerate(metros, 1):
            emoji = ["1️⃣","2️⃣","3️⃣"][i-1]
            lines.append(f"{emoji} *{m['name']}* ({m['line']} Line)")
            lines.append(f"   {m['dist_km']} km away • ~{m['walk_min']} min walk")
            lines.append(f"   📌 {gmaps_link(m['lat'], m['lon'], m['name']+' Metro')}")
            lines.append("")
        lines.append("_Type *hi* to plan a full commute!_")
        return "\n".join(lines)

    # Full backend analysis
    # CRITICAL FIX: Pass the actual user-searched area_text (e.g., 'IMCC Pune')
    # instead of the generic Nominatim area_label ('Mayur Colony') so the web scraper works accurately.
    backend_data = call_backend_analyze_coords(lat, lon, area_text)

    if "error" in backend_data and "analysis" not in backend_data:
        return f"⚠️ Couldn't fetch area data right now.\nError: {backend_data['error']}"

    # Capitalize it nicely for the report
    display_title = area_text.strip().title()
    return format_area_report(display_title, lat, lon, backend_data)


# ──────────────────────────────────────────────────────
# Twilio webhook
# ──────────────────────────────────────────────────────
@app.route("/whatsapp", methods=["POST"])
def whatsapp_webhook():
    sender = request.form.get("From", "unknown")
    body   = request.form.get("Body", "").strip()
    app.logger.info(f"MSG from {sender}: {body!r}")
    reply_text = handle_message(sender, body)
    resp = MessagingResponse()
    resp.message().body(reply_text)
    return str(resp), 200, {"Content-Type": "text/xml"}

@app.route("/health")
def health():
    return {"status": "ok", "backend": BACKEND_URL}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print(f"🤖 Tram.AI WhatsApp Bot → http://0.0.0.0:{port}/whatsapp")
    print(f"📡 Backend: {BACKEND_URL}")
    app.run(host="0.0.0.0", port=port, debug=True)
