import { useEffect, useMemo, useState } from 'react'
import './App.css'

function App() {
  const [now, setNow] = useState(new Date())
  const [position, setPosition] = useState({
    lat: 25.033,
    lon: 121.5654,
    source: 'fallback',
    label: 'Taipei, Taiwan',
  })
  const [weather, setWeather] = useState({
    loading: true,
    temperature: null,
    windspeed: null,
    code: null,
    error: null,
  })

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      return
    }

    navigator.geolocation.getCurrentPosition(
      (geo) => {
        setPosition({
          lat: geo.coords.latitude,
          lon: geo.coords.longitude,
          source: 'geolocation',
          label: 'Your current location',
        })
      },
      () => {
        // fallback already set
      },
      { timeout: 10000 },
    )
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    async function loadWeather() {
      setWeather((prev) => ({ ...prev, loading: true, error: null }))
      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${position.lat}&longitude=${position.lon}&current_weather=true`
        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`Weather request failed (${response.status})`)
        }

        const data = await response.json()
        const current = data.current_weather
        setWeather({
          loading: false,
          temperature: current?.temperature ?? null,
          windspeed: current?.windspeed ?? null,
          code: current?.weathercode ?? null,
          error: null,
        })
      } catch (error) {
        if (error.name !== 'AbortError') {
          setWeather({
            loading: false,
            temperature: null,
            windspeed: null,
            code: null,
            error: error.message,
          })
        }
      }
    }

    loadWeather()
    return () => controller.abort()
  }, [position.lat, position.lon])

  const mapUrl = useMemo(() => {
    const delta = 0.12
    const left = position.lon - delta
    const right = position.lon + delta
    const top = position.lat + delta
    const bottom = position.lat - delta

    return `https://www.openstreetmap.org/export/embed.html?bbox=${left}%2C${bottom}%2C${right}%2C${top}&layer=mapnik&marker=${position.lat}%2C${position.lon}`
  }, [position.lat, position.lon])

  const formattedTime = now.toLocaleTimeString()
  const formattedDate = now.toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <main className="dashboard">
      <h1>My World Snapshot</h1>
      <p className="subtitle">Live location map, running clock, and local weather</p>

      <section className="panel clock-panel">
        <h2>Local Time</h2>
        <p className="clock">{formattedTime}</p>
        <p className="date">{formattedDate}</p>
      </section>

      <section className="panel map-panel">
        <h2>Where I Am</h2>
        <p className="location-label">{position.label}</p>
        <p className="coords">
          Lat: {position.lat.toFixed(4)} | Lon: {position.lon.toFixed(4)}
        </p>
        <iframe
          title="Current location map"
          src={mapUrl}
          className="map-frame"
          loading="lazy"
        />
        <small>Location source: {position.source}</small>
      </section>

      <section className="panel weather-panel">
        <h2>Local Weather</h2>
        {weather.loading ? (
          <p>Loading weather...</p>
        ) : weather.error ? (
          <p className="error">{weather.error}</p>
        ) : (
          <div className="weather-grid">
            <div>
              <span className="label">Temperature</span>
              <p>{weather.temperature}°C</p>
            </div>
            <div>
              <span className="label">Wind</span>
              <p>{weather.windspeed} km/h</p>
            </div>
            <div>
              <span className="label">Weather Code</span>
              <p>{weather.code}</p>
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

export default App
