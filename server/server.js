const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const cron = require('node-cron');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendWeeklyDigest, sendMonthlyDigest } = require('./services/emailService');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key'; // Ideally should be in .env

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

// Create users table with password and role fields
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create shifts table with user relationship
db.run(`
  CREATE TABLE IF NOT EXISTS shifts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    startTime TEXT NOT NULL,
    endTime TEXT NOT NULL,
    comment TEXT,
    userId INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (userId) REFERENCES users(id)
  )
`);

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Authentication Routes
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }
    
    // Check if user already exists
    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      
      if (user) {
        return res.status(400).json({ message: "User already exists" });
      }
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Create new user
      db.run(
        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)",
        [name, email, hashedPassword],
        function(err) {
          if (err) {
            return res.status(500).json({ message: err.message });
          }
          
          // Create JWT token
          const token = jwt.sign(
            { id: this.lastID, email, name },
            JWT_SECRET,
            { expiresIn: '24h' }
          );
          
          res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
              id: this.lastID,
              name,
              email
            }
          });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    
    db.get("SELECT * FROM users WHERE email = ?", [email], async (err, user) => {
      if (err) {
        return res.status(500).json({ message: err.message });
      }
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);
      
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Create JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email, name: user.name, role: user.role },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      res.json({
        message: "Login successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
      });
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Protected route example
app.get("/api/user/profile", authenticateToken, (req, res) => {
  const userId = req.user.id;
  
  db.get("SELECT id, name, email, role, createdAt FROM users WHERE id = ?", [userId], (err, user) => {
    if (err) {
      return res.status(500).json({ message: err.message });
    }
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user);
  });
});

// API Routes for Shifts - Now protected with authentication
app.get("/api/shifts", authenticateToken, (req, res) => {
  console.log(`[${new Date().toISOString()}] GET /api/shifts - Fetching all shifts`);
  
  const userId = req.query.userId;
  let query = "SELECT s.*, u.name as userName FROM shifts s LEFT JOIN users u ON s.userId = u.id";
  let params = [];
  
  if (userId) {
    query += " WHERE s.userId = ?";
    params.push(userId);
  }
  
  query += " ORDER BY date DESC, startTime ASC";
  
  db.all(query, params, (err, shifts) => {
    if (err) {
      console.error(`[${new Date().toISOString()}] GET /api/shifts - Error:`, err.message);
      res.status(500).json({ message: err.message });
      return;
    }
    console.log(`[${new Date().toISOString()}] GET /api/shifts - Success: Retrieved ${shifts.length} shifts`);
    res.json(shifts);
  });
});

app.post("/api/shifts", authenticateToken, (req, res) => {
  const { date, startTime, endTime, comment, userId } = req.body;
  console.log(`[${new Date().toISOString()}] POST /api/shifts - Creating new shift for date: ${date}`);

  // Validate times
  if (startTime >= endTime) {
    console.warn(`[${new Date().toISOString()}] POST /api/shifts - Validation Error: Invalid time range`);
    return res.status(400).json({ message: "End time must be after start time" });
  }

  db.run(
    "INSERT INTO shifts (date, startTime, endTime, comment, userId) VALUES (?, ?, ?, ?, ?)",
    [date, startTime, endTime, comment, userId],
    function(err) {
      if (err) {
        console.error(`[${new Date().toISOString()}] POST /api/shifts - Error:`, err.message);
        res.status(400).json({ message: err.message });
        return;
      }
      console.log(`[${new Date().toISOString()}] POST /api/shifts - Success: Created shift with ID ${this.lastID}`);
      res.status(201).json({
        id: this.lastID,
        date,
        startTime,
        endTime,
        comment,
        userId
      });
    }
  );
});

app.put("/api/shifts/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { date, startTime, endTime, comment, userId } = req.body;
  console.log(`[${new Date().toISOString()}] PUT /api/shifts/${id} - Updating shift`);

  // Validate times
  if (startTime >= endTime) {
    console.warn(`[${new Date().toISOString()}] PUT /api/shifts/${id} - Validation Error: Invalid time range`);
    return res.status(400).json({ message: "End time must be after start time" });
  }

  db.run(
    "UPDATE shifts SET date = ?, startTime = ?, endTime = ?, comment = ?, userId = ? WHERE id = ?",
    [date, startTime, endTime, comment, userId, id],
    function (err) {
      if (err) {
        console.error(`[${new Date().toISOString()}] PUT /api/shifts/${id} - Error:`, err.message);
        return res.status(400).json({ message: err.message });
      }
      if (this.changes === 0) {
        console.warn(`[${new Date().toISOString()}] PUT /api/shifts/${id} - Not Found`);
        return res.status(404).json({ message: "Shift not found" });
      }
      console.log(`[${new Date().toISOString()}] PUT /api/shifts/${id} - Success: Updated shift`);
      res.status(200).json({
        id,
        date,
        startTime,
        endTime,
        comment,
        userId
      });
    }
  );
});

app.delete("/api/shifts/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  console.log(`[${new Date().toISOString()}] DELETE /api/shifts/${id} - Deleting shift`);
  
  db.run("DELETE FROM shifts WHERE id = ?", [id], function (err) {
    if (err) {
      console.error(`[${new Date().toISOString()}] DELETE /api/shifts/${id} - Error:`, err.message);
      res.status(500).json({ message: err.message });
      return;
    }
    if (this.changes === 0) {
      console.warn(`[${new Date().toISOString()}] DELETE /api/shifts/${id} - Not Found`);
      res.status(404).json({ message: "Shift not found" });
      return;
    }
    console.log(`[${new Date().toISOString()}] DELETE /api/shifts/${id} - Success: Deleted shift`);
    res.json({ message: "Shift deleted successfully" });
  });
});

const recipientEmail = process.env.RECIPIENT_EMAIL;
// Schedule weekly digest - Every Monday at 9am
cron.schedule('0 9 * * 1', () => {
  sendWeeklyDigest(db, [recipientEmail])
    .catch(console.error);
});

// Schedule monthly digest - First day of each month at 9am
cron.schedule('0 9 1 * *', () => {
  sendMonthlyDigest(db, [recipientEmail])
    .catch(console.error);
});

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static("dist"));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "dist", "index.html"));
  });
}

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
