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
    comment TEXT,
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
  const { date, startTime, endTime, comment } = req.body;

  // Validate times
  if (startTime >= endTime) {
    return res.status(400).json({ message: "End time must be after start time" });
  }

  db.run(
    "INSERT INTO shifts (date, startTime, endTime, comment) VALUES (?, ?, ?, ?)",
    [date, startTime, endTime, comment],
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

app.put("/api/shifts/:id", (req, res) => {
  const { id } = req.params;
  const { date, startTime, endTime, comment } = req.body;

  // Validate times
  if (startTime >= endTime) {
    return res.status(400).json({ message: "End time must be after start time" });
  }

  db.run(
    "UPDATE shifts SET date = ?, startTime = ?, endTime = ?, comment = ? WHERE id = ?",
    [date, startTime, endTime, comment, id],
    function (err) {
      if (err) {
        return res.status(400).json({ message: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: "Shift not found" });
      }
      res.status(200).json({
        id,
        date,
        startTime,
        endTime,
        comment
      });
    }
  );
});


app.delete("/api/shifts/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM shifts WHERE id = ?", [id], function (err) {
    if (err) {
      res.status(500).json({ message: err.message });
      return;
    }
    if (this.changes === 0) {
      res.status(404).json({ message: "Shift not found" });
      return;
    }
    res.json({ message: "Shift deleted successfully" });
  });
});


// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static("dist"));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "dist", "index.html"));
  });
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
