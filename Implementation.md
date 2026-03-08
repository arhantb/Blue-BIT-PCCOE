# Implementation


Frontend
- `src/` and `public/` contain static assets and the PWA. Use Next.js or static pages for the commuter UI.
- Map rendering: Mapbox GL JS / MapLibre for route and heatmap visualization.


Backend
- `app/main.py` is the entrypoint for the REST API. Keep services in `services/` and models in `models/`.
- Use FastAPI for async endpoints and automatic OpenAPI docs when possible.

Data & ML
- Use PostgreSQL + PostGIS for spatial queries. OSRM or external routing provider for route computation.
- Traffic forecasting: batch or stream ML jobs; serve predictions via a dedicated endpoint and cache results in Redis.

Integrations
- WhatsApp / Telegram: use `bot/` for messaging integrations and notifications.
- Venue/event ingestion: scraper tooling in `BACKEND-WEBSCRAPER/` or scheduled jobs.

Testing & CI
- Add unit/integration tests under `test/` and run with `pytest`.
- CI should run lint, tests, and optionally build frontend assets.
