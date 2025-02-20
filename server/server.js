const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Connect to SQLite database
const db = new sqlite3.Database("timetracker.db", (err) => {
  if (err) {
    console.error("SQLite connection error:", err);
  } else {
    console.log("Connected to SQLite database");
  }
});

// Create shifts table
db.run(`
  CREATE TABLE IF NOT EXISTS shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// API Routes
app.get("/api/shifts", (req, res) => {
  db.all("SELECT * FROM shifts ORDER BY date DESC, startTime ASC", [], (err, shifts) => {
    if (err) {
      res.status(500).json({ message: err.message });
      return;
    }
    res.json(shifts);
  });
});

app.post("/api/shifts", (req, res) => {
  const { date, startTime, endTime } = req.body;

  // Validate times
  if (startTime >= endTime) {
    return res.status(400).json({ message: "End time must be after start time" });
  }

  db.run(
    "INSERT INTO shifts (date, startTime, endTime) VALUES (?, ?, ?)",
    [date, startTime, endTime],
    function(err) {
      if (err) {
        res.status(400).json({ message: err.message });
        return;
      }
      res.status(201).json({
        id: this.lastID,
        date,
        startTime,
        endTime
      });
    }
  );
});

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static("client/dist"));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "dist", "index.html"));
  });
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
