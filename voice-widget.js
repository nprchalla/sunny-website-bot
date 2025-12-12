// Simple WebRTC client for OpenAI Realtime API via /session relay
// BETA: ok for local experimentation

let pc = null;
let dc = null;
let audioEl = null;

async function startSunnyVoice() {
  const statusEl = document.getElementById("voice-status");
  if (!statusEl) return;

  if (pc) {
    statusEl.textContent = "Call already active.";
    return;
  }

  try {
    statusEl.textContent = "Requesting microphone permission…";

    // Peer connection
    pc = new RTCPeerConnection();

    // Remote audio
    audioEl = document.createElement("audio");
    audioEl.autoplay = true;
    pc.ontrack = (e) => {
      audioEl.srcObject = e.streams[0];
    };

    // Local mic
    const ms = await navigator.mediaDevices.getUserMedia({ audio: true });
    ms.getTracks().forEach((t) => pc.addTrack(t));

    // Data channel
    dc = pc.createDataChannel("oai-events");

    dc.addEventListener("open", () => {
      statusEl.textContent = "Connected. You can talk to Sunny now.";

      // Tell the model to start conversational responses
      const event = {
        type: "response.create",
        response: {
          instructions:
            "You are Sunny Reddy AI, a calm and friendly communication and leadership coach. Speak clearly, warmly, and keep responses short and encouraging.",
        },
      };

      try {
        dc.send(JSON.stringify(event));
      } catch (err) {
        console.error("Error sending response.create event:", err);
      }
    });

    dc.addEventListener("close", () => {
      statusEl.textContent = "Call ended.";
    });

    dc.addEventListener("error", (e) => {
      console.error("Data channel error:", e);
      statusEl.textContent =
        "Data channel error. Check console logs and backend.";
    });

    // Offer SDP
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    statusEl.textContent = "Connecting to Sunny voice server…";

    // Hit local relay
    const sdpResponse = await fetch("http://localhost:3000/session", {
      method: "POST",
      body: offer.sdp,
      headers: {
        "Content-Type": "application/sdp",
      },
    });

    if (!sdpResponse.ok) {
      throw new Error("Backend /session error");
    }

    const answer = {
      type: "answer",
      sdp: await sdpResponse.text(),
    };
    await pc.setRemoteDescription(answer);
  } catch (err) {
    console.error(err);
    statusEl.textContent =
      "Error starting voice call. Make sure the backend is running on http://localhost:3000.";
    cleanup();
  }
}

function stopSunnyVoice() {
  cleanup();
  const statusEl = document.getElementById("voice-status");
  if (statusEl) statusEl.textContent = "Call ended.";
}

function cleanup() {
  try {
    if (dc) dc.close();
  } catch {}
  try {
    if (pc) pc.close();
  } catch {}
  pc = null;
  dc = null;

  if (audioEl) {
    audioEl.srcObject = null;
    audioEl = null;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const startBtn = document.getElementById("start-voice");
  const stopBtn = document.getElementById("stop-voice");

  if (startBtn) startBtn.addEventListener("click", startSunnyVoice);
  if (stopBtn) stopBtn.addEventListener("click", stopSunnyVoice);
});
