const express = require("express");
const cors = require("cors");
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));
require("dotenv").config();

const app = express();
app.use(cors()); // 🧠 Cho phép frontend gọi từ domain khác (vd: :5500)
app.use(express.json());


app.post("/api/weather-ai", async (req, res) => {
  const { context } = req.body;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a friendly weather assistant." },
          { role: "user", content: `Write a short English weather summary based on:\n${context}` }
        ],
        max_tokens: 100
      })
    });

    const data = await response.json();
    res.json({ summary: data.choices?.[0]?.message?.content || "No summary" });
  } catch (err) {
    console.error("❌ Proxy error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(3001, () => console.log("✅ Proxy running on http://localhost:3001"));
