const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { get, run } = require("../db");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    res.status(400).json({ message: "name, email, and password are required" });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ message: "password must be at least 6 characters" });
    return;
  }

  try {
    const existingUser = await get("SELECT * FROM users WHERE email = ?", [
      email.toLowerCase(),
    ]);
    if (existingUser) {
      res.status(409).json({ message: "email already exists" });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await run(
      "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
      [name.trim(), email.toLowerCase(), passwordHash],
    );

    const token = jwt.sign(
      { id: result.lastID, email: email.toLowerCase(), name: name.trim() },
      process.env.JWT_SECRET || "super-secret-key",
      { expiresIn: "1d" },
    );

    res.status(201).json({
      user: { id: result.lastID, name: name.trim(), email: email.toLowerCase() },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "registration failed", error: error.message });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "email and password are required" });
    return;
  }

  try {
    const user = await get("SELECT * FROM users WHERE email = ?", [
      email.toLowerCase(),
    ]);
    if (!user) {
      res.status(401).json({ message: "invalid credentials" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      res.status(401).json({ message: "invalid credentials" });
      return;
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || "super-secret-key",
      { expiresIn: "1d" },
    );

    res.json({
      user: { id: user.id, name: user.name, email: user.email },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "login failed", error: error.message });
  }
});

router.post("/logout", (_req, res) => {
  res.json({ message: "logout successful (handled client-side for JWT)" });
});

module.exports = router;
