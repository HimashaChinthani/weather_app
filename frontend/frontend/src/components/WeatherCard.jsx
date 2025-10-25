import React from 'react';

function statusToEmoji(status){
  if (!status) return '🌤️';
  const s = status.toLowerCase();
  if (s.includes('cloud')) return '☁️';
  if (s.includes('clear')) return '☀️';
  if (s.includes('rain')) return '🌧️';
  if (s.includes('mist') || s.includes('fog')) return '🌫️';
  if (s.includes('snow')) return '❄️';
  return '🌤️';
}

export default function WeatherCard({ weather }){
  const desc = weather.description || 'N/A';
  const temp = weather.tempC !== null && weather.tempC !== undefined ? `${weather.tempC}°C` : 'N/A';

  return (
    <div className="card">
      <div className="weather-row">
        <div className="weather-icon" aria-hidden>{statusToEmoji(desc)}</div>
        <div>
          <div className="city-name">{weather.name}</div>
          <div className="description">{desc}</div>
        </div>
        <div className="temp">{temp}</div>
      </div>
    </div>
  );
}
