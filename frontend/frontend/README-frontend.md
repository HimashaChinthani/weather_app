Frontend setup (local)
======================

1) Install deps and run dev server

   cd frontend/frontend
   npm install
   npm run dev

2) Environment variables

- Copy `.env.example` to `.env` inside `frontend/frontend` and fill the values:
  - VITE_AUTH0_DOMAIN: your Auth0 tenant domain (e.g. your-domain.auth0.com)
  - VITE_AUTH0_CLIENT_ID: client id for your Auth0 application
  - VITE_AUTH0_AUDIENCE: (optional) the API audience configured in Auth0
  - VITE_API_BASE: (optional) http://localhost:4000

3) Auth0 application settings (Auth0 Dashboard)

- Allowed Callback URLs: http://localhost:5173
- Allowed Logout URLs: http://localhost:5173
- Allowed Web Origins: http://localhost:5173
- Disable Public Signups: in Authentication > Database > Settings — disable signups for the tenant or configure a database connection accordingly.

4) Create test user

- In Auth0 Dashboard > Users, create a user with the provided credentials (email: careers@fidenz.com, password: Pass#fidenz) or use your test account flow.

5) MFA

- Configure MFA in the Auth0 Dashboard (Multifactor Auth) and enable the desired factor (email, SMS, authenticator app). For email-based MFA enable the email factor and test.

6) Notes

- The frontend will show a helpful message if Auth0 env vars are missing. Fill them and restart the dev server.
- If you need me to configure a callback URL or create the test user automatically I can't do that from here; I can give step-by-step instructions or sample screenshots.
