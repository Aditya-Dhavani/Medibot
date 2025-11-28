console.log("MediBot JS loaded");

// ====== THEME TOGGLE (DARK / LIGHT) ======
const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
  if (theme === "light") {
    document.body.classList.add("light-mode");
    themeToggle.textContent = "☀️";
  } else {
    document.body.classList.remove("light-mode");
    themeToggle.textContent = "🌙";
  }
  localStorage.setItem("medibotTheme", theme);
}

const savedTheme = localStorage.getItem("medibotTheme") || "dark";
applyTheme(savedTheme);

themeToggle.addEventListener("click", () => {
  const current = document.body.classList.contains("light-mode")
    ? "light"
    : "dark";
  const next = current === "light" ? "dark" : "light";
  applyTheme(next);
});

// ====== AUTH (SIGNUP + LOGIN) ======
const loginPage = document.getElementById("login-page");
const appPage = document.getElementById("app-page");

const tabLogin = document.getElementById("tab-login");
const tabSignup = document.getElementById("tab-signup");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");

// login form elements
const loginUsername = document.getElementById("login-username");
const loginPassword = document.getElementById("login-password");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("login-error");

// signup form elements
const signupEmail = document.getElementById("signup-email");
const signupUsername = document.getElementById("signup-username");
const signupPassword = document.getElementById("signup-password");
const signupBtn = document.getElementById("signupBtn");
const signupError = document.getElementById("signup-error");
const signupSuccess = document.getElementById("signup-success");

// app elements
const welcomeText = document.getElementById("welcome-text");
const logoutBtn = document.getElementById("logoutBtn");

// switch tabs
function showLoginTab() {
  tabLogin.classList.add("active");
  tabSignup.classList.remove("active");
  loginForm.classList.remove("hidden");
  signupForm.classList.add("hidden");
  loginError.textContent = "";
}

function showSignupTab() {
  tabSignup.classList.add("active");
  tabLogin.classList.remove("active");
  signupForm.classList.remove("hidden");
  loginForm.classList.add("hidden");
  signupError.textContent = "";
  signupSuccess.textContent = "";
}

tabLogin.addEventListener("click", showLoginTab);
tabSignup.addEventListener("click", showSignupTab);

// show app after successful login
function showApp(user) {
  loginPage.classList.add("hidden");
  appPage.classList.remove("hidden");
  if (user && user.username) {
    welcomeText.textContent = `Logged in as ${user.username}`;
  } else {
    welcomeText.textContent = "";
  }
}

// logout
logoutBtn.addEventListener("click", () => {
  appPage.classList.add("hidden");
  loginPage.classList.remove("hidden");
  showLoginTab();
  loginUsername.value = "";
  loginPassword.value = "";
});

// handle signup
signupBtn.addEventListener("click", async () => {
  signupError.textContent = "";
  signupSuccess.textContent = "";

  const email = signupEmail.value.trim();
  const username = signupUsername.value.trim();
  const password = signupPassword.value.trim();

  if (!email || !username || !password) {
    signupError.textContent = "Please fill email, username and password.";
    return;
  }

  try {
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password })
    });
    const data = await res.json();

    if (!data.ok) {
      signupError.textContent = data.message || "Signup failed.";
      return;
    }

    signupSuccess.textContent = data.message || "Signup successful.";
    signupPassword.value = "";
    showLoginTab();
    loginUsername.value = username;
  } catch (err) {
    console.error(err);
    signupError.textContent = "Could not connect to server.";
  }
});

// handle login
async function handleLogin() {
  loginError.textContent = "";

  const username = loginUsername.value.trim();
  const password = loginPassword.value.trim();

  if (!username || !password) {
    loginError.textContent = "Please enter username and password.";
    return;
  }

  try {
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();

    if (!data.ok) {
      loginError.textContent = data.message || "Login failed.";
      return;
    }

    showApp(data.user);
  } catch (err) {
    console.error(err);
    loginError.textContent = "Could not connect to server.";
  }
}

loginBtn.addEventListener("click", handleLogin);

loginPassword.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    handleLogin();
  }
});

// ====== MAIN MEDIBOT LOGIC ======
const symptomsInput = document.getElementById("symptoms");
const checkBtn = document.getElementById("checkBtn");
const clearBtn = document.getElementById("clearBtn");
const resultsContainer = document.getElementById("results");

function renderEmptyState() {
  resultsContainer.innerHTML =
    '<p class="empty-text">Your results will appear here after you ask MediBot.</p>';
}

renderEmptyState();

async function askMediBot() {
  const symptoms = symptomsInput.value.trim();

  if (!symptoms) {
    resultsContainer.innerHTML =
      '<p class="empty-text">Please type some symptoms first.</p>';
    return;
  }

  resultsContainer.innerHTML = `
    <div class="loading">
      <div class="spinner"></div>
      <p>MediBot is thinking...</p>
    </div>
  `;

  checkBtn.disabled = true;
  checkBtn.textContent = "Thinking...";
  clearBtn.disabled = true;

  try {
    const res = await fetch("/api/check-symptoms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symptoms })
    });

    const data = await res.json();
    resultsContainer.innerHTML = "";

    if (!data.ok || !data.results || data.results.length === 0) {
      resultsContainer.innerHTML =
        '<p class="empty-text">No clear match found in this demo database. Try different words and always consult a doctor.</p>';
      return;
    }

    data.results.forEach((d) => {
      resultsContainer.innerHTML += `
        <div class="result-box">
          <h3>${d.name}</h3>
          <p>${d.description}</p>
          <p><strong>Medication (general info only):</strong> ${d.medication}</p>
          <p><strong>Self-care tips:</strong> ${d.care}</p>
        </div>
      `;
    });
  } catch (err) {
    console.error(err);
    resultsContainer.innerHTML =
      '<p class="empty-text">Something went wrong while contacting the backend.</p>';
  } finally {
    checkBtn.disabled = false;
    checkBtn.textContent = "Ask MediBot";
    clearBtn.disabled = false;
  }
}

checkBtn.addEventListener("click", askMediBot);

clearBtn.addEventListener("click", () => {
  symptomsInput.value = "";
  renderEmptyState();
});
