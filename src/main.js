import { WeatherService } from "./WeatherService.js";
import { WeatherUI } from "./WeatherUI.js";
import { WeatherApp } from "./WeatherApp.js";

const service = new WeatherService();
const ui = new WeatherUI();
const app = new WeatherApp(service, ui);

window.service = service; // ✅ thêm dòng này để test trong console
window.app = app;



const themeToggleBtn = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("theme") || "dark";
document.documentElement.setAttribute("data-theme", savedTheme);
themeToggleBtn.textContent = savedTheme === "dark" ? "🌙" : "🌞";

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  themeToggle.textContent = next === "dark" ? "🌙" : "☀️";
  localStorage.setItem("theme", next);
});

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude, longitude } = pos.coords;
    const city = await service.fetchWeatherByCoords(latitude, longitude);
    ui.showResult(city.name, city);
    ui.initMap(latitude, longitude, city.name);
  });
}
