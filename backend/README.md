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

8) Submission checklist (required for reviewers)
- Ensure `backend/.env` has `DEV_AUTH_BYPASS=false` (or remove the flag) before submission.
- Set `AUTH0_DOMAIN` and `AUTH0_AUDIENCE` to match your Auth0 tenant and API Identifier.
- Confirm the test user `careers@fidenz.com` exists in your Auth0 tenant or document how the reviewer can log in.

9) Quick verification commands
- Root status (should return a JSON object):
  ```powershell
  Invoke-RestMethod -Uri http://localhost:4000
  ```

- Debug Authorization header (dev only - requires DEV_AUTH_BYPASS=true):
  ```powershell
  Invoke-RestMethod -Uri http://localhost:4000/api/weather/debug-auth -Headers @{ Authorization = 'Bearer dev-token' }
  ```

- Fetch all weather (dev-token or real token):
  ```powershell
  # dev mode
  Invoke-RestMethod -Uri http://localhost:4000/api/weather/all -Headers @{ Authorization = 'Bearer dev-token' }

  # using a real Auth0 access token (replace <token>)
  Invoke-RestMethod -Uri http://localhost:4000/api/weather/all -Headers @{ Authorization = 'Bearer <token>' }
  ```

10) Recommended final steps before emailing reviewers
- Disable `DEV_AUTH_BYPASS` and `DEV_DEBUG` in `backend/.env`.
- Verify that `/api/weather/all` returns a 200 only when a valid Auth0 access token is provided (or document if the API uses mock data when OPENWEATHER_API_KEY is missing).
- Remove or comment-out any debug-only routes if you prefer not to expose them.
