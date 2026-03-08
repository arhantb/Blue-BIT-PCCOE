import re
import json
import requests
from bs4 import BeautifulSoup
from openai import OpenAI
from app.core.config import settings
from app.core.constants import SYSTEM_PROMPT_DECISION, OUTPUT_SCHEMA_DECISION

client = OpenAI(
    base_url=settings.OPENROUTER_BASE_URL,
    api_key=settings.OPENROUTER_API_KEY,
)

def fetch_live_data(venue_name: str) -> str:
    try:
        search_query = f"{venue_name} Pune fest hackathon event schedule 2026"
        url = f"https://html.duckduckgo.com/html/?q={requests.utils.quote(search_query)}"
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=15)
        soup = BeautifulSoup(response.text, "html.parser")
        results = ""
        for i, el in enumerate(soup.select(".result")):
            if i >= 8: break
            title = el.select_one(".result__title")
            snippet = el.select_one(".result__snippet")
            title_text = title.get_text(strip=True) if title else ""
            snippet_text = snippet.get_text(strip=True) if snippet else ""
            if title_text or snippet_text:
                results += f"Title: {title_text}\nSnippet: {snippet_text}\n---\n"
        return results if results else "No reliable live data found."
    except Exception as e:
        return f"Live search unavailable: {str(e)}"

def analyze_venue(venue_name: str, live_data: str) -> dict:
    system_prompt = f"You are a Pune Smart City Traffic AI. Return ONLY JSON. Search {live_data}. Output keys: venue(name, type, capacity), event_context(likely_event_today, date, estimated_attendance), traffic_prediction(severity, congestion_index, confidence, peak_period(start, end, label, description)), impact_zones(radius, level, roads_affected)."
    response = client.chat.completions.create(
        model="google/gemini-2.0-flash-001",
        temperature=0.25,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"VENUE: {venue_name}\nLIVE DATA: {live_data}"}
        ]
    )
    content = response.choices[0].message.content.strip()
    match = re.search(r"\{[\s\S]*\}", content)
    return json.loads(match.group(0))

def generate_decision(input_data: dict) -> dict:
    response = client.chat.completions.create(
        model="google/gemini-2.0-flash-001",
        temperature=0.2,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT_DECISION},
            {"role": "user", "content": f"INPUT:\n{json.dumps(input_data)}\n\nSCHEMA:\n{OUTPUT_SCHEMA_DECISION}"}
        ]
    )
    content = response.choices[0].message.content.strip()
    match = re.search(r"\{[\s\S]*\}", content)
    return json.loads(match.group(0))
