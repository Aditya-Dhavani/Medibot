const express = require("express");
const path = require("path");
const cors = require("cors");
const fs = require("fs");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ------------ Load diseases database -------------
const diseasesPath = path.join(__dirname, "data", "diseases.json");
let diseases = [];

try {
  diseases = JSON.parse(fs.readFileSync(diseasesPath, "utf-8"));
} catch (err) {
  console.error("Could not load diseases.json", err);
  diseases = [];
}

// ------------ Simple user database (JSON file) -------------
const usersPath = path.join(__dirname, "data", "users.json");
let users = [];

function loadUsers() {
  try {
    const raw = fs.readFileSync(usersPath, "utf-8");
    users = JSON.parse(raw);
  } catch (err) {
    console.warn("users.json missing or invalid, starting with empty list");
    users = [];
  }
}

function saveUsers() {
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
}

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

loadUsers();

// ------------ Auth routes (signup + login) ------------

// POST /api/signup  { email, username, password }
app.post("/api/signup", (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.json({
      ok: false,
      message: "Please fill email, username and password."
    });
  }

  const emailTrim = String(email).trim().toLowerCase();
  const userTrim = String(username).trim();

  // check existing
  if (users.find((u) => u.username === userTrim)) {
    return res.json({
      ok: false,
      message: "Username already taken. Choose another one."
    });
  }

  if (users.find((u) => u.email === emailTrim)) {
    return res.json({
      ok: false,
      message: "An account with this email already exists."
    });
  }

  const passwordHash = hashPassword(password);

  const newUser = {
    email: emailTrim,
    username: userTrim,
    passwordHash
  };

  users.push(newUser);
  saveUsers();

  return res.json({
    ok: true,
    message: "Signup successful! You can now login."
  });
});

// POST /api/login  { username, password }
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.json({
      ok: false,
      message: "Please enter username and password."
    });
  }

  const userTrim = String(username).trim();
  const passwordHash = hashPassword(password);

  const existing = users.find((u) => u.username === userTrim);

  if (!existing || existing.passwordHash !== passwordHash) {
    return res.json({
      ok: false,
      message: "Invalid username or password."
    });
  }

  return res.json({
    ok: true,
    message: "Login successful.",
    user: {
      username: existing.username,
      email: existing.email
    }
  });
});

// ------------ Symptom checker route ------------

app.post("/api/check-symptoms", (req, res) => {
  const { symptoms } = req.body;

  if (!symptoms) {
    return res.json({ ok: false, message: "Please enter symptoms." });
  }

  const userSymptoms = symptoms.toLowerCase();

  const matches = diseases.filter((d) =>
    d.keywords.some((k) => userSymptoms.includes(k.toLowerCase()))
  );

  return res.json({
    ok: true,
    results: matches,
    message: "General educational information only. Not a real diagnosis."
  });
});

// ------------ Serve frontend ------------

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(PORT, () => {
  console.log(`MediBot running at http://localhost:${PORT}`);
});
