import express, { Express } from 'express';
import bodyParser from 'body-parser';
import path from 'path';
import cors from 'cors';
import cron from 'node-cron';

// Import modules
import { prisma } from './lib/prisma';
import { sendWeeklyDigest, sendMonthlyDigest } from './services/emailService';
import authRoutes from './routes/authRoutes';
import shiftRoutes from './routes/shiftRoutes';
import logger from './utils/logger';

// Initialize Express app
const app: Express = express();
const PORT: number = parseInt(process.env.PORT || '5000', 10);

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/shifts', shiftRoutes);

// Schedule weekly digest - Every Monday at 9am
cron.schedule('0 9 * * 1', () => {
  logger.info('Running weekly digest email task...');
  sendWeeklyDigest(prisma)
    .then(() => logger.info('Weekly digest emails sent successfully'))
    .catch(error => logger.error('Error sending weekly digest emails:', error));
});

// Schedule monthly digest - First day of each month at 9am
cron.schedule('0 9 1 * *', () => {
  logger.info('Running monthly digest email task...');
  sendMonthlyDigest(prisma)
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

export default app;