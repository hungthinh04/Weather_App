export class WeatherUI {
  constructor() {
    this.resultBox = document.getElementById("result");
    this.spinner = document.getElementById("spinner");
    this.historyBox = document.getElementById("history");
    this.clearBtn = document.getElementById("clearBtn");
    this.suggestionBox = document.getElementById("suggestions");
  }

  showLoading() {
    this.spinner.style.display = "block";
  }
  hideLoading() {
    this.spinner.style.display = "none";
  }

  showResult(city, weather) {
    this.resultBox.style.display = "block";

    // Phần thời tiết hiện tại
    let html = `
    <h3>🌍 ${weather.name}</h3>
    <img src="${weather.icon}" alt="${weather.desc}" width="80">
    <div class="temp">${weather.temp}°C</div>
    <p>${weather.desc}</p>
    <p>💧 Humidity: ${weather.humidity}%</p>
    <p>💨 Wind: ${weather.wind} km/h</p>
  `;

    // 🔮 Phần dự báo 7 ngày
    html += `<h4 style="margin-top:20px;">📆 7-Day Forecast</h4>
  <div class="forecast">`;
    weather.forecast.forEach((f) => {
      html += `
      <div class="day">
        <p><strong>${this.formatDate(f.date)}</strong></p>
        <img src="${f.icon}" alt="${f.text}" width="48">
        <p>${f.text}</p>
        <p>${f.max}° / ${f.min}°</p>
      </div>`;
    });
    html += `</div>`;

    // 🔢 Biểu đồ
    html += `<canvas id="forecastChart" width="300" height="150"></canvas>`;

    this.resultBox.innerHTML = html;

    // Vẽ biểu đồ sau khi DOM render
    this.renderChart(weather.forecast);
  }

  // Helper: format ngày
  formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { weekday: "short" });
  }

  // Vẽ biểu đồ nhiệt độ
  renderChart(forecast) {
    const canvas = document.getElementById("forecastChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const labels = forecast.map((f) => this.formatDate(f.date));
    const maxData = forecast.map((f) => f.max);
    const minData = forecast.map((f) => f.min);

    // 🧹 Nếu đã có chart cũ thì xóa trước khi vẽ mới
    if (window.forecastChart instanceof Chart) {
      window.forecastChart.destroy();
    }

    // 🎨 Vẽ chart mới
    window.forecastChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Max Temp (°C)",
            data: maxData,
            borderColor: "#ffce00",
            borderWidth: 2,
            fill: false,
            tension: 0.3,
            pointRadius: 4,
          },
          {
            label: "Min Temp (°C)",
            data: minData,
            borderColor: "#2a5298",
            borderWidth: 2,
            fill: false,
            tension: 0.3,
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
        scales: {
          y: { beginAtZero: false, grid: { color: "rgba(255,255,255,0.2)" } },
          x: { grid: { display: false } },
        },
      },
    });
  }

  showError(msg) {
    this.resultBox.style.display = "block";
    this.resultBox.innerHTML = `<p style="color:red;">${msg}</p>`;
  }

  renderHistory(history) {
    if (history.length === 0) {
      this.historyBox.innerHTML = "";
      this.clearBtn.style.display = "none";
      return;
    }
    this.historyBox.innerHTML = `
      <h4>📜 Search History</h4>
      <ul>${history.map((c) => `<li>${c}</li>`).join("")}</ul>
    `;
    this.clearBtn.style.display = "inline-block";
  }

  renderSuggestions(list, onSelect) {
    if (!list.length) {
      this.suggestionBox.style.display = "none";
      return;
    }
    this.suggestionBox.innerHTML = list
      .map((c) => `<div class="s-item">${c}</div>`)
      .join("");
    this.suggestionBox.style.display = "block";

    [...this.suggestionBox.querySelectorAll(".s-item")].forEach((el) => {
      el.addEventListener("click", () => {
        onSelect(el.textContent);
        this.suggestionBox.style.display = "none";
      });
    });
  }

  renderMap(lat, lon, cityName) {
    const mapEl = document.getElementById("map");
    if (!mapEl) return;

    if (window.weatherMap) {
      window.weatherMap.remove();
    }

    // Tạo bản đồ Leaflet
    window.weatherMap = L.map("map").setView([lat, lon], 10);

    // Layer tile
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(window.weatherMap);

    // Marker vị trí hiện tại
    L.marker([lat, lon])
      .addTo(window.weatherMap)
      .bindPopup(`<b>${cityName}</b>`)
      .openPopup();

    // Khi click bản đồ, xem thời tiết nơi khác
    window.weatherMap.on("click", async (e) => {
      const { lat, lng } = e.latlng;
      const weather = await window.app.service.fetchWeatherByCoords(lat, lng);
      this.showResult(weather.name, weather);
      this.renderMap(weather.lat, weather.lon, weather.name);
    });
  }
  sendNotification(title, body, icon = "") {
    if (!("Notification" in window)) {
      console.warn("❌ Notification API not supported!");
      return;
    }

    console.log("📨 Sending notification:", {
      title,
      body,
      icon,
      perm: Notification.permission,
    });

    if (Notification.permission !== "granted") {
      console.warn("⚠️ Permission not granted.");
      return;
    }

    // 🚀 Tạo notification
    const n = new Notification(title, {
      body,
      icon: icon || "https://cdn.weatherapi.com/weather/64x64/day/116.png",
      silent: false,
      requireInteraction: true, // 🔥 giữ popup đến khi user đóng
      tag: "weather-alert", // tránh trùng lặp
    });

    // 👋 Log event khi hiển thị
    n.onshow = () => console.log("✅ Notification shown:", n);
    n.onclick = () => {
      window.focus();
      n.close();
    };
    n.onerror = (e) => console.error("❌ Notification error:", e);
  }

  showAlert(message, icon = "⚠️") {
    const box = document.getElementById("alertBox");
    const iconEl = document.getElementById("alertIcon");
    const textEl = document.getElementById("alertText");

    if (!box) {
      console.warn("⚠️ Alert box not found in HTML");
      return;
    }

    iconEl.textContent = icon;
    textEl.textContent = message;
    box.classList.add("show");
    box.style.display = "flex";

    // 🔊 Play sound (requires prior user click)
    const sound = new Audio(
      "https://actions.google.com/sounds/v1/alarms/beep_short.ogg"
    );
    sound.volume = 0.4;
    sound.play().catch((err) => console.warn("🔇 Sound blocked:", err.message));

    // ⏱️ Tự ẩn sau 6 giây
    setTimeout(() => {
      box.classList.remove("show");
      box.style.display = "none";
    }, 6000);
  }

  showSummary(text) {
    const resultBox = document.getElementById("result");
    if (!resultBox) {
      console.warn("⚠️ Result box not found for summary");
      return;
    }

    // Xóa summary cũ nếu có
    const oldSummary = resultBox.querySelector(".ai-summary");
    if (oldSummary) oldSummary.remove();

    // Tạo div mới cho summary
    const summaryDiv = document.createElement("div");
    summaryDiv.classList.add("ai-summary");
    summaryDiv.innerHTML = `<p>🧠 ${text}</p>`;

    // Thêm vào dưới phần kết quả
    resultBox.appendChild(summaryDiv);
  }

  initMap(lat = 21.0278, lon = 105.8342, city = "Hanoi") {
    const mapContainer = document.getElementById("map");
    if (!mapContainer) {
      console.warn("⚠️ Map container not found");
      return;
    }

    // ⚡ FIX CHUẨN: Nếu map đã tồn tại → xóa instance trước khi khởi tạo lại
    if (L.DomUtil.get("map") !== null) {
      const oldMap = L.DomUtil.get("map");
      oldMap._leaflet_id = null;
    }

    // ✅ Khởi tạo map mới
    this.map = L.map("map").setView([lat, lon], 10);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(this.map);

    L.marker([lat, lon])
      .addTo(this.map)
      .bindPopup(`<b>${city}</b>`)
      .openPopup();
  }
}
