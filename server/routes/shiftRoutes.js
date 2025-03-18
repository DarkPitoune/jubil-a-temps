const express = require('express');
const router = express.Router();
const { getAllShifts, createShift, updateShift, deleteShift } = require('../controllers/shiftController');
const { authenticateToken } = require('../middleware/auth');

// All shifts routes are protected with authentication
router.use(authenticateToken);

// Shifts routes
router.get("/", getAllShifts);
router.post("/", createShift);
router.put("/:id", updateShift);
router.delete("/:id", deleteShift);

module.exports = router;