export class WeatherService {
  constructor() {
    this.apiKey = process.env.API_KEY; // 🔑 Key WeatherAPI
    this.baseUrl = "https://api.weatherapi.com/v1/forecast.json";
  }

  async fetchWeather(city) {
    const url = `${this.baseUrl}?key=${this.apiKey}&q=${encodeURIComponent(city)}&days=7&aqi=no&alerts=no`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      const current = data.current;
      const forecast = data.forecast.forecastday;

      return {
        name: data.location.name,
        temp: current.temp_c,
        desc: current.condition.text,
        humidity: current.humidity,
        wind: current.wind_kph,
        icon: "https:" + current.condition.icon,
        forecast: forecast.map((f) => ({
          date: f.date,
          max: f.day.maxtemp_c,
          min: f.day.mintemp_c,
          icon: "https:" + f.day.condition.icon,
          text: f.day.condition.text,
        })),
        location: data.location, // 🗺️ Bản đồ cần lat/lon ở đây
      };
    } catch (err) {
      console.error("❌ Weather fetch error:", err.message);
      throw new Error("⚠️ City not found or API error!");
    }
  }

  async fetchWeatherByCoords(lat, lon) {
    const url = `${this.baseUrl}?key=${this.apiKey}&q=${lat},${lon}&days=7&aqi=no&alerts=no`;

    try {
      const res = await fetch(url);
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      const current = data.current;
      const forecast = data.forecast.forecastday;

      return {
        name: data.location.name,
        temp: current.temp_c,
        desc: current.condition.text,
        humidity: current.humidity,
        wind: current.wind_kph,
        icon: "https:" + current.condition.icon,
        forecast: forecast.map((f) => ({
          date: f.date,
          max: f.day.maxtemp_c,
          min: f.day.mintemp_c,
          icon: "https:" + f.day.condition.icon,
          text: f.day.condition.text,
        })),
        location: data.location, // 🗺️ Có lat/lon đầy đủ
      };
      console.log(location);
    } catch (err) {
      console.error("❌ Weather fetch by coords error:", err.message);
      throw new Error("⚠️ Could not get weather by coordinates!");
    }
  }
}
