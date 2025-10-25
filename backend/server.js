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
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
