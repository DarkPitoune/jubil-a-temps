import { Resend } from 'resend';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';
import { PrismaClient, shifts } from '@prisma/client';

interface FormattedShifts {
  formattedShifts: string;
  totalHours: number;
}

const formatShiftsForEmail = (shifts: shifts[]): FormattedShifts => {
  let totalHours = 0;
  const formattedShifts = shifts.map(shift => {
    const start = new Date(`${shift.date}T${shift.startTime}`);
    const end = new Date(`${shift.date}T${shift.endTime}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    totalHours += hours;
    
    return `${format(new Date(shift.date), 'dd/MM/yyyy')} - ${shift.startTime} to ${shift.endTime} (${hours.toFixed(2)} hours)${shift.comment ? ` - ${shift.comment}` : ''}`;
  }).join('\n');
  
  return { formattedShifts, totalHours };
};

export const sendWeeklyDigest = async (prisma: PrismaClient): Promise<void> => {
  const startDate = format(startOfWeek(new Date()), 'yyyy-MM-dd');
  const endDate = format(endOfWeek(new Date()), 'yyyy-MM-dd');
  
  const users = await prisma.users.findMany();
  
  for (const user of users) {
    const shifts = await prisma.shifts.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'asc' }
    });
    
    if (shifts.length > 0) {
      const { formattedShifts, totalHours } = formatShiftsForEmail(shifts);
      
      await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: process.env.SENDER_EMAIL || '',
        to: process.env.RECIPIENT_EMAIL || '',
        subject: `Weekly Time Report for ${user.name}`,
        text: `Weekly Time Report for ${user.name}\n\nPeriod: ${startDate} to ${endDate}\n\nShifts:\n${formattedShifts}\n\nTotal Hours: ${totalHours.toFixed(2)}`
      });
    }
  }
};

export const sendMonthlyDigest = async (prisma: PrismaClient): Promise<void> => {
  const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');
  
  const users = await prisma.users.findMany();
  
  for (const user of users) {
    const shifts = await prisma.shifts.findMany({
      where: {
        userId: user.id,
        date: {
          gte: startDate,
          lte: endDate
        }
      },
      orderBy: { date: 'asc' }
    });
    
    if (shifts.length > 0) {
      const { formattedShifts, totalHours } = formatShiftsForEmail(shifts);
      
      await new Resend(process.env.RESEND_API_KEY).emails.send({
        from: process.env.SENDER_EMAIL || '',
        to: process.env.RECIPIENT_EMAIL || '',
        subject: `Monthly Time Report for ${user.name}`,
        text: `Monthly Time Report for ${user.name}\n\nPeriod: ${startDate} to ${endDate}\n\nShifts:\n${formattedShifts}\n\nTotal Hours: ${totalHours.toFixed(2)}`
      });
    }
  }
};