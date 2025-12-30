const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("JustForYou backend running");
});

app.post("/api/messages", (req, res) => {
  const { text, emotion } = req.body;

  res.json({
    success: true,
    message: "Message received",
    data: { text, emotion }
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
