const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
const fs = require('fs');
const path = require('path');

const { expressjwt: jwt } = require("express-jwt");
const jwksRsa = require("jwks-rsa");

const router = express.Router();
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutes

// load cities.json and extract CityCode values
const citiesPath = path.join(__dirname, '..', 'data', 'cities.json');
let cityIds = [];
let cityMap = {};
try {
  const citiesRaw = fs.readFileSync(citiesPath, 'utf8');
  const cities = JSON.parse(citiesRaw);

  // Support different JSON shapes: either an array or an object containing a 'List' array
  const cityArray = Array.isArray(cities)
    ? cities
    : (cities && (cities.List || cities.list || cities.cities)) || [];

  if (!Array.isArray(cityArray)) {
    throw new Error('cities.json does not contain an array of cities');
  }

  cityIds = cityArray.map(c => c.CityCode || c.id || c.cityId).filter(Boolean);
  // Build a quick lookup for mock responses when OpenWeather API key is not present
  cityArray.forEach(c => {
    const id = c.CityCode || c.id || c.cityId;
    if (id) cityMap[id] = c;
  });
  console.log(`Loaded ${cityIds.length} cities`);
} catch (err) {
  console.error('Error reading cities.json', err);
}

// Protect endpoints with Auth0 JWT verification
let authMiddleware;
try {
  authMiddleware = jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`
    }),
    audience: process.env.AUTH0_AUDIENCE,
    issuer: `https://${process.env.AUTH0_DOMAIN}/`,
    algorithms: ['RS256']
  });
} catch (e) {
  console.warn('Auth0 JWT middleware not configured:', e && e.message);
  authMiddleware = null;
}

// Build a middleware that accepts a dev token or falls back to Auth0 middleware when configured.
const devBypass = process.env.DEV_AUTH_BYPASS === 'true';
const authMiddlewareUsed = (req, res, next) => {
  // Accept the mock frontend dev token so local dev works without Auth0.
  const authHeader = req.headers && req.headers.authorization;
  if (authHeader && typeof authHeader === 'string') {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer' && parts[1] === 'dev-token') {
      req.user = { sub: 'dev', email: 'dev@example.com' };
      return next();
    }
  }

  // If explicit DEV_AUTH_BYPASS env var set, inject a dev user.
  if (devBypass) {
    req.user = { sub: 'dev', email: 'dev@example.com' };
    return next();
  }

  // If the Auth0 middleware is configured, delegate to it; otherwise allow through.
  if (authMiddleware) return authMiddleware(req, res, next);
  return next();
};

// GET all cities weather (protected)
router.get('/all', authMiddlewareUsed, async (req, res) => {
  try {
    const results = [];
    const promises = cityIds.map(async id => {
      const cached = cache.get(id);
      if (cached) return cached;

      let out;
      // If we don't have an OpenWeather API key available, return a mock response using cities.json
      if (!process.env.OPENWEATHER_API_KEY) {
        const info = cityMap[id] || {};
        const tempC = info.Temp ? Math.round(Number(info.Temp)) : null;
        out = {
          id,
          name: info.CityName || info.name || 'Unknown',
          description: info.Status || null,
          tempKelvin: tempC !== null ? Math.round((tempC + 273.15) * 100) / 100 : null,
          tempC
        };
      } else {
        const url = `https://api.openweathermap.org/data/2.5/weather?id=${id}&appid=${process.env.OPENWEATHER_API_KEY}`;
        const r = await axios.get(url);
        const body = r.data;
        out = {
          id,
          name: body.name,
          description: body.weather && body.weather[0] ? body.weather[0].description : null,
          tempKelvin: body.main ? body.main.temp : null,
          tempC: body.main ? Math.round(body.main.temp - 273.15) : null
        };
      }
      cache.set(id, out);
      return out;
    });
    const resultsResolved = await Promise.all(promises);
    res.json(resultsResolved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
});

// GET single city (protected)
router.get('/:id', authMiddlewareUsed, async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: 'City id required' });

  const cached = cache.get(id);
  if (cached) return res.json(cached);

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?id=${id}&appid=${process.env.OPENWEATHER_API_KEY}`;
    const r = await axios.get(url);
    const body = r.data;
    const out = {
      id,
      name: body.name,
      description: body.weather && body.weather[0] ? body.weather[0].description : null,
      tempKelvin: body.main ? body.main.temp : null,
      tempC: body.main ? Math.round(body.main.temp - 273.15) : null
    };
    cache.set(id, out);
    res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch weather' });
  }
});

module.exports = router;
