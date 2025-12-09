// frontend/src/App.jsx
import React, { useEffect, useState, useRef } from "react";
import "./styles.css";

const BACKEND = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function App() {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef();

  // Load chat history on page load
  useEffect(() => {
    fetch(`${BACKEND}/history`)
      .then((r) => r.json())
      .then((data) => setMessages(data))
      .catch((err) => console.error(err));
  }, []);

  // Auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();
    const msg = text.trim();
    if (!msg) return;

    setLoading(true);
    setText("");

    try {
      const res = await fetch(`${BACKEND}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: msg })
      });

      const botReply = await res.json();

      // Update entire history from server
      const updated = await fetch(`${BACKEND}/history`).then((r) => r.json());
      setMessages(updated);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + "_err",
          role: "assistant",
          text: "Error contacting server",
          ts: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <div className="chat-card">
        <h2>AI Chat</h2>

        <div className="messages">
          {messages.map((m) => (
            <div key={m.id} className={`message ${m.role === "user" ? "user" : "ai"}`}>
              <div className="bubble">{m.text}</div>
              <div className="ts">{new Date(m.ts).toLocaleString()}</div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        <form className="composer" onSubmit={sendMessage}>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
          />
          <button type="submit" disabled={loading}>
            {loading ? "Sending..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
}
