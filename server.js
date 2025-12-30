require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --------------------
// MongoDB Connection
// --------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err));

// --------------------
// Schema
// --------------------
const MessageSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  emotion: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Message = mongoose.model("Message", MessageSchema);

// --------------------
// Routes
// --------------------

// Health check
app.get("/", (req, res) => {
  res.send("✅ JustForYou Backend Running");
});

// Save message
app.post("/api/messages", async (req, res) => {
  try {
    const { text, emotion, username } = req.body;

    if (!text || !emotion || !username) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const newMessage = new Message({
      text,
      emotion,
      username
    });

    await newMessage.save();

    res.json({ success: true, message: "Message saved" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all messages (Dashboard)
app.get("/api/messages", async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

// Get messages by username (Public Profile)
app.get("/api/messages/:username", async (req, res) => {
  try {
    const { username } = req.params;

    const messages = await Message.find({ username }).sort({
      createdAt: -1
    });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user messages" });
  }
});

// --------------------
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
