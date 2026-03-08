# 🤖 Tram.AI — WhatsApp Commute Bot (FEATURE-3)

A WhatsApp chatbot that gives live traffic analysis, event detection, metro navigation, and full travel itineraries for Pune — powered by the backend webscraper API.

---

## What it does

Send a WhatsApp message and get:

- 🎪 **Live events** happening near any area in Pune
- 🚦 **Real-time traffic** congestion level (via Mappls)
- 🌤️ **Weather** at your destination
- 🚇 **Nearest Pune Metro stations** with Google Maps links
- 🗺️ **Step-by-step itinerary** — road vs metro options
- ⏱️ **Time advice** based on how long you have to reach

---

## Conversation Flow

```
You  → hi
Bot  → Welcome + menu

You  → go
Bot  → Where are you starting from?

You  → Swargate
Bot  → ✅ Origin confirmed + nearby metros

You  → Kothrud
Bot  → ✅ Destination confirmed + nearby metros

You  → 45
Bot  → 🚦 Full commute report with itinerary
```

### Free-form Queries (no flow needed)
You can also just ask directly:
```
"Any events near FC Road?"
"Traffic at Hinjewadi right now"
"Metro near Magarpatta City"
"What's happening at Shivajinagar?"
```

---

## Prerequisites

Make sure these are already running before starting the bot:

| Service | How to start |
|---|---|
| Backend Webscraper | `uvicorn main:app --reload` inside `BACKEND-WEBSCRAPER/` |
| ngrok | `ngrok http 5000` |

---

## Setup

### 1. Install Dependencies

The project uses the shared `.venv` in the root folder.

```powershell
# From the repo root (F:\AISSMS-TRAFFIC(2)\)
.\.venv\Scripts\activate

# Dependencies already installed — verify with:
python -m pip show flask twilio
```

If not installed:
```powershell
python -m pip install flask twilio python-dotenv requests
```

---

### 2. Configure `.env`

Copy `.env.example` to `.env` in the `FEATURE-3/` folder:

```
FEATURE-3/
├── .env          ← create this
└── .env.example  ← copy from this
```

Fill in your values:

```env
# Twilio credentials — get from console.twilio.com
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here

# Twilio WhatsApp Sandbox number (don't change this for sandbox)
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886

# Backend URL (keep as-is when running locally)
BACKEND_URL=http://localhost:8000

# Port for this bot
PORT=5000
```

---

### 3. Twilio WhatsApp Sandbox Setup

**Step 1** — Go to [console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)

**Step 2** — From your WhatsApp, send the join keyword to `+1 415 523 8886`:
```
join <your-sandbox-keyword>
```
> Sandbox keyword is shown on the Twilio console page (e.g. `join theory-harb`)

**Step 3** — Set the webhook URL in the Twilio Sandbox settings:

| Field | Value |
|---|---|
| When a message comes in | `https://YOUR-NGROK-URL.ngrok-free.dev/whatsapp` |
| Method | `HTTP POST` |

Click **Save**.

---

### 4. Get your ngrok URL

```powershell
# Run in a new terminal from repo root
ngrok http 5000
```

Copy the `Forwarding` URL shown:
```
Forwarding  https://braeden-logier-ambivalently.ngrok-free.dev -> http://localhost:5000
```

Paste `https://braeden-logier-ambivalently.ngrok-free.dev/whatsapp` into Twilio's webhook field.

> ⚠️ **Important:** ngrok URL changes every time you restart ngrok. Update Twilio webhook whenever you restart ngrok.

---

## Running the Bot

Open a terminal in `FEATURE-3/` with the venv activated:

```powershell
# Activate venv (from repo root)
cd F:\AISSMS-TRAFFIC(2)
.\.venv\Scripts\activate

# Start the bot
cd FEATURE-3
python bot.py
```

You should see:
```
🤖 Tram.AI WhatsApp Bot → http://0.0.0.0:5000/whatsapp
📡 Backend: http://localhost:8000
 * Running on http://127.0.0.1:5000
 * Running on http://10.x.x.x:5000
```

---

## Full Startup Checklist

Run these in order, each in a **separate terminal**:

```
Terminal 1 — Backend
────────────────────
cd F:\AISSMS-TRAFFIC(2)\BACKEND-WEBSCRAPER
.\.venv\Scripts\activate
uvicorn main:app --reload


Terminal 2 — Bot
────────────────────
cd F:\AISSMS-TRAFFIC(2)\FEATURE-3
.\.venv\Scripts\activate
python bot.py


Terminal 3 — ngrok tunnel
────────────────────
cd F:\AISSMS-TRAFFIC(2)
ngrok http 5000
```

Then paste the ngrok URL into Twilio → Send `hi` on WhatsApp ✅

---

## Test Without WhatsApp

You can simulate a conversation locally:

```powershell
# Test "hi" message
Invoke-WebRequest -Uri "http://localhost:5000/whatsapp" -Method POST -Body "From=whatsapp:+91test&Body=Hi" -ContentType "application/x-www-form-urlencoded"

# Test free-form query
Invoke-WebRequest -Uri "http://localhost:5000/whatsapp" -Method POST -Body "From=whatsapp:+91test&Body=Events near Swargate" -ContentType "application/x-www-form-urlencoded"
```

---

## Health Check

```
GET http://localhost:5000/health
```
Returns `{"status": "ok", "backend": "http://localhost:8000"}`

---

## AI / API Keys

The bot itself needs no AI keys — it calls the backend which handles all AI.

The backend (`BACKEND-WEBSCRAPER/.env`) uses this priority chain:

| Priority | Provider | Status |
|---|---|---|
| 1st | **Groq** (`GROQ_API_KEY`) | ✅ Free, 14,400 req/day |
| 2nd | **Gemini** (`GEMINI_API_KEY`) | Free tier (429 if quota hit) |
| 3rd | **OpenRouter** (`OPENROUTER_API_KEY`) | Fallback |

Get a free Groq key at [console.groq.com/keys](https://console.groq.com/keys) — no credit card needed.

---

## Twilio Sandbox Limits

| Limit | Value |
|---|---|
| Daily messages | 50 messages/day |
| Session expiry | Re-join keyword every ~24h |
| Number of users | Only numbers that joined the sandbox |

> For production / hackathon demo: use a verified [Twilio WhatsApp Business](https://www.twilio.com/whatsapp) number to remove all limits.

---

## File Structure

```
FEATURE-3/
├── bot.py           ← Main WhatsApp bot (Flask + Twilio)
├── .env             ← Your credentials (not committed to git)
├── .env.example     ← Template — copy to .env
└── requirements.txt ← Dependencies
```
