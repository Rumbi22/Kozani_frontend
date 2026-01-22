/* ---------------------------------- DOM refs ---------------------------------- */
const $ = (sel) => document.querySelector(sel);
const chat = $("#chat");
const form = $("#composer");
const input = $("#msg");
const chipsEl = $("#chips"); // optional / future use
const progressBar = $("#model-progress");

// If you use this, make sure setStatus is defined somewhere:
function setStatus(text) {
  if (!progressBar) return;
  progressBar.textContent = text;
}

// ------------------------- Chat message helper -------------------------

const conversationHistory = [];



function addMsg(text, sender = "bot") {
  if (!chat) return;

  // Are we already near the bottom?
  const threshold = 80; // px
  const isNearBottom =
    chat.scrollHeight - chat.scrollTop - chat.clientHeight < threshold;

  const msgEl = document.createElement("div");
  msgEl.className = sender === "user" ? "msg user" : "msg bot";
  msgEl.textContent = text;

  chat.appendChild(msgEl);

  // Only auto-scroll if user hasn't scrolled up
  if (isNearBottom) {
    chat.scrollTo({ top: chat.scrollHeight, behavior: "smooth" });
  }
}


/*-------------------- Ask backend ---------------------------------------*/

const API_BASE =
  window.location.hostname === "localhost"
    ? "http://localhost:8787"
    : "https://kozani-backend.onrender.com";


async function sendToKozaniBackend(userText, retrievedSnippets = []) {
  try {
    const response = await fetch("https://kozani-backend-kfrg.onrender.com/api/kozani-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: userText,
        history: conversationHistory.slice(-10), // 👈 send last 8 turns
        snippets: retrievedSnippets,
        language: "en",
        client: "kozani-web-v3"
      })
    });

    const data = await response.json();
    return data; // { answer, safety, meta }
  } catch (err) {
    console.error("Error talking to Kozani backend:", err);
    return {
      answer: "Sorry, I couldn’t connect to Kozani’s brain. Please check your connection.",
      safety: { ok: false, flags: ["network_error"] },
      meta: { model: "none", mode: "offline-error" }
    };
  }
}


/*/window.addEventListener("DOMContentLoaded", () => {
  if (!chat || chat.children.length > 0) return; // don’t greet twice
  addMsg("Hello! I'm Kozani, your perinatal companion 🤍\n\nHow are you feeling today? Is there anything you'd like to talk about?",
    "bot");
});
*/

// --------------------------- Form submit handler ------------------------
if (form && input) {
  form.addEventListener("submit", async (evt) => {
    evt.preventDefault();

    const text = input.value.trim();
    if (!text) return;

    // Show user's message
    addMsg(text, "user");
    
    // 2️⃣ STORE user message in memory
    conversationHistory.push({
    role: "user",
    content: text
  });


    input.value = "";
    setStatus("Thinking…");

    

    try {
      const res = await sendToKozaniBackend(text);
      addMsg(res.answer, "bot");  // ⬅️ use the answer string
      // 4️⃣ STORE assistant reply in memory
      conversationHistory.push({
      role: "assistant",
      content: res.answer
    });


    } catch (err) {
      console.error(err);
      addMsg("⚠️ Something went wrong talking to the model.", "bot");
    } finally {
      setStatus("");
    }
  });
}


addMsg(
  "Hello, I’m Kozani. I’m here to support the emotional side of pregnancy and early motherhood — including times when you may feel sad, anxious, or overwhelmed. If you’d like, you can tell me a little about yourself, or share what’s been on your mind today.",
  "bot"
);

/*addMsg(
  "Hello, I’m Kozani. I’m here to support the emotional side of pregnancy and early motherhood — including times when you may feel sad, anxious, or overwhelmed. If you’d like, you can tell me a little about yourself, or share what’s been on your mind today.",
  "bot"
);*/


/*Hi, I’m Kozani. I’m here to listen and support you through pregnancy and early motherhood. Would you like to ask me a question or do you just want someone to talk?  If you are not sure what to say maybe you could start by telling me about yourself?*/