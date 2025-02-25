const sgMail = require('@sendgrid/mail');
const { format } = require('date-fns');
const { fr } = require('date-fns/locale');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const formatTime = (hours) => {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  return `${wholeHours}h ${minutes}m`;
};

const generateWeeklyDigest = async (shifts) => {
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
      <h2>Récapitulatif hebdomadaire</h2>
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

const sendWeeklyDigest = async (db, recipients) => {
  const lastWeek = new Date();
  lastWeek.setDate(lastWeek.getDate() - 7);
  
  const shifts = await new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM shifts WHERE date >= ? ORDER BY date ASC",
      [format(lastWeek, 'yyyy-MM-dd')],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });

  if (shifts.length === 0) return;

  const digest = await generateWeeklyDigest(shifts);

  const senderEmail = process.env.SENDER_EMAIL;
  if (!senderEmail) {
    throw new Error('SENDER_EMAIL environment variable is required');
  }
  
  const msg = {
    to: recipients,
    from: senderEmail,
    subject: `Récapitulatif hebdomadaire - ${digest.totalHours}`,
    html: digest.html,
  };

  await sgMail.send(msg);
};

// Similar implementation for monthly digest
const generateMonthlyDigest = async (shifts) => {
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
      <h2>Récapitulatif mensuel</h2>
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

const sendMonthlyDigest = async (db, recipients) => {
  const lastMonth = new Date();
  lastMonth.setMonth(lastMonth.getMonth() - 1);
  
  const shifts = await new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM shifts WHERE date >= ? ORDER BY date ASC",
      [format(lastMonth, 'yyyy-MM-dd')],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });

  if (shifts.length === 0) return;

  const digest = await generateMonthlyDigest(shifts);
  
  const msg = {
    to: recipients,
    from: 'your-verified-sender@yourdomain.com',
    subject: `Récapitulatif mensuel - ${digest.totalHours}`,
    html: digest.html,
  };

  await sgMail.send(msg);
};

module.exports = {
  sendWeeklyDigest,
  sendMonthlyDigest
};
