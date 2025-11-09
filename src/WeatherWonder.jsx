import { useState, useEffect } from "react";

// Map Open-Meteo weather codes to description + icon
const weatherMap = {
  0: { desc: "Clear sky", icon: "☀️" },
  1: { desc: "Mainly clear", icon: "🌤️" },
  2: { desc: "Partly cloudy", icon: "⛅" },
  3: { desc: "Overcast", icon: "☁️" },
  45: { desc: "Fog", icon: "🌫️" },
  48: { desc: "Depositing rime fog", icon: "🌫️" },
  51: { desc: "Light drizzle", icon: "🌦️" },
  53: { desc: "Moderate drizzle", icon: "🌦️" },
  55: { desc: "Dense drizzle", icon: "🌧️" },
  56: { desc: "Light freezing drizzle", icon: "🌧️❄️" },
  57: { desc: "Dense freezing drizzle", icon: "🌧️❄️" },
  61: { desc: "Slight rain", icon: "🌦️" },
  63: { desc: "Moderate rain", icon: "🌧️" },
  65: { desc: "Heavy rain", icon: "🌧️" },
  66: { desc: "Light freezing rain", icon: "🌧️❄️" },
  67: { desc: "Heavy freezing rain", icon: "🌧️❄️" },
  71: { desc: "Slight snow fall", icon: "🌨️" },
  73: { desc: "Moderate snow fall", icon: "🌨️" },
  75: { desc: "Heavy snow fall", icon: "❄️🌨️" },
  77: { desc: "Snow grains", icon: "❄️" },
  80: { desc: "Slight rain showers", icon: "🌦️" },
  81: { desc: "Moderate rain showers", icon: "🌧️" },
  82: { desc: "Violent rain showers", icon: "⛈️" },
  85: { desc: "Slight snow showers", icon: "🌨️" },
  86: { desc: "Heavy snow showers", icon: "❄️🌨️" },
  95: { desc: "Thunderstorm", icon: "⛈️" },
  96: { desc: "Thunderstorm with slight hail", icon: "⛈️❄️" },
  99: { desc: "Thunderstorm with heavy hail", icon: "⛈️❄️" },
};

export default function WeatherWonder() {
  const [city, setCity] = useState("Cebu");
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedCities, setSavedCities] = useState(() => {
    return JSON.parse(localStorage.getItem("savedCities")) || [];
  });

  useEffect(() => {
    fetchWeather(city);
  }, []);

  const fetchWeather = async (query) => {
    setLoading(true);
    setError("");

    try {
      // 1️⃣ Get coordinates
      const resCoords = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${query}`
      );
      const dataCoords = await resCoords.json();
      if (dataCoords.length === 0) throw new Error("City not found");

      const { lat, lon, display_name, address } = dataCoords[0];
      const country = address?.country || display_name.split(",").pop().trim();

      // 2️⃣ Fetch weather
      const resWeather = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
      );
      const dataWeather = await resWeather.json();
      if (!dataWeather.current_weather) throw new Error("Weather data not available");

      const current = dataWeather.current_weather;
      const weatherCode = current.weathercode;
      const weatherInfo = weatherMap[weatherCode] || { desc: "Unknown", icon: "❓" };

      const weatherData = {
        city: query,
        country,
        temp: current.temperature,
        wind: current.windspeed,
        weatherCode,
        description: weatherInfo.desc,
        icon: weatherInfo.icon,
      };

      setWeather(weatherData);

      // 3️⃣ Save city for quick access
      setSavedCities((prev) => {
        const exists = prev.find((c) => c.city.toLowerCase() === query.toLowerCase());
        if (exists) return prev;
        const updated = [weatherData, ...prev];
        localStorage.setItem("savedCities", JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      setWeather(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchWeather(city);
  };

  const handleSavedClick = (savedCity) => {
    setCity(savedCity.city);
    fetchWeather(savedCity.city);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 flex flex-col items-center justify-start p-4">
      <h1 className="text-5xl font-bold text-white mb-8 drop-shadow-lg text-center mt-4">
        Weather Wonder
      </h1>

      {/* Search */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3 mb-4 w-full max-w-md"
      >
        <input
          type="text"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Enter city..."
          className="flex-1 px-4 py-3 rounded-lg border border-white/40 bg-white/20 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
        />
        <button
          type="submit"
          className="px-4 py-3 rounded-lg bg-white text-blue-700 font-semibold hover:bg-blue-100 transition"
        >
          Search
        </button>
      </form>

      {/* Search History */}
{savedCities.length > 0 && (
  <div className="w-full max-w-md mb-4">
    <div className="flex justify-between items-center mb-1">
      <p className="text-white font-semibold">Search History:</p>
      <button
        onClick={() => {
          if (window.confirm("Are you sure you want to clear search history?")) {
            localStorage.removeItem("savedCities");
            setSavedCities([]);
          }
        }}
        className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
      >
        Clear History
      </button>
    </div>
    <div className="flex flex-wrap gap-2">
      {savedCities.map((c) => (
        <button
          key={c.city}
          onClick={() => handleSavedClick(c)}
          className="px-3 py-1 bg-gray-600 text-gray-100 rounded-full hover:bg-gray-500 transition"
        >
          {c.city}, {c.country}
        </button>
      ))}
    </div>
  </div>
)}


      {/* Loading */}
      {loading && <p className="text-white text-lg mb-4 animate-pulse">Loading...</p>}
      {error && <p className="text-red-300 font-semibold mb-4">{error}</p>}

      {/* Weather card */}
      {weather && !loading && (
        <div className="bg-white/20 backdrop-blur-md p-6 rounded-3xl shadow-xl text-white w-full max-w-sm text-center transition-all duration-500">
          <h2 className="text-3xl font-semibold mb-2">
            {weather.city}, {weather.country}
          </h2>
          <p className="text-6xl mb-1">{weather.icon}</p>
          <p className="text-5xl font-bold mb-1">{Math.round(weather.temp)}°C</p>
          <p className="capitalize mb-3">{weather.description}</p>
          <div className="flex justify-around mt-4 text-sm text-white/80">
            <p>Wind: {weather.wind} m/s</p>
          </div>
        </div>
      )}
    </div>
  );
}
