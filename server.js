require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

// Message Schema
const MessageSchema = new mongoose.Schema({
  text: String,
  emotion: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Message = mongoose.model("Message", MessageSchema);

// Routes
app.get("/", (req, res) => {
  res.send("JustForYou Backend Running");
});

// Save Message
app.post("/api/messages", async (req, res) => {
  try {
    const { text, emotion } = req.body;

    const message = new Message({
      text,
      emotion
    });

    await message.save();

    res.json({ success: true, message: "Saved successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save message" });
  }
});

// Get Messages (for dashboard later)
app.get("/api/messages", async (req, res) => {
  const messages = await Message.find().sort({ createdAt: -1 });
  res.json(messages);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log("Server running on", PORT));
