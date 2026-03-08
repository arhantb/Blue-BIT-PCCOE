import sys
import os
import json
from pprint import pprint

sys.path.append(r"f:\AISSMS-TRAFFIC(2)\BACKEND-WEBSCRAPER")

from main import fetch_live_data, analyze_venue

venue_name = "IMCC Pune"
print("Fetching live data...")
live_data = fetch_live_data(venue_name)
print("--- Live Data ---")
print(live_data)
print("-----------------")

print("\nAnalyzing venue...")
res = analyze_venue(venue_name, live_data)
print("--- Result ---")
pprint(res)
print("-----------------")
