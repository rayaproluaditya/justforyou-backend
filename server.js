require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

/* ============================
   DATABASE CONNECTION
============================ */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

/* ============================
   SCHEMAS
============================ */
const MessageSchema = new mongoose.Schema({
  username: { type: String, required: true },
  text: { type: String, required: true },
  emotion: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true },
  loginToken: String,
  tokenExpiry: Date
});

const Message = mongoose.model("Message", MessageSchema);
const User = mongoose.model("User", UserSchema);

/* ============================
   BASIC ROUTE
============================ */
app.get("/", (req, res) => {
  res.send("✅ JustForYou Backend Running");
});

/* ============================
   MESSAGE ROUTES
============================ */

// Save message
app.post("/api/messages", async (req, res) => {
  try {
    const { text, emotion, username } = req.body;

    if (!text || !emotion || !username) {
      return res.status(400).json({ error: "Missing fields" });
    }

    await Message.create({ text, emotion, username });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Get all messages (Dashboard)
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Get messages by username
app.get("/api/messages/:username", async (req, res) => {
  try {
    const messages = await Message.find({
      username: req.params.username
    }).sort({ createdAt: -1 });

    res.json(messages);
  } catch {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

/* ============================
   MAGIC LINK AUTH
============================ */

// Send login link
app.post("/api/auth/request-login", async (req, res) => {
  const { email, username } = req.body;

  if (!email || !username) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const token = crypto.randomBytes(32).toString("hex");

  await User.findOneAndUpdate(
    { email },
    {
      email,
      username,
      loginToken: token,
      tokenExpiry: Date.now() + 15 * 60 * 1000
    },
    { upsert: true }
  );

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  const loginLink = `${process.env.FRONTEND_URL}/login?token=${token}`;

  await transporter.sendMail({
    from: "JustForYou <no-reply@justforyou.com>",
    to: email,
    subject: "Your Login Link",
    html: `
      <h2>Login to JustForYou</h2>
      <p>Click the link below:</p>
      <a href="${loginLink}">${loginLink}</a>
      <p>This link expires in 15 minutes.</p>
    `
  });

  res.json({ success: true });
});

// Verify token
app.get("/api/auth/verify", async (req, res) => {
  const { token } = req.query;

  const user = await User.findOne({
    loginToken: token,
    tokenExpiry: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  res.json({
    success: true,
    username: user.username,
    email: user.email
  });
});

/* ============================
   SERVER START
============================ */
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
