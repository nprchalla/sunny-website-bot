import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();

// Allow local front-end
app.use(
  cors({
    origin: "*",
  })
);



// Accept raw SDP text
app.use(express.text({ type: ["application/sdp", "text/plain"] }));

// Realtime session configuration
const sessionConfig = JSON.stringify({
  type: "realtime",
  model: "gpt-4o-realtime-preview",
  instructions:
    "You are Sunny Reddy AI, a calm, warm leadership and communication coach. Respond with short, practical advice and speak like a thoughtful mentor.",
  audio: {
    output: {
      // calm male synthetic voice
      voice: "sage",
    },
  },
});

app.post("/session", async (req, res) => {
  try {
    console.log("▶️ /session called from browser");
    const fd = new FormData();
    fd.set("sdp", req.body);
    fd.set("session", sessionConfig);

    const r = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: fd,
    });

    console.log("🔁 OpenAI /realtime/calls status:", r.status);

    const text = await r.text();

    if (!r.ok) {
      console.error("❌ OpenAI error body:", text);
      return res.status(500).send("Error from OpenAI Realtime API");
    }

    res.send(text);
  } catch (error) {
    console.error("💥 Session creation error:", error);
    res.status(500).send("Failed to create session");
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Sunny Realtime relay running on http://localhost:${PORT}`);
});
