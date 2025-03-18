const { db } = require('../config/database');

// Get all shifts, with optional userId filter
const getAllShifts = (req, res) => {
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
};

// Create a new shift
const createShift = (req, res) => {
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
};

// Update an existing shift
const updateShift = (req, res) => {
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
};

// Delete a shift
const deleteShift = (req, res) => {
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
};

module.exports = {
  getAllShifts,
  createShift,
  updateShift,
  deleteShift
};