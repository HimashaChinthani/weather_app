import React, { useEffect, useState } from 'react';
import { useAuth } from './auth/AuthProvider';
import axios from 'axios';
import WeatherCard from './components/WeatherCard';
import './styles.css';

export default function App(){
  const { loginWithRedirect, logout, user, isAuthenticated, getAccessTokenSilently } = useAuth();
  const [weathers, setWeathers] = useState([]);
  const [loading, setLoading] = useState(false);
  const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000';

  async function fetchAll(){
    setLoading(true);
    try {
      const token = await getAccessTokenSilently();
      const r = await axios.get(`${API_BASE}/api/weather/all`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWeathers(r.data);
    } catch (err) {
      console.error(err);
      alert('Failed to fetch weather. Are you logged in?');
    }
    setLoading(false);
  }

  useEffect(() => {
    if (isAuthenticated) fetchAll();
  }, [isAuthenticated]);

  return (
    <div className="container">
      <header className="header">
        <div className="brand">
          <div className="logo">FW</div>
          <h1 className="title">Fidenz Weather</h1>
        </div>
        <div className="actions">
          {isAuthenticated ? (
            <>
              <span className="user">Hi, {user?.name || user?.email}</span>
              <button className="btn" onClick={() => logout({ returnTo: window.location.origin })}>Logout</button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => loginWithRedirect()}>Login</button>
          )}
        </div>
      </header>

      <main>
        {!isAuthenticated && (
          <div className="center">
            <p>Please log in to view weather data.</p>
          </div>
        )}

        {isAuthenticated && (
          <>
            <button className="btn btn-primary" onClick={fetchAll} disabled={loading}>Refresh</button>
            <div className="grid">
              {loading && <p>Loading...</p>}
              {weathers.map(w => <WeatherCard key={w.id} weather={w} />)}
            </div>
          </>
        )}
      </main>
      <footer className="footer">Responsive design: try mobile widths</footer>
    </div>
  );
}
