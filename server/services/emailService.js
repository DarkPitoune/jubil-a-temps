const { format } = require('date-fns');
const { Resend } = require('resend');
const { fr } = require('date-fns/locale');

const RESEND_API_KEY = process.env.RESEND_API_KEY

const resend = new Resend(RESEND_API_KEY)

const formatTime = (hours) => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}h ${minutes}m`;
};

const generateWeeklyDigest = async (shifts, userName) => {
  let totalHours = 0;
  const shiftsList = shifts.map(shift => {
    const start = new Date(`${shift.date}T${shift.startTime}`);
    const end = new Date(`${shift.date}T${shift.endTime}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    totalHours += hours;

    return `
      <tr>
        <td>${format(new Date(shift.date), 'dd MMMM', { locale: fr })}</td>
        <td>${shift.startTime} - ${shift.endTime}</td>
        <td>${formatTime(hours)}</td>
        <td>${shift.comment || '-'}</td>
      </tr>
    `;
  }).join('');

  return {
    totalHours: formatTime(totalHours),
    html: `
      <h2>Récapitulatif hebdomadaire de Jubil-à-Temps</h2>
      <p>Bonjour ${userName},</p>
      <p>Voici le total horaire pour la semaine dernière</p>
      <p>Total: ${formatTime(totalHours)}</p>
      <table border="1" cellpadding="5" style="border-collapse: collapse;">
        <tr>
          <th>Date</th>
          <th>Horaires</th>
          <th>Durée</th>
          <th>Commentaire</th>
        </tr>
        ${shiftsList}
      </table>
    `
  };
};

const sendWeeklyDigest = async (db) => {
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  const lastWeekFormatted = format(lastWeek, 'yyyy-MM-dd');
  
  // Get all active users
  const users = await new Promise((resolve, reject) => {
    db.all("SELECT id, name, email FROM users", [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  const senderEmail = process.env.SENDER_EMAIL

  if (!senderEmail) {
    console.error('SENDER_EMAIL is not set in environment variables');
    return;
  }
  
  // For each user, send their personalized digest
  for (const user of users) {
    // Get shifts for this specific user
    const shifts = await new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM shifts WHERE userId = ? AND date >= ? ORDER BY date ASC",
        [user.id, lastWeekFormatted],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    // Skip if no shifts for this user
    if (shifts.length === 0) continue;
    
    try {
      const digest = await generateWeeklyDigest(shifts, user.name);
      
      const msg = {
        to: user.email,
        from: senderEmail,
        subject: `Récapitulatif hebdomadaire - ${digest.totalHours}`,
        html: digest.html,
      };
      
      await resend.emails.send(msg);
      console.log(`Weekly digest sent to ${user.email}`);
    } catch (error) {
      console.error(`Error sending weekly digest to ${user.email}:`, error);
    }
  }
};

// Similar implementation for monthly digest
const generateMonthlyDigest = async (shifts, userName) => {
  let totalHours = 0;
  const shiftsList = shifts.map(shift => {
    const start = new Date(`${shift.date}T${shift.startTime}`);
    const end = new Date(`${shift.date}T${shift.endTime}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    totalHours += hours;

    return `
      <tr>
        <td>${format(new Date(shift.date), 'dd MMMM', { locale: fr })}</td>
        <td>${shift.startTime} - ${shift.endTime}</td>
        <td>${formatTime(hours)}</td>
        <td>${shift.comment || '-'}</td>
      </tr>
    `;
  }).join('');

  return {
    totalHours: formatTime(totalHours),
    html: `
      <h2>Récapitulatif mensuel de Jubil-à-Temps</h2>
      <p>Bonjour ${userName},</p>
      <p>Voici le total horaire pour le mois dernier</p>
      <p>Total: ${formatTime(totalHours)}</p>
      <table border="1" cellpadding="5" style="border-collapse: collapse;">
        <tr>
          <th>Date</th>
          <th>Horaires</th>
          <th>Durée</th>
          <th>Commentaire</th>
        </tr>
        ${shiftsList}
      </table>
    `
  };
};

const sendMonthlyDigest = async (db) => {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  const lastMonthFormatted = format(lastMonth, 'yyyy-MM-dd');
  
  // Get all active users
  const users = await new Promise((resolve, reject) => {
    db.all("SELECT id, name, email FROM users", [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

  const senderEmail = process.env.SENDER_EMAIL || 'noreply@jubilatemps.com';
  
  // For each user, send their personalized digest
  for (const user of users) {
    // Get shifts for this specific user
    const shifts = await new Promise((resolve, reject) => {
      db.all(
        "SELECT * FROM shifts WHERE userId = ? AND date >= ? ORDER BY date ASC",
        [user.id, lastMonthFormatted],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
    
    // Skip if no shifts for this user
    if (shifts.length === 0) continue;
    
    try {
      const digest = await generateMonthlyDigest(shifts, user.name);
      
      const msg = {
        to: user.email,
        from: senderEmail,
        subject: `Récapitulatif mensuel - ${digest.totalHours}`,
        html: digest.html,
      };
      
      await resend.emails.send(msg);
      console.log(`Monthly digest sent to ${user.email}`);
    } catch (error) {
      console.error(`Error sending monthly digest to ${user.email}:`, error);
    }
  }
};

module.exports = {
  sendWeeklyDigest,
  sendMonthlyDigest
};
