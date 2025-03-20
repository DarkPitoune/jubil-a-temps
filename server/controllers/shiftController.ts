import { Response, Request } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../types';
import type { shifts } from '@prisma/client';

export const createShift = async (req: Request & AuthRequest, res: Response): Promise<void> => {
  try {
    const { date, startTime, endTime, comment } = req.body;
    
    if (!req.user?.userId) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const shift = await prisma.shifts.create({
      data: {
        userId: req.user.userId,
        date,
        startTime,
        endTime,
        comment
      }
    });

    res.status(201).json(shift);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Server error' });
  }
};

export const getShifts = async (req: Request & AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const shifts = await prisma.shifts.findMany({
      where: {
        userId: req.user.userId
      },
      orderBy: {
        date: 'desc'
      }
    });

    res.json(shifts);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Server error' });
  }
};

export const updateShift = async (req: Request & AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { date, startTime, endTime, comment } = req.body;

    if (!req.user?.userId) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const shift = await prisma.shifts.findUnique({
      where: { id: parseInt(id) }
    });

    if (!shift) {
      res.status(404).json({ message: "Shift not found" });
      return;
    }

    if (shift.userId !== req.user.userId) {
      res.status(403).json({ message: "Not authorized to update this shift" });
      return;
    }

    const updatedShift = await prisma.shifts.update({
      where: { id: parseInt(id) },
      data: {
        date,
        startTime,
        endTime,
        comment
      }
    });

    res.json(updatedShift);
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Server error' });
  }
};

export const deleteShift = async (req: Request & AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!req.user?.userId) {
      res.status(401).json({ message: "Not authorized" });
      return;
    }

    const shift = await prisma.shifts.findUnique({
      where: { id: parseInt(id) }
    });

    if (!shift) {
      res.status(404).json({ message: "Shift not found" });
      return;
    }

    if (shift.userId !== req.user.userId) {
      res.status(403).json({ message: "Not authorized to delete this shift" });
      return;
    }

    await prisma.shifts.delete({
      where: { id: parseInt(id) }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error instanceof Error ? error.message : 'Server error' });
  }
};