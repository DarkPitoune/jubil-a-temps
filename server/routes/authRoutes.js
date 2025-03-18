const express = require('express');
const router = express.Router();
const { register, login, getUserProfile } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Authentication routes
router.post("/register", register);
router.post("/login", login);
router.get("/profile", authenticateToken, getUserProfile);

module.exports = router;