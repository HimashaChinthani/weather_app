require('dotenv').config();
const express = require('express');
const cors = require('cors');
const weatherRouter = require('./routes/weather');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/weather', weatherRouter);

// Helpful root route for development: show service status and a link to the API
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Weather API running. Use /api/weather/all to fetch mock/live weather.',
    endpoints: {
      all: '/api/weather/all',
      single: '/api/weather/:id',
      debug: '/api/weather/debug-auth'
    }
  });
});

const PORT = process.env.PORT || 4000;
// Startup environment checks to help catch common misconfigurations before accepting requests
const startChecks = () => {
  if (process.env.AUTH0_DOMAIN && !process.env.AUTH0_AUDIENCE) {
    console.warn('Warning: AUTH0_DOMAIN is set but AUTH0_AUDIENCE is not. JWT verification may fail.');
  }
  if (process.env.NODE_ENV === 'production' && process.env.DEV_AUTH_BYPASS === 'true') {
    console.error('DEV_AUTH_BYPASS must be false in production. Exiting.');
    process.exit(1);
  }
  if (process.env.DEV_AUTH_BYPASS === 'true') {
    console.warn('DEV_AUTH_BYPASS=true: auth checks are relaxed for development. Ensure this is false for submission.');
  }
};

startChecks();

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err && err.stack ? err.stack : err);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err && err.stack ? err.stack : err);
  process.exit(1);
});
