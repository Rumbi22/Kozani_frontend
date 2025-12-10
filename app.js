/* ---------------------------------- DOM refs ---------------------------------- */
const $ = (sel) => document.querySelector(sel);
const chat = $("#chat");
const form = $("#composer");
const input = $("#msg");
const chipsEl = $("#chips"); // optional / future use
const progressBar = $("#model-progress");


const loginForm = document.getElementById("login-form");
const loginPage = document.getElementById("login");
const chatApp = document.getElementById("chat-app");


//const BACKEND_BASE = "http://localhost:8787";
const BACKEND_BASE = "https://kozani-backend.onrender.com";


// If you use this, make sure setStatus is defined somewhere:
function setStatus(text) {
  if (!progressBar) return;
  progressBar.textContent = text;
}

// ------------------------- Chat message helper -------------------------
function addMsg(text, sender = "bot") {
  if (!chat) return;

  const msgEl = document.createElement("div");
  msgEl.className = sender === "user" ? "msg user" : "msg bot";
  msgEl.textContent = text;

  chat.appendChild(msgEl);
  chat.scrollTop = chat.scrollHeight;
}

/*-------------------- Login ---------------------------------------------*/

if (loginForm && loginPage && chatApp) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const phone = document.getElementById("user_number").value.trim();
    const password = document.getElementById("user_password").value.trim();
    const name = ""; // later you can add a "name" field if you want

    if (!phone || !password) {
      alert("Please enter both phone and password.");
      return;
    }

    try {
      const resp = await fetch(`${BACKEND_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password, name }),
      });

      const data = await resp.json();

      if (!resp.ok) {
        console.error("Login failed:", data);
        alert(data.error || "Login failed. Please check your details.");
        return;
      }

      console.log("Login success:", data);

      // store the user_id so we can send it with chat messages
      window.currentUserId = data.user_id;


      console.log("Switching UI… loginPage:", loginPage, "chatApp:", chatApp);


      // switch UI: hide login, show chat
      loginPage.style.display = "none";
      chatApp.style.display = "grid"; // matches your .app CSS

    } catch (err) {
      console.error("Login request error:", err);
      alert("Could not reach the server. Is it running?");
    }

    
  });
}


/*-------------------- Ask backend ---------------------------------------*/

const API_BASE ="https://kozani-backend.onrender.com/api/kozani-chat";
//const API_BASE = "http://localhost:8787/api/kozani-chat";


async function sendToKozaniBackend(userText, retrievedSnippets = []) {
  try {
    const body = {
      query: userText,
      snippets: retrievedSnippets,
      language: "en",
      client: "kozani-web-v3",
    };

    // 🔥 Add user_id if logged in
    if (window.currentUserId) {
      body.user_id = window.currentUserId;
    }

    const response = await fetch(API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body)
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


// --------------------------- Form submit handler ------------------------
if (form && input) {

  
  form.addEventListener("submit", async (evt) => {
    evt.preventDefault();

    const text = input.value.trim();
    if (!text) return;

    // Show user's message
    addMsg(text, "user");
    input.value = "";
    setStatus("Thinking…");

    try {
      const res = await sendToKozaniBackend(text);
      addMsg(res.answer, "bot");  // ⬅️ use the answer string
    } catch (err) {
      console.error(err);
      addMsg("⚠️ Something went wrong talking to the model.", "bot");
    } finally {
      setStatus("");
    }
  });
}

