# Weather App 


Overview
- Backend: Express API that loads city codes from `backend/data/cities.json`, fetches weather from OpenWeatherMap (or uses local mock data), and caches responses for 5 minutes.
- Frontend: React + Vite app in `frontend/frontend` that shows weather cards and supports authentication via Auth0. For local development a mock auth provider is available.

Quick start (developer)

1. Backend
   ```powershell
   cd backend
   npm install
   # optional: copy .env.example to .env and fill values
   # If you don't have an OpenWeather API key and want to run locally, keep OPENWEATHER_API_KEY empty.
   node server.js
   ```

2. Frontend
   ```powershell
   cd frontend/frontend
   npm install
   npm run dev
   ```

3. Local dev behavior
- The frontend automatically uses Auth0 when `VITE_AUTH0_DOMAIN` and `VITE_AUTH0_CLIENT_ID` are set in `frontend/frontend/.env`. Otherwise a mock dev login is provided.
- The backend accepts the mock frontend token `dev-token` or can be configured to bypass auth with `DEV_AUTH_BYPASS=true` in `backend/.env` for local testing.
- If `OPENWEATHER_API_KEY` is not set in `backend/.env`, the backend will return mock weather data based on `backend/data/cities.json` so the UI works offline.

Environment variables
- `backend/.env.example` documents the backend variables.
- `frontend/frontend/.env.example` documents the frontend variables.

Auth0 setup notes (high level)
- Create an Application in Auth0 (SPA) and configure:
  - Allowed Callback URLs: `http://localhost:5173`
  - Allowed Logout URLs: `http://localhost:5173`
  - Allowed Web Origins: `http://localhost:5173`
- Create an API in Auth0 and note the audience to use for `VITE_AUTH0_AUDIENCE` and `AUTH0_AUDIENCE`.
- Disable public signups in your Auth0 database connection and pre-create the test user `careers@fidenz.com` (Pass#fidenz) as requested by the assignment.
- Enable MFA (email or other) in the Auth0 dashboard as part of the assignment.

