export class WeatherApp {
  constructor(service, ui) {
    this.service = service;
    this.ui = ui;
    this.history = [];

    // Load history từ localStorage
    const saved = JSON.parse(localStorage.getItem("weatherHistory")) || [];
    this.history = saved;
    this.ui.renderHistory(this.history);

    document
      .getElementById("searchBtn")
      .addEventListener("click", () => this.handleSearch());

    this.ui.clearBtn.addEventListener("click", () => this.clearHistory());

    // 🔎 Auto-suggest
    const input = document.getElementById("cityInput");
    input.addEventListener("input", () => {
      const query = input.value.trim().toLowerCase();
      if (!query) {
        this.ui.renderSuggestions([], () => {});
        return;
      }
      const allCities = Object.keys(this.service.fakeDB);
      const historyCities = this.history.map((h) => h.split("→")[0].trim());
      const combined = [...new Set([...allCities, ...historyCities])];
      const matched = combined.filter((c) => c.toLowerCase().startsWith(query));

      this.ui.renderSuggestions(matched, (val) => {
        input.value = val;
      });
    });

    // 🌍 Tự động lấy vị trí người dùng
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude } = pos.coords;
          this.ui.showLoading();
          try {
            const weather = await this.service.fetchWeatherByCoords(
              latitude,
              longitude
            );
            this.ui.showResult(weather.name, weather);
            this.generateWeatherSummary(weather);
            this.ui.renderMap(weather.lat, weather.lon, weather.name);
          } catch (err) {
            console.error("Geo error:", err.message);
          } finally {
            this.ui.hideLoading();
          }
        },
        (err) => console.warn("Geolocation denied:", err.message)
      );
    }

    // if ("Notification" in window && Notification.permission !== "granted") {
    //   Notification.requestPermission();
    // }

    if ("Notification" in window && Notification.permission === "default") {
      setTimeout(() => Notification.requestPermission(), 1000);
    }
    // this.generateWeatherSummary(weather);
  }

  async handleSearch() {
    const cityInput = document.getElementById("cityInput").value.trim();
    if (!cityInput) {
      this.ui.showError("⚠️ Please enter a city.");
      return;
    }

    this.ui.showLoading();
    this.ui.showError("");

    try {
      const weather = await this.service.fetchWeather(cityInput);
      this.ui.showResult(cityInput, weather);

    if (weather.location) {
  this.ui.initMap(
    weather.location.lat,
    weather.location.lon,
    weather.name
  );
}


      this.history.unshift(`${cityInput} → ${weather.temp}°C`);
      this.checkWeatherAlert(weather);
      this.generateWeatherSummary(weather);
    } catch (error) {
      this.ui.showError(error.message);
      this.history.unshift(`${cityInput} → ❌ Not found`);
    } finally {
      if (this.history.length > 5) this.history.pop();
      this.ui.renderHistory(this.history);
      localStorage.setItem("weatherHistory", JSON.stringify(this.history));
      this.ui.hideLoading();
    }
  }

  clearHistory() {
    this.history = [];
    localStorage.removeItem("weatherHistory");
    this.ui.renderHistory(this.history);
    document.getElementById("cityInput").value = ""; // reset input
  }
  checkWeatherAlert(weather) {
    if (localStorage.getItem("alerts") === "off") return;

    // Analyze next few days (e.g. 3 days)
    const forecastNext = weather.forecast.slice(0, 3);
    let message = "";
    let icon = "⚠️";

    // Combine all condition texts and max temps for analysis
    const conditions = forecastNext.map((f) => f.text.toLowerCase()).join(" ");
    const temps = forecastNext.map((f) => f.max);

    const avgMax = temps.reduce((a, b) => a + b, 0) / temps.length;

    // 🧠 Detect alert type
    if (conditions.includes("rain") || conditions.includes("shower")) {
      message =
        "Possible rain in the next few days — don’t forget your umbrella!";
      icon = "☔";
    } else if (conditions.includes("storm") || conditions.includes("thunder")) {
      message = "Thunderstorms expected — be cautious outdoors!";
      icon = "⛈️";
    } else if (conditions.includes("sunny") || avgMax > 30) {
      message =
        "High temperatures expected — stay hydrated and avoid direct sun!";
      icon = "🔥";
    } else if (conditions.includes("snow")) {
      message = "Snow is expected — stay warm and drive carefully!";
      icon = "❄️";
    } else if (conditions.includes("cloud")) {
      message = "Mostly cloudy skies ahead — mild weather expected.";
      icon = "🌤️";
    }

    if (message) {
      console.log("🔔 Weather Alert:", message);

      // ✅ Show in UI
      if (typeof this.ui.showAlert === "function") {
        this.ui.showAlert(message, icon);
      }

      // ✅ Send browser notification if allowed
      if ("Notification" in window && Notification.permission === "granted") {
        this.ui.sendNotification("Weather Alert", message, weather.icon);
      }
    }

    if (message) {
      console.log("🔔 Alert:", message);

      // ✅ Hiện thông báo trong UI
      this.ui.showAlert(message, icon);

      // ✅ Nếu có quyền Notification thì gửi luôn
      if ("Notification" in window && Notification.permission === "granted") {
        this.ui.sendNotification("Weather Alert", message, weather.icon);
      }
    }
  }

  async generateWeatherSummary(weather) {
    const city = weather.name;
    const context = `
  City: ${city}
  Condition: ${weather.forecast[0].text}
  Temperature: ${weather.temp}°C
  Humidity: ${weather.humidity}%
  Wind: ${weather.wind} km/h
  Forecast: ${weather.forecast
    .map((f) => `${f.date}: ${f.text} (${f.max}/${f.min}°C)`)
    .join(", ")}
  `;

    try {
      const res = await fetch("http://localhost:3001/api/weather-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context }),
      });

      const data = await res.json();
      const summary = data.summary || "No AI summary available.";
      this.ui.showSummary(summary);
    } catch (error) {
      console.error("AI summary error:", error);
      // this.ui.showSummary("⚠️ AI summary unavailable right now.");
    }
  }
}
