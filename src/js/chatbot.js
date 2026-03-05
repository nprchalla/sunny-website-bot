import { Conversation } from "https://esm.sh/@elevenlabs/client@0.13.0";

// ─────────────────────────────────────────────────────────────
// DOM refs
// ─────────────────────────────────────────────────────────────
const messagesEl  = document.getElementById("messages");
const emptyState  = document.getElementById("emptyState");
const statusText  = document.getElementById("statusText");
const brandAvatar = document.getElementById("brandAvatar");
const callLabel   = document.getElementById("callLabel");
const callSub     = document.getElementById("callSub");

const connectBtn  = document.getElementById("connectBtn");
const endBtn      = document.getElementById("endBtn");
const callBtn     = document.getElementById("callBtn");
const sendBtn     = document.getElementById("sendBtn");
const textInput   = document.getElementById("textInput");

let conversation = null;
let micOn        = false;
let callMode     = false;

// ─────────────────────────────────────────────────────────────
// UI helpers
// ─────────────────────────────────────────────────────────────
function setStatus(text, modifier = "") {
  statusText.textContent = text;
  statusText.className   = "chat-brand__status" +
    (modifier ? ` chat-brand__status--${modifier}` : "");
}

function setConnected(yes) {
  brandAvatar.classList.toggle("is-connected", yes);
}

function hideEmptyState() {
  if (emptyState) emptyState.style.display = "none";
}

function addMessage(role, text) {
  hideEmptyState();

  const wrap = document.createElement("div");
  wrap.className = `chat-msg chat-msg--${role === "user" ? "user" : "assistant"}`;

  const meta = document.createElement("div");
  meta.className   = "chat-msg__meta";
  meta.textContent = role === "user" ? "You" : "SunnyReddyAI";

  const body = document.createElement("div");
  body.className   = "chat-msg__body";
  body.textContent = text;

  wrap.appendChild(meta);
  wrap.appendChild(body);
  messagesEl.appendChild(wrap);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function setCallMode(on) {
  callMode = on;
  document.body.classList.toggle("call-mode", on);
  textInput.disabled = on;
  sendBtn.disabled   = on;
  if (on) {
    // Clear transcript when switching to voice
    messagesEl.innerHTML = "";
    hideEmptyState();
  }
}

function updateCallOverlay(label, sub) {
  if (callLabel) callLabel.textContent = label;
  if (callSub)   callSub.textContent   = sub;
}

// ─────────────────────────────────────────────────────────────
// Text extraction
// ─────────────────────────────────────────────────────────────
function extractText(msg) {
  if (!msg)                              return null;
  if (typeof msg === "string")           return msg;
  if (typeof msg.message === "string")   return msg.message;
  if (typeof msg.text === "string")      return msg.text;
  if (typeof msg.user_transcript === "string") return msg.user_transcript;
  if (typeof msg.agent_response === "string")  return msg.agent_response;
  return null;
}

// ─────────────────────────────────────────────────────────────
// Session management
// ─────────────────────────────────────────────────────────────
async function newSession({ audioOn }) {
  const resp = await fetch("/api/elevenlabs/signed-url");
  if (!resp.ok) throw new Error("Failed to get signed URL from backend");
  const signedUrl = await resp.text();

  conversation = await Conversation.startSession({
    signedUrl,
    connectionType: "websocket",

    onConnect: async () => {
      setStatus("Connected", "connected");
      setConnected(true);
      connectBtn.disabled = true;
      endBtn.disabled     = false;
      callBtn.disabled    = false;
      sendBtn.disabled    = false;
      textInput.disabled  = false;
    },

    onDisconnect: () => {
      setStatus("Disconnected");
      setConnected(false);
      connectBtn.disabled = false;
      endBtn.disabled     = true;
      callBtn.disabled    = true;
      sendBtn.disabled    = true;
      textInput.disabled  = true;
      micOn               = false;
      setCallMode(false);
      callBtn.classList.remove("is-live");
      callBtn.textContent = "Call (Mic Off)";
      conversation        = null;
    },

    onMessage: (msg) => {
      if (callMode) return;
      const text = extractText(msg);
      if (!text) return;
      const role = (msg.role || msg.speaker || "assistant").toLowerCase();
      addMessage(role === "user" ? "user" : "assistant", text);
    },

    onModeChange: (mode) => {
      if (!callMode) return;
      const listening = mode === "listening";
      setStatus(listening ? "Listening…" : "Speaking…", listening ? "listening" : "speaking");
      updateCallOverlay(
        listening ? "Sunny is listening"  : "Sunny is speaking",
        listening ? "Speak naturally"     : "Generating response…"
      );
    },

    onStatusChange: (status) => {
      const s = typeof status === "string" ? status : (status?.status ?? "Connected");
      if (!callMode) setStatus(s, "connected");
    },

    onError: (err) => {
      console.error(err);
      if (!callMode) addMessage("assistant", "Sorry — something went wrong connecting to the voice agent.");
    },
  });

  if (audioOn) {
    try { await conversation.setVolume({ volume: 1.0 }); } catch {}
    try { conversation.setMicMuted(false); }               catch {}
  } else {
    try { await conversation.setVolume({ volume: 0.0 }); } catch {}
    try { conversation.setMicMuted(true); }                catch {}
  }
}

// ─────────────────────────────────────────────────────────────
// Chat mode
// ─────────────────────────────────────────────────────────────
async function startConversation() {
  await newSession({ audioOn: false });
  micOn = false;
  setCallMode(false);
  callBtn.classList.remove("is-live");
  callBtn.textContent = "Call (Mic Off)";
}

async function endConversation() {
  if (!conversation) return;
  await conversation.endSession();
}

// ─────────────────────────────────────────────────────────────
// Voice call toggle
// ─────────────────────────────────────────────────────────────
async function toggleCall() {
  if (!micOn) {
    try {
      if (conversation) { await conversation.endSession(); conversation = null; }
      setCallMode(true);
      updateCallOverlay("Connecting…", "Requesting microphone access");
      await navigator.mediaDevices.getUserMedia({ audio: true });
      await newSession({ audioOn: true });
      micOn = true;
      callBtn.classList.add("is-live");
      callBtn.textContent = "Call (Live)";
      updateCallOverlay("Call in progress", "Speak naturally — Sunny is listening");
    } catch (e) {
      console.error(e);
      micOn = false;
      setCallMode(false);
      callBtn.classList.remove("is-live");
      callBtn.textContent = "Call (Mic Off)";
      addMessage("assistant", "Could not start call — check mic permissions and agent settings.");
    }
    return;
  }

  // Stop call → return to text chat
  try {
    if (conversation) { await conversation.endSession(); conversation = null; }
    await newSession({ audioOn: false });
    micOn = false;
    setCallMode(false);
    callBtn.classList.remove("is-live");
    callBtn.textContent = "Call (Mic Off)";
  } catch (e) {
    console.error(e);
    setStatus("Disconnected");
  }
}

// ─────────────────────────────────────────────────────────────
// Text send
// ─────────────────────────────────────────────────────────────
async function sendText() {
  if (callMode) return;
  const text = textInput.value.trim();
  if (!text) return;
  if (!conversation) await newSession({ audioOn: false });
  addMessage("user", text);
  conversation.sendUserMessage(text);
  textInput.value = "";
}

// ─────────────────────────────────────────────────────────────
// Event listeners
// ─────────────────────────────────────────────────────────────
connectBtn.addEventListener("click", async () => {
  try {
    setStatus("Connecting…");
    await startConversation();
  } catch (e) {
    console.error(e);
    setStatus("Disconnected");
    addMessage("assistant", "Could not start session — check backend env vars and agent settings.");
  }
});

endBtn.addEventListener("click",  () => endConversation());
callBtn.addEventListener("click", () => toggleCall());
sendBtn.addEventListener("click", () => sendText());

textInput.addEventListener("keydown", (e) => { if (e.key === "Enter") sendText(); });
textInput.addEventListener("input",   () => {
  if (conversation && !callMode) conversation.sendUserActivity?.();
});