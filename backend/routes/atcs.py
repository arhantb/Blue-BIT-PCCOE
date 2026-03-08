from fastapi import APIRouter, UploadFile, File, Form
import shutil
import os
import time
from dotenv import load_dotenv

load_dotenv()
from typing import Dict
from services.video_processor import VideoProcessor
from services.intelligence import SignalOptimizer, KalmanFilter
from services.notification import NotificationService

router = APIRouter()

# Initialize Services
optimizer = SignalOptimizer()
processor = VideoProcessor()
kalman_filters = {
    "north": KalmanFilter(),
    "south": KalmanFilter(),
    "east": KalmanFilter(),
    "west": KalmanFilter()
}

# Twilio Integration
notification_service = NotificationService(
    account_sid=os.getenv("TWILIO_ACCOUNT_SID"),
    auth_token=os.getenv("TWILIO_AUTH_TOKEN"),
    from_number=os.getenv("TWILIO_FROM_NUMBER")
)

# Global simulation state
SIMULATION_SESSION = {
    "start_time": None,
    "last_poll_time": 0.0,
    "emergency_history": {
        "north": 0, "south": 0, "east": 0, "west": 0
    }
}

# Intelligence Feed for Dashboard Sync
LATEST_DATA: Dict[str, Dict] = {
    "VIT": {},
    "AISSMS": {},
    "MIT": {}
}

# Persistent History for Output Page
DECISION_HISTORY = []

def get_default_data(sector: str):
    if sector == "VIT":
        return {
            "input": {
                "venue": {"name": "VIT Pune", "type": "Institution", "capacity": "5,000+"},
                "event_context": {"likely_event_today": "Alacrity Fest Day 3", "date": time.strftime("%Y-%m-%d"), "estimated_attendance": "4,500"},
                "traffic_prediction": {"severity": "MODERATE", "congestion_index": 4.5, "confidence": 92, "peak_period": {"start": "16:00", "end": "18:30", "label": "Student Departure", "description": "Peak outflow post-event"}},
                "impact_zones": [{"radius": "500m", "level": 2, "roads_affected": "Bibwewadi Road, Lullanagar Chowk"}],
                "location": {"latitude": 18.4635, "longitude": 73.8682, "google_maps_link": ""},
                "weather": {"condition": "Clear", "temperature_c": 28, "traffic_weather_impact": "Negligible"},
                "mappls_live_traffic": {"Travel Time (min)": 18, "Average Speed (km/h)": 22, "Congestion Level": "Moderate"}
            },
            "output": {
                "decision_summary": "Anticipate moderate congestion due to VIT's Alacrity Fest Day 3, particularly during student departure. Proactive signal adjustments and public advisories are needed to manage traffic flow around Bibwewadi Road and Lullanagar Chowk.",
                "priority_level": "medium",
                "signal_actions": [
                    {"junction_area": "Bibwewadi Road - VIT Main Gate", "east_west_green_time_sec": 45, "north_south_green_time_sec": 60, "reason": "Prioritize outflow from VIT during peak departure hours (4:00 PM - 6:30 PM) to prevent immediate choke points."},
                    {"junction_area": "Lullanagar Chowk", "east_west_green_time_sec": 50, "north_south_green_time_sec": 55, "reason": "Slightly increase green time for traffic moving away from VIT towards Kondhwa Road to facilitate dispersion."}
                ],
                "traffic_management_actions": [
                    "Deploy traffic wardens/police personnel at Bibwewadi Road near VIT and Lullanagar Chowk from 3:30 PM to 7:00 PM.",
                    "Monitor real-time traffic conditions via CCTV and Mappls Live Traffic for immediate adjustments.",
                    "Ensure clear access for emergency services around VIT and major arterial roads.",
                    "Consider temporary 'No Parking' zones on Bibwewadi Road adjacent to VIT if congestion escalates."
                ],
                "public_advisories": [
                    "ATTENTION: Expect moderate traffic congestion around VIT Pune (Bibwewadi Road, Lullanagar Chowk) between 4:00 PM and 6:30 PM today due to the Alacrity Fest. Please plan your commute accordingly.",
                    "Commuters are advised to use alternative routes if possible or allow for extra travel time when passing through Bibwewadi and Kondhwa areas.",
                    "Public transport is recommended for those attending or traveling near VIT Pune."
                ],
                "risk_assessment": {"choke_probability": 0.6, "crash_risk": 0.4, "pedestrian_density": "high"},
                "map_visualization_flags": {"highlight_event_zone": True, "highlight_congestion": True, "show_metro_option": False, "alert_level": "orange"},
                "next_review_in_minutes": 30,
                "confidence": 0.7
            }
        }
    elif sector == "MIT":
        return {
            "input": {
                "venue": {"name": "MIT Pune", "type": "Institution", "capacity": "8,000+"},
                "event_context": {"likely_event_today": "Tech Symposium", "date": time.strftime("%Y-%m-%d"), "estimated_attendance": "2,800"},
                "traffic_prediction": {"severity": "LOW", "congestion_index": 2.5, "confidence": 94, "peak_period": {"start": "10:00", "end": "12:00", "label": "Event Mid-Day", "description": "Stable influx/outflux"}},
                "impact_zones": [{"radius": "400m", "level": 1, "roads_affected": "Paud Road, MIT College Road"}],
                "location": {"latitude": 18.5204, "longitude": 73.8567, "google_maps_link": ""},
                "weather": {"condition": "Clear Sky", "temperature_c": 27, "traffic_weather_impact": "None"},
                "mappls_live_traffic": {"Travel Time (min)": 14, "Average Speed (km/h)": 30, "Congestion Level": "Low"}
            },
            "output": {
                "decision_summary": "Anticipating low to moderate traffic impact due to the Tech Symposium at MIT Pune. Focus on maintaining smooth flow on Paud Road and MIT College Road during peak event hours. No significant congestion or safety concerns are currently identified.",
                "priority_level": "low",
                "signal_actions": [
                    {"junction_area": "Paud Road - MIT College Road Intersection", "east_west_green_time_sec": 70, "north_south_green_time_sec": 50, "reason": "Adjusting signal timings to prioritize traffic flow on Paud Road and MIT College Road during the morning peak event period (10:00-12:00) to accommodate increased vehicle and pedestrian movement towards MIT Pune. This is a minor adjustment given the low predicted severity."}
                ],
                "traffic_management_actions": [
                    "Monitor live traffic cameras around MIT Pune, Paud Road, and MIT College Road from 09:30 to 12:30.",
                    "Deploy one traffic warden at the MIT College Road entrance from 09:45 to 12:15 for pedestrian and vehicle management.",
                    "Ensure clear access to Anandnagar Metro Station for attendees opting for public transport."
                ],
                "public_advisories": [
                    "Attendees of the Tech Symposium at MIT Pune are advised to use public transport, especially the Pune Metro to Anandnagar station, to avoid potential minor delays.",
                    "Motorists in the vicinity of MIT Pune (Paud Road, MIT College Road) between 10:00 AM and 12:00 PM may experience minor increased traffic volume. Please drive cautiously."
                ],
                "risk_assessment": {"choke_probability": 0.15, "crash_risk": 0.1, "pedestrian_density": "moderate"},
                "map_visualization_flags": {"highlight_event_zone": True, "highlight_congestion": False, "show_metro_option": True, "alert_level": "green"},
                "next_review_in_minutes": 60,
                "confidence": 0.65
            }
        }
    else: # AISSMS (Baseline)
        return {
            "input": {
                "venue": {"name": "AISSMS COE", "type": "Institution", "capacity": "4,000+"},
                "event_context": {"likely_event_today": "Standard Academic Day", "date": time.strftime("%Y-%m-%d"), "estimated_attendance": "3,200"},
                "traffic_prediction": {"severity": "CLEAR", "congestion_index": 1.5, "confidence": 98, "peak_period": {"start": "08:00", "end": "10:00", "label": "Morning Commute", "description": "Regular traffic pattern"}},
                "impact_zones": [{"radius": "200m", "level": 0, "roads_affected": "Kennedy Road, Elphinstone Road"}],
                "location": {"latitude": 18.5313, "longitude": 73.8657, "google_maps_link": ""},
                "weather": {"condition": "Clear", "temperature_c": 28, "traffic_weather_impact": "Negligible"},
                "mappls_live_traffic": {"Travel Time (min)": 10, "Average Speed (km/h)": 38, "Congestion Level": "Clear"}
            },
            "output": {
                "decision_summary": "Traffic is currently clear with no events. Maintain standard traffic flow and monitor for any unexpected changes.",
                "priority_level": "low",
                "signal_actions": [],
                "traffic_management_actions": [
                    "Maintain standard traffic signal timings.",
                    "Monitor Kennedy Road and Elphinstone Road for morning commute build-up."
                ],
                "public_advisories": [
                    "No traffic advisories currently in effect.",
                    "Expect regular morning commute traffic between 8:00 AM and 10:00 AM."
                ],
                "risk_assessment": {"choke_probability": 0.05, "crash_risk": 0.05, "pedestrian_density": "moderate"},
                "map_visualization_flags": {"highlight_event_zone": False, "highlight_congestion": False, "show_metro_option": False, "alert_level": "green"},
                "next_review_in_minutes": 30,
                "confidence": 0.85
            }
        }

def seed_initial_state():
    """Seeds the global state with the specific high-fidelity narratives requested by the user."""
    # 1. VIT Alacrity Fest
    vit_data = get_default_data("VIT")
    LATEST_DATA["VIT"] = vit_data
    DECISION_HISTORY.append(vit_data)
    
    # 2. AISSMS Standard Clear
    aissms_data = get_default_data("AISSMS")
    LATEST_DATA["AISSMS"] = aissms_data
    DECISION_HISTORY.append(aissms_data)
    
    # 3. MIT Tech Symposium (Detailed)
    mit_data_1 = get_default_data("MIT")
    LATEST_DATA["MIT"] = mit_data_1
    DECISION_HISTORY.append(mit_data_1)
    
    # 4. MIT Multi-Event (Alumni Meet & Expo)
    # We create a slight variation of the MIT data for the 4th log
    mit_data_2 = get_default_data("MIT")
    mit_data_2["output"]["decision_summary"] = "Manage traffic flow around MIT Pune due to Tech Symposium, Innovation Expo, and Alumni Meet. Traffic impact is expected to be low."
    mit_data_2["output"]["signal_actions"] = [
        {"junction_area": "Paud Road - MIT College Road Intersection", "east_west_green_time_sec": 45, "north_south_green_time_sec": 40, "reason": "Slightly increase Paud Road green time to accommodate event traffic."},
        {"junction_area": "Karve Road - MIT College Road Intersection", "east_west_green_time_sec": 50, "north_south_green_time_sec": 35, "reason": "Adjust green time to optimize flow on Karve Road."}
    ]
    mit_data_2["output"]["traffic_management_actions"] = [
        "Deploy traffic wardens at Paud Road and MIT College Road intersection to manage pedestrian and vehicle flow.",
        "Monitor traffic flow near Anandnagar metro station and adjust signal timings if needed to facilitate metro access.",
        "Coordinate with event organizers to encourage attendees to use public transport, especially the metro."
    ]
    mit_data_2["output"]["public_advisories"] = [
        "Expect minor traffic delays around MIT Pune due to ongoing events.",
        "Consider using the Anandnagar metro station to avoid traffic congestion.",
        "Follow traffic warden instructions for smooth traffic flow."
    ]
    mit_data_2["output"]["risk_assessment"] = {"choke_probability": 0.1, "crash_risk": 0.05, "pedestrian_density": "moderate"}
    mit_data_2["output"]["map_visualization_flags"] = {"highlight_event_zone": True, "highlight_congestion": False, "show_metro_option": True, "alert_level": "green"}
    mit_data_2["output"]["confidence"] = 0.7
    DECISION_HISTORY.append(mit_data_2)

# Call seed at module level
seed_initial_state()

# Internal mapping for simulation
def map_to_schema(sector: str, results: Dict, signal_plan: Dict):
    """Maps internal simulation results to the high-fidelity ATCSDecisionSchema."""
    
    # Calculate congestion index based on total weighted queue
    total_q = sum(res["weighted_queue"] for res in results.values())
    congestion = min(10.0, total_q / 10.0)
    severity = "CLEAR"
    if congestion > 7: severity = "HIGH"
    elif congestion > 4: severity = "MODERATE"
    elif congestion > 2: severity = "LOW"
    
    # Determine priority level
    priority = "high" if signal_plan.get("safety_override") or severity == "HIGH" else "low"
    
    return {
        "input": {
            "venue": {"name": sector, "type": "Institution", "capacity": "5,000+"},
            "event_context": {
                "likely_event_today": "Active Research & Training",
                "date": time.strftime("%Y-%m-%d"),
                "estimated_attendance": "3,450",
                "decision_id": time.time()
            },
            "traffic_prediction": {
                "severity": severity,
                "congestion_index": round(float(congestion), 1),
                "confidence": 95,
                "peak_period": {
                    "start": "08:00",
                    "end": "11:00",
                    "label": "Campus Entry Peak",
                    "description": "Primary institutional arrival window"
                }
            },
            "impact_zones": [
                {"radius": "200m", "level": 1, "roads_affected": "North/South Corridor"},
                {"radius": "400m", "level": 2, "roads_affected": "East/West Access Routes"}
            ],
            "location": {
                "latitude": 18.5313 if sector == "AISSMS" else (18.4635 if sector == "VIT" else 18.5204),
                "longitude": 73.8657 if sector == "AISSMS" else (73.8682 if sector == "VIT" else 73.8567),
                "google_maps_link": ""
            },
            "weather": {
                "condition": "Clear Sky",
                "temperature_c": 28,
                "humidity_percent": 45,
                "traffic_weather_impact": "Dry roads; optimal traction for all phases."
            },
            "mappls_live_traffic": {
                "Average Speed (km/h)": round(35 - (congestion * 2), 1),
                "Travel Time (min)": int(10 + congestion * 3),
                "Congestion Level": severity.capitalize(),
                "Traffic Delay (min)": int(congestion * 2),
                "Distance (km)": 2.5
            }
        },
        "output": {
            "decision_summary": signal_plan.get("reasoning", "Adaptive signal timing optimized for current load."),
            "priority_level": priority,
            "signal_actions": [
                {
                    "junction_area": "MAIN_INTERSECTION",
                    "east_west_green_time_sec": signal_plan["splits"].get("east", 30),
                    "north_south_green_time_sec": signal_plan["splits"].get("north", 30),
                    "reason": signal_plan.get("selected_phase", "Load Balanced")
                }
            ],
            "traffic_management_actions": [
                "Adjusting Phase Splits",
                "Priority Clearing Enabled" if priority == "high" else "Steady State Flow"
            ],
            "public_advisories": [
                "Expect minor delays at main entry" if severity != "CLEAR" else "Fluency maintained",
                "Follow digital marshal cues"
            ],
            "risk_assessment": {
                "choke_probability": round(float(congestion / 10), 2),
                "crash_risk": 0.02 if severity == "CLEAR" else 0.08,
                "pedestrian_density": "High (Academic Rush Hour)"
            },
            "map_visualization_flags": {
                "highlight_event_zone": True,
                "highlight_congestion": severity != "CLEAR",
                "show_metro_option": sector == "MIT",
                "alert_level": "red" if severity == "HIGH" else ("orange" if severity == "MODERATE" else "green")
            },
            "next_review_in_minutes": 1,
            "confidence": 0.98
        }
    }

@router.post("/upload-intersection")
async def upload_intersection(
    north: UploadFile = File(...),
    south: UploadFile = File(...),
    east: UploadFile = File(...),
    west: UploadFile = File(...),
    task_type: str = Form("frame") # Use Form to capture from FormData
):
    os.makedirs("temp_uploads", exist_ok=True)
    files = {"north": north, "south": south, "east": east, "west": west}
    file_paths = {}

    # Save files
    for direction, file in files.items():
        temp_path = f"temp_uploads/{direction}_{file.filename}"
        if not os.path.exists(temp_path):
            with open(temp_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        file_paths[direction] = temp_path

    # --- BATCH PRE-ANALYSIS MODE ---
    if task_type == "pre-analysis":
        print("\n[SYSTEM] INITIATING GLOBAL BATCH INTELLIGENCE SCAN...")
        batch_results = {}
        for direction, path in file_paths.items():
            analysis = processor.analyze_full_video(path, direction)
            batch_results[direction] = analysis
            print(f"[BATCH] {direction.upper()} | Agg Pressure: {analysis['pressure']} | Avg Queue: {analysis['avg_queue']}")

        priority_sequence = sorted(
            batch_results.keys(), 
            key=lambda x: batch_results[x]["pressure"], 
            reverse=True
        )
        print(f"[SYSTEM] SCAN COMPLETE. RANKING: {' -> '.join(priority_sequence).upper()}\n")
        
        return {
            "status": "success",
            "task": "pre-analysis",
            "priority_sequence": priority_sequence,
            "batch_telemetry": batch_results
        }

    # --- STANDARD FRAME MODE ---
    now = time.time()
    last_poll = SIMULATION_SESSION.get("last_poll_time", 0.0)
    
    # Reset if simulation restarted or first run
    if SIMULATION_SESSION["start_time"] is None or (last_poll and now - last_poll > 10):
        SIMULATION_SESSION["start_time"] = now
        SIMULATION_SESSION["emergency_history"] = {"north": 0, "south": 0, "east": 0, "west": 0}
    
    SIMULATION_SESSION["last_poll_time"] = now
    elapsed = now - (SIMULATION_SESSION["start_time"] or now)
    
    results = {}
    weighted_queues = {}
    confirmed_emergency = False
    confirmed_dir = None

    for direction, path in file_paths.items():
        detection = processor.process_frame(path, direction, elapsed)
        
        # 1. Temporal Emergency Validation
        history = SIMULATION_SESSION["emergency_history"]
        if not isinstance(history, dict):
             history = {}
             SIMULATION_SESSION["emergency_history"] = history

        if detection.get("emergency_detected"):
            history[direction] += 1
            print(f"[SYSTEM] Emergency Spotting in {direction.upper()} (Count: {history[direction]}/2)")
        else:
            # Soft reset: Decrement instead of zeroing to handle flickering
            history[direction] = max(0, history[direction] - 1)
        
        is_validated = history[direction] >= 2 # Lowered from 3
        if is_validated and not confirmed_emergency:
            confirmed_emergency = True
            confirmed_dir = direction
            print(f"[SYSTEM] Emergency CONFIRMED in {direction.upper()} - Dispatching Dispatcher...")
            # Trigger Twilio Voice Alert
            notification_service.notify_emergency(direction, detection.get('emergency_type', 'Emergency Vehicle'))

        # 2. Weighted Queue Calculation (MATCH STATED USER FORMAT)
        cats = detection.get('categories', {})
        w_queue = float(
            cats.get('car', 0) * 1.0 +
            cats.get('motorcycle', 0) * 0.5 +
            cats.get('bus', 0) * 2.5 +
            cats.get('truck', 0) * 3.0 +
            cats.get('emergency', 0) * 5.0
        )
        
        smoothed = float(kalman_filters[direction].update(w_queue))
        
        results[direction] = {
            **detection,
            "emergency_validated": is_validated,
            "consecutive_frames": history[direction],
            "weighted_queue": float(f"{w_queue:.1f}"),
            "smoothed_queue": float(f"{smoothed:.1f}"),
            "pressure": 0.0 # Placeholder
        }
        weighted_queues[direction] = smoothed

    # 3. Dynamic Optimization
    signal_plan = optimizer.calculate_plan(
        queues=weighted_queues,
        emergency_flag=confirmed_emergency,
        emergency_dir=confirmed_dir
    )

    for d in results:
        results[d]["pressure"] = signal_plan["pressures"].get(d, 0.0)
        results[d]["assigned_green"] = signal_plan["splits"].get(d, 0)
        results[d]["split_percent"] = round((results[d]["assigned_green"] / (sum(signal_plan["splits"].values()) or 1)) * 100)

    # Clean UI Logging
    for d in ["north", "south", "east", "west"]:
        res = results[d]
        e_status = "!! EMERGENCY !!" if res['emergency_detected'] else "Normal"
        print(f"[{d.upper()}] T={elapsed:.1f}s | Q: {res['raw_queue']} | {e_status} | Cats: {res['categories']}")
    
    print(f"--- ATCS LIVE UPDATE (T={elapsed:.1f}s) | Plan: {signal_plan['mode']} -> {signal_plan['selected_phase']} ---\n")

    # 4. Persistence for Dashboard Sync
    # We map the results to the high-fidelity format and store them in the global state
    mapped_data = map_to_schema("AISSMS", results, signal_plan)
    LATEST_DATA["AISSMS"] = mapped_data
    
    # Append to History (Keep last 50)
    DECISION_HISTORY.append(mapped_data)
    if len(DECISION_HISTORY) > 50:
        DECISION_HISTORY.pop(0)
    
    # Also update VIT/MIT with default/stale data if not already present
    if not LATEST_DATA["VIT"]: 
        LATEST_DATA["VIT"] = get_default_data("VIT")
        DECISION_HISTORY.append(LATEST_DATA["VIT"])
    if not LATEST_DATA["MIT"]: 
        LATEST_DATA["MIT"] = get_default_data("MIT")
        DECISION_HISTORY.append(LATEST_DATA["MIT"])

    return {
        "intersection_telemetry": results,
        "signal_plan": signal_plan,
        "debug": {"simulation_time": round(elapsed, 1)}
    }
