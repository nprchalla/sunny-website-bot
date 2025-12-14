const chatMessagesEl = document.getElementById("chatMessages");
const userInputEl = document.getElementById("userInput");
const sendBtnEl = document.getElementById("sendBtn");
const history = [];

// Initial greeting
addMessageRow("assistant", "Hi, I'm your AI communication coach. How may I help you communicate more effectively?");

// Message functions
function addMessageRow(role, text) {
  const row = document.createElement("div");
  row.classList.add("message-row", role);
  const bubble = document.createElement("div");
  bubble.classList.add("bubble", role === "user" ? "user" : "assistant");
  bubble.textContent = text;
  row.appendChild(bubble);
  chatMessagesEl.appendChild(row);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

function addTyping() {
  const t = document.createElement("div");
  t.id = "typingIndicator";
  t.className = "typing";
  t.textContent = "Assistant is typing...";
  chatMessagesEl.appendChild(t);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById("typingIndicator");
  if (t) t.remove();
}

// Send message
async function sendMessage(textFromButton) {
  const userText = (textFromButton !== undefined ? textFromButton : userInputEl.value).trim();
  if (!userText) return;

  addMessageRow("user", userText);
  history.push({ role: "user", content: userText });
  userInputEl.value = "";
  sendBtnEl.disabled = true;
  userInputEl.disabled = true;
  addTyping();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userText, history })
    });
    const data = await res.json();
    removeTyping();

    if (data.reply) {
      addMessageRow("assistant", data.reply);
      history.push({ role: "assistant", content: data.reply });
    } else {
      addMessageRow("assistant", "Error: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    removeTyping();
    addMessageRow("assistant", "Network error: " + err.message);
  } finally {
    sendBtnEl.disabled = false;
    userInputEl.disabled = false;
    userInputEl.focus();
  }
}

function sendQuick(text) { sendMessage(text); }

sendBtnEl.addEventListener("click", () => sendMessage());
userInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});

// Dark Mode Toggle
const darkModeBtn = document.createElement("button");
darkModeBtn.textContent = "🌙 Dark Mode";
darkModeBtn.style.position = "fixed";
darkModeBtn.style.top = "20px";
darkModeBtn.style.right = "20px";
darkModeBtn.style.padding = "8px 12px";
darkModeBtn.style.border = "none";
darkModeBtn.style.borderRadius = "8px";
darkModeBtn.style.cursor = "pointer";
darkModeBtn.style.background = "#f97316";
darkModeBtn.style.color = "#fff";
darkModeBtn.style.zIndex = "999";
document.body.appendChild(darkModeBtn);

darkModeBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  darkModeBtn.textContent = document.body.classList.contains("dark") ? "☀️ Light Mode" : "🌙 Dark Mode";
});
