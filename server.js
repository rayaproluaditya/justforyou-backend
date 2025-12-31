require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const app = express();
app.use(cors());
app.use(express.json());

/* -------------------------
   DATABASE CONNECTION
-------------------------- */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

/* -------------------------
   MODELS
-------------------------- */
const UserSchema = new mongoose.Schema({
  email: String,
  username: String,
  loginToken: String,
  tokenExpiry: Date
});

const MessageSchema = new mongoose.Schema({
  username: String,
  text: String,
  emotion: String,
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);
const Message = mongoose.model("Message", MessageSchema);

/* -------------------------
   AUTH ROUTES
-------------------------- */

// ✅ THIS IS THE CODE YOU ASKED ABOUT
app.get("/api/auth/verify", async (req, res) => {
  const { token } = req.query;

  const user = await User.findOne({
    loginToken: token,
    tokenExpiry: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  // Clear token after login
  user.loginToken = null;
  user.tokenExpiry = null;
  await user.save();

  res.json({
    success: true,
    user: {
      username: user.username,
      email: user.email
    }
  });
});
