const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cors = require("cors");
const cron = require('node-cron');

// Import modules
const { db, initDb } = require('./config/database');
const { sendWeeklyDigest, sendMonthlyDigest } = require('./services/emailService');
const authRoutes = require('./routes/authRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const logger = require('./utils/logger');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database
initDb();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shifts', shiftRoutes);

// Schedule weekly digest - Every Monday at 9am
cron.schedule('0 9 * * 1', () => {
  logger.info('Running weekly digest email task...');
  sendWeeklyDigest(db)
    .then(() => logger.info('Weekly digest emails sent successfully'))
    .catch(error => logger.error('Error sending weekly digest emails:', error));
});

// Schedule monthly digest - First day of each month at 9am
cron.schedule('0 9 1 * *', () => {
  logger.info('Running monthly digest email task...');
  sendMonthlyDigest(db)
    .then(() => logger.info('Monthly digest emails sent successfully'))
    .catch(error => logger.error('Error sending monthly digest emails:', error));
});

// Serve static assets in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static("dist"));

  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "dist", "index.html"));
  });
}

// Start the server
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));

// Export for testing purposes
module.exports = app;
