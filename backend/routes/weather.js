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

// Safe auth middleware wrapper
// - If Auth0 is configured (authMiddleware != null) we only delegate to express-jwt
//   when the incoming Authorization header contains a token that looks like a JWT
//   (three dot-separated base64url parts). If the token is missing or clearly not
//   a JWT, return a clear 401 JSON error instead of letting express-jwt throw
//   "jwt malformed".
// - If Auth0 is not configured (authMiddleware == null), allow requests through
//   so the server can be used without Auth0 in local development.
const isLikelyJwt = (token) => {
  if (!token || typeof token !== 'string') return false;
  return /^([A-Za-z0-9-_]+)\.([A-Za-z0-9-_]+)\.([A-Za-z0-9-_]+)$/.test(token);
};

const authMiddlewareUsed = (req, res, next) => {
  // If Auth0 JWT middleware isn't configured, allow through (developer choice)
  if (!authMiddleware) return next();

  const authHeader = (req.headers && req.headers.authorization) || '';
  if (!authHeader) {
    return res.status(401).json({ error: 'authorization_required', description: 'Authorization header required' });
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'invalid_authorization_header', description: 'Expected "Authorization: Bearer <token>"' });
  }

  const token = parts[1];
  if (!isLikelyJwt(token)) {
    return res.status(401).json({ error: 'invalid_token_format', description: 'Token is not a JWT' });
  }

  // Token looks like a JWT; delegate to express-jwt for full verification
  return authMiddleware(req, res, next);
};

// Optional scope/role checker middleware. Enable by setting REQUIRE_SCOPE=true and
// provide the required scope via the environment variable REQUIRED_SCOPE (e.g. 'read:weather')
const requireScope = (scope) => (req, res, next) => {
  if (!process.env.REQUIRE_SCOPE || process.env.REQUIRE_SCOPE !== 'true') return next();
  const user = req.user || {};
  // support both scope in token (space-delimited) and custom roles claim
  const tokenScopes = (user.scope || '').split(' ').filter(Boolean);
  const roles = user['https://fidenz.com/roles'] || user.roles || [];
  if (tokenScopes.includes(scope) || roles.includes(scope)) return next();
  return res.status(403).json({ error: 'insufficient_scope', description: `Requires scope ${scope}` });
};

// GET all cities weather (protected)
router.get('/all', authMiddleware, async (req, res) => {
  try {
    const results = [];
    const promises = cityIds.map(async id => {
      const cached = cache.get(id);
      if (cached) return cached;

      let out;
      // Always use mock data for development to avoid API key issues
      if (!process.env.OPENWEATHER_API_KEY || process.env.USE_MOCK_DATA === 'true') {
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
    // If the error stems from axios and includes a response, forward the status & message
    console.error('Error in /all:', err && err.message);
    if (err && err.response) {
      const status = err.response.status || 500;
      const body = err.response.data || { error: err.message };
      return res.status(status).json({ error: 'upstream_error', details: body });
    }
    res.status(500).json({ error: 'Failed to fetch weather', details: err && err.message });
  }
});

// Debug endpoint to inspect Authorization header and decoded user (useful while debugging auth)
router.get('/debug-auth', (req, res) => {
  // Only expose debug endpoint in non-production dev scenarios when dev bypass is enabled
  const isDev = process.env.NODE_ENV !== 'production' && process.env.DEV_AUTH_BYPASS === 'true';
  if (!isDev) return res.status(404).json({ error: 'not_found' });
  res.json({
    authorization: req.headers.authorization || null,
    user: req.user || null,
    devBypass: process.env.DEV_AUTH_BYPASS === 'true'
  });
});

// GET single city (protected)
router.get('/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;
  if (!id) return res.status(400).json({ error: 'City id required' });

  const cached = cache.get(id);
  if (cached) return res.json(cached);
  // If we don't have an OpenWeather API key available, return a mock response using cities.json
  if (!process.env.OPENWEATHER_API_KEY) {
    const info = cityMap[id] || {};
    const tempC = info.Temp ? Math.round(Number(info.Temp)) : null;
    const out = {
      id,
      name: info.CityName || info.name || 'Unknown',
      description: info.Status || null,
      tempKelvin: tempC !== null ? Math.round((tempC + 273.15) * 100) / 100 : null,
      tempC
    };
    cache.set(id, out);
    return res.json(out);
  }

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
