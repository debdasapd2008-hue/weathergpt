# AGENTS.md

## Repo status

- Full-stack weather app ("WeatherGPT"): React/Vite/Tailwind client, Express server, shared Zod schemas. npm workspaces (`client`, `server`, `shared`). Node >= 20.11, npm workspaces hoisting all deps to the root `node_modules`.
- No git repo initialized.

## Commands

- `npm run dev` — server (`tsx watch`, port 3001) + Vite dev server (5173, `/api` proxied to 3001). Run from repo root.
- `npm run check` — strict `tsc --noEmit` for server + client (no separate lint).
- `npm test` — vitest per workspace (server: `server/tests`, client: `client/src/**/*.test.ts`).
- `npm run build` — server via `tsup` (bundles to `server/dist`), client via `vite build` (`client/dist`).
- `npm start` — runs `node server/dist/index.js` (serves `client/dist` whenever it exists after a build; wildcard CORS is off by default).

## Architecture facts that matter

- `shared/` is TypeScript source consumed directly (no build step). `@weathergpt/shared` resolves to `shared/src/index.ts` via npm workspace symlink + aliases in `server/tsconfig`, `client/tsconfig`, `client/vite.config.ts`, and `server/vitest.config.ts`.
- The server bundles `@weathergpt/shared` at build time: `tsup.config.ts` sets `noExternal: ["@weathergpt/shared"]` (tsup otherwise externalizes all `dependencies`), with `external: ["express","cors","dotenv","zod"]`.
- Only the server calls upstream APIs. Keys come from env via `server/src/config.ts` (loads `.env` from cwd, then `../.env`; so the root `.env` works in workspace scripts).
- Weather: `server/src/providers/weather/` — `WeatherProvider` interface (+ `geocode()`, optional `airQuality()`, `AirQualityNotFound`); OpenWeatherMap impl tries paid One Call 3.0 first, falls back to free current + 5-day forecast. `openweathermap.mapper.ts` is pure/deterministic (unit-tested) and owns timezone handling: exact offset from One Call, solar-noon estimate fallback (`estimateOffsetSeconds`), UTC epochs for bucket keys. `weatherResponseSchema.alerts` is a REQUIRED array (legacy path returns `[]`; we never invent alerts).
- AI: `server/src/providers/ai/` — `AIProvider` (weather Q&A + general chat, language-aware prompts), `AIImageProvider` (`openai-image.provider.ts`), `createAIImageProvider`/`createAIProvider` return `null` when credentials are missing. Status reflects all of it (`imageSupported`).
- API routes: `GET /api/weather` (+ `/geocode`, `/air`), `POST /api/ai/weather`, `POST /api/ai/general`, `POST /api/ai/image` (200 `{supported:false,...}` when vision is unconfigured), `GET /api/ai/status`. Error shape `{ error: { code, message } }`; never leak upstream error text or stack traces to clients (tests enforce this).
- `server/src/app.ts` is a pure `createApp(config, deps?)` builder; tests inject fake providers via `deps` and stub `globalThis.fetch` (never hit the network in tests).
- Client is a react-router SPA: `App.tsx` routes 13 sections inside `AppShell.tsx` (desktop sidebar, mobile bottom nav + drawer). `main.tsx` wires `I18nProvider > SettingsProvider > WeatherDataProvider > BrowserRouter`.
- Client state: `stores/weatherData.tsx` owns the weather fetch (coordinates-first; 10-min TTL cache keyed by rounded lat/lon, persisted in `localStorage` `weathergpt-cache`; saved places `weathergpt-places`; geolocation). `stores/settings.tsx` holds `units` (metric/imperial) and `showAirQuality` (`weathergpt-settings`). Language lives only in `I18nProvider` (`weathergpt-language`; ~75 languages with `tier` marking in `i18n/languages.ts`, browser-language auto-detect on first load, English fallback; `ur`,`ar`,`fa`,`he` are RTL via `documentElement.dir`). Theme (`hooks/useTheme.ts`, `weathergpt-theme`) supports `light` | `dark` | `system` and resolves `prefers-color-scheme` when in system mode.
- i18n: AI requests carry `language` (from `useI18n()`) so answers follow the chosen UI language (`hooks/useAIChat.ts`, `hooks/useGeneralChat.ts`; `ChatWindow` is the shared chat UI for chat/farmers/travellers; `ImageQnA` shared by Camera + Files).
- Unit conversion is client-side pure code in `client/src/lib/units.ts` (tested). No chart library — SVG line/area + bar charts are hand-rolled in `components/WeatherCharts.tsx` with geometry helpers in `lib/charts.ts`.
- Editorial design system lives in `client/src/index.css` (Tailwind v4 `@theme` tokens: paper/ink/line/teal/peach/azure/navy-night + `--font-display: "Fraunces"`; page-grid background, `.panel`/`.btn-primary`/`.btn-ghost`/`.chip`/`.field-input`/`.editorial-label` utilities, `@custom-variant dark`). Signature pieces: `components/Editorial.tsx` (`EditorialLabel` section numbers + animated `WeatherVisual`), editorial hero on `CurrentWeatherCard` via `lib/headline.ts` (`heroCopy`). Component tint tokens are `-600` shades of Tailwind default colors only (e.g. `text-teal-600`, `text-rose-600`) — custom `peach` has NO numbered shades (`peach`/`peach-2` only).

## Gotchas

- Windows PowerShell does not allow `npm.ps1`, use `npm.cmd`.
- Express 5 (async handlers auto-forward rejections to the error middleware).
- Client display fields are pre-formatted strings from the server (e.g. `sunrise: "06:32"`, hourly `time: "15:00"`, daily `day: "Mon 12"`); do not re-format as epochs in the UI. Scalars (temperature, windSpeed, humidity, pressure, visibility, precipitation, uvIndex) are numbers so unit conversion can be applied — convert once, format with `lib/units.ts`.
- Old hooks/components (`hooks/useWeather.ts`, `hooks/useGeolocation.ts`, `components/Header.tsx`, `SearchBar.tsx`) were deleted when the shell/routing landed — don't reference them.
- `.env.example` documents all env vars (incl. `WEATHER_GEO_BASE_URL`, `AI_IMAGE_MODEL`); weather and AI keys are both optional at runtime (app shows config hints instead of crashing).

## Trigger security

- Never add API keys to client code or commit `.env*` (gitignored; only `.env.example` tracked). Camera/Files send base64 data URLs to the server; keep `aiImageRequestSchema.dataUrl` capped at 8 MB server-side and 5 MB client-side.
- Environment toggle is manual: `npm run build && npm start` requires real env vars; a fresh clone runs only if `.env` is created.