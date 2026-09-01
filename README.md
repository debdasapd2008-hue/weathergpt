# WeatherGPT

A standalone weather web app with an AI assistant. React + Vite + Tailwind on
the frontend, Express + Zod on the backend, and a shared schema package between
them. No external auth, no proprietary SDKs — deploy it anywhere that can run a
Node process.

## Architecture

```
WeatherGPT/
├─ client/   React (Vite) + TypeScript + Tailwind CSS + Lucide icons
├─ server/   Express + TypeScript + Zod (weather & AI providers)
└─ shared/   Zod schemas + types shared by client and server
```

Key rules enforced by the design:

- **Only the server talks to external APIs.** Weather and AI keys live in server
  environment variables and are never exposed to the browser.
- **Providers are abstractions.** `server/src/providers/weather/` and
  `server/src/providers/ai/` define interfaces; the OpenWeatherMap and
  OpenAI-compatible / Anthropic implementations plug into them.
- **All API input and output is validated with Zod** (shared schemas in
  `shared/src/`).
- **No wildcard CORS.** Production allows only same-origin or the origins listed
  in `CLIENT_ORIGIN`; development allows the Vite dev server origin.

## Environment variables

Copy `.env.example` to `.env` (or set them in your hosting provider):

| Variable                | Required | Description                                                      |
| ----------------------- | -------- | ---------------------------------------------------------------- |
| `PORT`                  | no       | Server port (default `3001`)                                     |
| `CLIENT_ORIGIN`         | no       | Comma-separated allowed CORS origins (empty = same-origin)       |
| `WEATHER_API_KEY`       | yes*     | OpenWeatherMap API key (https://openweathermap.org/api)          |
| `WEATHER_API_BASE_URL`  | no       | Defaults to `https://api.openweathermap.org/data`                |
| `WEATHER_GEO_BASE_URL`  | no       | Geocoding API base (defaults to `https://api.openweathermap.org/geo`) |
| `AI_PROVIDER`           | no       | `openai-compatible` or `anthropic`; empty disables AI            |
| `AI_API_KEY`            | no       | AI provider key                                                  |
| `AI_BASE_URL`           | no       | Provider-specific default when empty (OpenAI / Anthropic)        |
| `AI_MODEL`              | no       | Provider-specific default when empty                             |
| `AI_IMAGE_MODEL`        | no       | Optional vision model for Camera/Files image analysis; empty disables the feature |

\* Without `WEATHER_API_KEY` the app still runs; weather requests return a
helpful "not configured" message. Same for AI — the app never crashes when AI
credentials are missing.

### Weather provider notes

The OpenWeatherMap provider tries the paid **One Call 3.0** API first (real
7-day forecast, exact timezone, native UV index). On free keys it transparently
falls back to the free endpoints (current + 5-day/3-hour forecast), which return
up to 5 aggregated daily entries. Hourly covers the next 24 hours in both modes.

Times (sunrise/sunset, hourly labels) are formatted server-side in the city's
local time.

## Commands

```bash
npm install          # install all three workspaces

npm run dev          # start API (tsx watch, :3001) + Vite dev server (:5173, /api proxied)
npm run dev:server   # API only
npm run dev:client   # Vite only

npm run check        # typecheck server + client (tsc --noEmit, strict)
npm test             # vitest for server + client

npm run build        # server -> server/dist, client -> client/dist
npm start            # run the production server (serves the built client too)
```

Visit `http://localhost:5173` in development, or `http://localhost:3001` after
`npm run build && npm start`.

## API

| Method | Route                | Description                                                        |
| ------ | -------------------- | ------------------------------------------------------------------ |
| GET    | `/api/health`        | Liveness check                                                     |
| GET    | `/api/weather`       | `?city=London` or `?lat=51.5&lon=-0.12`                             |
| GET    | `/api/weather/geocode`| `?q=Mumbai` → geocoded matches (coordinates-first search)          |
| GET    | `/api/weather/air`   | `?lat=51.5&lon=-0.12` → air quality (`AIR_QUALITY_UNAVAILABLE` if absent) |
| GET    | `/api/ai/status`     | `{ configured, provider, model, imageSupported? }` (no secrets)    |
| POST   | `/api/ai/weather`    | Weather-grounded Q&A: `{ question, current?, hourly?, daily?, location?, language? }` |
| POST   | `/api/ai/general`    | Session chat: `{ question, history?, language? }`                  |
| POST   | `/api/ai/image`      | Vision: `{ dataUrl, mime, question, language? }` → `{ supported, answer?, reason? }` |

Errors use a consistent shape: `{ "error": { "code": "...", "message": "..." } }`
with codes such as `VALIDATION_ERROR`, `WEATHER_NOT_CONFIGURED`,
`AI_NOT_CONFIGURED`, `RATE_LIMITED`, `NOT_FOUND`. Upstream internals are never
leaked to clients.

## Frontend features

- Single-page app (react-router) with a sidebar on desktop and a bottom nav +
  drawer on mobile. 13 sections: Home, Detailed Forecast, AI WeatherGPT,
  General Chat, Saved Places, Alerts & Local, Education, Future of Agriculture,
  Travellers, Health & Wellness, Camera, Files, Settings.
- Interface in 18 languages (English plus 14 Indian languages and Spanish,
  French, German); missing keys fall back to English. AI answers follow the
  selected language. Urdu is rendered right-to-left.
- Coordinates-first geocoding search (debounced, with saved places persisted in
  `localStorage`) plus browser geolocation; weather responses are cached for
  10 minutes (in-memory + persisted).
- Unit system settings (Metric °C / Imperial °F) cover temperature, wind,
  visibility, pressure and precipitation app-wide.
- Current weather card, 24-hour hourly strip, 7-day forecast bars, and a details
  grid (sunrise, sunset, humidity, wind, pressure, visibility, UV).
- Health section: air quality (AQI/PM2.5/PM10), comfort description, wind chill
  and heat index advice. Alerts page shows official provider alerts (never
  invented) plus clearly-labelled locally computed advisories.
- Camera (live capture or file) and Files sections let a vision model answer
  questions about an image when `AI_IMAGE_MODEL` is configured.
- WeatherGPT AI panel with suggested questions, typing indicator, and a
  configuration hint when AI is not set up.
- Dark/light mode (system-aware, persisted), loading skeletons, empty and
  error states, responsive mobile-first layout.

## Testing

- `server/tests/` — weather provider + mapper, AI provider (weather, general,
  image), all API routes, Zod validation, and error handling (unknown routes,
  malformed JSON, no leaking of internals) via supertest against the real
  Express app with injected fake providers.
- `client/src/lib/*.test.ts` — formatting, unit conversion / comfort + health
  helpers, and icon-mapping units.

## Deployment

Requires **Node.js ≥ 20.11**.

Simplest (single process):

1. `npm install && npm run build`
2. Set environment variables (see table above)
3. `npm start` — the server serves `client/dist` and the API from one port

Works on any Node host (Railway, Render, Fly.io, Heroku, a VPS…). If you split
the client to static hosting, set `CLIENT_ORIGIN=https://your.app` on the server
so the browser can call it cross-origin.

## Data sources

- Weather: OpenWeatherMap
- AI: any Chat Completions-compatible endpoint (OpenAI, OpenRouter, Groq, Ollama…)
  or Anthropic Claude