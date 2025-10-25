Backend — Auth & Running
=================================

This file documents how to configure Auth0 and run the backend for the Fidenz assignment.

1) Prepare environment
- Copy `backend/.env.example` to `backend/.env` and fill in values:
  - `OPENWEATHER_API_KEY` (optional). If empty, the backend returns mock data.
  - `AUTH0_DOMAIN` — your Auth0 tenant domain (example: `dev-abc123.us.auth0.com`).
  - `AUTH0_AUDIENCE` — the API Identifier you create in Auth0.
  - `DEV_AUTH_BYPASS` — set to `false` for production/submission; can be `true` for local dev.

2) Auth0: create API and Application
- Create an API (Auth0 Dashboard → APIs) and note the Identifier (use as `AUTH0_AUDIENCE`).
- Create a Single Page Application (Auth0 Dashboard → Applications → Create Application).
  - Allowed Callback URLs: http://localhost:5173
  - Allowed Logout URLs: http://localhost:5173
  - Allowed Web Origins: http://localhost:5173

3) Disable public signups & create the test user
- In Auth0 Dashboard → Authentication → Database (or Connections → Database) open your database connection.
- Toggle "Disable Sign Ups" to block public registration.
- Create the test user (User Management → Users → Create User):
  - Connection: your database connection (e.g., Username-Password-Authentication)
  - Email: careers@fidenz.com
  - Password: Pass#fidenz
  - (Optional) Set Email Verified = ON

4) Enable MFA
- Tenant-level MFA is configured at Security → Multifactor Auth. Enable the factor(s) you want (email, SMS, authenticator).
  - The test user may need to enroll MFA on first login depending on your policy.

5) Run backend locally
Open PowerShell and run:
cd backend
npm install
node server.js

6) Test the API (PowerShell example)
Invoke-RestMethod -Uri http://localhost:4000/api/weather/all -Headers @{ Authorization = 'Bearer dev-token' }

7) Notes & security
- Keep DEV_AUTH_BYPASS=false for submission. Use it only for local debugging.
- Do not commit `.env` to your repository.
