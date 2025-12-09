// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());
app.use(cors());

// ENV
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

// In-memory chat history
let history = [];

// GET history
app.get("/history", (req, res) => {
  res.json(history);
});

// POST message → Gemini → save history
app.post("/message", async (req, res) => {
  try {
    const { text } = req.body;

    // store user message
    const userMsg = {
      id: Date.now() + "_u",
      role: "user",
      text,
      ts: new Date().toISOString()
    };
    history.push(userMsg);

    // call Gemini
    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text }]
          }
        ]
      })
    });

    const data = await response.json();
    console.log("Gemini API Raw Response:", data);

    if (data.error) {
      return res.status(500).json({ error: data.error.message });
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response";

    // store assistant message
    const botMsg = {
      id: Date.now() + "_a",
      role: "assistant",
      text: replyText,
      ts: new Date().toISOString()
    };
    history.push(botMsg);

    res.json(botMsg);
  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`✅ Server running on port ${process.env.PORT}`);
});
