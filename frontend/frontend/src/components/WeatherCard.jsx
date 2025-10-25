import React from 'react';

export default function WeatherCard({ weather }){
  return (
    <div className="card">
      <h3>{weather.name}</h3>
      <p>{weather.description || 'N/A'}</p>
      <p>Temp: {weather.tempC !== null ? `${weather.tempC} °C` : 'N/A'}</p>
    </div>
  );
}
