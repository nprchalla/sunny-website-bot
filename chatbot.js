// Keep your existing import (works if it's working for you now) :contentReference[oaicite:3]{index=3}
import { Conversation } from "https://esm.sh/@elevenlabs/client@0.13.0";

const messagesEl = document.getElementById("messages");
const statusText = document.getElementById("statusText");
const resp = await fetch("/api/elevenlabs/signed-url");
const signedUrl = await resp.text();

const connectBtn = document.getElementById("connectBtn");
const endBtn = document.getElementById("endBtn");
const callBtn = document.getElementById("callBtn");
const sendBtn = document.getElementById("sendBtn");
const textInput = document.getElementById("textInput");

let conversation = null;
let micOn = false;

// NEW: when callMode=true => AUDIO ONLY (no transcript bubbles, no typed chat)
let callMode = false;

function addMessage(role, text) {
  const wrap = document.createElement("div");
  wrap.className = `msg ${role === "user" ? "user" : "assistant"}`;

  const meta = document.createElement("div");
  meta.className = "meta";
  meta.textContent = role === "user" ? "You" : "SunnyReddyAI";

  const body = document.createElement("div");
  body.className = "body";
  body.textContent = text;

  wrap.appendChild(meta);
  wrap.appendChild(body);
  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function setStatus(s) {
  statusText.textContent = s;
}

function extractText(msg) {
  if (!msg) return null;
  if (typeof msg === "string") return msg;
  if (typeof msg.message === "string") return msg.message;
  if (typeof msg.text === "string") return msg.text;
  if (typeof msg.user_transcript === "string") return msg.user_transcript;
  if (typeof msg.agent_response === "string") return msg.agent_response;
  return null;
}

// NEW: toggle UI between chat mode and call mode
function setCallMode(on) {
  callMode = on;

  // visually switch page state (optional, used by CSS below)
  document.body.classList.toggle("call-mode", on);

  // In call mode, disable typed chat to behave like "voice call"
  textInput.disabled = on;
  sendBtn.disabled = on;

  // Optional: clear the chat window when call starts
  if (on) messagesEl.innerHTML = "";
}

async function newSession({ audioOn }) {
  // ✅ If we're starting a CALL session, ask mic permission first
  if (audioOn) {
    await navigator.mediaDevices.getUserMedia({ audio: true });
  }

  // Start a brand-new session each time this is called
  const resp = await fetch("/api/elevenlabs/signed-url");
  if (!resp.ok) throw new Error("Failed to get signed URL from backend");
  const signedUrl = (await resp.text()).trim();

  conversation = await Conversation.startSession({
    signedUrl,
    connectionType: "websocket",

    onConnect: async () => {
      setStatus("Connected");
      connectBtn.disabled = true;
      endBtn.disabled = false;
      callBtn.disabled = false;
      sendBtn.disabled = false;
      textInput.disabled = false;

      // ✅ Enforce audio/mic state again on connect
      // (helps if ElevenLabs plays greeting instantly)
      if (audioOn) {
        try { await conversation.setVolume({ volume: 1.0 }); } catch {}
        try { conversation.setMicMuted(false); } catch {}
      } else {
        try { await conversation.setVolume({ volume: 0.0 }); } catch {}
        try { conversation.setMicMuted(true); } catch {}
      }
    },

    onDisconnect: () => {
      setStatus("Disconnected");
      connectBtn.disabled = false;
      endBtn.disabled = true;
      callBtn.disabled = true;
      sendBtn.disabled = true;
      textInput.disabled = true;

      micOn = false;
      setCallMode(false);
      callBtn.classList.remove("on");
      callBtn.textContent = "Call (Start)";
      conversation = null;
    },

    onMessage: (msg) => {
      if (callMode) return; // no transcript during call

      const text = extractText(msg);
      if (!text) return;

      const role = (msg.role || msg.speaker || "assistant").toLowerCase();
      addMessage(role === "user" ? "user" : "assistant", text);
    },

    onModeChange: (mode) => {
      if (!callMode) return;
      setStatus(mode === "listening" ? "Listening…" : "Speaking…");
    },

    onStatusChange: (status) => {
      const s = typeof status === "string" ? status : (status?.status ?? "Connected");
      setStatus(s);
    },

    onError: (err) => {
      console.error(err);
      if (!callMode) addMessage("assistant", "Sorry — something went wrong connecting to the voice agent.");
    }
  });

  // ✅ Apply mode immediately after session is created (prevents greeting audio in chat mode)
  if (audioOn) {
    try { await conversation.setVolume({ volume: 1.0 }); } catch {}
    try { conversation.setMicMuted(false); } catch {}
  } else {
    try { await conversation.setVolume({ volume: 0.0 }); } catch {}
    try { conversation.setMicMuted(true); } catch {}
  }
}

async function startConversation() {
  // CHAT MODE: no mic permission needed, no audio
  await newSession({ audioOn: false });

  micOn = false;
  setCallMode(false);
  callBtn.classList.remove("on");
  callBtn.textContent = "Call (Start)";
}


async function endConversation() {
  if (!conversation) return;
  await conversation.endSession();
}



async function toggleCall() {
  // If starting call:
  if (!micOn) {
    try {
      // End chat session so call starts fresh (greeting again)
      if (conversation) {
        await conversation.endSession();
        conversation = null;
      }

      // Call mode UI (audio only)
      setCallMode(true);

      // Ask mic permission only for call
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start a BRAND NEW session with audio ON (fresh greeting)
      await newSession({ audioOn: true });

      micOn = true;
      callBtn.classList.add("on");
      callBtn.textContent = "Call (Live)";
    } catch (e) {
      console.error(e);
      micOn = false;
      setCallMode(false);
      callBtn.classList.remove("on");
      callBtn.textContent = "Call (Start)";
      addMessage("assistant", "Could not start call. Check mic permission + agent settings.");
    }
    return;
  }

  // If stopping call:
  try {
    if (conversation) {
      await conversation.endSession();
      conversation = null;
    }

    // Return to silent chat session (fresh)
    await newSession({ audioOn: false });

    micOn = false;
    setCallMode(false);
    callBtn.classList.remove("on");
    callBtn.textContent = "Call (Start)";
  } catch (e) {
    console.error(e);
    setStatus("Disconnected");
  }
}




async function sendText() {
  if (callMode) return;

  const text = textInput.value.trim();
  if (!text) return;

  // If user didn't click Connect yet, start silent chat session now
  if (!conversation) {
    await newSession({ audioOn: false });
  }

  addMessage("user", text);
  conversation.sendUserMessage(text);
  textInput.value = "";
}


connectBtn.addEventListener("click", async () => {
  try {
    setStatus("Connecting...");
    await startConversation();
  } catch (e) {
    console.error(e);
    setStatus("Disconnected");
    addMessage("assistant", "Could not start session. Check backend env vars + agent settings.");
  }
});

endBtn.addEventListener("click", () => endConversation());
callBtn.addEventListener("click", () => toggleCall());

sendBtn.addEventListener("click", () => sendText());
textInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendText();
});

// Optional: only send activity in chat mode
textInput.addEventListener("input", () => {
  if (conversation && !callMode) conversation.sendUserActivity?.();
});
